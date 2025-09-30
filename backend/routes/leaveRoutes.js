const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

// -------------------- MULTER CONFIG -------------------- //
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("File type not supported"), false);
    }
    cb(null, true);
  },
});

// -------------------- MIDDLEWARE -------------------- //
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token required" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err)
      return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

const isAdminOrManager = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res
      .status(403)
      .json({ message: "Admin or manager access required" });
  }
  next();
};

// Helper function to get leave balance
const getLeaveBalance = (leaveBalances, leaveType) => {
  if (!leaveBalances) return 0;
  return leaveBalances[leaveType] || 0;
};

// Helper: Cleanup orphaned files (files not linked to any leave)
const cleanupOrphanedFiles = async () => {
  try {
    // Find all files that are not associated with any leave
    const orphanedFiles = await prisma.file.findMany({
      where: { leaveId: null },
    });

    for (const file of orphanedFiles) {
      const filePath = path.join(__dirname, "..", file.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted orphaned file: ${file.name}`);
      }
      // Delete from database
      await prisma.file.delete({ where: { id: file.id } });
    }

    return orphanedFiles.length;
  } catch (error) {
    console.error("Error cleaning up orphaned files:", error);
    throw error;
  }
};

// Schedule cleanup every hour (optional, you can trigger manually too)
setInterval(async () => {
  try {
    const count = await cleanupOrphanedFiles();
    if (count > 0) {
      console.log(`Cleaned up ${count} orphaned files.`);
    }
  } catch (error) {
    console.error("Scheduled cleanup failed:", error);
  }
}, 60 * 60 * 1000); // Every hour

// -------------------- ROUTES -------------------- //

// Upload files (temporary - not linked to leave yet)
router.post(
  "/upload",
  authenticateToken,
  upload.array("files", 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadedFiles = await Promise.all(
        req.files.map((file) =>
          prisma.file.create({
            data: {
              name: file.originalname,
              url: `/uploads/${file.filename}`,
              size: file.size,
              type: file.mimetype,
              // leaveId is null by default - will be linked when leave is created/updated
            },
          })
        )
      );

      res.status(201).json(uploadedFiles);
    } catch (error) {
      console.error("Error uploading files:", error);
      if (error.message && error.message.includes("File type not supported")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Remove a single uploaded file
router.delete("/file/:fileId", authenticateToken, async (req, res) => {
  try {
    const fileId = parseInt(req.params.fileId);
    if (isNaN(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    // Find the file
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Instead of blocking deletion, we proceed to delete it regardless of leaveId.
    // First, detach it from any leave it might be attached to.
    await prisma.file.update({
      where: { id: fileId },
      data: { leaveId: null }, // Detach from leave
    });

    // Delete file from filesystem
    const filePath = path.join(__dirname, "..", file.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId },
    });

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create leave
router.post(
  "/",
  authenticateToken,
  [
    body("leaveType").trim().notEmpty().withMessage("Leave type is required"),
    body("startDate")
      .isISO8601()
      .toDate()
      .custom((value, { req }) => {
        if (new Date(value) < new Date()) {
          throw new Error("Start date cannot be in the past");
        }
        return true;
      }),
    body("endDate")
      .isISO8601()
      .toDate()
      .custom((value, { req }) => {
        const startDate = req.body.startDate
          ? new Date(req.body.startDate)
          : null;
        if (startDate && new Date(value) < startDate) {
          throw new Error("End date cannot be before start date");
        }
        return true;
      }),
    body("reason").trim().notEmpty().withMessage("Reason is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        leaveType,
        startDate,
        endDate,
        reason,
        emergencyContact,
        emergencyPhone,
        fileIds,
      } = req.body;

      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      // Fetch the user to get leaveBalances
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check leave balance for the specific leave type
      const available = getLeaveBalance(user.leaveBalances, leaveType);
      if (available < days) {
        return res.status(400).json({
          message: `Insufficient ${leaveType} balance. You have ${available} day(s) remaining.`,
        });
      }

      // Check for overlapping leaves
      const overlappingLeave = await prisma.leave.findFirst({
        where: {
          userId: req.user.userId,
          AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
          status: { not: "rejected" }, // ignore rejected leaves
        },
      });

      if (overlappingLeave) {
        return res.status(400).json({
          message: `You already have a leave request overlapping this period (${
            overlappingLeave.startDate.toISOString().split("T")[0]
          } to ${overlappingLeave.endDate.toISOString().split("T")[0]}).`,
        });
      }

      // Validate file IDs if provided
      if (fileIds && fileIds.length > 0) {
        const files = await prisma.file.findMany({
          where: {
            id: { in: fileIds },
            leaveId: null, // Only allow files not already attached to a leave
          },
        });

        if (files.length !== fileIds.length) {
          return res.status(400).json({
            message:
              "One or more files are invalid or already attached to another leave",
          });
        }
      }

      // Create leave
      const newLeave = await prisma.leave.create({
        data: {
          leaveType,
          startDate: start,
          endDate: end,
          days,
          reason,
          emergencyContact,
          emergencyPhone,
          userId: req.user.userId,
          attachments:
            fileIds?.length > 0
              ? { connect: fileIds.map((id) => ({ id })) }
              : undefined,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          attachments: true,
        },
      });

      res.status(201).json(newLeave);
    } catch (error) {
      console.error("Error creating leave:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get all leaves (admin/manager) - FIXED: Include actionedByUser
router.get("/", authenticateToken, isAdminOrManager, async (req, res) => {
  try {
    const { status, userId, leaveType } = req.query;
    const whereClause = {};
    if (status) whereClause.status = status;
    if (userId) whereClause.userId = parseInt(userId);
    if (leaveType) whereClause.leaveType = leaveType;

    const leaves = await prisma.leave.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            position: true,
            avatar: true,
          },
        },
        actionedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            position: true,
            department: true,
          },
        },
        attachments: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    res.json(leaves);
  } catch (error) {
    console.error("Error fetching leaves:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get my leaves - FIXED: Include actionedByUser
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause = { userId: req.user.userId };
    if (status) whereClause.status = status;

    const leaves = await prisma.leave.findMany({
      where: whereClause,
      include: {
        attachments: true,
        actionedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            position: true,
            department: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    res.json(leaves);
  } catch (error) {
    console.error("Error fetching my leaves:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get leave by ID - FIXED: Include actionedByUser
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const leaveId = parseInt(req.params.id);
    if (isNaN(leaveId)) {
      return res.status(400).json({ message: "Invalid leave ID" });
    }

    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        actionedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            position: true,
            department: true,
          },
        },
        attachments: true,
      },
    });

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    // User can only view their own leave unless admin/manager
    if (
      leave.userId !== req.user.userId &&
      req.user.role !== "admin" &&
      req.user.role !== "manager"
    ) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.json(leave);
  } catch (error) {
    console.error("Error fetching leave:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update leave - FIXED: Include actionedByUser in response
router.put(
  "/:id",
  authenticateToken,
  [
    body("leaveType")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Leave type cannot be empty"),
    body("startDate").optional().isISO8601().toDate(),
    body("endDate").optional().isISO8601().toDate(),
    body("reason")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Reason cannot be empty"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const leaveId = parseInt(req.params.id);
      if (isNaN(leaveId)) {
        return res.status(400).json({ message: "Invalid leave ID" });
      }

      const leave = await prisma.leave.findUnique({
        where: { id: leaveId },
        include: { attachments: true },
      });

      if (!leave) {
        return res.status(404).json({ message: "Leave not found" });
      }

      // Check permissions
      if (leave.userId !== req.user.userId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      // Only allow updates on pending leaves
      if (leave.status !== "pending") {
        return res
          .status(400)
          .json({ message: "Cannot update approved/rejected leave" });
      }

      const {
        leaveType,
        startDate,
        endDate,
        reason,
        emergencyContact,
        emergencyPhone,
        fileIds, // Array of file IDs to attach
        removeFileIds, // Array of file IDs to detach
      } = req.body;

      // Calculate days if dates changed
      let days = leave.days;
      if (startDate || endDate) {
        const newStart = startDate ? new Date(startDate) : leave.startDate;
        const newEnd = endDate ? new Date(endDate) : leave.endDate;
        days = Math.ceil((newEnd - newStart) / (1000 * 60 * 60 * 24)) + 1;

        // Validate dates
        if (newStart < new Date()) {
          return res
            .status(400)
            .json({ message: "Start date cannot be in the past" });
        }
        if (newEnd < newStart) {
          return res
            .status(400)
            .json({ message: "End date cannot be before start date" });
        }

        // Check for overlapping leaves (excluding current leave)
        const overlappingLeave = await prisma.leave.findFirst({
          where: {
            userId: req.user.userId,
            id: { not: leaveId }, // exclude current leave
            AND: [
              { startDate: { lte: newEnd } },
              { endDate: { gte: newStart } },
            ],
            status: { not: "rejected" },
          },
        });

        if (overlappingLeave) {
          return res.status(400).json({
            message: `Leave overlaps with existing request (${
              overlappingLeave.startDate.toISOString().split("T")[0]
            } to ${overlappingLeave.endDate.toISOString().split("T")[0]}).`,
          });
        }
      }

      // Handle file attachments
      const updateData = {
        leaveType: leaveType || leave.leaveType,
        startDate: startDate ? new Date(startDate) : leave.startDate,
        endDate: endDate ? new Date(endDate) : leave.endDate,
        days,
        reason: reason || leave.reason,
        emergencyContact:
          emergencyContact !== undefined
            ? emergencyContact
            : leave.emergencyContact,
        emergencyPhone:
          emergencyPhone !== undefined ? emergencyPhone : leave.emergencyPhone,
      };

      // Process file attachments
      if (fileIds && fileIds.length > 0) {
        // Validate files exist and are not attached to other leaves (except this one)
        const filesToAttach = await prisma.file.findMany({
          where: {
            id: { in: fileIds },
            OR: [
              { leaveId: null },
              { leaveId: leaveId }, // Allow re-attaching files already on this leave
            ],
          },
        });

        if (filesToAttach.length !== fileIds.length) {
          return res.status(400).json({
            message:
              "One or more files are invalid or attached to another leave",
          });
        }
      }

      // Start transaction to ensure data consistency
      const updatedLeave = await prisma.$transaction(async (tx) => {
        // First, detach files if requested
        if (removeFileIds && removeFileIds.length > 0) {
          await tx.file.updateMany({
            where: {
              id: { in: removeFileIds },
            },
            data: {
              leaveId: null,
            },
          });
        }

        // Then attach new files
        if (fileIds && fileIds.length > 0) {
          await tx.file.updateMany({
            where: {
              id: { in: fileIds },
              OR: [{ leaveId: null }, { leaveId: leaveId }],
            },
            data: {
              leaveId: leaveId,
            },
          });
        }

        // Finally, update the leave
        return tx.leave.update({
          where: { id: leaveId },
          data: updateData,
          include: {
            user: { select: { id: true, name: true, email: true } },
            actionedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                position: true,
                department: true,
              },
            },
            attachments: true,
          },
        });
      });

      res.json(updatedLeave);
    } catch (error) {
      console.error("Error updating leave:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);
// Approve leave and deduct leave days from specific leave type
router.put(
  "/:id/approve",
  authenticateToken,
  isAdminOrManager,
  async (req, res) => {
    try {
      const leaveId = parseInt(req.params.id);
      if (isNaN(leaveId)) {
        return res.status(400).json({ message: "Invalid leave ID" });
      }

      // Fetch leave with user info
      const leave = await prisma.leave.findUnique({
        where: { id: leaveId },
        include: { user: true, attachments: true },
      });

      if (!leave) {
        return res.status(404).json({ message: "Leave not found" });
      }

      if (leave.status !== "pending") {
        return res
          .status(400)
          .json({ message: "Only pending leaves can be approved" });
      }

      // Check if user has enough leave balance for the specific leave type
      const currentBalance = getLeaveBalance(
        leave.user.leaveBalances,
        leave.leaveType
      );

      if (leave.leaveType !== "UnpaidLeave" && currentBalance < leave.days) {
        return res.status(400).json({
          message: `User does not have enough ${leave.leaveType} balance. Available: ${currentBalance}, Requested: ${leave.days}`,
        });
      }

      // Deduct leave days for non-unpaid leave AND UNPAID LEAVES

      const updatedLeaveBalances = {
        ...leave.user.leaveBalances,
        [leave.leaveType]: currentBalance - leave.days,
      };

      await prisma.user.update({
        where: { id: leave.userId },
        data: { leaveBalances: updatedLeaveBalances },
      });

      // Update leave status to approved
      const updatedLeave = await prisma.leave.update({
        where: { id: leaveId },
        data: {
          status: "approved",
          rejectionReason: null,
          actionedBy: req.user.userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              leaveBalances: true,
              avatar: true,
              position: true,
              department: true,
            },
          },
          actionedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              position: true,
              department: true,
            },
          },
          attachments: true,
        },
      });

      res.json({
        message:
          leave.leaveType === "UnpaidLeave"
            ? "Unpaid leave approved successfully"
            : `Leave approved and ${leave.days} days deducted from ${leave.leaveType} balance`,
        leave: updatedLeave,
      });
    } catch (error) {
      console.error("Error approving leave:", error);
      if (error.code) {
        console.error("Prisma error code:", error.code);
        console.error("Prisma error meta:", error.meta);
      }
      res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Reject leave - FIXED: Include actionedByUser and set actionedBy
router.put(
  "/:id/reject",
  authenticateToken,
  isAdminOrManager,
  async (req, res) => {
    try {
      const leaveId = parseInt(req.params.id);
      if (isNaN(leaveId)) {
        return res.status(400).json({ message: "Invalid leave ID" });
      }

      const { rejectionReason } = req.body;
      if (!rejectionReason || rejectionReason.trim().length === 0) {
        return res
          .status(400)
          .json({ message: "Rejection reason is required" });
      }

      const leave = await prisma.leave.update({
        where: { id: leaveId },
        data: {
          status: "rejected",
          rejectionReason: rejectionReason.trim(),
          actionedBy: req.user.userId, // Set the current user as the rejecter
        },
        include: {
          user: { select: { email: true, name: true } },
          actionedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              position: true,
              department: true,
            },
          },
          attachments: true,
        },
      });

      res.json(leave);
    } catch (error) {
      console.error("Error rejecting leave:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Cancel leave - FIXED: Include actionedByUser
router.put("/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const leaveId = parseInt(req.params.id);
    if (isNaN(leaveId)) {
      return res.status(400).json({ message: "Invalid leave ID" });
    }

    const leave = await prisma.leave.findUnique({ where: { id: leaveId } });
    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.userId !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    if (leave.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending leaves can be cancelled" });
    }

    const cancelledLeave = await prisma.leave.update({
      where: { id: leaveId },
      data: { status: "cancelled" },
      include: {
        attachments: true,
        actionedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            position: true,
            department: true,
          },
        },
      },
    });

    res.json(cancelledLeave);
  } catch (error) {
    console.error("Error cancelling leave:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete leave (admin/manager only) - FIXED: Include actionedByUser
router.delete("/:id", authenticateToken, isAdminOrManager, async (req, res) => {
  try {
    const leaveId = parseInt(req.params.id);
    if (isNaN(leaveId)) {
      return res.status(400).json({ message: "Invalid leave ID" });
    }

    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
      include: {
        attachments: true,
        actionedByUser: true,
      },
    });

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    // If leave was approved, restore leave balance
    if (leave.status === "approved") {
      const user = await prisma.user.findUnique({
        where: { id: leave.userId },
      });

      if (user) {
        const currentBalance = getLeaveBalance(
          user.leaveBalances,
          leave.leaveType
        );

        const updatedLeaveBalances = {
          ...user.leaveBalances,
          [leave.leaveType]: currentBalance + leave.days,
        };

        await prisma.user.update({
          where: { id: leave.userId },
          data: { leaveBalances: updatedLeaveBalances },
        });
      }
    }

    // Delete associated files from storage if they're only attached to this leave
    for (const file of leave.attachments) {
      // Check if file is attached to any other leave
      const otherLeaves = await prisma.file.findFirst({
        where: {
          id: file.id,
          leaveId: { not: leaveId },
        },
      });

      // Only delete file if not attached to any other leave
      if (!otherLeaves) {
        const filePath = path.join(__dirname, "..", file.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // Delete file records and leave record
    await prisma.file.deleteMany({ where: { leaveId } });
    await prisma.leave.delete({ where: { id: leaveId } });

    res.json({ message: "Leave and associated files deleted successfully" });
  } catch (error) {
    console.error("Error deleting leave:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Manual cleanup endpoint (for admins)
router.post(
  "/cleanup-orphaned-files",
  authenticateToken,
  isAdminOrManager,
  async (req, res) => {
    try {
      const count = await cleanupOrphanedFiles();
      res.json({ message: `Cleaned up ${count} orphaned files` });
    } catch (error) {
      console.error("Error in manual cleanup:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get temporary/unattached files for user (optional - for UI to show what's available)
router.get("/temporary-files", authenticateToken, async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      where: { leaveId: null },
      orderBy: { uploadedAt: "desc" },
      take: 50, // Limit to prevent performance issues
    });

    res.json(files);
  } catch (error) {
    console.error("Error fetching temporary files:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

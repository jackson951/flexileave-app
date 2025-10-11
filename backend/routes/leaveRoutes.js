const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;

// -------------------- CLOUDINARY CONFIG -------------------- //
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// -------------------- MULTER CONFIG (Memory Storage) -------------------- //
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
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
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
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

// ✅ FIXED: Robust Cloudinary upload with correct resource_type
const uploadToCloudinary = (
  fileBuffer,
  fileName,
  folder = "leave_attachments"
) => {
  return new Promise((resolve, reject) => {
    // Normalize and extract extension
    const cleanName = fileName.trim();
    const lowerName = cleanName.toLowerCase();
    const lastDot = lowerName.lastIndexOf(".");
    const ext = lastDot === -1 ? "" : lowerName.slice(lastDot + 1);

    // Define image extensions
    const imageExts = new Set([
      "jpg",
      "jpeg",
      "jpe",
      "jif",
      "jfif",
      "jfi",
      "png",
      "gif",
      "webp",
      "bmp",
      "dib",
      "tiff",
      "tif",
      "svg",
      "ico",
    ]);

    // Determine resource type
    const resource_type = imageExts.has(ext) ? "image" : "raw";

    // Safe and unique public_id
    const baseName = cleanName.replace(/^.*[\\/]/, "").replace(/\.[^/.]+$/, "");
    const public_id = `leave_${Date.now()}_${baseName}`;

    // Upload options — this fixes PDFs and DOCX not opening correctly
    const uploadOptions = {
      folder,
      resource_type,
      public_id,
      overwrite: false,
      invalidate: true,
    };

    // ✅ Add file format for non-images
    if (!imageExts.has(ext) && ext) {
      uploadOptions.format = ext;
    }

    // Upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error("❌ Cloudinary upload error:", error.message);
          reject(new Error(`Upload failed: ${error.message}`));
        } else {
          console.log("✅ Uploaded to Cloudinary:", result.secure_url);
          resolve(result);
        }
      }
    );

    // End stream with file buffer
    uploadStream.end(fileBuffer);
  });
};

// ✅ FIXED: Reliable deletion using regex-based public_id extraction
const deleteFromCloudinary = async (fileUrl) => {
  try {
    // Extract public_id from secure_url (handles versioned URLs like /v12345/)
    const match = fileUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    if (!match) {
      throw new Error("Could not parse public_id from URL");
    }
    const publicId = match[1]; // e.g., "leave_attachments/leave_1712345678_report"
    const resource_type = fileUrl.includes("/raw/upload/") ? "raw" : "image";

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type,
    });
    console.log(
      "🗑️ Deleted from Cloudinary:",
      publicId,
      "| Result:",
      result.result
    );
    return result;
  } catch (error) {
    console.error("❌ Cloudinary delete error:", error.message);
    throw error;
  }
};

// Helper: Cleanup orphaned files
const cleanupOrphanedFiles = async () => {
  try {
    const orphanedFiles = await prisma.file.findMany({
      where: { leaveId: null },
    });

    for (const file of orphanedFiles) {
      try {
        await deleteFromCloudinary(file.url);
        await prisma.file.delete({ where: { id: file.id } });
      } catch (error) {
        console.error(`Failed to delete orphaned file ${file.id}:`, error);
      }
    }
    return orphanedFiles.length;
  } catch (error) {
    console.error("Orphan cleanup error:", error);
    throw error;
  }
};

// Schedule cleanup every hour
setInterval(async () => {
  try {
    await cleanupOrphanedFiles();
  } catch (error) {
    // Silent fail
  }
}, 60 * 60 * 1000);

// -------------------- ROUTES -------------------- //

// Upload files to Cloudinary
router.post(
  "/upload",
  authenticateToken,
  upload.array("files", 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadedFiles = [];
      for (const file of req.files) {
        try {
          const cloudinaryResult = await uploadToCloudinary(
            file.buffer,
            file.originalname
          );

          const dbFile = await prisma.file.create({
            data: {
              name: file.originalname,
              url: cloudinaryResult.secure_url, // ✅ ALWAYS use secure_url
              size: file.size,
              type: file.mimetype,
            },
          });
          uploadedFiles.push(dbFile);
        } catch (uploadError) {
          console.error("File upload failed:", uploadError.message);
          continue;
        }
      }

      if (uploadedFiles.length === 0) {
        return res.status(500).json({ message: "All file uploads failed" });
      }

      res.status(201).json(uploadedFiles);
    } catch (error) {
      if (error.message && error.message.includes("File type not supported")) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Upload route error:", error);
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

    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    await prisma.file.update({
      where: { id: fileId },
      data: { leaveId: null },
    });
    await deleteFromCloudinary(file.url);
    await prisma.file.delete({ where: { id: fileId } });

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete file error:", error);
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

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const available = getLeaveBalance(user.leaveBalances, leaveType);
      if (available < days) {
        return res.status(400).json({
          message: `Insufficient ${leaveType} balance. You have ${available} day(s) remaining.`,
        });
      }

      const overlappingLeave = await prisma.leave.findFirst({
        where: {
          userId: req.user.userId,
          AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
          status: { notIn: ["rejected", "cancelled"] },
        },
      });

      if (overlappingLeave) {
        return res.status(400).json({
          message: `You already have a leave request overlapping this period (${
            overlappingLeave.startDate.toISOString().split("T")[0]
          } to ${overlappingLeave.endDate.toISOString().split("T")[0]}).`,
        });
      }

      if (fileIds?.length > 0) {
        const files = await prisma.file.findMany({
          where: { id: { in: fileIds }, leaveId: null },
        });
        if (files.length !== fileIds.length) {
          return res.status(400).json({
            message:
              "One or more files are invalid or already attached to another leave",
          });
        }
      }

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
      console.error("Create leave error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get all leaves (admin/manager)
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
    console.error("Get all leaves error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get my leaves
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
    console.error("Get my leaves error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get leave by ID
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

    if (
      leave.userId !== req.user.userId &&
      req.user.role !== "admin" &&
      req.user.role !== "manager"
    ) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.json(leave);
  } catch (error) {
    console.error("Get leave by ID error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update leave
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

      if (leave.userId !== req.user.userId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized access" });
      }

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
        fileIds,
        removeFileIds,
      } = req.body;

      let days = leave.days;
      let newStart = leave.startDate;
      let newEnd = leave.endDate;

      if (startDate || endDate) {
        newStart = startDate ? new Date(startDate) : leave.startDate;
        newEnd = endDate ? new Date(endDate) : leave.endDate;
        days = Math.ceil((newEnd - newStart) / (1000 * 60 * 60 * 24)) + 1;

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

        const overlappingLeave = await prisma.leave.findFirst({
          where: {
            userId: req.user.userId,
            id: { not: leaveId },
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

      const updateData = {
        leaveType: leaveType || leave.leaveType,
        startDate: newStart,
        endDate: newEnd,
        days,
        reason: reason || leave.reason,
        emergencyContact:
          emergencyContact !== undefined
            ? emergencyContact
            : leave.emergencyContact,
        emergencyPhone:
          emergencyPhone !== undefined ? emergencyPhone : leave.emergencyPhone,
      };

      if (fileIds?.length > 0) {
        const filesToAttach = await prisma.file.findMany({
          where: {
            id: { in: fileIds },
            OR: [{ leaveId: null }, { leaveId: leaveId }],
          },
        });
        if (filesToAttach.length !== fileIds.length) {
          return res.status(400).json({
            message:
              "One or more files are invalid or attached to another leave",
          });
        }
      }

      const updatedLeave = await prisma.$transaction(async (tx) => {
        if (removeFileIds?.length > 0) {
          await tx.file.updateMany({
            where: { id: { in: removeFileIds } },
            data: { leaveId: null },
          });
        }

        if (fileIds?.length > 0) {
          await tx.file.updateMany({
            where: {
              id: { in: fileIds },
              OR: [{ leaveId: null }, { leaveId: leaveId }],
            },
            data: { leaveId: leaveId },
          });
        }

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
      console.error("Update leave error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Approve leave
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

      const currentBalance = getLeaveBalance(
        leave.user.leaveBalances,
        leave.leaveType
      );
      if (leave.leaveType !== "UnpaidLeave" && currentBalance < leave.days) {
        return res.status(400).json({
          message: `User does not have enough ${leave.leaveType} balance. Available: ${currentBalance}, Requested: ${leave.days}`,
        });
      }

      const updatedLeaveBalances = {
        ...leave.user.leaveBalances,
        [leave.leaveType]: currentBalance - leave.days,
      };

      await prisma.user.update({
        where: { id: leave.userId },
        data: { leaveBalances: updatedLeaveBalances },
      });

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
      console.error("Approve leave error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Reject leave
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
          actionedBy: req.user.userId,
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
      console.error("Reject leave error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Cancel leave
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
    console.error("Cancel leave error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete leave (admin/manager only)
router.delete("/:id", authenticateToken, isAdminOrManager, async (req, res) => {
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

    // Restore leave balance if approved
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

    // Delete files only if not used elsewhere
    for (const file of leave.attachments) {
      const otherUsage = await prisma.file.findFirst({
        where: { id: file.id, leaveId: { not: leaveId } },
      });
      if (!otherUsage) {
        await deleteFromCloudinary(file.url);
      }
    }

    await prisma.file.deleteMany({ where: { leaveId } });
    await prisma.leave.delete({ where: { id: leaveId } });

    res.json({ message: "Leave and associated files deleted successfully" });
  } catch (error) {
    console.error("Delete leave error:", error);
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
      console.error("Manual cleanup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get temporary/unattached files for user
router.get("/temporary-files", authenticateToken, async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      where: { leaveId: null },
      orderBy: { uploadedAt: "desc" },
      take: 50,
    });
    res.json(files);
  } catch (error) {
    console.error("Get temporary files error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// -------------------- MULTER CONFIG -------------------- //
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
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
});

// -------------------- MIDDLEWARE -------------------- //
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  require("jsonwebtoken").verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
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

// -------------------- ROUTES -------------------- //

// Upload files
router.post(
  "/upload",
  authenticateToken,
  upload.array("files", 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0)
        return res.status(400).json({ message: "No files uploaded" });

      const uploadedFiles = await Promise.all(
        req.files.map((file) =>
          prisma.file.create({
            data: {
              name: file.originalname,
              url: `/uploads/${file.filename}`,
              size: file.size,
              type: file.mimetype,
            },
          })
        )
      );

      res.status(201).json(uploadedFiles);
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Create leave
router.post(
  "/",
  authenticateToken,
  [
    body("leaveType").trim().notEmpty().withMessage("Leave type is required"),
    body("startDate").isISO8601().toDate(),
    body("endDate").isISO8601().toDate(),
    body("reason").trim().notEmpty().withMessage("Reason is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

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

      const days =
        Math.ceil(
          (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
        ) + 1;

      // Fetch the user to get leaveBalance
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.leaveBalance < days)
        return res.status(400).json({
          message: `Insufficient leave balance. You have ${user.leaveBalance} day(s) remaining.`,
        });

      // Check for overlapping leaves
      const overlappingLeave = await prisma.leave.findFirst({
        where: {
          userId: req.user.userId,
          AND: [
            { startDate: { lte: new Date(endDate) } },
            { endDate: { gte: new Date(startDate) } },
          ],
          status: { not: "rejected" }, // ignore rejected leaves
        },
      });

      if (overlappingLeave)
        return res.status(400).json({
          message: `You already have a leave request overlapping this period (${
            overlappingLeave.startDate.toISOString().split("T")[0]
          } to ${overlappingLeave.endDate.toISOString().split("T")[0]}).`,
        });

      // Create leave
      const newLeave = await prisma.leave.create({
        data: {
          leaveType,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          days,
          reason,
          emergencyContact,
          emergencyPhone,
          userId: req.user.userId,
          attachments: { connect: fileIds?.map((id) => ({ id })) || [] },
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

// Get all leaves (admin/manager)
router.get("/", authenticateToken, isAdminOrManager, async (req, res) => {
  try {
    const leaves = await prisma.leave.findMany({
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

// Get my leaves
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const leaves = await prisma.leave.findMany({
      where: { userId: req.user.userId },
      include: { attachments: true },
      orderBy: { submittedAt: "desc" },
    });
    res.json(leaves);
  } catch (error) {
    console.error("Error fetching my leaves:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get leave by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const leaveId = parseInt(req.params.id);
    if (isNaN(leaveId))
      return res.status(400).json({ message: "Invalid leave ID" });

    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        attachments: true,
      },
    });

    if (!leave) return res.status(404).json({ message: "Leave not found" });
    if (
      leave.userId !== req.user.userId &&
      req.user.role !== "admin" &&
      req.user.role !== "manager"
    )
      return res.status(403).json({ message: "Unauthorized access" });

    res.json(leave);
  } catch (error) {
    console.error("Error fetching leave:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update leave
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const leaveId = parseInt(req.params.id);
    if (isNaN(leaveId))
      return res.status(400).json({ message: "Invalid leave ID" });

    const leave = await prisma.leave.findUnique({ where: { id: leaveId } });
    if (!leave) return res.status(404).json({ message: "Leave not found" });
    if (leave.userId !== req.user.userId && req.user.role !== "admin")
      return res.status(403).json({ message: "Unauthorized access" });
    if (leave.status !== "pending")
      return res
        .status(400)
        .json({ message: "Cannot update approved/rejected leave" });

    const {
      leaveType,
      startDate,
      endDate,
      reason,
      emergencyContact,
      emergencyPhone,
    } = req.body;
    const days =
      startDate && endDate
        ? Math.ceil(
            (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
          ) + 1
        : leave.days;

    const updatedLeave = await prisma.leave.update({
      where: { id: leaveId },
      data: {
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days,
        reason,
        emergencyContact,
        emergencyPhone,
      },
      include: { attachments: true },
    });

    res.json(updatedLeave);
  } catch (error) {
    console.error("Error updating leave:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Approve leave and deduct leave days
router.put(
  "/:id/approve",
  authenticateToken,
  isAdminOrManager,
  async (req, res) => {
    try {
      const leaveId = parseInt(req.params.id);
      if (isNaN(leaveId))
        return res.status(400).json({ message: "Invalid leave ID" });

      // Fetch leave with user info
      const leave = await prisma.leave.findUnique({
        where: { id: leaveId },
        include: { user: true },
      });

      if (!leave) return res.status(404).json({ message: "Leave not found" });
      if (leave.status !== "pending")
        return res
          .status(400)
          .json({ message: "Only pending leaves can be approved" });

      // Check if user has enough leave balance
      if (leave.user.leaveBalance < leave.days) {
        return res
          .status(400)
          .json({ message: "User does not have enough leave balance" });
      }

      // Deduct leave days and update leave status
      const updatedLeave = await prisma.leave.update({
        where: { id: leaveId },
        data: {
          status: "approved",
          rejectionReason: null,
          user: {
            update: {
              leaveBalance: leave.user.leaveBalance - leave.days,
            },
          },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, leaveBalance: true },
          },
        },
      });

      res.json({
        message: `Leave approved and ${leave.days} days deducted from user's leave balance`,
        leave: updatedLeave,
      });
    } catch (error) {
      console.error("Error approving leave:", error);
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
      if (isNaN(leaveId))
        return res.status(400).json({ message: "Invalid leave ID" });

      const { rejectionReason } = req.body;
      const leave = await prisma.leave.update({
        where: { id: leaveId },
        data: { status: "rejected", rejectionReason },
        include: { user: { select: { email: true, name: true } } },
      });

      res.json(leave);
    } catch (error) {
      console.error("Error rejecting leave:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Cancel leave
router.put("/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const leaveId = parseInt(req.params.id);
    if (isNaN(leaveId))
      return res.status(400).json({ message: "Invalid leave ID" });

    const leave = await prisma.leave.findUnique({ where: { id: leaveId } });
    if (!leave) return res.status(404).json({ message: "Leave not found" });
    if (leave.userId !== req.user.userId && req.user.role !== "admin")
      return res.status(403).json({ message: "Unauthorized access" });

    const cancelledLeave = await prisma.leave.update({
      where: { id: leaveId },
      data: { status: "cancelled" },
    });
    res.json(cancelledLeave);
  } catch (error) {
    console.error("Error cancelling leave:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete leave
router.delete("/:id", authenticateToken, isAdminOrManager, async (req, res) => {
  try {
    const leaveId = parseInt(req.params.id);
    if (isNaN(leaveId))
      return res.status(400).json({ message: "Invalid leave ID" });

    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
      include: { attachments: true },
    });
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    // Delete associated files from storage
    leave.attachments.forEach((file) => {
      const filePath = path.join(
        __dirname,
        "../uploads",
        path.basename(file.url)
      );
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    // Delete leave record and associated file records
    await prisma.file.deleteMany({ where: { leaveId } });
    await prisma.leave.delete({ where: { id: leaveId } });

    res.json({ message: "Leave and associated files deleted successfully" });
  } catch (error) {
    console.error("Error deleting leave:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

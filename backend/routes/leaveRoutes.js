require("dotenv").config();
const express = require("express");
const router = express.Router();
const { getPrismaClient } = require("../utils/prismaClient");
const prisma = getPrismaClient();
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinary");
const {
  authenticateToken,
  tenantGuard,
  authorizeRoles,
} = require("../middleware/auth");

const requireAdminOrManager = authorizeRoles("OWNER", "ADMIN", "MANAGER");

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

// Helper function to get leave balance
const getLeaveBalance = (leaveBalances, leaveType) => {
  if (!leaveBalances) return 0;
  return leaveBalances[leaveType] || 0;
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

const NOTIFICATION_TYPES = {
  SUBMITTED: "leave_submitted",
  APPROVED: "leave_approved",
  REJECTED: "leave_rejected",
};

const ADMIN_NOTIFICATION_ROLES = ["ADMIN", "MANAGER"];

const formatDateOnly = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().split("T")[0];
};

const formatLeaveDateRange = (leave) =>
  `${formatDateOnly(leave.startDate)} to ${formatDateOnly(leave.endDate)}`;

const buildLeaveNotificationMetadata = (leave, status) => ({
  leaveId: leave.id,
  status,
  leaveType: leave.leaveType,
  startDate: leave.startDate,
  endDate: leave.endDate,
});

const notifyTenantRoles = async ({
  tenantId,
  roles,
  leave,
  triggeredById,
  type,
  title,
  message,
  status,
}) => {
  if (!roles || roles.length === 0) return;

  const recipients = await prisma.user.findMany({
    where: {
      tenantId,
      role: { in: roles },
    },
    select: { id: true },
  });

  if (!recipients.length) return;

  const metadataTemplate = buildLeaveNotificationMetadata(leave, status);

  await prisma.notification.createMany({
    data: recipients.map((recipient) => ({
      recipientId: recipient.id,
      triggeredById,
      leaveId: leave.id,
      type,
      title,
      message,
      metadata: { ...metadataTemplate },
    })),
  });
};

const sendNotificationToUser = async ({
  recipientId,
  leave,
  triggeredById,
  type,
  title,
  message,
  status,
}) => {
  await prisma.notification.create({
    data: {
      recipientId,
      triggeredById,
      leaveId: leave.id,
      type,
      title,
      message,
      metadata: buildLeaveNotificationMetadata(leave, status),
    },
  });
};

// Schedule cleanup every hour
setInterval(async () => {
  try {
    await cleanupOrphanedFiles();
  } catch (error) {
    // Silent fail
  }
}, 60 * 60 * 1000);

// -------------------- SWAGGER DOCUMENTATION -------------------- //

/**
 * @swagger
 * tags:
 *   name: Leaves
 *   description: Leave management API
 * components:
 *   schemas:
 *     Leave:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         leaveType:
 *           type: string
 *           example: AnnualLeave
 *         startDate:
 *           type: string
 *           format: date
 *           example: "2023-12-01"
 *         endDate:
 *           type: string
 *           format: date
 *           example: "2023-12-05"
 *         days:
 *           type: integer
 *           example: 5
 *         reason:
 *           type: string
 *           example: "Family vacation"
 *         emergencyContact:
 *           type: string
 *           example: "John Doe"
 *         emergencyPhone:
 *           type: string
 *           example: "+1234567890"
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *           example: PENDING
 *         rejectionReason:
 *           type: string
 *           example: null
 *         submittedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-11-30T10:00:00Z"
 *         userId:
 *           type: integer
 *           example: 1
 *         actionedBy:
 *           type: integer
 *           example: 2
 *         user:
 *           $ref: '#/components/schemas/User'
 *         actionedByUser:
 *           $ref: '#/components/schemas/User'
 *         attachments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/File'
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           example: "john@example.com"
 *         department:
 *           type: string
 *           example: "Engineering"
 *         position:
 *           type: string
 *           example: "Software Engineer"
 *         avatar:
 *           type: string
 *           example: "https://example.com/avatar.jpg"
 *     File:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "document.pdf"
 *         url:
 *           type: string
 *           example: "https://res.cloudinary.com/.../document.pdf"
 *         size:
 *           type: integer
 *           example: 102400
 *         type:
 *           type: string
 *           example: "application/pdf"
 *         uploadedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-11-30T10:00:00Z"
 */

// -------------------- ROUTES -------------------- //

/**
 * @swagger
 * /api/leaves/upload:
 *   post:
 *     summary: Upload files to Cloudinary
 *     tags: [Leaves]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *             required:
 *               - files
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/File'
 *       400:
 *         description: No files uploaded or unsupported file type
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
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
              url: cloudinaryResult.secure_url,
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

/**
 * @swagger
 * /api/leaves/file/{fileId}:
 *   delete:
 *     summary: Delete a single uploaded file
 *     tags: [Leaves]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the file to delete
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       400:
 *         description: Invalid file ID
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/leaves:
 *   post:
 *     summary: Create a new leave request
 *     tags: [Leaves]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leaveType
 *               - startDate
 *               - endDate
 *               - reason
 *             properties:
 *               leaveType:
 *                 type: string
 *                 example: AnnualLeave
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-12-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-12-05"
 *               reason:
 *                 type: string
 *                 example: "Family vacation"
 *               emergencyContact:
 *                 type: string
 *                 example: "John Doe"
 *               emergencyPhone:
 *                 type: string
 *                 example: "+1234567890"
 *               fileIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *     responses:
 *       201:
 *         description: Leave created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Leave'
 *       400:
 *         description: Validation error or insufficient leave balance
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  authenticateToken,
  tenantGuard,
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
          status: { notIn: ["REJECTED", "CANCELLED"] },
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
          tenantId: req.user.tenantId,
          status: "PENDING",
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

      try {
        const dateRange = formatLeaveDateRange(newLeave);
        const leaveMessage = `${user.name} submitted ${newLeave.leaveType} for ${dateRange}.`;
        await notifyTenantRoles({
          tenantId: req.user.tenantId,
          roles: ADMIN_NOTIFICATION_ROLES,
          leave: newLeave,
          triggeredById: req.user.userId,
          type: NOTIFICATION_TYPES.SUBMITTED,
          title: "New leave request submitted",
          message: leaveMessage,
          status: "PENDING",
        });
      } catch (notificationError) {
        console.error(
          "Failed to notify tenant admins about new leave",
          notificationError
        );
      }

      res.status(201).json(newLeave);
    } catch (error) {
      console.error("Create leave error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/leaves:
 *   get:
 *     summary: Get all leaves (admin/manager only)
 *     tags: [Leaves]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: leaveType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of leaves
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Leave'
 *       401:
 *         description: Access token required
 *       403:
 *         description: Admin or manager access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/",
  authenticateToken,
  tenantGuard,
  requireAdminOrManager,
  async (req, res) => {
  try {
    const { status, userId, leaveType } = req.query;
    const whereClause = {};
    if (status) whereClause.status = status;
    if (userId) whereClause.userId = parseInt(userId);
    if (leaveType) whereClause.leaveType = leaveType;

    const leaves = await prisma.leave.findMany({
      where: {
        ...whereClause,
        user: { tenantId: req.user.tenantId },
      },
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

/**
 * @swagger
 * /api/leaves/my:
 *   get:
 *     summary: Get current user's leaves
 *     tags: [Leaves]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *     responses:
 *       200:
 *         description: List of user's leaves
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Leave'
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
router.get("/my", authenticateToken, tenantGuard, async (req, res) => {
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

/**
 * @swagger
 * /api/leaves/{id}:
 *   get:
 *     summary: Get leave by ID
 *     tags: [Leaves]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the leave to retrieve
 *     responses:
 *       200:
 *         description: Leave details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Leave'
 *       400:
 *         description: Invalid leave ID
 *       401:
 *         description: Access token required
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Leave not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const leaveId = parseInt(req.params.id);
    if (isNaN(leaveId)) {
      return res.status(400).json({ message: "Invalid leave ID" });
    }

    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            tenantId: true,
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

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.user?.tenantId !== req.user.tenantId) {
      return res.status(403).json({ message: "Unauthorized access" });
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

/**
 * @swagger
 * /api/leaves/{id}:
 *   put:
 *     summary: Update a leave request
 *     tags: [Leaves]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the leave to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leaveType:
 *                 type: string
 *                 example: AnnualLeave
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-12-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-12-05"
 *               reason:
 *                 type: string
 *                 example: "Family vacation"
 *               emergencyContact:
 *                 type: string
 *                 example: "John Doe"
 *               emergencyPhone:
 *                 type: string
 *                 example: "+1234567890"
 *               fileIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *               removeFileIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [3]
 *     responses:
 *       200:
 *         description: Leave updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Leave'
 *       400:
 *         description: Validation error or cannot update APPROVED/REJECTED leave
 *       401:
 *         description: Access token required
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Leave not found
 *       500:
 *         description: Internal server error
 */
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
        include: {
          attachments: true,
          user: {
            select: {
              id: true,
              tenantId: true,
            },
          },
        },
      });
      if (!leave) {
        return res.status(404).json({ message: "Leave not found" });
      }

      if (leave.user?.tenantId !== req.user.tenantId) {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      if (leave.userId !== req.user.userId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      if (leave.status !== "PENDING") {
        return res
          .status(400)
          .json({ message: "Cannot update leaves that are APPROVED or REJECTED" });
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
            status: { not: "REJECTED" },
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

/**
 * @swagger
 * /api/leaves/{id}/approve:
 *   put:
 *     summary: Approve a leave request (admin/manager only)
 *     tags: [Leaves]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the leave to approve
 *     responses:
 *       200:
 *         description: Leave approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 leave:
 *                   $ref: '#/components/schemas/Leave'
 *       400:
 *         description: Only PENDING leaves can be APPROVED or insufficient balance
 *       401:
 *         description: Access token required
 *       403:
 *         description: Admin or manager access required
 *       404:
 *         description: Leave not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id/approve",
  authenticateToken,
  tenantGuard,
  requireAdminOrManager,
  async (req, res) => {
    try {
      const leaveId = parseInt(req.params.id);
      if (isNaN(leaveId)) {
        return res.status(400).json({ message: "Invalid leave ID" });
      }

      const leave = await prisma.leave.findUnique({
        where: { id: leaveId },
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
              tenantId: true,
            },
          },
          attachments: true,
        },
      });
      if (!leave) {
        return res.status(404).json({ message: "Leave not found" });
      }

      if (leave.user?.tenantId !== req.user.tenantId) {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      if (leave.status !== "PENDING") {
        return res
          .status(400)
          .json({ message: "OnlyPENDING leaves can beAPPROVED" });
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
          status: "APPROVED",
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

      try {
        const approvedRange = formatLeaveDateRange(updatedLeave);
        const approvalMessage = `Your ${updatedLeave.leaveType} request for ${approvedRange} has been approved.`;
        await sendNotificationToUser({
          recipientId: updatedLeave.user.id,
          leave: updatedLeave,
          triggeredById: req.user.userId,
          type: NOTIFICATION_TYPES.APPROVED,
          title: "Leave approved",
          message: approvalMessage,
          status: updatedLeave.status,
        });
      } catch (notificationError) {
        console.error(
          "Failed to notify employee after leave approval",
          notificationError
        );
      }

      res.json({
        message:
          leave.leaveType === "UnpaidLeave"
            ? "Unpaid leaveAPPROVED successfully"
            : `LeaveAPPROVED and ${leave.days} days deducted from ${leave.leaveType} balance`,
        leave: updatedLeave,
      });
    } catch (error) {
      console.error("Approve leave error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/leaves/{id}/reject:
 *   put:
 *     summary: Reject a leave request (admin/manager only)
 *     tags: [Leaves]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the leave to reject
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 example: "Insufficient documentation"
 *     responses:
 *       200:
 *         description: LeaveREJECTED successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Leave'
 *       400:
 *         description: Rejection reason required or invalid leave ID
 *       401:
 *         description: Access token required
 *       403:
 *         description: Admin or manager access required
 *       404:
 *         description: Leave not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id/reject",
  authenticateToken,
  tenantGuard,
  requireAdminOrManager,
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

      const leave = await prisma.leave.findUnique({
        where: { id: leaveId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              tenantId: true,
            },
          },
        },
      });

      if (!leave) {
        return res.status(404).json({ message: "Leave not found" });
      }

      if (leave.user?.tenantId !== req.user.tenantId) {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      const updatedLeave = await prisma.leave.update({
        where: { id: leaveId },
        data: {
          status: "REJECTED",
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

      try {
        const rejectionRange = formatLeaveDateRange(updatedLeave);
        const rejectionMessage = `Your ${updatedLeave.leaveType} request for ${rejectionRange} was rejected. Reason: ${updatedLeave.rejectionReason}`;
        await sendNotificationToUser({
          recipientId: updatedLeave.user.id,
          leave: updatedLeave,
          triggeredById: req.user.userId,
          type: NOTIFICATION_TYPES.REJECTED,
          title: "Leave rejected",
          message: rejectionMessage,
          status: updatedLeave.status,
        });
      } catch (notificationError) {
        console.error(
          "Failed to notify employee after leave rejection",
          notificationError
        );
      }

      res.json(updatedLeave);
    } catch (error) {
      console.error("Reject leave error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/leaves/{id}/cancel:
 *   put:
 *     summary: Cancel a leave request
 *     tags: [Leaves]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the leave to cancel
 *     responses:
 *       200:
 *         description: Leave cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Leave'
 *       400:
 *         description: Only PENDING leaves can be CANCELLED
 *       401:
 *         description: Access token required
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Leave not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const leaveId = parseInt(req.params.id);
    if (isNaN(leaveId)) {
      return res.status(400).json({ message: "Invalid leave ID" });
    }

    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
      include: {
        user: {
          select: {
            tenantId: true,
          },
        },
      },
    });
    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.user?.tenantId !== req.user.tenantId) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    if (leave.userId !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    if (leave.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "OnlyPENDING leaves can beCANCELLED" });
    }

    constCANCELLEDLeave = await prisma.leave.update({
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

/**
 * @swagger
 * /api/leaves/{id}:
 *   delete:
 *     summary: Delete a leave request (admin/manager only)
 *     tags: [Leaves]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the leave to delete
 *     responses:
 *       200:
 *         description: Leave and associated files deleted successfully
 *       400:
 *         description: Invalid leave ID
 *       401:
 *         description: Access token required
 *       403:
 *         description: Admin or manager access required
 *       404:
 *         description: Leave not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/:id",
  authenticateToken,
  tenantGuard,
  requireAdminOrManager,
  async (req, res) => {
  try {
    const leaveId = parseInt(req.params.id);
    if (isNaN(leaveId)) {
      return res.status(400).json({ message: "Invalid leave ID" });
    }

    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
      include: {
        attachments: true,
        user: {
          select: {
            id: true,
            tenantId: true,
            leaveBalances: true,
          },
        },
      },
    });

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.user?.tenantId !== req.user.tenantId) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    // Restore leave balance ifAPPROVED
    if (leave.status === "APPROVED") {
      const userForBalances =
        leave.user ||
        (await prisma.user.findUnique({
          where: { id: leave.userId },
        }));
      if (userForBalances) {
        const currentBalance = getLeaveBalance(
          userForBalances.leaveBalances,
          leave.leaveType
        );
        const updatedLeaveBalances = {
          ...userForBalances.leaveBalances,
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

/**
 * @swagger
 * /api/leaves/cleanup-orphaned-files:
 *   post:
 *     summary: Manually clean up orphaned files (admin/manager only)
 *     tags: [Leaves]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Orphaned files cleaned up successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cleaned up 3 orphaned files"
 *       401:
 *         description: Access token required
 *       403:
 *         description: Admin or manager access required
 *       500:
 *         description: Internal server error
 */
router.post(
  "/cleanup-orphaned-files",
  authenticateToken,
  tenantGuard,
  requireAdminOrManager,
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

/**
 * @swagger
 * /api/leaves/temporary-files:
 *   get:
 *     summary: Get temporary/unattached files for current user
 *     tags: [Leaves]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of temporary files
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/File'
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
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

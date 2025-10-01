const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"], // Enable detailed logging
});
const jwt = require("jsonwebtoken");

// -------------------- MIDDLEWARE -------------------- //
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("Token verification error:", err);
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
    req.user = user;
    next();
  });
};

const validateNotificationInput = (req, res, next) => {
  const { userId, message, type, title } = req.body;

  if (!userId || !message || !type || !title) {
    return res.status(400).json({
      success: false,
      message: "userId, title, message, and type are required fields",
    });
  }

  next();
};

// -------------------- ROUTES -------------------- //

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Create a notification (Admin/Manager only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - title
 *               - message
 *               - type
 *             properties:
 *               userId:
 *                 type: integer
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [leave_submitted, leave_approved, leave_rejected, system]
 *               leaveId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Forbidden - Admin/Manager access required
 *       500:
 *         description: Internal server error
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    console.log(`Fetching notifications for user ${req.user.userId}`);

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: req.user.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        leave: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        triggeredBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`Found ${notifications.length} notifications`);

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Get count of unread notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Count of unread notifications
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.get("/unread-count", authenticateToken, async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        recipientId: req.user.userId,
        isRead: false,
      },
    });

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       400:
 *         description: Invalid notification ID
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id/read", authenticateToken, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (notification.recipientId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to mark this notification as read",
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      data: updatedNotification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /notifications/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       500:
 *         description: Internal server error
 */
router.put("/mark-all-read", authenticateToken, async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        recipientId: req.user.userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: `${result.count} notification(s) marked as read`,
      data: result,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       400:
 *         description: Invalid notification ID
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (notification.recipientId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this notification",
      });
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /notifications/read/all:
 *   delete:
 *     summary: Delete all read notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Read notifications deleted successfully
 *       500:
 *         description: Internal server error
 */
router.delete("/read/all", authenticateToken, async (req, res) => {
  try {
    const result = await prisma.notification.deleteMany({
      where: {
        recipientId: req.user.userId,
        isRead: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `${result.count} read notification(s) deleted successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Error deleting read notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete read notifications",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Create a notification (Admin/Manager only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - message
 *               - type
 *             properties:
 *               userId:
 *                 type: integer
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [leave_submitted, leave_approved, leave_rejected, system]
 *               leaveId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Forbidden - Admin/Manager access required
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  authenticateToken,
  validateNotificationInput,
  async (req, res) => {
    try {
      const { userId, message, type, leaveId, title } = req.body;

      if (!title) {
        return res.status(400).json({
          success: false,
          message: "Title is required for notifications",
        });
      }

      const notification = await prisma.notification.create({
        data: {
          recipientId: parseInt(userId),
          title,
          message,
          type,
          leaveId: leaveId ? parseInt(leaveId) : null,
          triggeredById: req.user.userId,
        },
      });

      res.status(201).json({
        success: true,
        message: "Notification created successfully",
        data: notification,
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create notification",
        error: error.message,
      });
    }
  }
);

module.exports = router;

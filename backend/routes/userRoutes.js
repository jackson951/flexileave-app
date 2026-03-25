require("dotenv").config();
const express = require("express");
const router = express.Router();
const { getPrismaClient } = require("../utils/prismaClient");
const prisma = getPrismaClient();
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");
const { DEFAULT_LEAVE_BALANCES } = require("../constants/leaveBalances");
const {
  authenticateToken,
  tenantGuard,
  authorizeRoles,
} = require("../middleware/auth");

const INVITE_EXPIRY_HOURS = parseInt(
  process.env.INVITE_EXPIRY_HOURS ?? "48",
  10
);
const INVITE_EXPIRY_MS = Math.max(INVITE_EXPIRY_HOURS, 1) * 60 * 60 * 1000;
const TENANT_ADMIN_ROLES = ["OWNER", "ADMIN", "MANAGER"];
const INVITE_ROLES = ["ADMIN", "MANAGER", "EMPLOYEE"];
const VALID_ROLES = [...INVITE_ROLES, "OWNER"];
const VALID_STATUSES = ["ACTIVE", "INACTIVE"];

const generateInviteToken = () => crypto.randomBytes(32).toString("hex");

// Validator for leaveBalances object
const validateLeaveBalances = body("leaveBalances").custom((value) => {
  if (typeof value !== "object" || Array.isArray(value) || value === null) {
    throw new Error("Leave balances must be a valid JSON object");
  }

  const requiredKeys = [
    "AnnualLeave",
    "SickLeave",
    "FamilyResponsibility",
    "UnpaidLeave",
    "Other",
  ];

  for (const key of requiredKeys) {
    if (!(key in value)) {
      throw new Error(`Missing leave type: ${key}`);
    }
    if (typeof value[key] !== "number" || value[key] < 0) {
      throw new Error(`${key} must be a non-negative number`);
    }
  }

  return true;
});

// -------------------- SWAGGER DOCUMENTATION -------------------- //

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management API
 * components:
 *   schemas:
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
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         department:
 *           type: string
 *           example: "Engineering"
 *         position:
 *           type: string
 *           example: "Software Engineer"
 *         joinDate:
 *           type: string
 *           format: date
 *           example: "2023-01-15"
 *         leaveBalances:
 *           type: object
 *           properties:
 *             AnnualLeave:
 *               type: number
 *               example: 15
 *             SickLeave:
 *               type: number
 *               example: 10
 *             FamilyResponsibility:
 *               type: number
 *               example: 5
 *             UnpaidLeave:
 *               type: number
 *               example: 0
 *             Other:
 *               type: number
 *               example: 2
 *         role:
 *           type: string
 *           enum: [employee, manager, admin]
 *           example: employee
 *         avatar:
 *           type: string
 *           example: "https://example.com/avatar.jpg"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-01-15T10:00:00Z"
 *     LeaveBalances:
 *       type: object
 *       required:
 *         - AnnualLeave
 *         - SickLeave
 *         - FamilyResponsibility
 *         - UnpaidLeave
 *         - Other
 *       properties:
 *         AnnualLeave:
 *           type: number
 *           minimum: 0
 *           example: 15
 *         SickLeave:
 *           type: number
 *           minimum: 0
 *           example: 10
 *         FamilyResponsibility:
 *           type: number
 *           minimum: 0
 *           example: 5
 *         UnpaidLeave:
 *           type: number
 *           minimum: 0
 *           example: 0
 *         Other:
 *           type: number
 *           minimum: 0
 *           example: 2
 */

// ---------------- ROUTES ----------------

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Access token required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/",
  authenticateToken,
  tenantGuard,
  authorizeRoles(...TENANT_ADMIN_ROLES),
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        where: { tenantId: req.user.tenantId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          department: true,
          position: true,
          joinDate: true,
          leaveBalances: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
      });

      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }
);

router.post(
  "/invite",
  authenticateToken,
  tenantGuard,
  authorizeRoles(...TENANT_ADMIN_ROLES),
  async (req, res) => {
    const {
      email,
      role,
      name,
      department,
      position,
      phone,
      joinDate,
      password,
    } = req.body;

    if (!email || !role || !name) {
      return res.status(400).json({
        message: "Name, email, and role are required for invitations",
      });
    }

    const trimmedName = name.toString().trim();
    if (!trimmedName) {
      return res.status(400).json({
        message: "Name must be provided",
      });
    }

    const normalizedRole = role.toUpperCase();
    if (!INVITE_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        message: `Role must be one of ${INVITE_ROLES.join(", ")}`,
      });
    }

    if (password && password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await prisma.user.findFirst({
        where: {
          tenantId: req.user.tenantId,
          email: normalizedEmail,
        },
      });
      if (existingUser) {
        return res
          .status(409)
          .json({ message: "User already exists for this tenant" });
      }

      const existingInvite = await prisma.userInvitation.findFirst({
        where: {
          tenantId: req.user.tenantId,
          email: normalizedEmail,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });
      if (existingInvite) {
        return res.status(409).json({
          message: "An active invitation already exists for this email",
        });
      }

      const resolvedJoinDate = joinDate ? new Date(joinDate) : null;
      const joinDateIso =
        resolvedJoinDate && !Number.isNaN(resolvedJoinDate.getTime())
          ? resolvedJoinDate.toISOString()
          : null;

      const metadata = {
        name: trimmedName,
        department: department?.trim() || null,
        position: position?.trim() || null,
        phone: phone?.trim() || null,
        joinDate: joinDateIso,
      };

      const passwordHash = password
        ? await bcrypt.hash(password, 10)
        : null;

      const invitation = await prisma.userInvitation.create({
        data: {
          email: normalizedEmail,
          role: normalizedRole,
          token: generateInviteToken(),
          tenantId: req.user.tenantId,
          expiresAt: new Date(Date.now() + INVITE_EXPIRY_MS),
          metadata,
          passwordHash,
        },
      });

      res.status(201).json({
        message: "Invitation created",
        token: invitation.token,
        expiresAt: invitation.expiresAt,
      });
    } catch (error) {
      console.error("Invite creation error:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to retrieve
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Access token required
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/me", authenticateToken, tenantGuard, async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.user.userId,
        tenantId: req.user.tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        position: true,
        joinDate: true,
        leaveBalances: true,
        role: true,
        avatar: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        ...user,
        leaveBalances: user.leaveBalances || {
          AnnualLeave: 0,
          SickLeave: 0,
          FamilyResponsibility: 0,
          UnpaidLeave: 0,
          Other: 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to retrieve
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Access token required
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", authenticateToken, tenantGuard, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.userId;

    const normalizedRole = req.user.role?.toUpperCase();
    if (
      parseInt(id) !== requestingUserId &&
      !TENANT_ADMIN_ROLES.includes(normalizedRole)
    ) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const user = await prisma.user.findFirst({
      where: { id: parseInt(id), tenantId: req.user.tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        position: true,
        joinDate: true,
        leaveBalances: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user (admin only)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - department
 *               - position
 *               - leaveBalances
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "SecurePass123!"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               department:
 *                 type: string
 *                 example: "Engineering"
 *               position:
 *                 type: string
 *                 example: "Software Engineer"
 *               joinDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-01-15"
 *               leaveBalances:
 *                 $ref: '#/components/schemas/LeaveBalances'
 *               role:
 *                 type: string
 *                 enum: [employee, manager, admin]
 *                 example: employee
 *               avatar:
 *                 type: string
 *                 example: "https://example.com/avatar.jpg"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or email already exists
 *       401:
 *         description: Access token required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  authenticateToken,
  tenantGuard,
  authorizeRoles(...TENANT_ADMIN_ROLES),
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("department").trim().notEmpty().withMessage("Department is required"),
    body("position").trim().notEmpty().withMessage("Position is required"),
    validateLeaveBalances,
    body("role")
      .isIn(VALID_ROLES.map((r) => r.toLowerCase()))
      .withMessage("Invalid role"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { password, joinDate, email, ...rest } = req.body;

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      const requestedRole = rest.role
        ? rest.role.toUpperCase()
        : "EMPLOYEE";
      rest.role = requestedRole;

      const normalizedEmail = email.toLowerCase().trim();
      const resolvedJoinDate = joinDate ? new Date(joinDate) : new Date();

      const newUser = await prisma.user.create({
        data: {
          ...rest,
          email: normalizedEmail,
          password: hashedPassword,
          tenantId: req.user.tenantId,
          joinDate: resolvedJoinDate,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          department: true,
          position: true,
          joinDate: true,
          leaveBalances: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error.code === "P2002") {
        return res.status(400).json({ message: "Email already exists" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.put(
  "/:id/role",
  authenticateToken,
  tenantGuard,
  authorizeRoles(...TENANT_ADMIN_ROLES),
  async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }
    const normalizedRole = role.toUpperCase();
    if (!VALID_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        message: `Role must be one of ${VALID_ROLES.join(", ")}`,
      });
    }

    try {
      const targetUser = await prisma.user.findFirst({
        where: { id: parseInt(id), tenantId: req.user.tenantId },
      });
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await prisma.user.update({
        where: { id: targetUser.id },
        data: { role: normalizedRole },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      res.json({
        message: "User role updated",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.put(
  "/:id/status",
  authenticateToken,
  tenantGuard,
  authorizeRoles(...TENANT_ADMIN_ROLES),
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }
    const normalizedStatus = status.toUpperCase();
    if (!VALID_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        message: `Status must be one of ${VALID_STATUSES.join(", ")}`,
      });
    }

    try {
      const targetUser = await prisma.user.findFirst({
        where: { id: parseInt(id), tenantId: req.user.tenantId },
      });
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await prisma.user.update({
        where: { id: targetUser.id },
        data: { status: normalizedStatus },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
        },
      });

      res.json({
        message: "User status updated",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user by ID
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to update
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "NewSecurePass123!"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               department:
 *                 type: string
 *                 example: "Engineering"
 *               position:
 *                 type: string
 *                 example: "Senior Software Engineer"
 *               joinDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-01-15"
 *               leaveBalances:
 *                 $ref: '#/components/schemas/LeaveBalances'
 *               role:
 *                 type: string
 *                 enum: [employee, manager, admin]
 *                 example: manager
 *               avatar:
 *                 type: string
 *                 example: "https://example.com/new-avatar.jpg"
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or email already exists
 *       401:
 *         description: Access token required
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  authenticateToken,
  tenantGuard,
  [
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Invalid email"),
    body("department")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Department cannot be empty"),
    body("position")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Position cannot be empty"),
    validateLeaveBalances.optional(),
    body("role")
      .optional()
      .isIn(VALID_ROLES.map((r) => r.toLowerCase()))
      .withMessage("Invalid role"),
    body("joinDate")
      .optional()
      .isISO8601()
      .withMessage("joinDate must be a valid ISO-8601 date"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const requestingUserId = req.user.userId;

      if (parseInt(id) !== requestingUserId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      const targetUser = await prisma.user.findFirst({
        where: { id: parseInt(id), tenantId: req.user.tenantId },
      });

      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, joinDate, email, ...updateData } = req.body;

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      if (joinDate) {
        updateData.joinDate = new Date(joinDate);
      }

      if (email) {
        updateData.email = email.toLowerCase().trim();
      }

      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          department: true,
          position: true,
          joinDate: true,
          leaveBalances: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      if (error.code === "P2025") {
        return res.status(404).json({ message: "User not found" });
      }
      if (error.code === "P2002") {
        return res.status(400).json({ message: "Email already exists" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user by ID (admin only)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully"
 *       400:
 *         description: Cannot delete own account or user has related records
 *       401:
 *         description: Access token required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/:id",
  authenticateToken,
  tenantGuard,
  authorizeRoles(...TENANT_ADMIN_ROLES),
  async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.userId) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: parseInt(id), tenantId: req.user.tenantId },
    });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await prisma.user.delete({
      where: { id: targetUser.id },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    if (error.code === "P2003") {
      return res.status(400).json({
        message:
          "Cannot delete user because there are related records in the database",
      });
    }

    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/users/admins/list:
 *   get:
 *     summary: Get all admin users
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of admin users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Admin User"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "admin@example.com"
 *                   phone:
 *                     type: string
 *                     example: "+1234567890"
 *                   department:
 *                     type: string
 *                     example: "Administration"
 *                   position:
 *                     type: string
 *                     example: "System Administrator"
 *                   role:
 *                     type: string
 *                     enum: [admin]
 *                     example: admin
 *                   avatar:
 *                     type: string
 *                     example: "https://example.com/admin-avatar.jpg"
 *       401:
 *         description: Access token required
 *       500:
 *         description: Internal server error
 */
router.get("/admins/list", authenticateToken, async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: "admin",
        tenantId: req.user.tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        position: true,
        role: true,
        avatar: true,
      },
    });

    res.json(admins);
  } catch (error) {
    console.error("Error fetching admins:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// GET all users (protected, admin only)
router.get("/", authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log("User making request:", req.user); // Log the user making the request

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        position: true,
        joinDate: true,
        leaveBalance: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    console.log("Fetched users:", users.length); // Log how many users were fetched
    res.json(users);
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});
// GET single user (protected)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.userId;

    // Users can only access their own profile unless they're admin
    if (parseInt(id) !== requestingUserId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        position: true,
        joinDate: true,
        leaveBalance: true,
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

// CREATE new user (protected, admin only)
router.post(
  "/",
  authenticateToken,
  isAdmin,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("department").trim().notEmpty().withMessage("Department is required"),
    body("position").trim().notEmpty().withMessage("Position is required"),
    body("leaveBalance")
      .isInt({ min: 0 })
      .withMessage("Leave balance must be a positive number"),
    body("role")
      .isIn(["employee", "manager", "admin"])
      .withMessage("Invalid role"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { password, ...userData } = req.body;

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          joinDate: new Date(userData.joinDate) || new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          department: true,
          position: true,
          joinDate: true,
          leaveBalance: true,
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
// UPDATE user (protected)
router.put(
  "/:id",
  authenticateToken,
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
    body("leaveBalance")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Leave balance must be a positive number"),
    body("role")
      .optional()
      .isIn(["employee", "manager", "admin"])
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

      // Users can only update their own profile unless they're admin
      if (parseInt(id) !== requestingUserId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      const { password, joinDate, ...updateData } = req.body;

      // If password is being updated, hash it
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      // Convert joinDate string to JS Date for Prisma
      if (joinDate) {
        updateData.joinDate = new Date(joinDate);
      }

      // Admins can update role, others cannot
      if (req.user.role !== "admin" && updateData.role) {
        return res.status(403).json({ message: "Cannot update role" });
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
          leaveBalance: true,
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

// DELETE user (protected, admin only)
router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.userId) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

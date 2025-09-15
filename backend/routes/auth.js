const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /auth/login — Generate JWT token on successful login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Compare password
    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Create JWT payload (do NOT include password)
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    // Sign token (expires in 24 hours)
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h", // You can adjust: '1h', '7d', etc.
    });

    // Send token and user data (without password)
    const { password: pwd, ...userData } = user;

    res.json({
      message: "Login successful",
      token, // <-- This is what your frontend will store and send in Authorization header
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Internal server error.",
    });
  }
});

// Optional: POST /auth/logout (frontend just deletes token)
// No server-side logout needed for JWT unless you implement token blacklisting

// Optional: GET /auth/verify — Verify token and return user info
router.get("/verify", authenticateToken, (req, res) => {
  // req.user is set by authenticateToken middleware
  res.json({
    valid: true,
    user: req.user,
  });
});

// Middleware to verify JWT token (copied from your userRoutes for completeness)
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

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
}

module.exports = router;

require("dotenv").config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// -------------------- TOKEN HELPERS --------------------
const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

// -------------------- COOKIE OPTIONS --------------------
const getAccessTokenCookieOptions = () => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 24 * 60 * 60 * 1000,
  };
  if (process.env.NODE_ENV === "production" && process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }
  return options;
};

const getRefreshTokenCookieOptions = () => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  if (process.env.NODE_ENV === "production" && process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }
  return options;
};

// -------------------- LOGIN --------------------
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user1@gmail.com
 *               password:
 *                 type: string
 *                 example: user1234_password
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Email and password required
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required." });

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid)
      return res.status(401).json({ message: "Invalid credentials." });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.cookie("accessToken", accessToken, getAccessTokenCookieOptions());
    res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

    const { password: _, refreshToken: __, ...userData } = user;
    res.json({ message: "Login successful", user: userData });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// -------------------- REFRESH TOKEN --------------------
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access and refresh tokens
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       401:
 *         description: Refresh token required
 *       403:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ message: "Refresh token required" });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.refreshToken !== refreshToken)
      return res.status(403).json({ message: "Invalid refresh token" });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    res.cookie("accessToken", newAccessToken, getAccessTokenCookieOptions());
    res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());

    res.json({ message: "Tokens refreshed successfully" });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

// -------------------- LOGOUT --------------------
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      await prisma.user.update({
        where: { id: payload.userId },
        data: { refreshToken: null },
      });
    } catch (err) {
      console.warn("Logout warning:", err.message);
    }
  }

  res.clearCookie("accessToken", getAccessTokenCookieOptions());
  res.clearCookie("refreshToken", getRefreshTokenCookieOptions());

  res.json({ message: "Logged out successfully" });
});

// -------------------- AUTH MIDDLEWARE --------------------
function authenticateToken(req, res, next) {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: "Access token required" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err)
      return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

// -------------------- VERIFY --------------------
/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify user token and get user info
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token valid
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/verify", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
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

    if (!user)
      return res.status(404).json({ valid: false, message: "User not found" });

    res.json({
      valid: true,
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
  } catch (err) {
    console.error("Verify endpoint error:", err);
    res.status(500).json({ valid: false, message: "Internal server error" });
  }
});

// -------------------- HEALTH CHECK --------------------
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check if the server is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 */
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

module.exports = router;

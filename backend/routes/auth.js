require("dotenv").config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getSessionHintCookieOptions,
} = require("../utils/cookies");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const { DEFAULT_LEAVE_BALANCES } = require("../constants/leaveBalances");
const prisma = new PrismaClient();

const resolveTenantSlug = (inputSlug) => {
  const slug = inputSlug?.toString().trim().toLowerCase();
  if (slug) return slug;
  const defaultSlug = process.env.DEFAULT_TENANT_SLUG;
  if (defaultSlug) return defaultSlug.toString().trim().toLowerCase();
  return null;
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
  const { email, password, tenantSlug: tenantSlugInput } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required." });

  const tenantSlug = resolveTenantSlug(tenantSlugInput);
  if (!tenantSlug) {
    return res.status(400).json({
      message:
        "Tenant slug is required. Provide it in the request body or set DEFAULT_TENANT_SLUG.",
    });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return res
        .status(400)
        .json({ message: "Tenant not found. Check tenantSlug." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: normalizedEmail,
        },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid)
      return res.status(401).json({ message: "Invalid credentials." });

    const accessToken = generateAccessToken({
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      tenantId: user.tenantId,
      tenantSlug: user.tenant.slug,
    });
    const refreshToken = generateRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.cookie("accessToken", accessToken, getAccessTokenCookieOptions());
    res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());
    // ⭐ Set the JS-readable hint so the frontend knows a session exists
    res.cookie("auth_session", "1", getSessionHintCookieOptions());

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
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user || user.refreshToken !== refreshToken)
      return res.status(403).json({ message: "Invalid refresh token" });

    const newAccessToken = generateAccessToken({
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      tenantId: user.tenantId,
      tenantSlug: user.tenant.slug,
    });
    const newRefreshToken = generateRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    res.cookie("accessToken", newAccessToken, getAccessTokenCookieOptions());
    res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());
    // ⭐ Re-stamp the hint on every token refresh so it stays alive
    res.cookie("auth_session", "1", getSessionHintCookieOptions());

    res.json({ message: "Tokens refreshed successfully" });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

/**
 * @swagger
 * /api/auth/accept-invite:
 *   post:
 *     summary: Accept a tenant invitation
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - name
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invitation accepted and logged in
 *       400:
 *         description: Missing fields or invalid token
 *       500:
 *         description: Internal server error
 */
router.post("/accept-invite", async (req, res) => {
  const { token, name, password } = req.body;
  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    const invitation = await prisma.userInvitation.findUnique({
      where: { token },
    });

    if (
      !invitation ||
      invitation.used ||
      new Date(invitation.expiresAt) < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const normalizedEmail = invitation.email.toLowerCase().trim();
    const existingUser = await prisma.user.findFirst({
      where: {
        tenantId: invitation.tenantId,
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const normalizedName =
      name?.toString().trim() || invitation.metadata?.name || null;

    if (!normalizedName) {
      return res.status(400).json({ message: "Name is required" });
    }

    const resolvedJoinDate = invitation.metadata?.joinDate
      ? new Date(invitation.metadata.joinDate)
      : new Date();

    if (resolvedJoinDate && Number.isNaN(resolvedJoinDate.getTime())) {
      return res.status(400).json({ message: "Invalid join date" });
    }

    const finalPasswordHash = password
      ? await bcrypt.hash(password, 10)
      : invitation.passwordHash;

    if (!finalPasswordHash) {
      return res.status(400).json({ message: "Password is required" });
    }

    const newUser = await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        password: finalPasswordHash,
        tenantId: invitation.tenantId,
        role: invitation.role,
        joinDate: resolvedJoinDate,
        status: "ACTIVE",
        leaveBalances: { ...DEFAULT_LEAVE_BALANCES },
        department: invitation.metadata?.department || undefined,
        position: invitation.metadata?.position || undefined,
        phone: invitation.metadata?.phone || undefined,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    await prisma.userInvitation.update({
      where: { id: invitation.id },
      data: { used: true, usedAt: new Date() },
    });

    const accessToken = generateAccessToken({
      id: newUser.id,
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      tenantId: newUser.tenantId,
      tenantSlug: newUser.tenant.slug,
    });
    const refreshToken = generateRefreshToken(newUser.id);

    await prisma.user.update({
      where: { id: newUser.id },
      data: { refreshToken },
    });

    res.cookie("accessToken", accessToken, getAccessTokenCookieOptions());
    res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());
    res.cookie("auth_session", "1", getSessionHintCookieOptions());

    res.status(201).json({
      message: "Invitation accepted",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        tenantId: newUser.tenantId,
      },
    });
  } catch (error) {
    console.error("Accept invite error:", error);
    res.status(500).json({ message: "Failed to accept invite" });
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
  // ⭐ Clear the hint so the frontend skips /auth/verify on next load
  res.clearCookie("auth_session", getSessionHintCookieOptions());

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
    const user = await prisma.user.findFirst({
      where: { id: req.user.userId, tenantId: req.user.tenantId },
      select: {
        id: true,
        tenantId: true,
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

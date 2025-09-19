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
    { expiresIn: "24h" } // short-lived access token
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d", // refresh token lasts 7 days
  });
};

// -------------------- COOKIE OPTIONS --------------------
const getCookieOptions = () => {
  if (process.env.NODE_ENV === "production") {
    return {
      httpOnly: true,
      secure: true, // only HTTPS
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  } else {
    // Development (localhost)
    return {
      httpOnly: true,
      secure: false, // allow HTTP
      sameSite: "Lax", // allow cross-port requests
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }
};

// -------------------- LOGIN --------------------
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

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Set HttpOnly refresh cookie
    res.cookie("refreshToken", refreshToken, getCookieOptions());

    // Remove sensitive fields
    const { password: pwd, refreshToken: rt, ...userData } = user;

    res.json({
      message: "Login successful",
      token: accessToken,
      user: userData,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// -------------------- REFRESH TOKEN --------------------
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

    // Generate new tokens (rotation)
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update DB with new refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    // Set new refresh cookie
    res.cookie("refreshToken", newRefreshToken, getCookieOptions());

    res.json({ token: newAccessToken });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

// -------------------- LOGOUT --------------------
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
      console.warn("Logout warning: invalid refresh token", err.message);
    }
  }

  // Clear cookie
  res.clearCookie("refreshToken", getCookieOptions());
  res.json({ message: "Logged out successfully" });
});

// -------------------- AUTH MIDDLEWARE --------------------
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token required" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err)
      return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

// -------------------- VERIFY --------------------
router.get("/verify", authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;

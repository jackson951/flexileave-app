require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

// ------------------- CORS Setup -------------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://digititan-leave-app.vercel.app", // Main Vercel app
  "https://digititan-leave-app-production.up.railway.app", // Backend URL
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow mobile apps, Postman, etc.
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true, // Important for cookies
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// ------------------- Middleware -------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ------------------- Serve Static Files -------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// ------------------- Routes -------------------
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/auth");
const leaveRoutes = require("./routes/leaveRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/notifications", notificationRoutes);

// ------------------- Health Check -------------------
app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// ------------------- React SPA Fallback -------------------
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

// ------------------- Global Error Handler -------------------
app.use((err, req, res, next) => {
  console.error("Global error:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      message: "CORS policy: Request origin not allowed",
      origin: req.headers.origin,
    });
  }

  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ------------------- Start Server -------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Accepting requests from: ${allowedOrigins.join(", ")}`);
});

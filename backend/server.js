require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const { PrismaClient } = require("@prisma/client");

// Swagger configuration
const { swaggerUi, specs } = require("./config/swagger");

const app = express();
const prisma = new PrismaClient();
app.set("trust proxy", 1); // important for secure cookies

// ------------------- CORS Setup -------------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://digititan-leave-app.vercel.app",
  "http://localhost:5000", // swagger/testing
  "https://digititan-leave-app.onrender.com",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
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

// ------------------- Swagger Setup -------------------
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: "Digititan Leave App API Documentation",
    customCss: ".swagger-ui .topbar { display: none }",
  })
);

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
  console.log(`📄 Swagger UI available at http://localhost:${PORT}/api-docs`);
});

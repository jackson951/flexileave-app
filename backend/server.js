require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

const allowedOrigins = [
  "http://localhost:5173", // for local dev
  "https://digititan-leave-app.vercel.app", // your deployed frontend
  "https://digititan-leave-byk4dk808-jackson951s-projects.vercel.app", // the origin from the request
  "https://digititan-leave-he1i8zvmo-jackson951s-projects.vercel.app", // another deployment
];

// ------------------- CORS Setup -------------------
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Set to true if your API requires credentials (cookies, HTTP authentication)
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Specify allowed HTTP methods
  allowedHeaders: "Content-Type,Authorization", // Specify allowed headers
};

app.use(cors(corsOptions));

// ------------------- Middleware -------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve React build
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// ------------------- Routes -------------------
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/auth");
const leaveRoutes = require("./routes/leaveRoutes");

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// ------------------- React SPA fallback -------------------
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

// ------------------- Global Error Handler -------------------
app.use((err, req, res, next) => {
  console.error("Global error:", err.stack);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      message: "CORS policy: Request origin not allowed",
      error: process.env.NODE_ENV === "development" ? err.message : {},
    });
  }

  res.status(500).json({
    message: "Internal server error.",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// ------------------- Start Server -------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Accepting requests from configured origins`);
  console.log(`✅ File uploads directory: ${path.join(__dirname, "uploads")}`);
});

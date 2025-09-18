// ------------------- Load Environment -------------------
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser"); // <-- Needed for cookies
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

// ------------------- CORS Setup -------------------
const corsOptions = {
  origin: "http://localhost:5173", // React dev server
  credentials: true, // Allow cookies and authorization headers
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // Preflight handling

// Additional headers (redundant but safe)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

// ------------------- Middleware -------------------
app.use(express.json()); // Parse JSON requests
app.use(cookieParser()); // Parse cookies

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ------------------- Routes -------------------
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/auth");
const leaveRoutes = require("./routes/leaveRoutes");

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);

// ------------------- Test Route -------------------
app.get("/", (req, res) => {
  res.send("API is running! ✅ CORS configured.");
});

// ------------------- Global Error Handler -------------------
app.use((err, req, res, next) => {
  console.error("Global error:", err.stack);
  res.status(500).json({ message: "Internal server error." });
});

// ------------------- Start Server -------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Accepting requests from: http://localhost:5173`);
  console.log(`✅ File uploads directory: ${path.join(__dirname, "uploads")}`);
});

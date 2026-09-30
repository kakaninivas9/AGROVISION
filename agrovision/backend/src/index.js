require("dotenv").config({ override: true });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ── Security & Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || "*",
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Rate Limiting (For other routes) ──────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased globally just in case
  message: { error: "Too many requests, please try again later." },
});

// ── High Frequency IoT Route (Bypasses Rate Limiter) ──────────────────────────
app.use("/api/iot", require("./routes/iot"));

app.use("/api/", limiter);

// Stricter rate limit for detect (AI calls are expensive)
const detectLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: "Too many detection requests. Please wait a minute." },
});
app.use("/api/detect", detectLimiter);

// ── Hugging Face Proxy Route (Direct Access) ──────────────────────────────────
app.use("/api", require("./routes/detectRoutes"));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",      require("./routes/auth"));
app.use("/api/detect",    require("./routes/detect"));
app.use("/api/weather",   require("./routes/weather"));
app.use("/api/chat",      require("./routes/chat"));
app.use("/api/schemes",   require("./routes/schemes"));
app.use("/api/proposals", require("./routes/proposals"));
app.use("/api/proposals", require("./routes/proposals"));

// ── Health Check ───────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    service: "AgroVision API",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n🌱 AgroVision API running on http://localhost:${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;

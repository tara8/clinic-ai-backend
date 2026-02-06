import express from "express";
import rateLimit from "express-rate-limit";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();

// ----------------------
// 🔐 Global Rate Limiter
// ----------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                // limit each IP
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply BEFORE all routes
app.use(limiter);

// ----------------------
// Routes
// ----------------------
app.use("/v1/analytics", analyticsRoutes);
// ... other routes

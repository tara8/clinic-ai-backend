import express from "express";
import rateLimit from "express-rate-limit";

import analyticsRoutes from "./routes/analytics.routes.js";
import clinicPromptRoutes from "./routes/clinicPrompt.routes.js";

const app = express();

// ✅ REQUIRED: parse JSON bodies (for VAPI POST tool calls)
app.use(express.json());

app.use((req, res, next) => {
  console.log("🌐 Incoming request:", req.method, req.originalUrl);
  next();
});

// 🔐 Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Routes
app.use("/v1", clinicPromptRoutes);
app.use("/v1/analytics", analyticsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

import express from "express";
import rateLimit from "express-rate-limit";

import analyticsRoutes from "./routes/analytics.routes.js";
import clinicPromptRoutes from "./routes/clinicPrompt.routes.js";

const app = express();

// 🔐 Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// ✅ THIS LINE IS CRITICAL
app.use("/v1", clinicPromptRoutes);

// other routes
app.use("/v1/analytics", analyticsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

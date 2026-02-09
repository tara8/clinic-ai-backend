import express from "express";
import rateLimit from "express-rate-limit";

import analyticsRoutes from "./routes/analytics.routes.js";
import clinicPromptRoutes from "./routes/clinicPrompt.routes.js";
import clinicPromptDashboardRoutes from "./routes/clinicPrompt.dashboard.routes.js";


const app = express();

// ✅ REQUIRED: parse JSON bodies (for VAPI POST tool calls)
app.use(express.json());

//webhook route
app.post("/vapi/webhook", (req, res) => {
  const msg = req.body?.message;

  const eventType = msg?.type;

  console.log("📞 VAPI event type:", eventType);

  // This is the ONLY event you want
  if (eventType !== "end-of-call-report") {
    return res.json({ ok: true });
  }

  console.log("✅ End-of-call report received");

  // Useful data (you will need this next)
  const transcript = msg?.transcript;
  const call = msg?.call;
  const assistantId = call?.assistantId;
  const endedReason = msg?.endedReason;

  // 🔜 SMS logic will be added here next

  res.json({ ok: true });
});




//

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
app.use("/v1", clinicPromptDashboardRoutes);
app.use("/v1/analytics", analyticsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

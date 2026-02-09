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
  const payload = req.body;

  // Normalize payload to an array
  const events = Array.isArray(payload) ? payload : [payload];

  for (const event of events) {
    const eventType = event?.type;
    console.log("📞 VAPI event type:", eventType);

    if (eventType === "call.ended") {
      console.log("✅ Call ended event received");
      // 🔜 SMS trigger logic will go here
    }
  }

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

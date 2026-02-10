import express from "express";
import rateLimit from "express-rate-limit";

import analyticsRoutes from "./routes/analytics.routes.js";
import clinicPromptRoutes from "./routes/clinicPrompt.routes.js";
import clinicPromptDashboardRoutes from "./routes/clinicPrompt.dashboard.routes.js";
import { sendBookingSms } from "./utils/sendSms.js";
import { pool } from "./db.js";

const app = express();

// ✅ REQUIRED when behind Render / proxies
app.set("trust proxy", 1);

// ✅ Parse JSON bodies (VAPI + tools)
app.use(express.json());

// 🔎 Request logger (keep early for visibility)
app.use((req, res, next) => {
  console.log("🌐 Incoming request:", req.method, req.originalUrl);
  next();
});

// 🔐 Rate limiter (applies to API routes; webhook is intentionally before this)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

/* =========================
   VAPI WEBHOOK (NO RATE LIMIT)
========================= */
app.post("/vapi/webhook", async (req, res) => {
  try {
    const msg = req.body?.message;
    const eventType = msg?.type;

    if (eventType !== "end-of-call-report") {
      return res.json({ ok: true });
    }

    console.log("✅ End-of-call report received");

    const transcript = msg?.transcript || "";
    const assistantId = msg?.call?.assistantId;
    const customerPhone =
        msg?.call?.customer?.number ||
        msg?.artifact?.variableValues?.phone ||
        msg?.artifact?.variableValues?.phoneNumber;


    if (!assistantId || !customerPhone) {
      return res.json({ ok: true });
    }

    // 🔎 Simple booking-intent check (v1)
    const bookingIntent = /book|appointment|schedule/i.test(transcript);
    if (!bookingIntent) {
      return res.json({ ok: true });
    }

    // 🔁 Find clinic by assistantId
    const { rows } = await pool.query(
      `
      SELECT booking_link
      FROM clinic_config
      WHERE vapi_assistant_id = $1
      `,
      [assistantId]
    );

    const bookingLink = rows[0]?.booking_link;
    if (!bookingLink) {
      return res.json({ ok: true });
    }

    await sendBookingSms({
      to: customerPhone,
      bookingLink,
      clinicName: "Your Clinic",
    });

    console.log("📩 Booking SMS sent to", customerPhone);
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Webhook SMS error:", err.message);
    // Never fail a webhook
    res.json({ ok: true });
  }
});

/* =========================
   RATE-LIMITED API ROUTES
========================= */
app.use(limiter);
app.use("/v1", clinicPromptRoutes);
app.use("/v1", clinicPromptDashboardRoutes);
app.use("/v1/analytics", analyticsRoutes);

/* =========================
   SERVER START
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import twilio from "twilio";

import { pool } from "./db.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { sendBookingSms } from "./utils/sendSms.js";


import authRoutes from "./routes/auth.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";


dotenv.config();

const app = express();

/* =========================
   CORE MIDDLEWARE
========================= */

// ✅ REQUIRED for JSON bodies
app.use(express.json());

const allowedOrigins = [
  "https://app.voica.ca"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server, health checks, Render pings
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);

/* =========================
   HEALTH CHECK
========================= */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* =========================
   AUTH ROUTES (JWT)
========================= */
app.use("/auth", authRoutes);
/* =========================
   Create the webhook endpoint
========================= */

app.post("/vapi/webhook", async (req, res) => {
  try {
    // 🔐 Verify VAPI webhook secret
    const signature = req.headers["x-vapi-signature"];
    if (signature !== process.env.VAPI_WEBHOOK_SECRET) {
      return res.status(401).json({ ok: false });
    }

    const event = req.body;

    // We only care about call-ended events
    if (event.type !== "call.ended") {
      return res.json({ ok: true });
    }

    const {
      phoneNumberId,
      customer,
      analysis,
    } = event.call || {};

    const customerPhone = customer?.number;
    const bookingIntent = analysis?.intent === "booking";

    // Only send SMS if booking intent happened
    if (!customerPhone || !bookingIntent) {
      return res.json({ ok: true });
    }

    // Find clinic by VAPI phone number
    const { rows } = await pool.query(
      `
      SELECT booking_link
      FROM clinic_config
      WHERE vapi_phone_number_id = $1
      `,
      [phoneNumberId]
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

    res.json({ ok: true });

  } catch (err) {
    console.error("❌ VAPI webhook error:", err.message);
    res.json({ ok: true }); // never fail webhook
  }
});

/* =========================
   endpoint to trigger SMS (JWT-protected)
========================= */
app.post("/v1/sms/booking-link", requireAuth, async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number required" });
  }

  const { rows } = await pool.query(
    `
    SELECT booking_link
    FROM clinic_config
    WHERE clinic_id = $1
    `,
    [req.clinicId]
  );

  const bookingLink = rows[0]?.booking_link;

  if (!bookingLink) {
    return res.status(400).json({ error: "No booking link set" });
  }

  await sendBookingSms({
    to: phone,
    bookingLink,
    clinicName: "Your Clinic",
  });

  res.json({ success: true });
});

/* =========================
   DASHBOARD (JWT ONLY)
========================= */
app.get("/v1/dashboard/clinic", requireAuth, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM clinic_config WHERE clinic_id = $1",
    [req.clinicId]
  );

  res.json(result.rows[0]);
});

app.put("/v1/dashboard/clinic", requireAuth, async (req, res) => {
  const {
    booking_link,
    prompt_tone,
    supported_languages,
    services,
    escalation_rule,
  } = req.body;

  await pool.query(
    `UPDATE clinic_config
     SET booking_link = $1,
         prompt_tone = $2,
         supported_languages = $3,
         services = $4,
         escalation_rule = $5
     WHERE clinic_id = $6`,
    [
      booking_link,
      prompt_tone,
      supported_languages,
      services,
      escalation_rule,
      req.clinicId,
    ]
  );

  res.json({ success: true });
});

/* =========================
   ANALYTICS (JWT ONLY)
========================= */
app.use("/v1/analytics", analyticsRoutes);

/* =========================
   GLOBAL ERROR HANDLER (IMPORTANT)
========================= */
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS blocked" });
  }

  res.status(500).json({ error: "Internal server error" });
});


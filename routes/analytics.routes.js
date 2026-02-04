import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { pool } from "../db.js";

const router = express.Router();

/**
 * SUMMARY METRICS
 * GET /v1/analytics/summary
 */
router.get("/summary", requireAuth, async (req, res) => {
  const clinicId = req.clinicId;

  const { rows } = await pool.query(
    `
    SELECT
      COUNT(*) FILTER (WHERE event_type = 'call_started') AS calls_total,
      COUNT(*) FILTER (WHERE event_type = 'call_missed') AS calls_missed,
      COUNT(*) FILTER (WHERE event_type = 'sms_sent') AS sms_sent
    FROM call_events
    WHERE clinic_id = $1
      AND created_at >= NOW() - INTERVAL '7 days'
    `,
    [clinicId]
  );

  res.json(rows[0]);
});

/**
 * CALL LOGS
 * GET /v1/analytics/calls
 */
router.get("/calls", requireAuth, async (req, res) => {
  const clinicId = req.clinicId;

  const { rows } = await pool.query(
    `
    SELECT id, event_type, payload, created_at
    FROM call_events
    WHERE clinic_id = $1
    ORDER BY created_at DESC
    LIMIT 50
    `,
    [clinicId]
  );

  res.json(rows);
});

/**
 * CONVERSION METRICS
 * GET /v1/analytics/conversions
 */
router.get("/conversions", requireAuth, async (req, res) => {
  const clinicId = req.clinicId;

  const { rows } = await pool.query(
    `
    SELECT
      COUNT(*) FILTER (WHERE event_type = 'appointment_booked') AS booked,
      COUNT(*) FILTER (WHERE event_type = 'sms_sent') AS sms_sent,
      COUNT(*) FILTER (WHERE event_type = 'call_escalated') AS escalated,
      COUNT(*) FILTER (WHERE event_type = 'call_missed') AS missed
    FROM call_events
    WHERE clinic_id = $1
      AND created_at >= NOW() - INTERVAL '7 days'
    `,
    [clinicId]
  );

  const r = rows[0];

  const totalLeads =
    Number(r.booked) +
    Number(r.sms_sent) +
    Number(r.escalated) +
    Number(r.missed);

  const conversionRate =
    totalLeads > 0
      ? ((Number(r.booked) / totalLeads) * 100).toFixed(1)
      : 0;

  res.json({
    ...r,
    totalLeads,
    conversionRate,
  });
});




export default router;

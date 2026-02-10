import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// 🔒 Minimal safe fallback prompt (SMS-first)
router.get("/clinics/by-phone/:phoneNumberId/prompt", async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];

    const DEFAULT_SYSTEM_PROMPT = `
You are a virtual receptionist.

Your ONLY job is to collect a phone number so the clinic can send a booking link by text message.

Flow:
1) Ask if the caller wants the booking link by text message.
2) If yes:
   - Ask for the phone number
   - Save it as "phone_number"
   - Confirm it once
   - Say they will receive a text shortly
   - End the call
3) If no:
   - Say the booking link slowly and clearly
   - End the call

Do NOT book appointments.
Do NOT ask for appointment details.
Do NOT mention system issues.
`;

    if (apiKey !== process.env.VAPI_API_KEY) {
      return res.json({ system_prompt: DEFAULT_SYSTEM_PROMPT });
    }

    const { phoneNumberId } = req.params;

    const { rows } = await pool.query(
      `SELECT system_prompt FROM clinic_config WHERE vapi_phone_number_id = $1`,
      [phoneNumberId]
    );

    return res.json({
      system_prompt: rows[0]?.system_prompt || DEFAULT_SYSTEM_PROMPT
    });

  } catch (err) {
    console.error("❌ Prompt fetch error:", err.message);
    return res.json({ system_prompt: DEFAULT_SYSTEM_PROMPT });
  }
});


router.get("/clinics/by-phone/prompt", async (req, res) => {
  const DEFAULT_SYSTEM_PROMPT = `You are a virtual receptionist...`;

  try {
    const apiKey = req.headers["x-api-key"];
    if (apiKey !== process.env.VAPI_API_KEY) {
      return res.json({ system_prompt: DEFAULT_SYSTEM_PROMPT });
    }

    // VAPI sends variables here
    const phoneNumberId = req.query.phoneNumberId;

    if (!phoneNumberId) {
      return res.json({ system_prompt: DEFAULT_SYSTEM_PROMPT });
    }

    const { rows } = await pool.query(
      `SELECT system_prompt FROM clinic_config WHERE vapi_phone_number_id = $1`,
      [phoneNumberId]
    );

    return res.json({
      system_prompt: rows[0]?.system_prompt || DEFAULT_SYSTEM_PROMPT
    });

  } catch (err) {
    return res.json({ system_prompt: DEFAULT_SYSTEM_PROMPT });
  }
});

export default router;

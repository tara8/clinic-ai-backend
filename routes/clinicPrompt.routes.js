import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/clinics/by-phone/:phoneNumberId/prompt", async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (apiKey !== process.env.VAPI_API_KEY) {
      return res.status(200).json({
        system_prompt: "You are a polite clinic receptionist. Please escalate the call."
      });
    }

    const { phoneNumberId } = req.params;

    const { rows } = await pool.query(
      `
      SELECT system_prompt
      FROM clinic_config
      WHERE vapi_phone_number_id = $1
      `,
      [phoneNumberId]
    );

    if (rows.length === 0 || !rows[0].system_prompt) {
      return res.status(200).json({
        system_prompt: "You are a polite clinic receptionist. Please escalate the call."
      });
    }

    res.status(200).json({
      system_prompt: rows[0].system_prompt
    });

  } catch (err) {
    console.error("❌ Prompt fetch error:", err.message);
    res.status(200).json({
      system_prompt: "You are a polite clinic receptionist. Please escalate the call."
    });
  }
});



export default router;

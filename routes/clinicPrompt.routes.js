import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/clinics/:clinic_id/prompt", async (req, res) => {
  try {
    const { clinic_id } = req.params;

    const { rows } = await pool.query(
      `SELECT system_prompt FROM clinic_config WHERE clinic_id = $1`,
      [clinic_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ system_prompt: null });
    }

    res.json({
      system_prompt: rows[0].system_prompt
    });

  } catch (err) {
    console.error("❌ Prompt fetch error:", err.message);
    res.status(500).json({ system_prompt: null });
  }
});

export default router;

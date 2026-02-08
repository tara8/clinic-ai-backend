// routes/clinicPrompt.dashboard.routes.js
import express from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.put("/v1/dashboard/clinic/prompt", requireAuth, async (req, res) => {
  const { system_prompt } = req.body;

  if (!system_prompt || system_prompt.length < 50) {
    return res.status(400).json({ error: "Prompt too short" });
  }

  await pool.query(
    `
    UPDATE clinic_config
    SET system_prompt = $1
    WHERE clinic_id = $2
    `,
    [system_prompt, req.clinicId]
  );

  res.json({ success: true });
});

export default router;

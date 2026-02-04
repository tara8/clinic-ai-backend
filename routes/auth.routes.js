import express from "express";
import { hashPassword, comparePassword, signToken } from "../auth/auth.utils.js";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

/**
 * LOGIN
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { rows } = await pool.query(
    `SELECT * FROM clinic_users WHERE email = $1`,
    [email]
  );

  const user = rows[0];
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken({
    userId: user.id,
    clinicId: user.clinic_id,
    role: user.role,
  });

  res.json({ token });
});

/**
 * WHO AM I
 */
router.get("/me", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, email, role FROM clinic_users WHERE id = $1`,
    [req.userId]
  );

  res.json({
    user: rows[0],
    clinicId: req.clinicId,
  });
});

export default router;

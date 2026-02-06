import express from "express";
import { comparePassword, signToken } from "../auth/auth.utils.js";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

/**
 * LOGIN
 * POST /auth/login
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

  // ✅ JWT with expiration (15 minutes)
  const token = signToken(
    {
      userId: user.id,
      clinicId: user.clinic_id,
      role: user.role,
    },
    { expiresIn: "15m" }
  );

  res.json({ token });
});

/**
 * WHO AM I
 * GET /auth/me
 */
router.get("/me", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, email, role FROM clinic_users WHERE id = $1`,
    [req.userId]
  );

  if (rows.length === 0) {
    return res.status(401).json({ error: "User not found" });
  }

  res.json({
    user: rows[0],
    clinicId: req.clinicId,
  });
});

export default router;

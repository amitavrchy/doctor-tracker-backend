import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { login, logout, me } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/auth";
import { email } from "../validators/common";

const router = Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => {
    const error = { code: "RATE_LIMITED", message: "Too many login attempts" };
    res.status(429).json({ success: false, error });
  },
});

router.post(
  "/login",
  limiter,
  validate({
    body: z
      .object({
        email,
        password: z
          .string()
          .min(1)
          .refine((v) => Buffer.byteLength(v, "utf8") <= 72, "Password exceeds bcrypt limit"),
      })
      .strict(),
  }),
  login,
);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

export default router;

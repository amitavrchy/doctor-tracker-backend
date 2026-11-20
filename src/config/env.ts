import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });
const schema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    MONGODB_URI: z.string().min(1),
    MONGODB_DB_NAME: z.string().trim().min(1).default("doctor-tracker"),
    JWT_SECRET: z.string().min(32),
    CLIENT_URL: z.string().default("http://localhost:3000"),
    COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
    COOKIE_SECURE: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
    TRUST_PROXY: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
    ADMIN_EMAIL: z.string().optional(),
    ADMIN_PASSWORD: z.string().optional(),
    ADMIN_NAME: z.string().optional(),
  })
  .refine((v) => v.COOKIE_SAME_SITE !== "none" || v.COOKIE_SECURE, {
    message: "SameSite=None requires a secure cookie",
  });
const parsed = schema.parse(process.env);
export const env = {
  ...parsed,
  CLIENT_ORIGINS: parsed.CLIENT_URL.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};

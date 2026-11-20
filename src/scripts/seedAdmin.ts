import bcrypt from "bcryptjs";
import { z, ZodError } from "zod";
import { env } from "../config/env";
import { connectDB, disconnectDB } from "../config/db";
import { User } from "../models/User";

async function seed() {
  const values = z
    .object({
      ADMIN_EMAIL: z.email().transform((v) => v.toLowerCase()),
      ADMIN_PASSWORD: z
        .string()
        .min(12)
        .max(72)
        .refine(
          (v) => Buffer.byteLength(v, "utf8") <= 72,
          "Password exceeds bcrypt's 72-byte limit",
        ),
      ADMIN_NAME: z.string().trim().min(1),
    })
    .parse(env);

  await connectDB();
  await User.findOneAndUpdate(
    { email: values.ADMIN_EMAIL },
    {
      $set: {
        name: values.ADMIN_NAME,
        email: values.ADMIN_EMAIL,
        passwordHash: await bcrypt.hash(values.ADMIN_PASSWORD, 12),
        role: "admin",
      },
      $inc: { tokenVersion: 1 },
    },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  console.log("Admin created or updated");
}

seed()
  .catch((error: unknown) => {
    if (error instanceof ZodError) {
      for (const issue of error.issues) {
        console.error(`${issue.path.join(".")}: ${issue.message}`);
      }
    } else {
      console.error("Admin seed failed; check configuration and database connectivity.");
    }
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());

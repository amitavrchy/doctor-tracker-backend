import { z } from "zod";
import { listBase, checkDates, text, email } from "./common";
export const doctorBody = z
  .object({ name: text, specialization: text, hospital: text, phone: text, email })
  .strict();
export const doctorQuery = z
  .object({
    ...listBase,
    specialization: text.optional(),
    hospital: text.optional(),
    sortBy: z.enum(["createdAt", "name", "specialization", "hospital"]).default("createdAt"),
  })
  .strict()
  .refine(checkDates, "from must be before to");

import { z } from "zod";
import { listBase, checkDates, text, email, id } from "./common";
const fields = {
  name: text,
  age: z.number().int().min(0).max(150),
  gender: z.enum(["male", "female", "other"]),
  phone: text,
  email: email.optional(),
  condition: text,
  admissionDate: z.iso.datetime({ offset: true }).or(z.iso.date()),
  notes: z.string().trim().max(5000).optional(),
  status: z.enum(["active", "discharged"]).optional(),
};
export const patientBody = z.object(fields).strict();
export const patientPatch = z
  .object({ ...fields, doctor: id })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "Provide at least one field");
export const patientQuery = z
  .object({
    ...listBase,
    doctor: id.optional(),
    condition: text.optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    status: z.enum(["active", "discharged"]).optional(),
    sortBy: z.enum(["createdAt", "admissionDate", "name", "condition"]).default("createdAt"),
  })
  .strict()
  .refine(checkDates, "from must be before to");

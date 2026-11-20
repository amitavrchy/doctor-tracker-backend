import { z } from "zod";
export const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
export const idParams = z.object({ id });
export const patientParams = z.object({ id, patientId: id });
const date = z.iso.datetime({ offset: true }).or(z.iso.date());
export const listBase = {
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(100).optional(),
  from: date.optional(),
  to: date.optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
};
export const checkDates = (v: { from?: string; to?: string }) =>
  !v.from || !v.to || new Date(v.from) <= new Date(v.to);
export const text = z.string().trim().min(1).max(200);
export const email = z
  .email()
  .max(254)
  .transform((v) => v.toLowerCase());

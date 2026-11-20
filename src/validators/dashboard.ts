import { z } from "zod";
import {
  bucketLabel,
  bucketLabels,
  endOfLocalDate,
  startOfLocalDate,
} from "../services/dashboardDates";

const date = z.iso.datetime({ offset: true }).or(z.iso.date());
export const dashboardQuery = z
  .object({
    from: date.optional(),
    to: date.optional(),
    granularity: z.enum(["day", "week", "month"]).default("month"),
    tz: z
      .string()
      .default("UTC")
      .refine((tz) => {
        try {
          if (/^[+-]/.test(tz)) return false;
          new Intl.DateTimeFormat("en", { timeZone: tz });
          return true;
        } catch {
          return false;
        }
      }, "Invalid IANA timezone"),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict()
  .transform((query, ctx) => {
    const isDateOnly = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
    try {
      const to = query.to
        ? isDateOnly(query.to)
          ? endOfLocalDate(query.to, query.tz)
          : new Date(query.to)
        : new Date();
      const yearAgo = new Date(to);
      yearAgo.setUTCFullYear(yearAgo.getUTCFullYear() - 1);
      const from = query.from
        ? isDateOnly(query.from)
          ? startOfLocalDate(query.from, query.tz)
          : new Date(query.from)
        : startOfLocalDate(bucketLabel(yearAgo, query.tz, query.granularity), query.tz);
      return { ...query, from, to };
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
      ctx.addIssue({ code: "custom", message: "Date does not exist in the requested timezone" });
      return z.NEVER;
    }
  })
  .superRefine((query, ctx) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: query.tz });
    } catch {
      return;
    }
    if (query.from > query.to) {
      ctx.addIssue({ code: "custom", message: "from must be before to", path: ["from"] });
    } else if (bucketLabels(query.from, query.to, query.tz, query.granularity).length > 366) {
      ctx.addIssue({ code: "custom", message: "Range exceeds 366 buckets", path: ["from"] });
    }
  });

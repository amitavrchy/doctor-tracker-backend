import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../utils/ApiError";

type Schemas = { body?: ZodType; query?: ZodType; params?: ZodType };

/**
 * Validates req.body / req.query / req.params with zod schemas.
 * Parsed values are stored on res.locals.validated (Express 5's req.query is read-only);
 * the parsed body also replaces req.body.
 */
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, res, next) => {
    const validated: Record<string, unknown> = {};
    for (const key of ["body", "query", "params"] as const) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        return next(ApiError.badRequest("Validation failed", result.error.issues));
      }
      validated[key] = result.data;
    }
    if ("body" in validated) req.body = validated.body;
    res.locals.validated = validated;
    next();
  };

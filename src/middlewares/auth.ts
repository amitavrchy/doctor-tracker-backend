import type { RequestHandler } from "express";

/**
 * Auth guard placeholder.
 * TODO: verify the JWT (jsonwebtoken) from the Authorization header and attach the user to req.
 */
export const requireAuth: RequestHandler = (_req, _res, next) => {
  next();
};

import type { RequestHandler } from "express";
import { env } from "../config/env";
import { authenticate } from "../services/auth.service";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const requireAuth: RequestHandler = asyncHandler(async (req, res, next) => {
  const header = req.header("authorization");
  const token = header ? /^Bearer\s+(\S+)$/i.exec(header)?.[1] : req.cookies?.token;
  if (!token) throw ApiError.unauthorized();

  const user = await authenticate(token);
  const origin = req.get("origin");
  // Cross-site cookies require an origin check on browser mutations to prevent CSRF.
  if (
    !header &&
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    origin &&
    !env.CLIENT_ORIGINS.includes(origin)
  ) {
    throw ApiError.forbidden("Origin not allowed");
  }
  res.locals.user = user;
  next();
});

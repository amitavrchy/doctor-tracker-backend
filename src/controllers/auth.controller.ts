import type { CookieOptions } from "express";
import { env } from "../config/env";
import * as authService from "../services/auth.service";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: "/",
};

export const login = asyncHandler(async (req, res) => {
  const origin = req.get("origin");
  if (origin && !env.CLIENT_ORIGINS.includes(origin))
    throw ApiError.forbidden("Origin not allowed");
  const { token, user } = await authService.login(req.body.email, req.body.password);
  res.cookie("token", token, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
  // Keep the JWT inaccessible to browser JavaScript; bearer clients can use a securely obtained token.
  sendSuccess(res, user);
});

export const logout = asyncHandler(async (_req, res) => {
  await authService.logout(res.locals.user._id);
  res.clearCookie("token", cookieOptions);
  sendSuccess(res, null);
});

export const me = asyncHandler(async (_req, res) => {
  sendSuccess(res, res.locals.user);
});

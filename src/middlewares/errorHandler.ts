import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500;
  let message = "Internal server error";
  let details: unknown;
  if (err instanceof ApiError) {
    status = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    status = 400;
    message = "Validation failed";
    details = err.issues;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = "Validation failed";
    details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err instanceof jwt.JsonWebTokenError) {
    status = 401;
    message = "Invalid or expired token";
  } else if (err?.code === 11000) {
    status = 409;
    message = "Duplicate value";
    details = err.keyValue;
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON";
  }
  if (status >= 500) console.error("Internal server error");

  const codes: Record<number, string> = {
    400: "VALIDATION_ERROR",
    401: "UNAUTHENTICATED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    429: "RATE_LIMITED",
    500: "INTERNAL_ERROR",
  };
  const error = {
    code: codes[status] || "ERROR",
    message,
    ...(details !== undefined ? { details } : {}),
  };
  res.status(status).json({ success: false, error });
};

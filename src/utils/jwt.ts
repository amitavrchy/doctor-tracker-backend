import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "./ApiError";

export function signToken(userId: string, version: number) {
  return jwt.sign({ version }, env.JWT_SECRET, { subject: userId, expiresIn: "8h" });
}

export function verifyToken(token: string) {
  const payload = jwt.verify(token, env.JWT_SECRET);
  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    !/^[a-f\d]{24}$/i.test(payload.sub)
  ) {
    throw ApiError.unauthorized();
  }
  return payload;
}

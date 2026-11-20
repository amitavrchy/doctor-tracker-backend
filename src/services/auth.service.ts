import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { signToken, verifyToken } from "../utils/jwt";

const DUMMY_HASH = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6Ttx5YjWbt3ANFwh6eH7S0sDDV/7u";

export async function login(email: string, password: string) {
  const user = await User.findOne({ email }).select("+passwordHash +tokenVersion");
  // Always perform a bcrypt comparison, including for an unknown account.
  const match = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !match) throw ApiError.unauthorized("Invalid email or password");
  if (user.role !== "admin") throw ApiError.forbidden();

  return {
    token: signToken(String(user._id), user.tokenVersion),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

export async function authenticate(token: string) {
  const payload = verifyToken(token);
  const user = await User.findById(payload.sub).select("+tokenVersion").lean();
  if (!user || payload.version !== user.tokenVersion) throw ApiError.unauthorized();
  if (user.role !== "admin") throw ApiError.forbidden();
  return { _id: user._id, name: user.name, email: user.email, role: user.role };
}

export async function logout(userId: string) {
  await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
}

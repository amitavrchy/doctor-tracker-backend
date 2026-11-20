import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    tokenVersion: { type: Number, default: 0, select: false },
    role: { type: String, enum: ["admin"], default: "admin", required: true },
  },
  { timestamps: true },
);

export const User = model("User", schema);

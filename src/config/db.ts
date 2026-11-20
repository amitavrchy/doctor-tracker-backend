import mongoose from "mongoose";
import { env } from "./env";

export async function connectDB(): Promise<void> {
  mongoose.connection.on("connected", () => console.log("MongoDB connected"));
  mongoose.connection.on("error", () => console.error("MongoDB connection error"));
  mongoose.connection.on("disconnected", () => console.warn("MongoDB disconnected"));

  try {
    await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
  } catch {
    throw new Error("MongoDB connection failed");
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

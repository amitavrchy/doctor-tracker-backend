import type { Request, Response } from "express";
import mongoose from "mongoose";

const dbStates: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export const getHealth = (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      db: dbStates[mongoose.connection.readyState] ?? "unknown",
    },
  });
};

import { Router } from "express";
import healthRoutes from "./health.routes";

const router = Router();

router.use("/health", healthRoutes);
// TODO: router.use("/auth", authRoutes);
// TODO: router.use("/doctors", doctorRoutes);
// TODO: router.use("/patients", patientRoutes);
// TODO: router.use("/dashboard", dashboardRoutes);

export default router;

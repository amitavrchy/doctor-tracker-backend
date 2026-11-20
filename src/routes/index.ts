import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import doctorRoutes from "./doctor.routes";
import patientRoutes from "./patient.routes";
import dashboardRoutes from "./dashboard.routes";
import { requireAuth } from "../middlewares/auth";

const router = Router();
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use(requireAuth);
router.use("/dashboard", dashboardRoutes);
router.use("/doctors", doctorRoutes);
router.use("/patients", patientRoutes);

export default router;

import { Router } from "express";
import { getDashboard } from "../controllers/dashboard.controller";
import { validate } from "../middlewares/validate";
import { dashboardQuery } from "../validators/dashboard";

const router = Router();
router.get("/", validate({ query: dashboardQuery }), getDashboard);
export default router;

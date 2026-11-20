import * as dashboardService from "../services/dashboard.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const getDashboard = asyncHandler(async (_req, res) => {
  sendSuccess(res, await dashboardService.getDashboard(res.locals.validated.query));
});

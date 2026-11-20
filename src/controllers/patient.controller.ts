import * as patientService from "../services/patient.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendPage } from "../utils/response";

export const listPatients = asyncHandler(async (_req, res) => {
  const { query, params } = res.locals.validated;
  sendPage(res, await patientService.listPatients(query, params?.id));
});

export const getPatient = asyncHandler(async (_req, res) => {
  sendSuccess(res, await patientService.getPatient(res.locals.validated.params.id));
});

export const updatePatient = asyncHandler(async (req, res) => {
  sendSuccess(res, await patientService.updatePatient(res.locals.validated.params.id, req.body));
});

export const deletePatient = asyncHandler(async (_req, res) => {
  await patientService.deletePatient(res.locals.validated.params.id);
  sendSuccess(res, null);
});

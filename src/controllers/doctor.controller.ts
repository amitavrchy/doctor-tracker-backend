import * as doctorService from "../services/doctor.service";
import * as patientService from "../services/patient.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendPage } from "../utils/response";

export const createDoctor = asyncHandler(async (req, res) => {
  sendSuccess(res, await doctorService.createDoctor(req.body), 201);
});

export const listDoctors = asyncHandler(async (_req, res) => {
  sendPage(res, await doctorService.listDoctors(res.locals.validated.query));
});

export const getDoctor = asyncHandler(async (_req, res) => {
  sendSuccess(res, await doctorService.getDoctor(res.locals.validated.params.id));
});

export const addPatient = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    await patientService.createPatient(res.locals.validated.params.id, req.body),
    201,
  );
});

export const deleteDoctorPatient = asyncHandler(async (_req, res) => {
  const { id, patientId } = res.locals.validated.params;
  await patientService.deletePatient(patientId, id);
  sendSuccess(res, null);
});

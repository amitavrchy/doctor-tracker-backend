import { Router } from "express";
import {
  listPatients,
  getPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patient.controller";
import { validate } from "../middlewares/validate";
import { patientQuery, patientPatch } from "../validators/patient";
import { idParams } from "../validators/common";
const router = Router();
router.get("/", validate({ query: patientQuery }), listPatients);
router
  .route("/:id")
  .get(validate({ params: idParams }), getPatient)
  .patch(validate({ params: idParams, body: patientPatch }), updatePatient)
  .delete(validate({ params: idParams }), deletePatient);
export default router;

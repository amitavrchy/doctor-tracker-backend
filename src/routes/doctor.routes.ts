import { Router } from "express";
import {
  createDoctor,
  listDoctors,
  getDoctor,
  addPatient,
  deleteDoctorPatient,
} from "../controllers/doctor.controller";
import { listPatients } from "../controllers/patient.controller";
import { validate } from "../middlewares/validate";
import { doctorBody, doctorQuery } from "../validators/doctor";
import { patientBody, patientQuery } from "../validators/patient";
import { idParams, patientParams } from "../validators/common";
const router = Router();
router
  .route("/")
  .get(validate({ query: doctorQuery }), listDoctors)
  .post(validate({ body: doctorBody }), createDoctor);
router.get("/:id", validate({ params: idParams }), getDoctor);
router
  .route("/:id/patients")
  .get(validate({ params: idParams, query: patientQuery }), listPatients)
  .post(validate({ params: idParams, body: patientBody }), addPatient);
router.delete("/:id/patients/:patientId", validate({ params: patientParams }), deleteDoctorPatient);
export default router;

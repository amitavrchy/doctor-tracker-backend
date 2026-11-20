import type { z } from "zod";
import { Doctor } from "../models/Doctor";
import { Patient } from "../models/Patient";
import { ApiError } from "../utils/ApiError";
import type { patientBody, patientPatch, patientQuery } from "../validators/patient";
import { dateRange, meta, search } from "./query";

export type PatientListFilters = z.infer<typeof patientQuery>;
type PatientInput = z.infer<typeof patientBody>;
type PatientUpdate = z.infer<typeof patientPatch>;

async function requireDoctor(id: string) {
  if (!(await Doctor.exists({ _id: id }))) throw ApiError.notFound("Doctor not found");
}

export async function createPatient(doctorId: string, input: PatientInput) {
  await requireDoctor(doctorId);
  return Patient.create({ ...input, doctor: doctorId });
}

export async function listPatients(filters: PatientListFilters, parentDoctorId?: string) {
  const { page, limit, q, from, to, doctor, condition, gender, status, sortBy, order } = filters;
  const doctorId = parentDoctorId ?? doctor;
  if (parentDoctorId) await requireDoctor(parentDoctorId);

  const filter = {
    ...search(q, ["name", "phone", "email", "condition"]),
    ...(from || to ? { admissionDate: dateRange(from, to) } : {}),
    ...(doctorId ? { doctor: doctorId } : {}),
    ...(condition ? { condition } : {}),
    ...(gender ? { gender } : {}),
    ...(status ? { status } : {}),
  };
  const direction = order === "asc" ? 1 : -1;
  const [data, total] = await Promise.all([
    Patient.find(filter)
      .select("-notes")
      .populate("doctor", "name")
      .sort({ [sortBy]: direction, _id: direction })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Patient.countDocuments(filter),
  ]);
  return { data, meta: meta(page, limit, total) };
}

export async function getPatient(id: string) {
  const patient = await Patient.findById(id).populate("doctor", "name").lean();
  if (!patient) throw ApiError.notFound("Patient not found");
  return patient;
}

export async function updatePatient(id: string, input: PatientUpdate) {
  if (input.doctor) await requireDoctor(input.doctor);
  const patient = await Patient.findByIdAndUpdate(id, input, {
    returnDocument: "after",
    runValidators: true,
  }).lean();
  if (!patient) throw ApiError.notFound("Patient not found");
  return patient;
}

export async function deletePatient(id: string, doctorId?: string) {
  const patient = await Patient.findOneAndDelete({
    _id: id,
    ...(doctorId ? { doctor: doctorId } : {}),
  });
  if (!patient)
    throw ApiError.notFound(doctorId ? "Patient not found for doctor" : "Patient not found");
}

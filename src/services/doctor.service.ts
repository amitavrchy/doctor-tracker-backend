import type { z } from "zod";
import { Doctor } from "../models/Doctor";
import { Patient } from "../models/Patient";
import { ApiError } from "../utils/ApiError";
import type { doctorBody, doctorQuery } from "../validators/doctor";
import { dateRange, meta, search } from "./query";

export type DoctorListFilters = z.infer<typeof doctorQuery>;
type DoctorInput = z.infer<typeof doctorBody>;

export async function createDoctor(input: DoctorInput) {
  return Doctor.create(input);
}

export async function listDoctors(filters: DoctorListFilters) {
  const { page, limit, q, from, to, specialization, hospital, sortBy, order } = filters;
  const filter = {
    ...search(q, ["name", "specialization", "hospital", "email", "phone"]),
    ...(from || to ? { createdAt: dateRange(from, to) } : {}),
    ...(specialization ? { specialization } : {}),
    ...(hospital ? { hospital } : {}),
  };
  const direction = order === "asc" ? 1 : -1;
  const [data, total] = await Promise.all([
    Doctor.find(filter)
      .sort({ [sortBy]: direction, _id: direction })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Doctor.countDocuments(filter),
  ]);
  return { data, meta: meta(page, limit, total) };
}

export async function getDoctor(id: string) {
  const [doctor, patientCount] = await Promise.all([
    Doctor.findById(id).lean(),
    Patient.countDocuments({ doctor: id }),
  ]);
  if (!doctor) throw ApiError.notFound("Doctor not found");
  return { ...doctor, patientCount };
}

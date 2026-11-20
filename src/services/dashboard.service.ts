import type { z } from "zod";
import { Doctor } from "../models/Doctor";
import { Patient } from "../models/Patient";
import type { dashboardQuery } from "../validators/dashboard";
import { bucketLabel, bucketLabels, type Granularity } from "./dashboardDates";

type Count = { label: string; count: number };
type TrendRow = { _id: Date; count: number };
/** All breakdowns are all-time; trends and newPatients use the inclusive range. Bucket labels are local calendar dates. */
export type DashboardResponse = {
  range: { from: Date; to: Date; granularity: Granularity; tz: string };
  totals: {
    doctors: number;
    patients: number;
    active: number;
    discharged: number;
    newPatients: number;
  };
  patientsPerDoctor: {
    doctor: { id: string; name: string; specialization: string; hospital: string } | null;
    count: number;
  }[];
  patientsByCondition: Count[];
  patientsByStatus: Count[];
  patientsByGender: Count[];
  doctorsBySpecialization: Count[];
  trends: { bucket: string; patientsAdmitted: number; doctorsAdded: number }[];
};

type Filters = z.output<typeof dashboardQuery>;
const countBy = (field: string) => [
  { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  { $sort: { count: -1 as const, _id: 1 as const } },
  { $project: { _id: 0, label: "$_id", count: 1 } },
];

export async function getDashboard({
  from,
  to,
  granularity,
  tz,
  limit,
}: Filters): Promise<DashboardResponse> {
  const range = { $gte: from, $lte: to };
  const trend = (field: string) => [
    { $match: { [field]: range } },
    {
      $group: {
        _id: {
          $dateTrunc: {
            date: `$${field}`,
            unit: granularity,
            timezone: tz,
            ...(granularity === "week" ? { startOfWeek: "monday" } : {}),
          },
        },
        count: { $sum: 1 },
      },
    },
  ];
  const [
    doctors,
    patients,
    newPatients,
    patientStats,
    doctorStats,
    patientTrend,
    doctorTrend,
    topDoctors,
  ] = await Promise.all([
    Doctor.countDocuments(),
    Patient.countDocuments(),
    Patient.countDocuments({ admissionDate: range }),
    Patient.aggregate<{ conditions: Count[]; statuses: Count[]; genders: Count[] }>([
      {
        $facet: {
          conditions: [...countBy("condition"), { $limit: limit }],
          statuses: countBy("status"),
          genders: countBy("gender"),
        },
      },
    ]),
    Doctor.aggregate<Count>([...countBy("specialization"), { $limit: limit }]),
    Patient.aggregate<TrendRow>(trend("admissionDate")),
    Doctor.aggregate<TrendRow>(trend("createdAt")),
    Patient.aggregate<{
      _id: { toString(): string };
      count: number;
      doctor: {
        _id: { toString(): string };
        name: string;
        specialization: string;
        hospital: string;
      }[];
    }>([
      { $group: { _id: "$doctor", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: limit },
      {
        $lookup: {
          from: Doctor.collection.name,
          localField: "_id",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, specialization: 1, hospital: 1 } }],
          as: "doctor",
        },
      },
    ]),
  ]);
  const stats = patientStats[0];
  const conditions = stats.conditions;
  const other = patients - conditions.reduce((sum, item) => sum + item.count, 0);
  if (other) conditions.push({ label: "Other", count: other });
  const values = (rows: TrendRow[]) =>
    new Map(rows.map((row) => [bucketLabel(row._id, tz, granularity), row.count]));
  const admitted = values(patientTrend);
  const added = values(doctorTrend);
  return {
    range: { from, to, granularity, tz },
    totals: {
      doctors,
      patients,
      active: stats.statuses.find((v) => v.label === "active")?.count ?? 0,
      discharged: stats.statuses.find((v) => v.label === "discharged")?.count ?? 0,
      newPatients,
    },
    patientsPerDoctor: topDoctors.map(({ doctor, count }) => ({
      doctor: doctor[0]
        ? {
            id: doctor[0]._id.toString(),
            name: doctor[0].name,
            specialization: doctor[0].specialization,
            hospital: doctor[0].hospital,
          }
        : null,
      count,
    })),
    patientsByCondition: conditions,
    patientsByStatus: stats.statuses,
    patientsByGender: stats.genders,
    doctorsBySpecialization: doctorStats,
    trends: bucketLabels(from, to, tz, granularity).map((bucket) => ({
      bucket,
      patientsAdmitted: admitted.get(bucket) ?? 0,
      doctorsAdded: added.get(bucket) ?? 0,
    })),
  };
}

import { connectDB, disconnectDB } from "../config/db";
import { Doctor } from "../models/Doctor";
import { Patient } from "../models/Patient";

const domain = "demo.doctortracker.dev";
const first = [
  "Amina",
  "Daniel",
  "Sofia",
  "Noah",
  "Priya",
  "Omar",
  "Lina",
  "Ethan",
  "Maya",
  "Arif",
  "Elena",
  "James",
];
const last = [
  "Rahman",
  "Patel",
  "Chen",
  "Williams",
  "Khan",
  "Garcia",
  "Ahmed",
  "Brown",
  "Das",
  "Smith",
  "Ali",
  "Martin",
];
const specializations = [
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Dermatology",
  "Orthopedics",
  "Internal Medicine",
  "Endocrinology",
  "Pulmonology",
];
const hospitals = [
  "Central Medical Center",
  "Riverside Hospital",
  "Green Valley Clinic",
  "Northside General",
  "City Health Institute",
];
const conditions = [
  "Hypertension",
  "Type 2 diabetes",
  "Asthma",
  "Migraine",
  "Arthritis",
  "Anemia",
  "Eczema",
  "Coronary artery disease",
  "Thyroid disorder",
  "Back pain",
  "Pneumonia",
  "Gastritis",
];
let state = 20261120;
function random() {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state / 4294967296;
}
function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

async function seed() {
  await connectDB();
  const filter = { email: { $regex: /@demo\.doctortracker\.dev$/i } };
  const existing = await Doctor.find(filter).select("_id").lean();
  if (existing.length && !process.argv.includes("--reset")) {
    console.log("Demo data already exists; no changes made.");
    return;
  }
  if (existing.length) {
    await Patient.deleteMany({ doctor: { $in: existing.map((doctor) => doctor._id) } });
    await Doctor.deleteMany({ _id: { $in: existing.map((doctor) => doctor._id) } });
  }
  const now = Date.now();
  const dateWithin = (days: number) => new Date(now - Math.floor(random() * days * 86400000));
  const doctors = Array.from({ length: 32 }, (_, i) => {
    const createdAt = dateWithin(540);
    return {
      name: `Dr. ${pick(first)} ${pick(last)}`,
      specialization: pick(specializations),
      hospital: pick(hospitals),
      phone: `+1555000${String(i).padStart(4, "0")}`,
      email: `doctor${i + 1}@${domain}`,
      createdAt,
      updatedAt: createdAt,
    };
  });
  const inserted = await Doctor.insertMany(doctors, { timestamps: false });
  const patients = Array.from({ length: 600 }, (_, i) => {
    const doctor = pick(inserted);
    const admissionDate = new Date(
      doctor.createdAt.getTime() + Math.floor(random() * (now - doctor.createdAt.getTime())),
    );
    return {
      doctor: doctor._id,
      name: `${pick(first)} ${pick(last)}`,
      age: 1 + Math.floor(random() * 88),
      gender: pick(["male", "female", "other"] as const),
      phone: `+1555100${String(i).padStart(4, "0")}`,
      condition: pick(conditions),
      admissionDate,
      status: pick(["active", "active", "discharged"] as const),
      createdAt: admissionDate,
      updatedAt: admissionDate,
    };
  });
  for (let i = 0; i < patients.length; i += 200) {
    await Patient.insertMany(patients.slice(i, i + 200), { timestamps: false });
  }
  console.log(`Demo data created: ${inserted.length} doctors, ${patients.length} patients.`);
}

seed()
  .catch(() => {
    console.error("Demo seed failed; check configuration and database connectivity.");
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());

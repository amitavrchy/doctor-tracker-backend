import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 150 },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    condition: { type: String, required: true, trim: true },
    admissionDate: { type: Date, required: true },
    notes: { type: String, trim: true },
    status: { type: String, enum: ["active", "discharged"], default: "active" },
  },
  // Schema collation lets case-insensitive equality filters use matching indexes.
  { timestamps: true, collation: { locale: "en", strength: 2 } },
);
// Support doctor/condition filters and chronological browsing; admissionDate powers date ranges.
schema.index({ doctor: 1, createdAt: -1, _id: -1 });
schema.index({ condition: 1, createdAt: -1, _id: -1 });
schema.index({ createdAt: -1, _id: -1 });
schema.index({ admissionDate: -1, _id: -1 });
// Doctor and condition filters combined with admission-date ranges and sorting.
schema.index({ doctor: 1, admissionDate: -1, _id: -1 });
schema.index({ condition: 1, admissionDate: -1, _id: -1 });

export const Patient = model("Patient", schema);

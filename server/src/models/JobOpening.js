import mongoose from 'mongoose';
import { JOB_STATUSES } from '../constants/pipeline.js';

const jobOpeningSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    department: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 10000 },
    status: { type: String, enum: Object.values(JOB_STATUSES), default: JOB_STATUSES.OPEN },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

jobOpeningSchema.index({ status: 1, updatedAt: -1 });
jobOpeningSchema.index({ department: 1, status: 1 });

export const JobOpening = mongoose.model('JobOpening', jobOpeningSchema);

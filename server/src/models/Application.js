import mongoose from 'mongoose';
import { ACTIVE_APPLICATION_STAGES, APPLICATION_STAGES } from '../constants/pipeline.js';

const applicationSchema = new mongoose.Schema(
  {
    jobOpening: { type: mongoose.Schema.Types.ObjectId, ref: 'JobOpening', required: true },
    candidateName: { type: String, required: true, trim: true, maxlength: 160 },
    candidateEmail: { type: String, required: true, lowercase: true, trim: true },
    source: { type: String, required: true, trim: true, maxlength: 100 },
    notes: { type: String, default: '', trim: true, maxlength: 10000 },
    stage: { type: String, enum: APPLICATION_STAGES, default: 'Applied' },
    stageEnteredAt: { type: Date, default: Date.now },
    rejectedFromStage: { type: String, enum: ACTIVE_APPLICATION_STAGES, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

applicationSchema.index({ jobOpening: 1, stage: 1, updatedAt: -1 });
applicationSchema.index({ stage: 1, stageEnteredAt: 1 });
applicationSchema.index({ source: 1, createdAt: -1 });
applicationSchema.index({ candidateName: 1 });
applicationSchema.index({ candidateEmail: 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ updatedAt: -1 });

export const Application = mongoose.model('Application', applicationSchema);

import mongoose from 'mongoose';
import { ACTIVE_APPLICATION_STAGES } from '../constants/pipeline.js';

const alertDismissalSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    stage: { type: String, enum: ACTIVE_APPLICATION_STAGES, required: true },
    dismissedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

alertDismissalSchema.index({ application: 1, stage: 1 }, { unique: true });
alertDismissalSchema.index({ stage: 1, updatedAt: -1 });

export const AlertDismissal = mongoose.model('AlertDismissal', alertDismissalSchema);

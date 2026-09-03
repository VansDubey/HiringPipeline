import mongoose from 'mongoose';
import { APPLICATION_STAGES, EVENT_TYPES } from '../constants/pipeline.js';

const applicationEventSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    type: { type: String, enum: EVENT_TYPES, required: true },
    oldStage: { type: String, enum: APPLICATION_STAGES, default: null },
    newStage: { type: String, enum: APPLICATION_STAGES, default: null },
    feedback: { type: String, trim: true, maxlength: 10000, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

applicationEventSchema.index({ application: 1, createdAt: 1 });
applicationEventSchema.index({ type: 1, createdAt: -1 });

applicationEventSchema.pre('save', function preventAuditUpdate(next) {
  if (!this.isNew) {
    next(new Error('Application history is immutable'));
    return;
  }

  next();
});

for (const operation of [
  'updateOne',
  'updateMany',
  'replaceOne',
  'findOneAndUpdate',
  'findOneAndReplace',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
]) {
  applicationEventSchema.pre(operation, function preventAuditMutation() {
    throw new Error('Application history is immutable');
  });
}

export const ApplicationEvent = mongoose.model('ApplicationEvent', applicationEventSchema);

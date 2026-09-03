import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    interviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
  },
  { timestamps: true }
);

interviewSchema.index({ scheduledAt: 1, status: 1 });
interviewSchema.index({ interviewer: 1, scheduledAt: 1 });
interviewSchema.index({ application: 1, scheduledAt: -1 });

export const Interview = mongoose.model('Interview', interviewSchema);

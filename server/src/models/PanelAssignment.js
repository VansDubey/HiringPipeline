import mongoose from 'mongoose';

const panelAssignmentSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    interviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

panelAssignmentSchema.index({ application: 1, interviewer: 1 }, { unique: true });
panelAssignmentSchema.index({ interviewer: 1, createdAt: -1 });

export const PanelAssignment = mongoose.model('PanelAssignment', panelAssignmentSchema);

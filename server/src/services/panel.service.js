import mongoose from 'mongoose';
import { USER_ROLES } from '../constants/pipeline.js';
import { Application } from '../models/Application.js';
import { ApplicationEvent } from '../models/ApplicationEvent.js';
import { PanelAssignment } from '../models/PanelAssignment.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { requireObjectId, requireText } from '../utils/validation.js';

async function requireApplication(applicationId) {
  requireObjectId(applicationId, 'applicationId');
  const application = await Application.findById(applicationId);
  if (!application) throw new ApiError(404, 'Application not found');
  return application;
}

async function requireInterviewer(interviewerId) {
  requireObjectId(interviewerId, 'interviewerId');
  const interviewer = await User.findOne({ _id: interviewerId, role: USER_ROLES.INTERVIEWER }).lean();
  if (!interviewer) throw new ApiError(400, 'Only users with the interviewer role can be assigned');
  return interviewer;
}

export async function listApplicationPanel(applicationId) {
  await requireApplication(applicationId);
  return PanelAssignment.find({ application: applicationId })
    .populate('interviewer', 'name email role')
    .sort({ createdAt: 1 })
    .lean();
}

export async function assignInterviewer(applicationId, interviewerId, assignedBy) {
  const session = await mongoose.startSession();
  try {
    let assignment;
    await session.withTransaction(async () => {
      await requireApplication(applicationId);
      await requireInterviewer(interviewerId);
      const existing = await PanelAssignment.exists({ application: applicationId, interviewer: interviewerId }).session(session);
      if (existing) throw new ApiError(409, 'Interviewer is already assigned to this application');

      const created = await PanelAssignment.create([{
        application: applicationId,
        interviewer: interviewerId,
        assignedBy,
      }], { session });
      assignment = created[0];

      await ApplicationEvent.create([{
        application: applicationId,
        type: 'interviewer_assigned',
        performedBy: assignedBy,
        metadata: { interviewerId },
      }], { session });
    });

    return assignment;
  } finally {
    await session.endSession();
  }
}

export async function removeInterviewer(applicationId, interviewerId, removedBy) {
  const session = await mongoose.startSession();
  try {
    let removed;
    await session.withTransaction(async () => {
      await requireApplication(applicationId);
      requireObjectId(interviewerId, 'interviewerId');
      const assignment = await PanelAssignment.findOneAndDelete({
        application: applicationId,
        interviewer: interviewerId,
      }).session(session);
      if (!assignment) throw new ApiError(404, 'Panel assignment not found');
      removed = assignment;

      await ApplicationEvent.create([{
        application: applicationId,
        type: 'interviewer_removed',
        performedBy: removedBy,
        metadata: { interviewerId },
      }], { session });
    });

    return removed;
  } finally {
    await session.endSession();
  }
}

export async function listMyPanel(interviewerId) {
  return PanelAssignment.find({ interviewer: interviewerId })
    .populate({
      path: 'application',
      populate: { path: 'jobOpening', select: 'title department status' },
    })
    .sort({ createdAt: -1 })
    .lean();
}

export async function submitFeedback(applicationId, interviewerId, feedback) {
  requireObjectId(applicationId, 'applicationId');
  requireText(feedback, 'feedback');
  const assignment = await PanelAssignment.exists({
    application: applicationId,
    interviewer: interviewerId,
  });
  if (!assignment) throw new ApiError(403, 'You are not assigned to this application');

  const event = await ApplicationEvent.create({
    application: applicationId,
    type: 'feedback_submitted',
    feedback: feedback.trim(),
    performedBy: interviewerId,
  });
  return event;
}

export async function listApplicationTimeline(applicationId) {
  await requireApplication(applicationId);
  return ApplicationEvent.find({ application: applicationId })
    .populate('performedBy', 'name email role')
    .sort({ createdAt: 1 })
    .lean();
}

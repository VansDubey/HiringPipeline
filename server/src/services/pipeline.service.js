import mongoose from 'mongoose';
import { ACTIVE_APPLICATION_STAGES } from '../constants/pipeline.js';
import { Application } from '../models/Application.js';
import { ApplicationEvent } from '../models/ApplicationEvent.js';
import { ApiError } from '../utils/ApiError.js';
import { requireObjectId } from '../utils/validation.js';

const nextStageByStage = new Map(
  ACTIVE_APPLICATION_STAGES.slice(0, -1).map((stage, index) => [stage, ACTIVE_APPLICATION_STAGES[index + 1]])
);

export function planAdvance(currentStage) {
  const nextStage = nextStageByStage.get(currentStage);
  if (!nextStage) {
    if (currentStage === 'Rejected') {
      throw new ApiError(400, 'Rejected applications must be reinstated before they can advance');
    }
    throw new ApiError(400, 'Hired applications cannot advance further');
  }

  return { oldStage: currentStage, newStage: nextStage, eventType: 'stage_changed' };
}

export function planRejection(currentStage) {
  if (!ACTIVE_APPLICATION_STAGES.includes(currentStage)) {
    throw new ApiError(400, 'Only active applications can be rejected');
  }

  return { oldStage: currentStage, newStage: 'Rejected', eventType: 'rejected' };
}

export function planReinstatement(currentStage, rejectedFromStage) {
  if (currentStage !== 'Rejected') {
    throw new ApiError(400, 'Only rejected applications can be reinstated');
  }

  if (!rejectedFromStage || !ACTIVE_APPLICATION_STAGES.includes(rejectedFromStage)) {
    throw new ApiError(409, 'Rejected application does not have a valid previous stage');
  }

  return { oldStage: 'Rejected', newStage: rejectedFromStage, eventType: 'reinstated' };
}

async function transitionApplication(applicationId, userId, plan, applicationUpdate) {
  const session = await mongoose.startSession();
  try {
    let updatedApplication;
    await session.withTransaction(async () => {
      const application = await Application.findById(applicationId).session(session);
      if (!application) throw new ApiError(404, 'Application not found');

      const transition = plan(application.stage, application.rejectedFromStage);
      application.stage = transition.newStage;
      application.stageEnteredAt = new Date();
      applicationUpdate(application, transition);
      await application.save({ session });

      await ApplicationEvent.create(
        [{
          application: application._id,
          type: transition.eventType,
          oldStage: transition.oldStage,
          newStage: transition.newStage,
          performedBy: userId,
        }],
        { session }
      );
      updatedApplication = application;
    });

    return updatedApplication;
  } finally {
    await session.endSession();
  }
}

export async function advanceApplication(id, userId) {
  requireObjectId(id, 'applicationId');
  return transitionApplication(id, userId, planAdvance, (application) => {
    application.rejectedFromStage = null;
  });
}

export async function rejectApplication(id, userId) {
  requireObjectId(id, 'applicationId');
  return transitionApplication(id, userId, planRejection, (application, transition) => {
    application.rejectedFromStage = transition.oldStage;
  });
}

export async function reinstateApplication(id, userId) {
  requireObjectId(id, 'applicationId');
  return transitionApplication(id, userId, planReinstatement, (application) => {
    application.rejectedFromStage = null;
  });
}

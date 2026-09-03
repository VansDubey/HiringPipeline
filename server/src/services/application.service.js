import { Application } from '../models/Application.js';
import { ApplicationEvent } from '../models/ApplicationEvent.js';
import { JobOpening } from '../models/JobOpening.js';
import { JOB_STATUSES } from '../constants/pipeline.js';
import { ApiError } from '../utils/ApiError.js';
import { optionalText, requireEmail, requireObjectId, requireText } from '../utils/validation.js';

function applicationPayload(input, { partial = false } = {}) {
  const payload = {};
  if (!partial || input.candidateName !== undefined) {
    payload.candidateName = requireText(input.candidateName, 'candidateName', { maxLength: 160 });
  }
  if (!partial || input.candidateEmail !== undefined) payload.candidateEmail = requireEmail(input.candidateEmail);
  if (!partial || input.source !== undefined) {
    payload.source = requireText(input.source, 'source', { maxLength: 100 });
  }
  if (input.notes !== undefined || !partial) payload.notes = optionalText(input.notes, 'notes');
  return payload;
}

async function findOpenJobOpening(id) {
  requireObjectId(id, 'jobOpeningId');
  const opening = await JobOpening.findById(id).lean();
  if (!opening) throw new ApiError(404, 'Job opening not found');
  if (opening.status === JOB_STATUSES.ARCHIVED) {
    throw new ApiError(400, 'Applications cannot be added to an archived job opening');
  }
  return opening;
}

export async function listApplicationsForOpening(jobOpeningId) {
  await findOpenJobOpening(jobOpeningId);
  return Application.find({ jobOpening: jobOpeningId }).sort({ createdAt: -1 }).lean();
}

export async function getApplication(id) {
  requireObjectId(id, 'applicationId');
  const application = await Application.findById(id).populate('jobOpening', 'title department status').lean();
  if (!application) throw new ApiError(404, 'Application not found');
  return application;
}

export async function createApplication(input, userId) {
  const jobOpening = await findOpenJobOpening(input.jobOpeningId);
  const application = await Application.create({
    ...applicationPayload(input),
    jobOpening: jobOpening._id,
    createdBy: userId,
  });

  await ApplicationEvent.create({
    application: application._id,
    type: 'application_created',
    newStage: application.stage,
    performedBy: userId,
  });

  return getApplication(application._id);
}

export async function updateApplication(id, input) {
  requireObjectId(id, 'applicationId');
  const payload = applicationPayload(input, { partial: true });
  if (input.jobOpeningId !== undefined) {
    throw new ApiError(400, 'An application cannot be moved to another job opening');
  }
  if (Object.keys(payload).length === 0) throw new ApiError(400, 'At least one editable field is required');
  const application = await Application.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  );
  if (!application) throw new ApiError(404, 'Application not found');
  return getApplication(application._id);
}

import { JOB_STATUSES } from '../constants/pipeline.js';
import { JobOpening } from '../models/JobOpening.js';
import { ApiError } from '../utils/ApiError.js';
import { requireObjectId, requireText } from '../utils/validation.js';

const editableFields = ['title', 'department', 'description', 'status'];

function validateStatus(status) {
  if (!Object.values(JOB_STATUSES).includes(status)) {
    throw new ApiError(400, `status must be one of: ${Object.values(JOB_STATUSES).join(', ')}`);
  }

  return status;
}

function openingPayload(input, { partial = false } = {}) {
  const payload = {};
  if (!partial || input.title !== undefined) payload.title = requireText(input.title, 'title', { maxLength: 160 });
  if (!partial || input.department !== undefined) payload.department = requireText(input.department, 'department', { maxLength: 100 });
  if (!partial || input.description !== undefined) payload.description = requireText(input.description, 'description');
  if (input.status !== undefined) payload.status = validateStatus(input.status);
  return payload;
}

export async function listJobOpenings({ includeArchived = false } = {}) {
  const filter = includeArchived ? {} : { status: { $ne: JOB_STATUSES.ARCHIVED } };
  return JobOpening.find(filter).sort({ updatedAt: -1 }).lean();
}

export async function getJobOpening(id) {
  requireObjectId(id, 'jobOpeningId');
  const opening = await JobOpening.findById(id).lean();
  if (!opening) throw new ApiError(404, 'Job opening not found');
  return opening;
}

export async function createJobOpening(input, userId) {
  const opening = await JobOpening.create({ ...openingPayload(input), createdBy: userId });
  return opening.toObject();
}

export async function updateJobOpening(id, input) {
  requireObjectId(id, 'jobOpeningId');
  const payload = openingPayload(input, { partial: true });
  if (Object.keys(payload).length === 0) throw new ApiError(400, 'At least one editable field is required');
  const opening = await JobOpening.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true }).lean();
  if (!opening) throw new ApiError(404, 'Job opening not found');
  return opening;
}

export async function setJobOpeningStatus(id, status) {
  requireObjectId(id, 'jobOpeningId');
  validateStatus(status);
  const opening = await JobOpening.findByIdAndUpdate(id, { $set: { status } }, { new: true, runValidators: true }).lean();
  if (!opening) throw new ApiError(404, 'Job opening not found');
  return opening;
}

export { editableFields };

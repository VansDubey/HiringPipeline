import {
  createJobOpening,
  getJobOpening,
  listJobOpenings,
  setJobOpeningStatus,
  updateJobOpening,
} from '../services/jobOpening.service.js';
import { JOB_STATUSES } from '../constants/pipeline.js';

export async function list(request, response) {
  const includeArchived = request.query.includeArchived === 'true';
  response.json({ data: await listJobOpenings({ includeArchived }) });
}

export async function getById(request, response) {
  response.json({ data: await getJobOpening(request.params.id) });
}

export async function create(request, response) {
  const opening = await createJobOpening(request.body || {}, request.user._id);
  response.status(201).json({ data: opening });
}

export async function update(request, response) {
  response.json({ data: await updateJobOpening(request.params.id, request.body || {}) });
}

export async function archive(request, response) {
  response.json({ data: await setJobOpeningStatus(request.params.id, JOB_STATUSES.ARCHIVED) });
}

export async function restore(request, response) {
  response.json({ data: await setJobOpeningStatus(request.params.id, JOB_STATUSES.OPEN) });
}

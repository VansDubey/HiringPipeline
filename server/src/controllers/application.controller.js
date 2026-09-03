import {
  createApplication,
  getApplication,
  listApplicationsForOpening,
  updateApplication,
} from '../services/application.service.js';
import {
  advanceApplication,
  rejectApplication,
  reinstateApplication,
} from '../services/pipeline.service.js';

export async function listByOpening(request, response) {
  const jobOpeningId = request.params.jobOpeningId || request.params.id;
  response.json({ data: await listApplicationsForOpening(jobOpeningId) });
}

export async function getById(request, response) {
  response.json({ data: await getApplication(request.params.id) });
}

export async function create(request, response) {
  const application = await createApplication(request.body || {}, request.user._id);
  response.status(201).json({ data: application });
}

export async function update(request, response) {
  response.json({ data: await updateApplication(request.params.id, request.body || {}) });
}

export async function advance(request, response) {
  response.json({ data: await advanceApplication(request.params.id, request.user._id) });
}

export async function reject(request, response) {
  response.json({ data: await rejectApplication(request.params.id, request.user._id) });
}

export async function reinstate(request, response) {
  response.json({ data: await reinstateApplication(request.params.id, request.user._id) });
}

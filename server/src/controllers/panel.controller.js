import {
  assignInterviewer,
  listApplicationPanel,
  listApplicationTimeline,
  listMyPanel,
  removeInterviewer,
  submitFeedback,
} from '../services/panel.service.js';

export async function getPanel(request, response) {
  response.json({ data: await listApplicationPanel(request.params.id) });
}

export async function assign(request, response) {
  const assignment = await assignInterviewer(
    request.params.id,
    request.body?.interviewerId,
    request.user._id
  );
  response.status(201).json({ data: assignment });
}

export async function remove(request, response) {
  const assignment = await removeInterviewer(
    request.params.id,
    request.params.interviewerId,
    request.user._id
  );
  response.json({ data: assignment });
}

export async function getMyPanel(request, response) {
  response.json({ data: await listMyPanel(request.user._id) });
}

export async function feedback(request, response) {
  const event = await submitFeedback(request.params.id, request.user._id, request.body?.feedback);
  response.status(201).json({ data: event });
}

export async function timeline(request, response) {
  response.json({ data: await listApplicationTimeline(request.params.id) });
}

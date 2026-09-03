import { dismissStalledApplication, listStalledApplications } from '../services/alert.service.js';
import { ApiError } from '../utils/ApiError.js';

export async function list(request, response) {
  const asOf = request.query.asOf ? new Date(request.query.asOf) : new Date();
  if (Number.isNaN(asOf.getTime())) {
    throw new ApiError(400, 'asOf must be a valid date');
  }

  const alerts = await listStalledApplications(asOf);
  response.json({ data: alerts });
}

export async function dismiss(request, response) {
  const dismissal = await dismissStalledApplication(request.params.applicationId, request.user._id);
  response.json({ data: dismissal });
}

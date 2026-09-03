import { getDashboardMetrics } from '../services/dashboard.service.js';
import { ApiError } from '../utils/ApiError.js';

export async function getMetrics(request, response) {
  const asOf = request.query.asOf ? new Date(request.query.asOf) : new Date();
  if (Number.isNaN(asOf.getTime())) {
    throw new ApiError(400, 'asOf must be a valid date');
  }

  response.json({ data: await getDashboardMetrics(asOf) });
}

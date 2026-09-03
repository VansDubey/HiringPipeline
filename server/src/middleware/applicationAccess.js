import { PanelAssignment } from '../models/PanelAssignment.js';
import { USER_ROLES } from '../constants/pipeline.js';

export async function requireApplicationAccess(request, _response, next) {
  if (!request.user) {
    next({ statusCode: 401, message: 'Authentication required' });
    return;
  }

  if (request.user.role === USER_ROLES.RECRUITER) {
    next();
    return;
  }

  if (request.user.role !== USER_ROLES.INTERVIEWER) {
    next({ statusCode: 403, message: 'You do not have permission to access applications' });
    return;
  }

  const applicationId = request.params.applicationId || request.params.id;
  const assignment = await PanelAssignment.exists({
    application: applicationId,
    interviewer: request.user._id,
  });

  if (!assignment) {
    next({ statusCode: 403, message: 'You are not assigned to this application' });
    return;
  }

  next();
}

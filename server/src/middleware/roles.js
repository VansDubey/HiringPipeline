import { USER_ROLES } from '../constants/pipeline.js';

export function requireRole(...allowedRoles) {
  return (request, _response, next) => {
    if (!request.user) {
      next({ statusCode: 401, message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      next({ statusCode: 403, message: 'You do not have permission to perform this action' });
      return;
    }

    next();
  };
}

export const requireRecruiter = requireRole(USER_ROLES.RECRUITER);
export const requireInterviewer = requireRole(USER_ROLES.INTERVIEWER);

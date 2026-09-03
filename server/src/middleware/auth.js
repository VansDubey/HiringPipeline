import { AUTH_COOKIE_NAME } from '../constants/auth.js';
import { User } from '../models/User.js';
import { verifyAuthToken } from '../services/auth.service.js';

export async function requireAuth(request, _response, next) {
  const token = request.cookies[AUTH_COOKIE_NAME];

  if (!token) {
    next({ statusCode: 401, message: 'Authentication required' });
    return;
  }

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch (_error) {
    next({ statusCode: 401, message: 'Invalid or expired authentication token' });
    return;
  }

  const user = await User.findById(payload.sub);

  if (!user) {
    next({ statusCode: 401, message: 'Authentication required' });
    return;
  }

  request.user = user;
  next();
}

import { AUTH_COOKIE_MAX_AGE_MS, AUTH_COOKIE_NAME } from '../constants/auth.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import {
  comparePassword,
  createAuthToken,
  serializeUser,
} from '../services/auth.service.js';

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  maxAge: AUTH_COOKIE_MAX_AGE_MS,
  path: '/',
};

export async function login(request, response) {
  const email = request.body?.email?.trim().toLowerCase();
  const password = request.body?.password;

  if (!email || typeof password !== 'string' || password.length === 0) {
    response.status(400).json({ error: { message: 'Email and password are required' } });
    return;
  }

  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordMatches = user ? await comparePassword(password, user.passwordHash) : false;

  if (!passwordMatches) {
    response.status(401).json({ error: { message: 'Invalid email or password' } });
    return;
  }

  response.cookie(AUTH_COOKIE_NAME, createAuthToken(user), cookieOptions);
  response.json({ data: { user: serializeUser(user) } });
}

export function logout(_request, response) {
  response.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
  response.json({ data: { message: 'Logged out successfully' } });
}

export function getCurrentUser(request, response) {
  response.json({ data: { user: serializeUser(request.user) } });
}

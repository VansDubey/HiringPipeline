import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const PASSWORD_ROUNDS = 12;

function requireJwtSecret() {
  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return env.jwtSecret;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, PASSWORD_ROUNDS);
}

export async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function createAuthToken(user) {
  return jwt.sign(
    { role: user.role },
    requireJwtSecret(),
    { subject: user._id.toString(), expiresIn: '8h' }
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, requireJwtSecret());
}

export function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

import mongoose from 'mongoose';
import { ApiError } from './ApiError.js';

export function requireObjectId(value, fieldName) {
  if (!mongoose.isValidObjectId(value)) {
    throw new ApiError(400, `${fieldName} must be a valid identifier`);
  }

  return value;
}

export function requireText(value, fieldName, { maxLength = 10000 } = {}) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ApiError(400, `${fieldName} is required`);
  }

  if (value.trim().length > maxLength) {
    throw new ApiError(400, `${fieldName} must be ${maxLength} characters or fewer`);
  }

  return value.trim();
}

export function optionalText(value, fieldName, { maxLength = 10000, fallback = '' } = {}) {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== 'string' || value.trim().length > maxLength) {
    throw new ApiError(400, `${fieldName} must be ${maxLength} characters or fewer`);
  }

  return value.trim();
}

export function requireEmail(value) {
  const email = requireText(value, 'candidateEmail', { maxLength: 254 }).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new ApiError(400, 'candidateEmail must be a valid email address');
  }

  return email;
}

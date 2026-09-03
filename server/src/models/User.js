import mongoose from 'mongoose';
import { USER_ROLES } from '../constants/pipeline.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(USER_ROLES), required: true },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);

import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (!env.mongoUri) {
    console.warn('MONGODB_URI is not configured; starting without a database connection.');
    return;
  }

  await mongoose.connect(env.mongoUri);
  console.log('Connected to MongoDB');
}

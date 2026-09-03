import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (!env.mongoUri) {
    console.warn('MONGODB_URI is not configured; starting without a database connection.');
    return;
  }

  try {
    await mongoose.connect(env.mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    if (env.nodeEnv === 'production') {
      throw error;
    }

    console.error(`MongoDB connection failed: ${error.message}`);
  }
}

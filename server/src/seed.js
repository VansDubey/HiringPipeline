import 'dotenv/config';
import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { USER_ROLES } from './constants/pipeline.js';
import { User } from './models/User.js';
import { hashPassword } from './services/auth.service.js';

const demoUsers = [
  {
    name: 'Vanshika Dubey',
    email: 'recruiter@hireflow.local',
    password: 'RecruiterDemo!2026',
    role: USER_ROLES.RECRUITER,
  },
  {
    name: 'Rohan Mehta',
    email: 'interviewer@hireflow.local',
    password: 'InterviewerDemo!2026',
    role: USER_ROLES.INTERVIEWER,
  },
];

if (env.mongoDnsServers.length > 0) {
  dns.setServers(env.mongoDnsServers);
}

if (!env.mongoUri) {
  throw new Error('MONGODB_URI is required to seed demo users');
}

await mongoose.connect(env.mongoUri);

for (const demoUser of demoUsers) {
  const passwordHash = await hashPassword(demoUser.password);
  await User.updateOne(
    { email: demoUser.email },
    {
      $set: { name: demoUser.name, role: demoUser.role, passwordHash },
      $setOnInsert: { email: demoUser.email },
    },
    { upsert: true }
  );
}

console.log(`Seeded ${demoUsers.length} demo users`);
console.log('Recruiter: recruiter@hireflow.local / RecruiterDemo!2026');
console.log('Interviewer: interviewer@hireflow.local / InterviewerDemo!2026');

await mongoose.disconnect();

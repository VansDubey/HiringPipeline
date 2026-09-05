import 'dotenv/config';
import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { Application } from './models/Application.js';
import { ApplicationEvent } from './models/ApplicationEvent.js';
import { Interview } from './models/Interview.js';
import { JobOpening } from './models/JobOpening.js';
import { PanelAssignment } from './models/PanelAssignment.js';
import { User } from './models/User.js';
import { hashPassword } from './services/auth.service.js';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * DAY);

function thisWeekAt(dayOffset, hour = 10) {
  const date = new Date(now);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date;
}

if (env.mongoDnsServers.length > 0) dns.setServers(env.mongoDnsServers);
if (!env.mongoUri) throw new Error('MONGODB_URI is required to seed demo data');

await mongoose.connect(env.mongoUri);

const recruiter = await User.findOne({ email: 'recruiter@hireflow.local' });
const primaryInterviewer = await User.findOne({ email: 'interviewer@hireflow.local' });
if (!recruiter || !primaryInterviewer) {
  throw new Error('Run npm run seed:users before npm run seed:demo');
}

const demoPasswordHash = await hashPassword('InterviewerDemo!2026');
const secondaryInterviewer = await User.findOneAndUpdate(
  { email: 'interviewer2@hireflow.local' },
  {
    $set: {
      name: 'Priya Shah',
      role: 'interviewer',
      passwordHash: demoPasswordHash,
    },
    $setOnInsert: { email: 'interviewer2@hireflow.local' },
  },
  { upsert: true, new: true }
);

const openingSpecs = [
  ['Senior Backend Engineer', 'Engineering', 'Build scalable APIs, improve reliability, and contribute to backend architecture.', 'open'],
  ['Product Designer', 'Design', 'Own product discovery, interaction design, prototyping, and design-system quality.', 'open'],
  ['Account Executive', 'Sales', 'Develop qualified opportunities and guide customers through the buying process.', 'open'],
  ['Customer Support Specialist', 'Customer Experience', 'Help customers resolve issues and turn recurring feedback into product improvements.', 'open'],
  ['Operations Coordinator', 'Operations', 'Coordinate internal programs and improve repeatable operating processes.', 'archived'],
  ['Data Analyst', 'Analytics', 'Build decision-ready reporting and investigate product and commercial trends.', 'closed'],
];

const openings = {};
for (const [title, department, description, status] of openingSpecs) {
  openings[title] = await JobOpening.findOneAndUpdate(
    { title, createdBy: recruiter._id },
    { $set: { department, description, status } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

const applicationSpecs = [
  ['Aarav Sharma', 'aarav.sharma@demo.hireflow.local', 'Senior Backend Engineer', 'Applied', 'LinkedIn', 2, 'Node.js and distributed systems background.'],
  ['Meera Iyer', 'meera.iyer@demo.hireflow.local', 'Senior Backend Engineer', 'Screening', 'Employee referral', 13, 'Strong platform experience; awaiting recruiter follow-up.'],
  ['Kabir Singh', 'kabir.singh@demo.hireflow.local', 'Senior Backend Engineer', 'Interview', 'Careers page', 4, 'Technical panel scheduled this week.'],
  ['Ananya Rao', 'ananya.rao@demo.hireflow.local', 'Product Designer', 'Applied', 'Portfolio review', 1, 'Strong systems-thinking portfolio.'],
  ['Ishaan Patel', 'ishaan.patel@demo.hireflow.local', 'Product Designer', 'Offer', 'Dribbble', 12, 'Offer discussion needs an owner.'],
  ['Nisha Verma', 'nisha.verma@demo.hireflow.local', 'Product Designer', 'Rejected', 'LinkedIn', 18, 'Role required deeper enterprise research experience.', 'Interview'],
  ['Riya Kapoor', 'riya.kapoor@demo.hireflow.local', 'Account Executive', 'Screening', 'Agency', 5, 'Exceeded quota in the previous two years.'],
  ['Dev Malhotra', 'dev.malhotra@demo.hireflow.local', 'Account Executive', 'Interview', 'Employee referral', 11, 'Final commercial interview awaiting feedback.'],
  ['Sara Khan', 'sara.khan@demo.hireflow.local', 'Account Executive', 'Hired', 'LinkedIn', 3, 'Accepted and joining later this month.'],
  ['Vikram Joshi', 'vikram.joshi@demo.hireflow.local', 'Customer Support Specialist', 'Applied', 'Careers page', 16, 'Relevant SaaS support background; application is stalled.'],
  ['Pooja Nair', 'pooja.nair@demo.hireflow.local', 'Customer Support Specialist', 'Interview', 'Job board', 2, 'Customer empathy interview scheduled.'],
  ['Arjun Das', 'arjun.das@demo.hireflow.local', 'Customer Support Specialist', 'Hired', 'Employee referral', 20, 'Started this month.'],
  ['Neha Gupta', 'neha.gupta@demo.hireflow.local', 'Data Analyst', 'Rejected', 'University', 25, 'Position closed before the final round.', 'Screening'],
  ['Omar Siddiqui', 'omar.siddiqui@demo.hireflow.local', 'Senior Backend Engineer', 'Screening', 'GitHub', 3, 'Strong open-source work in observability and API performance.'],
  ['Leena Thomas', 'leena.thomas@demo.hireflow.local', 'Senior Backend Engineer', 'Offer', 'Recruiter outreach', 7, 'References completed; compensation review in progress.'],
  ['Tanvi Kulkarni', 'tanvi.kulkarni@demo.hireflow.local', 'Product Designer', 'Screening', 'Design community', 2, 'Promising research case study and accessible interaction work.'],
  ['Rahul Bose', 'rahul.bose@demo.hireflow.local', 'Product Designer', 'Interview', 'Employee referral', 6, 'Portfolio panel scheduled with product and engineering.'],
  ['Aditya Menon', 'aditya.menon@demo.hireflow.local', 'Account Executive', 'Applied', 'LinkedIn', 4, 'Mid-market SaaS experience with consistent quota attainment.'],
  ['Isha Arora', 'isha.arora@demo.hireflow.local', 'Account Executive', 'Offer', 'Recruiter outreach', 1, 'Verbal offer accepted; written approval pending.'],
  ['Farah Ali', 'farah.ali@demo.hireflow.local', 'Customer Support Specialist', 'Screening', 'Job board', 8, 'Multilingual support experience across email and live chat.'],
  ['Kunal Sethi', 'kunal.sethi@demo.hireflow.local', 'Customer Support Specialist', 'Rejected', 'Careers page', 9, 'Availability did not match the required support schedule.', 'Applied'],
  ['Zoya Merchant', 'zoya.merchant@demo.hireflow.local', 'Customer Support Specialist', 'Interview', 'Employee referral', 5, 'Strong troubleshooting exercise; culture interview remains.'],
  ['Harsh Vardhan', 'harsh.vardhan@demo.hireflow.local', 'Senior Backend Engineer', 'Applied', 'Conference', 1, 'Met the engineering team at a local developer conference.'],
  ['Aditi Bansal', 'aditi.bansal@demo.hireflow.local', 'Senior Backend Engineer', 'Applied', 'Careers page', 6, 'Backend engineer with experience building internal developer platforms.'],
  ['Manav Khanna', 'manav.khanna@demo.hireflow.local', 'Senior Backend Engineer', 'Screening', 'LinkedIn', 9, 'Good Node.js experience; availability needs confirmation.'],
  ['Sanya Roy', 'sanya.roy@demo.hireflow.local', 'Senior Backend Engineer', 'Interview', 'Employee referral', 3, 'Completed the coding exercise with a clear testing strategy.'],
  ['Yash Tiwari', 'yash.tiwari@demo.hireflow.local', 'Senior Backend Engineer', 'Offer', 'Recruiter outreach', 2, 'Final compensation approval is in progress.'],
  ['Naman Jain', 'naman.jain@demo.hireflow.local', 'Senior Backend Engineer', 'Rejected', 'Job board', 14, 'Experience did not match the distributed-systems requirement.', 'Screening'],
  ['Diya Chawla', 'diya.chawla@demo.hireflow.local', 'Product Designer', 'Applied', 'Dribbble', 5, 'Portfolio shows thoughtful mobile interaction work.'],
  ['Rohan Arora', 'rohan.arora@demo.hireflow.local', 'Product Designer', 'Screening', 'Design community', 4, 'Initial portfolio review is promising.'],
  ['Mitali Sen', 'mitali.sen@demo.hireflow.local', 'Product Designer', 'Interview', 'LinkedIn', 8, 'Research presentation is scheduled with the product team.'],
  ['Varun Sood', 'varun.sood@demo.hireflow.local', 'Product Designer', 'Offer', 'Employee referral', 3, 'References are complete and the offer is being prepared.'],
  ['Kavya Pillai', 'kavya.pillai@demo.hireflow.local', 'Product Designer', 'Rejected', 'Portfolio review', 11, 'The current role needs more complex B2B product experience.', 'Interview'],
  ['Aryan Kapoor', 'aryan.kapoor@demo.hireflow.local', 'Account Executive', 'Applied', 'LinkedIn', 7, 'Background in mid-market SaaS sales.'],
  ['Sneha Bhat', 'sneha.bhat@demo.hireflow.local', 'Account Executive', 'Screening', 'Agency', 2, 'Consistent quota performance and strong discovery examples.'],
  ['Laksh Mehra', 'laksh.mehra@demo.hireflow.local', 'Account Executive', 'Interview', 'Recruiter outreach', 6, 'Commercial case study is ready for panel review.'],
  ['Tanya Grover', 'tanya.grover@demo.hireflow.local', 'Account Executive', 'Hired', 'Employee referral', 1, 'Accepted the offer and starts next month.'],
  ['Samar Gill', 'samar.gill@demo.hireflow.local', 'Account Executive', 'Rejected', 'Careers page', 10, 'Territory experience was outside the current market focus.', 'Screening'],
  ['Ayesha Mirza', 'ayesha.mirza@demo.hireflow.local', 'Customer Support Specialist', 'Applied', 'Job board', 3, 'Experience supporting billing and account-management workflows.'],
  ['Parth Desai', 'parth.desai@demo.hireflow.local', 'Customer Support Specialist', 'Screening', 'Careers page', 6, 'Clear written communication and relevant SaaS experience.'],
  ['Muskan Yadav', 'muskan.yadav@demo.hireflow.local', 'Customer Support Specialist', 'Interview', 'Employee referral', 4, 'Customer scenario interview is scheduled this week.'],
  ['Rehan Qureshi', 'rehan.qureshi@demo.hireflow.local', 'Customer Support Specialist', 'Offer', 'LinkedIn', 2, 'Shift preferences confirmed; preparing the written offer.'],
  ['Bhavna Reddy', 'bhavna.reddy@demo.hireflow.local', 'Customer Support Specialist', 'Rejected', 'Agency', 12, 'Required weekend availability could not be agreed.', 'Applied'],
  ['Gaurav Saxena', 'gaurav.saxena@demo.hireflow.local', 'Operations Coordinator', 'Applied', 'Careers page', 15, 'Previous experience coordinating distributed operations teams.'],
  ['Preeti Anand', 'preeti.anand@demo.hireflow.local', 'Operations Coordinator', 'Screening', 'Employee referral', 12, 'Strong process documentation and vendor-management experience.'],
  ['Mohit Batra', 'mohit.batra@demo.hireflow.local', 'Data Analyst', 'Interview', 'University', 18, 'Completed the SQL exercise before the position was closed.'],
  ['Esha Dutta', 'esha.dutta@demo.hireflow.local', 'Data Analyst', 'Rejected', 'LinkedIn', 16, 'Opening closed while the candidate was in screening.', 'Screening'],
  ['Neil Fernandes', 'neil.fernandes@demo.hireflow.local', 'Data Analyst', 'Offer', 'Employee referral', 20, 'Offer was paused when the headcount plan changed.'],
];

const applications = {};
for (const [candidateName, candidateEmail, openingTitle, stage, source, ageDays, notes, rejectedFromStage = null] of applicationSpecs) {
  const createdAt = daysAgo(Math.max(ageDays + 3, 4));
  const stageEnteredAt = daysAgo(ageDays);
  let application = await Application.findOne({ candidateEmail });
  if (!application) {
    application = await Application.create({
      jobOpening: openings[openingTitle]._id,
      candidateName,
      candidateEmail,
      source,
      notes,
      stage,
      rejectedFromStage,
      stageEnteredAt,
      createdBy: recruiter._id,
    });
  } else {
    application.set({
      jobOpening: openings[openingTitle]._id,
      candidateName,
      source,
      notes,
      stage,
      rejectedFromStage,
      stageEnteredAt,
      createdBy: recruiter._id,
    });
    await application.save();
  }
  await Application.collection.updateOne(
    { _id: application._id },
    { $set: { createdAt, updatedAt: stageEnteredAt } }
  );
  applications[candidateEmail] = application;

  const creationEventExists = await ApplicationEvent.exists({
    application: application._id,
    type: 'application_created',
    'metadata.demoSeed': true,
  });
  if (!creationEventExists) {
    const event = await ApplicationEvent.create({
      application: application._id,
      type: 'application_created',
      newStage: 'Applied',
      performedBy: recruiter._id,
      metadata: { demoSeed: true },
    });
    await ApplicationEvent.collection.updateOne({ _id: event._id }, { $set: { createdAt } });
  }
}

const panelSpecs = [
  ['kabir.singh@demo.hireflow.local', primaryInterviewer],
  ['dev.malhotra@demo.hireflow.local', primaryInterviewer],
  ['pooja.nair@demo.hireflow.local', primaryInterviewer],
  ['kabir.singh@demo.hireflow.local', secondaryInterviewer],
  ['ishaan.patel@demo.hireflow.local', secondaryInterviewer],
  ['rahul.bose@demo.hireflow.local', secondaryInterviewer],
  ['zoya.merchant@demo.hireflow.local', primaryInterviewer],
  ['zoya.merchant@demo.hireflow.local', secondaryInterviewer],
  ['leena.thomas@demo.hireflow.local', primaryInterviewer],
];

for (const [email, interviewer] of panelSpecs) {
  await PanelAssignment.updateOne(
    { application: applications[email]._id, interviewer: interviewer._id },
    { $setOnInsert: { assignedBy: recruiter._id } },
    { upsert: true }
  );
}

const feedbackSpecs = [
  ['kabir.singh@demo.hireflow.local', primaryInterviewer, 'Strong API fundamentals and a clear approach to production debugging.'],
  ['dev.malhotra@demo.hireflow.local', primaryInterviewer, 'Excellent discovery skills; follow up on enterprise deal-complexity examples.'],
  ['kabir.singh@demo.hireflow.local', secondaryInterviewer, 'System-design trade-offs were well explained and appropriately scoped.'],
  ['rahul.bose@demo.hireflow.local', secondaryInterviewer, 'Clear product rationale and thoughtful handling of accessibility constraints.'],
  ['zoya.merchant@demo.hireflow.local', primaryInterviewer, 'Handled an ambiguous customer issue calmly and reached a practical resolution.'],
];

for (const [email, interviewer, feedback] of feedbackSpecs) {
  const exists = await ApplicationEvent.exists({
    application: applications[email]._id,
    type: 'feedback_submitted',
    performedBy: interviewer._id,
    'metadata.demoSeed': true,
  });
  if (!exists) {
    await ApplicationEvent.create({
      application: applications[email]._id,
      type: 'feedback_submitted',
      feedback,
      performedBy: interviewer._id,
      metadata: { demoSeed: true },
    });
  }
}

const interviewSpecs = [
  ['kabir.singh@demo.hireflow.local', primaryInterviewer, thisWeekAt(1, 11), 'scheduled'],
  ['kabir.singh@demo.hireflow.local', secondaryInterviewer, thisWeekAt(2, 15), 'scheduled'],
  ['pooja.nair@demo.hireflow.local', primaryInterviewer, thisWeekAt(3, 12), 'scheduled'],
  ['dev.malhotra@demo.hireflow.local', primaryInterviewer, daysAgo(2), 'completed'],
  ['rahul.bose@demo.hireflow.local', secondaryInterviewer, thisWeekAt(4, 14), 'scheduled'],
  ['zoya.merchant@demo.hireflow.local', primaryInterviewer, thisWeekAt(4, 16), 'scheduled'],
];

for (const [email, interviewer, scheduledAt, status] of interviewSpecs) {
  await Interview.updateOne(
    { application: applications[email]._id, interviewer: interviewer._id, status },
    { $set: { scheduledAt } },
    { upsert: true }
  );
}

console.log('Demo data seeded successfully');
console.log(`Openings: ${openingSpecs.length}`);
console.log(`Applications: ${applicationSpecs.length}`);
console.log(`Panel assignments: ${panelSpecs.length}`);
console.log(`Scheduled/completed interviews: ${interviewSpecs.length}`);
console.log('Second interviewer: interviewer2@hireflow.local / InterviewerDemo!2026');

await mongoose.disconnect();

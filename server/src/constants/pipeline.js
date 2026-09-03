export const USER_ROLES = Object.freeze({
  RECRUITER: 'recruiter',
  INTERVIEWER: 'interviewer',
});

export const JOB_STATUSES = Object.freeze({
  OPEN: 'open',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
});

export const APPLICATION_STAGES = Object.freeze([
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Hired',
  'Rejected',
]);

export const ACTIVE_APPLICATION_STAGES = Object.freeze(APPLICATION_STAGES.slice(0, -1));

export const EVENT_TYPES = Object.freeze([
  'application_created',
  'stage_changed',
  'rejected',
  'reinstated',
  'interviewer_assigned',
  'interviewer_removed',
  'feedback_submitted',
]);

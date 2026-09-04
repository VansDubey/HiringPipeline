import { ACTIVE_APPLICATION_STAGES, JOB_STATUSES } from '../constants/pipeline.js';
import { AlertDismissal } from '../models/AlertDismissal.js';
import { Application } from '../models/Application.js';
import { JobOpening } from '../models/JobOpening.js';
import { ApiError } from '../utils/ApiError.js';
import { requireObjectId } from '../utils/validation.js';

export const STALLED_DAYS = 10;
export const STALLABLE_APPLICATION_STAGES = ACTIVE_APPLICATION_STAGES.filter((stage) => stage !== 'Hired');
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export function getStalledCutoff(now = new Date(), stalledDays = STALLED_DAYS) {
  return new Date(now.getTime() - stalledDays * MILLISECONDS_PER_DAY);
}

export function isStalled(stageEnteredAt, now = new Date(), stalledDays = STALLED_DAYS) {
  return new Date(stageEnteredAt).getTime() <= getStalledCutoff(now, stalledDays).getTime();
}

export async function listStalledApplications(now = new Date()) {
  const cutoff = getStalledCutoff(now);
  const [result] = await Application.aggregate([
    {
      $match: {
        stage: { $in: STALLABLE_APPLICATION_STAGES },
        stageEnteredAt: { $lte: cutoff },
      },
    },
    {
      $lookup: {
        from: 'jobopenings',
        localField: 'jobOpening',
        foreignField: '_id',
        as: 'jobOpening',
      },
    },
    { $unwind: '$jobOpening' },
    { $match: { 'jobOpening.status': { $ne: JOB_STATUSES.ARCHIVED } } },
    {
      $lookup: {
        from: 'alertdismissals',
        let: { applicationId: '$_id', currentStage: '$stage' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$application', '$$applicationId'] },
                  { $eq: ['$stage', '$$currentStage'] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: 'dismissal',
      },
    },
    { $match: { dismissal: { $size: 0 } } },
    {
      $facet: {
        data: [
          { $sort: { stageEnteredAt: 1, candidateName: 1 } },
          {
            $project: {
              _id: 1,
              candidateName: 1,
              candidateEmail: 1,
              stage: 1,
              stageEnteredAt: 1,
              daysStalled: {
                $floor: {
                  $divide: [{ $subtract: [now, '$stageEnteredAt'] }, MILLISECONDS_PER_DAY],
                },
              },
              jobOpening: {
                _id: '$jobOpening._id',
                title: '$jobOpening.title',
                department: '$jobOpening.department',
              },
            },
          },
        ],
        metadata: [{ $count: 'total' }],
      },
    },
  ]);

  const total = result?.metadata[0]?.total || 0;
  return { data: result?.data || [], count: total, stalledDays: STALLED_DAYS };
}

export async function dismissStalledApplication(applicationId, dismissedBy) {
  requireObjectId(applicationId, 'applicationId');
  const application = await Application.findById(applicationId).select('stage stageEnteredAt jobOpening').lean();
  if (!application) throw new ApiError(404, 'Application not found');
  if (!STALLABLE_APPLICATION_STAGES.includes(application.stage)) {
    throw new ApiError(400, 'Only active applications can have stalled alerts');
  }
  if (!isStalled(application.stageEnteredAt)) {
    throw new ApiError(400, 'This application is not currently stalled');
  }

  const opening = await JobOpening.findById(application.jobOpening).select('status').lean();
  if (!opening || opening.status === JOB_STATUSES.ARCHIVED) {
    throw new ApiError(400, 'Archived applications do not have active stalled alerts');
  }

  return AlertDismissal.findOneAndUpdate(
    { application: applicationId, stage: application.stage },
    { $set: { dismissedBy } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
}

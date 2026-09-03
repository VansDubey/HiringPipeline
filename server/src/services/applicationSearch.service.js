import { USER_ROLES, APPLICATION_STAGES, JOB_STATUSES } from '../constants/pipeline.js';
import { Application } from '../models/Application.js';
import { JobOpening } from '../models/JobOpening.js';
import { PanelAssignment } from '../models/PanelAssignment.js';
import { ApiError } from '../utils/ApiError.js';
import { requireObjectId } from '../utils/validation.js';

const SORT_FIELDS = Object.freeze({
  appliedDate: 'createdAt',
  stage: 'stageOrder',
  lastUpdate: 'updatedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

const STAGE_ORDER = Object.freeze({
  Applied: 1,
  Screening: 2,
  Interview: 3,
  Offer: 4,
  Hired: 5,
  Rejected: 6,
});

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePagination(value, fallback, maximum) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new ApiError(400, `Pagination values must be integers between 1 and ${maximum}`);
  }
  return parsed;
}

function buildSort(sortBy, sortOrder) {
  const field = SORT_FIELDS[sortBy || 'lastUpdate'];
  if (!field) {
    throw new ApiError(400, `sortBy must be one of: ${Object.keys(SORT_FIELDS).join(', ')}`);
  }

  if (sortOrder !== undefined && !['asc', 'desc'].includes(sortOrder)) {
    throw new ApiError(400, 'sortOrder must be asc or desc');
  }

  return { [field]: sortOrder === 'asc' ? 1 : -1, _id: -1 };
}

export async function searchApplications({ user, query = {} }) {
  const page = parsePagination(query.page, 1, 1000000);
  const limit = parsePagination(query.limit, 20, 100);
  const sort = buildSort(query.sortBy, query.sortOrder);
  const match = {};

  if (user.role === USER_ROLES.INTERVIEWER) {
    const assignedApplicationIds = await PanelAssignment.find({ interviewer: user._id }).distinct('application');
    match._id = { $in: assignedApplicationIds };
  } else if (user.role !== USER_ROLES.RECRUITER) {
    throw new ApiError(403, 'You do not have permission to search applications');
  }

  if (query.jobOpening !== undefined) {
    requireObjectId(query.jobOpening, 'jobOpening');
    match.jobOpening = query.jobOpening;
  }

  if (query.stage !== undefined) {
    if (!APPLICATION_STAGES.includes(query.stage)) {
      throw new ApiError(400, `stage must be one of: ${APPLICATION_STAGES.join(', ')}`);
    }
    match.stage = query.stage;
  }

  if (query.source !== undefined) {
    if (typeof query.source !== 'string' || query.source.trim().length === 0 || query.source.length > 100) {
      throw new ApiError(400, 'source must be between 1 and 100 characters');
    }
    match.source = query.source.trim();
  }

  if (query.search !== undefined) {
    if (typeof query.search !== 'string' || query.search.length > 100) {
      throw new ApiError(400, 'search must be 100 characters or fewer');
    }
    const search = query.search.trim();
    if (search) {
      const expression = new RegExp(escapeRegex(search), 'i');
      match.$or = [{ candidateName: expression }, { candidateEmail: expression }];
    }
  }

  const pipeline = [{ $match: match }];

  if (user.role === USER_ROLES.RECRUITER && query.includeArchived !== 'true') {
    pipeline.push(
      { $lookup: { from: 'jobopenings', localField: 'jobOpening', foreignField: '_id', as: 'jobOpeningDetails' } },
      { $unwind: '$jobOpeningDetails' },
      { $match: { 'jobOpeningDetails.status': { $ne: JOB_STATUSES.ARCHIVED } } }
    );
  } else {
    pipeline.push(
      { $lookup: { from: 'jobopenings', localField: 'jobOpening', foreignField: '_id', as: 'jobOpeningDetails' } },
      { $unwind: '$jobOpeningDetails' }
    );
  }

  pipeline.push(
    {
      $addFields: {
        stageOrder: {
          $switch: {
            branches: Object.entries(STAGE_ORDER).map(([stage, order]) => ({ case: { $eq: ['$stage', stage] }, then: order })),
            default: 99,
          },
        },
      },
    },
    {
      $facet: {
        data: [
          { $sort: sort },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              candidateName: 1,
              candidateEmail: 1,
              source: 1,
              notes: 1,
              stage: 1,
              stageEnteredAt: 1,
              rejectedFromStage: 1,
              createdAt: 1,
              updatedAt: 1,
              jobOpening: {
                _id: '$jobOpeningDetails._id',
                title: '$jobOpeningDetails.title',
                department: '$jobOpeningDetails.department',
                status: '$jobOpeningDetails.status',
              },
            },
          },
        ],
        metadata: [{ $count: 'total' }],
      },
    }
  );

  const [result] = await Application.aggregate(pipeline);
  const total = result?.metadata[0]?.total || 0;

  return {
    data: result?.data || [],
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

export { SORT_FIELDS };

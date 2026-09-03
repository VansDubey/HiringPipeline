import mongoose from 'mongoose';
import { advanceApplication, rejectApplication } from './pipeline.service.js';
import { ApiError } from '../utils/ApiError.js';

const MAX_BATCH_SIZE = 100;

function validateApplicationIds(applicationIds) {
  if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
    throw new ApiError(400, 'applicationIds must be a non-empty array');
  }

  if (applicationIds.length > MAX_BATCH_SIZE) {
    throw new ApiError(400, `A maximum of ${MAX_BATCH_SIZE} applications can be processed at once`);
  }
}

function resultForFailure(applicationId, error) {
  return {
    applicationId,
    status: 'refused',
    reason: error.message || 'Application could not be processed',
  };
}

async function processBatch(applicationIds, userId, action) {
  validateApplicationIds(applicationIds);

  const results = [];
  for (const applicationId of applicationIds) {
    if (!mongoose.isValidObjectId(applicationId)) {
      results.push(resultForFailure(applicationId, { message: 'applicationId must be a valid identifier' }));
      continue;
    }

    try {
      const application = await action(applicationId, userId);
      results.push({
        applicationId: application._id.toString(),
        status: 'succeeded',
        stage: application.stage,
      });
    } catch (error) {
      results.push(resultForFailure(applicationId, error));
    }
  }

  return {
    results,
    summary: {
      total: results.length,
      succeeded: results.filter((result) => result.status === 'succeeded').length,
      refused: results.filter((result) => result.status === 'refused').length,
    },
  };
}

export function bulkAdvanceApplications(applicationIds, userId) {
  return processBatch(applicationIds, userId, advanceApplication);
}

export function bulkRejectApplications(applicationIds, userId) {
  return processBatch(applicationIds, userId, rejectApplication);
}

export { MAX_BATCH_SIZE };

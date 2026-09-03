import { JOB_STATUSES } from '../constants/pipeline.js';
import { Application } from '../models/Application.js';

const CSV_HEADERS = Object.freeze([
  'Candidate name',
  'Candidate email',
  'Job opening',
  'Department',
  'Stage',
  'Source',
  'Applied date',
  'Last updated',
]);

function csvValue(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function dateValue(value) {
  return value instanceof Date ? value.toISOString() : value || '';
}

export function applicationToCsvRow(application) {
  return [
    application.candidateName,
    application.candidateEmail,
    application.jobOpening?.title,
    application.jobOpening?.department,
    application.stage,
    application.source,
    dateValue(application.createdAt),
    dateValue(application.updatedAt),
  ].map(csvValue).join(',');
}

export function applicationsToCsv(applications) {
  return [
    CSV_HEADERS.map(csvValue).join(','),
    ...applications.map(applicationToCsvRow),
  ].join('\r\n') + '\r\n';
}

export async function exportOpenApplications() {
  const applications = await Application.aggregate([
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
      $project: {
        _id: 0,
        candidateName: 1,
        candidateEmail: 1,
        stage: 1,
        source: 1,
        createdAt: 1,
        updatedAt: 1,
        jobOpening: {
          title: '$jobOpening.title',
          department: '$jobOpening.department',
        },
      },
    },
    { $sort: { createdAt: -1, candidateName: 1 } },
  ]);

  return applicationsToCsv(applications);
}

export { CSV_HEADERS };

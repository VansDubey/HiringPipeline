import { Application } from '../models/Application.js';
import { Interview } from '../models/Interview.js';
import { JobOpening } from '../models/JobOpening.js';
import { JOB_STATUSES } from '../constants/pipeline.js';

const WEEKS_IN_QUARTER = 13;

function startOfUtcWeek(date) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const day = start.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  return start;
}

function getDashboardDateRange(now = new Date()) {
  const weekStart = startOfUtcWeek(now);
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setUTCDate(nextWeekStart.getUTCDate() + 7);

  const quarterStart = new Date(weekStart);
  quarterStart.setUTCDate(quarterStart.getUTCDate() - (WEEKS_IN_QUARTER - 1) * 7);

  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(monthStart);
  nextMonthStart.setUTCMonth(nextMonthStart.getUTCMonth() + 1);

  return { weekStart, nextWeekStart, quarterStart, monthStart, nextMonthStart };
}

function createWeekBuckets(quarterStart) {
  return Array.from({ length: WEEKS_IN_QUARTER }, (_, index) => {
    const start = new Date(quarterStart);
    start.setUTCDate(start.getUTCDate() + index * 7);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    return { weekStart: start.toISOString(), weekEnd: end.toISOString(), count: 0 };
  });
}

async function getActiveApplicationFilter() {
  const openOpeningIds = await JobOpening.find({ status: { $ne: JOB_STATUSES.ARCHIVED } }).distinct('_id');
  return { jobOpening: { $in: openOpeningIds }, stage: { $ne: 'Rejected' } };
}

export async function getDashboardMetrics(now = new Date()) {
  const { weekStart, nextWeekStart, quarterStart, monthStart, nextMonthStart } = getDashboardDateRange(now);
  const activeApplicationFilter = await getActiveApplicationFilter();

  const [
    openPositions,
    activeApplications,
    interviewsThisWeek,
    hiresThisMonth,
    byJobOpening,
    byStage,
    applicationsByWeek,
  ] = await Promise.all([
    JobOpening.countDocuments({ status: JOB_STATUSES.OPEN }),
    Application.countDocuments(activeApplicationFilter),
    Interview.countDocuments({
      status: 'scheduled',
      scheduledAt: { $gte: weekStart, $lt: nextWeekStart },
    }),
    Application.countDocuments({
      stage: 'Hired',
      updatedAt: { $gte: monthStart, $lt: nextMonthStart },
    }),
    Application.aggregate([
      { $match: activeApplicationFilter },
      { $lookup: { from: 'jobopenings', localField: 'jobOpening', foreignField: '_id', as: 'opening' } },
      { $unwind: '$opening' },
      { $group: { _id: '$opening._id', title: { $first: '$opening.title' }, count: { $sum: 1 } } },
      { $project: { _id: 0, jobOpeningId: '$_id', title: 1, count: 1 } },
      { $sort: { count: -1, title: 1 } },
    ]),
    Application.aggregate([
      { $match: activeApplicationFilter },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
      { $project: { _id: 0, stage: '$_id', count: 1 } },
      { $sort: { stage: 1 } },
    ]),
    Application.aggregate([
      {
        $match: {
          jobOpening: activeApplicationFilter.jobOpening,
          createdAt: { $gte: quarterStart, $lt: nextWeekStart },
        },
      },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: '$createdAt',
              unit: 'week',
              binSize: 1,
              startOfWeek: 'monday',
              timezone: 'UTC',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const weeklyApplications = createWeekBuckets(quarterStart);
  for (const bucket of applicationsByWeek) {
    const index = Math.round((bucket._id.getTime() - quarterStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (index >= 0 && index < weeklyApplications.length) weeklyApplications[index].count = bucket.count;
  }

  return {
    headline: { openPositions, activeApplications, interviewsThisWeek, hiresThisMonth },
    applicationsByJobOpening: byJobOpening,
    applicationsByStage: byStage,
    applicationsByWeek: weeklyApplications,
    period: {
      weekStartsAt: weekStart.toISOString(),
      monthStartsAt: monthStart.toISOString(),
      quarterStartsAt: quarterStart.toISOString(),
    },
  };
}

export { WEEKS_IN_QUARTER, createWeekBuckets, getDashboardDateRange, startOfUtcWeek };

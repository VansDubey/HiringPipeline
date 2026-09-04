import { describe, expect, it } from 'vitest';
import { applicationsToCsv } from '../services/applicationExport.service.js';
import { createWeekBuckets, DASHBOARD_ACTIVE_STAGES, getDashboardDateRange } from '../services/dashboard.service.js';
import { getStalledCutoff, isStalled, STALLABLE_APPLICATION_STAGES } from '../services/alert.service.js';
import { AlertDismissal } from '../models/AlertDismissal.js';

describe('reporting boundaries', () => {
  it('escapes CSV commas, quotes, and newlines', () => {
    const csv = applicationsToCsv([{
      candidateName: 'Doe, "Maya"', candidateEmail: 'maya@example.com',
      jobOpening: { title: 'Platform\nEngineer', department: 'Engineering' },
      stage: 'Interview', source: 'Referral',
      createdAt: new Date('2026-01-01T00:00:00Z'), updatedAt: new Date('2026-01-02T00:00:00Z'),
    }]);
    expect(csv).toContain('"Doe, ""Maya"""');
    expect(csv).toContain('"Platform\nEngineer"');
    expect(csv.endsWith('\r\n')).toBe(true);
  });

  it('uses Monday UTC week and calendar-month boundaries', () => {
    const range = getDashboardDateRange(new Date('2026-09-04T12:00:00Z'));
    expect(range.weekStart.toISOString()).toBe('2026-08-31T00:00:00.000Z');
    expect(range.nextWeekStart.toISOString()).toBe('2026-09-07T00:00:00.000Z');
    expect(range.monthStart.toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(createWeekBuckets(range.quarterStart)).toHaveLength(13);
  });

  it('marks an application stalled at exactly ten days', () => {
    const now = new Date('2026-09-11T00:00:00Z');
    expect(getStalledCutoff(now).toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(isStalled('2026-09-01T00:00:00Z', now)).toBe(true);
    expect(isStalled('2026-09-01T00:00:01Z', now)).toBe(false);
  });

  it('does not treat completed or rejected applications as stallable', () => {
    expect(STALLABLE_APPLICATION_STAGES).toEqual(['Applied', 'Screening', 'Interview', 'Offer']);
    expect(STALLABLE_APPLICATION_STAGES).not.toContain('Hired');
    expect(STALLABLE_APPLICATION_STAGES).not.toContain('Rejected');
  });

  it('counts only in-progress pipeline stages as active on the dashboard', () => {
    expect(DASHBOARD_ACTIVE_STAGES).toEqual(['Applied', 'Screening', 'Interview', 'Offer']);
  });

  it('scopes dismissals by application and stage so a later-stage alert can reappear', () => {
    const uniqueIndex = AlertDismissal.schema.indexes().find(([, options]) => options.unique);
    expect(uniqueIndex[0]).toEqual({ application: 1, stage: 1 });
    expect(isStalled('2026-09-01T00:00:00Z', new Date('2026-09-12T00:00:00Z'))).toBe(true);
  });
});

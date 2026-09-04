import { beforeEach, describe, expect, it, vi } from 'vitest';

const modelMocks = vi.hoisted(() => ({ aggregate: vi.fn(), assignments: vi.fn() }));
vi.mock('../models/Application.js', () => ({ Application: { aggregate: modelMocks.aggregate } }));
vi.mock('../models/JobOpening.js', () => ({ JobOpening: {} }));
vi.mock('../models/PanelAssignment.js', () => ({ PanelAssignment: { find: modelMocks.assignments } }));

import { searchApplications } from '../services/applicationSearch.service.js';

describe('server-side search, sorting, and pagination', () => {
  beforeEach(() => modelMocks.aggregate.mockReset());

  it('returns database totals and page metadata', async () => {
    modelMocks.aggregate.mockResolvedValue([{ data: [{ candidateName: 'Maya' }], metadata: [{ total: 41 }] }]);
    const result = await searchApplications({ user: { role: 'recruiter' }, query: { search: 'maya', sortBy: 'updatedAt', page: '2', limit: '20' } });
    expect(result.pagination).toEqual({ page: 2, limit: 20, total: 41, totalPages: 3 });
    const pipeline = modelMocks.aggregate.mock.calls[0][0];
    expect(pipeline[0].$match.$or).toHaveLength(2);
    expect(pipeline.at(-1).$facet.data).toEqual(expect.arrayContaining([{ $skip: 20 }, { $limit: 20 }]));
  });

  it('rejects unknown sorts, stages, and excessive page sizes', async () => {
    await expect(searchApplications({ user: { role: 'recruiter' }, query: { sortBy: 'passwordHash' } })).rejects.toThrow('sortBy must be one of');
    await expect(searchApplications({ user: { role: 'recruiter' }, query: { stage: 'Onsite' } })).rejects.toThrow('stage must be one of');
    await expect(searchApplications({ user: { role: 'recruiter' }, query: { limit: '101' } })).rejects.toThrow('Pagination values');
  });

  it('casts opening identifiers and matches source text case-insensitively', async () => {
    modelMocks.aggregate.mockResolvedValue([{ data: [], metadata: [] }]);
    await searchApplications({
      user: { role: 'recruiter' },
      query: { jobOpening: '507f1f77bcf86cd799439011', source: 'link' },
    });
    const match = modelMocks.aggregate.mock.calls[0][0][0].$match;
    expect(match.jobOpening.toString()).toBe('507f1f77bcf86cd799439011');
    expect(match.source).toBeInstanceOf(RegExp);
    expect(match.source.test('LinkedIn')).toBe(true);
  });
});

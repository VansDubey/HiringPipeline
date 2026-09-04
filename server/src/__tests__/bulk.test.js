import { beforeEach, describe, expect, it, vi } from 'vitest';

const transitionMocks = vi.hoisted(() => ({
  advance: vi.fn(),
  reject: vi.fn(),
}));

vi.mock('../services/pipeline.service.js', () => ({
  advanceApplication: transitionMocks.advance,
  rejectApplication: transitionMocks.reject,
}));

import { bulkAdvanceApplications } from '../services/bulkApplication.service.js';

describe('bulk partial success', () => {
  beforeEach(() => transitionMocks.advance.mockReset());

  it('reports success and refusal independently', async () => {
    const first = '507f1f77bcf86cd799439011';
    const second = '507f1f77bcf86cd799439012';
    transitionMocks.advance
      .mockResolvedValueOnce({ _id: first, stage: 'Screening' })
      .mockRejectedValueOnce(new Error('Hired applications cannot advance further'));

    const output = await bulkAdvanceApplications([first, second], '507f1f77bcf86cd799439099');
    expect(output.summary).toEqual({ total: 2, succeeded: 1, refused: 1 });
    expect(output.results[0]).toMatchObject({ status: 'succeeded', stage: 'Screening' });
    expect(output.results[1]).toMatchObject({ status: 'refused', reason: 'Hired applications cannot advance further' });
  });
});

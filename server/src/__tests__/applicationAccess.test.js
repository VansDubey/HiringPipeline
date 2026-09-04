import { beforeEach, describe, expect, it, vi } from 'vitest';

const panelMocks = vi.hoisted(() => ({ exists: vi.fn() }));
vi.mock('../models/PanelAssignment.js', () => ({ PanelAssignment: { exists: panelMocks.exists } }));

import { requireApplicationAccess } from '../middleware/applicationAccess.js';

const applicationId = '507f1f77bcf86cd799439011';

describe('panel application access', () => {
  beforeEach(() => panelMocks.exists.mockReset());

  it('allows recruiters without a panel assignment query', async () => {
    const next = vi.fn();
    await requireApplicationAccess({ user: { role: 'recruiter' }, params: { id: applicationId } }, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(panelMocks.exists).not.toHaveBeenCalled();
  });

  it('allows only the assigned interviewer', async () => {
    panelMocks.exists.mockResolvedValueOnce({ _id: 'assignment' });
    const next = vi.fn();
    const user = { _id: '507f1f77bcf86cd799439099', role: 'interviewer' };
    await requireApplicationAccess({ user, params: { id: applicationId } }, {}, next);
    expect(panelMocks.exists).toHaveBeenCalledWith({ application: applicationId, interviewer: user._id });
    expect(next).toHaveBeenCalledWith();
  });

  it('returns 403 for an unassigned interviewer', async () => {
    panelMocks.exists.mockResolvedValueOnce(null);
    const next = vi.fn();
    await requireApplicationAccess({ user: { _id: '507f1f77bcf86cd799439099', role: 'interviewer' }, params: { id: applicationId } }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 403 });
  });
});

import { describe, expect, it, vi } from 'vitest';
import { requireRole } from '../middleware/roles.js';
import { requireAuth } from '../middleware/auth.js';

function runMiddleware(middleware, request = {}) {
  const next = vi.fn();
  middleware(request, {}, next);
  return next;
}

describe('authorization middleware', () => {
  it('returns 401 when authentication is missing', () => {
    expect(runMiddleware(requireRole('recruiter')).mock.calls[0][0]).toMatchObject({ statusCode: 401 });
  });

  it('returns 403 when an interviewer enters a recruiter workflow', () => {
    const next = runMiddleware(requireRole('recruiter'), { user: { role: 'interviewer' } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 403 });
  });

  it('allows the required role', () => {
    expect(runMiddleware(requireRole('recruiter'), { user: { role: 'recruiter' } })).toHaveBeenCalledWith();
  });

  it('rejects requests with no auth cookie before database access', async () => {
    const next = vi.fn();
    await requireAuth({ cookies: {} }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401, message: 'Authentication required' });
  });
});

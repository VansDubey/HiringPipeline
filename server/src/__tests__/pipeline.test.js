import { describe, expect, it } from 'vitest';
import { planAdvance, planReinstatement, planRejection } from '../services/pipeline.service.js';

describe('pipeline rules', () => {
  it.each([
    ['Applied', 'Screening'],
    ['Screening', 'Interview'],
    ['Interview', 'Offer'],
    ['Offer', 'Hired'],
  ])('advances %s one stage to %s', (current, next) => {
    expect(planAdvance(current)).toMatchObject({ oldStage: current, newStage: next });
  });

  it('prevents terminal and rejected applications from advancing', () => {
    expect(() => planAdvance('Hired')).toThrow('cannot advance');
    expect(() => planAdvance('Rejected')).toThrow('must be reinstated');
  });

  it.each(['Applied', 'Screening', 'Interview', 'Offer', 'Hired'])('rejects from %s', (stage) => {
    expect(planRejection(stage)).toEqual({ oldStage: stage, newStage: 'Rejected', eventType: 'rejected' });
  });

  it('reinstates to the exact rejected stage', () => {
    expect(planReinstatement('Rejected', 'Interview')).toMatchObject({ newStage: 'Interview' });
    expect(() => planReinstatement('Screening', 'Applied')).toThrow('Only rejected');
  });
});

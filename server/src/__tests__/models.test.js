import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { ApplicationEvent } from '../models/ApplicationEvent.js';

describe('immutable application history', () => {
  it('refuses to save an existing event', async () => {
    const event = new ApplicationEvent({
      application: new mongoose.Types.ObjectId(), type: 'feedback_submitted',
      feedback: 'Strong technical evidence', performedBy: new mongoose.Types.ObjectId(),
    });
    event.isNew = false;
    await expect(event.save()).rejects.toThrow('Application history is immutable');
  });

  it('refuses update and delete query operations', async () => {
    await expect(ApplicationEvent.updateOne({}, { feedback: 'rewritten' })).rejects.toThrow('Application history is immutable');
    await expect(ApplicationEvent.deleteOne({})).rejects.toThrow('Application history is immutable');
  });
});

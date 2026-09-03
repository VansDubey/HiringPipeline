import { Router } from 'express';
import { getMetrics } from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRecruiter } from '../middleware/roles.js';

export const dashboardRouter = Router();

dashboardRouter.get('/', requireAuth, requireRecruiter, getMetrics);

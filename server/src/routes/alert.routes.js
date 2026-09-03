import { Router } from 'express';
import * as controller from '../controllers/alert.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRecruiter } from '../middleware/roles.js';

export const alertRouter = Router();

alertRouter.use(requireAuth, requireRecruiter);
alertRouter.get('/', controller.list);
alertRouter.post('/:applicationId/dismiss', controller.dismiss);

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRecruiter } from '../middleware/roles.js';
import * as controller from '../controllers/jobOpening.controller.js';
import { listByOpening } from '../controllers/application.controller.js';

export const jobOpeningRouter = Router();

jobOpeningRouter.use(requireAuth, requireRecruiter);
jobOpeningRouter.get('/', controller.list);
jobOpeningRouter.post('/', controller.create);
jobOpeningRouter.get('/:id/applications', listByOpening);
jobOpeningRouter.get('/:id', controller.getById);
jobOpeningRouter.patch('/:id', controller.update);
jobOpeningRouter.post('/:id/archive', controller.archive);
jobOpeningRouter.post('/:id/restore', controller.restore);

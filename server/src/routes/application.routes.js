import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRecruiter } from '../middleware/roles.js';
import * as controller from '../controllers/application.controller.js';

export const applicationRouter = Router();

applicationRouter.use(requireAuth, requireRecruiter);
applicationRouter.post('/', controller.create);
applicationRouter.post('/:id/advance', controller.advance);
applicationRouter.post('/:id/reject', controller.reject);
applicationRouter.post('/:id/reinstate', controller.reinstate);
applicationRouter.get('/:id', controller.getById);
applicationRouter.patch('/:id', controller.update);

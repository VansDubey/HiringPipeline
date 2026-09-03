import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRecruiter } from '../middleware/roles.js';
import * as controller from '../controllers/application.controller.js';

export const applicationRouter = Router();

applicationRouter.use(requireAuth, requireRecruiter);
applicationRouter.post('/', controller.create);
applicationRouter.get('/:id', controller.getById);
applicationRouter.patch('/:id', controller.update);

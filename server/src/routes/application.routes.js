import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireApplicationAccess } from '../middleware/applicationAccess.js';
import { requireRecruiter } from '../middleware/roles.js';
import { requireInterviewer } from '../middleware/roles.js';
import * as controller from '../controllers/application.controller.js';
import * as panelController from '../controllers/panel.controller.js';

export const applicationRouter = Router();

applicationRouter.get('/', requireAuth, controller.search);
applicationRouter.post('/', requireAuth, requireRecruiter, controller.create);
applicationRouter.post('/bulk-advance', requireAuth, requireRecruiter, controller.bulkAdvance);
applicationRouter.post('/bulk-reject', requireAuth, requireRecruiter, controller.bulkReject);
applicationRouter.get('/export.csv', requireAuth, requireRecruiter, controller.exportCsv);
applicationRouter.post('/:id/advance', requireAuth, requireRecruiter, controller.advance);
applicationRouter.post('/:id/reject', requireAuth, requireRecruiter, controller.reject);
applicationRouter.post('/:id/reinstate', requireAuth, requireRecruiter, controller.reinstate);
applicationRouter.get('/my-panel', requireAuth, requireInterviewer, panelController.getMyPanel);
applicationRouter.get('/:id/panel', requireAuth, requireApplicationAccess, panelController.getPanel);
applicationRouter.post('/:id/panel', requireAuth, requireRecruiter, panelController.assign);
applicationRouter.delete('/:id/panel/:interviewerId', requireAuth, requireRecruiter, panelController.remove);
applicationRouter.post('/:id/feedback', requireAuth, requireInterviewer, requireApplicationAccess, panelController.feedback);
applicationRouter.get('/:id/timeline', requireAuth, requireApplicationAccess, panelController.timeline);
applicationRouter.get('/:id', requireAuth, requireApplicationAccess, controller.getById);
applicationRouter.patch('/:id', requireAuth, requireRecruiter, controller.update);

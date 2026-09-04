import { Router } from 'express';
import { getCurrentUser, listInterviewers, login, logout } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRecruiter } from '../middleware/roles.js';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuth, getCurrentUser);
authRouter.get('/interviewers', requireAuth, requireRecruiter, listInterviewers);

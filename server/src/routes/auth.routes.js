import { Router } from 'express';
import { getCurrentUser, login, logout } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuth, getCurrentUser);

import express from 'express';
import {  markSessionAsUncompleted, getFeedbacksBySessionId, getSessionById, SessionFeedback, getAllSessions, createSession, markSessionAsCompleted } from '../controllers/session.controller.js';
import {isAdmin} from '../middlewares/auth.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', getAllSessions);
router.post('/', authenticate, createSession);
router.patch('/:id/complete', authenticate, markSessionAsCompleted);
router.get('/:id', authenticate, getSessionById);
router.post('/:id/feedback',authenticate, SessionFeedback);
router.get('/:id/feedback', authenticate, getFeedbacksBySessionId);
router.patch('/:id/uncomplete', authenticate, markSessionAsUncompleted);
export default router;


import express from 'express';
import { getWeeksByPlanId, getWeekById, createWeek, updateWeek, deleteWeek } from '../controllers/week.controller.js';
import { isAdmin } from '../middlewares/auth.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', authenticate, isAdmin, createWeek);
router.get('/plan/:planId', getWeeksByPlanId);
router.get('/:id', authenticate, isAdmin, getWeekById);
router.put('/:id',authenticate, isAdmin, updateWeek);
router.delete('/:id', authenticate, isAdmin, deleteWeek);

export default router;

import express from 'express';
import { getUserActiveTrainingPlans, getUserActiveTrainingPlan, getAllTrainingPlans, createTrainingPlan, getTrainingPlanById, startTrainingPlan } from '../controllers/plan.controller.js';
import {isAdmin} from '../middlewares/auth.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', getAllTrainingPlans);
router.get('/user/active-plan', authenticate, getUserActiveTrainingPlan);
router.post('/start', authenticate, startTrainingPlan);
router.get('/id/:planId', getTrainingPlanById);
router.post('/', authenticate, isAdmin, createTrainingPlan);
router.get('/user/active-plans', authenticate, getUserActiveTrainingPlans);

export default router;
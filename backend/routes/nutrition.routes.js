import express from 'express';
import { getNutritionTipBySessionId } from '../controllers/nutrition.controller.js';


const router = express.Router();

router.get('/:sessionId', getNutritionTipBySessionId);

export default router;
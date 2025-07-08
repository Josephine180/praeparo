import express from 'express';
import { getUserStats } from '../controllers/stats.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// Route pour les statistiques globales
// GET /stats/overview
router.get('/overview', authenticate, getUserStats);

export default router;

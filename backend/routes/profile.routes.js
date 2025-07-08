import express from 'express';
import { getMyProfile, createMyProfile, updateMyProfile } from '../controllers/profile.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.post('/create', authenticate, createMyProfile);
router.get('/load', authenticate, getMyProfile);
router.put('/update', authenticate, updateMyProfile);

export default router;
import express from 'express';
import { login, register, logout, getAllUsers, createUser, deleteUser, getUserbyId, modifyUser } from '../controllers/user.controller.js';
import {isAdmin} from '../middlewares/auth.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// Routes d'authentification
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Routes CRUD utilisateurs
router.get('/', getAllUsers);
router.post('/', authenticate, createUser);
router.get('/:id', authenticate, isAdmin, getUserbyId);
router.put('/:id', authenticate, isAdmin, modifyUser);
router.delete('/:id', authenticate, isAdmin, deleteUser);

export default router;

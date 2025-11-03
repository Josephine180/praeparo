// IMPORTANT : charger dotenv EN PREMIER
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import prisma from './src/index.js';
import userRoutes from './routes/user.routes.js';
import trainingPlanRoutes from './routes/plan.routes.js';
import sessionRoutes from './routes/session.routes.js';
import nutritionRoutes from './routes/nutrition.routes.js';
import profileRoutes from './routes/profile.routes.js';
import weekRoutes from './routes/week.routes.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import statsRoutes from './routes/stats.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// fichiers statics
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// configurations explicites
app.use((req, res, next) => {
  if (req.path.endsWith('.css')) {
    res.type('text/css');
  } else if (req.path.endsWith('.js')) {
    res.type('application/javascript');
  } else if (req.path.endsWith('.html')) {
    res.type('text/html');
  }
  next();
});

// 3. Configuration CORS 
app.use(cors({
  origin: (origin, callback) => {
    // Autoriser toutes les origines en développement
    const allowedOrigins = [
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://192.168.1.23:5000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://praeparo-3.onrender.com', 
      'http://praeparo-3.onrender.com'
    ];
    
    // 
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(' CORS: Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ], 
  exposedHeaders: ['Set-Cookie'], 
  optionsSuccessStatus: 200 
}));

app.use(cookieParser());

app.use((req, res, next) => {
  console.log('Cookies reçus:', req.cookies);
  console.log('Headers:', req.headers);
  console.log('URL:', req.method, req.url);
  next();
});

app.use(express.json());

// Routes
app.use('/stats', statsRoutes);
app.use('/profile', profileRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/training-plans', trainingPlanRoutes);
app.use('/sessions', sessionRoutes);
app.use('/nutrition', nutritionRoutes);
app.use('/weeks', weekRoutes);

//  Routes pour servir index.html aux routes spécifiques
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.get('/programs', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

export default app;
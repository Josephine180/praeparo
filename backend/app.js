// IMPORTANT : charger dotenv EN PREMIER
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import prisma from './src/index.js';
import userRoutes from './routes/user.routes.js';
import trainingPlanRoutes from './routes/plan.routes.js';
import sessionRoutes from './routes/session.routes.js';
import nutritionRoutes from './routes/nutrition.routes.js';
import weekRoutes from './routes/week.routes.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser toutes les origines en développement
    // En production, vous devriez être plus restrictif
    const allowedOrigins = [
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://192.168.1.23:5000',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    // Autoriser les requêtes sans origine (ex: Postman, applications natives)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS: Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());

app.use((req, res, next) => {
  console.log('🍪 Cookies reçus:', req.cookies);
  console.log('📝 Headers:', req.headers);
  console.log('🌐 URL:', req.method, req.url);
  next();
});

app.use(express.static('frontend'));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/training-plans', trainingPlanRoutes);
app.use('/sessions', sessionRoutes);
app.use('/nutrition', nutritionRoutes);
app.use('/weeks', weekRoutes);

export default app;

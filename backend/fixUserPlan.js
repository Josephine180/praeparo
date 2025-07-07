// backend/fixUserPlan.js
import dotenv from 'dotenv';
dotenv.config();

import prisma from './src/index.js';

async function fixUserPlan() {
  try {
    console.log('🔍 Recherche des données...');
    
    // 1. Trouver l'utilisateur test
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    if (!user) {
      console.log('❌ Utilisateur test@example.com non trouvé');
      return;
    }
    
    console.log('👤 Utilisateur trouvé:', user.id, user.email);
    
    // 2. Trouver le premier plan disponible
    const plan = await prisma.trainingPlan.findFirst();
    
    if (!plan) {
      console.log('❌ Aucun plan d\'entraînement trouvé');
      return;
    }
    
    console.log('📋 Plan trouvé:', plan.id, plan.goal_type);
    
    // 3. Vérifier s'il y a déjà une association
    const existing = await prisma.userTrainingPlan.findUnique({
      where: {
        user_id_training_plan_id: {
          user_id: user.id,
          training_plan_id: plan.id
        }
      }
    });
    
    if (existing) {
      console.log('✅ Association déjà existante:', existing.id);
      return;
    }
    
    // 4. Créer l'association
    const association = await prisma.userTrainingPlan.create({
      data: {
        user_id: user.id,
        training_plan_id: plan.id,
        started_at: new Date()
      }
    });
    
    console.log('🎉 Association créée:', association.id);
    console.log('✅ L\'utilisateur', user.email, 'a maintenant accès au plan', plan.goal_type);
    
  } catch (error) {
    console.error('💥 Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserPlan();

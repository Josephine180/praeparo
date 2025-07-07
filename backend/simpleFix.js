// backend/simpleFix.js
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from './generated/prisma/index.js';

// Créer une nouvelle instance Prisma indépendante
const prisma = new PrismaClient();

async function simpleFix() {
  try {
    console.log('🚀 Script de correction simple');
    
    // 1. Vérifier la connexion à la base
    await prisma.$connect();
    console.log('✅ Connexion à la base réussie');
    
    // 2. Chercher l'utilisateur ID 2
    const user2 = await prisma.user.findUnique({
      where: { id: 2 }
    });
    
    if (!user2) {
      console.log('❌ Utilisateur ID 2 introuvable');
      
      // Lister tous les utilisateurs
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, name: true }
      });
      console.log('👥 Utilisateurs disponibles:', allUsers);
      
      if (allUsers.length === 0) {
        console.log('❌ Aucun utilisateur dans la base');
        return;
      }
      
      // Prendre le premier utilisateur disponible
      const targetUser = allUsers[0];
      console.log('🎯 Utilisation de:', targetUser.email);
      return await createAssociationForUser(targetUser.id);
    }
    
    console.log('👤 Utilisateur ID 2 trouvé:', user2.email);
    return await createAssociationForUser(2);
    
  } catch (error) {
    console.error('💥 Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Déconnexion de la base');
  }
}

async function createAssociationForUser(userId) {
  try {
    // 1. Vérifier les plans disponibles
    const planCount = await prisma.trainingPlan.count();
    console.log('📊 Nombre de plans dans la base:', planCount);
    
    if (planCount === 0) {
      console.log('❌ Aucun plan d\'entraînement disponible');
      return;
    }
    
    // 2. Prendre le premier plan
    const firstPlan = await prisma.trainingPlan.findFirst({
      select: { id: true, goal_type: true }
    });
    
    console.log('📋 Plan sélectionné:', firstPlan.id, firstPlan.goal_type);
    
    // 3. Vérifier s'il y a déjà une association
    const existingAssociation = await prisma.userTrainingPlan.findFirst({
      where: { 
        user_id: userId,
        training_plan_id: firstPlan.id 
      }
    });
    
    if (existingAssociation) {
      console.log('✅ Association déjà existante:', existingAssociation.id);
      return;
    }
    
    // 4. Créer l'association
    const newAssociation = await prisma.userTrainingPlan.create({
      data: {
        user_id: userId,
        training_plan_id: firstPlan.id,
        started_at: new Date()
      }
    });
    
    console.log('🎉 Nouvelle association créée:', newAssociation.id);
    console.log(`✅ UserID ${userId} → Plan "${firstPlan.goal_type}"`);
    
    // 5. Vérification
    const totalAssociations = await prisma.userTrainingPlan.count({
      where: { user_id: userId }
    });
    
    console.log(`🏁 Total associations pour UserID ${userId}:`, totalAssociations);
    
  } catch (error) {
    console.error('💥 Erreur lors de la création:', error.message);
  }
}

simpleFix();

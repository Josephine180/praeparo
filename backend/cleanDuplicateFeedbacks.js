// backend/cleanDuplicateFeedbacks.js
// Script pour nettoyer les feedbacks en double avant la migration

import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function cleanDuplicateFeedbacks() {
  try {
    console.log('🔍 Vérification des doublons dans les feedbacks...');
    
    // 1. Trouver tous les feedbacks groupés par session_id et user_id
    const duplicateCheck = await prisma.feedback.groupBy({
      by: ['session_id', 'user_id'],
      _count: {
        id: true
      },
      having: {
        id: {
          _count: {
            gt: 1
          }
        }
      }
    });
    
    console.log(`📊 Trouvé ${duplicateCheck.length} groupes de doublons`);
    
    if (duplicateCheck.length === 0) {
      console.log('✅ Aucun doublon trouvé ! Vous pouvez procéder à la migration.');
      return;
    }
    
    // 2. Pour chaque groupe de doublons, garder le plus récent
    let totalDeleted = 0;
    
    for (const duplicate of duplicateCheck) {
      console.log(`🔄 Traitement des doublons pour session ${duplicate.session_id}, user ${duplicate.user_id}`);
      
      // Récupérer tous les feedbacks de ce groupe, triés par date (le plus récent en premier)
      const feedbacks = await prisma.feedback.findMany({
        where: {
          session_id: duplicate.session_id,
          user_id: duplicate.user_id
        },
        orderBy: {
          created_at: 'desc'
        }
      });
      
      console.log(`  📋 ${feedbacks.length} feedbacks trouvés`);
      
      // Garder le premier (plus récent) et supprimer les autres
      const toKeep = feedbacks[0];
      const toDelete = feedbacks.slice(1);
      
      console.log(`  ✅ Conservation du feedback ${toKeep.id} (${toKeep.created_at})`);
      console.log(`  🗑️  Suppression de ${toDelete.length} ancien(s) feedback(s)`);
      
      // Supprimer les anciens feedbacks
      for (const feedback of toDelete) {
        await prisma.feedback.delete({
          where: { id: feedback.id }
        });
        console.log(`    ❌ Supprimé feedback ${feedback.id} (${feedback.created_at})`);
        totalDeleted++;
      }
    }
    
    console.log(`\n🎉 Nettoyage terminé ! ${totalDeleted} feedbacks supprimés.`);
    console.log('✅ Vous pouvez maintenant procéder à la migration avec "y".');
    
  } catch (error) {
    console.error('💥 Erreur lors du nettoyage:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour juste vérifier sans supprimer
async function checkDuplicatesOnly() {
  try {
    console.log('🔍 Vérification des doublons (sans suppression)...');
    
    const duplicateCheck = await prisma.feedback.groupBy({
      by: ['session_id', 'user_id'],
      _count: {
        id: true
      },
      having: {
        id: {
          _count: {
            gt: 1
          }
        }
      }
    });
    
    console.log(`📊 Trouvé ${duplicateCheck.length} groupes de doublons`);
    
    if (duplicateCheck.length === 0) {
      console.log('✅ Aucun doublon trouvé !');
      return;
    }
    
    // Afficher le détail des doublons
    for (const duplicate of duplicateCheck) {
      console.log(`\n🔄 Doublons pour session ${duplicate.session_id}, user ${duplicate.user_id}:`);
      
      const feedbacks = await prisma.feedback.findMany({
        where: {
          session_id: duplicate.session_id,
          user_id: duplicate.user_id
        },
        orderBy: {
          created_at: 'desc'
        }
      });
      
      feedbacks.forEach((fb, index) => {
        console.log(`  ${index === 0 ? '🟢' : '🔴'} ID: ${fb.id}, Créé: ${fb.created_at}, Énergie: ${fb.energy_level}`);
      });
    }
    
    console.log(`\n⚠️  Vous devez nettoyer ces doublons avant la migration.`);
    console.log('💡 Exécutez: node cleanDuplicateFeedbacks.js clean');
    
  } catch (error) {
    console.error('💥 Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter selon l'argument
const action = process.argv[2];

if (action === 'clean') {
  cleanDuplicateFeedbacks();
} else {
  checkDuplicatesOnly();
}
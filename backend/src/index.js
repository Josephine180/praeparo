import { PrismaClient } from '../generated/prisma/index.js';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function importData() {
  try {
   // console.log("Début de l'import des données...");

    // 1. Nettoyer la base de données (attention en production !)
   // console.log('Nettoyage de la base...');
  //  await prisma.feedback.deleteMany({});
   // await prisma.session.deleteMany({});
   // await prisma.week.deleteMany({});
   // await prisma.trainingPlan.deleteMany({});
    //await prisma.nutritionTip.deleteMany({});
    //await prisma.user.deleteMany({});

    // 2. Créer un utilisateur test
    console.log("Création d'un utilisateur test...");
   let testUser = await prisma.user.findUnique({ 
    where: { email: "test@example.com"},
   })
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password_hash: 'hashed_password_here', // à remplacer par un vrai hash si besoin
          name: "Jean",
          firstname: "Dupont"
        }
      })
    };

    // 3. Charger les fichiers JSON des plans
    const planFiles = ['plan_5k.json', 'plan_10k.json', 'plan_21k.json', 'plan_42k.json'];
    const trainingPlansData = [];

    for (const fileName of planFiles) {
      try {
        const planData = JSON.parse(
          fs.readFileSync(path.join(process.cwd(), 'data', fileName), 'utf8')
        );
        trainingPlansData.push(planData);
        console.log(`Fichier ${fileName} lu avec succès`);
      } catch (error) {
        console.warn(`Impossible de lire ${fileName}:`, error.message);
      }
    }

    let totalNutritionTips = [];
    let globalSessionCounter = 1;

    for (const planData of trainingPlansData) {
      // Vérifier si un plan similaire existe déjà
      const existingPlan = await prisma.trainingPlan.findFirst({
        where: {
          user_id: testUser.id,
          goal_type: planData.type,
        }
      });

      if (existingPlan) {
        console.log(`Le plan "${planData.type}" existe déjà. Ignoré.`);
        continue;
      }

      // Créer le plan
      const trainingPlan = await prisma.trainingPlan.create({
        data: {
          user_id: testUser.id,
          goal_type: planData.type,
          goal_time: planData.duration || null,
        }
      });

      for (const weekData of planData.weeks) {
        const week = await prisma.week.create({
          data: {
            training_plan_id: trainingPlan.id,
            week_number: weekData.week_number,
            description: weekData.description,
          }
        });

        // Extraire tips nutritionnels uniques de la semaine
        const weekTips = new Set();
        for (const session of weekData.sessions) {
          if (session.nutrition_tips) {
            session.nutrition_tips.forEach(tip => weekTips.add(tip));
          }
        }

        // Créer les tips nutritionnels pour la semaine
        const createdTips = [];
        for (const tipText of weekTips) {
          const nutritionTip = await prisma.nutritionTip.create({
            data: {
              week_number: weekData.week_number,
              plan_type: planData.type,
              tip_text: tipText,
            }
          });
          createdTips.push(nutritionTip);
          totalNutritionTips.push(nutritionTip);
        }

        // Créer les sessions
        for (const session of weekData.sessions) {
          // Trouver un nutrition tip associé à la session (le premier tip de la session)
          let nutritionTip = null;
          if (session.nutrition_tips && session.nutrition_tips.length > 0) {
            nutritionTip = createdTips.find(tip => tip.tip_text === session.nutrition_tips[0]);
          }
          // Sinon, fallback sur le premier tip global s'il existe
          if (!nutritionTip && totalNutritionTips.length > 0) {
            nutritionTip = totalNutritionTips[0];
          }
          // Sinon, créer un tip générique
          if (!nutritionTip) {
            nutritionTip = await prisma.nutritionTip.create({
              data: {
                week_number: weekData.week_number,
                plan_type: planData.type,
                tip_text: "Hydratation recommandée après l'effort",
              }
            });
            totalNutritionTips.push(nutritionTip);
          }

          await prisma.session.create({
            data: {
              training_plan_id: trainingPlan.id,
              week_id: week.id,
              session_number: globalSessionCounter,
              session_order: session.session_order,
              date: new Date(Date.now() + (globalSessionCounter - 1) * 24 * 60 * 60 * 1000),
              title: session.title,
              description: session.description,
              duree: session.duration, // ou "duration" selon le schéma Prisma
              completed: false,
              nutrition_tip_id: nutritionTip.id,
            }
          });

          globalSessionCounter++;
        }

        console.log(`Semaine ${weekData.week_number} avec ${weekData.sessions.length} sessions importée`);
      }

      console.log(`Plan "${planData.type}" avec ${planData.weeks.length} semaines importé`);
    }

    console.log('Import terminé avec succès!');

    // Affichage des stats
    const stats = await getStats();
    console.log('\nRésumé:');
    console.log(`- ${stats.users} utilisateurs`);
    console.log(`- ${stats.plans} plans d'entraînement`);
    console.log(`- ${stats.weeks} semaines`);
    console.log(`- ${stats.sessions} sessions`);
    console.log(`- ${stats.nutritionTips} tips nutritionnels`);

  } catch (error) {
    console.error("Erreur lors de l'import:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function getStats() {
  const [users, plans, weeks, sessions, nutritionTips] = await Promise.all([
    prisma.user.count(),
    prisma.trainingPlan.count(),
    prisma.week.count(),
    prisma.session.count(),
    prisma.nutritionTip.count(),
  ]);

  return { users, plans, weeks, sessions, nutritionTips };
}

importData().catch((error) => {
  console.error("Échec de l'import:", error);
  process.exit(1);
});

export default prisma;

import { PrismaClient } from '../generated/prisma/index.js';
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🚀 Début de l'import des données...");

    // 1. Vérifier/créer un utilisateur par défaut
    let defaultUser = await prisma.user.findUnique({
      where: { id: 1 }
    });

    if (!defaultUser) {
      console.log("👤 Création de l'utilisateur par défaut...");
      defaultUser = await prisma.user.create({
        data: {
          email: 'admin@praeparo.com',
          password_hash: '$2b$10$default.hash.for.production',
          name: "Admin",
          firstname: "Praeparo",
          role: "admin"
        }
      });
      console.log(`✅ Utilisateur créé avec l'ID: ${defaultUser.id}`);
    }

    // 2. Récupère tous les fichiers JSON
    const files = ["plan_5k.json", "plan_10k.json", "plan_21k.json", "plan_42k.json"];

    for (const file of files) {
      console.log(`📖 Traitement du fichier: ${file}`);
      
      const filePath = path.join(process.cwd(), "data", file);
      
      // Vérifier que le fichier existe
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Fichier non trouvé: ${filePath}`);
        continue;
      }

      const rawData = fs.readFileSync(filePath, "utf-8");
      const plan = JSON.parse(rawData);

      // Vérifier si ce plan existe déjà
      const existingPlan = await prisma.trainingPlan.findFirst({
        where: {
          goal_type: plan.type,
          user_id: defaultUser.id
        }
      });

      if (existingPlan) {
        console.log(`⏭️  Plan "${plan.type}" existe déjà, ignoré.`);
        continue;
      }

      console.log(`🏗️  Création du plan: ${plan.type}`);

      // 3. Créer le plan d'entraînement
      const trainingPlan = await prisma.trainingPlan.create({
        data: {
          goal_type: plan.type,
          goal_time: plan.duration || 'Non spécifié',
          user_id: defaultUser.id,
        }
      });

      console.log(`✅ Plan créé avec l'ID: ${trainingPlan.id}`);

      // 4. Compteur global pour session_number
      let globalSessionCounter = 1;

      // 5. Traiter chaque semaine
      for (const weekData of plan.weeks) {
        console.log(`  📅 Création semaine ${weekData.week_number}...`);
        
        const week = await prisma.week.create({
          data: {
            training_plan_id: trainingPlan.id,
            week_number: weekData.week_number,
            description: weekData.description || `Semaine ${weekData.week_number}`,
          }
        });

        // 6. Collecter tous les tips nutritionnels uniques de la semaine
        const weekTips = new Set();
        for (const session of weekData.sessions) {
          if (session.nutrition_tips && Array.isArray(session.nutrition_tips)) {
            session.nutrition_tips.forEach(tip => weekTips.add(tip));
          }
        }

        // 7. Créer les tips nutritionnels
        const createdTips = [];
        for (const tipText of weekTips) {
          const nutritionTip = await prisma.nutritionTip.create({
            data: {
              week_number: weekData.week_number,
              plan_type: plan.type,
              tip_text: tipText,
            }
          });
          createdTips.push(nutritionTip);
        }

        // 8. Créer un tip par défaut si aucun n'existe
        if (createdTips.length === 0) {
          const defaultTip = await prisma.nutritionTip.create({
            data: {
              week_number: weekData.week_number,
              plan_type: plan.type,
              tip_text: "Hydratation recommandée après l'effort.",
            }
          });
          createdTips.push(defaultTip);
        }

        // 9. Créer les sessions
        for (const sessionData of weekData.sessions) {
          // Trouver le tip nutritionnel approprié
          let nutritionTip = createdTips[0]; // Par défaut le premier
          
          if (sessionData.nutrition_tips && sessionData.nutrition_tips.length > 0) {
            const matchingTip = createdTips.find(tip => 
              tip.tip_text === sessionData.nutrition_tips[0]
            );
            if (matchingTip) {
              nutritionTip = matchingTip;
            }
          }

          // Calculer la date
          const sessionDate = new Date();
          sessionDate.setDate(sessionDate.getDate() + globalSessionCounter - 1);

          await prisma.session.create({
            data: {
              training_plan_id: trainingPlan.id,
              week_id: week.id,
              session_number: globalSessionCounter, // ⭐ CHAMP REQUIS manquant dans votre version
              session_order: sessionData.session_order,
              date: sessionDate, // ⭐ CHAMP REQUIS manquant dans votre version
              title: sessionData.title,
              description: sessionData.description, // ⭐ CHAMP REQUIS manquant dans votre version
              duree: sessionData.duration, // ⭐ Nom correct selon votre schéma
              completed: false, // ⭐ Valeur par défaut
              nutrition_tip_id: nutritionTip.id, // ⭐ CHAMP REQUIS manquant dans votre version
            }
          });

          globalSessionCounter++;
        }

        console.log(`    ✅ Semaine ${weekData.week_number}: ${weekData.sessions.length} sessions créées`);
      }

      console.log(`🎉 Plan "${plan.type}" importé avec succès!`);
    }

    // 10. Afficher les statistiques finales
    console.log("\n📊 Import terminé! Statistiques finales:");
    const stats = await getStats();
    console.log(`   👥 Utilisateurs: ${stats.users}`);
    console.log(`   📋 Plans: ${stats.plans}`);
    console.log(`   📅 Semaines: ${stats.weeks}`);
    console.log(`   🏃 Sessions: ${stats.sessions}`);
    console.log(`   🥗 Tips nutritionnels: ${stats.nutritionTips}`);

  } catch (error) {
    console.error("💥 Erreur lors de l'import:", error);
    throw error;
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

main()
  .catch(e => {
    console.error("🚨 Erreur fatale:", e);
    process.exit(1);
  })
  .finally(() => {
    console.log("🔌 Déconnexion de la base de données");
    prisma.$disconnect();
  });
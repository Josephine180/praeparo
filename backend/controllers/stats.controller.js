import prisma from '../src/index.js';

export const getUserStats = async (req, res) => {
  const userId = req.user.userId;

  try {
    // 1. Plans actifs de l'utilisateur
    const activePlans = await prisma.userTrainingPlan.count({
      where: { user_id: userId }
    });

    // 2. Sessions complétées dans ses plans
    const completedSessions = await prisma.session.count({
      where: {
        completed: true,
        trainingPlan: {
          users: {
            some: { user_id: userId }
          }
        }
      }
    });

    // 3. NOUVEAU : Sessions totales dans ses plans
    const totalSessions = await prisma.session.count({
      where: {
        trainingPlan: {
          users: {
            some: { user_id: userId }
          }
        }
      }
    });

    // 4. NOUVEAU : Sessions restantes
    const remainingSessions = totalSessions - completedSessions;

    // 5. Temps total d'entraînement
    const sessionsWithDuration = await prisma.session.findMany({
      where: {
        completed: true,
        trainingPlan: {
          users: {
            some: { user_id: userId }
          }
        }
      },
      select: { duree: true }
    });

    const totalDuration = sessionsWithDuration.reduce((sum, session) => sum + session.duree, 0);

    // 6. Moyenne d'énergie
    const feedbacks = await prisma.feedback.findMany({
      where: { user_id: userId },
      select: { energy_level: true }
    });

    const avgEnergy = feedbacks.length > 0 
      ? (feedbacks.reduce((sum, fb) => sum + fb.energy_level, 0) / feedbacks.length).toFixed(1)
      : 0;

    res.json({
      activePlans,
      completedSessions,
      totalSessions,        // NOUVEAU
      remainingSessions,    // NOUVEAU
      totalDuration,
      avgEnergy: parseFloat(avgEnergy)
    });

  } catch (error) {
    console.error('Erreur getUserStats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
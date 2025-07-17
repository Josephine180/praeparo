import prisma from '../src/index.js';

export const getUserStats = async (req, res) => {
  const userId = req.user.userId;
  
  console.log('🔍 getUserStats appelée pour userId:', userId);

  try {
    // 1. Plans actifs de l'utilisateur
    const activePlans = await prisma.userTrainingPlan.count({
      where: { user_id: userId }
    });
    
    console.log('📊 Plans actifs pour userId', userId, ':', activePlans);

    // 2. Sessions complétées par CET utilisateur (via SessionProgress)
    const completedSessions = await prisma.sessionProgress.count({
      where: {
        user_id: userId,
        completed: true
      }
    });
    
    console.log('✅ Sessions complétées pour userId', userId, ':', completedSessions);

    // 3. Sessions totales dans ses plans
    const totalSessions = await prisma.session.count({
      where: {
        trainingPlan: {
          users: {
            some: { user_id: userId }
          }
        }
      }
    });

    // Sessions restantes
    const remainingSessions = totalSessions - completedSessions;

    // 4. Temps total d'entraînement
    const userCompletedSessions = await prisma.sessionProgress.findMany({
      where: {
        user_id: userId,
        completed: true
      },
      include: {
        session: {
          select: { duree: true }
        }
      }
    });

    const totalDuration = userCompletedSessions.reduce((sum, sp) => sum + sp.session.duree, 0);

    // 5. Moyenne d'énergie
    const feedbacks = await prisma.feedback.findMany({
      where: { user_id: userId },
      select: { energy_level: true }
    });

    const avgEnergy = feedbacks.length > 0 
      ? (feedbacks.reduce((sum, fb) => sum + fb.energy_level, 0) / feedbacks.length).toFixed(1)
      : 0;

    const result = {
      activePlans,        
      completedSessions,
      totalSessions,        
      remainingSessions,    
      totalDuration,
      avgEnergy: parseFloat(avgEnergy)
    };
    
    console.log('Stats finales pour userId', userId, ':', result);
    
    res.json(result);

  } catch (error) {
    console.error('Erreur getUserStats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

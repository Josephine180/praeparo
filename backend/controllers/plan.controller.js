import prisma from '../src/index.js';

// Création d'un training plan
export const createTrainingPlan = async (req, res) => {
  const { goal_type, goal_time } = req.body;
  const user_id = req.user.userId; // Récupérer depuis le token JWT
  
  if (!user_id || !goal_type || !goal_time) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  try {
    const plan = await prisma.trainingPlan.create({
      data: {
        goal_type,
        goal_time,
        user_id, 
      },
    });
    res.status(201).json(plan);
  } catch (error) {
    console.error('Erreur création plan:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer les training plans d'un user
export const getUserActiveTrainingPlan = async (req, res) => {
  const userId = req.user.userId; // depuis le token JWT

  try {
    // Trouver l'association UserTrainingPlan avec les détails du plan
    const userPlan = await prisma.userTrainingPlan.findFirst({
      where: { user_id: userId },
      include: {
        trainingPlan: {
          include: {
            weeks: {
              include: {
                sessions: {
                  include: {
                    nutritionTip: true,
                  }
                }
              }
            },
            sessions: {
              include: {
                nutritionTip: true
              }
            },
          }
        }
      }
    });

    if (!userPlan) {
      return res.status(404).json({ error: 'Aucun plan actif trouvé pour cet utilisateur' });
    }

    res.json(userPlan.trainingPlan);
  } catch (error) {
    console.error("Erreur récupération plan utilisateur", error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};



// Récupérer tous les training plans
export const getAllTrainingPlans = async (req, res) => {
  try {
    const plans = await prisma.trainingPlan.findMany({
      include: {
        weeks: {
          include: {
            sessions: {
              include: {
                nutritionTip: true
              }
            }
          },
        },
        sessions: {
          include: {
            nutritionTip: true
          }
        },
      },
    });
    res.json(plans);
  } catch (error) {
    console.error('Erreur récupération tous les plans:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer un plan précis grâce à l'ID
export const getTrainingPlanById = async (req, res) => {
  const planId = parseInt(req.params.planId);
  
  if (isNaN(planId)) {
    return res.status(400).json({ error: 'ID invalide' });
  }

  try {
    const plan = await prisma.trainingPlan.findUnique({
      where: { id: planId },
      include: {
        weeks: {
          include: {
            sessions: true,
          },
        },
        sessions: true,
      },
    });
    
    if (!plan) return res.status(404).json({ error: 'Plan non trouvé' });
    res.json(plan);
  } catch (error) {
    console.error("Erreur récupérer un plan par l'ID", error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const startTrainingPlan = async (req, res) => {

  const userId = req.user?.userId;
  const { training_plan_id } = req.body;

  if (!training_plan_id) {
    console.log('training_plan_id manquant dans req.body');
    return res.status(400).json({ error: 'training_plan_id est requis' });
  }

  if (!userId) {
    console.log('userId manquant dans req.user');
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  try {
    console.log('Vérification de l\'existence du plan...');
    const planExists = await prisma.trainingPlan.findUnique({
      where: { id: training_plan_id }
    });
    console.log('Plan trouvé:', planExists ? `OUI (${planExists.goal_type})` : 'NON');

    if (!planExists) {
      console.log('Plan non trouvé avec ID:', training_plan_id);
      return res.status(404).json({ error: 'Plan d\'entraînement non trouvé' });
    }

    console.log('Vérification des associations existantes...');
    const existingUserPlan = await prisma.userTrainingPlan.findUnique({
      where: {
        user_id_training_plan_id: {
          user_id: userId,
          training_plan_id: training_plan_id
        }
      }
    });
    console.log('Association existante:', existingUserPlan ? `OUI (ID: ${existingUserPlan.id})` : 'NON');

    if (existingUserPlan) {
      console.log('Plan déjà démarré par cet utilisateur');
      return res.status(400).json({ 
        error: 'Vous avez déjà commencé ce plan d\'entraînement',
        existingAssociation: existingUserPlan.id
      });
    }

    console.log('Création de la nouvelle association...');
    const userTrainingPlan = await prisma.userTrainingPlan.create({
      data: {
        user_id: userId,
        training_plan_id: training_plan_id,
        started_at: new Date()
      },
      include: {
        trainingPlan: {
          include: {
            weeks: true,
            sessions: true,
          }
        }
      }
    });
    
    console.log('Association créée avec succès:', userTrainingPlan.id);
    console.log('UserID', userId, '→ Plan', planExists.goal_type);

    res.status(201).json({
      message: 'Plan démarré avec succès',
      association: userTrainingPlan,
      planType: planExists.goal_type
    });
    
  } catch (error) {
    console.error('Erreur dans startTrainingPlan:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erreur serveur lors du démarrage du plan',
      details: error.message 
    });
  }
};

export const getUserActiveTrainingPlans = async (req, res) => {
  const userId = req.user.userId;
  console.log('getUserActiveTrainingPlans - START');
  console.log('UserID:', userId);

  try {
    const userPlans = await prisma.userTrainingPlan.findMany({
      where: { user_id: userId },
      include: {
        trainingPlan: {
          include: {
            weeks: {
              include: {
                sessions: {
                  include: {
                    nutritionTip: true,
                    sessionProgresses: {
                      where: { user_id: userId }
                    }
                  }
                }
              }
            },
            sessions: {
              include: {
                nutritionTip: true,
                sessionProgresses: {
                  where: { user_id: userId }
                }
              }
            },
          }
        }
      }
    });
    
    if (!userPlans.length) {
      console.log('Aucun plan trouvé - retour tableau vide');
      return res.json([]); // 👈 Ici, retourner un tableau vide
    }

    // ... reste du code inchangé
    const transformedPlans = userPlans.map(up => {
      const plan = { ...up.trainingPlan };
      
      plan.weeks = plan.weeks.map(week => ({
        ...week,
        sessions: week.sessions.map(session => ({
          ...session,
          completed: session.sessionProgresses.length > 0 ? session.sessionProgresses[0].completed : false
        }))
      }));

      plan.sessions = plan.sessions.map(session => ({
        ...session,
        completed: session.sessionProgresses.length > 0 ? session.sessionProgresses[0].completed : false
      }));

      return plan;
    });

    res.json(transformedPlans);
    
  } catch (error) {
    console.error("Erreur dans getUserActiveTrainingPlans:", error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};


export const quitTrainingPlan = async (req, res) => {
  const userId = req.user?.userId;
  const { training_plan_id } = req.body;
  
  if (!training_plan_id || !userId) {
    return res.status(400).json({ error: 'training_plan_id requis' });
  }

  try {
    const deleted = await prisma.userTrainingPlan.deleteMany({
      where: {
        user_id: userId,
        training_plan_id: training_plan_id
      }
    });
    
    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Association non trouvée' });
    }
    
    res.json({ message: 'Programme quitté avec succès' });
  } catch (error) {
    console.error('Erreur quit plan:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

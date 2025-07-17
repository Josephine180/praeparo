// backend/controllers/session.controller.js
import prisma from '../src/index.js';


export const createSession = async (req, res) => {
  console.log("Données reçues :", req.body);
  try {
    const {
      training_plan_id,
      week_id,
      session_number,
      session_order,
      date,
      title,
      description,
      duree,
      nutrition_tip_id,
    } = req.body;
    
    const session = await prisma.session.create({
      data: {
        training_plan_id,
        week_id,
        session_number,
        session_order,
        date: new Date(date),
        title,
        description,
        duree,
        nutrition_tip_id,
      },
    });
    res.status(201).json(session);
  } catch (error) {
    console.error(" Erreur création session", error);
    res.status(500).json({ error: "Erreur serveur lors de la création de la session"});
  }
};

export const getAllSessions = async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { id: 'asc' },
    });
    res.json(sessions);
  } catch (error) {
    console.error("Erreur lors de la récupération des sessions :", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des sessions." });
  }
};

export const getSessionById = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) return res.status(404).json({ error: "Session non trouvée" });
    res.json(session);
  } catch (error) {
    console.error('Erreur GET session par id', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const SessionFeedback = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const {
    energy_level,
    fatigue_level,
    motivation_level,
    comment
  } = req.body;

  const user_id = req.user.userId;

  console.log('📝 Feedback reçu:');
  console.log('  - sessionId:', sessionId);
  console.log('  - user_id:', user_id);
  console.log('  - energy_level:', energy_level);
  console.log('  - fatigue_level:', fatigue_level);
  console.log('  - motivation_level:', motivation_level);
  console.log('  - comment:', comment);

  if (!user_id) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  if (isNaN(sessionId) || sessionId <= 0) {
    return res.status(400).json({ error: 'ID de session invalide' });
  }

  // Validation des niveaux
  const validateLevel = (level, name) => {
    const parsed = parseInt(level);
    if (isNaN(parsed) || parsed < 1 || parsed > 10) {
      return `${name} doit être un nombre entre 1 et 10`;
    }
    return null;
  };

  const energyError = validateLevel(energy_level, 'Le niveau d\'énergie');
  const fatigueError = validateLevel(fatigue_level, 'Le niveau de fatigue');
  const motivationError = validateLevel(motivation_level, 'Le niveau de motivation');

  if (energyError || fatigueError || motivationError) {
    return res.status(400).json({ 
      error: energyError || fatigueError || motivationError 
    });
  }

  if (comment && typeof comment !== 'string') {
    return res.status(400).json({ error: 'Le commentaire doit être une chaîne de caractères' });
  }

  if (comment && comment.length > 500) {
    return res.status(400).json({ error: 'Le commentaire ne peut pas dépasser 500 caractères' });
  }

  try {
    // Vérifier que la session existe
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        trainingPlan: {
          include: {
            users: {
              where: { user_id: user_id }
            }
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session introuvable' });
    }

    // Vérifier que l'utilisateur a accès à cette session
    if (!session.trainingPlan.users.length) {
      return res.status(403).json({ error: 'Vous n\'avez pas accès à cette session' });
    }

    // Vérifier s'il existe déjà un feedback pour cette session par cet utilisateur
    // CORRECTION : Utiliser findFirst au lieu de findUnique avec les bons champs
    const existingFeedback = await prisma.feedback.findFirst({
      where: {
        session_id: sessionId,
        user_id: user_id
      }
    });

    if (existingFeedback) {
      console.log('Mise à jour du feedback existant:', existingFeedback.id);
      
      const updatedFeedback = await prisma.feedback.update({
        where: { id: existingFeedback.id },
        data: {
          energy_level: parseInt(energy_level),
          fatigue_level: parseInt(fatigue_level),
          motivation_level: parseInt(motivation_level),
          comment: comment ? comment.trim() : null
        }
      });

      console.log('Feedback mis à jour avec succès:', updatedFeedback.id);
      return res.status(200).json({
        message: 'Feedback mis à jour avec succès',
        feedback: updatedFeedback
      });
    }

    // Créer le nouveau feedback
    const feedback = await prisma.feedback.create({
      data: {
        session_id: sessionId,
        user_id: user_id,
        energy_level: parseInt(energy_level),
        fatigue_level: parseInt(fatigue_level),
        motivation_level: parseInt(motivation_level),
        comment: comment ? comment.trim() : null
      }
    });

    console.log('Feedback créé avec succès:', feedback.id);
    res.status(201).json({
      message: 'Feedback créé avec succès',
      feedback: feedback
    });

  } catch (error) {
    console.error("Erreur création/mise à jour feedback:", error);
    console.error("Stack trace:", error.stack);
    
    // Gérer les erreurs spécifiques de Prisma
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: "Un feedback existe déjà pour cette session" 
      });
    }
    
    res.status(500).json({ 
      error: "Erreur serveur lors de la gestion du feedback",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getFeedbacksBySessionId = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const user_id = req.user.userId;

  if (isNaN(sessionId) || sessionId <= 0) {
    return res.status(400).json({ error: 'ID de session invalide' });
  }

  if (!user_id) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  try {
    // Récupérer uniquement les feedbacks de l'utilisateur connecté pour cette session
    const feedbacks = await prisma.feedback.findMany({
      where: { 
        session_id: sessionId,
        user_id: user_id
      },
      orderBy: { created_at: 'desc' }
    });

    if (!feedbacks || feedbacks.length === 0) {
      return res.status(404).json({ 
        message: 'Aucun feedback trouvé pour cette session' 
      });
    }

    res.json(feedbacks);
  } catch (error) {
    console.error('Erreur récupération feedbacks:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des feedbacks',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const markSessionAsCompleted = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const userId = req.user.userId;
  
  try {
    const existingSession = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      return res.status(404).json({ error: "Session introuvable." });
    }

    // Créer ou mettre à jour le progrès de la session pour cet utilisateur
    const sessionProgress = await prisma.sessionProgress.upsert({
      where: {
        user_id_session_id: {
          user_id: userId,
          session_id: sessionId
        }
      },
      update: {
        completed: true
      },
      create: {
        user_id: userId,
        session_id: sessionId,
        completed: true
      }
    });

    res.json({ success: true, sessionProgress });
  } catch (error) {
    console.error("Erreur PATCH session :", error);
    res.status(500).json({ error: "Impossible de marquer la session comme complétée." });
  }
};

export const markSessionAsUncompleted = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const userId = req.user.userId;
  
  try {
    const existingSession = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!existingSession) {
      return res.status(404).json({ error: "Session introuvable." });
    }

    // Créer ou mettre à jour le progrès de la session pour cet utilisateur
    const sessionProgress = await prisma.sessionProgress.upsert({
      where: {
        user_id_session_id: {
          user_id: userId,
          session_id: sessionId
        }
      },
      update: {
        completed: false
      },
      create: {
        user_id: userId,
        session_id: sessionId,
        completed: false
      }
    });

    res.json({ success: true, sessionProgress });
  } catch (error) {
    console.error("Erreur PATCH session :", error);
    res.status(500).json({ error: "Impossible de marquer la session comme non complétée." });
  }
};


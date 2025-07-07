// backend/controllers/session.controller.js

import prisma from '../src/index.js';

// Assurez-vous que TOUTES ces fonctions sont bien présentes et exportées

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

export const markSessionAsCompleted = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  try {
    const existingSession = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      return res.status(404).json({ error: "Session introuvable." });
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: { completed: true },
    });

    res.json(updatedSession);
  } catch (error) {
    console.error("Erreur PATCH session :", error);
    res.status(500).json({ error: "Impossible de marquer la session comme complétée." });
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

// FONCTION CORRIGÉE - SessionFeedback
export const SessionFeedback = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const {
    energy_level,
    fatigue_level,
    motivation_level,
    comment
  } = req.body;

  // IMPORTANT : Récupérer user_id depuis le token JWT (req.user)
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

  if (isNaN(sessionId)) {
    return res.status(400).json({ error: 'ID de session invalide' });
  }

  try {
    // Vérifier que la session existe
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session introuvable' });
    }

    // Vérifier s'il existe déjà un feedback pour cette session par cet utilisateur
    const existingFeedback = await prisma.feedback.findFirst({
      where: {
        session_id: sessionId,
        user_id: user_id
      }
    });

    if (existingFeedback) {
      return res.status(400).json({ 
        error: 'Vous avez déjà donné un feedback pour cette session',
        existingFeedbackId: existingFeedback.id
      });
    }

    // Créer le feedback
    const feedback = await prisma.feedback.create({
      data: {
        session_id: sessionId,
        user_id: user_id,
        energy_level: parseInt(energy_level),
        fatigue_level: parseInt(fatigue_level),
        motivation_level: parseInt(motivation_level),
        comment: comment || null
      }
    });

    console.log('✅ Feedback créé avec succès:', feedback.id);
    res.status(201).json(feedback);

  } catch (error) {
    console.error("💥 Erreur création feedback:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ 
      error: "Impossible d'ajouter le feedback",
      details: error.message 
    });
  }
};

export const getFeedbacksBySessionId = async (req, res) => {
  const sessionId = parseInt(req.params.id);

  try {
    const feedbacks = await prisma.feedback.findMany({
      where: { session_id: sessionId }
    });

    if (!feedbacks || feedbacks.length === 0) {
      return res.status(404).json({ message: 'Aucun feedback trouvé pour cette session' });
    }

    res.json(feedbacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des feedbacks' });
  }
};

export const markSessionAsUncompleted = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  try {
    const existingSession = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!existingSession) {
      return res.status(404).json({ error: "Session introuvable." });
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: { completed: false },
    });

    res.json(updatedSession);
  } catch (error) {
    console.error("Erreur PATCH session :", error);
    res.status(500).json({ error: "Impossible de marquer la session comme non complétée." });
  }
};

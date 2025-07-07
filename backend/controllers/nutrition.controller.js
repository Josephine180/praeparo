import prisma from '../src/index.js';

export const getNutritionTipBySessionId = async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  
  // Vérifier que sessionId est valide
  if (isNaN(sessionId)) {
    return res.status(400).json({ error: "ID de session invalide." });
  }

  try {
    // Une seule requête avec include pour récupérer la session et son nutrition tip
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { 
        nutritionTip: true,  // Selon votre schéma
      },
    });

    console.log("Session trouvée :", JSON.stringify(session, null, 2));

    if (!session) {
      return res.status(404).json({ error: "Session introuvable." });
    }

    // Selon votre schéma, nutritionTip devrait toujours exister car la relation est obligatoire
    // Mais on vérifie quand même au cas où
    if (!session.nutritionTip) {
      return res.status(404).json({ 
        error: "Aucun tip nutritionnel associé à cette session.",
        sessionId: sessionId,
        nutrition_tip_id: session.nutrition_tip_id
      });
    }

    // Retourner directement le tip depuis la relation
    res.json(session.nutritionTip);

  } catch (error) {
    console.error("Erreur récupération tip nutritionnel:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ 
      error: "Erreur serveur.",
      details: error.message 
    });
  }
};
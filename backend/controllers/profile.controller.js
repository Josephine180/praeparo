import prisma from '../src/index.js';

export const createMyProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Non autorisé' });

    const { firstName, lastName, email, weight, height } = req.body;

    // Vérifie si profil existe déjà
    const existing = await prisma.profile.findUnique({ where: { userId } });
    if (existing) return res.status(400).json({ error: 'Profil existe déjà' });

    const newProfile = await prisma.profile.create({
      data: { 
        userId, 
        firstName, 
        lastName, 
        email: email || '', 
        weight, 
        height 
      },
    });

    res.status(201).json(newProfile);
  } catch (error) {
    console.error('Erreur createMyProfile:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupération du profil de l'utilisateur connecté
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Non autorisé' });

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) return res.status(404).json({ error: 'Profil non trouvé' });

    res.json(profile);
  } catch (error) {
    console.error('Erreur getMyProfile:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Mise à jour ou création du profil de l'utilisateur connecté
export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Non autorisé' });

    const { firstName, lastName, email, weight, height } = req.body;

    const existing = await prisma.profile.findUnique({
      where: { userId },
    });

    let updatedProfile;
    if (existing) {
      updatedProfile = await prisma.profile.update({
        where: { userId },
        data: { 
          firstName, 
          lastName, 
          email: email || existing.email || '', 
          weight, 
          height 
        },
      });
    } else {
      updatedProfile = await prisma.profile.create({
        data: { 
          userId, 
          firstName, 
          lastName, 
          email: email || '', 
          weight, 
          height 
        },
      });
    }

    res.json(updatedProfile);
  } catch (error) {
    console.error('Erreur updateMyProfile:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
import jwt from 'jsonwebtoken';
import prisma from '../src/index.js';

export const authMe = async (req, res) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ error: 'Non authentifié' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer les infos complètes de l'utilisateur depuis la DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { 
        id: true, 
        firstname: true, 
        name: true, 
        email: true, 
        role: true 
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    res.json(user);
  } catch (err) {
    console.error('Erreur authMe:', err);
    res.status(401).json({ error: 'Token invalide' });
  }
};
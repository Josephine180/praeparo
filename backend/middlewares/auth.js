import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const token = req.cookies.token;  // <- ici on récupère dans le cookie

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Erreur de vérification du token:', error);
    res.status(401).json({ error: 'Token invalide' });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Accès refusé : admin uniquement' });
  }
};

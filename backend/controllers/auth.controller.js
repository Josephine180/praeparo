import jwt from 'jsonwebtoken';

export const authMe = (req, res) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ error: 'Non authentifié' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ userId: decoded.userId, role: decoded.role });
  } catch (err) {
    res.status(401).json({ error: 'Token invalide' });
  }
};
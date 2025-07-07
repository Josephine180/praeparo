import prisma from '../src/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// récupération de tous les utilisateurs
export async function getAllUsers(req, res) {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la rcupération des utilisateurs:',error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
// Récupérer un utilisateur avec l'id
export const getUserbyEmail = async (req, res) => {
  const email = req.body.email; // transformation de l'ID depuis l'URL en nombre(int)
  if (!(email)) {
    return res.status(400).json({ error: 'email invalide'});
  }
  try {
    const user = await prisma.user.findUnique({
      where: { email: email}, //on cherche l'utilisateur avec cet ID
    });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé'});
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur'});
  }
  };

// Récupérer un utilisateur avec l'id
export const getUserbyId = async (req, res) => {
  const id = parseInt(req.params.id); // transformation de l'ID depuis l'URL en nombre(int)
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID invalide'});
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: id}, //on cherche l'utilisateur avec cet ID
    });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé'});
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur'});
  }
  };

//Créer un novel utilisateur
export async function createUser(req, res) {
  const { email, password_hash, name, firstname } = req.body; // Ajout de firstname
  // verification des champs obligatoires
  if (!email || !password_hash) {
    return res.status(400).json({ error: 'Email et mot de pass requis'});
  }
  // validation du format d'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Format d\'email invalide '});
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email }});
    if (existingUser) {
      return res.status(400).json({ error: 'Email deja utilisé'});
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password_hash, 10);

    //creation de l'utilisateur
    const newUser = await prisma.user.create({
      data: { 
        email,
        password_hash: hashedPassword, // Maintenant déclaré
        name,
        firstname, // Maintenant déclaré
      },
    });
    res.status(201).json(newUser);
  } catch(error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur'});
  }
};
// Modifier un utilisateur
export const modifyUser = async(req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID invalide'});
  }
  const { email, password_hash, name, firstname } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    const updateUser = await prisma.user.update({
      where: {id},
      data: { email, password_hash, name, firstname },
    });
    res.json(updateUser);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur ou utilisateur non trouvé'});
  }
};

// supprimer un utilisateur par son ID
export const deleteUser = async(req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID invalide'});
  }
  try {
    await prisma.user.delete({ where: { id }});
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur ou utilisateur non trouvé' });
  }
};

// connexion utilisateur 
const JWT_SECRET = process.env.JWT_SECRET || '123';

export const register = async (req, res) => {
  const { email, password, name, firstname } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis.' });

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(409).json({ error: 'Email déjà utilisé.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        name,
        firstname,
        role: "user",
      }
    });

    res.status(201).json({ message: 'Utilisateur créé', userId: newUser.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    // Envoie le token dans un cookie sécurisé
    res.cookie('token', token, {
      httpOnly: true,       // Empêche l'accès JavaScript côté client
      secure: false,        // true en production avec HTTPS
      sameSite: 'lax',      // Protection CSRF
      path: '/',
      maxAge: 4 * 60 * 60 * 1000, // 4 heures en millisecondes
    });

    // Réponse sans le token (il est dans le cookie)
    res.json({ 
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstname: user.firstname,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Erreur lors de la connexion:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

export const logout = (req, res) => {
  // Supprime le cookie en définissant une date d'expiration passée
  res.clearCookie('token', {
    httpOnly: true,
    secure: false,        // true en production avec HTTPS
    sameSite: 'lax',
    path: '/'
  });
  
  res.json({ message: 'Déconnexion réussie' });
};

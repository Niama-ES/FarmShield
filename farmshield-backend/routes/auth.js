const express = require('express'); // hadi dima kadar f bdya 
const router = express.Router();

const bcrypt = require('bcrypt');   //hadi kandiro liha import pour crypter les motes de passe
const db = require('../db');        // hadi kandiro liha import pour connecter m3a base de donnee

const jwt = require('jsonwebtoken');  // hadi 3la 9bl login
const crypto = require('crypto');    // hadi 3la token dial ferme


// Route d'inscription : 
router.post('/register', async (req, res) => {
  const { email, password, nom_ferme, latitude, longitude } = req.body;

  if (!email || !password || !nom_ferme) {
    return res.status(400).json({ erreur: 'Email, mot de passe et nom de ferme sont obligatoires.' });
  }

  try {
    const utilisateurExistant = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (utilisateurExistant.rows.length > 0) {
      return res.status(400).json({ erreur: 'Un compte avec cet email existe déjà.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const nouvelUtilisateur = await db.query(
      'INSERT INTO users (email, password_hash, nom_ferme) VALUES ($1, $2, $3) RETURNING id, email, nom_ferme',
      [email, passwordHash, nom_ferme]
    );

    const userId = nouvelUtilisateur.rows[0].id;

    // Génération automatique du token ESP32 + création de la ferme
    const tokenEsp32 = crypto.randomBytes(16).toString('hex');

    const nouvelleFerme = await db.query(
      'INSERT INTO fermes (user_id, nom, token_esp32, latitude, longitude) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, nom_ferme, tokenEsp32, latitude || null, longitude || null]
    );

    res.status(201).json({
      message: 'Compte créé avec succès.',
      utilisateur: nouvelUtilisateur.rows[0],
      ferme: {
        id: nouvelleFerme.rows[0].id,
        nom: nouvelleFerme.rows[0].nom,
        token_esp32: nouvelleFerme.rows[0].token_esp32
      }
    });

  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur lors de la création du compte.' });
  }
});

// Route de connexion : 
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const resultat = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (resultat.rows.length === 0) {
      await db.query(
        'INSERT INTO login_logs (user_id, email_tente, succes) VALUES ($1, $2, $3)',
        [null, email, false]
      );
      return res.status(401).json({ erreur: 'Email ou mot de passe incorrect.' });
    }

    const utilisateur = resultat.rows[0];
    const motDePasseValide = await bcrypt.compare(password, utilisateur.password_hash);

    if (!motDePasseValide) {
      await db.query(
        'INSERT INTO login_logs (user_id, email_tente, succes) VALUES ($1, $2, $3)',
        [utilisateur.id, email, false]
      );
      return res.status(401).json({ erreur: 'Email ou mot de passe incorrect.' });
    }

    await db.query(
      'INSERT INTO login_logs (user_id, email_tente, succes) VALUES ($1, $2, $3)',
      [utilisateur.id, email, true]
    );

    const token = jwt.sign(
      { id: utilisateur.id, email: utilisateur.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie.',
      token,
      utilisateur: { id: utilisateur.id, email: utilisateur.email, nom_ferme: utilisateur.nom_ferme }
    });

  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur lors de la connexion.' });
  }
});

module.exports = router;
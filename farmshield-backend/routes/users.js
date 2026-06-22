const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const verifierToken = require('../middleware/verifierToken');

// GET /users/profil — voir son propre profil
router.get('/profil', verifierToken, async (req, res) => {
  try {
    const resultat = await db.query(
      'SELECT id, email, nom_ferme, created_at FROM users WHERE id = $1',
      [req.utilisateur.id]
    );

    if (resultat.rows.length === 0) {
      return res.status(404).json({ erreur: 'Utilisateur introuvable.' });
    }

    res.json({ utilisateur: resultat.rows[0] });

  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
});

// PUT /users/profil — modifier nom de ferme
router.put('/profil', verifierToken, async (req, res) => {
  const { nom_ferme } = req.body;

  try {
    const resultat = await db.query(
      'UPDATE users SET nom_ferme = $1 WHERE id = $2 RETURNING id, email, nom_ferme',
      [nom_ferme, req.utilisateur.id]
    );

    res.json({ message: 'Profil mis à jour.', utilisateur: resultat.rows[0] });

  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
});

// PUT /users/mot-de-passe — changer son mot de passe
router.put('/mot-de-passe', verifierToken, async (req, res) => {
  const { ancien_password, nouveau_password } = req.body;

  try {
    const resultat = await db.query('SELECT * FROM users WHERE id = $1', [req.utilisateur.id]);
    const utilisateur = resultat.rows[0];

    const valide = await bcrypt.compare(ancien_password, utilisateur.password_hash);
    if (!valide) {
      return res.status(400).json({ erreur: 'Ancien mot de passe incorrect.' });
    }

    const nouveauHash = await bcrypt.hash(nouveau_password, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [nouveauHash, req.utilisateur.id]);

    res.json({ message: 'Mot de passe modifié avec succès.' });

  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
});

module.exports = router;
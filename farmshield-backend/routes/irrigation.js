const express = require('express');
const router = express.Router();
const db = require('../db');
const verifierToken = require('../middleware/verifierToken');

// GET /irrigation — liste tous les programmes du farmer connecté
router.get('/', verifierToken, async (req, res) => {
  try {
    const resultat = await db.query(
      'SELECT * FROM irrigation_schedule WHERE user_id = $1 ORDER BY heure_debut ASC',
      [req.utilisateur.id]
    );
    res.json({ programmes: resultat.rows });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
});

// POST /irrigation — créer un nouveau programme
router.post('/', verifierToken, async (req, res) => {
  const { parcelle, jour_semaine, heure_debut, duree_minutes, volume_prevu } = req.body;

  if (!parcelle || !jour_semaine || !heure_debut || !duree_minutes || !volume_prevu) {
    return res.status(400).json({ erreur: 'Tous les champs sont obligatoires.' });
  }

  try {
    const resultat = await db.query(
      `INSERT INTO irrigation_schedule 
       (user_id, parcelle, jour_semaine, heure_debut, duree_minutes, volume_prevu)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.utilisateur.id, parcelle, jour_semaine, heure_debut, duree_minutes, volume_prevu]
    );
    res.status(201).json({ message: 'Programme créé.', programme: resultat.rows[0] });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
});

// PUT /irrigation/:id — modifier un programme existant
router.put('/:id', verifierToken, async (req, res) => {
  const { id } = req.params;
  const { parcelle, jour_semaine, heure_debut, duree_minutes, volume_prevu, actif } = req.body;

  try {
    const resultat = await db.query(
      `UPDATE irrigation_schedule SET
         parcelle = COALESCE($1, parcelle),
         jour_semaine = COALESCE($2, jour_semaine),
         heure_debut = COALESCE($3, heure_debut),
         duree_minutes = COALESCE($4, duree_minutes),
         volume_prevu = COALESCE($5, volume_prevu),
         actif = COALESCE($6, actif)
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [parcelle, jour_semaine, heure_debut, duree_minutes, volume_prevu, actif, id, req.utilisateur.id]
    );

    if (resultat.rows.length === 0) {
      return res.status(404).json({ erreur: 'Programme introuvable.' });
    }

    res.json({ message: 'Programme mis à jour.', programme: resultat.rows[0] });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
});

// DELETE /irrigation/:id — supprimer un programme
router.delete('/:id', verifierToken, async (req, res) => {
  const { id } = req.params;

  try {
    const resultat = await db.query(
      'DELETE FROM irrigation_schedule WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.utilisateur.id]
    );

    if (resultat.rows.length === 0) {
      return res.status(404).json({ erreur: 'Programme introuvable.' });
    }

    res.json({ message: 'Programme supprimé.' });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
});

// GET /irrigation/actifs — programmes actifs aujourd'hui (utilisé par le cron job météo)
router.get('/actifs', verifierToken, async (req, res) => {
  const joursMap = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const aujourdhui = joursMap[new Date().getDay()];

  try {
    const resultat = await db.query(
      `SELECT * FROM irrigation_schedule 
       WHERE user_id = $1 AND jour_semaine = $2 AND actif = true
       ORDER BY heure_debut ASC`,
      [req.utilisateur.id, aujourdhui]
    );
    res.json({ programmes_actifs: resultat.rows });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
});

module.exports = router;
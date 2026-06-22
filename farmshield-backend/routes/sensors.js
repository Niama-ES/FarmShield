const express = require('express');
const router = express.Router();
const db = require('../db');
const verifierToken = require('../middleware/verifierToken');
const chargerFerme = require('../middleware/chargerFerme');

// GET /sensors/status — statut temps réel S1, S2, S3
router.get('/status', verifierToken, chargerFerme, async (req, res) => {
  try {
    const [s1, s2, s3] = await Promise.all([
      db.query(
        `SELECT * FROM sensor_logs 
         WHERE sous_systeme = 'S1' AND ferme_id = $1 
         ORDER BY created_at DESC LIMIT 1`,
         [req.fermeId]
      ),
      db.query(
        `SELECT * FROM sensor_logs 
         WHERE sous_systeme = 'S2' AND ferme_id = $1
         ORDER BY created_at DESC LIMIT 1`,
         [req.fermeId]
      ),
      db.query(
        `SELECT * FROM sensor_logs 
         WHERE sous_systeme = 'S3' AND ferme_id = $1
         ORDER BY created_at DESC LIMIT 1`,
        [req.fermeId]
      )
    ]);

    res.json({
      s1: s1.rows[0] || null,
      s2: s2.rows[0] || null,
      s3: s3.rows[0] || null
    });

  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
});

// GET /sensors/history/:systeme — historique d'un sous-système (20 dernières valeurs)
router.get('/history/:systeme', verifierToken, chargerFerme, async (req, res) => {
  const { systeme } = req.params;

  const systemesValides = ['S1', 'S2', 'S3'];
  if (!systemesValides.includes(systeme.toUpperCase())) {
    return res.status(400).json({ erreur: 'Sous-système invalide. Utilise S1, S2 ou S3.' });
  }

  try {
    const resultat = await db.query(
      `SELECT * FROM sensor_logs 
       WHERE sous_systeme = $1  AND ferme_id = $2
       ORDER BY created_at DESC 
       LIMIT 20`,
      [systeme.toUpperCase(), req.fermeId]
    );

    res.json({ historique: resultat.rows });

  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
});

module.exports = router;
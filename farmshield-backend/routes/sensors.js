const express = require('express');
const router = express.Router();
const db = require('../db');
const verifierToken = require('../middleware/verifierToken');

// GET /sensors/status — statut temps réel S1, S2, S3
router.get('/status', verifierToken, async (req, res) => {
  try {
    const [s1, s2, s3] = await Promise.all([
      db.query(
        `SELECT * FROM sensor_logs 
         WHERE sous_systeme = 'S1' 
         ORDER BY created_at DESC LIMIT 1`
      ),
      db.query(
        `SELECT * FROM sensor_logs 
         WHERE sous_systeme = 'S2' 
         ORDER BY created_at DESC LIMIT 1`
      ),
      db.query(
        `SELECT * FROM sensor_logs 
         WHERE sous_systeme = 'S3' 
         ORDER BY created_at DESC LIMIT 1`
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
router.get('/history/:systeme', verifierToken, async (req, res) => {
  const { systeme } = req.params;

  const systemesValides = ['S1', 'S2', 'S3'];
  if (!systemesValides.includes(systeme.toUpperCase())) {
    return res.status(400).json({ erreur: 'Sous-système invalide. Utilise S1, S2 ou S3.' });
  }

  try {
    const resultat = await db.query(
      `SELECT * FROM sensor_logs 
       WHERE sous_systeme = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [systeme.toUpperCase()]
    );

    res.json({ historique: resultat.rows });

  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
});

module.exports = router;
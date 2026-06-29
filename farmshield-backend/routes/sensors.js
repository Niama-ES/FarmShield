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

    const formatS1 = (row) => row ? {
      poids_kg: parseFloat(row.valeur),
      alerte: parseFloat(row.valeur) < 10,
      type_capteur: row.type_capteur,
      created_at: row.created_at,
    } : null;

    const formatS2 = (row) => row ? {
      debit_lpm: parseFloat(row.valeur),
      vanne_ouverte: false,
      alerte: parseFloat(row.valeur) < 5,
      type_capteur: row.type_capteur,
      created_at: row.created_at,
    } : null;

    const formatS3 = (row) => row ? {
      mouvement: parseFloat(row.valeur) === 1,
      vibration: false,
      alerte: parseFloat(row.valeur) === 1,
      type_capteur: row.type_capteur,
      created_at: row.created_at,
    } : null;

    res.json({
      s1: formatS1(s1.rows[0]),
      s2: formatS2(s2.rows[0]),
      s3: formatS3(s3.rows[0]),
    });

  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
});

// GET /sensors/history/:systeme
router.get('/history/:systeme', verifierToken, chargerFerme, async (req, res) => {
  const { systeme } = req.params;

  const systemesValides = ['S1', 'S2', 'S3'];
  if (!systemesValides.includes(systeme.toUpperCase())) {
    return res.status(400).json({ erreur: 'Sous-système invalide.' });
  }

  try {
    const resultat = await db.query(
      `SELECT * FROM sensor_logs 
       WHERE sous_systeme = $1 AND ferme_id = $2
       ORDER BY created_at DESC 
       LIMIT 20`,
      [systeme.toUpperCase(), req.fermeId]
    );

    const historique = resultat.rows.map(row => {
      const valeur = parseFloat(row.valeur);
      if (systeme.toUpperCase() === 'S1') {
        return {
          ...row,
          poids_kg: valeur,
          alerte: valeur < 10,
        };
      } else if (systeme.toUpperCase() === 'S2') {
        return {
          ...row,
          debit_lpm: valeur,
          alerte: valeur < 5,
        };
      } else {
        return {
          ...row,
          mouvement: valeur === 1,
          vibration: false,
          alerte: valeur === 1,
        };
      }
    });

    res.json({ historique });

  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
});

module.exports = router;
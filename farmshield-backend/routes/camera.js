const express = require('express');
const router = express.Router();
const db = require('../db');
const verifierToken = require('../middleware/verifierToken');
const chargerFerme = require('../middleware/chargerFerme');

const FENETRE_LIVE_SECONDES = 30;

router.get('/status', verifierToken, chargerFerme, async (req, res) => {
  try { 

    const resultat = await db.query(
      `SELECT created_at FROM sensor_logs
       WHERE type_capteur = 'pir_mouvement'
       AND ferme_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.fermeId]
    ); 

    if (resultat.rows.length === 0) {
      return res.json({ live: false, derniere_detection: null });
    }

    const derniereDetection = resultat.rows[0].created_at;

    const secondesEcoulees = (new Date() - new Date(derniereDetection)) / 1000;

    const live = secondesEcoulees <= FENETRE_LIVE_SECONDES;

    res.json({
      live,
      derniere_detection: derniereDetection,
    });

  } catch (erreur) {
    console.error('Erreur lors de la récupération du statut caméra :', erreur);
    res.status(500).json({ erreur: 'Impossible de récupérer le statut de la caméra.' });
  }
}); 

module.exports = router;
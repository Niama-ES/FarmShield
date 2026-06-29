// routes/camera.js
const express       = require('express');
const router        = express.Router();
const db            = require('../db');
const verifierToken = require('../middleware/verifierToken');
const chargerFerme  = require('../middleware/chargerFerme');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const FENETRE_LIVE_SECONDES = 30;

// ── GET /camera/status — statut caméra basé sur dernière détection PIR ───────
// Ne ping PAS Flask — juste la DB
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

    const derniereDetection = resultat.rows[0]?.created_at || null;
    const secondesEcoulees  = derniereDetection
      ? (new Date() - new Date(derniereDetection)) / 1000
      : Infinity;
    const live = secondesEcoulees <= FENETRE_LIVE_SECONDES;

    res.json({
      live,
      derniere_detection: derniereDetection,
    });
  } catch (e) {
    console.error('Erreur statut caméra :', e);
    res.status(500).json({ erreur: 'Impossible de récupérer le statut.' });
  }
});

// ── GET /camera/frame — proxifie la dernière frame depuis Flask de Noura ─────
// C'est cette route qui contacte Flask — appelée par l'app toutes les 500ms
router.get('/frame', verifierToken, chargerFerme, async (req, res) => {
  if (!process.env.FLASK_URL) {
    return res.json({ frame: null, connectee: false });
  }

  try {
    const response = await fetch(
      `${process.env.FLASK_URL}/derniere_frame`,
      { signal: AbortSignal.timeout(3000) }
    );

    // Vérifier que c'est bien du JSON avant de parser
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return res.json({ frame: null, connectee: false });
    }

    const data = await response.json();
    res.json({
      frame:     data.frame     || null,
      connectee: !!data.frame,
      timestamp: data.timestamp || null,
    });
  } catch (e) {
    // Silencieux — Flask pas encore lancé, normal
    res.json({ frame: null, connectee: false });
  }
});

module.exports = router;
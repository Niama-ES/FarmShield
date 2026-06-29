// routes/faces.js
const express   = require('express');
const router    = express.Router();
const db        = require('../db');
const verifierToken = require('../middleware/verifierToken');
const chargerFerme  = require('../middleware/chargerFerme');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const FormData  = require('form-data');

// ── Helper : envoyer une requête au Flask de Noura ───────────────────────────
// Ne bloque jamais le backend si Flask est injoignable
const envoyerAFlask = async (route, formData) => {
  if (!process.env.FLASK_URL) {
    console.warn('[Flask] FLASK_URL non défini dans .env — ignoré');
    return;
  }
  try {
    const res = await fetch(`${process.env.FLASK_URL}${route}`, {
      method:  'POST',
      body:    formData,
      headers: formData.getHeaders(),
    });
    const json = await res.json();
    console.log(`[Flask] ${route} →`, json.message || json);
  } catch (e) {
    console.warn(`[Flask] ${route} injoignable :`, e.message);
  }
};

// ── GET / — Liste tous les visages de la ferme ───────────────────────────────
router.get('/', verifierToken, chargerFerme, async (req, res) => {
  try {
    const resultat = await db.query(
      'SELECT * FROM authorized_faces WHERE ferme_id = $1 ORDER BY created_at DESC',
      [req.fermeId]
    );
    res.json(resultat.rows);
  } catch (e) {
    console.error('[Faces] GET erreur :', e);
    res.status(500).json({ erreur: 'Impossible de récupérer la liste des visages.' });
  }
});

// ── POST / — Ajouter un visage ───────────────────────────────────────────────
// Body attendu : { nom: string, photos_base64: string[] }
// photos_base64 = tableau de strings base64 (envoyé par l'app après capture caméra)
router.post('/', verifierToken, chargerFerme, async (req, res) => {
  try {
    const { nom, photos_base64 } = req.body;

    if (!nom || !nom.trim()) {
      return res.status(400).json({ erreur: 'Le nom est obligatoire.' });
    }

    const nomPropre = nom.trim();

    // 1. Enregistrer en base de données
    const photo_url = `visages_autorises/${nomPropre}/`;
    const resultat  = await db.query(
      `INSERT INTO authorized_faces (ferme_id, nom, photo_url)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.fermeId, nomPropre, photo_url]
    );
    const visage = resultat.rows[0];
    console.log(`[Faces] ✅ Ajouté en base : ${nomPropre}`);

    // 2. Envoyer les photos au Flask de Noura (non bloquant)
    if (Array.isArray(photos_base64) && photos_base64.length > 0) {
      const form = new FormData();
      form.append('nom', nomPropre);

      photos_base64.forEach((b64, i) => {
        const buffer = Buffer.from(b64, 'base64');
        form.append('photos', buffer, {
          filename:    `${nomPropre}_${i + 1}.jpg`,
          contentType: 'image/jpeg',
        });
      });

      console.log(`[Faces] Envoi de ${photos_base64.length} photos à Flask pour ${nomPropre}...`);
      envoyerAFlask('/ajouter_visage', form); // pas de await — non bloquant
    } else {
      console.warn(`[Faces] Aucune photo reçue pour ${nomPropre} — dossier non créé chez Noura`);
    }

    res.status(201).json({ visage });
  } catch (e) {
    console.error('[Faces] POST erreur :', e);
    res.status(500).json({ erreur: "Impossible d'ajouter cette personne." });
  }
});

// ── DELETE /:id — Supprimer un visage ────────────────────────────────────────
// Supprime de la DB + envoie ordre de suppression du dossier à Flask
router.delete('/:id', verifierToken, chargerFerme, async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer le nom avant suppression pour l'envoyer à Flask
    const resultat = await db.query(
      'DELETE FROM authorized_faces WHERE id = $1 AND ferme_id = $2 RETURNING *',
      [id, req.fermeId]
    );

    if (resultat.rows.length === 0) {
      return res.status(404).json({ erreur: 'Personne introuvable.' });
    }

    const personne = resultat.rows[0];
    console.log(`[Faces] ✅ Supprimé de la base : ${personne.nom}`);

    // Demander à Flask de supprimer le dossier + réentraîner
    const form = new FormData();
    form.append('nom', personne.nom);
    envoyerAFlask('/supprimer_visage', form); // pas de await — non bloquant

    res.json({ message: 'Personne supprimée.', personne });
  } catch (e) {
    console.error('[Faces] DELETE erreur :', e);
    res.status(500).json({ erreur: 'Impossible de supprimer cette personne.' });
  }
});

module.exports = router;
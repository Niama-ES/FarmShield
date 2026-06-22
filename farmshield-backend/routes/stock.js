const express = require('express');
const router = express.Router();
const db = require('../db');
const verifierToken = require('../middleware/verifierToken');
const chargerFerme = require('../middleware/chargerFerme');

// GET /stock — liste tous les articles de stock du farmer connecté
router.get('/', verifierToken, async (req, res) => {
  try {
    const resultat = await db.query(
      'SELECT * FROM stock_items WHERE ferme_id = $1 ORDER BY created_at DESC',
      [req.fermeId]
    );
    res.json({ stock: resultat.rows });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
});

// POST /stock — ajouter un nouvel article
router.post('/', verifierToken, chargerFerme, async (req, res) => {
  const { nom, quantite_initiale, unite, seuil_alerte } = req.body;

  if (!nom || !quantite_initiale || !unite || !seuil_alerte) {
    return res.status(400).json({ erreur: 'Tous les champs sont obligatoires.' });
  }

  try {
    const resultat = await db.query(
      `INSERT INTO stock_items 
       (ferme_id, nom, quantite_initiale, quantite_actuelle, unite, seuil_alerte) 
       VALUES ($1, $2, $3, $3, $4, $5) 
       RETURNING *`,
      [req.fermeId, nom, quantite_initiale, unite, seuil_alerte]
    );
    res.status(201).json({ message: 'Article ajouté.', article: resultat.rows[0] });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
});

// PUT /stock/:id — modifier le seuil ou le nom d'un article
router.put('/:id', verifierToken, chargerFerme, async (req, res) => {
  const { id } = req.params;
  const { nom, seuil_alerte } = req.body;

  try {
    const resultat = await db.query(
      `UPDATE stock_items 
       SET nom = COALESCE($1, nom), seuil_alerte = COALESCE($2, seuil_alerte)
       WHERE id = $3 AND ferme_id = $4
       RETURNING *`,
      [nom, seuil_alerte, id, req.fermeId]
    );

    if (resultat.rows.length === 0) {
      return res.status(404).json({ erreur: 'Article introuvable.' });
    }

    res.json({ message: 'Article mis à jour.', article: resultat.rows[0] });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
});

// DELETE /stock/:id — supprimer un article
router.delete('/:id', verifierToken, chargerFerme, async (req, res) => {
  const { id } = req.params;

  try {
    const resultat = await db.query(
      'DELETE FROM stock_items WHERE id = $1 AND ferme_id = $2 RETURNING *',
      [id, req.fermeId]
    );

    if (resultat.rows.length === 0) {
      return res.status(404).json({ erreur: 'Article introuvable.' });
    }

    res.json({ message: 'Article supprimé.' });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
});

module.exports = router;
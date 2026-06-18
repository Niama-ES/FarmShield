

const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const resultat = await db.query(
      `SELECT * FROM authorized_faces ORDER BY created_at DESC`
    );
    res.json(resultat.rows);

  } catch (erreur) {
    console.error('Erreur lors de la récupération des visages :', erreur);
    res.status(500).json({ erreur: 'Impossible de récupérer la liste des visages.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nom, photo_url } = req.body;

    if (!nom || !photo_url) {
      return res.status(400).json({
        erreur: 'Les champs "nom" et "photo_url" sont obligatoires.',
      });
    }

    const resultat = await db.query(
      `INSERT INTO authorized_faces (nom, photo_url)
       VALUES ($1, $2)
       RETURNING *`,
      [nom, photo_url]
    );

   
    res.status(201).json(resultat.rows[0]);

  } catch (erreur) {
    console.error('Erreur lors de l\'ajout du visage :', erreur);
    res.status(500).json({ erreur: 'Impossible d\'ajouter cette personne.' });
  }
});


router.patch('/:id/bloquer', async (req, res) => {
  try {
    const { id } = req.params;

    const resultat = await db.query(
      `UPDATE authorized_faces SET statut = 'bloque' WHERE id = $1 RETURNING *`,
      [id]
    );

    if (resultat.rows.length === 0) {
      return res.status(404).json({ erreur: 'Personne introuvable.' });
    }

    res.json(resultat.rows[0]);

  } catch (erreur) {
    console.error('Erreur lors du blocage :', erreur);
    res.status(500).json({ erreur: 'Impossible de bloquer cette personne.' });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const resultat = await db.query(
      `DELETE FROM authorized_faces WHERE id = $1 RETURNING *`,
      [id]
    );

    if (resultat.rows.length === 0) {
      return res.status(404).json({ erreur: 'Personne introuvable.' });
    }

    res.json({ message: 'Personne supprimée.', personne: resultat.rows[0] });

  } catch (erreur) {
    console.error('Erreur lors de la suppression du visage :', erreur);
    res.status(500).json({ erreur: 'Impossible de supprimer cette personne.' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();

const db = require('../db');

router.get('/', async (req, res) => {
  try {

    const { sous_systeme, lu } = req.query;

    let texteRequete = 'SELECT * FROM alerts WHERE 1=1';

    const valeurs = [];

    if (sous_systeme) {
      valeurs.push(sous_systeme);
  
      texteRequete += ` AND sous_systeme = $${valeurs.length}`;
    }

    if (lu !== undefined) {
      valeurs.push(lu === 'true');
      texteRequete += ` AND lu = $${valeurs.length}`;
    }

    texteRequete += ' ORDER BY created_at DESC';

    const resultat = await db.query(texteRequete, valeurs);
    res.json(resultat.rows);

  } catch (erreur) {
    console.error('Erreur lors de la récupération des alertes :', erreur);
 
    res.status(500).json({ erreur: 'Impossible de récupérer les alertes.' });
  }
});

router.patch('/:id/lu', async (req, res) => {
  try {

    const { id } = req.params;

    const resultat = await db.query(
      `UPDATE alerts SET lu = true WHERE id = $1 RETURNING *`,
      [id]
    );

    if (resultat.rows.length === 0) {
      return res.status(404).json({ erreur: 'Alerte introuvable.' });
    }

    res.json(resultat.rows[0]);

  } catch (erreur) {
    console.error('Erreur lors du marquage de l\'alerte :', erreur);
    res.status(500).json({ erreur: 'Impossible de mettre à jour l\'alerte.' });
  }
});


module.exports = router;
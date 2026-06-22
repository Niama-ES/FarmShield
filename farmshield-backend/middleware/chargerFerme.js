const db = require('../db');

async function chargerFerme(req, res, next) {
  try {
    const resultat = await db.query(
      'SELECT * FROM fermes WHERE user_id = $1',
      [req.utilisateur.id]
    );

    if (resultat.rows.length === 0) {
      return res.status(404).json({ erreur: 'Aucune ferme configurée pour ce compte.' });
    }

    req.ferme = resultat.rows[0];
    req.fermeId = resultat.rows[0].id;

    next();
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ erreur: 'Erreur serveur lors du chargement de la ferme.' });
  }
}

module.exports = chargerFerme;
const jwt = require('jsonwebtoken');

function verifierToken(req, res, next) {
  const enTete = req.headers['authorization'];

  if (!enTete) {
    return res.status(401).json({ erreur: 'Aucun token fourni.' });
  }

  const token = enTete.split(' ')[1];

  try {
    const donneesUtilisateur = jwt.verify(token, process.env.JWT_SECRET);
    req.utilisateur = donneesUtilisateur;
    next();
  } catch (erreur) {
    return res.status(401).json({ erreur: 'Token invalide ou expiré.' });
  }
}

module.exports = verifierToken;
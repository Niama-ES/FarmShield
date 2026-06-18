
const express = require('express');
const router = express.Router();

const { client } = require('../mqtt/listener');

const db = require('../db');

const TOPIC_COMMANDES = 'farmshield/commandes';

router.post('/vanne', async (req, res) => {
  try {
   
    const { action } = req.body;

    if (action !== 'fermer' && action !== 'ouvrir') {
      return res.status(400).json({
        erreur: 'Action invalide. Utilisez "fermer" ou "ouvrir".',
      });
    }

    const commande = JSON.stringify({
      cible: 'vanne',
      action: action,
    });

    client.publish(TOPIC_COMMANDES, commande);

    console.log(`Commande envoyée à la vanne : ${action}`);

    res.json({ message: `Commande "${action}" envoyée à la vanne.` });

  } catch (erreur) {
    console.error('Erreur lors de l\'envoi de la commande vanne :', erreur);
    res.status(500).json({ erreur: 'Impossible d\'envoyer la commande.' });
  }
});

router.post('/sirene', async (req, res) => {
  try {
    const { action } = req.body;

    if (action !== 'couper' && action !== 'armer') {
      return res.status(400).json({
        erreur: 'Action invalide. Utilisez "couper" ou "armer".',
      });
    }

    const commande = JSON.stringify({
      cible: 'sirene',
      action: action,
    });

    client.publish(TOPIC_COMMANDES, commande);

    console.log(`Commande envoyée à la sirène : ${action}`);

    res.json({ message: `Commande "${action}" envoyée à la sirène.` });

  } catch (erreur) {
    console.error('Erreur lors de l\'envoi de la commande sirène :', erreur);
    res.status(500).json({ erreur: 'Impossible d\'envoyer la commande.' });
  }
});

module.exports = router;
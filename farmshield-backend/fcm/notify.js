/*
  fcm/notify.js — Envoi de notifications push (Firebase Admin v14)
  ----------------------------------------------------------------
  Correction : firebase-admin v14 utilise l'API modulaire.
  On importe getApps() et initializeApp() directement depuis
  'firebase-admin/app', et messaging() depuis 'firebase-admin/messaging'.
  L'ancien style "admin.apps.length" ne fonctionne plus en v14.
*/

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

const serviceAccount = require('./serviceAccountKey.json');
initializeApp({ credential: cert(serviceAccount) });
const db = require('../db');

// Initialise Firebase une seule fois
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

async function envoyerNotification(titre, corps, donnees = {}) {
  const resultat = await db.query(
    `SELECT fcm_token FROM users WHERE fcm_token IS NOT NULL LIMIT 1`
  );

  if (resultat.rows.length === 0) {
    console.log('Aucun token FCM trouvé — notification non envoyée.');
    return;
  }

  const token = resultat.rows[0].fcm_token;

  const message = {
    notification: {
      title: titre,
      body: corps,
    },
    data: donnees,
    token: token,
  };

  try {
    const reponse = await getMessaging().send(message);
    console.log('Notification envoyée avec succès :', reponse);
    return reponse;
  } catch (erreur) {
    console.error('Erreur lors de l\'envoi de la notification FCM :', erreur);
    throw erreur;
  }
}

module.exports = { envoyerNotification };
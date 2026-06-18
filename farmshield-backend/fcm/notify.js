
const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

if (admin.apps.length === 0) {
  admin.initializeApp({

    credential: admin.credential.cert(serviceAccount),
  });
}

const db = require('../db');
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
    const reponse = await admin.messaging().send(message);
    console.log('Notification envoyée avec succès :', reponse);
    return reponse;
  } catch (erreur) {

    console.error('Erreur lors de l\'envoi de la notification FCM :', erreur);
    throw erreur; 
  }
}

module.exports = { envoyerNotification };
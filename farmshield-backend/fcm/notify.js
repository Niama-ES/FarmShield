const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const serviceAccount = require('./serviceAccountKey.json');

// Initialise Firebase une seule fois
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

async function envoyerNotification(fcmToken, titre, corps, donnees = {}) {
  if (!fcmToken) {
    console.log('Aucun token FCM fourni — notification non envoyée.');
    return;
  }

  const message = {
    notification: {
      title: titre,
      body: corps,
    },
    data: donnees,
    token: fcmToken,
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
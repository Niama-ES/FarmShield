const mqtt = require('mqtt');
const db = require('../db');
const { envoyerNotification } = require('../fcm/notify');

const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  clientId: 'farmshield-backend-' + Math.random().toString(16).slice(2, 8),
});

const TOPICS_CAPTEURS = [
  'farmshield/stockage',
  'farmshield/eau',
  'farmshield/perimetre',
];

client.on('connect', () => {
  console.log('Connecté au broker MQTT HiveMQ.');
  client.subscribe(TOPICS_CAPTEURS, (err) => {
    if (err) {
      console.error('Erreur lors de l\'abonnement aux topics :', err);
    } else {
      console.log('Abonné aux topics :', TOPICS_CAPTEURS.join(', '));
    }
  });
});

client.on('error', (err) => {
  console.error('Erreur de connexion MQTT :', err);
});

client.on('message', async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    console.log(`Message reçu sur ${topic} :`, payload);

    // 1. Identifier la ferme via le token ESP32
    if (!payload.token) {
      console.warn('Message sans token ESP32 — ignoré.');
      return;
    }

    const fermeResultat = await db.query(
      'SELECT * FROM fermes WHERE token_esp32 = $1',
      [payload.token]
    );

    if (fermeResultat.rows.length === 0) {
      console.warn('Token ESP32 inconnu — message ignoré :', payload.token);
      return;
    }

    const ferme = fermeResultat.rows[0];
    const sousSysteme = topicVersSousSysteme(topic);

    // 2. Enregistrer dans sensor_logs avec ferme_id
    await db.query(
      'INSERT INTO sensor_logs (ferme_id, sous_systeme, type_capteur, valeur) VALUES ($1, $2, $3, $4)',
      [ferme.id, sousSysteme, payload.type_capteur, payload.valeur]
    );

    // 3. Si c'est une alerte, la traiter
    if (payload.alerte === true) {
      await traiterAlerte(ferme, sousSysteme, payload);
    }

  } catch (erreur) {
    console.error('Erreur lors du traitement du message MQTT :', erreur);
  }
});

function topicVersSousSysteme(topic) {
  if (topic === 'farmshield/stockage') return 'S1';
  if (topic === 'farmshield/eau') return 'S2';
  if (topic === 'farmshield/perimetre') return 'S3';
  return null;
}

async function traiterAlerte(ferme, sousSysteme, payload) {
  // Insérer l'alerte avec ferme_id
  const resultat = await db.query(
    `INSERT INTO alerts (ferme_id, sous_systeme, type_alerte, description, photo_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      ferme.id,
      sousSysteme,
      payload.type_alerte || 'inconnu',
      payload.description || null,
      payload.photo_url || null,
    ]
  );

  const nouvelleAlerte = resultat.rows[0];
  console.log('Alerte enregistrée en base :', nouvelleAlerte.id);

  // Récupérer le fcm_token du farmer pour lui envoyer la notification
  const userResultat = await db.query(
    'SELECT fcm_token FROM users WHERE id = $1',
    [ferme.user_id]
  );

  if (userResultat.rows.length === 0 || !userResultat.rows[0].fcm_token) {
    console.warn('Pas de FCM token pour ce farmer — notification non envoyée.');
    return;
  }

  try {
    await envoyerNotification(
      userResultat.rows[0].fcm_token,
      `Alerte ${sousSysteme}`,
      nouvelleAlerte.description || 'Anomalie détectée',
      { alerte_id: nouvelleAlerte.id.toString(), sous_systeme: sousSysteme }
    );
  } catch (erreurNotif) {
    console.error('Alerte enregistrée mais notification échouée :', erreurNotif);
  }
}

module.exports = { client };
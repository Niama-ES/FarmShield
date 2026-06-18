
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

    const sousSysteme = topicVersSousSysteme(topic);

    await db.query(
      `INSERT INTO sensor_logs (sous_systeme, type_capteur, valeur)
       VALUES ($1, $2, $3)`,
      [sousSysteme, payload.type_capteur, payload.valeur]
    );

    if (payload.alerte === true) {
      await traiterAlerte(sousSysteme, payload);
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

async function traiterAlerte(sousSysteme, payload) {

  const resultat = await db.query(
    `INSERT INTO alerts (sous_systeme, type_alerte, description, photo_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      sousSysteme,
      payload.type_alerte || 'inconnu',
      payload.description || null,
      payload.photo_url || null,
    ]
  );

  const nouvelleAlerte = resultat.rows[0];

  console.log('Alerte enregistrée en base :', nouvelleAlerte.id);


  try {
    await envoyerNotification(
      `Alerte ${sousSysteme}`,
      nouvelleAlerte.description || 'Anomalie détectée',
      { alerte_id: nouvelleAlerte.id.toString(), sous_systeme: sousSysteme }
    );
  } catch (erreurNotif) {
    console.error('Alerte enregistrée mais notification échouée :', erreurNotif);
  }
}

module.exports = { client };
require('dotenv').config();
const cron = require('node-cron');
const axios = require('axios');
const db = require('../db');

const LAT = process.env.OPENWEATHER_LAT;
const LON = process.env.OPENWEATHER_LON;
const API_KEY = process.env.OPENWEATHER_API_KEY;

async function verifierMeteoEtAjusterIrrigation() {
  console.log('Cron job météo — vérification en cours...');

  try {
    // 1. Récupérer toutes les fermes
    const fermes = await db.query('SELECT * FROM fermes');

    for (const ferme of fermes.rows) {
      const lat = ferme.latitude || process.env.OPENWEATHER_LAT;
      const lon = ferme.longitude || process.env.OPENWEATHER_LON;

      // 2. Appeler l'API météo pour cette ferme
      const reponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );

      const previsions = reponse.data.list;
      const maintenantPlus24h = Date.now() + 24 * 60 * 60 * 1000;

      const pluiePrevue = previsions.some(prevision => {
        const heurePrevision = prevision.dt * 1000;
        const precipitations = prevision.rain ? prevision.rain['3h'] || 0 : 0;
        return heurePrevision <= maintenantPlus24h && precipitations > 2;
      });

      console.log(`Ferme ${ferme.nom} — Pluie prévue : ${pluiePrevue}`);

      // 3. Mettre à jour uniquement les programmes de cette ferme
      if (pluiePrevue) {
        await db.query(
          `UPDATE irrigation_schedule SET actif = false 
           WHERE ferme_id = $1 AND actif = true`,
          [ferme.id]
        );
      } else {
        await db.query(
          `UPDATE irrigation_schedule SET actif = true 
           WHERE ferme_id = $1 AND actif = false`,
          [ferme.id]
        );
      }
    }

    console.log('Cron job météo terminé.');

  } catch (erreur) {
    console.error('Erreur cron job météo :', erreur.message);
  }
}

// Tourne automatiquement toutes les heures
// Format cron : "minute heure jour_mois mois jour_semaine"
// "0 * * * *" = à la minute 0 de chaque heure = toutes les heures
cron.schedule('0 * * * *', verifierMeteoEtAjusterIrrigation);

// Lance aussi une fois immédiatement au démarrage du serveur
verifierMeteoEtAjusterIrrigation();

console.log('Cron job météo démarré — vérifie la météo toutes les heures.');
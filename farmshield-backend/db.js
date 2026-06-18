/*
  db.js — Connexion à la base de données PostgreSQL (Supabase)
  ----------------------------------------------------------------
  Ce fichier est COMMUN — ni3ma et reem l'importent toutes les deux
  dans leurs routes respectives, mais personne ne doit le modifier
  une fois qu'il fonctionne.

  Utilisation dans une route, par exemple routes/auth.js :

      const db = require('../db');
      const resultat = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      console.log(resultat.rows);
*/

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },   // Supabase exige une connexion SSL
});

pool.on('connect', () => {
  console.log('Connecté à la base de données Supabase.');
});

pool.on('error', (err) => {
  console.error('Erreur inattendue sur le pool PostgreSQL :', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
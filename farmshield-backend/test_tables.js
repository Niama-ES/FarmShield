// test_tables.js
// Petit script de vérification — à lancer une seule fois avec :
//   node test_tables.js
// Il interroge directement PostgreSQL via Node.js, sans passer par
// le navigateur Supabase (qui semble traduire l'affichage en français,
// ce qui rend impossible de faire confiance aux captures d'écran).

require('dotenv').config();
const db = require('./db');

async function verifierTables() {
  try {
    const resultat = await db.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );

    console.log('=== VRAIES TABLES (sans traduction possible) ===');
    resultat.rows.forEach(ligne => {
      console.log('-', ligne.table_name);
    });

    process.exit(0);
  } catch (erreur) {
    console.error('Erreur :', erreur);
    process.exit(1);
  }
}

verifierTables();
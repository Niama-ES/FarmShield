/*
  server.js — Point d'entree du backend FarmShield
  ----------------------------------------------------------------
*/

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ---- Route de test — confirme que le serveur tourne ----
app.get('/', (req, res) => {
  res.json({ message: 'FarmShield backend en ligne.' });
});

// =====================================================
// ROUTES — 1
// =====================================================

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const sensorsRoutes = require('./routes/sensors');
app.use('/sensors', sensorsRoutes);

const stockRoutes = require('./routes/stock');
app.use('/stock', stockRoutes);

const irrigationRoutes = require('./routes/irrigation');
app.use('/irrigation', irrigationRoutes);

const usersRoutes = require('./routes/users');
app.use('/users', usersRoutes);

// =====================================================
// ROUTES — 2
// Decommente chaque ligne une fois le fichier correspondant cree
// =====================================================
// const alertsRoutes = require('./routes/alerts');
// app.use('/alerts', alertsRoutes);

// const controlRoutes = require('./routes/control');
// app.use('/control', controlRoutes);

// const facesRoutes = require('./routes/faces');
// app.use('/faces', facesRoutes);

// const cameraRoutes = require('./routes/camera');
// app.use('/camera', cameraRoutes);

// ---- MQTT listener (Reem) — tourne en arriere-plan, pas une route ----
// require('./mqtt/listener');

// ---- Cron job meteo  — tourne en arriere-plan, pas une route ----
require('./weather/cronJob');

app.listen(PORT, () => {
  console.log(`Serveur FarmShield demarre sur le port ${PORT}`);
});
// src/screens/DetailS3.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getStatus, getHistory } from '../api/sensors';
import SensorCard from '../components/SensorCard';
import StatusBadge from '../components/StatusBadge';
import colors from '../theme/colors';

export default function DetailS3() {
  const { token } = useAuth();
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const charger = async () => {
    try {
      const [s, h] = await Promise.all([
        getStatus(token),
        getHistory(token, 'S3'),
      ]);
      setStatus(s?.s3 || null);
      setHistory(h?.historique || []);
    } catch (e) {
      console.log('Erreur S3:', e);
    }
  };

  useEffect(() => { charger(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await charger();
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.s3Color} />}
    >
      <View style={styles.header}>
        <Text style={styles.titre}>🔒 S3 — Périmètre & Bétail</Text>
        <StatusBadge statut={status?.alerte ? 'alerte' : status ? 'ok' : 'hors-ligne'} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>CAPTEURS EN TEMPS RÉEL</Text>
        <SensorCard
          label="Détecteur PIR"
          valeur={status?.mouvement ? 'Mouvement détecté' : 'Calme'}
          unite=""
          couleur={status?.mouvement ? colors.danger : colors.s3Color}
          description="PIR HC-SR501 — entrée principale"
        />
        <SensorCard
          label="Capteur vibration clôture"
          valeur={status?.vibration ? 'Vibration détectée' : 'Normal'}
          unite=""
          couleur={status?.vibration ? colors.danger : colors.s3Color}
          description="SW-420 — clôture périmètre"
        />
      </View>

      {/* GPS Animaux */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>GPS COLLIERS ANIMAUX</Text>
        <View style={styles.card}>
          {status?.animaux && status.animaux.length > 0 ? (
            status.animaux.map((animal, i) => (
              <View key={i} style={styles.animalRow}>
                <Text style={styles.animalIcon}>🐄</Text>
                <View style={styles.animalInfo}>
                  <Text style={styles.animalNom}>{animal.nom}</Text>
                  <Text style={styles.animalPos}>
                    {animal.lat?.toFixed(4)}, {animal.lon?.toFixed(4)}
                  </Text>
                </View>
                <View style={[styles.animalBadge, {
                  backgroundColor: animal.hors_zone ? colors.danger + '22' : colors.s3Color + '22'
                }]}>
                  <Text style={{ color: animal.hors_zone ? colors.danger : colors.s3Color, fontSize: 11, fontWeight: 'bold' }}>
                    {animal.hors_zone ? '⚠ Hors zone' : '✓ OK'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              {status ? 'Aucun collier GPS connecté' : 'Hors-ligne'}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>HISTORIQUE DÉTECTIONS</Text>
        <View style={styles.card}>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>Aucune détection enregistrée</Text>
          ) : (
            history.slice(0, 8).map((h, i) => (
              <View key={i} style={styles.histRow}>
                <Text style={styles.histDate}>
                  {new Date(h.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </Text>
                <Text style={[styles.histVal, { color: h.mouvement ? colors.danger : colors.s3Color }]}>
                  {h.mouvement ? '⚡ Mouvement' : '✓ Calme'}
                </Text>
                {h.alerte && <Text style={styles.alerteDot}>⚠</Text>}
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>COMMENT ÇA MARCHE</Text>
        <View style={styles.card}>
          <Text style={styles.explicationText}>
            Le PIR détecte la chaleur corporelle humaine même la nuit. La vibration SW-420 détecte toute tentative de couper ou escalader la clôture. Les colliers GPS alertent si un animal sort de la géo-clôture virtuelle définie autour de la ferme.
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 24, paddingTop: 60,
  },
  titre: { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', flex: 1 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitre: {
    color: colors.textMuted, fontSize: 11,
    letterSpacing: 2, fontWeight: 'bold', marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: colors.cardBorder,
  },
  animalRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, gap: 12,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  animalIcon: { fontSize: 24 },
  animalInfo: { flex: 1 },
  animalNom: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  animalPos: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  animalBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  histRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  histDate: { color: colors.textSecondary, fontSize: 11, flex: 1 },
  histVal: { fontSize: 13, fontWeight: '600' },
  alerteDot: { fontSize: 14, marginLeft: 8 },
  emptyText: { color: colors.textMuted, textAlign: 'center', padding: 8 },
  explicationText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
// src/screens/DetailS1.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getStatus, getHistory } from '../api/sensors';
import SensorCard from '../components/SensorCard';
import StatusBadge from '../components/StatusBadge';
import colors from '../theme/colors';

export default function DetailS1({ navigation }) {
  const { token } = useAuth();
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const charger = async () => {
    try {
      const [s, h] = await Promise.all([
        getStatus(token),
        getHistory(token, 'S1'),
      ]);
      setStatus(s?.s1 || null);
      setHistory(h?.historique || []);
    } catch (e) {
      console.log('Erreur S1:', e);
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.s1Color} />}
    >
      <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        style={{ padding: 20, paddingTop: 56, paddingBottom: 0 }}
      >
        <Text style={{ color: colors.primary, fontSize: 15 }}>← Retour</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.titre}>📦 S1 — Stockage Agricole</Text>
        <StatusBadge statut={status?.alerte ? 'alerte' : status ? 'ok' : 'hors-ligne'} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>CAPTEURS EN TEMPS RÉEL</Text>
        <SensorCard
          label="Poids conteneur"
          valeur={status?.poids_kg ?? '—'}
          unite="kg"
          couleur={colors.s1Color}
          description="Cellule de charge HX711"
        />
        <SensorCard
          label="Dernier accès reconnu"
          valeur={status?.dernier_acces ?? '—'}
          unite=""
          couleur={colors.primary}
          description="Reconnaissance faciale ESP32-CAM"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>ZONES SURVEILLÉES</Text>
        {['Pesticides', 'L3alf (fourrage)', 'Sel', 'Médicaments vét.', 'Carburant'].map(zone => (
          <View key={zone} style={styles.zoneRow}>
            <Text style={styles.zoneDot}>●</Text>
            <Text style={styles.zoneText}>{zone}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>HISTORIQUE POIDS</Text>
        <View style={styles.card}>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>Aucune mesure enregistrée</Text>
          ) : (
            history.slice(0, 8).map((h, i) => (
              <View key={i} style={styles.histRow}>
                <Text style={styles.histDate}>
                  {new Date(h.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </Text>
                <Text style={[styles.histVal, { color: colors.s1Color }]}>
                  {h.poids_kg} kg
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
            Le capteur HX711 mesure le poids en continu. Si le poids diminue sans qu'un visage autorisé ait été reconnu par la caméra dans les 30 dernières secondes → alerte vol déclenchée automatiquement.
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
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  zoneDot: { color: colors.s1Color, fontSize: 10 },
  zoneText: { color: colors.textSecondary, fontSize: 14 },
  histRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  histDate: { color: colors.textSecondary, fontSize: 11, flex: 1 },
  histVal: { fontSize: 14, fontWeight: '600' },
  alerteDot: { fontSize: 14, marginLeft: 8 },
  emptyText: { color: colors.textMuted, textAlign: 'center', padding: 8 },
  explicationText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
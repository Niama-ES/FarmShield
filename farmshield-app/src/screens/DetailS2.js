// src/screens/DetailS2.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getStatus, getHistory } from '../api/sensors';
import { actionVanne } from '../api/control';
import SensorCard from '../components/SensorCard';
import StatusBadge from '../components/StatusBadge';
import colors from '../theme/colors';

export default function DetailS2() {
  const { token } = useAuth();
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [vanneOuverte, setVanneOuverte] = useState(false);

  const charger = async () => {
    try {
      const [s, h] = await Promise.all([
        getStatus(token),
        getHistory(token, 'S2'),
      ]);
      setStatus(s?.s2 || null);
      setHistory(h?.historique || []);
      setVanneOuverte(s?.s2?.vanne_ouverte || false);
    } catch (e) {
      console.log('Erreur S2:', e);
    }
  };

  useEffect(() => { charger(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await charger();
    setRefreshing(false);
  }, []);

  const handleVanne = async () => {
    const action = vanneOuverte ? 'fermer' : 'ouvrir';
    Alert.alert('Confirmation', `${action} la vanne ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer', onPress: async () => {
          try {
            await actionVanne(token, action);
            setVanneOuverte(!vanneOuverte);
          } catch (e) {
            Alert.alert('Erreur', 'Action échouée.');
          }
        }
      }
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.s2Color} />}
    >
      <View style={styles.header}>
        <Text style={styles.titre}>💧 S2 — Eau & Irrigation</Text>
        <StatusBadge statut={status?.alerte ? 'alerte' : status ? 'ok' : 'hors-ligne'} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>CAPTEURS EN TEMPS RÉEL</Text>
        <SensorCard
          label="Débit actuel"
          valeur={status?.debit_lpm ?? '—'}
          unite="L/min"
          couleur={colors.s2Color}
          description="Débitmètre YF-S201"
        />
        <SensorCard
          label="Volume consommé aujourd'hui"
          valeur={status?.volume_jour ?? '—'}
          unite="L"
          couleur={colors.info}
          description="Cumul journalier"
        />
      </View>

      {/* Contrôle vanne */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>CONTRÔLE VANNE</Text>
        <View style={styles.card}>
          <View style={styles.vanneRow}>
            <View>
              <Text style={styles.vanneTitre}>Électrovanne solénoïde</Text>
              <Text style={[styles.vanneStatut, { color: vanneOuverte ? colors.s2Color : colors.textMuted }]}>
                {vanneOuverte ? '● Ouverte' : '○ Fermée'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.vanneBtn, { backgroundColor: vanneOuverte ? colors.danger : colors.s2Color }]}
              onPress={handleVanne}
            >
              <Text style={styles.vanneBtnText}>
                {vanneOuverte ? 'Fermer' : 'Ouvrir'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>HISTORIQUE DÉBIT</Text>
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
                <Text style={[styles.histVal, { color: colors.s2Color }]}>
                  {h.debit_lpm} L/min
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
            Le débitmètre YF-S201 compte les litres qui passent dans le canal. Si le débit chute brusquement sans programme d'irrigation actif → branchement illégal détecté → vanne fermée automatiquement.
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
  vanneRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vanneTitre: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  vanneStatut: { fontSize: 12, marginTop: 4 },
  vanneBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  vanneBtnText: { color: '#fff', fontWeight: 'bold' },
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
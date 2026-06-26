// src/screens/Controle.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { actionVanne, actionSirene } from '../api/control';
import colors from '../theme/colors';

export default function Controle() {
  const { token } = useAuth();
  const [vanneOuverte, setVanneOuverte] = useState(false);
  const [sireneActive, setSireneActive] = useState(false);
  const [loadingVanne, setLoadingVanne] = useState(false);
  const [loadingSirene, setLoadingSirene] = useState(false);

  const handleVanne = async () => {
    const action = vanneOuverte ? 'fermer' : 'ouvrir';
    Alert.alert(
      'Confirmation',
      `Voulez-vous ${action} la vanne ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setLoadingVanne(true);
            try {
              const data = await actionVanne(token, action);
              if (!data.erreur) setVanneOuverte(!vanneOuverte);
              else Alert.alert('Erreur', data.erreur);
            } catch (e) {
              Alert.alert('Erreur', 'Impossible de contacter le serveur.');
            } finally {
              setLoadingVanne(false);
            }
          }
        }
      ]
    );
  };

  const handleSirene = async () => {
    const action = sireneActive ? 'couper' : 'armer';
    Alert.alert(
      'Confirmation',
      `Voulez-vous ${action} la sirène ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setLoadingSirene(true);
            try {
              const data = await actionSirene(token, action);
              if (!data.erreur) setSireneActive(!sireneActive);
              else Alert.alert('Erreur', data.erreur);
            } catch (e) {
              Alert.alert('Erreur', 'Impossible de contacter le serveur.');
            } finally {
              setLoadingSirene(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titre}>🎛 Contrôle Système</Text>
        <Text style={styles.sousTitre}>Contrôle manuel des actionneurs</Text>
      </View>

      {/* Avertissement */}
      <View style={styles.warning}>
        <Text style={styles.warningText}>
          ⚠️ Ces actions agissent directement sur le terrain. Confirmez avant d'agir.
        </Text>
      </View>

      {/* Vanne */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>IRRIGATION — VANNE</Text>
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardIcon}>💧</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitre}>Électrovanne S2</Text>
              <Text style={styles.cardDesc}>Canal d'irrigation principal</Text>
            </View>
            <View style={[styles.statut, { backgroundColor: vanneOuverte ? colors.s2Color + '22' : colors.cardBorder }]}>
              <Text style={[styles.statutText, { color: vanneOuverte ? colors.s2Color : colors.textMuted }]}>
                {vanneOuverte ? '● Ouverte' : '○ Fermée'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: vanneOuverte ? colors.danger : colors.s2Color }]}
            onPress={handleVanne}
            disabled={loadingVanne}
          >
            <Text style={styles.btnText}>
              {loadingVanne ? 'En cours...' : vanneOuverte ? '🔴 Fermer la vanne' : '🟢 Ouvrir la vanne'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sirène */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>PÉRIMÈTRE — SIRÈNE</Text>
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardIcon}>🚨</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitre}>Sirène 120dB</Text>
              <Text style={styles.cardDesc}>Alarme périmètre ferme</Text>
            </View>
            <View style={[styles.statut, { backgroundColor: sireneActive ? colors.danger + '22' : colors.cardBorder }]}>
              <Text style={[styles.statutText, { color: sireneActive ? colors.danger : colors.textMuted }]}>
                {sireneActive ? '● Active' : '○ Inactive'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: sireneActive ? colors.textMuted : colors.danger }]}
            onPress={handleSirene}
            disabled={loadingSirene}
          >
            <Text style={styles.btnText}>
              {loadingSirene ? 'En cours...' : sireneActive ? '🔕 Couper la sirène' : '🚨 Activer la sirène'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info mode hors-ligne */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitre}>🔋 Mode hors-ligne</Text>
        <Text style={styles.infoText}>
          La sirène et la vanne fonctionnent aussi sans internet via l'ESP32 local.
          Ces boutons envoient des commandes MQTT via le cloud.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, paddingTop: 60 },
  titre: { color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  sousTitre: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  warning: {
    backgroundColor: colors.warning + '22',
    borderLeftWidth: 3, borderLeftColor: colors.warning,
    margin: 16, padding: 12, borderRadius: 8,
  },
  warningText: { color: colors.warning, fontSize: 12 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitre: {
    color: colors.textMuted, fontSize: 11,
    letterSpacing: 2, fontWeight: 'bold', marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: colors.cardBorder,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  cardIcon: { fontSize: 32 },
  cardInfo: { flex: 1 },
  cardTitre: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  cardDesc: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  statut: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statutText: { fontSize: 11, fontWeight: 'bold' },
  btn: { borderRadius: 10, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  infoCard: {
    backgroundColor: colors.card, borderRadius: 12,
    margin: 16, padding: 16,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  infoTitre: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  infoText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
});
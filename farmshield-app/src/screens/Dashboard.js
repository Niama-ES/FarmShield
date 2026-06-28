// src/screens/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Modal, Image
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getStatus } from '../api/sensors';
import { getAlertes } from '../api/alerts';
import colors from '../theme/colors';

export default function Dashboard({ navigation }) {
  const { token, user } = useAuth();
  const [status, setStatus] = useState(null);
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [systemeSelectionne, setSystemeSelectionne] = useState(null);

  const charger = async () => {
    try {
      const [s, a] = await Promise.all([
        getStatus(token),
        getAlertes(token),
      ]);
      setStatus(s);
      setAlertes((a.alertes || []).slice(0, 4));
    } catch (e) {
      console.log('Erreur dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await charger();
    setRefreshing(false);
  }, []);

  const ouvrirSysteme = (systeme) => {
    setSystemeSelectionne(systeme);
    setModalVisible(true);
  };

  const toutOk = !status?.s1?.alerte && !status?.s2?.alerte && !status?.s3?.alerte;

  const zones = [
    {
      id: 'S1', label: 'Stockage', icone: '📦',
      couleur: colors.s1Color,
      alerte: status?.s1?.alerte,
      connecte: !!status?.s1,
      details: [
        { label: 'Poids', valeur: `${status?.s1?.poids_kg ?? '—'} kg` },
        { label: 'Dernier accès', valeur: status?.s1?.dernier_acces ?? '—' },
        { label: 'Statut', valeur: status?.s1?.alerte ? '⚠ Alerte vol' : '✓ Normal' },
      ]
    },
    {
      id: 'S2', label: 'Irrigation', icone: '💧',
      couleur: colors.s2Color,
      alerte: status?.s2?.alerte,
      connecte: !!status?.s2,
      details: [
        { label: 'Débit', valeur: `${status?.s2?.debit_lpm ?? '—'} L/min` },
        { label: 'Vanne', valeur: status?.s2?.vanne_ouverte ? '● Ouverte' : '○ Fermée' },
        { label: 'Statut', valeur: status?.s2?.alerte ? '⚠ Anomalie' : '✓ Normal' },
      ]
    },
    {
      id: 'S3', label: 'Périmètre & Bétail', icone: '🔒',
      couleur: colors.s3Color,
      alerte: status?.s3?.alerte,
      connecte: !!status?.s3,
      details: [
        { label: 'Mouvement', valeur: status?.s3?.mouvement ? '⚡ Détecté' : '✓ Calme' },
        { label: 'Clôture', valeur: status?.s3?.vibration ? '⚠ Vibration' : '✓ Intact' },
        { label: 'Animaux', valeur: status?.s3?.animaux_hors_zone ? '⚠ Hors zone' : '✓ En sécurité' },
      ]
    },
  ];

  const systeme = zones.find(z => z.id === systemeSelectionne?.id);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.bonjour}>Bonjour 👋</Text>
          <Text style={styles.nomFerme}>{user?.nom_ferme || 'Ma Ferme'}</Text>
        </View>
        <View style={styles.logoCircle}>
          <Text style={styles.logoCircleText}>🌿</Text>
        </View>
      </View>

      {/* Statut global */}
      <View style={[styles.statutGlobal, { borderColor: toutOk ? colors.primary : colors.danger }]}>
        <View style={[styles.statutIcone, { backgroundColor: toutOk ? colors.primary + '22' : colors.danger + '22' }]}>
          <Text style={styles.statutIconeText}>{toutOk ? '✓' : '⚠'}</Text>
        </View>
        <View>
          <Text style={[styles.statutTitre, { color: toutOk ? colors.primary : colors.danger }]}>
            {toutOk ? 'Ferme sécurisée' : 'Alerte en cours'}
          </Text>
          <Text style={styles.statutSub}>
            {toutOk ? 'Tout est sous contrôle' : 'Vérifiez les zones en alerte'}
          </Text>
        </View>
      </View>

      {/* Zones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Zones</Text>
        <View style={styles.zonesGrid}>
          {zones.map(zone => {
            const couleur = zone.alerte ? colors.danger : zone.connecte ? colors.success : colors.textMuted;
            return (
              <TouchableOpacity
                key={zone.id}
                style={[styles.zoneCard, zone.alerte && styles.zoneCardAlerte]}
                onPress={() => ouvrirSysteme(zone)}
              >
                <Text style={styles.zoneId}>{zone.id}</Text>
                <Text style={styles.zoneLabel}>{zone.label}</Text>
                <View style={styles.zoneStatut}>
                  {zone.alerte
                    ? <Text style={[styles.zoneStatutText, { color: colors.danger }]}>⚠ Alerte</Text>
                    : zone.connecte
                      ? <Text style={[styles.zoneStatutText, { color: colors.success }]}>✓ OK</Text>
                      : <Text style={[styles.zoneStatutText, { color: colors.textMuted }]}>○ OFF</Text>
                  }
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Alertes récentes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitre}>Alertes récentes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Alertes')}>
            <Text style={styles.toutVoir}>Tout voir</Text>
          </TouchableOpacity>
        </View>

        {alertes.length === 0 ? (
          <View style={styles.aucuneAlerte}>
            <Text style={styles.aucuneAlerteText}>✓ Aucune alerte récente</Text>
          </View>
        ) : (
          alertes.map((alerte, i) => {
            const couleur = alerte.sous_systeme === 'S1' ? colors.s1Color
              : alerte.sous_systeme === 'S2' ? colors.s2Color : colors.s3Color;
            const date = new Date(alerte.created_at).toLocaleDateString('fr-FR', {
              hour: '2-digit', minute: '2-digit'
            });
            return (
              <View key={i} style={styles.alerteRow}>
                <View style={[styles.alerteIcone, { backgroundColor: couleur + '22' }]}>
                  <Text style={{ fontSize: 16 }}>
                    {alerte.sous_systeme === 'S1' ? '📦' : alerte.sous_systeme === 'S2' ? '💧' : '🔒'}
                  </Text>
                </View>
                <View style={styles.alerteInfo}>
                  <Text style={styles.alerteMessage} numberOfLines={1}>{alerte.message}</Text>
                  <Text style={styles.alerteDate}>{alerte.sous_systeme} · {date}</Text>
                </View>
                {!alerte.lu && <View style={styles.dotNonLu} />}
              </View>
            );
          })
        )}
      </View>

      {/* Météo */}
      {status?.meteo && (
        <View style={styles.meteoCard}>
          <Text style={styles.meteoIcon}>🌤</Text>
          <View>
            <Text style={styles.meteoText}>{status.meteo.temperature}°C · {status.meteo.description}</Text>
            {status.meteo.pluie_prevue && (
              <Text style={styles.meteoPluie}>🌧 Irrigation annulée — pluie prévue</Text>
            )}
          </View>
        </View>
      )}

      <View style={{ height: 30 }} />

      {/* Modal détail sous-système */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity style={styles.modalCard} activeOpacity={1}>
            {systeme && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalIcone}>{systeme.icone}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitre}>{systeme.id} — {systeme.label}</Text>
                    <View style={[styles.modalBadge, {
                      backgroundColor: systeme.alerte ? colors.danger + '22' : colors.success + '22'
                    }]}>
                      <Text style={[styles.modalBadgeText, {
                        color: systeme.alerte ? colors.danger : colors.success
                      }]}>
                        {systeme.alerte ? '⚠ ALERTE' : '✓ OK'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalDivider} />

                {systeme.details.map((d, i) => (
                  <View key={i} style={styles.modalRow}>
                    <Text style={styles.modalLabel}>{d.label}</Text>
                    <Text style={[styles.modalVal, {
                      color: d.valeur.includes('⚠') ? colors.danger
                        : d.valeur.includes('✓') ? colors.success
                        : colors.textPrimary
                    }]}>{d.valeur}</Text>
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.modalBtn, { borderColor: systeme.couleur }]}
                  onPress={() => {
                    setModalVisible(false);
                    const dest = systeme.id === 'S1' ? 'DetailS1' : systeme.id === 'S2' ? 'DetailS2' : 'DetailS3';
                    navigation.navigate(dest);
                  }}
                >
                  <Text style={[styles.modalBtnText, { color: systeme.couleur }]}>
                    Voir détails complets →
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, paddingTop: 56,
  },
  bonjour: { color: colors.textSecondary, fontSize: 14 },
  nomFerme: { color: colors.textPrimary, fontSize: 22, fontWeight: 'bold' },
  logoCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.card, borderWidth: 1,
    borderColor: colors.cardBorder, justifyContent: 'center', alignItems: 'center',
  },
  logoCircleText: { fontSize: 22 },

  // Statut global
  statutGlobal: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    margin: 16, marginTop: 4, padding: 16,
    backgroundColor: colors.card, borderRadius: 16,
    borderWidth: 1,
  },
  statutIcone: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  statutIconeText: { fontSize: 22 },
  statutTitre: { fontSize: 16, fontWeight: 'bold' },
  statutSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },

  // Zones
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitre: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 12 },
  toutVoir: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  zonesGrid: { flexDirection: 'row', gap: 10 },
  zoneCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  zoneCardAlerte: { borderColor: colors.danger + '66', backgroundColor: colors.danger + '11' },
  zoneId: { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' },
  zoneLabel: { color: colors.textSecondary, fontSize: 11, textAlign: 'center' },
  zoneStatut: { marginTop: 4 },
  zoneStatutText: { fontSize: 12, fontWeight: '600' },

  // Alertes
  alerteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  alerteIcone: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  alerteInfo: { flex: 1 },
  alerteMessage: { color: colors.textPrimary, fontSize: 13, fontWeight: '500' },
  alerteDate: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  dotNonLu: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  aucuneAlerte: {
    padding: 16, backgroundColor: colors.card,
    borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  aucuneAlerteText: { color: colors.success, fontSize: 13 },

  // Météo
  meteoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 8, padding: 14,
    backgroundColor: colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  meteoIcon: { fontSize: 28 },
  meteoText: { color: colors.textPrimary, fontSize: 13 },
  meteoPluie: { color: colors.info, fontSize: 12, marginTop: 2 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  modalIcone: { fontSize: 36 },
  modalTitre: { color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' },
  modalBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  modalBadgeText: { fontSize: 11, fontWeight: 'bold' },
  modalClose: { color: colors.textSecondary, fontSize: 20, padding: 4 },
  modalDivider: { height: 1, backgroundColor: colors.cardBorder, marginBottom: 16 },
  modalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  modalLabel: { color: colors.textSecondary, fontSize: 13 },
  modalVal: { fontSize: 13, fontWeight: '600' },
  modalBtn: {
    marginTop: 20, padding: 14, borderRadius: 12,
    borderWidth: 1, alignItems: 'center',
  },
  modalBtnText: { fontWeight: '600', fontSize: 14 },
});
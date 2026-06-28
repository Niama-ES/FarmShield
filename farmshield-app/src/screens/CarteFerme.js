// src/screens/CarteFerme.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Modal
} from 'react-native';
import MapView, { Marker, Circle, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useAuth } from '../context/AuthContext';
import { getStatus } from '../api/sensors';
import colors from '../theme/colors';

export default function CarteFerme({ navigation }) {
  const { token } = useAuth();
  const [status, setStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [systemeSelectionne, setSystemeSelectionne] = useState(null);

  const latitude = 31.7917;
  const longitude = -7.0926;

  const charger = async () => {
    try {
      const data = await getStatus(token);
      setStatus(data);
    } catch (e) {
      console.log('Erreur carte:', e);
    }
  };

  useEffect(() => { charger(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await charger();
    setRefreshing(false);
  };

  const zones = [
    {
      id: 'S1', label: 'Stockage', icone: '📦',
      couleur: colors.s1Color,
      alerte: status?.s1?.alerte,
      connecte: !!status?.s1,
      lat: latitude - 0.0008,
      lon: longitude - 0.0010,
      details: [
        { label: 'Poids', valeur: `${status?.s1?.poids_kg ?? '—'} kg` },
        { label: 'Statut', valeur: status?.s1?.alerte ? '⚠ Alerte vol' : '✓ Normal' },
        { label: 'Dernier accès', valeur: status?.s1?.dernier_acces ?? '—' },
      ]
    },
    {
      id: 'S2', label: 'Irrigation', icone: '💧',
      couleur: colors.s2Color,
      alerte: status?.s2?.alerte,
      connecte: !!status?.s2,
      lat: latitude + 0.0005,
      lon: longitude + 0.0008,
      details: [
        { label: 'Débit', valeur: `${status?.s2?.debit_lpm ?? '—'} L/min` },
        { label: 'Vanne', valeur: status?.s2?.vanne_ouverte ? '● Ouverte' : '○ Fermée' },
        { label: 'Statut', valeur: status?.s2?.alerte ? '⚠ Anomalie' : '✓ Normal' },
      ]
    },
    {
      id: 'S3', label: 'Périmètre', icone: '🔒',
      couleur: colors.s3Color,
      alerte: status?.s3?.alerte,
      connecte: !!status?.s3,
      lat: latitude + 0.0008,
      lon: longitude - 0.0005,
      details: [
        { label: 'Mouvement', valeur: status?.s3?.mouvement ? '⚡ Détecté' : '✓ Calme' },
        { label: 'Clôture', valeur: status?.s3?.vibration ? '⚠ Vibration' : '✓ Intact' },
        { label: 'Animaux', valeur: status?.s3?.animaux_hors_zone ? '⚠ Hors zone' : '✓ OK' },
      ]
    },
  ];

  const ouvrirSysteme = (zone) => {
    setSystemeSelectionne(zone);
    setModalVisible(true);
  };

  const getCouleurStatut = (zone) => {
    if (!zone.connecte) return colors.textMuted;
    if (zone.alerte) return colors.danger;
    return colors.success;
  };

  const systeme = zones.find(z => z.id === systemeSelectionne?.id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titre}>🗺 Carte de la Ferme</Text>
        <Text style={styles.sousTitre}>Appuyez sur une zone pour voir les détails</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
          <Circle
            center={{ latitude, longitude }}
            radius={200}
            strokeColor={colors.primary + '88'}
            fillColor={colors.primary + '11'}
            strokeWidth={2}
          />
          {zones.map(zone => (
            <Marker
              key={zone.id}
              coordinate={{ latitude: zone.lat, longitude: zone.lon }}
              onPress={() => ouvrirSysteme(zone)}
            >
              <View style={[styles.markerContainer, { borderColor: getCouleurStatut(zone) }]}>
                <Text style={styles.markerIcone}>{zone.icone}</Text>
                <Text style={[styles.markerId, { color: getCouleurStatut(zone) }]}>{zone.id}</Text>
              </View>
            </Marker>
          ))}
        </MapView>

        <View style={styles.legende}>
          <View style={styles.legendeItem}>
            <View style={[styles.legendeDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendeText}>OK</Text>
          </View>
          <View style={styles.legendeItem}>
            <View style={[styles.legendeDot, { backgroundColor: colors.danger }]} />
            <Text style={styles.legendeText}>Alerte</Text>
          </View>
          <View style={styles.legendeItem}>
            <View style={[styles.legendeDot, { backgroundColor: colors.textMuted }]} />
            <Text style={styles.legendeText}>Hors-ligne</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.listeContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.sectionTitre}>TOUTES LES ZONES</Text>
        {zones.map(zone => (
          <TouchableOpacity
            key={zone.id}
            style={styles.zoneItem}
            onPress={() => ouvrirSysteme(zone)}
          >
            <Text style={styles.zoneIcone}>{zone.icone}</Text>
            <View style={styles.zoneInfo}>
              <Text style={styles.zoneTitre}>{zone.id} — {zone.label}</Text>
              <Text style={styles.zoneDesc}>
                {zone.id === 'S1' ? 'Pesticides, L3alf, carburant, médicaments'
                  : zone.id === 'S2' ? 'Canal d\'eau, débitmètre, vanne solénoïde'
                  : 'Clôture, PIR, GPS animaux, caméra'}
              </Text>
            </View>
            <View style={[styles.statutDot, { backgroundColor: getCouleurStatut(zone) }]} />
          </TouchableOpacity>
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>

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
                        {systeme.alerte ? '⚠ ALERTE' : systeme.connecte ? '✓ OK' : '○ Hors-ligne'}
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
                    const dest = systeme.id === 'S1' ? 'DetailS1'
                      : systeme.id === 'S2' ? 'DetailS2' : 'DetailS3';
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, paddingTop: 56 },
  titre: { color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  sousTitre: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  mapContainer: {
    height: 300, marginHorizontal: 16,
    borderRadius: 16, overflow: 'hidden',
    position: 'relative',
  },
  map: { flex: 1 },
  legende: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8,
    padding: 8, flexDirection: 'row', gap: 10,
  },
  legendeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendeDot: { width: 8, height: 8, borderRadius: 4 },
  legendeText: { color: '#fff', fontSize: 10 },
  markerContainer: {
    padding: 8, borderRadius: 10, borderWidth: 2,
    backgroundColor: colors.card,
    alignItems: 'center', minWidth: 52,
  },
  markerIcone: { fontSize: 20 },
  markerId: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  listeContainer: { flex: 1, paddingHorizontal: 16, marginTop: 12 },
  sectionTitre: {
    color: colors.textMuted, fontSize: 11,
    letterSpacing: 2, fontWeight: 'bold', marginBottom: 10,
  },
  zoneItem: {
    backgroundColor: colors.card, borderRadius: 12,
    padding: 14, marginBottom: 8, flexDirection: 'row',
    alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  zoneIcone: { fontSize: 28 },
  zoneInfo: { flex: 1 },
  zoneTitre: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  zoneDesc: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  statutDot: { width: 10, height: 10, borderRadius: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  modalIcone: { fontSize: 36 },
  modalTitre: { color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' },
  modalBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, alignSelf: 'flex-start', marginTop: 4,
  },
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
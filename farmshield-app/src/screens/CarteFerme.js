// src/screens/CarteFerme.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Modal
} from 'react-native';
import MapView, { Marker, Circle, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getStatus } from '../api/sensors';

export default function CarteFerme({ navigation }) {
  const { colors }    = useTheme();
  const { token }     = useAuth();
  const [status,      setStatus]      = useState(null);
  const [refreshing,  setRefreshing]  = useState(false);
  const [modalVisible,setModalVisible]= useState(false);
  const [systemeSelectionne, setSystemeSelectionne] = useState(null);

  const latitude  = 31.7917;
  const longitude = -7.0926;

  const charger = async () => {
    try {
      const data = await getStatus(token);
      setStatus(data);
    } catch (e) { console.log('Erreur carte:', e); }
  };

  useEffect(() => { charger(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await charger();
    setRefreshing(false);
  };

  const zones = [
    {
      id: 'S1', label: 'Stockage',  icon: 'cube-outline',
      couleur: colors.s1Color,
      alerte:  status?.s1?.alerte,
      connecte:!!status?.s1,
      lat: latitude  - 0.0008,
      lon: longitude - 0.0010,
      details: [
        { label: 'Poids',        valeur: `${status?.s1?.poids_kg ?? '—'} kg` },
        { label: 'Statut',       valeur: status?.s1?.alerte ? 'Alerte vol' : 'Normal' },
        { label: 'Dernier accès',valeur: status?.s1?.dernier_acces ?? '—' },
      ],
    },
    {
      id: 'S2', label: 'Irrigation', icon: 'water-outline',
      couleur: colors.s2Color,
      alerte:  status?.s2?.alerte,
      connecte:!!status?.s2,
      lat: latitude  + 0.0005,
      lon: longitude + 0.0008,
      details: [
        { label: 'Débit', valeur: `${status?.s2?.debit_lpm ?? '—'} L/min` },
        { label: 'Vanne', valeur: status?.s2?.vanne_ouverte ? 'Ouverte' : 'Fermée' },
        { label: 'Statut',valeur: status?.s2?.alerte ? 'Anomalie' : 'Normal' },
      ],
    },
    {
      id: 'S3', label: 'Périmètre', icon: 'shield-outline',
      couleur: colors.s3Color,
      alerte:  status?.s3?.alerte,
      connecte:!!status?.s3,
      lat: latitude  + 0.0008,
      lon: longitude - 0.0005,
      details: [
        { label: 'Mouvement', valeur: status?.s3?.mouvement      ? 'Détecté'    : 'Calme'    },
        { label: 'Clôture',   valeur: status?.s3?.vibration      ? 'Vibration'  : 'Intact'   },
        { label: 'Animaux',   valeur: status?.s3?.animaux_hors_zone ? 'Hors zone' : 'OK'     },
      ],
    },
  ];

  const ouvrirSysteme = (zone) => { setSystemeSelectionne(zone); setModalVisible(true); };

  const getCouleurStatut = (zone) => {
    if (!zone.connecte) return colors.textMuted;
    if (zone.alerte)    return colors.danger;
    return colors.success;
  };

  const systeme = zones.find(z => z.id === systemeSelectionne?.id);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={s.header}>
        <View style={[s.headerIconBox, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '33' }]}>
          <Ionicons name="map-outline" size={22} color={colors.primary} />
        </View>
        <View>
          <Text style={[s.titre,     { color: colors.textPrimary }]}>Carte de la ferme</Text>
          <Text style={[s.sousTitre, { color: colors.textSecondary }]}>Appuyez sur une zone pour les détails</Text>
        </View>
      </View>

      {/* Carte */}
      <View style={s.mapContainer}>
        <MapView
          style={s.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={{ latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
        >
          <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />
          <Circle
            center={{ latitude, longitude }}
            radius={200}
            strokeColor={colors.primary + '88'}
            fillColor={colors.primary + '11'}
            strokeWidth={2}
          />
          {zones.map(zone => (
            <Marker key={zone.id} coordinate={{ latitude: zone.lat, longitude: zone.lon }} onPress={() => ouvrirSysteme(zone)}>
              <View style={[s.markerContainer, { borderColor: getCouleurStatut(zone), backgroundColor: colors.card }]}>
                <Ionicons name={zone.icon} size={18} color={getCouleurStatut(zone)} />
                <Text style={[s.markerId, { color: getCouleurStatut(zone) }]}>{zone.id}</Text>
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Légende */}
        <View style={s.legende}>
          {[
            { color: colors.success, label: 'OK' },
            { color: colors.danger,  label: 'Alerte' },
            { color: colors.textMuted, label: 'Hors-ligne' },
          ].map((item, i) => (
            <View key={i} style={s.legendeItem}>
              <View style={[s.legendeDot, { backgroundColor: item.color }]} />
              <Text style={s.legendeText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Liste zones */}
      <ScrollView
        style={s.listeContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={[s.sectionTitre, { color: colors.textMuted }]}>TOUTES LES ZONES</Text>
        {zones.map(zone => (
          <TouchableOpacity
            key={zone.id}
            style={[s.zoneItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => ouvrirSysteme(zone)}
          >
            <View style={[s.zoneIconBox, { backgroundColor: zone.couleur + '18' }]}>
              <Ionicons name={zone.icon} size={22} color={zone.couleur} />
            </View>
            <View style={s.zoneInfo}>
              <Text style={[s.zoneTitre, { color: colors.textPrimary }]}>{zone.id} — {zone.label}</Text>
              <Text style={[s.zoneDesc,  { color: colors.textSecondary }]}>
                {zone.id === 'S1' ? 'Pesticides, L3alf, carburant, médicaments'
                  : zone.id === 'S2' ? "Canal d'eau, débitmètre, vanne solénoïde"
                  : 'Clôture, PIR, GPS animaux, caméra'}
              </Text>
            </View>
            <View style={[s.statutDot, { backgroundColor: getCouleurStatut(zone) }]} />
          </TouchableOpacity>
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal détails */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity style={[s.modalCard, { backgroundColor: colors.card }]} activeOpacity={1}>
            {systeme && (
              <>
                <View style={s.modalHandleRow}>
                  <View style={[s.modalHandle, { backgroundColor: colors.cardBorder }]} />
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={s.modalHeader}>
                  <View style={[s.modalIconBox, { backgroundColor: systeme.couleur + '18' }]}>
                    <Ionicons name={systeme.icon} size={28} color={systeme.couleur} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.modalTitre, { color: colors.textPrimary }]}>
                      {systeme.id} — {systeme.label}
                    </Text>
                    <View style={[s.modalBadge, {
                      backgroundColor: systeme.alerte ? colors.danger + '22' : colors.success + '22',
                    }]}>
                      <Text style={[s.modalBadgeText, {
                        color: systeme.alerte ? colors.danger : colors.success,
                      }]}>
                        {systeme.alerte ? 'ALERTE' : systeme.connecte ? 'OK' : 'Hors-ligne'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[s.modalDivider, { backgroundColor: colors.cardBorder }]} />

                {systeme.details.map((d, i) => (
                  <View key={i} style={[s.modalRow, { borderBottomColor: colors.cardBorder }]}>
                    <Text style={[s.modalLabel, { color: colors.textSecondary }]}>{d.label}</Text>
                    <Text style={[s.modalVal, {
                      color: d.valeur.includes('Alerte') || d.valeur.includes('Vibration') || d.valeur.includes('Hors zone') || d.valeur.includes('Détecté')
                        ? colors.danger
                        : d.valeur.includes('Normal') || d.valeur.includes('Intact') || d.valeur.includes('Calme') || d.valeur === 'OK'
                        ? colors.success
                        : colors.textPrimary,
                    }]}>{d.valeur}</Text>
                  </View>
                ))}

                <TouchableOpacity
                  style={[s.modalBtn, { borderColor: systeme.couleur }]}
                  onPress={() => {
                    setModalVisible(false);
                    const dest = systeme.id === 'S1' ? 'DetailS1' : systeme.id === 'S2' ? 'DetailS2' : 'DetailS3';
                    navigation.navigate(dest);
                  }}
                >
                  <Text style={[s.modalBtnText, { color: systeme.couleur }]}>Voir détails complets</Text>
                  <Ionicons name="arrow-forward" size={16} color={systeme.couleur} />
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

// ── Styles statiques uniquement ───────────────────────────────────────────────
const s = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56 },
  headerIconBox:{ width: 42, height: 42, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  titre:        { fontSize: 18, fontWeight: 'bold' },
  sousTitre:    { fontSize: 12, marginTop: 2 },

  mapContainer: { height: 300, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  map:          { flex: 1 },
  legende:      { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: 8, flexDirection: 'row', gap: 10 },
  legendeItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendeDot:   { width: 8, height: 8, borderRadius: 4 },
  legendeText:  { color: '#fff', fontSize: 10 },

  markerContainer: { padding: 8, borderRadius: 10, borderWidth: 2, alignItems: 'center', minWidth: 52 },
  markerId:        { fontSize: 10, fontWeight: 'bold', marginTop: 2 },

  listeContainer: { flex: 1, paddingHorizontal: 16, marginTop: 12 },
  sectionTitre:   { fontSize: 11, letterSpacing: 2, fontWeight: 'bold', marginBottom: 10 },
  zoneItem:       { borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1 },
  zoneIconBox:    { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  zoneInfo:       { flex: 1 },
  zoneTitre:      { fontSize: 14, fontWeight: '600' },
  zoneDesc:       { fontSize: 11, marginTop: 2 },
  statutDot:      { width: 10, height: 10, borderRadius: 5 },

  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalHandle:    { width: 40, height: 4, borderRadius: 2 },
  modalHeader:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  modalIconBox:   { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  modalTitre:     { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  modalBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  modalBadgeText: { fontSize: 11, fontWeight: 'bold' },
  modalDivider:   { height: 1, marginBottom: 16 },
  modalRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  modalLabel:     { fontSize: 13 },
  modalVal:       { fontSize: 13, fontWeight: '600' },
  modalBtn:       { marginTop: 20, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  modalBtnText:   { fontWeight: '600', fontSize: 14 },
});
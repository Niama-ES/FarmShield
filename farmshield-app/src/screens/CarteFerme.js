// src/screens/CarteFerme.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getStatus } from '../api/sensors';
import colors from '../theme/colors';

export default function CarteFerme() {
  const { token } = useAuth();
  const [status, setStatus] = useState(null);
  const [selected, setSelected] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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

  const getStatutColor = (systeme) => {
    const s = status?.[systeme.toLowerCase()];
    if (!s) return colors.textMuted;
    if (s.alerte) return colors.danger;
    return colors.success;
  };

  const zones = [
    {
      id: 'S1',
      label: 'Stockage',
      icone: '📦',
      description: 'Pesticides, L3alf, carburant, médicaments',
      couleur: colors.s1Color,
      position: { top: '20%', left: '15%' },
    },
    {
      id: 'S2',
      label: 'Irrigation',
      icone: '💧',
      description: 'Canal d\'eau, débitmètre, vanne solénoïde',
      couleur: colors.s2Color,
      position: { top: '50%', left: '45%' },
    },
    {
      id: 'S3',
      label: 'Périmètre',
      icone: '🔒',
      description: 'Clôture, PIR, GPS animaux, caméra',
      couleur: colors.s3Color,
      position: { top: '25%', right: '10%' },
    },
  ];

  const zoneSelectionnee = zones.find(z => z.id === selected);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.titre}>🗺 Carte de la Ferme</Text>
        <Text style={styles.sousTitre}>Appuyez sur une zone pour voir les détails</Text>
      </View>

      {/* Carte visuelle */}
      <View style={styles.carteContainer}>
        {/* Fond ferme */}
        <View style={styles.carte}>
          {/* Bordure ferme */}
          <View style={styles.fermeBordure}>
            <Text style={styles.fermeLabel}>🌿 Périmètre de la ferme</Text>
          </View>

          {/* Zones cliquables */}
          {zones.map(zone => {
            const couleurStatut = getStatutColor(zone.id);
            const estSelectionnee = selected === zone.id;
            return (
              <TouchableOpacity
                key={zone.id}
                style={[
                  styles.zoneBtn,
                  zone.position,
                  { borderColor: estSelectionnee ? zone.couleur : couleurStatut },
                  estSelectionnee && { backgroundColor: zone.couleur + '33' }
                ]}
                onPress={() => setSelected(selected === zone.id ? null : zone.id)}
              >
                <Text style={styles.zoneBtnIcon}>{zone.icone}</Text>
                <Text style={[styles.zoneBtnLabel, { color: zone.couleur }]}>{zone.id}</Text>
                <View style={[styles.statutDot, { backgroundColor: couleurStatut }]} />
              </TouchableOpacity>
            );
          })}

          {/* Légende statuts */}
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
      </View>

      {/* Détail zone sélectionnée */}
      {zoneSelectionnee && (
        <View style={[styles.detailCard, { borderTopColor: zoneSelectionnee.couleur }]}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailIcon}>{zoneSelectionnee.icone}</Text>
            <View>
              <Text style={styles.detailTitre}>{zoneSelectionnee.id} — {zoneSelectionnee.label}</Text>
              <Text style={styles.detailDesc}>{zoneSelectionnee.description}</Text>
            </View>
          </View>

          {/* Statut temps réel */}
          <View style={styles.detailStatuts}>
            {zoneSelectionnee.id === 'S1' && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Poids</Text>
                  <Text style={[styles.detailVal, { color: colors.s1Color }]}>
                    {status?.s1?.poids_kg ?? '—'} kg
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Statut</Text>
                  <Text style={[styles.detailVal, { color: status?.s1?.alerte ? colors.danger : colors.success }]}>
                    {status?.s1?.alerte ? '⚠ ALERTE' : '✓ Normal'}
                  </Text>
                </View>
              </>
            )}
            {zoneSelectionnee.id === 'S2' && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Débit</Text>
                  <Text style={[styles.detailVal, { color: colors.s2Color }]}>
                    {status?.s2?.debit_lpm ?? '—'} L/min
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Vanne</Text>
                  <Text style={[styles.detailVal, { color: status?.s2?.vanne_ouverte ? colors.s2Color : colors.textMuted }]}>
                    {status?.s2?.vanne_ouverte ? '● Ouverte' : '○ Fermée'}
                  </Text>
                </View>
              </>
            )}
            {zoneSelectionnee.id === 'S3' && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mouvement</Text>
                  <Text style={[styles.detailVal, { color: status?.s3?.mouvement ? colors.danger : colors.success }]}>
                    {status?.s3?.mouvement ? '⚡ Détecté' : '✓ Calme'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Clôture</Text>
                  <Text style={[styles.detailVal, { color: status?.s3?.vibration ? colors.danger : colors.success }]}>
                    {status?.s3?.vibration ? '⚠ Vibration' : '✓ Intact'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Liste des 3 zones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>TOUTES LES ZONES</Text>
        {zones.map(zone => (
          <TouchableOpacity
            key={zone.id}
            style={styles.zoneListItem}
            onPress={() => setSelected(zone.id)}
          >
            <Text style={styles.zoneListIcon}>{zone.icone}</Text>
            <View style={styles.zoneListInfo}>
              <Text style={styles.zoneListTitre}>{zone.id} — {zone.label}</Text>
              <Text style={styles.zoneListDesc}>{zone.description}</Text>
            </View>
            <View style={[styles.statutDot, { backgroundColor: getStatutColor(zone.id) }]} />
          </TouchableOpacity>
        ))}
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
  carteContainer: { marginHorizontal: 16, marginBottom: 16 },
  carte: {
    height: 280, backgroundColor: '#0a1a0a',
    borderRadius: 16, borderWidth: 1,
    borderColor: colors.primary + '44',
    position: 'relative', overflow: 'hidden',
  },
  fermeBordure: {
    position: 'absolute', top: 8, left: 8, right: 8, bottom: 8,
    borderWidth: 1, borderColor: colors.primary + '33',
    borderRadius: 12, borderStyle: 'dashed',
    justifyContent: 'flex-end', padding: 8,
  },
  fermeLabel: { color: colors.primary + '66', fontSize: 10 },
  zoneBtn: {
    position: 'absolute',
    width: 70, height: 70,
    borderRadius: 12, borderWidth: 2,
    backgroundColor: colors.card,
    justifyContent: 'center', alignItems: 'center',
    gap: 2,
  },
  zoneBtnIcon: { fontSize: 24 },
  zoneBtnLabel: { fontSize: 10, fontWeight: 'bold' },
  statutDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', top: 6, right: 6 },
  legende: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', gap: 10,
  },
  legendeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendeDot: { width: 6, height: 6, borderRadius: 3 },
  legendeText: { color: colors.textMuted, fontSize: 9 },
  detailCard: {
    backgroundColor: colors.card, borderRadius: 12,
    margin: 16, marginTop: 0, padding: 16,
    borderTopWidth: 3, borderWidth: 1, borderColor: colors.cardBorder,
  },
  detailHeader: { flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'center' },
  detailIcon: { fontSize: 32 },
  detailTitre: { color: colors.textPrimary, fontSize: 15, fontWeight: 'bold' },
  detailDesc: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  detailStatuts: {},
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  detailLabel: { color: colors.textSecondary, fontSize: 13 },
  detailVal: { fontSize: 13, fontWeight: '600' },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitre: {
    color: colors.textMuted, fontSize: 11,
    letterSpacing: 2, fontWeight: 'bold', marginBottom: 8,
  },
  zoneListItem: {
    backgroundColor: colors.card, borderRadius: 12,
    padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    gap: 12, borderWidth: 1, borderColor: colors.cardBorder,
  },
  zoneListIcon: { fontSize: 28 },
  zoneListInfo: { flex: 1 },
  zoneListTitre: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  zoneListDesc: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
});
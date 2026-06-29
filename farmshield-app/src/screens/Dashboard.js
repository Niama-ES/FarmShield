// src/screens/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Modal, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getStatus } from '../api/sensors';
import { getAlertes } from '../api/alerts';

const { width } = Dimensions.get('window');
const ALERT_COLOR = '#E74C3C';

const SS_ICON = {
  S1: 'cube-outline',
  S2: 'water-outline',
  S3: 'shield-outline',
};

// Per-zone accent colors for the two-tone card design
const ZONE_COLORS = {
  S1: { accent: '#FAC775', topBg: '#1A3020', iconBg: 'rgba(250,199,117,0.2)' },
  S2: { accent: '#5DCAA5', topBg: '#122A1E', iconBg: 'rgba(93,202,165,0.2)'  },
  S3: { accent: '#AFA9EC', topBg: '#1C1A38', iconBg: 'rgba(175,169,236,0.22)'},
};

export default function Dashboard({ navigation }) {
  const { colors, isDark }      = useTheme();
  const { token, user }         = useAuth();
  const [status,     setStatus]     = useState(null);
  const [alertes,    setAlertes]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible,       setModalVisible]       = useState(false);
  const [systemeSelectionne, setSystemeSelectionne] = useState(null);

  // ── Hero is now much darker (#071A0E), shelf unchanged
  const HERO_DARK  = isDark ? '#050F08' : '#071A0E';
  const HERO_MID   = isDark ? '#163320' : '#2D6A4F';
  const CARD_BG    = isDark ? '#111811' : '#FFFFFF';
  const BG         = isDark ? '#0A0F0A' : '#F0F7F2';
  const ACCENT     = colors.primary;

  const charger = async () => {
    try {
      const [s, a] = await Promise.all([getStatus(token), getAlertes(token)]);
      setStatus(s);
      setAlertes((Array.isArray(a) ? a : a.alertes || []).slice(0, 4));
    } catch (e) { console.log('Erreur dashboard:', e); }
    finally     { setLoading(false); }
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

  const ouvrirSysteme = (systeme) => { setSystemeSelectionne(systeme); setModalVisible(true); };

  const toutOk = !status?.s1?.alerte && !status?.s2?.alerte && !status?.s3?.alerte;

  const zones = [
    {
      id: 'S1', label: 'Stockage', icon: 'cube-outline',
      couleur: colors.s1Color,
      alerte:  status?.s1?.alerte,
      connecte:!!status?.s1,
      details: [
        { label: 'Poids',        valeur: `${status?.s1?.poids_kg ?? '—'} kg` },
        { label: 'Dernier accès',valeur: status?.s1?.dernier_acces ?? '—' },
        { label: 'Statut',       valeur: status?.s1?.alerte ? 'Alerte vol' : 'Normal' },
      ],
    },
    {
      id: 'S2', label: 'Irrigation', icon: 'water-outline',
      couleur: colors.s2Color,
      alerte:  status?.s2?.alerte,
      connecte:!!status?.s2,
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
      details: [
        { label: 'Mouvement', valeur: status?.s3?.mouvement         ? 'Détecté'    : 'Calme'       },
        { label: 'Clôture',   valeur: status?.s3?.vibration         ? 'Vibration'  : 'Intact'      },
        { label: 'Animaux',   valeur: status?.s3?.animaux_hors_zone ? 'Hors zone'  : 'En sécurité' },
      ],
    },
  ];

  const systeme = zones.find(z => z.id === systemeSelectionne?.id);

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        showsVerticalScrollIndicator={false}
      >

        {/* ══════════════════════════════════════════════════════════════════════
            HERO — near-black forest green with decorative circle detail
        ══════════════════════════════════════════════════════════════════════ */}
        <View style={[s.hero, { backgroundColor: HERO_DARK }]}>

          {/* Decorative circles top-right */}
          <View style={s.heroDeco1} />
          <View style={s.heroDeco2} />

          {/* Header: greeting left, leaf icon right */}
          <View style={s.heroNav}>
            <View>
              <Text style={s.heroGreeting}>Bonjour</Text>
              <Text style={s.heroFarmName}>{user?.nom_ferme || 'Ma Ferme'}</Text>
            </View>
            <View style={[s.logoCircle, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.18)' }]}>
              <Ionicons name="leaf-outline" size={24} color="#fff" />
            </View>
          </View>

          {/* Status banner */}
          <View style={[s.statutGlobal, {
            backgroundColor: toutOk ? 'rgba(105,219,124,0.12)' : 'rgba(231,76,60,0.2)',
            borderColor: toutOk ? 'rgba(105,219,124,0.25)' : 'rgba(231,76,60,0.45)',
          }]}>
            <View style={[s.statutIcone, { backgroundColor: toutOk ? 'rgba(105,219,124,0.18)' : 'rgba(231,76,60,0.25)' }]}>
              <Ionicons
                name={toutOk ? 'shield-checkmark-outline' : 'warning-outline'}
                size={22}
                color={toutOk ? '#69DB7C' : ALERT_COLOR}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.statutTitre, { color: toutOk ? '#69DB7C' : ALERT_COLOR }]}>
                {toutOk ? 'Ferme sécurisée' : 'Alerte en cours'}
              </Text>
              <Text style={s.statutSub}>
                {toutOk ? 'Tout est sous contrôle' : 'Vérifiez les zones en alerte'}
              </Text>
            </View>
            {/* Three-dot decoration on the right */}
            <View style={s.statutDots}>
              <View style={s.statutDot} />
              <View style={s.statutDot} />
              <View style={s.statutDot} />
            </View>
          </View>

          {/* Curved bottom into the shelf */}
          <View style={[s.heroCurve, { backgroundColor: HERO_MID }]} />
        </View>

        {/* ══════════════════════════════════════════════════════════════════════
            CARD SHELF — medium green, two-tone zone cards
        ══════════════════════════════════════════════════════════════════════ */}
        <View style={[s.shelf, { backgroundColor: HERO_MID }]}>
          <Text style={s.shelfLabel}>ZONES ACTIVES</Text>

          <View style={s.zonesRow}>
            {zones.map(zone => {
              const zc        = ZONE_COLORS[zone.id];
              const statColor = zone.alerte ? ALERT_COLOR : zone.connecte ? '#69DB7C' : 'rgba(255,255,255,0.35)';
              const topBg     = zone.alerte ? 'rgba(231,76,60,0.25)' : zc.topBg;
              const cardBorder= zone.alerte ? 'rgba(231,76,60,0.4)' : 'rgba(255,255,255,0.18)';

              return (
                <TouchableOpacity
                  key={zone.id}
                  style={[s.zoneCard, { borderColor: cardBorder }]}
                  onPress={() => ouvrirSysteme(zone)}
                  activeOpacity={0.8}
                >
                  {/* Colored top section with icon */}
                  <View style={[s.zoneCardTop, { backgroundColor: topBg }]}>
                    <View style={[s.zoneIconWrap, { backgroundColor: zone.alerte ? 'rgba(231,76,60,0.25)' : zc.iconBg }]}>
                      <Ionicons name={zone.icon} size={20} color={zone.alerte ? ALERT_COLOR : zc.accent} />
                    </View>
                  </View>

                  {/* Card body */}
                  <View style={s.zoneCardBody}>
                    {/* ID badge */}
                    <View style={[s.zoneIdBadge, { backgroundColor: (zone.alerte ? ALERT_COLOR : zc.accent) + '28' }]}>
                      <Text style={[s.zoneIdTxt, { color: zone.alerte ? ALERT_COLOR : zc.accent }]}>{zone.id}</Text>
                    </View>

                    <Text style={s.zoneLabel}>{zone.label}</Text>
                    <Text style={s.zoneSub}>
                      {zone.id === 'S1' ? 'Entrepôt' : zone.id === 'S2' ? 'Système eau' : 'Clôture'}
                    </Text>

                    {/* Status pill */}
                    <View style={[s.zoneStatPill, { backgroundColor: statColor + '22' }]}>
                      <View style={[s.zoneStatDot, { backgroundColor: statColor }]} />
                      <Text style={[s.zoneStatTxt, { color: statColor }]}>
                        {zone.alerte ? 'Alerte' : zone.connecte ? 'OK' : 'OFF'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Curve into white body */}
          <View style={[s.shelfCurve, { backgroundColor: BG }]} />
        </View>

        {/* ══════════════════════════════════════════════════════════════════════
            BODY — light background, alerts + weather
        ══════════════════════════════════════════════════════════════════════ */}
        <View style={[s.body, { backgroundColor: BG }]}>

          {/* ── Alertes récentes ────────────────────────────────────────────── */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Alertes récentes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Alertes')}>
                <Text style={[s.sectionLink, { color: ACCENT }]}>Tout voir</Text>
              </TouchableOpacity>
            </View>

            <View style={[s.alertesCard, { backgroundColor: CARD_BG, borderColor: colors.cardBorder }]}>
              {alertes.length === 0 ? (
                <View style={s.noAlertRow}>
                  <View style={[s.noAlertIcon, { backgroundColor: '#69DB7C22' }]}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#27AE60" />
                  </View>
                  <Text style={[s.noAlertTxt, { color: colors.textSecondary }]}>Aucune alerte récente</Text>
                </View>
              ) : (
                alertes.map((alerte, i) => {
                  const ssColor = alerte.sous_systeme === 'S1' ? colors.s1Color
                    : alerte.sous_systeme === 'S2' ? colors.s2Color : colors.s3Color;
                  const date = new Date(alerte.created_at).toLocaleDateString('fr-FR', {
                    hour: '2-digit', minute: '2-digit',
                  });
                  return (
                    <View
                      key={i}
                      style={[
                        s.alertRow,
                        { borderBottomColor: colors.cardBorder },
                        i === alertes.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={[s.alertIcon, { backgroundColor: ssColor + '18' }]}>
                        <Ionicons name={SS_ICON[alerte.sous_systeme] || 'alert-circle-outline'} size={16} color={ssColor} />
                      </View>
                      <View style={s.alertInfo}>
                        <Text style={[s.alertMsg, { color: colors.textPrimary }]} numberOfLines={1}>
                          {alerte.description || alerte.message}
                        </Text>
                        <Text style={[s.alertDate, { color: colors.textSecondary }]}>
                          {alerte.sous_systeme} · {date}
                        </Text>
                      </View>
                      {!alerte.lu && <View style={[s.unreadDot, { backgroundColor: ALERT_COLOR }]} />}
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {/* ── Météo ───────────────────────────────────────────────────────── */}
          {status?.meteo && (
            <View style={s.section}>
              <View style={[s.meteoCard, { backgroundColor: CARD_BG, borderColor: colors.cardBorder }]}>
                <View style={[s.meteoIconWrap, { backgroundColor: ACCENT + '18' }]}>
                  <Ionicons name="partly-sunny-outline" size={22} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.meteoTemp, { color: colors.textPrimary }]}>
                    {status.meteo.temperature}°C · {status.meteo.description}
                  </Text>
                  {status.meteo.pluie_prevue && (
                    <Text style={[s.meteoPluie, { color: colors.info }]}>
                      Irrigation annulée — pluie prévue
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* ════ MODAL détail zone ════════════════════════════════════════════════ */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity style={[s.modalSheet, { backgroundColor: CARD_BG }]} activeOpacity={1}>
            {systeme && (
              <>
                <View style={s.modalTop}>
                  <View style={[s.modalHandle, { backgroundColor: colors.cardBorder }]} />
                  <TouchableOpacity
                    style={[s.modalCloseBtn, { backgroundColor: isDark ? '#1A2E1A' : '#F0F7F0' }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={s.modalHeader}>
                  <View style={[s.modalIconBox, { backgroundColor: systeme.couleur + '20' }]}>
                    <Ionicons name={systeme.icon} size={26} color={systeme.couleur} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.modalTitle, { color: colors.textPrimary }]}>
                      {systeme.id} — {systeme.label}
                    </Text>
                    <View style={[s.modalBadge, {
                      backgroundColor: systeme.alerte ? ALERT_COLOR + '20' : '#27AE60' + '20',
                    }]}>
                      <Text style={[s.modalBadgeTxt, {
                        color: systeme.alerte ? ALERT_COLOR : '#27AE60',
                      }]}>
                        {systeme.alerte ? '⚠ ALERTE' : '✓ OK'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[s.modalDivider, { backgroundColor: colors.cardBorder }]} />

                {systeme.details.map((d, i) => (
                  <View key={i} style={[s.modalRow, { borderBottomColor: colors.cardBorder }]}>
                    <Text style={[s.modalLabel, { color: colors.textSecondary }]}>{d.label}</Text>
                    <Text style={[s.modalVal, {
                      color: d.valeur.includes('Alerte') || d.valeur.includes('Vibration') || d.valeur.includes('Détecté') || d.valeur.includes('Hors zone')
                        ? ALERT_COLOR
                        : d.valeur.includes('Normal') || d.valeur.includes('Intact') || d.valeur.includes('Calme') || d.valeur.includes('sécurité')
                        ? '#27AE60'
                        : colors.textPrimary,
                    }]}>{d.valeur}</Text>
                  </View>
                ))}

                <TouchableOpacity
                  style={[s.modalBtn, { backgroundColor: systeme.couleur + '15', borderColor: systeme.couleur + '40' }]}
                  onPress={() => {
                    setModalVisible(false);
                    const dest = systeme.id === 'S1' ? 'DetailS1' : systeme.id === 'S2' ? 'DetailS2' : 'DetailS3';
                    navigation.navigate(dest);
                  }}
                >
                  <Text style={[s.modalBtnTxt, { color: systeme.couleur }]}>Voir détails complets</Text>
                  <Ionicons name="arrow-forward" size={15} color={systeme.couleur} />
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  // ── Hero (near-black forest green) ────────────────────────────────────────
  hero: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 48,
    position: 'relative',
    overflow: 'hidden',
  },

  // Decorative circles top-right corner
  heroDeco1: {
    position: 'absolute', top: -28, right: -28,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  heroDeco2: {
    position: 'absolute', top: -10, right: -14,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(64,145,108,0.12)',
  },

  heroNav: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
    zIndex: 1,
  },
  heroGreeting: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 2 },
  heroFarmName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  logoCircle:   { width: 44, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1 },

  statutGlobal: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, borderWidth: 1, zIndex: 1 },
  statutIcone:  { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  statutTitre:  { fontSize: 15, fontWeight: 'bold' },
  statutSub:    { fontSize: 12, marginTop: 2, color: 'rgba(255,255,255,0.55)' },

  // Three-dot decoration inside status banner
  statutDots:   { flexDirection: 'column', gap: 4, opacity: 0.35 },
  statutDot:    { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },

  heroCurve: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 32, borderTopLeftRadius: 32, borderTopRightRadius: 32,
  },

  // ── Shelf (medium green, two-tone zone cards) ──────────────────────────────
  shelf: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 52,
    position: 'relative',
  },
  shelfLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 9, fontWeight: '700', letterSpacing: 2.5,
    marginBottom: 12,
  },
  zonesRow: { flexDirection: 'row', gap: 9 },

  // Two-tone card: colored top + body below
  zoneCard: {
    flex: 1,
    borderRadius: 18, borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  zoneCardTop: {
    height: 68,
    alignItems: 'center', justifyContent: 'center',
  },
  zoneIconWrap: { width: 40, height: 40, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },

  zoneCardBody: {
    padding: 10,
    paddingBottom: 12,
    gap: 2,
  },
  zoneIdBadge: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 20, alignSelf: 'flex-start',
    marginBottom: 4,
  },
  zoneIdTxt:    { fontSize: 8, fontWeight: '700', letterSpacing: 1.5 },
  zoneLabel:    { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '500' },
  zoneSub:      { color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 1 },

  zoneStatPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, marginTop: 8, alignSelf: 'flex-start' },
  zoneStatDot:  { width: 5, height: 5, borderRadius: 3 },
  zoneStatTxt:  { fontSize: 9, fontWeight: '700' },

  shelfCurve: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 32, borderTopLeftRadius: 32, borderTopRightRadius: 32,
  },

  // ── Body ──────────────────────────────────────────────────────────────────
  body: { paddingTop: 8 },

  section:      { paddingHorizontal: 16, marginBottom: 16 },
  sectionHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  sectionLink:  { fontSize: 13, fontWeight: '600' },

  alertesCard: {
    borderRadius: 20, borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noAlertRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 18 },
  noAlertIcon: { width: 34, height: 34, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  noAlertTxt:  { fontSize: 13, fontWeight: '500' },

  alertRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1 },
  alertIcon:  { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  alertInfo:  { flex: 1 },
  alertMsg:   { fontSize: 13, fontWeight: '600' },
  alertDate:  { fontSize: 11, marginTop: 2 },
  unreadDot:  { width: 8, height: 8, borderRadius: 4 },

  meteoCard:    {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  meteoIconWrap:{ width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  meteoTemp:    { fontSize: 13, fontWeight: '600' },
  meteoPluie:   { fontSize: 11, marginTop: 2 },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet:   { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 44 },
  modalTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  modalHandle:  { width: 36, height: 4, borderRadius: 2 },
  modalCloseBtn:{ width: 28, height: 28, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  modalHeader:  { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  modalIconBox: { width: 52, height: 52, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  modalTitle:   { fontSize: 17, fontWeight: '800', marginBottom: 6, letterSpacing: -0.3 },
  modalBadge:   { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  modalBadgeTxt:{ fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  modalDivider: { height: 1, marginBottom: 8 },
  modalRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  modalLabel:   { fontSize: 13 },
  modalVal:     { fontSize: 13, fontWeight: '700' },
  modalBtn:     { marginTop: 22, padding: 16, borderRadius: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  modalBtnTxt:  { fontWeight: '700', fontSize: 14 },
});
// src/screens/DetailS2.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Alert, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getStatus, getHistory } from '../api/sensors';
import { actionVanne } from '../api/control';

const S2_COLOR = '#3498DB';

export default function DetailS2({ navigation }) {
  const { colors }       = useTheme();
  const { token }        = useAuth();
  const [status,         setStatus]       = useState(null);
  const [history,        setHistory]      = useState([]);
  const [refreshing,     setRefreshing]   = useState(false);
  const [vanneOuverte,   setVanneOuverte] = useState(false);

  const charger = async () => {
    try {
      const [s, h] = await Promise.all([getStatus(token), getHistory(token, 'S2')]);
      setStatus(s?.s2 || null);
      setHistory(h?.historique || []);
      setVanneOuverte(s?.s2?.vanne_ouverte || false);
    } catch (e) { console.log('Erreur S2:', e); }
  };

  useEffect(() => { charger(); }, []);
  const onRefresh = useCallback(async () => {
    setRefreshing(true); await charger(); setRefreshing(false);
  }, []);

  const handleVanne = async () => {
    const action = vanneOuverte ? 'fermer' : 'ouvrir';
    Alert.alert('Confirmation', `${action} la vanne ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: async () => {
        try { await actionVanne(token, action); setVanneOuverte(!vanneOuverte); }
        catch { Alert.alert('Erreur', 'Action échouée.'); }
      }},
    ]);
  };

  const alerte   = status?.alerte;
  const connecte = !!status;

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={S2_COLOR} />}
    >
      {/* ── Hero avec image ── */}
      <ImageBackground
        source={require('../../assets/images/s2_irrigation.jpg')}
        style={s.hero}
        resizeMode="cover"
      >
        <View style={s.heroOverlay} />

        <TouchableOpacity onPress={() => navigation.goBack()} style={s.retourBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={s.heroContent}>
          <View style={s.heroIconBox}>
            <Ionicons name="water-outline" size={40} color="#fff" />
          </View>
          <Text style={s.heroTitre}>Eau & Irrigation</Text>
          <Text style={s.heroSub}>S2 · YF-S201 + Vanne solénoïde</Text>
          <View style={[s.heroStatut, {
            backgroundColor: alerte ? 'rgba(224,92,106,0.4)' : connecte ? 'rgba(46,204,113,0.3)' : 'rgba(255,255,255,0.15)',
          }]}>
            <View style={[s.heroStatutDot, { backgroundColor: alerte ? '#E05C6A' : connecte ? '#2ECC71' : '#888' }]} />
            <Text style={s.heroStatutText}>{alerte ? 'ANOMALIE DÉTECTÉE' : connecte ? 'NORMAL' : 'HORS-LIGNE'}</Text>
          </View>
        </View>
      </ImageBackground>

      {/* ── Stats ── */}
      <View style={[s.statsRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {[
          { icon: 'speedometer-outline', label: 'Débit',       val: status?.debit_lpm   ? `${status.debit_lpm} L/min` : '—' },
          { icon: 'flask-outline',       label: 'Vol./jour',   val: status?.volume_jour ? `${status.volume_jour} L`   : '—' },
          { icon: 'toggle-outline',      label: 'Vanne',       val: vanneOuverte ? 'Ouverte' : 'Fermée' },
        ].map((item, i) => (
          <View key={i} style={[s.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: colors.cardBorder }]}>
            <Ionicons name={item.icon} size={18} color={S2_COLOR} />
            <Text style={[s.statVal,   { color: colors.textPrimary }]}>{item.val}</Text>
            <Text style={[s.statLabel, { color: colors.textMuted }]}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Capteurs ── */}
      <View style={s.section}>
        <Text style={[s.sectionTitre, { color: colors.textMuted }]}>CAPTEURS EN TEMPS RÉEL</Text>
        {[
          { icon: 'speedometer-outline', label: 'Débit actuel',              val: status?.debit_lpm   ? `${status.debit_lpm} L/min` : '—', desc: 'Débitmètre YF-S201' },
          { icon: 'flask-outline',       label: "Volume consommé aujourd'hui", val: status?.volume_jour ? `${status.volume_jour} L`   : '—', desc: 'Cumul journalier' },
        ].map((item, i) => (
          <View key={i} style={[s.sensorCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[s.sensorAccent, { backgroundColor: S2_COLOR }]} />
            <View style={[s.sensorIconBox, { backgroundColor: S2_COLOR + '18' }]}>
              <Ionicons name={item.icon} size={22} color={S2_COLOR} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.sensorLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              <Text style={[s.sensorVal,   { color: colors.textPrimary }]}>{item.val}</Text>
              <Text style={[s.sensorDesc,  { color: colors.textMuted }]}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Contrôle vanne ── */}
      <View style={s.section}>
        <Text style={[s.sectionTitre, { color: colors.textMuted }]}>CONTRÔLE VANNE</Text>
        <View style={[s.vanneCard, {
          backgroundColor: vanneOuverte ? S2_COLOR + '12' : colors.card,
          borderColor:     vanneOuverte ? S2_COLOR + '55' : colors.cardBorder,
        }]}>
          <View style={s.vanneLeft}>
            <View style={[s.vanneIconBox, { backgroundColor: vanneOuverte ? S2_COLOR + '22' : colors.cardBorder }]}>
              <Ionicons name="water-outline" size={24} color={vanneOuverte ? S2_COLOR : colors.textMuted} />
            </View>
            <View>
              <Text style={[s.vanneTitre, { color: colors.textPrimary }]}>Électrovanne solénoïde</Text>
              <View style={s.vanneStatutRow}>
                <View style={[s.vanneStatutDot, { backgroundColor: vanneOuverte ? S2_COLOR : colors.textMuted }]} />
                <Text style={[s.vanneStatutText, { color: vanneOuverte ? S2_COLOR : colors.textMuted }]}>
                  {vanneOuverte ? 'Ouverte' : 'Fermée'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[s.vanneBtn, { backgroundColor: vanneOuverte ? '#E05C6A' : S2_COLOR }]}
            onPress={handleVanne}
          >
            <Ionicons name={vanneOuverte ? 'stop-circle-outline' : 'play-circle-outline'} size={16} color="#fff" />
            <Text style={s.vanneBtnText}>{vanneOuverte ? 'Fermer' : 'Ouvrir'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Historique ── */}
      <View style={s.section}>
        <Text style={[s.sectionTitre, { color: colors.textMuted }]}>HISTORIQUE DÉBIT</Text>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {history.length === 0 ? (
            <View style={s.emptyRow}>
              <Ionicons name="time-outline" size={20} color={colors.textMuted} />
              <Text style={[s.emptyText, { color: colors.textMuted }]}>Aucune mesure enregistrée</Text>
            </View>
          ) : history.slice(0, 8).map((h, i) => (
            <View key={i} style={[s.histRow, i < Math.min(history.length, 8) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.cardBorder }]}>
              <Text style={[s.histDate, { color: colors.textSecondary }]}>
                {new Date(h.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={[s.histValText, { color: S2_COLOR }]}>{h.debit_lpm} L/min</Text>
              {h.alerte && <Ionicons name="warning-outline" size={14} color={colors.danger} />}
            </View>
          ))}
        </View>
      </View>

      {/* ── Explication ── */}
      <View style={s.section}>
        <Text style={[s.sectionTitre, { color: colors.textMuted }]}>COMMENT ÇA MARCHE</Text>
        <View style={[s.explicationCard, { backgroundColor: S2_COLOR + '12', borderColor: S2_COLOR + '33' }]}>
          <Ionicons name="information-circle-outline" size={20} color={S2_COLOR} style={{ marginTop: 2 }} />
          <Text style={[s.explicationText, { color: colors.textSecondary }]}>
            Le débitmètre YF-S201 compte les litres qui passent dans le canal. Si le débit chute brusquement sans programme d'irrigation actif → branchement illégal détecté → vanne fermée automatiquement.
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1 },
  hero:        { height: 320, justifyContent: 'space-between', paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  retourBtn:   { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  heroContent: { alignItems: 'center', gap: 6 },
  heroIconBox: { width: 72, height: 72, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  heroTitre:   { color: '#fff', fontSize: 24, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroSub:     { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  heroStatut:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginTop: 6 },
  heroStatutDot:  { width: 6, height: 6, borderRadius: 3 },
  heroStatutText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  statsRow:  { flexDirection: 'row', marginHorizontal: 16, borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 20, marginTop: -20 },
  statItem:  { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4 },
  statVal:   { fontSize: 14, fontWeight: '700' },
  statLabel: { fontSize: 10, letterSpacing: 0.5 },

  section:      { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitre: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },

  sensorCard:    { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, overflow: 'hidden' },
  sensorAccent:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  sensorIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sensorLabel:   { fontSize: 11, marginBottom: 2 },
  sensorVal:     { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  sensorDesc:    { fontSize: 10 },

  vanneCard:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, padding: 14, borderWidth: 1 },
  vanneLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vanneIconBox:   { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  vanneTitre:     { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  vanneStatutRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  vanneStatutDot: { width: 6, height: 6, borderRadius: 3 },
  vanneStatutText:{ fontSize: 12, fontWeight: '600' },
  vanneBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  vanneBtnText:   { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  card:        { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  histRow:     { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  histDate:    { flex: 1, fontSize: 11 },
  histValText: { fontSize: 14, fontWeight: '600' },
  emptyRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, justifyContent: 'center' },
  emptyText:   { fontSize: 13 },

  explicationCard: { flexDirection: 'row', gap: 10, borderRadius: 14, padding: 14, borderWidth: 1 },
  explicationText: { flex: 1, fontSize: 13, lineHeight: 20 },
}); 

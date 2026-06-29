// src/screens/DetailS3.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getStatus, getHistory } from '../api/sensors';

const S3_COLOR = '#2ECC71';

export default function DetailS3({ navigation }) {
  const { colors }     = useTheme();
  const { token }      = useAuth();
  const [status,       setStatus]     = useState(null);
  const [history,      setHistory]    = useState([]);
  const [refreshing,   setRefreshing] = useState(false);

  const charger = async () => {
    try {
      const [s, h] = await Promise.all([getStatus(token), getHistory(token, 'S3')]);
      setStatus(s?.s3 || null);
      setHistory(h?.historique || []);
    } catch (e) { console.log('Erreur S3:', e); }
  };

  useEffect(() => { charger(); }, []);
  const onRefresh = useCallback(async () => {
    setRefreshing(true); await charger(); setRefreshing(false);
  }, []);

  const alerte   = status?.alerte;
  const connecte = !!status;

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={S3_COLOR} />}
    >
      {/* ── Hero avec image ── */}
      <ImageBackground
        source={require('../../assets/images/s3_perimetre.jpg')}
        style={s.hero}
        resizeMode="cover"
      >
        <View style={s.heroOverlay} />

        <TouchableOpacity onPress={() => navigation.goBack()} style={s.retourBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={s.heroContent}>
          <View style={s.heroIconBox}>
            <Ionicons name="shield-outline" size={40} color="#fff" />
          </View>
          <Text style={s.heroTitre}>Périmètre & Bétail</Text>
          <Text style={s.heroSub}>S3 · PIR + GPS + Caméra IR</Text>
          <View style={[s.heroStatut, {
            backgroundColor: alerte ? 'rgba(224,92,106,0.4)' : connecte ? 'rgba(46,204,113,0.3)' : 'rgba(255,255,255,0.15)',
          }]}>
            <View style={[s.heroStatutDot, { backgroundColor: alerte ? '#E05C6A' : connecte ? '#2ECC71' : '#888' }]} />
            <Text style={s.heroStatutText}>{alerte ? 'INTRUSION DÉTECTÉE' : connecte ? 'SURVEILLANCE ACTIVE' : 'HORS-LIGNE'}</Text>
          </View>
        </View>
      </ImageBackground>

      {/* ── Stats ── */}
      <View style={[s.statsRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {[
          { icon: 'body-outline',     label: 'Mouvement', val: status?.mouvement         ? 'Détecté'   : 'Calme'   },
          { icon: 'cellular-outline', label: 'Clôture',   val: status?.vibration         ? 'Vibration' : 'Intact'  },
          { icon: 'paw-outline',      label: 'Animaux',   val: status?.animaux_hors_zone ? 'Hors zone' : 'OK'      },
        ].map((item, i) => (
          <View key={i} style={[s.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: colors.cardBorder }]}>
            <Ionicons name={item.icon} size={18} color={S3_COLOR} />
            <Text style={[s.statVal,   { color: colors.textPrimary }]}>{item.val}</Text>
            <Text style={[s.statLabel, { color: colors.textMuted }]}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Capteurs ── */}
      <View style={s.section}>
        <Text style={[s.sectionTitre, { color: colors.textMuted }]}>CAPTEURS EN TEMPS RÉEL</Text>
        {[
          { icon: 'body-outline',     label: 'Détecteur PIR',           val: status?.mouvement ? 'Mouvement détecté' : 'Calme',            desc: 'PIR HC-SR501 — entrée principale', alert: status?.mouvement },
          { icon: 'cellular-outline', label: 'Capteur vibration clôture',val: status?.vibration ? 'Vibration détectée' : 'Normal',          desc: 'SW-420 — clôture périmètre',       alert: status?.vibration },
        ].map((item, i) => (
          <View key={i} style={[s.sensorCard, { backgroundColor: colors.card, borderColor: item.alert ? '#E05C6A55' : colors.cardBorder }]}>
            <View style={[s.sensorAccent, { backgroundColor: item.alert ? '#E05C6A' : S3_COLOR }]} />
            <View style={[s.sensorIconBox, { backgroundColor: item.alert ? '#E05C6A18' : S3_COLOR + '18' }]}>
              <Ionicons name={item.icon} size={22} color={item.alert ? '#E05C6A' : S3_COLOR} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.sensorLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              <Text style={[s.sensorVal,   { color: item.alert ? '#E05C6A' : colors.textPrimary }]}>{item.val}</Text>
              <Text style={[s.sensorDesc,  { color: colors.textMuted }]}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── GPS Animaux ── */}
      <View style={s.section}>
        <Text style={[s.sectionTitre, { color: colors.textMuted }]}>GPS COLLIERS ANIMAUX</Text>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {status?.animaux && status.animaux.length > 0 ? (
            status.animaux.map((animal, i) => (
              <View key={i} style={[s.animalRow, i < status.animaux.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.cardBorder }]}>
                <View style={[s.animalIconBox, { backgroundColor: animal.hors_zone ? '#E05C6A18' : S3_COLOR + '18' }]}>
                  <Ionicons name="paw-outline" size={20} color={animal.hors_zone ? '#E05C6A' : S3_COLOR} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.animalNom, { color: colors.textPrimary }]}>{animal.nom}</Text>
                  <Text style={[s.animalPos, { color: colors.textMuted }]}>
                    {animal.lat?.toFixed(4)}, {animal.lon?.toFixed(4)}
                  </Text>
                </View>
                <View style={[s.animalBadge, { backgroundColor: animal.hors_zone ? '#E05C6A22' : S3_COLOR + '22' }]}>
                  <Text style={[s.animalBadgeText, { color: animal.hors_zone ? '#E05C6A' : S3_COLOR }]}>
                    {animal.hors_zone ? 'Hors zone' : 'OK'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={s.emptyRow}>
              <Ionicons name="paw-outline" size={20} color={colors.textMuted} />
              <Text style={[s.emptyText, { color: colors.textMuted }]}>
                {status ? 'Aucun collier GPS connecté' : 'Hors-ligne'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Historique ── */}
      <View style={s.section}>
        <Text style={[s.sectionTitre, { color: colors.textMuted }]}>HISTORIQUE DÉTECTIONS</Text>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {history.length === 0 ? (
            <View style={s.emptyRow}>
              <Ionicons name="time-outline" size={20} color={colors.textMuted} />
              <Text style={[s.emptyText, { color: colors.textMuted }]}>Aucune détection enregistrée</Text>
            </View>
          ) : history.slice(0, 8).map((h, i) => (
            <View key={i} style={[s.histRow, i < Math.min(history.length, 8) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.cardBorder }]}>
              <Text style={[s.histDate, { color: colors.textSecondary }]}>
                {new Date(h.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={[s.histValText, { color: h.mouvement ? '#E05C6A' : S3_COLOR }]}>
                {h.mouvement ? 'Mouvement' : 'Calme'}
              </Text>
              {h.alerte && <Ionicons name="warning-outline" size={14} color={colors.danger} />}
            </View>
          ))}
        </View>
      </View>

      {/* ── Explication ── */}
      <View style={s.section}>
        <Text style={[s.sectionTitre, { color: colors.textMuted }]}>COMMENT ÇA MARCHE</Text>
        <View style={[s.explicationCard, { backgroundColor: S3_COLOR + '12', borderColor: S3_COLOR + '33' }]}>
          <Ionicons name="information-circle-outline" size={20} color={S3_COLOR} style={{ marginTop: 2 }} />
          <Text style={[s.explicationText, { color: colors.textSecondary }]}>
            Le PIR détecte la chaleur corporelle humaine même la nuit. La vibration SW-420 détecte toute tentative de couper ou escalader la clôture. Les colliers GPS alertent si un animal sort de la géo-clôture virtuelle.
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
  statVal:   { fontSize: 13, fontWeight: '700' },
  statLabel: { fontSize: 10, letterSpacing: 0.5 },

  section:      { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitre: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },

  sensorCard:    { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, overflow: 'hidden' },
  sensorAccent:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  sensorIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sensorLabel:   { fontSize: 11, marginBottom: 2 },
  sensorVal:     { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  sensorDesc:    { fontSize: 10 },

  card:          { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  animalRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  animalIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  animalNom:     { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  animalPos:     { fontSize: 11 },
  animalBadge:   { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  animalBadgeText: { fontSize: 11, fontWeight: '700' },

  histRow:     { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  histDate:    { flex: 1, fontSize: 11 },
  histValText: { fontSize: 13, fontWeight: '600' },
  emptyRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, justifyContent: 'center' },
  emptyText:   { fontSize: 13 },

  explicationCard: { flexDirection: 'row', gap: 10, borderRadius: 14, padding: 14, borderWidth: 1 },
  explicationText: { flex: 1, fontSize: 13, lineHeight: 20 },
});

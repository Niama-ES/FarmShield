// src/screens/CameraLive.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Animated, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../api/config';

const ACCENT  = '#00B894';
const ACCENT2 = '#00CEC9';
const POLL_MS = 500;

// ── Badge statut ──────────────────────────────────────────────────────────────
function StatutBadge({ connectee }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (connectee) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.5, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
    return () => pulse.stopAnimation();
  }, [connectee]);

  return (
    <View style={badge.row}>
      <View style={badge.dotWrapper}>
        {connectee && (
          <Animated.View style={[badge.dotPulse, { transform: [{ scale: pulse }] }]} />
        )}
        <View style={[badge.dot, { backgroundColor: connectee ? ACCENT : '#E17055' }]} />
      </View>
      <Text style={[badge.text, { color: connectee ? ACCENT : '#E17055' }]}>
        {connectee ? 'ESP32-CAM en ligne' : 'Caméra hors-ligne'}
      </Text>
    </View>
  );
}

const badge = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dotWrapper: { width: 14, height: 14, justifyContent: 'center', alignItems: 'center' },
  dot:        { width: 8, height: 8, borderRadius: 4, position: 'absolute' },
  dotPulse:   { width: 14, height: 14, borderRadius: 7, backgroundColor: ACCENT + '40', position: 'absolute' },
  text:       { fontSize: 13, fontWeight: '600' },
});

// ── Écran principal ───────────────────────────────────────────────────────────
export default function CameraLive({ navigation }) {
  const { colors }    = useTheme();
  const { token }     = useAuth();

  const [connectee,  setConnectee]  = useState(false);
  const [frame,      setFrame]      = useState(null);
  const [lastSeen,   setLastSeen]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fps,        setFps]        = useState(0);

  const intervalRef = useRef(null);
  const frameCount  = useRef(0);
  const fpsTimer    = useRef(null);

  const fetchFrame = async () => {
    try {
      const res  = await fetch(`${API_BASE_URL}/camera/frame`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.frame) {
        setFrame(data.frame);
        setConnectee(true);
        setLastSeen(new Date());
        frameCount.current += 1;
      } else {
        setConnectee(false);
      }
    } catch {
      setConnectee(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const res  = await fetch(`${API_BASE_URL}/camera/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConnectee(data.connectee || false);
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    fetchFrame();
    intervalRef.current = setInterval(fetchFrame, POLL_MS);
    fpsTimer.current    = setInterval(() => {
      setFps(frameCount.current);
      frameCount.current = 0;
    }, 1000);
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(fpsTimer.current);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatus();
    await fetchFrame();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[s.retourBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          >
            <Ionicons name="arrow-back" size={22} color={ACCENT} />
          </TouchableOpacity>
          <View>
            <Text style={[s.titre, { color: colors.textPrimary }]}>Caméra live</Text>
            <Text style={[s.sousTitre, { color: colors.textSecondary }]}>Entrée principale · ESP32-CAM</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onRefresh} style={s.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color={ACCENT} />
        </TouchableOpacity>
      </View>

      {/* Stream card */}
      <View style={[s.streamCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {loading ? (
          <View style={s.streamPlaceholder}>
            <Ionicons name="sync-outline" size={40} color={colors.textMuted} />
            <Text style={[s.streamPlaceholderText, { color: colors.textSecondary }]}>Connexion…</Text>
          </View>
        ) : frame ? (
          <View style={s.streamWrapper}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${frame}` }}
              style={s.stream}
              resizeMode="cover"
            />
            <View style={s.fpsBadge}>
              <View style={s.fpsDot} />
              <Text style={s.fpsText}>LIVE · {fps} fps</Text>
            </View>
            {lastSeen && (
              <View style={s.timestampBadge}>
                <Text style={s.timestampText}>
                  {lastSeen.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={s.streamPlaceholder}>
            <View style={s.streamIconBox}>
              <Ionicons name="videocam-off-outline" size={48} color="#E17055" />
            </View>
            <Text style={[s.streamPlaceholderText, { color: '#E17055' }]}>Caméra hors-ligne</Text>
            <Text style={[s.streamHint, { color: colors.textMuted }]}>
              Vérifiez que le serveur Flask est actif
            </Text>
          </View>
        )}

        <View style={[s.streamFooter, { borderTopColor: colors.cardBorder }]}>
          <StatutBadge connectee={connectee} />
          {connectee && <Text style={[s.pollInfo, { color: colors.textMuted }]}>Actualisation · {POLL_MS}ms</Text>}
        </View>
      </View>

      {/* Info bannière */}
      <View style={s.infoBanner}>
        <Ionicons name="globe-outline" size={16} color={ACCENT2} />
        <Text style={[s.infoBannerText, { color: colors.textSecondary }]}>
          Le flux passe par le serveur cloud — accessible depuis n'importe quel réseau,
          sans avoir besoin d'être sur le même WiFi que la ferme.
        </Text>
      </View>

      {/* Pipeline IA */}
      <Text style={[s.sectionTitre, { color: colors.textMuted }]}>PIPELINE DE DÉTECTION</Text>
      <View style={[s.pipelineCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {[
          { icon: 'body-outline',        label: 'Modèle 1', desc: 'Humain ou animal',              color: ACCENT   },
          { icon: 'alert-outline',       label: 'Modèle 2', desc: 'Animal dangereux ou inoffensif', color: '#FDCB6E'},
          { icon: 'person-outline',      label: 'Modèle 3', desc: 'Reconnaissance faciale LBPH',    color: ACCENT2  },
          { icon: 'trending-up-outline', label: 'Module 4', desc: 'Analyse comportementale',        color: '#6C5CE7'},
        ].map((item, i) => (
          <View key={i} style={s.pipelineItem}>
            <View style={s.pipelineLeft}>
              <View style={[s.pipelineIconBox, { backgroundColor: item.color + '18' }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              {i < 3 && <View style={[s.pipelineConnector, { backgroundColor: colors.cardBorder }]} />}
            </View>
            <View style={s.pipelineContent}>
              <Text style={[s.pipelineLabel, { color: colors.textPrimary }]}>{item.label}</Text>
              <Text style={[s.pipelineDesc,  { color: colors.textSecondary }]}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── Styles statiques uniquement ───────────────────────────────────────────────
const s = StyleSheet.create({
  container:  { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 56, paddingBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  retourBtn:  { width: 38, height: 38, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  refreshBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: ACCENT + '15', borderWidth: 1, borderColor: ACCENT + '33', justifyContent: 'center', alignItems: 'center' },
  titre:      { fontSize: 18, fontWeight: 'bold' },
  sousTitre:  { fontSize: 12, marginTop: 2 },

  streamCard:    { borderRadius: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, overflow: 'hidden' },
  streamWrapper: { width: '100%', height: 230, position: 'relative' },
  stream:        { width: '100%', height: 230 },

  fpsBadge:      { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#00000088', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  fpsDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E17055' },
  fpsText:       { color: '#fff', fontSize: 11, fontWeight: '700' },
  timestampBadge:{ position: 'absolute', bottom: 10, right: 10, backgroundColor: '#00000088', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  timestampText: { color: '#fff', fontSize: 11, fontWeight: '500' },

  streamPlaceholder:     { height: 230, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050e08', gap: 12 },
  streamIconBox:         { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0d1a10', justifyContent: 'center', alignItems: 'center' },
  streamPlaceholderText: { fontSize: 14, fontWeight: '500' },
  streamHint:            { fontSize: 11 },

  streamFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderTopWidth: 1 },
  pollInfo:      { fontSize: 10 },

  infoBanner:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: ACCENT2 + '11', borderLeftWidth: 3, borderLeftColor: ACCENT2, marginHorizontal: 16, marginBottom: 20, padding: 12, borderRadius: 10 },
  infoBannerText: { fontSize: 12, lineHeight: 18, flex: 1 },

  sectionTitre:      { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, paddingHorizontal: 16, marginBottom: 10 },
  pipelineCard:      { borderRadius: 14, marginHorizontal: 16, marginBottom: 20, borderWidth: 1, padding: 16 },
  pipelineItem:      { flexDirection: 'row', gap: 12, marginBottom: 4 },
  pipelineLeft:      { alignItems: 'center', width: 40 },
  pipelineIconBox:   { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  pipelineConnector: { flex: 1, width: 1.5, marginVertical: 3, minHeight: 12 },
  pipelineContent:   { flex: 1, paddingBottom: 16, paddingTop: 8 },
  pipelineLabel:     { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  pipelineDesc:      { fontSize: 12 },
});
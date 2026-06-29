// src/screens/Alertes.js
import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getAlertes, marquerLu } from '../api/alerts';

const FILTRES     = ['Tous', 'S1', 'S2', 'S3'];
const ALERT_COLOR = '#E05C6A';

const TYPE_CONFIG = {
  intrus:        { icon: 'person-remove-outline', label: 'Intrus détecté'   },
  vol_poids:     { icon: 'scale-outline',         label: 'Vol de stock'     },
  vol_eau:       { icon: 'water-outline',         label: "Vol d'eau"        },
  animal_danger: { icon: 'warning-outline',       label: 'Animal dangereux' },
  stock_bas:     { icon: 'cube-outline',          label: 'Stock bas'        },
  default:       { icon: 'alert-circle-outline',  label: 'Alerte'           },
};

const SS_CONFIG = {
  S1: { color: '#D85A30', bg: '#D85A3018' },
  S2: { color: '#378ADD', bg: '#378ADD18' },
  S3: { color: '#3DB87A', bg: '#3DB87A18' },
};

const getTypeConf = (t) => TYPE_CONFIG[t] || TYPE_CONFIG.default;
const getSsConf   = (s) => SS_CONFIG[s]   || { color: '#888', bg: '#88888818' };

// ── Carte alerte — reçoit colors en prop ─────────────────────────────────────
function AlertCard({ alerte, onMarquerLu, onPress, isLatest, colors }) {
  const { icon }  = getTypeConf(alerte.type_alerte);
  const ssConf    = getSsConf(alerte.sous_systeme);
  const lu        = alerte.lu;

  const dotOpacity = useRef(new Animated.Value(1)).current;
  const cardScale  = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isLatest && !lu) {
      const blink = Animated.loop(Animated.sequence([
        Animated.timing(dotOpacity, { toValue: 0.15, duration: 550, useNativeDriver: true }),
        Animated.timing(dotOpacity, { toValue: 1,    duration: 550, useNativeDriver: true }),
      ]));
      const pulse = Animated.loop(Animated.sequence([
        Animated.timing(cardScale, { toValue: 1.015, duration: 1000, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 1,     duration: 1000, useNativeDriver: true }),
      ]));
      blink.start(); pulse.start();
      return () => { blink.stop(); pulse.stop(); };
    }
  }, [isLatest, lu]);

  const date = new Date(alerte.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  const accentColor = lu ? ALERT_COLOR + '44' : ALERT_COLOR;
  const bgColor     = lu ? ALERT_COLOR + '07' : ALERT_COLOR + '11';
  const borderColor = lu ? ALERT_COLOR + '20' : ALERT_COLOR + '50';
  const iconBg      = lu ? ALERT_COLOR + '0F' : ALERT_COLOR + '1E';
  const titleColor  = lu ? colors.textMuted   : colors.textPrimary;
  const descColor   = lu ? colors.textMuted   : colors.textSecondary;

  return (
    <Animated.View style={{ transform: [{ scale: cardScale }] }}>
      <TouchableOpacity
        style={[s.card, { backgroundColor: bgColor, borderColor }]}
        onPress={() => onPress(alerte)}
        activeOpacity={0.8}
      >
        <View style={[s.stripe, { backgroundColor: accentColor }]} />
        <View style={s.body}>
          <View style={s.topRow}>
            <View style={[s.iconBox, { backgroundColor: iconBg }]}>
              <Ionicons name={icon} size={18} color={accentColor} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.titleRow}>
                <Text style={[s.title, { color: titleColor }]}>
                  {getTypeConf(alerte.type_alerte).label}
                </Text>
                {isLatest && !lu && (
                  <Animated.View style={[s.liveDot, { opacity: dotOpacity }]} />
                )}
              </View>
              <View style={s.metaRow}>
                <View style={[s.ssBadge, { backgroundColor: lu ? ssConf.bg + '66' : ssConf.bg }]}>
                  <Text style={[s.ssText, { color: lu ? ssConf.color + '77' : ssConf.color }]}>
                    {alerte.sous_systeme}
                  </Text>
                </View>
                <Text style={[s.date, { opacity: lu ? 0.4 : 0.65, color: colors.textMuted }]}>{date}</Text>
              </View>
            </View>
            {!lu && <View style={[s.unreadDot, { backgroundColor: ALERT_COLOR }]} />}
          </View>

          <Text style={[s.desc, { color: descColor }]} numberOfLines={2}>
            {alerte.description}
          </Text>

          {!lu && (
            <TouchableOpacity
              style={[s.btnLu, { borderColor: ALERT_COLOR + '40', backgroundColor: ALERT_COLOR + '0F' }]}
              onPress={() => onMarquerLu(alerte.id)}
            >
              <Ionicons name="checkmark-outline" size={13} color={ALERT_COLOR} />
              <Text style={[s.btnLuText, { color: ALERT_COLOR }]}>Marquer comme lu</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────
export default function Alertes({ navigation }) {
  const { colors }  = useTheme();
  const { token }   = useAuth();
  const [alertes,    setAlertes]    = useState([]);
  const [filtre,     setFiltre]     = useState('Tous');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const chargerAlertes = async () => {
    try {
      const data = await getAlertes(token, filtre === 'Tous' ? null : filtre);
      setAlertes(Array.isArray(data) ? data : data.alertes || []);
    } catch (e) { console.log('Erreur alertes:', e); }
    finally     { setLoading(false); }
  };

  useFocusEffect(
    useCallback(() => { chargerAlertes(); }, [filtre])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await chargerAlertes();
    setRefreshing(false);
  }, [filtre]);

  const handleMarquerLu = async (id) => {
    try {
      await marquerLu(token, id);
      setAlertes(prev => prev.map(a => a.id === id ? { ...a, lu: true } : a));
    } catch (e) { console.log('Erreur marquer lu:', e); }
  };

  const nonLues  = alertes.filter(a => !a.lu).length;
  const latestId = alertes.find(a => !a.lu)?.id;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.bellWrap}>
            <Ionicons name="notifications-outline" size={24} color={nonLues > 0 ? ALERT_COLOR : colors.primary} />
            {nonLues > 0 && <View style={[s.bellDot, { borderColor: colors.background }]} />}
          </View>
          <View>
            <Text style={[s.titre, { color: colors.textPrimary }]}>Alertes</Text>
            <Text style={[s.sousTitre, { color: nonLues > 0 ? ALERT_COLOR : colors.textSecondary }]}>
              {nonLues > 0 ? `${nonLues} non lue${nonLues > 1 ? 's' : ''}` : 'Tout est lu'}
            </Text>
          </View>
        </View>
        {nonLues > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countText}>{nonLues}</Text>
          </View>
        )}
      </View>

      {/* Filtres */}
      <View style={s.filtres}>
        {FILTRES.map(f => {
          const ssConf   = getSsConf(f);
          const isActive = filtre === f;
          return (
            <TouchableOpacity
              key={f}
              style={[
                s.filtreBtn,
                { borderColor: colors.cardBorder },
                isActive && f === 'Tous' && { backgroundColor: colors.primary, borderColor: colors.primary },
                isActive && f !== 'Tous' && { backgroundColor: ssConf.color + '22', borderColor: ssConf.color + '66' },
              ]}
              onPress={() => setFiltre(f)}
            >
              <Text style={[
                s.filtreText,
                { color: colors.textSecondary },
                isActive && f === 'Tous' && { color: '#fff', fontWeight: 'bold' },
                isActive && f !== 'Tous' && { color: ssConf.color, fontWeight: '700' },
              ]}>
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[s.separator, { backgroundColor: colors.cardBorder }]} />

      {/* Liste */}
      {loading ? (
        <View style={s.center}>
          <Ionicons name="sync-outline" size={32} color={colors.textMuted} />
          <Text style={[s.loadingText, { color: colors.textSecondary }]}>Chargement…</Text>
        </View>
      ) : alertes.length === 0 ? (
        <View style={s.center}>
          <View style={[s.emptyBox, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="notifications-off-outline" size={44} color={colors.primary} />
          </View>
          <Text style={[s.emptyText, { color: colors.textPrimary }]}>Aucune alerte</Text>
          <Text style={[s.emptySub,  { color: colors.textSecondary }]}>Tout est calme sur la ferme</Text>
        </View>
      ) : (
        <FlatList
          data={alertes}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <AlertCard
              alerte={item}
              onMarquerLu={handleMarquerLu}
              onPress={(a) => navigation.navigate('DetailAlerte', { alerte: a })}
              isLatest={item.id === latestId}
              colors={colors}
            />
          )}
          contentContainerStyle={s.liste}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ALERT_COLOR} />
          }
        />
      )}
    </View>
  );
}

// ── Styles statiques uniquement (pas de colors ici) ───────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 56, paddingBottom: 12,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellWrap:    { position: 'relative', width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  bellDot:     { position: 'absolute', top: 0, right: 0, width: 9, height: 9, borderRadius: 5, backgroundColor: ALERT_COLOR, borderWidth: 1.5 },
  titre:       { fontSize: 20, fontWeight: 'bold' },
  sousTitre:   { fontSize: 12, marginTop: 1 },
  countBadge:  { backgroundColor: ALERT_COLOR, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  countText:   { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  filtres:     { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filtreBtn:   { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filtreText:  { fontSize: 13 },
  separator:   { height: 1, marginHorizontal: 16, marginBottom: 12 },
  liste:       { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyBox:    { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyText:   { fontSize: 16, fontWeight: '600' },
  emptySub:    { fontSize: 13 },
  loadingText: { fontSize: 13, marginTop: 8 },
  card:        { flexDirection: 'row', borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  stripe:      { width: 4 },
  body:        { flex: 1, padding: 14 },
  topRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  iconBox:     { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  titleRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  title:       { fontSize: 14, fontWeight: '700' },
  liveDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: ALERT_COLOR },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ssBadge:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  ssText:      { fontSize: 11, fontWeight: '700' },
  date:        { fontSize: 11 },
  unreadDot:   { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  desc:        { fontSize: 12, lineHeight: 18, marginBottom: 8 },
  btnLu:       { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  btnLuText:   { fontSize: 11, fontWeight: '600' },
});
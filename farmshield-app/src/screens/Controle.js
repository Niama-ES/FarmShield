// src/screens/Controle.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { actionVanne, actionSirene } from '../api/control';

const VANNE_COLOR  = '#00B894';
const SIRENE_COLOR = '#E05C6A';
const WARN_COLOR   = '#F0A500';
const NUIT_COLOR   = '#6C5CE7';

// ── Popup confirmation ────────────────────────────────────────────────────────
function ConfirmPopup({ visible, titre, message, couleur, onConfirm, onCancel }) {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
        Animated.timing(opacAnim,  { toValue: 1, duration: 200,             useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
      opacAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={pop.overlay}>
        <Animated.View style={[pop.card, { transform: [{ scale: scaleAnim }], opacity: opacAnim }]}>
          <View style={[pop.iconCircle, { backgroundColor: couleur + '20' }]}>
            <Ionicons name="alert-circle-outline" size={32} color={couleur} />
          </View>
          <Text style={pop.titre}>{titre}</Text>
          <Text style={pop.message}>{message}</Text>
          <View style={pop.btns}>
            <TouchableOpacity style={pop.btnCancel} onPress={onCancel}>
              <Text style={pop.btnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[pop.btnConfirm, { backgroundColor: couleur }]} onPress={onConfirm}>
              <Text style={pop.btnConfirmText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const pop = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  card:           { backgroundColor: '#121f17', borderRadius: 24, padding: 28, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#1e3028' },
  iconCircle:     { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  titre:          { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  message:        { color: '#8aab96', fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: 24 },
  btns:           { flexDirection: 'row', gap: 12, width: '100%' },
  btnCancel:      { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#1e3028', alignItems: 'center' },
  btnCancelText:  { color: '#8aab96', fontWeight: '600' },
  btnConfirm:     { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  btnConfirmText: { color: '#fff', fontWeight: 'bold' },
});

// ── Carte actionneur ──────────────────────────────────────────────────────────
function ActionCard({ icon, titre, desc, couleur, actif, labelOn, labelOff, onPress, loading, colors }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (actif) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
    return () => pulseAnim.stopAnimation();
  }, [actif]);

  return (
    <TouchableOpacity
      style={[
        cs.actionCard,
        {
          backgroundColor: actif ? couleur + '12' : colors.card,
          borderColor:      actif ? couleur + '55' : colors.cardBorder,
        },
      ]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.82}
    >
      {/* Icône */}
      <View style={cs.cardIconZone}>
        <Animated.View style={[
          cs.cardIconCircle,
          { backgroundColor: actif ? couleur : couleur + '18' },
          actif && { transform: [{ scale: pulseAnim }] },
        ]}>
          <Ionicons name={icon} size={36} color={actif ? '#fff' : couleur} />
        </Animated.View>
      </View>

      {/* Statut pill */}
      <View style={[cs.statutPill, {
        backgroundColor: actif ? couleur + '22' : colors.cardBorder + '80',
        borderColor:     actif ? couleur + '55' : colors.cardBorder,
      }]}>
        <View style={[cs.statutDot, { backgroundColor: actif ? couleur : colors.textMuted }]} />
        <Text style={[cs.statutText, { color: actif ? couleur : colors.textMuted }]}>
          {actif ? labelOn : labelOff}
        </Text>
      </View>

      {/* Textes */}
      <Text style={[cs.cardTitre, { color: colors.textPrimary }]}>{titre}</Text>
      <Text style={[cs.cardDesc,  { color: colors.textSecondary }]}>{desc}</Text>

      {/* Bouton */}
      <View style={[
        cs.actionBtn,
        actif
          ? { backgroundColor: couleur + '18', borderWidth: 1, borderColor: couleur + '44' }
          : { backgroundColor: couleur },
      ]}>
        {loading ? (
          <Text style={[cs.actionBtnText, { color: actif ? couleur : '#fff' }]}>En cours…</Text>
        ) : (
          <>
            <Ionicons
              name={actif ? 'stop-circle-outline' : 'play-circle-outline'}
              size={16} color={actif ? couleur : '#fff'}
            />
            <Text style={[cs.actionBtnText, { color: actif ? couleur : '#fff' }]}>
              {actif ? 'Désactiver' : 'Activer'}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Carte toggle simple (thème / mode nuit) ───────────────────────────────────
function ToggleCard({ icon, titre, desc, couleur, actif, onPress, colors }) {
  return (
    <TouchableOpacity
      style={[
        cs.actionCard,
        {
          backgroundColor: actif ? couleur + '12' : colors.card,
          borderColor:     actif ? couleur + '55' : colors.cardBorder,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={cs.cardIconZone}>
        <View style={[cs.cardIconCircle, { backgroundColor: actif ? couleur : couleur + '18' }]}>
          <Ionicons name={icon} size={36} color={actif ? '#fff' : couleur} />
        </View>
      </View>

      <View style={[cs.statutPill, {
        backgroundColor: actif ? couleur + '22' : colors.cardBorder + '80',
        borderColor:     actif ? couleur + '55' : colors.cardBorder,
      }]}>
        <View style={[cs.statutDot, { backgroundColor: actif ? couleur : colors.textMuted }]} />
        <Text style={[cs.statutText, { color: actif ? couleur : colors.textMuted }]}>
          {actif ? 'Activé' : 'Désactivé'}
        </Text>
      </View>

      <Text style={[cs.cardTitre, { color: colors.textPrimary }]}>{titre}</Text>
      <Text style={[cs.cardDesc,  { color: colors.textSecondary }]}>{desc}</Text>

      {/* Switch visuel */}
      <View style={[
        cs.switchTrack,
        {
          backgroundColor: actif ? (couleur + '33') : colors.cardBorder,
          borderColor:     actif ? (couleur + '66') : colors.cardBorder,
        },
      ]}>
        <View style={[
          cs.switchThumb,
          {
            backgroundColor: actif ? couleur : colors.textMuted,
            alignSelf: actif ? 'flex-end' : 'flex-start',
          },
        ]} />
      </View>
    </TouchableOpacity>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────
export default function Controle() {
  const { token }             = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const [vanneOuverte,  setVanneOuverte]  = useState(false);
  const [sireneActive,  setSireneActive]  = useState(false);
  const [loadingVanne,  setLoadingVanne]  = useState(false);
  const [loadingSirene, setLoadingSirene] = useState(false);
  const [modeNuit,      setModeNuit]      = useState(false);
  const [popup,         setPopup]         = useState(null);

  // Charger mode nuit depuis AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('modeNuit').then(v => {
      if (v === 'true') setModeNuit(true);
    }).catch(() => {});
  }, []);

  const toggleModeNuit = async () => {
    const next = !modeNuit;
    setModeNuit(next);
    try { await AsyncStorage.setItem('modeNuit', String(next)); } catch {}
  };

  // ── Confirmations ───────────────────────────────────────────────────────────
  const confirmerVanne = () => setPopup({
    type:    'vanne',
    titre:   vanneOuverte ? 'Fermer la vanne ?' : 'Ouvrir la vanne ?',
    message: vanneOuverte
      ? "La vanne d'irrigation va se fermer immédiatement. L'eau sera coupée."
      : "La vanne d'irrigation va s'ouvrir. L'eau coulera dans le canal.",
    couleur: VANNE_COLOR,
  });

  const confirmerSirene = () => setPopup({
    type:    'sirene',
    titre:   sireneActive ? 'Couper la sirène ?' : 'Activer la sirène ?',
    message: sireneActive
      ? "La sirène d'alarme va être coupée. L'alerte sonore cessera."
      : "La sirène 120dB va s'activer sur le terrain. Elle sera audible à 200m.",
    couleur: SIRENE_COLOR,
  });

  const executer = async () => {
    const type = popup?.type;
    setPopup(null);

    if (type === 'vanne') {
      const action = vanneOuverte ? 'fermer' : 'ouvrir';
      setLoadingVanne(true);
      try {
        const data = await actionVanne(token, action);
        if (!data?.erreur) setVanneOuverte(prev => !prev);
      } catch (e) { console.log('Erreur vanne:', e); }
      finally { setLoadingVanne(false); }

    } else if (type === 'sirene') {
      const action = sireneActive ? 'couper' : 'armer';
      setLoadingSirene(true);
      try {
        const data = await actionSirene(token, action);
        if (!data?.erreur) setSireneActive(prev => !prev);
      } catch (e) { console.log('Erreur sirène:', e); }
      finally { setLoadingSirene(false); }
    }
  };

  const themeIcon  = isDark ? 'sunny-outline' : 'moon-outline';
  const themeLabel = isDark ? 'Mode clair'   : 'Mode sombre';

  return (
    <ScrollView
      style={[cs.container, { backgroundColor: colors.background }]}
      contentContainerStyle={cs.scrollContent}
    >
      {/* Header */}
      <View style={cs.header}>
        <View style={[cs.headerIconBox, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '33' }]}>
          <Ionicons name="settings-outline" size={22} color={colors.primary} />
        </View>
        <View>
          <Text style={[cs.titre, { color: colors.textPrimary }]}>Contrôle</Text>
          <Text style={[cs.sousTitre, { color: colors.textSecondary }]}>Actionneurs de la ferme</Text>
        </View>
      </View>

      {/* Bannière warning */}
      <View style={cs.warnBanner}>
        <Ionicons name="warning-outline" size={16} color={WARN_COLOR} />
        <Text style={cs.warnText}>
          Ces actions agissent directement sur le terrain. Confirmez avant d'agir.
        </Text>
      </View>

      {/* Grille 2x2 */}
      <View style={cs.grid}>
        <ActionCard
          icon="water-outline"
          titre="Électrovanne"
          desc="Irrigation S2"
          couleur={VANNE_COLOR}
          actif={vanneOuverte}
          labelOn="Ouverte"
          labelOff="Fermée"
          onPress={confirmerVanne}
          loading={loadingVanne}
          colors={colors}
        />
        <ActionCard
          icon="volume-high-outline"
          titre="Sirène 120dB"
          desc="Périmètre S3"
          couleur={SIRENE_COLOR}
          actif={sireneActive}
          labelOn="Active"
          labelOff="Inactive"
          onPress={confirmerSirene}
          loading={loadingSirene}
          colors={colors}
        />
        <ToggleCard
          icon={themeIcon}
          titre={themeLabel}
          desc="Apparence de l'app"
          couleur={colors.primary}
          actif={!isDark}
          onPress={toggleTheme}
          colors={colors}
        />
        <ToggleCard
          icon="moon-outline"
          titre="Mode nuit"
          desc="Silences 22h–6h"
          couleur={NUIT_COLOR}
          actif={modeNuit}
          onPress={toggleModeNuit}
          colors={colors}
        />
      </View>

      {/* Popup confirmation */}
      {popup && (
        <ConfirmPopup
          visible={!!popup}
          titre={popup.titre}
          message={popup.message}
          couleur={popup.couleur}
          onConfirm={executer}
          onCancel={() => setPopup(null)}
        />
      )}

    </ScrollView>
  );
}

const cs = StyleSheet.create({
  container:     { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
  },
  headerIconBox: {
    width: 42, height: 42, borderRadius: 12,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  titre:    { fontSize: 20, fontWeight: 'bold' },
  sousTitre:{ fontSize: 12, marginTop: 2 },

  warnBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: WARN_COLOR + '12',
    borderLeftWidth: 3, borderLeftColor: WARN_COLOR,
    marginHorizontal: 16, marginBottom: 20,
    padding: 12, borderRadius: 10,
  },
  warnText: { color: WARN_COLOR, fontSize: 12, lineHeight: 18, flex: 1 },

  // Grille 2×2
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 14,
    paddingHorizontal: 16,
  },

  // Carte
  actionCard: {
    width: '47%', borderRadius: 20, padding: 16,
    borderWidth: 1, alignItems: 'center', gap: 8,
  },
  cardIconZone:   { width: '100%', alignItems: 'flex-start', marginBottom: 4 },
  cardIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  statutPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start',
  },
  statutDot:  { width: 6, height: 6, borderRadius: 3 },
  statutText: { fontSize: 11, fontWeight: '700' },

  cardTitre: { fontSize: 15, fontWeight: 'bold', alignSelf: 'flex-start' },
  cardDesc:  { fontSize: 11, alignSelf: 'flex-start', marginBottom: 4 },

  // Bouton action
  actionBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    borderRadius: 12, paddingVertical: 12, marginTop: 4,
  },
  actionBtnText: { fontWeight: 'bold', fontSize: 13 },

  // Switch visuel
  switchTrack: {
    width: '100%', height: 30, borderRadius: 15,
    borderWidth: 1, padding: 4,
    flexDirection: 'row', alignItems: 'center',
    marginTop: 4,
  },
  switchThumb: {
    width: 22, height: 22, borderRadius: 11,
  },
});
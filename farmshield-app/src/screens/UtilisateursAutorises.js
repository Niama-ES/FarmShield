// src/screens/UtilisateursAutorises.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, RefreshControl, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getVisages, addVisage, deleteVisage } from '../api/faces';

const { width, height } = Dimensions.get('window');
const PHOTOS_REQUISES = 5;
const CARD_WIDTH = width - 52; // cards slide in from right, leaving left peek

// ── Popup ─────────────────────────────────────────────────────────────────────
function Popup({ visible, type, titre, message, onConfirm, onCancel, confirmLabel = 'OK', cancelLabel = 'Annuler', colors }) {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, useNativeDriver: true, duration: 180 }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const iconName  = type === 'success' ? 'checkmark-circle' : type === 'danger' ? 'warning' : 'information-circle';
  const iconColor = type === 'success' ? '#27AE60' : type === 'danger' ? '#E74C3C' : '#27AE60';

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={p.overlay}>
        <Animated.View style={[p.card, { backgroundColor: colors.card, borderColor: colors.cardBorder, transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          <View style={[p.iconCircle, { backgroundColor: iconColor + '18' }]}>
            <Ionicons name={iconName} size={36} color={iconColor} />
          </View>
          <Text style={[p.titre, { color: colors.textPrimary }]}>{titre}</Text>
          <Text style={[p.message, { color: colors.textSecondary }]}>{message}</Text>
          <View style={p.btns}>
            {onCancel && (
              <TouchableOpacity style={[p.btnCancel, { borderColor: colors.cardBorder }]} onPress={onCancel}>
                <Text style={[p.btnCancelText, { color: colors.textSecondary }]}>{cancelLabel}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[p.btnConfirm, { backgroundColor: type === 'danger' ? '#E74C3C' : '#27AE60' }]} onPress={onConfirm}>
              <Text style={p.btnConfirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function UtilisateursAutorises({ navigation }) {
  const { token } = useAuth();
  const { colors, isDark } = useTheme();

  const ACCENT      = colors.primary;       // #27AE60 or #2ECC71
  const HERO_BG     = isDark ? '#1A3A2A' : '#3A7D55';   // deep forest green hero
  const CARD_BG     = isDark ? '#111811' : '#FFFFFF';
  const CARD_BORDER = isDark ? '#1E2E1E' : '#E8F5E9';

  const [visages,         setVisages]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [etape,           setEtape]           = useState(null);
  const [nom,             setNom]             = useState('');
  const [photosCapturees, setPhotosCapturees] = useState([]);
  const [capturing,       setCapturing]       = useState(false);
  const [envoi,           setEnvoi]           = useState(false);

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupConfig,  setPopupConfig]  = useState({});

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);

  const showPopup = (config) => { setPopupConfig(config); setPopupVisible(true); };
  const hidePopup = () => setPopupVisible(false);

  const chargerVisages = async () => {
    try {
      const data = await getVisages(token);
      setVisages(Array.isArray(data) ? data : data.visages || []);
    } catch (e) { console.log('Erreur visages:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { chargerVisages(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await chargerVisages();
    setRefreshing(false);
  }, []);

  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 400, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  };
  const stopPulse = () => {
    if (pulseLoop.current) pulseLoop.current.stop();
    pulseAnim.setValue(1);
  };

  const fermerModal = () => {
    setEtape(null); setNom('');
    setPhotosCapturees([]); setCapturing(false); setEnvoi(false);
    stopPulse();
  };

  const passerACamera = async () => {
    if (!nom.trim()) {
      showPopup({ type: 'danger', titre: 'Champ manquant', message: 'Le nom est obligatoire.', onConfirm: hidePopup });
      return;
    }
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        showPopup({ type: 'danger', titre: 'Permission refusée', message: "Autorisez l'accès à la caméra dans les paramètres.", onConfirm: hidePopup });
        return;
      }
    }
    setEtape('camera');
  };

  const lancerCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true); startPulse();
    const b64list = [];
    for (let i = 0; i < PHOTOS_REQUISES; i++) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.3, base64: true, skipProcessing: true });
        if (photo.base64) b64list.push(photo.base64);
        setPhotosCapturees(prev => [...prev, photo.uri]);
        await new Promise(r => setTimeout(r, 500));
      } catch (e) { console.log('Erreur capture', i, e.message); }
    }
    stopPulse(); setCapturing(false);
    await enregistrerVisage(b64list);
  };

  const enregistrerVisage = async (photos_base64) => {
    setEnvoi(true);
    try {
      const data = await addVisage(token, nom.trim(), photos_base64);
      const nouveau = data.visage || data;
      if (nouveau?.id) {
        setVisages(prev => [nouveau, ...prev]);
        fermerModal();
        showPopup({
          type: 'success', titre: 'Personne ajoutée',
          message: `${nom.trim()} a été enregistré(e).\n${photos_base64.length} photos envoyées au système de reconnaissance.`,
          confirmLabel: 'Parfait', onConfirm: hidePopup,
        });
      } else {
        showPopup({ type: 'danger', titre: 'Erreur', message: data.erreur || 'Ajout échoué.', onConfirm: hidePopup });
        setEnvoi(false);
      }
    } catch (e) {
      showPopup({ type: 'danger', titre: 'Erreur réseau', message: 'Impossible de contacter le serveur.', onConfirm: hidePopup });
      setEnvoi(false);
    }
  };

  const demanderSuppression = (id, nomPersonne) => {
    showPopup({
      type: 'danger', titre: 'Supprimer ?',
      message: `Retirer ${nomPersonne} des personnes autorisées ?\nSes photos seront supprimées du système.`,
      confirmLabel: 'Supprimer', cancelLabel: 'Annuler',
      onCancel: hidePopup,
      onConfirm: () => confirmerSuppression(id),
    });
  };

  const confirmerSuppression = async (id) => {
    hidePopup();
    try {
      await deleteVisage(token, id);
      setVisages(prev => prev.filter(v => v.id !== id));
    } catch {
      showPopup({ type: 'danger', titre: 'Erreur', message: 'Suppression échouée.', onConfirm: hidePopup });
    }
  };

  // ── Person card — Florest style: white panel sliding from right ──────────────
  const renderVisage = ({ item }) => (
    <View style={[card.wrap, { backgroundColor: CARD_BG, borderColor: CARD_BORDER }]}>
      {/* Person icon circle */}
      <View style={[card.iconCircle, { backgroundColor: isDark ? '#1E3A2A' : '#EAF6EE', borderColor: isDark ? '#2E4A3A' : '#C8E6C9' }]}>
        <Ionicons name="person" size={22} color={ACCENT} />
      </View>

      {/* Name + status */}
      <View style={card.info}>
        <Text style={[card.nom, { color: isDark ? '#FFFFFF' : '#1A2E1A' }]}>{item.nom}</Text>
        <View style={card.statusRow}>
          <View style={[card.statusDot, { backgroundColor: ACCENT }]} />
          <Text style={[card.statusTxt, { color: isDark ? '#8E9E8E' : '#5A7A5A' }]}>Accès autorisé</Text>
        </View>
      </View>

      {/* Delete — florest-style white rounded square */}
      <TouchableOpacity
        style={[card.actionBtn, { backgroundColor: isDark ? '#1A2E20' : '#F9FFFE', borderColor: isDark ? '#2A3E2A' : '#E0F0E0' }]}
        onPress={() => demanderSuppression(item.id, item.nom)}
      >
        <Ionicons name="trash-outline" size={16} color="#E74C3C" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[s.root, { backgroundColor: isDark ? '#0A0F0A' : '#F0F7F0' }]}>

      {/* ── HERO — full green top half like Florest ──────────────────────────── */}
      <View style={[s.hero, { backgroundColor: HERO_BG }]}>

        {/* Decorative big circle in top-right like the plant ball in inspo */}
        <View style={[s.heroOrb, { backgroundColor: isDark ? '#2A5A3A' : '#4A9B65' }]} />
        <View style={[s.heroOrbInner, { backgroundColor: isDark ? '#1E4A2E' : '#3D8A56' }]} />

        {/* Nav bar */}
        <View style={s.heroNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.heroBack}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={s.heroNavTitle}>Accès</Text>
          <TouchableOpacity style={[s.heroAddBtn, { backgroundColor: 'rgba(255,255,255,0.18)' }]} onPress={() => setEtape('nom')}>
            <Ionicons name="person-add-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Big title — Florest-style large serif-weight text */}
        <View style={s.heroTitleWrap}>
          <Text style={s.heroTitle}>Personnes{'\n'}autorisées</Text>
          <Text style={s.heroSub}>Reconnaissance faciale · ESP32-CAM</Text>
        </View>

        {/* Count pills — like "16 All / 8 Outdoor / 4 Indoor" tabs */}
        <View style={s.heroTabs}>
          <View style={[s.heroTabActive, { backgroundColor: '#fff' }]}>
            <Text style={[s.heroTabNumActive, { color: HERO_BG }]}>{visages.length}</Text>
            <Text style={[s.heroTabLabelActive, { color: HERO_BG }]}>Tous</Text>
          </View>
          <View style={s.heroTabInactive}>
            <Text style={s.heroTabNum}>
              {visages.filter((_, i) => i % 2 === 0).length}
            </Text>
            <Text style={s.heroTabLabel}>Récents</Text>
          </View>
          <View style={s.heroTabInactive}>
            <Text style={s.heroTabNum}>
              {visages.filter((_, i) => i % 2 !== 0).length}
            </Text>
            <Text style={s.heroTabLabel}>Anciens</Text>
          </View>
        </View>

        {/* Curved bottom cutout so cards sit ON the green hero */}
        <View style={[s.heroCurve, { backgroundColor: isDark ? '#0A0F0A' : '#F0F7F0' }]} />
      </View>

      {/* ── Alert strip — minimal, below hero ────────────────────────────────── */}
      <View style={[s.alertStrip, { backgroundColor: isDark ? '#111811' : '#fff', borderColor: isDark ? '#1E2E1E' : '#E0EBE0' }]}>
        <View style={[s.alertDot, { backgroundColor: '#E74C3C' }]} />
        <Text style={[s.alertText, { color: isDark ? '#8E9E8E' : '#5A7A5A' }]}>
          Toute personne non reconnue déclenche une alerte
        </Text>
        <Ionicons name="shield-checkmark-outline" size={14} color={ACCENT} />
      </View>

      {/* ── List — cards slide in from the right like Florest ────────────────── */}
      {loading ? (
        <View style={s.center}>
          <Ionicons name="sync-outline" size={28} color={ACCENT} />
          <Text style={[s.emptyTxt, { color: isDark ? '#8E9E8E' : '#5A7A5A' }]}>Chargement…</Text>
        </View>
      ) : visages.length === 0 ? (
        <View style={s.center}>
          <View style={[s.emptyIconWrap, { backgroundColor: isDark ? '#1A2E1A' : '#EAF6EE', borderColor: isDark ? '#2E4A2E' : '#C8E6C9' }]}>
            <Ionicons name="people-outline" size={40} color={ACCENT} />
          </View>
          <Text style={[s.emptyTitle, { color: isDark ? '#FFFFFF' : '#1A2E1A' }]}>Aucune personne</Text>
          <Text style={[s.emptyTxt, { color: isDark ? '#8E9E8E' : '#5A7A5A' }]}>
            Enregistrez un visage pour activer la reconnaissance
          </Text>
          <TouchableOpacity style={[s.emptyBtn, { backgroundColor: ACCENT }]} onPress={() => setEtape('nom')}>
            <Ionicons name="person-add-outline" size={15} color="#fff" />
            <Text style={s.emptyBtnTxt}>Ajouter une personne</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visages}
          keyExtractor={item => item.id.toString()}
          renderItem={renderVisage}
          contentContainerStyle={s.liste}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ════ MODAL NOM ════ */}
      <Modal visible={etape === 'nom'} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={fermerModal}>
          <TouchableOpacity style={[s.modalSheet, { backgroundColor: CARD_BG }]} activeOpacity={1}>

            <View style={s.modalTop}>
              <View style={[s.modalHandle, { backgroundColor: isDark ? '#2E3E2E' : '#D0E8D0' }]} />
              <TouchableOpacity onPress={fermerModal} style={[s.modalCloseBtn, { backgroundColor: isDark ? '#1A2E1A' : '#F0F7F0' }]}>
                <Ionicons name="close" size={14} color={isDark ? '#8E9E8E' : '#5A7A5A'} />
              </TouchableOpacity>
            </View>

            {/* Header */}
            <View style={[s.modalIconHead, { backgroundColor: isDark ? '#1A2E1A' : '#EAF6EE', borderColor: isDark ? '#2E4A2E' : '#C8E6C9' }]}>
              <Ionicons name="person-add-outline" size={26} color={ACCENT} />
            </View>
            <Text style={[s.modalTitre, { color: isDark ? '#FFFFFF' : '#1A2E1A' }]}>Nouvelle personne</Text>
            <Text style={[s.modalSub, { color: isDark ? '#8E9E8E' : '#5A7A5A' }]}>
              {PHOTOS_REQUISES} photos capturées pour la reconnaissance faciale.
            </Text>

            {/* Steps */}
            <View style={s.stepsRow}>
              {['Identité', 'Capture', 'Actif'].map((label, i) => (
                <React.Fragment key={i}>
                  <View style={s.stepItem}>
                    <View style={[s.stepCircle,
                      i === 0
                        ? { backgroundColor: ACCENT }
                        : { backgroundColor: 'transparent', borderColor: isDark ? '#2E3E2E' : '#C8E6C9', borderWidth: 1.5 }
                    ]}>
                      {i === 0
                        ? <Ionicons name="checkmark" size={11} color="#fff" />
                        : <Text style={[s.stepNum, { color: isDark ? '#4A5E4A' : '#8FAF8F' }]}>{i + 1}</Text>
                      }
                    </View>
                    <Text style={[s.stepLabel, { color: i === 0 ? ACCENT : isDark ? '#4A5E4A' : '#8FAF8F', fontWeight: i === 0 ? '700' : '400' }]}>{label}</Text>
                  </View>
                  {i < 2 && <View style={[s.stepLine, { backgroundColor: i === 0 ? ACCENT + '50' : isDark ? '#2E3E2E' : '#C8E6C9' }]} />}
                </React.Fragment>
              ))}
            </View>

            {/* Input */}
            <Text style={[s.inputLabel, { color: isDark ? '#4A5E4A' : '#8FAF8F' }]}>NOM COMPLET</Text>
            <View style={[s.inputWrap, { backgroundColor: isDark ? '#0D1A0D' : '#F4FAF4', borderColor: isDark ? '#1E3020' : '#C8E6C9' }]}>
              <Ionicons name="person-outline" size={16} color={ACCENT} style={{ paddingLeft: 16 }} />
              <TextInput
                style={[s.input, { color: isDark ? '#FFFFFF' : '#1A2E1A' }]}
                placeholder="Ex: Ahmed Benali"
                placeholderTextColor={isDark ? '#4A5E4A' : '#8FAF8F'}
                value={nom}
                onChangeText={setNom}
                autoFocus
              />
            </View>

            <TouchableOpacity style={[s.btnSuivant, { backgroundColor: ACCENT }]} onPress={passerACamera}>
              <Text style={s.btnSuivantTxt}>Ouvrir la caméra</Text>
              <View style={s.btnSuivantIcon}>
                <Ionicons name="camera-outline" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ════ MODAL CAMÉRA ════ */}
      <Modal visible={etape === 'camera'} transparent={false} animationType="slide">
        <View style={s.camContainer}>
          <View style={[s.camHeader, { backgroundColor: HERO_BG }]}>
            <TouchableOpacity onPress={fermerModal} style={s.camCloseBtn}>
              <Ionicons name="chevron-back" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={s.camHeaderCenter}>
              <Text style={s.camHeaderLabel}>Capture · {nom}</Text>
              <Text style={s.camHeaderCount}>{photosCapturees.length} / {PHOTOS_REQUISES}</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          <View style={s.camWrapper}>
            <CameraView ref={cameraRef} style={s.camera} facing="front" />
            <View style={s.ovalOverlay}>
              <Animated.View style={[
                s.ovalGuide,
                capturing && { transform: [{ scale: pulseAnim }], borderColor: ACCENT, borderWidth: 3 },
              ]} />
            </View>
            <View style={s.instrWrap}>
              <Text style={s.instrTxt}>
                {capturing ? 'Tournez légèrement la tête…' : "Placez le visage dans l'ovale"}
              </Text>
            </View>
          </View>

          <View style={s.camBottom}>
            {/* Progress bar */}
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { backgroundColor: ACCENT, width: `${(photosCapturees.length / PHOTOS_REQUISES) * 100}%` }]} />
            </View>

            <View style={s.dotRow}>
              {Array.from({ length: PHOTOS_REQUISES }).map((_, i) => (
                <View key={i} style={[s.dot, i < photosCapturees.length ? { backgroundColor: ACCENT, width: 10, height: 10 } : {}]} />
              ))}
            </View>

            {envoi ? (
              <View style={s.statusRow}>
                <Ionicons name="cloud-upload-outline" size={20} color={ACCENT} />
                <Text style={[s.statusTxt, { color: ACCENT }]}>Envoi au serveur…</Text>
              </View>
            ) : capturing ? (
              <View style={s.statusRow}>
                <Ionicons name="aperture-outline" size={20} color={ACCENT} />
                <Text style={[s.statusTxt, { color: ACCENT }]}>Capture en cours…</Text>
              </View>
            ) : (
              <TouchableOpacity style={[s.captureBtn, { borderColor: ACCENT }]} onPress={lancerCapture}>
                <View style={[s.captureBtnInner, { backgroundColor: ACCENT }]}>
                  <Ionicons name="camera" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            )}
            <Text style={s.camHint}>{PHOTOS_REQUISES} photos capturées automatiquement</Text>
          </View>
        </View>
      </Modal>

      {/* ════ POPUP ════ */}
      <Popup
        visible={popupVisible}
        type={popupConfig.type}
        titre={popupConfig.titre}
        message={popupConfig.message}
        confirmLabel={popupConfig.confirmLabel}
        cancelLabel={popupConfig.cancelLabel}
        onConfirm={popupConfig.onConfirm}
        onCancel={popupConfig.onCancel}
        colors={colors}
      />
    </View>
  );
}

// ── Popup styles ──────────────────────────────────────────────────────────────
const p = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 28 },
  card:           { borderRadius: 28, padding: 28, width: '100%', alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 28, elevation: 20 },
  iconCircle:     { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  titre:          { fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  message:        { fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: 24 },
  btns:           { flexDirection: 'row', gap: 10, width: '100%' },
  btnCancel:      { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  btnCancelText:  { fontWeight: '600', fontSize: 14 },
  btnConfirm:     { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center' },
  btnConfirmText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

// ── Card styles — Florest floating panel from the right ───────────────────────
const card = StyleSheet.create({
  wrap:        {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    marginBottom: 12,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
    // Florest key: shadow so card lifts off background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  iconCircle:  { width: 50, height: 50, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  info:        { flex: 1 },
  nom:         { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  statusRow:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusTxt:   { fontSize: 11, fontWeight: '500' },
  // Florest "+" style button — square white rounded
  actionBtn:   { width: 40, height: 40, borderRadius: 13, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
});

// ── Main styles ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  // ── Hero — green top ~48% like Florest ──
  hero:            {
    paddingTop: 52,
    paddingHorizontal: 22,
    paddingBottom: 52,
    position: 'relative',
    overflow: 'hidden',
  },
  heroOrb:         {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  heroOrbInner:    {
    position: 'absolute',
    top: -20,
    right: 10,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  heroNav:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, zIndex: 2 },
  heroBack:        { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  heroNavTitle:    { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', letterSpacing: 1 },
  heroAddBtn:      { width: 38, height: 38, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },

  heroTitleWrap:   { marginBottom: 24, zIndex: 2 },
  heroTitle:       { color: '#fff', fontSize: 36, fontWeight: '900', lineHeight: 40, letterSpacing: -1, marginBottom: 8 },
  heroSub:         { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '500', letterSpacing: 0.3 },

  // Florest count tabs
  heroTabs:        { flexDirection: 'row', gap: 8, zIndex: 2 },
  heroTabActive:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  heroTabNumActive:{ fontSize: 13, fontWeight: '900' },
  heroTabLabelActive:{ fontSize: 13, fontWeight: '700' },
  heroTabInactive: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
  heroTabNum:      { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700' },
  heroTabLabel:    { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500' },

  heroCurve:       { position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, borderTopLeftRadius: 30, borderTopRightRadius: 30 },

  // Alert strip
  alertStrip:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 6, marginBottom: 10, padding: 11, borderRadius: 14, borderWidth: 1 },
  alertDot:        { width: 6, height: 6, borderRadius: 3 },
  alertText:       { flex: 1, fontSize: 11.5, lineHeight: 16 },

  // List — Florest cards offset from right
  liste:           { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 48 },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  emptyIconWrap:   { width: 80, height: 80, borderRadius: 26, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle:      { fontSize: 18, fontWeight: '800' },
  emptyTxt:        { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  emptyBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 16, marginTop: 6 },
  emptyBtnTxt:     { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Modal
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet:      { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 48 },
  modalTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalHandle:     { width: 36, height: 4, borderRadius: 2 },
  modalCloseBtn:   { width: 28, height: 28, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  modalIconHead:   { width: 60, height: 60, borderRadius: 20, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  modalTitre:      { fontSize: 22, fontWeight: '900', marginBottom: 6, letterSpacing: -0.5 },
  modalSub:        { fontSize: 13, lineHeight: 19, marginBottom: 24 },

  stepsRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  stepItem:        { alignItems: 'center', gap: 5 },
  stepCircle:      { width: 28, height: 28, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  stepNum:         { fontSize: 11, fontWeight: '700' },
  stepLabel:       { fontSize: 9, letterSpacing: 0.5 },
  stepLine:        { width: 32, height: 1.5, marginBottom: 16, marginHorizontal: 6 },

  inputLabel:      { fontSize: 9.5, fontWeight: '700', letterSpacing: 2.5, marginBottom: 8 },
  inputWrap:       { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1.5, marginBottom: 20 },
  input:           { flex: 1, padding: 16, fontSize: 15, fontWeight: '500' },
  btnSuivant:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, padding: 17, paddingHorizontal: 20 },
  btnSuivantTxt:   { color: '#fff', fontWeight: '900', fontSize: 15 },
  btnSuivantIcon:  { width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  // Camera
  camContainer:    { flex: 1, backgroundColor: '#000' },
  camHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 54, paddingBottom: 16 },
  camCloseBtn:     { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  camHeaderCenter: { alignItems: 'center' },
  camHeaderLabel:  { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  camHeaderCount:  { color: '#fff', fontSize: 18, fontWeight: '900' },
  camWrapper:      { flex: 1, position: 'relative' },
  camera:          { flex: 1 },
  ovalOverlay:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  ovalGuide:       { width: 196, height: 256, borderRadius: 98, borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)', backgroundColor: 'transparent' },
  instrWrap:       { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
  instrTxt:        { color: '#fff', fontSize: 13, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 9, borderRadius: 22 },
  camBottom:       { backgroundColor: '#0D0D0D', paddingVertical: 26, paddingHorizontal: 32, alignItems: 'center', gap: 12 },
  progressTrack:   { width: '100%', height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  progressFill:    { height: '100%', borderRadius: 2 },
  dotRow:          { flexDirection: 'row', gap: 6 },
  dot:             { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  captureBtn:      { width: 72, height: 72, borderRadius: 22, borderWidth: 2.5, justifyContent: 'center', alignItems: 'center' },
  captureBtnInner: { width: 58, height: 58, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  statusRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusTxt:       { fontSize: 14, fontWeight: '700' },
  camHint:         { color: 'rgba(255,255,255,0.3)', fontSize: 11 },
});
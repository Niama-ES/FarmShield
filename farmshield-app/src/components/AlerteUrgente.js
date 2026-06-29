// src/components/AlerteUrgente.js
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated, Dimensions, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const ALERT_COLOR = '#E05C6A';

const TYPE_CONFIG = {
  intrus:        { icon: 'person-remove', label: 'Intrus détecté'   },
  vol_poids:     { icon: 'scale',         label: 'Vol de stock'     },
  vol_eau:       { icon: 'water',         label: "Vol d'eau"        },
  animal_danger: { icon: 'warning',       label: 'Animal dangereux' },
  stock_bas:     { icon: 'cube',          label: 'Stock bas'        },
  default:       { icon: 'alert-circle',  label: 'Alerte'           },
};
const SS_LABELS = { S1: 'Stockage', S2: 'Irrigation', S3: 'Périmètre' };
const getConf   = (t) => TYPE_CONFIG[t] || TYPE_CONFIG.default;

export default function AlerteUrgente({ alerte, onFermer, onVoirAlertes }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ring1Anim = useRef(new Animated.Value(0)).current;
  const ring2Anim = useRef(new Animated.Value(0)).current;
  const loops     = useRef([]);

  useEffect(() => {
    if (!alerte) return;

    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
    ]).start();

    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.18, duration: 700, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
    ]));

    const r1 = Animated.loop(Animated.sequence([
      Animated.timing(ring1Anim, { toValue: 1, duration: 1600, useNativeDriver: true }),
      Animated.timing(ring1Anim, { toValue: 0, duration: 0,    useNativeDriver: true }),
    ]));

    pulse.start(); r1.start();
    loops.current = [pulse, r1];

    const t = setTimeout(() => {
      const r2 = Animated.loop(Animated.sequence([
        Animated.timing(ring2Anim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(ring2Anim, { toValue: 0, duration: 0,    useNativeDriver: true }),
      ]));
      r2.start();
      loops.current.push(r2);
    }, 800);

    return () => { loops.current.forEach(l => l.stop()); clearTimeout(t); };
  }, [alerte]);

  const fermer = () => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0,    duration: 220, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 220, useNativeDriver: true }),
    ]).start(onFermer);
  };

  if (!alerte) return null;

  const { icon, label } = getConf(alerte.type_alerte);
  const ring1Scale   = ring1Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 3.5] });
  const ring1Opacity = ring1Anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.2, 0] });
  const ring2Scale   = ring2Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 3.5] });
  const ring2Opacity = ring2Anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.2, 0] });

  const time = new Date(alerte.created_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <Modal visible={!!alerte} transparent animationType="none" statusBarTranslucent>
      <StatusBar backgroundColor="#0D0608" barStyle="light-content" />
      <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[s.screen, { transform: [{ scale: scaleAnim }] }]}>

          {/* Fermer */}
          <TouchableOpacity style={s.closeBtn} onPress={fermer}>
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.55)" />
          </TouchableOpacity>

          {/* Icône zone */}
          <View style={s.iconZone}>
            <Animated.View style={[s.ring, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />
            <Animated.View style={[s.ring, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />
            <Animated.View style={[s.iconCircle, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name={icon} size={54} color="#fff" />
            </Animated.View>
          </View>

          {/* Texte */}
          <View style={s.textZone}>
            <Text style={s.pill}>● ALERTE EN COURS</Text>
            <Text style={s.titre}>{label}</Text>
            <Text style={s.desc}>{alerte.description}</Text>
            <View style={s.metaRow}>
              <View style={s.ssBadge}>
                <Text style={s.ssMain}>{alerte.sous_systeme}</Text>
                <Text style={s.ssSub}>· {SS_LABELS[alerte.sous_systeme] || alerte.sous_systeme}</Text>
              </View>
              <Text style={s.time}>{time}</Text>
            </View>
          </View>

          {/* Boutons */}
          <View style={s.btns}>
            <TouchableOpacity
              style={s.btnVoir}
              onPress={() => { fermer(); onVoirAlertes?.(); }}
            >
              <Text style={s.btnVoirText}>Voir les alertes</Text>
              <Ionicons name="arrow-forward" size={18} color={ALERT_COLOR} />
            </TouchableOpacity>
            <TouchableOpacity style={s.btnIgnorer} onPress={fermer}>
              <Text style={s.btnIgnorerText}>Ignorer</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.97)',
    justifyContent: 'center', alignItems: 'center',
  },
  screen: {
    width, height,
    backgroundColor: '#0D0608',
    justifyContent: 'space-between',
    paddingTop: 64, paddingBottom: 56, paddingHorizontal: 32,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute', top: 56, left: 24, zIndex: 10,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Icône
  iconZone: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  ring: {
    position: 'absolute',
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: ALERT_COLOR + '28',
  },
  iconCircle: {
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: ALERT_COLOR,
    justifyContent: 'center', alignItems: 'center',
  },

  // Texte
  textZone:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  pill: {
    color: ALERT_COLOR, fontSize: 10,
    fontWeight: '800', letterSpacing: 3, marginBottom: 14,
  },
  titre: {
    color: '#fff', fontSize: 30, fontWeight: 'bold',
    textAlign: 'center', marginBottom: 14,
  },
  desc: {
    color: 'rgba(255,255,255,0.55)', fontSize: 14,
    textAlign: 'center', lineHeight: 22, marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 14,
  },
  ssBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  ssMain:  { color: ALERT_COLOR, fontWeight: '800', fontSize: 13 },
  ssSub:   { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  time:    { color: 'rgba(255,255,255,0.35)', fontSize: 12 },

  // Boutons
  btns: { width: '100%', gap: 10 },
  btnVoir: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
  },
  btnVoirText:    { color: ALERT_COLOR, fontWeight: 'bold', fontSize: 16 },
  btnIgnorer:     { alignItems: 'center', padding: 12 },
  btnIgnorerText: { color: 'rgba(255,255,255,0.35)', fontSize: 14 },
});
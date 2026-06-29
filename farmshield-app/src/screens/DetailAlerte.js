// src/screens/DetailAlerte.js
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const ALERT_COLOR = '#E05C6A';

const getTypeConfig = (type_alerte) => {
  switch (type_alerte) {
    case 'intrus':        return { icon: 'person-remove-outline', color: ALERT_COLOR,  label: 'Intrus détecté'   };
    case 'vol_poids':     return { icon: 'scale-outline',         color: ALERT_COLOR,  label: 'Vol de stock'     };
    case 'vol_eau':       return { icon: 'water-outline',         color: ALERT_COLOR,  label: "Vol d'eau"        };
    case 'animal_danger': return { icon: 'warning-outline',       color: ALERT_COLOR,  label: 'Animal dangereux' };
    case 'stock_bas':     return { icon: 'cube-outline',          color: ALERT_COLOR,  label: 'Stock bas'        };
    default:              return { icon: 'alert-circle-outline',  color: ALERT_COLOR,  label: 'Alerte'           };
  }
};

const SS_COLORS = { S1: '#D85A30', S2: '#378ADD', S3: '#3B6D11' };
const getSsColor = (ss) => SS_COLORS[ss] || '#888';
const getSsLabel = (ss) => {
  if (ss === 'S1') return 'Stockage agricole';
  if (ss === 'S2') return 'Irrigation';
  if (ss === 'S3') return 'Périmètre & bétail';
  return ss;
};

export default function DetailAlerte({ route, navigation }) {
  const { colors } = useTheme();
  const { alerte } = route?.params || {};

  if (!alerte) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={[s.emptyText, { color: colors.textSecondary }]}>Aucun détail disponible</Text>
      </View>
    );
  }

  const { icon, color, label } = getTypeConfig(alerte.type_alerte);
  const ssColor = getSsColor(alerte.sous_systeme);

  const date = new Date(alerte.created_at).toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <ScrollView style={[s.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={[s.retourBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[s.titre, { color: colors.textPrimary }]}>Détail alerte</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Carte principale */}
      <View style={[s.mainCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderTopColor: color }]}>
        <View style={s.mainCardTop}>
          <View style={[s.mainIconBox, { backgroundColor: color + '18' }]}>
            <Ionicons name={icon} size={32} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.mainLabel, { color }]}>{label}</Text>
            <View style={s.ssRow}>
              <View style={[s.ssBadge, { backgroundColor: ssColor + '22' }]}>
                <Text style={[s.ssText, { color: ssColor }]}>{alerte.sous_systeme}</Text>
              </View>
              <Text style={[s.ssLabel, { color: colors.textSecondary }]}>{getSsLabel(alerte.sous_systeme)}</Text>
            </View>
          </View>
          <View style={[s.luBadge, { backgroundColor: alerte.lu ? colors.success + '18' : ALERT_COLOR + '18' }]}>
            <Ionicons
              name={alerte.lu ? 'checkmark-circle-outline' : 'ellipse-outline'}
              size={14}
              color={alerte.lu ? colors.success : ALERT_COLOR}
            />
            <Text style={[s.luText, { color: alerte.lu ? colors.success : ALERT_COLOR }]}>
              {alerte.lu ? 'Lu' : 'Non lu'}
            </Text>
          </View>
        </View>

        <View style={[s.separator, { backgroundColor: colors.cardBorder }]} />

        <Text style={[s.descLabel, { color: colors.textMuted }]}>DESCRIPTION</Text>
        <Text style={[s.description, { color: colors.textPrimary }]}>{alerte.description}</Text>

        <View style={s.dateRow}>
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <Text style={[s.dateText, { color: colors.textMuted }]}>{date}</Text>
        </View>
      </View>

      {/* Photo capturée */}
      {alerte.photo_url && (
        <View style={s.section}>
          <Text style={[s.sectionTitre, { color: colors.textMuted }]}>PHOTO CAPTURÉE</Text>
          <View style={[s.photoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[s.photoIconBox, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="camera-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[s.photoText, { color: colors.textPrimary }]}>Image disponible</Text>
            <Text style={[s.photoSub, { color: colors.textSecondary }]}>{alerte.photo_url}</Text>
          </View>
        </View>
      )}

      {/* Informations */}
      <View style={s.section}>
        <Text style={[s.sectionTitre, { color: colors.textMuted }]}>INFORMATIONS</Text>
        <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {[
            { icon: 'grid-outline',           label: 'Sous-système', val: `${alerte.sous_systeme} — ${getSsLabel(alerte.sous_systeme)}` },
            { icon: 'alert-circle-outline',   label: 'Type',         val: alerte.type_alerte || 'Automatique' },
            { icon: 'checkmark-done-outline', label: 'Statut',       val: alerte.lu ? 'Lu' : 'Non lu' },
            { icon: 'pricetag-outline',       label: 'ID',           val: `#${alerte.id}` },
          ].map((item, i) => (
            <View key={i} style={[s.infoRow, { borderBottomColor: colors.cardBorder }, i === 3 && { borderBottomWidth: 0 }]}>
              <View style={s.infoLeft}>
                <Ionicons name={item.icon} size={15} color={colors.textMuted} />
                <Text style={[s.infoLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              </View>
              <Text style={[s.infoVal, { color: colors.textPrimary }]}>{item.val}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── Styles statiques uniquement ───────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
  },
  retourBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  titre:     { fontSize: 17, fontWeight: 'bold' },

  mainCard:    { borderRadius: 16, margin: 16, padding: 18, borderTopWidth: 4, borderWidth: 1 },
  mainCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  mainIconBox: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  mainLabel:   { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  ssRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ssBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  ssText:      { fontSize: 11, fontWeight: 'bold' },
  ssLabel:     { fontSize: 12 },
  luBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  luText:      { fontSize: 11, fontWeight: '600' },

  separator:   { height: 1, marginBottom: 14 },
  descLabel:   { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 22, marginBottom: 14 },
  dateRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText:    { fontSize: 12 },

  section:      { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitre: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },

  photoCard:    { borderRadius: 14, padding: 20, borderWidth: 1, alignItems: 'center', gap: 8 },
  photoIconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  photoText:    { fontSize: 14, fontWeight: '600' },
  photoSub:     { fontSize: 11 },

  infoCard:  { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  infoLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 13 },
  infoVal:   { fontSize: 13, fontWeight: '500' },
});
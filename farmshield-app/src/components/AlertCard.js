// src/components/AlertCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';

export default function AlertCard({ alerte, onMarquerLu }) {
  const couleur = alerte.sous_systeme === 'S1' ? colors.s1Color
    : alerte.sous_systeme === 'S2' ? colors.s2Color
    : alerte.sous_systeme === 'S3' ? colors.s3Color
    : colors.warning;

  const date = new Date(alerte.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <View style={[styles.card, { borderLeftColor: couleur }, alerte.lu && styles.cardLue]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: couleur + '22' }]}>
          <Text style={[styles.badgeText, { color: couleur }]}>{alerte.sous_systeme}</Text>
        </View>
        <Text style={styles.date}>{date}</Text>
        {!alerte.lu && <View style={styles.dotNonLu} />}
      </View>
      <Text style={styles.message}>{alerte.message}</Text>
      {!alerte.lu && (
        <TouchableOpacity style={styles.btnLu} onPress={() => onMarquerLu(alerte.id)}>
          <Text style={styles.btnLuText}>Marquer comme lu</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: 12,
    padding: 14, marginBottom: 10,
    borderLeftWidth: 4, borderWidth: 1, borderColor: colors.cardBorder,
  },
  cardLue: { opacity: 0.6 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  date: { color: colors.textSecondary, fontSize: 11, flex: 1 },
  dotNonLu: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.danger,
  },
  message: { color: colors.textPrimary, fontSize: 14, lineHeight: 20 },
  btnLu: { marginTop: 10, alignSelf: 'flex-start' },
  btnLuText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
});
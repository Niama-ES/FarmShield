// src/components/StatCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function StatCard({ label, valeur, unite, couleur, icone, statut }) {
  // statut = 'ok' | 'alerte' | 'hors-ligne'
  const couleurBord = statut === 'alerte' ? colors.danger
    : statut === 'hors-ligne' ? colors.textMuted
    : couleur || colors.primary;

  return (
    <View style={[styles.card, { borderLeftColor: couleurBord }]}>
      <Text style={styles.icone}>{icone}</Text>
      <View style={styles.contenu}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.valeur, { color: couleurBord }]}>
          {valeur} <Text style={styles.unite}>{unite}</Text>
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: couleurBord + '22' }]}>
        <Text style={[styles.badgeText, { color: couleurBord }]}>
          {statut === 'alerte' ? '⚠ ALERTE' : statut === 'hors-ligne' ? '○ OFF' : '✓ OK'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icone: {
    fontSize: 28,
  },
  contenu: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valeur: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  unite: {
    fontSize: 13,
    fontWeight: 'normal',
    color: colors.textSecondary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
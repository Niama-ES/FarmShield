// src/components/StatusBadge.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function StatusBadge({ statut }) {
  const config = {
    ok:          { couleur: colors.success, label: '✓ OK' },
    alerte:      { couleur: colors.danger,  label: '⚠ ALERTE' },
    'hors-ligne':{ couleur: colors.textMuted, label: '○ OFF' },
  }[statut] || { couleur: colors.textMuted, label: statut };

  return (
    <View style={[styles.badge, { backgroundColor: config.couleur + '22' }]}>
      <Text style={[styles.text, { color: config.couleur }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  text: { fontSize: 11, fontWeight: 'bold' },
});
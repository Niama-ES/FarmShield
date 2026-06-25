// src/components/SensorCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function SensorCard({ label, valeur, unite, couleur, description }) {
  return (
    <View style={[styles.card, { borderLeftColor: couleur || colors.primary }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.valeur, { color: couleur || colors.primary }]}>
        {valeur} <Text style={styles.unite}>{unite}</Text>
      </Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: 12,
    padding: 16, marginBottom: 10,
    borderLeftWidth: 4, borderWidth: 1, borderColor: colors.cardBorder,
  },
  label: {
    color: colors.textSecondary, fontSize: 11,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6,
  },
  valeur: { fontSize: 28, fontWeight: 'bold' },
  unite: { fontSize: 14, fontWeight: 'normal', color: colors.textSecondary },
  description: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
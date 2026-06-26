// src/components/StockItemCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';

export default function StockItemCard({ item, onDelete }) {
  const pourcentage = Math.round((item.quantite_actuelle / item.quantite_initiale) * 100);
  const enAlerte = item.quantite_actuelle <= item.seuil_alerte;
  const couleur = enAlerte ? colors.danger : pourcentage < 50 ? colors.warning : colors.success;

  return (
    <View style={[styles.card, enAlerte && styles.cardAlerte]}>
      <View style={styles.header}>
        <Text style={styles.nom}>{item.nom}</Text>
        <View style={[styles.badge, { backgroundColor: couleur + '22' }]}>
          <Text style={[styles.badgeText, { color: couleur }]}>
            {enAlerte ? '⚠ Stock bas' : '✓ Normal'}
          </Text>
        </View>
      </View>

      {/* Barre de progression */}
      <View style={styles.barreContainer}>
        <View style={[styles.barre, { width: `${pourcentage}%`, backgroundColor: couleur }]} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.quantite}>
          <Text style={{ color: couleur, fontWeight: 'bold' }}>{item.quantite_actuelle}</Text>
          <Text style={styles.textSecondary}> / {item.quantite_initiale} {item.unite}</Text>
        </Text>
        <Text style={styles.textSecondary}>Seuil: {item.seuil_alerte} {item.unite}</Text>
        <TouchableOpacity onPress={() => onDelete(item.id)}>
          <Text style={styles.supprimer}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardAlerte: {
    borderColor: colors.danger + '66',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  nom: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  barreContainer: {
    height: 6,
    backgroundColor: colors.cardBorder,
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  barre: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantite: {
    fontSize: 14,
  },
  textSecondary: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  supprimer: {
    fontSize: 18,
  },
});
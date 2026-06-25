// src/screens/DetailAlerte.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';

export default function DetailAlerte({ route, navigation }) {
  const { alerte } = route?.params || {};

  if (!alerte) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Aucun détail disponible</Text>
      </View>
    );
  }

  const couleur = alerte.sous_systeme === 'S1' ? colors.s1Color
    : alerte.sous_systeme === 'S2' ? colors.s2Color
    : colors.s3Color;

  const date = new Date(alerte.created_at).toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.retour}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.titre}>Détail alerte</Text>
      </View>

      <View style={[styles.card, { borderTopColor: couleur }]}>
        <View style={[styles.badge, { backgroundColor: couleur + '22' }]}>
          <Text style={[styles.badgeText, { color: couleur }]}>
            {alerte.sous_systeme}
          </Text>
        </View>
        <Text style={styles.message}>{alerte.message}</Text>
        <Text style={styles.date}>{date}</Text>
        <View style={styles.statutRow}>
          <Text style={styles.statutLabel}>Statut :</Text>
          <Text style={[styles.statut, { color: alerte.lu ? colors.success : colors.warning }]}>
            {alerte.lu ? '✓ Lu' : '● Non lu'}
          </Text>
        </View>
      </View>

      {alerte.photo_url && (
        <View style={styles.photoCard}>
          <Text style={styles.photoTitre}>📸 Photo capturée</Text>
          <Text style={styles.photoSub}>Image disponible sur la caméra</Text>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitre}>ℹ️ Informations</Text>
        {[
          ['Sous-système', alerte.sous_systeme],
          ['Type', alerte.type || 'Alerte automatique'],
          ['ID', `#${alerte.id}`],
        ].map(([label, val]) => (
          <View key={label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoVal}>{val}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  emptyText: { color: colors.textSecondary },
  header: { padding: 24, paddingTop: 60 },
  retour: { color: colors.primary, fontSize: 14, marginBottom: 8 },
  titre: { color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  card: {
    backgroundColor: colors.card, borderRadius: 12,
    margin: 16, padding: 16,
    borderTopWidth: 4, borderWidth: 1, borderColor: colors.cardBorder,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  message: { color: colors.textPrimary, fontSize: 16, lineHeight: 24, marginBottom: 12 },
  date: { color: colors.textSecondary, fontSize: 12, marginBottom: 12 },
  statutRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statutLabel: { color: colors.textSecondary, fontSize: 13 },
  statut: { fontSize: 13, fontWeight: '600' },
  photoCard: {
    backgroundColor: colors.card, borderRadius: 12,
    margin: 16, marginTop: 0, padding: 16,
    borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: 'center', minHeight: 120, justifyContent: 'center',
  },
  photoTitre: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  photoSub: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  infoCard: {
    backgroundColor: colors.card, borderRadius: 12,
    margin: 16, marginTop: 0, padding: 16,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  infoTitre: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  infoLabel: { color: colors.textSecondary, fontSize: 13 },
  infoVal: { color: colors.textPrimary, fontSize: 13, fontWeight: '500' },
});
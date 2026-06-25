// src/screens/Statistiques.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getHistory } from '../api/sensors';
import colors from '../theme/colors';

const { width } = Dimensions.get('window');

export default function Statistiques() {
  const { token } = useAuth();
  const [onglet, setOnglet] = useState('S1');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const chargerHistory = async (systeme) => {
    setLoading(true);
    try {
      const data = await getHistory(token, systeme);
      setHistory(data.historique || []);
    } catch (e) {
      console.log('Erreur history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerHistory(onglet); }, [onglet]);

  // Calcul stats
  const valeurs = history.map(h => {
    if (onglet === 'S1') return h.poids_kg || 0;
    if (onglet === 'S2') return h.debit_lpm || 0;
    if (onglet === 'S3') return h.mouvement ? 1 : 0;
    return 0;
  }).filter(v => v !== null);

  const max = valeurs.length ? Math.max(...valeurs) : 0;
  const min = valeurs.length ? Math.min(...valeurs) : 0;
  const moy = valeurs.length ? (valeurs.reduce((a, b) => a + b, 0) / valeurs.length).toFixed(1) : 0;

  const couleurOnglet = onglet === 'S1' ? colors.s1Color : onglet === 'S2' ? colors.s2Color : colors.s3Color;
  const labelValeur = onglet === 'S1' ? 'kg' : onglet === 'S2' ? 'L/min' : 'mvt';
  const iconeOnglet = onglet === 'S1' ? '📦' : onglet === 'S2' ? '💧' : '🔒';

  // Graphe barre simple
  const barMax = Math.max(...valeurs, 1);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titre}>📊 Statistiques</Text>
        <Text style={styles.sousTitre}>Historique des 20 dernières mesures</Text>
      </View>

      {/* Onglets S1 / S2 / S3 */}
      <View style={styles.onglets}>
        {['S1', 'S2', 'S3'].map(s => {
          const c = s === 'S1' ? colors.s1Color : s === 'S2' ? colors.s2Color : colors.s3Color;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.ongletBtn, onglet === s && { backgroundColor: c + '22', borderColor: c }]}
              onPress={() => setOnglet(s)}
            >
              <Text style={[styles.ongletText, onglet === s && { color: c }]}>
                {s === 'S1' ? '📦 Stockage' : s === 'S2' ? '💧 Eau' : '🔒 Périmètre'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Cartes stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderTopColor: couleurOnglet }]}>
          <Text style={styles.statLabel}>Maximum</Text>
          <Text style={[styles.statValeur, { color: couleurOnglet }]}>{max}</Text>
          <Text style={styles.statUnite}>{labelValeur}</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: couleurOnglet }]}>
          <Text style={styles.statLabel}>Moyenne</Text>
          <Text style={[styles.statValeur, { color: couleurOnglet }]}>{moy}</Text>
          <Text style={styles.statUnite}>{labelValeur}</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: couleurOnglet }]}>
          <Text style={styles.statLabel}>Minimum</Text>
          <Text style={[styles.statValeur, { color: couleurOnglet }]}>{min}</Text>
          <Text style={styles.statUnite}>{labelValeur}</Text>
        </View>
      </View>

      {/* Graphe barres */}
      <View style={styles.grapheCard}>
        <Text style={styles.grapheTitre}>{iconeOnglet} Évolution — {onglet}</Text>
        {loading ? (
          <Text style={styles.loadingText}>Chargement...</Text>
        ) : valeurs.length === 0 ? (
          <Text style={styles.emptyText}>Aucune donnée disponible</Text>
        ) : (
          <View style={styles.barres}>
            {valeurs.slice(-15).map((v, i) => {
              const hauteur = barMax > 0 ? (v / barMax) * 120 : 4;
              return (
                <View key={i} style={styles.barreWrapper}>
                  <Text style={[styles.barreValeur, { color: couleurOnglet }]}>
                    {v > 0 ? v : ''}
                  </Text>
                  <View style={[styles.barre, {
                    height: Math.max(hauteur, 4),
                    backgroundColor: couleurOnglet,
                  }]} />
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Historique liste */}
      <View style={styles.historiqueCard}>
        <Text style={styles.grapheTitre}>📋 Détail des mesures</Text>
        {history.slice(0, 10).map((h, i) => (
          <View key={i} style={styles.historiqueRow}>
            <Text style={styles.historiqueDate}>
              {new Date(h.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit', month: '2-digit',
                hour: '2-digit', minute: '2-digit'
              })}
            </Text>
            <Text style={[styles.historiqueValeur, { color: couleurOnglet }]}>
              {onglet === 'S1' ? `${h.poids_kg} kg`
                : onglet === 'S2' ? `${h.debit_lpm} L/min`
                : h.mouvement ? '⚡ Mouvement' : '✓ Calme'}
            </Text>
            {h.alerte && <Text style={styles.alerteBadge}>⚠</Text>}
          </View>
        ))}
        {history.length === 0 && !loading && (
          <Text style={styles.emptyText}>Aucune mesure enregistrée</Text>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, paddingTop: 60 },
  titre: { color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  sousTitre: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  onglets: {
    flexDirection: 'row', paddingHorizontal: 16,
    gap: 8, marginBottom: 16,
  },
  ongletBtn: {
    flex: 1, paddingVertical: 8, paddingHorizontal: 4,
    borderRadius: 10, borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  ongletText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: 16,
    gap: 8, marginBottom: 16,
  },
  statCard: {
    flex: 1, backgroundColor: colors.card,
    borderRadius: 12, padding: 12,
    borderTopWidth: 3, alignItems: 'center',
  },
  statLabel: { color: colors.textSecondary, fontSize: 10, marginBottom: 4 },
  statValeur: { fontSize: 22, fontWeight: 'bold' },
  statUnite: { color: colors.textMuted, fontSize: 10 },
  grapheCard: {
    backgroundColor: colors.card, borderRadius: 12,
    margin: 16, marginTop: 0, padding: 16,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  grapheTitre: {
    color: colors.textPrimary, fontSize: 14,
    fontWeight: '600', marginBottom: 16,
  },
  barres: {
    flexDirection: 'row', alignItems: 'flex-end',
    height: 140, gap: 4,
  },
  barreWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barreValeur: { fontSize: 7, marginBottom: 2 },
  barre: { width: '100%', borderRadius: 3 },
  loadingText: { color: colors.textSecondary, textAlign: 'center', padding: 20 },
  emptyText: { color: colors.textMuted, textAlign: 'center', padding: 20 },
  historiqueCard: {
    backgroundColor: colors.card, borderRadius: 12,
    margin: 16, marginTop: 0, padding: 16,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  historiqueRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  historiqueDate: { color: colors.textSecondary, fontSize: 11, flex: 1 },
  historiqueValeur: { fontSize: 13, fontWeight: '600' },
  alerteBadge: { fontSize: 14, marginLeft: 8 },
});
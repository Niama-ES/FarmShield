// src/screens/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getStatus } from '../api/sensors';
import StatCard from '../components/StatCard';
import colors from '../theme/colors';

export default function Dashboard() {
  const { token, user, logout } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const chargerStatus = async () => {
    try {
      const data = await getStatus(token);
      setStatus(data);
    } catch (e) {
      console.log('Erreur status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerStatus();
    // Rafraîchit toutes les 30 secondes
    const interval = setInterval(chargerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await chargerStatus();
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.bienvenue}>Bonjour 👋</Text>
          <Text style={styles.nomFerme}>{user?.nom_ferme || 'Ma Ferme'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>⎋</Text>
        </TouchableOpacity>
      </View>

      {/* Statut global */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>STATUT EN TEMPS RÉEL</Text>
        <Text style={styles.sectionSub}>Tirez vers le bas pour actualiser</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <View style={styles.cardsContainer}>
          <StatCard
            label="S1 — Stockage"
            valeur={status?.s1?.poids_kg ?? '—'}
            unite="kg"
            icone="📦"
            couleur={colors.s1Color}
            statut={status?.s1?.alerte ? 'alerte' : status?.s1 ? 'ok' : 'hors-ligne'}
          />
          <StatCard
            label="S2 — Irrigation"
            valeur={status?.s2?.debit_lpm ?? '—'}
            unite="L/min"
            icone="💧"
            couleur={colors.s2Color}
            statut={status?.s2?.alerte ? 'alerte' : status?.s2 ? 'ok' : 'hors-ligne'}
          />
          <StatCard
            label="S3 — Périmètre"
            valeur={status?.s3?.mouvement ? 'Détecté' : 'Calme'}
            unite=""
            icone="🔒"
            couleur={colors.s3Color}
            statut={status?.s3?.alerte ? 'alerte' : status?.s3 ? 'ok' : 'hors-ligne'}
          />
        </View>
      )}

      {/* Météo */}
      {status?.meteo && (
        <View style={styles.meteoCard}>
          <Text style={styles.meteoIcon}>🌤</Text>
          <View>
            <Text style={styles.meteoTitle}>Météo — {status.meteo.ville}</Text>
            <Text style={styles.meteoDetail}>
              {status.meteo.temperature}°C · {status.meteo.description}
            </Text>
            {status.meteo.pluie_prevue && (
              <Text style={styles.meteoPluie}>🌧 Pluie prévue — irrigation annulée</Text>
            )}
          </View>
        </View>
      )}

      {/* Résumé */}
      <View style={styles.resumeCard}>
        <Text style={styles.resumeTitle}>🛡 FarmShield actif</Text>
        <Text style={styles.resumeText}>
          Surveillance continue · Alertes push activées · Mode hors-ligne prêt
        </Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  bienvenue: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  nomFerme: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: colors.card,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  logoutText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  sectionSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  cardsContainer: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  meteoCard: {
    margin: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  meteoIcon: {
    fontSize: 36,
  },
  meteoTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  meteoDetail: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  meteoPluie: {
    color: colors.info,
    fontSize: 12,
    marginTop: 4,
  },
  resumeCard: {
    margin: 16,
    marginTop: 4,
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + '33',
  },
  resumeTitle: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  resumeText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
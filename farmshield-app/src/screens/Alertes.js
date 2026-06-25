// src/screens/Alertes.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getAlertes, marquerLu } from '../api/alerts';
import AlertCard from '../components/AlertCard';
import colors from '../theme/colors';

const FILTRES = ['Tous', 'S1', 'S2', 'S3'];

export default function Alertes() {
  const { token } = useAuth();
  const [alertes, setAlertes] = useState([]);
  const [filtre, setFiltre] = useState('Tous');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const chargerAlertes = async () => {
    try {
      const data = await getAlertes(token, filtre === 'Tous' ? null : filtre);
      setAlertes(data.alertes || []);
    } catch (e) {
      console.log('Erreur alertes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerAlertes(); }, [filtre]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await chargerAlertes();
    setRefreshing(false);
  }, [filtre]);

  const handleMarquerLu = async (id) => {
    try {
      await marquerLu(token, id);
      setAlertes(prev => prev.map(a => a.id === id ? { ...a, lu: true } : a));
    } catch (e) {
      console.log('Erreur marquer lu:', e);
    }
  };

  const nonLues = alertes.filter(a => !a.lu).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titre}>🔔 Alertes</Text>
          <Text style={styles.sousTitre}>
            {nonLues > 0 ? `${nonLues} non lue(s)` : 'Tout est lu'}
          </Text>
        </View>
      </View>

      {/* Filtres */}
      <View style={styles.filtres}>
        {FILTRES.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filtreBtn, filtre === f && styles.filtreBtnActive]}
            onPress={() => setFiltre(f)}
          >
            <Text style={[styles.filtreText, filtre === f && styles.filtreTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste */}
      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : alertes.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>Aucune alerte</Text>
          <Text style={styles.emptyTextSub}>Tout est calme sur la ferme</Text>
        </View>
      ) : (
        <FlatList
          data={alertes}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <AlertCard alerte={item} onMarquerLu={handleMarquerLu} />
          )}
          contentContainerStyle={styles.liste}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, paddingTop: 60 },
  titre: { color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  sousTitre: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  filtres: {
    flexDirection: 'row', paddingHorizontal: 16,
    gap: 8, marginBottom: 8,
  },
  filtreBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filtreBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtreText: { color: colors.textSecondary, fontSize: 13 },
  filtreTextActive: { color: '#fff', fontWeight: 'bold' },
  liste: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textSecondary },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  emptyTextSub: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
});
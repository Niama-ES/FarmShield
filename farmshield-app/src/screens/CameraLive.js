// src/screens/CameraLive.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getCameraStatus } from '../api/camera';
import colors from '../theme/colors';

export default function CameraLive() {
  const { token } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const chargerStatus = async () => {
    try {
      const data = await getCameraStatus(token);
      setStatus(data);
    } catch (e) {
      console.log('Erreur camera:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerStatus(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await chargerStatus();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.titre}>📷 Caméra ESP32-CAM</Text>
        <Text style={styles.sousTitre}>Entrée principale de la ferme</Text>
      </View>

      {/* Flux live */}
      <View style={styles.cameraCard}>
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={styles.cameraText}>
            {loading ? 'Connexion...' : status?.connectee ? 'Flux live disponible' : 'Caméra hors-ligne'}
          </Text>
          {status?.connectee && (
            <Text style={styles.cameraUrl}>{status?.stream_url || 'esp32cam.local/stream'}</Text>
          )}
        </View>
        <View style={styles.cameraInfo}>
          <View style={[styles.dot, { backgroundColor: status?.connectee ? colors.success : colors.danger }]} />
          <Text style={styles.cameraStatut}>
            {status?.connectee ? 'ESP32-CAM connectée' : 'Hors-ligne'}
          </Text>
        </View>
      </View>

      {/* Dernier clip */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>DERNIER CLIP CAPTURÉ</Text>
        <View style={styles.card}>
          {status?.dernier_clip ? (
            <>
              <Text style={styles.clipDate}>
                📹 {new Date(status.dernier_clip).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: '2-digit',
                  hour: '2-digit', minute: '2-digit'
                })}
              </Text>
              <TouchableOpacity style={styles.btnVoir}>
                <Text style={styles.btnVoirText}>▶ Voir le clip</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.emptyText}>Aucun clip enregistré</Text>
          )}
        </View>
      </View>

      {/* Infos caméra */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>INFORMATIONS</Text>
        <View style={styles.card}>
          {[
            ['Modèle', 'ESP32-CAM AI-Thinker'],
            ['Résolution', '1600×1200 UXGA'],
            ['Vision nocturne', 'IR intégré'],
            ['Déclencheur', 'PIR HC-SR501'],
            ['Durée clip', '30 secondes'],
          ].map(([label, val]) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoVal}>{val}</Text>
            </View>
          ))}
        </View>
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
  cameraCard: {
    backgroundColor: colors.card, borderRadius: 12,
    margin: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  cameraPlaceholder: {
    height: 200, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#050e05',
  },
  cameraIcon: { fontSize: 48, marginBottom: 8 },
  cameraText: { color: colors.textSecondary, fontSize: 14 },
  cameraUrl: { color: colors.primary, fontSize: 11, marginTop: 4 },
  cameraInfo: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cameraStatut: { color: colors.textSecondary, fontSize: 13 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitre: {
    color: colors.textMuted, fontSize: 11,
    letterSpacing: 2, fontWeight: 'bold', marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: colors.cardBorder,
  },
  clipDate: { color: colors.textPrimary, fontSize: 14, marginBottom: 12 },
  btnVoir: {
    backgroundColor: colors.primary, borderRadius: 10,
    padding: 12, alignItems: 'center',
  },
  btnVoirText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { color: colors.textMuted, textAlign: 'center', padding: 8 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  infoLabel: { color: colors.textSecondary, fontSize: 13 },
  infoVal: { color: colors.textPrimary, fontSize: 13, fontWeight: '500' },
});
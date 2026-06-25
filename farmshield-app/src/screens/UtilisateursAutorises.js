// src/screens/UtilisateursAutorises.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, RefreshControl
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getVisages, addVisage, bloquerVisage, deleteVisage } from '../api/faces';
import colors from '../theme/colors';

export default function UtilisateursAutorises() {
  const { token } = useAuth();
  const [visages, setVisages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [nom, setNom] = useState('');

  const chargerVisages = async () => {
    try {
      const data = await getVisages(token);
      setVisages(data.visages || []);
    } catch (e) {
      console.log('Erreur visages:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerVisages(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await chargerVisages();
    setRefreshing(false);
  }, []);

  const handleAjouter = async () => {
    if (!nom) {
      Alert.alert('Erreur', 'Le nom est obligatoire.');
      return;
    }
    try {
      const data = await addVisage(token, nom, null);
      if (data.visage) {
        setVisages(prev => [...prev, data.visage]);
        setModalVisible(false);
        setNom('');
      } else {
        Alert.alert('Erreur', data.erreur || 'Ajout échoué.');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de contacter le serveur.');
    }
  };

  const handleBloquer = async (id, estBloquer) => {
    Alert.alert(
      'Confirmation',
      estBloquer ? 'Débloquer cette personne ?' : 'Bloquer cette personne ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await bloquerVisage(token, id);
              setVisages(prev =>
                prev.map(v => v.id === id ? { ...v, bloque: !v.bloque } : v)
              );
            } catch (e) {
              Alert.alert('Erreur', 'Action échouée.');
            }
          }
        }
      ]
    );
  };

  const handleSupprimer = (id) => {
    Alert.alert('Confirmation', 'Supprimer cette personne ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            await deleteVisage(token, id);
            setVisages(prev => prev.filter(v => v.id !== id));
          } catch (e) {
            Alert.alert('Erreur', 'Suppression échouée.');
          }
        }
      }
    ]);
  };

  const renderVisage = ({ item }) => (
    <View style={[styles.card, item.bloque && styles.cardBloque]}>
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, { backgroundColor: item.bloque ? colors.danger + '22' : colors.primary + '22' }]}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <View>
          <Text style={styles.nom}>{item.nom}</Text>
          <Text style={styles.statut}>
            {item.bloque ? '🔴 Bloqué' : '🟢 Autorisé'}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: item.bloque ? colors.success + '22' : colors.warning + '22' }]}
          onPress={() => handleBloquer(item.id, item.bloque)}
        >
          <Text style={{ fontSize: 16 }}>{item.bloque ? '✓' : '⊘'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.danger + '22' }]}
          onPress={() => handleSupprimer(item.id)}
        >
          <Text style={{ fontSize: 16 }}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titre}>👥 Personnes autorisées</Text>
          <Text style={styles.sousTitre}>
            {visages.filter(v => !v.bloque).length} autorisées · {visages.filter(v => v.bloque).length} bloquées
          </Text>
        </View>
        <TouchableOpacity style={styles.btnAjouter} onPress={() => setModalVisible(true)}>
          <Text style={styles.btnAjouterText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          🤖 La caméra ESP32-CAM reconnaît automatiquement les visages enregistrés ici.
          Les inconnus déclenchent une alerte immédiate.
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : visages.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>Aucune personne enregistrée</Text>
          <Text style={styles.emptyTextSub}>Ajoutez les membres autorisés</Text>
        </View>
      ) : (
        <FlatList
          data={visages}
          keyExtractor={item => item.id.toString()}
          renderItem={renderVisage}
          contentContainerStyle={styles.liste}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitre}>Ajouter une personne</Text>
            <Text style={styles.modalSub}>
              Entrez le nom — les photos seront ajoutées par Noura via le dossier visages_autorises/ sur le PC IA.
            </Text>
            <Text style={styles.label}>Nom complet</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Ahmed Benali"
              placeholderTextColor={colors.textMuted}
              value={nom}
              onChangeText={setNom}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnAnnuler} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnAnnulerText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmer} onPress={handleAjouter}>
                <Text style={styles.btnConfirmerText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 24, paddingTop: 60,
  },
  titre: { color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  sousTitre: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  btnAjouter: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
  },
  btnAjouterText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  infoCard: {
    backgroundColor: colors.primary + '11',
    borderLeftWidth: 3, borderLeftColor: colors.primary,
    marginHorizontal: 16, marginBottom: 8,
    padding: 10, borderRadius: 8,
  },
  infoText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  liste: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textSecondary },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  emptyTextSub: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: colors.card, borderRadius: 12,
    padding: 14, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  cardBloque: { borderColor: colors.danger + '44', opacity: 0.8 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 22 },
  nom: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  statut: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitre: { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  modalSub: { color: colors.textSecondary, fontSize: 12, marginBottom: 20, lineHeight: 18 },
  label: {
    color: colors.textSecondary, fontSize: 12,
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.background, borderRadius: 10,
    padding: 14, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 14,
  },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnAnnuler: {
    flex: 1, padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center',
  },
  btnAnnulerText: { color: colors.textSecondary, fontWeight: '600' },
  btnConfirmer: {
    flex: 1, padding: 14, borderRadius: 10,
    backgroundColor: colors.primary, alignItems: 'center',
  },
  btnConfirmerText: { color: '#fff', fontWeight: 'bold' },
});
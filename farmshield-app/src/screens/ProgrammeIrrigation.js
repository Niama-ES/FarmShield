// src/screens/ProgrammeIrrigation.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, RefreshControl, Alert, Switch
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getProgrammes, createProgramme, updateProgramme, deleteProgramme } from '../api/irrigation';
import colors from '../theme/colors';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function ProgrammeIrrigation() {
  const { token } = useAuth();
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Champs formulaire
  const [parcelle, setParcelle] = useState('');
  const [jour, setJour] = useState('Lundi');
  const [heure, setHeure] = useState('06:00');
  const [duree, setDuree] = useState('');
  const [volume, setVolume] = useState('');

  const chargerProgrammes = async () => {
    try {
      const data = await getProgrammes(token);
      setProgrammes(data.programmes || []);
    } catch (e) {
      console.log('Erreur irrigation:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerProgrammes(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await chargerProgrammes();
    setRefreshing(false);
  }, []);

  const handleCreer = async () => {
    if (!parcelle || !duree || !volume) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires.');
      return;
    }
    try {
      const data = await createProgramme(token, {
        parcelle,
        jour_semaine: jour,
        heure_debut: heure,
        duree_minutes: parseInt(duree),
        volume_prevu: parseFloat(volume),
      });
      if (data.programme) {
        setProgrammes(prev => [...prev, data.programme]);
        setModalVisible(false);
        setParcelle(''); setDuree(''); setVolume('');
      } else {
        Alert.alert('Erreur', data.erreur || 'Création échouée.');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de contacter le serveur.');
    }
  };

  const handleToggle = async (prog) => {
    try {
      await updateProgramme(token, prog.id, { actif: !prog.actif });
      setProgrammes(prev =>
        prev.map(p => p.id === prog.id ? { ...p, actif: !p.actif } : p)
      );
    } catch (e) {
      Alert.alert('Erreur', 'Mise à jour échouée.');
    }
  };

  const handleSupprimer = (id) => {
    Alert.alert('Confirmation', 'Supprimer ce programme ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          await deleteProgramme(token, id);
          setProgrammes(prev => prev.filter(p => p.id !== id));
        }
      }
    ]);
  };

  const renderProgramme = ({ item }) => (
    <View style={[styles.card, !item.actif && styles.cardInactif]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardParcelle}>{item.parcelle}</Text>
          <Text style={styles.cardDetail}>
            {item.jour_semaine} · {item.heure_debut} · {item.duree_minutes} min · {item.volume_prevu} L
          </Text>
        </View>
        <Switch
          value={item.actif}
          onValueChange={() => handleToggle(item)}
          trackColor={{ false: colors.cardBorder, true: colors.primary + '66' }}
          thumbColor={item.actif ? colors.primary : colors.textMuted}
        />
      </View>
      <View style={styles.cardFooter}>
        <View style={[styles.badge, { backgroundColor: item.actif ? colors.primary + '22' : colors.cardBorder }]}>
          <Text style={[styles.badgeText, { color: item.actif ? colors.primary : colors.textMuted }]}>
            {item.actif ? '✓ Actif' : '○ Inactif'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleSupprimer(item.id)}>
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titre}>💧 Irrigation</Text>
          <Text style={styles.sousTitre}>
            {programmes.filter(p => p.actif).length} actifs · {programmes.length} total
          </Text>
        </View>
        <TouchableOpacity style={styles.btnAjouter} onPress={() => setModalVisible(true)}>
          <Text style={styles.btnAjouterText}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>

      {/* Info météo */}
      <View style={styles.meteoInfo}>
        <Text style={styles.meteoInfoText}>
          🌤 La vanne se ferme automatiquement si pluie prévue par météo
        </Text>
      </View>

      {/* Liste */}
      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : programmes.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>💧</Text>
          <Text style={styles.emptyText}>Aucun programme d'irrigation</Text>
          <Text style={styles.emptyTextSub}>Appuyez sur "+ Nouveau" pour créer</Text>
        </View>
      ) : (
        <FlatList
          data={programmes}
          keyExtractor={item => item.id.toString()}
          renderItem={renderProgramme}
          contentContainerStyle={styles.liste}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}

      {/* Modal création */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitre}>Nouveau programme</Text>

            <Text style={styles.label}>Parcelle</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Parcelle A, Zone Nord..."
              placeholderTextColor={colors.textMuted}
              value={parcelle}
              onChangeText={setParcelle}
            />

            <Text style={styles.label}>Jour de la semaine</Text>
            <View style={styles.joursContainer}>
              {JOURS.map(j => (
                <TouchableOpacity
                  key={j}
                  style={[styles.jourBtn, jour === j && styles.jourBtnActive]}
                  onPress={() => setJour(j)}
                >
                  <Text style={[styles.jourText, jour === j && styles.jourTextActive]}>
                    {j.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Heure de début</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 06:00"
              placeholderTextColor={colors.textMuted}
              value={heure}
              onChangeText={setHeure}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Durée (minutes)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 60"
                  placeholderTextColor={colors.textMuted}
                  value={duree}
                  onChangeText={setDuree}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Volume prévu (L)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 500"
                  placeholderTextColor={colors.textMuted}
                  value={volume}
                  onChangeText={setVolume}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnAnnuler} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnAnnulerText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmer} onPress={handleCreer}>
                <Text style={styles.btnConfirmerText}>Créer</Text>
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
    backgroundColor: colors.s2Color,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
  },
  btnAjouterText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  meteoInfo: {
    backgroundColor: colors.info + '15',
    borderLeftWidth: 3, borderLeftColor: colors.info,
    marginHorizontal: 16, marginBottom: 8,
    padding: 10, borderRadius: 8,
  },
  meteoInfoText: { color: colors.info, fontSize: 12 },
  liste: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textSecondary },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  emptyTextSub: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: colors.card, borderRadius: 12,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  cardInactif: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardParcelle: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  cardDetail: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 12,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  deleteIcon: { fontSize: 18 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitre: { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  label: {
    color: colors.textSecondary, fontSize: 12,
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.background, borderRadius: 10,
    padding: 14, color: colors.textPrimary, fontSize: 15,
    borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 14,
  },
  joursContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  jourBtn: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: colors.cardBorder,
  },
  jourBtnActive: { backgroundColor: colors.s2Color, borderColor: colors.s2Color },
  jourText: { color: colors.textSecondary, fontSize: 12 },
  jourTextActive: { color: '#fff', fontWeight: 'bold' },
  row: { flexDirection: 'row' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnAnnuler: {
    flex: 1, padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center',
  },
  btnAnnulerText: { color: colors.textSecondary, fontWeight: '600' },
  btnConfirmer: {
    flex: 1, padding: 14, borderRadius: 10,
    backgroundColor: colors.s2Color, alignItems: 'center',
  },
  btnConfirmerText: { color: '#fff', fontWeight: 'bold' },
});
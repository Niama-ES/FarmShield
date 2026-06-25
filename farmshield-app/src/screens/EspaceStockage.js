// src/screens/EspaceStockage.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, RefreshControl, Alert, ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getStock, addItem, deleteItem } from '../api/stock';
import StockItemCard from '../components/StockItemCard';
import colors from '../theme/colors';

export default function EspaceStockage() {
  const { token } = useAuth();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Champs du formulaire ajout
  const [nom, setNom] = useState('');
  const [quantite, setQuantite] = useState('');
  const [unite, setUnite] = useState('');
  const [seuil, setSeuil] = useState('');

  const chargerStock = async () => {
    try {
      const data = await getStock(token);
      setStock(data.stock || []);
    } catch (e) {
      console.log('Erreur stock:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerStock(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await chargerStock();
    setRefreshing(false);
  }, []);

  const handleAjouter = async () => {
    if (!nom || !quantite || !unite || !seuil) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires.');
      return;
    }
    try {
      const data = await addItem(token, nom, parseFloat(quantite), unite, parseFloat(seuil));
      if (data.article) {
        setStock(prev => [data.article, ...prev]);
        setModalVisible(false);
        setNom(''); setQuantite(''); setUnite(''); setSeuil('');
      } else {
        Alert.alert('Erreur', data.erreur || 'Ajout échoué.');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de contacter le serveur.');
    }
  };

  const handleSupprimer = async (id) => {
    Alert.alert('Confirmation', 'Supprimer cet article ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(token, id);
            setStock(prev => prev.filter(item => item.id !== id));
          } catch (e) {
            Alert.alert('Erreur', 'Suppression échouée.');
          }
        }
      }
    ]);
  };

  const articlesEnAlerte = stock.filter(i => i.quantite_actuelle <= i.seuil_alerte);

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titre}>📦 Espace Stockage</Text>
          <Text style={styles.sousTitre}>{stock.length} articles · {articlesEnAlerte.length} en alerte</Text>
        </View>
        <TouchableOpacity style={styles.btnAjouter} onPress={() => setModalVisible(true)}>
          <Text style={styles.btnAjouterText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Bannière alerte */}
      {articlesEnAlerte.length > 0 && (
        <View style={styles.alerteBanner}>
          <Text style={styles.alerteText}>
            ⚠ {articlesEnAlerte.length} article(s) sous le seuil d'alerte
          </Text>
        </View>
      )}

      {/* Liste */}
      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : stock.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>Aucun article dans le stock</Text>
          <Text style={styles.emptyTextSub}>Appuyez sur "+ Ajouter" pour commencer</Text>
        </View>
      ) : (
        <FlatList
          data={stock}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <StockItemCard item={item} onDelete={handleSupprimer} />
          )}
          contentContainerStyle={styles.liste}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}

      {/* Modal ajout */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitre}>Ajouter un article</Text>

            <Text style={styles.label}>Nom de l'article</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Pesticide, L3alf, Carburant..."
              placeholderTextColor={colors.textMuted}
              value={nom}
              onChangeText={setNom}
            />

            <Text style={styles.label}>Quantité initiale</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 50"
              placeholderTextColor={colors.textMuted}
              value={quantite}
              onChangeText={setQuantite}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Unité</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: kg, L, sac..."
              placeholderTextColor={colors.textMuted}
              value={unite}
              onChangeText={setUnite}
            />

            <Text style={styles.label}>Seuil d'alerte</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 10 (alerte si quantité < 10)"
              placeholderTextColor={colors.textMuted}
              value={seuil}
              onChangeText={setSeuil}
              keyboardType="numeric"
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.btnAnnuler}
                onPress={() => setModalVisible(false)}
              >
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
  titre: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  sousTitre: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  btnAjouter: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnAjouterText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  alerteBanner: {
    backgroundColor: colors.danger + '22',
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
  },
  alerteText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  liste: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTextSub: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000AA',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitre: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    color: colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 14,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btnAnnuler: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  btnAnnulerText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  btnConfirmer: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  btnConfirmerText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
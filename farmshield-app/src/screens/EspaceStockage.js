// src/screens/EspaceStockage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, RefreshControl, Alert, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getStock, addItem, deleteItem } from '../api/stock';

// ── Carte article ─────────────────────────────────────────────────────────────
function StockItemCard({ item, onDelete, colors }) {
  const pourcentage = Math.min(Math.round((item.quantite_actuelle / item.quantite_initiale) * 100), 100);
  const enAlerte    = item.quantite_actuelle <= item.seuil_alerte;
  const couleur     = enAlerte ? '#E05C6A' : pourcentage < 50 ? colors.warning : colors.primary;

  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barAnim, { toValue: pourcentage / 100, duration: 800, useNativeDriver: false }).start();
  }, [pourcentage]);

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[
      s.card,
      { backgroundColor: colors.card, borderColor: enAlerte ? '#E05C6A33' : colors.cardBorder },
      enAlerte && { borderColor: '#E05C6A66' },
    ]}>
      {/* Bande top colorée */}
      <View style={[s.cardTopStripe, { backgroundColor: couleur }]} />

      <View style={s.cardInner}>
        {/* Haut */}
        <View style={s.cardHeader}>
          <View style={[s.cardIconCircle, { backgroundColor: couleur + '18' }]}>
            <Ionicons name="cube-outline" size={24} color={couleur} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.cardNom, { color: colors.textPrimary }]}>{item.nom}</Text>
            <Text style={[s.cardUnite, { color: colors.textMuted }]}>{item.unite}</Text>
          </View>
          <View style={[s.badgePill, { backgroundColor: couleur + '18', borderColor: couleur + '44' }]}>
            <View style={[s.badgeDot, { backgroundColor: couleur }]} />
            <Text style={[s.badgeText, { color: couleur }]}>
              {enAlerte ? 'Stock bas' : pourcentage < 50 ? 'Moyen' : 'Normal'}
            </Text>
          </View>
        </View>

        {/* Chiffres */}
        <View style={s.chiffresRow}>
          <View style={s.chiffreItem}>
            <Text style={[s.chiffreVal, { color: couleur }]}>{item.quantite_actuelle}</Text>
            <Text style={[s.chiffreLabel, { color: colors.textMuted }]}>Restant</Text>
          </View>
          <View style={[s.chiffreSep, { backgroundColor: colors.cardBorder }]} />
          <View style={s.chiffreItem}>
            <Text style={[s.chiffreVal, { color: colors.textPrimary }]}>{item.quantite_initiale}</Text>
            <Text style={[s.chiffreLabel, { color: colors.textMuted }]}>Initial</Text>
          </View>
          <View style={[s.chiffreSep, { backgroundColor: colors.cardBorder }]} />
          <View style={s.chiffreItem}>
            <Text style={[s.chiffreVal, { color: colors.warning }]}>{item.seuil_alerte}</Text>
            <Text style={[s.chiffreLabel, { color: colors.textMuted }]}>Seuil</Text>
          </View>
          <View style={[s.chiffreSep, { backgroundColor: colors.cardBorder }]} />
          <View style={s.chiffreItem}>
            <Text style={[s.chiffreVal, { color: couleur }]}>{pourcentage}%</Text>
            <Text style={[s.chiffreLabel, { color: colors.textMuted }]}>Stock</Text>
          </View>
        </View>

        {/* Barre de progression */}
        <View style={[s.barreContainer, { backgroundColor: colors.cardBorder }]}>
          <Animated.View style={[s.barre, { width: barWidth, backgroundColor: couleur }]} />
        </View>

        {/* Bas */}
        <View style={s.cardBottom}>
          <Text style={[s.cardBottomText, { color: colors.textMuted }]}>
            Seuil d'alerte : {item.seuil_alerte} {item.unite}
          </Text>
          <TouchableOpacity
            style={[s.deleteBtn, { backgroundColor: '#E05C6A15', borderColor: '#E05C6A33' }]}
            onPress={() => onDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={15} color="#E05C6A" />
            <Text style={s.deleteBtnText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────
export default function EspaceStockage({ navigation }) {
  const { colors }  = useTheme();
  const { token }   = useAuth();
  const [stock,        setStock]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [nom,          setNom]          = useState('');
  const [quantite,     setQuantite]     = useState('');
  const [unite,        setUnite]        = useState('');
  const [seuil,        setSeuil]        = useState('');

  const chargerStock = async () => {
    try {
      const data = await getStock(token);
      setStock(data.stock || []);
    } catch (e) { console.log('Erreur stock:', e); }
    finally     { setLoading(false); }
  };

  useEffect(() => { chargerStock(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await chargerStock(); setRefreshing(false);
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
    } catch { Alert.alert('Erreur', 'Impossible de contacter le serveur.'); }
  };

  const handleSupprimer = (id) => {
    Alert.alert('Supprimer', 'Retirer cet article du stock ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await deleteItem(token, id);
        setStock(prev => prev.filter(item => item.id !== id));
      }},
    ]);
  };

  const articlesEnAlerte = stock.filter(i => i.quantite_actuelle <= i.seuil_alerte);
  const totalItems       = stock.length;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>

      {/* ── Header ── */}
      <View style={[s.headerBg, { backgroundColor: colors.primary }]}>
        <View style={s.headerCircle1} />
        <View style={s.headerCircle2} />

        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.retourBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.btnAjouter}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={[s.btnAjouterText, { color: colors.primary }]}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        <View style={s.headerContent}>
          <Text style={s.headerTitre}>Espace Stockage</Text>
          <Text style={s.headerSub}>Gestion des articles agricoles</Text>
        </View>

        {/* Stats rapides dans le header */}
        <View style={s.headerStats}>
          {[
            { val: totalItems,              label: 'Articles',   icon: 'cube-outline'    },
            { val: articlesEnAlerte.length, label: 'En alerte',  icon: 'warning-outline' },
            { val: totalItems - articlesEnAlerte.length, label: 'Normaux', icon: 'checkmark-circle-outline' },
          ].map((item, i) => (
            <View key={i} style={[s.headerStat, i < 2 && { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name={item.icon} size={16} color="rgba(255,255,255,0.8)" />
              <Text style={s.headerStatVal}>{item.val}</Text>
              <Text style={s.headerStatLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Bannière alerte ── */}
      {articlesEnAlerte.length > 0 && (
        <View style={s.alerteBanner}>
          <Ionicons name="warning-outline" size={16} color="#E05C6A" />
          <Text style={s.alerteText}>
            {articlesEnAlerte.length} article(s) sous le seuil d'alerte — réapprovisionnement recommandé
          </Text>
        </View>
      )}

      {/* ── Liste ── */}
      {loading ? (
        <View style={s.center}>
          <Ionicons name="sync-outline" size={32} color={colors.textMuted} />
          <Text style={[s.loadingText, { color: colors.textSecondary }]}>Chargement…</Text>
        </View>
      ) : stock.length === 0 ? (
        <View style={s.center}>
          <View style={[s.emptyIconBox, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="cube-outline" size={44} color={colors.primary} />
          </View>
          <Text style={[s.emptyText,    { color: colors.textPrimary }]}>Aucun article dans le stock</Text>
          <Text style={[s.emptyTextSub, { color: colors.textSecondary }]}>Appuyez sur "Ajouter" pour commencer</Text>
        </View>
      ) : (
        <FlatList
          data={stock}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <StockItemCard item={item} onDelete={handleSupprimer} colors={colors} />}
          contentContainerStyle={s.liste}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        />
      )}

      {/* ── Modal ajout ── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.card }]}>

            <View style={s.modalHandleRow}>
              <View style={[s.modalHandle, { backgroundColor: colors.cardBorder }]} />
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={s.modalIconHeader}>
              <View style={[s.modalIconBox, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '33' }]}>
                <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
              </View>
              <Text style={[s.modalTitre, { color: colors.textPrimary }]}>Nouvel article</Text>
              <Text style={[s.modalSub, { color: colors.textSecondary }]}>
                Ajoutez un article à surveiller dans votre stock
              </Text>
            </View>

            <Text style={[s.label, { color: colors.textMuted }]}>NOM DE L'ARTICLE</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.cardBorder }]}
              placeholder="Ex: Pesticide, L3alf, Carburant…"
              placeholderTextColor={colors.textMuted}
              value={nom} onChangeText={setNom}
            />

            <View style={s.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[s.label, { color: colors.textMuted }]}>QUANTITÉ INITIALE</Text>
                <TextInput
                  style={[s.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.cardBorder }]}
                  placeholder="Ex: 50"
                  placeholderTextColor={colors.textMuted}
                  value={quantite} onChangeText={setQuantite} keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: colors.textMuted }]}>UNITÉ</Text>
                <TextInput
                  style={[s.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.cardBorder }]}
                  placeholder="kg, L, sac…"
                  placeholderTextColor={colors.textMuted}
                  value={unite} onChangeText={setUnite}
                />
              </View>
            </View>

            <Text style={[s.label, { color: colors.textMuted }]}>SEUIL D'ALERTE</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.cardBorder }]}
              placeholder="Ex: 10 (alerte si quantité < 10)"
              placeholderTextColor={colors.textMuted}
              value={seuil} onChangeText={setSeuil} keyboardType="numeric"
            />

            <View style={s.modalBtns}>
              <TouchableOpacity
                style={[s.btnAnnuler, { borderColor: colors.cardBorder }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[s.btnAnnulerText, { color: colors.textSecondary }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnConfirmer, { backgroundColor: colors.primary }]}
                onPress={handleAjouter}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={s.btnConfirmerText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ── Styles statiques uniquement ───────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },

  // Header coloré
  headerBg: { paddingTop: 56, paddingBottom: 0, paddingHorizontal: 20, overflow: 'hidden', position: 'relative' },
  headerCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -40 },
  headerCircle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60,  backgroundColor: 'rgba(255,255,255,0.05)', bottom: 10, left: -30 },
  headerTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  retourBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  btnAjouter:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  btnAjouterText:{ fontWeight: 'bold', fontSize: 13 },
  headerContent: { marginBottom: 20 },
  headerTitre:   { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerSub:     { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  headerStats:   { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, marginBottom: 20, overflow: 'hidden' },
  headerStat:    { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
  headerStatVal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerStatLabel:{ color: 'rgba(255,255,255,0.75)', fontSize: 10, letterSpacing: 0.5 },

  // Alerte banner
  alerteBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E05C6A15', borderLeftWidth: 3, borderLeftColor: '#E05C6A', marginHorizontal: 16, marginTop: 12, marginBottom: 4, padding: 10, borderRadius: 10 },
  alerteText:   { color: '#E05C6A', fontSize: 12, fontWeight: '500', flex: 1 },

  liste:        { padding: 16, paddingBottom: 40, gap: 12 },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyText:    { fontSize: 16, fontWeight: '600' },
  emptyTextSub: { fontSize: 13 },
  loadingText:  { fontSize: 13, marginTop: 8 },

  // Carte article
  card:          { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  cardTopStripe: { height: 4 },
  cardInner:     { padding: 16 },
  cardHeader:    { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIconCircle:{ width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardNom:       { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardUnite:     { fontSize: 11 },
  badgePill:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  badgeDot:      { width: 5, height: 5, borderRadius: 3 },
  badgeText:     { fontSize: 11, fontWeight: '700' },

  chiffresRow:   { flexDirection: 'row', marginBottom: 14 },
  chiffreItem:   { flex: 1, alignItems: 'center', gap: 2 },
  chiffreSep:    { width: 1, marginVertical: 4 },
  chiffreVal:    { fontSize: 16, fontWeight: 'bold' },
  chiffreLabel:  { fontSize: 9, letterSpacing: 0.5 },

  barreContainer:{ height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 14 },
  barre:         { height: '100%', borderRadius: 3 },

  cardBottom:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBottomText:{ fontSize: 11 },
  deleteBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  deleteBtnText: { color: '#E05C6A', fontSize: 12, fontWeight: '600' },

  // Modal
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard:      { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 },
  modalHandleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalHandle:    { width: 40, height: 4, borderRadius: 2 },
  modalIconHeader:{ alignItems: 'center', marginBottom: 24, gap: 8 },
  modalIconBox:   { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  modalTitre:     { fontSize: 18, fontWeight: 'bold' },
  modalSub:       { fontSize: 12, textAlign: 'center' },
  label:          { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
  input:          { borderRadius: 12, padding: 14, fontSize: 14, borderWidth: 1, marginBottom: 14 },
  row:            { flexDirection: 'row' },
  modalBtns:      { flexDirection: 'row', gap: 12, marginTop: 4 },
  btnAnnuler:     { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  btnAnnulerText: { fontWeight: '600' },
  btnConfirmer:   { flex: 2, padding: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  btnConfirmerText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
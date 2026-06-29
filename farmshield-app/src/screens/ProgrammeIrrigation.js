// src/screens/ProgrammeIrrigation.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, RefreshControl, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getProgrammes, createProgramme, updateProgramme, deleteProgramme } from '../api/irrigation';

const S2_COLOR = '#3498DB';
const JOURS    = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const JOURS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ── Carte programme ───────────────────────────────────────────────────────────
function ProgrammeCard({ item, onToggle, onDelete, colors }) {
  const actif = item.actif;

  return (
    <View style={[
      c.card,
      { backgroundColor: colors.card, borderColor: actif ? S2_COLOR + '44' : colors.cardBorder },
      actif && { backgroundColor: S2_COLOR + '08' },
    ]}>
      {/* Bande latérale */}
      <View style={[c.cardStripe, { backgroundColor: actif ? S2_COLOR : colors.cardBorder }]} />

      <View style={c.cardBody}>
        {/* Haut */}
        <View style={c.cardTop}>
          <View style={[c.cardIconCircle, { backgroundColor: actif ? S2_COLOR + '20' : colors.cardBorder }]}>
            <Ionicons name="water-outline" size={22} color={actif ? S2_COLOR : colors.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[c.cardParcelle, { color: colors.textPrimary }]}>{item.parcelle}</Text>
            <View style={c.cardMetaRow}>
              <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
              <Text style={[c.cardMeta, { color: colors.textSecondary }]}>{item.jour_semaine}</Text>
              <Text style={[c.cardMetaDot, { color: colors.textMuted }]}>·</Text>
              <Ionicons name="time-outline" size={11} color={colors.textMuted} />
              <Text style={[c.cardMeta, { color: colors.textSecondary }]}>{item.heure_debut}</Text>
            </View>
          </View>
          <Switch
            value={actif}
            onValueChange={() => onToggle(item)}
            trackColor={{ false: colors.cardBorder, true: S2_COLOR + '66' }}
            thumbColor={actif ? S2_COLOR : colors.textMuted}
          />
        </View>

        {/* Stats */}
        <View style={[c.statsRow, { backgroundColor: actif ? S2_COLOR + '0F' : colors.background, borderColor: actif ? S2_COLOR + '22' : colors.cardBorder }]}>
          {[
            { icon: 'timer-outline',  label: 'Durée',   val: `${item.duree_minutes} min` },
            { icon: 'flask-outline',  label: 'Volume',  val: `${item.volume_prevu} L` },
            { icon: 'checkmark-circle-outline', label: 'Statut', val: actif ? 'Actif' : 'Inactif' },
          ].map((stat, i) => (
            <View key={i} style={[c.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: actif ? S2_COLOR + '22' : colors.cardBorder }]}>
              <Ionicons name={stat.icon} size={14} color={actif ? S2_COLOR : colors.textMuted} />
              <Text style={[c.statVal, { color: actif ? colors.textPrimary : colors.textMuted }]}>{stat.val}</Text>
              <Text style={[c.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Bas */}
        <View style={c.cardBottom}>
          <View style={[c.activePill, {
            backgroundColor: actif ? S2_COLOR + '18' : colors.cardBorder,
            borderColor:     actif ? S2_COLOR + '44' : colors.cardBorder,
          }]}>
            <View style={[c.activePillDot, { backgroundColor: actif ? S2_COLOR : colors.textMuted }]} />
            <Text style={[c.activePillText, { color: actif ? S2_COLOR : colors.textMuted }]}>
              {actif ? 'Programme actif' : 'Programme inactif'}
            </Text>
          </View>
          <TouchableOpacity
            style={[c.deleteBtn, { backgroundColor: '#E05C6A15', borderColor: '#E05C6A33' }]}
            onPress={() => onDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={14} color="#E05C6A" />
            <Text style={c.deleteBtnText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────
export default function ProgrammeIrrigation({ navigation }) {
  const { colors }  = useTheme();
  const { token }   = useAuth();
  const [programmes,   setProgrammes]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [parcelle,     setParcelle]     = useState('');
  const [jour,         setJour]         = useState('Lundi');
  const [heure,        setHeure]        = useState('06:00');
  const [duree,        setDuree]        = useState('');
  const [volume,       setVolume]       = useState('');

  const chargerProgrammes = async () => {
    try {
      const data = await getProgrammes(token);
      setProgrammes(data.programmes || []);
    } catch (e) { console.log('Erreur irrigation:', e); }
    finally     { setLoading(false); }
  };

  useEffect(() => { chargerProgrammes(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await chargerProgrammes(); setRefreshing(false);
  }, []);

  const handleCreer = async () => {
    if (!parcelle || !duree || !volume) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires.'); return;
    }
    try {
      const data = await createProgramme(token, {
        parcelle, jour_semaine: jour,
        heure_debut: heure,
        duree_minutes: parseInt(duree),
        volume_prevu:  parseFloat(volume),
      });
      if (data.programme) {
        setProgrammes(prev => [...prev, data.programme]);
        setModalVisible(false);
        setParcelle(''); setDuree(''); setVolume('');
      } else { Alert.alert('Erreur', data.erreur || 'Création échouée.'); }
    } catch { Alert.alert('Erreur', 'Impossible de contacter le serveur.'); }
  };

  const handleToggle = async (prog) => {
    try {
      await updateProgramme(token, prog.id, { actif: !prog.actif });
      setProgrammes(prev => prev.map(p => p.id === prog.id ? { ...p, actif: !p.actif } : p));
    } catch { Alert.alert('Erreur', 'Mise à jour échouée.'); }
  };

  const handleSupprimer = (id) => {
    Alert.alert('Supprimer', 'Supprimer ce programme d\'irrigation ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await deleteProgramme(token, id);
        setProgrammes(prev => prev.filter(p => p.id !== id));
      }},
    ]);
  };

  const actifs = programmes.filter(p => p.actif).length;

  return (
    <View style={[c.container, { backgroundColor: colors.background }]}>

      {/* ── Header coloré ── */}
      <View style={[c.headerBg, { backgroundColor: S2_COLOR }]}>
        <View style={c.headerCircle1} />
        <View style={c.headerCircle2} />

        <View style={c.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={c.retourBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={c.btnAjouter} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={18} color={S2_COLOR} />
            <Text style={[c.btnAjouterText, { color: S2_COLOR }]}>Nouveau</Text>
          </TouchableOpacity>
        </View>

        <View style={c.headerContent}>
          <Text style={c.headerTitre}>Irrigation</Text>
          <Text style={c.headerSub}>Planification des sessions d'arrosage</Text>
        </View>

        {/* Stats header */}
        <View style={c.headerStats}>
          {[
            { icon: 'water-outline',            label: 'Total',   val: programmes.length },
            { icon: 'checkmark-circle-outline', label: 'Actifs',  val: actifs },
            { icon: 'pause-circle-outline',     label: 'Inactifs',val: programmes.length - actifs },
          ].map((item, i) => (
            <View key={i} style={[c.headerStat, i < 2 && { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name={item.icon} size={16} color="rgba(255,255,255,0.8)" />
              <Text style={c.headerStatVal}>{item.val}</Text>
              <Text style={c.headerStatLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Info météo ── */}
      <View style={[c.meteoBanner, { backgroundColor: colors.info + '12', borderLeftColor: colors.info }]}>
        <Ionicons name="rainy-outline" size={15} color={colors.info} />
        <Text style={[c.meteoText, { color: colors.info }]}>
          La vanne se ferme automatiquement si pluie prévue · OpenWeatherMap
        </Text>
      </View>

      {/* ── Liste ── */}
      {loading ? (
        <View style={c.center}>
          <Ionicons name="sync-outline" size={32} color={colors.textMuted} />
          <Text style={[c.loadingText, { color: colors.textSecondary }]}>Chargement…</Text>
        </View>
      ) : programmes.length === 0 ? (
        <View style={c.center}>
          <View style={[c.emptyIconBox, { backgroundColor: S2_COLOR + '15' }]}>
            <Ionicons name="water-outline" size={44} color={S2_COLOR} />
          </View>
          <Text style={[c.emptyText,    { color: colors.textPrimary }]}>Aucun programme d'irrigation</Text>
          <Text style={[c.emptyTextSub, { color: colors.textSecondary }]}>Appuyez sur "Nouveau" pour créer</Text>
        </View>
      ) : (
        <FlatList
          data={programmes}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <ProgrammeCard item={item} onToggle={handleToggle} onDelete={handleSupprimer} colors={colors} />
          )}
          contentContainerStyle={c.liste}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={S2_COLOR} />}
        />
      )}

      {/* ── Modal création ── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={c.modalOverlay}>
          <View style={[c.modalCard, { backgroundColor: colors.card }]}>

            <View style={c.modalHandleRow}>
              <View style={[c.modalHandle, { backgroundColor: colors.cardBorder }]} />
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={c.modalIconHeader}>
              <View style={[c.modalIconBox, { backgroundColor: S2_COLOR + '18', borderColor: S2_COLOR + '33' }]}>
                <Ionicons name="calendar-outline" size={28} color={S2_COLOR} />
              </View>
              <Text style={[c.modalTitre, { color: colors.textPrimary }]}>Nouveau programme</Text>
              <Text style={[c.modalSub,   { color: colors.textSecondary }]}>
                Planifiez une session d'irrigation automatique
              </Text>
            </View>

            <Text style={[c.label, { color: colors.textMuted }]}>PARCELLE</Text>
            <TextInput
              style={[c.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.cardBorder }]}
              placeholder="Ex: Parcelle A, Zone Nord…"
              placeholderTextColor={colors.textMuted}
              value={parcelle} onChangeText={setParcelle}
            />

            <Text style={[c.label, { color: colors.textMuted }]}>JOUR DE LA SEMAINE</Text>
            <View style={c.joursContainer}>
              {JOURS.map((j, i) => (
                <TouchableOpacity
                  key={j}
                  style={[
                    c.jourBtn,
                    { borderColor: colors.cardBorder, backgroundColor: colors.background },
                    jour === j && { backgroundColor: S2_COLOR, borderColor: S2_COLOR },
                  ]}
                  onPress={() => setJour(j)}
                >
                  <Text style={[c.jourText, { color: jour === j ? '#fff' : colors.textSecondary }, jour === j && { fontWeight: 'bold' }]}>
                    {JOURS_SHORT[i]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[c.label, { color: colors.textMuted }]}>HEURE DE DÉBUT</Text>
            <TextInput
              style={[c.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.cardBorder }]}
              placeholder="Ex: 06:00"
              placeholderTextColor={colors.textMuted}
              value={heure} onChangeText={setHeure}
            />

            <View style={c.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[c.label, { color: colors.textMuted }]}>DURÉE (MIN)</Text>
                <TextInput
                  style={[c.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.cardBorder }]}
                  placeholder="Ex: 60"
                  placeholderTextColor={colors.textMuted}
                  value={duree} onChangeText={setDuree} keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[c.label, { color: colors.textMuted }]}>VOLUME (L)</Text>
                <TextInput
                  style={[c.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.cardBorder }]}
                  placeholder="Ex: 500"
                  placeholderTextColor={colors.textMuted}
                  value={volume} onChangeText={setVolume} keyboardType="numeric"
                />
              </View>
            </View>

            <View style={c.modalBtns}>
              <TouchableOpacity style={[c.btnAnnuler, { borderColor: colors.cardBorder }]} onPress={() => setModalVisible(false)}>
                <Text style={[c.btnAnnulerText, { color: colors.textSecondary }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[c.btnConfirmer, { backgroundColor: S2_COLOR }]} onPress={handleCreer}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={c.btnConfirmerText}>Créer</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}

// ── Styles statiques uniquement ───────────────────────────────────────────────
const c = StyleSheet.create({
  container: { flex: 1 },

  // Header
  headerBg:      { paddingTop: 56, paddingBottom: 0, paddingHorizontal: 20, overflow: 'hidden', position: 'relative' },
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

  // Météo
  meteoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderLeftWidth: 3, marginHorizontal: 16, marginTop: 12, marginBottom: 4, padding: 10, borderRadius: 10 },
  meteoText:   { fontSize: 12, flex: 1 },

  liste:        { padding: 16, paddingBottom: 40, gap: 12 },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyText:    { fontSize: 16, fontWeight: '600' },
  emptyTextSub: { fontSize: 13 },
  loadingText:  { fontSize: 13, marginTop: 8 },

  // Carte programme
  card:          { flexDirection: 'row', borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  cardStripe:    { width: 4 },
  cardBody:      { flex: 1, padding: 14 },
  cardTop:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIconCircle:{ width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardParcelle:  { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  cardMetaRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMeta:      { fontSize: 11 },
  cardMetaDot:   { fontSize: 11 },

  statsRow:  { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  statItem:  { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  statVal:   { fontSize: 13, fontWeight: '700' },
  statLabel: { fontSize: 9, letterSpacing: 0.5 },

  cardBottom:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activePill:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  activePillDot: { width: 5, height: 5, borderRadius: 3 },
  activePillText:{ fontSize: 11, fontWeight: '700' },
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
  joursContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  jourBtn:        { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  jourText:       { fontSize: 12 },
  row:            { flexDirection: 'row' },
  modalBtns:      { flexDirection: 'row', gap: 12, marginTop: 4 },
  btnAnnuler:     { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  btnAnnulerText: { fontWeight: '600' },
  btnConfirmer:   { flex: 2, padding: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  btnConfirmerText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
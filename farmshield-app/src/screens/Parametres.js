// src/screens/Parametres.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, Switch, Modal, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getProfil, updateProfil, updatePassword } from '../api/users';

const GUIDE_ITEMS = [
  { icon: 'home-outline',          titre: 'Tableau de bord',      desc: "La page d'accueil affiche le statut en temps réel de vos 3 zones. Vert = normal, rouge = alerte." },
  { icon: 'map-outline',           titre: 'Carte de la ferme',    desc: 'Visualisez vos 3 sous-systèmes sur la carte. Appuyez sur S1, S2 ou S3 pour les détails.' },
  { icon: 'notifications-outline', titre: 'Alertes',              desc: 'Toutes les alertes déclenchées par vos capteurs. Filtrez par sous-système et marquez-les lues.' },
  { icon: 'toggle-outline',        titre: 'Contrôle',             desc: "Ouvrez ou fermez la vanne d'irrigation. Activez ou coupez la sirène à distance." },
  { icon: 'cube-outline',          titre: 'Espace Stockage',      desc: "Gérez vos articles (pesticides, carburant, fourrage) et définissez des seuils d'alerte." },
  { icon: 'water-outline',         titre: 'Irrigation',           desc: "Programmez vos sessions d'irrigation. La vanne se ferme automatiquement si de la pluie est prévue." },
  { icon: 'people-outline',        titre: 'Personnes autorisées', desc: 'Enregistrez les visages autorisés. Toute personne non reconnue déclenche une alerte.' },
];

export default function Parametres({ navigation }) {
  const { token, user, logout } = useAuth();
  const { colors } = useTheme();

  const [profil,        setProfil]        = useState(null);
  const [nomFerme,      setNomFerme]      = useState('');
  const [editNom,       setEditNom]       = useState(false);
  const [ancienMdp,     setAncienMdp]     = useState('');
  const [nouveauMdp,    setNouveauMdp]    = useState('');
  const [editMdp,       setEditMdp]       = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [alertesSon,    setAlertesSon]    = useState(true);
  const [modalAide,     setModalAide]     = useState(null);

  // ── Vidéo locale ─────────────────────────────────────────────────────────
  // Fichier : assets/video/demo.mp4
  const player = useVideoPlayer(require('../../assets/video/demo.mp4.mp4'), p => {
    p.loop = false;
  });

  useEffect(() => { chargerProfil(); }, []);

  const chargerProfil = async () => {
    try {
      const data = await getProfil(token);
      setProfil(data.utilisateur || data);
      setNomFerme(data.utilisateur?.nom_ferme || data.nom_ferme || '');
    } catch (e) { console.log('Erreur profil:', e); }
  };

  const handleUpdateNom = async () => {
    try {
      const data = await updateProfil(token, nomFerme);
      if (data.erreur) Alert.alert('Erreur', data.erreur);
      else { Alert.alert('Succès', 'Nom de ferme mis à jour.'); setEditNom(false); }
    } catch { Alert.alert('Erreur', 'Mise à jour échouée.'); }
  };

  const handleUpdateMdp = async () => {
    if (!ancienMdp || !nouveauMdp) { Alert.alert('Erreur', 'Les deux champs sont obligatoires.'); return; }
    if (nouveauMdp.length < 6)     { Alert.alert('Erreur', 'Minimum 6 caractères.'); return; }
    try {
      const data = await updatePassword(token, ancienMdp, nouveauMdp);
      if (data.erreur) Alert.alert('Erreur', data.erreur);
      else {
        Alert.alert('Succès', 'Mot de passe modifié.');
        setEditMdp(false); setAncienMdp(''); setNouveauMdp('');
      }
    } catch { Alert.alert('Erreur', 'Modification échouée.'); }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.retourBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.titre, { color: colors.textPrimary }]}>Paramètres</Text>
        </View>
      </View>

      {/* Profil card */}
      <View style={[styles.profilCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={[styles.profilAvatar, { backgroundColor: colors.primary + '22' }]}>
          <Ionicons name="leaf" size={32} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.profilNom, { color: colors.textPrimary }]}>{profil?.nom_ferme || nomFerme}</Text>
          <Text style={[styles.profilEmail, { color: colors.textSecondary }]}>{profil?.email || user?.email}</Text>
        </View>
        <View style={[styles.profilBadge, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
          <Text style={[styles.profilBadgeText, { color: colors.primary }]}>Actif</Text>
        </View>
      </View>

      {/* FERME */}
      <Text style={[styles.sectionTitre, { color: colors.textMuted }]}>FERME</Text>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.rowItem}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: colors.s1Color + '22' }]}>
              <Ionicons name="home-outline" size={18} color={colors.s1Color} />
            </View>
            <View>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Nom de la ferme</Text>
              {!editNom && <Text style={[styles.rowValeur, { color: colors.textSecondary }]}>{nomFerme}</Text>}
            </View>
          </View>
          <TouchableOpacity onPress={() => setEditNom(!editNom)}>
            <Text style={[styles.editBtn, { color: colors.primary }]}>{editNom ? 'Annuler' : 'Modifier'}</Text>
          </TouchableOpacity>
        </View>
        {editNom && (
          <View style={styles.editContainer}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.cardBorder }]}
              value={nomFerme}
              onChangeText={setNomFerme}
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={[styles.btnSave, { backgroundColor: colors.primary }]} onPress={handleUpdateNom}>
              <Text style={styles.btnSaveText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* SÉCURITÉ */}
      <Text style={[styles.sectionTitre, { color: colors.textMuted }]}>SÉCURITÉ</Text>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.rowItem}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: colors.warning + '22' }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.warning} />
            </View>
            <View>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Mot de passe</Text>
              {!editMdp && <Text style={[styles.rowValeur, { color: colors.textSecondary }]}>••••••••</Text>}
            </View>
          </View>
          <TouchableOpacity onPress={() => setEditMdp(!editMdp)}>
            <Text style={[styles.editBtn, { color: colors.primary }]}>{editMdp ? 'Annuler' : 'Changer'}</Text>
          </TouchableOpacity>
        </View>
        {editMdp && (
          <View style={styles.editContainer}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.cardBorder }]}
              placeholder="Ancien mot de passe"
              placeholderTextColor={colors.textMuted}
              value={ancienMdp}
              onChangeText={setAncienMdp}
              secureTextEntry
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.cardBorder }]}
              placeholder="Nouveau mot de passe"
              placeholderTextColor={colors.textMuted}
              value={nouveauMdp}
              onChangeText={setNouveauMdp}
              secureTextEntry
            />
            <TouchableOpacity style={[styles.btnSave, { backgroundColor: colors.primary }]} onPress={handleUpdateMdp}>
              <Text style={styles.btnSaveText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* NOTIFICATIONS */}
      <Text style={[styles.sectionTitre, { color: colors.textMuted }]}>NOTIFICATIONS</Text>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.rowItem}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: colors.s2Color + '22' }]}>
              <Ionicons name="notifications-outline" size={18} color={colors.s2Color} />
            </View>
            <View>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Alertes push</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Recevoir les alertes en temps réel</Text>
            </View>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: colors.cardBorder, true: colors.primary + '66' }}
            thumbColor={notifications ? colors.primary : colors.textMuted}
          />
        </View>
        <View style={[styles.rowItem, { borderTopWidth: 1, borderTopColor: colors.cardBorder }]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: colors.s3Color + '22' }]}>
              <Ionicons name="volume-high-outline" size={18} color={colors.s3Color} />
            </View>
            <View>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Son des alertes</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Activer le son pour les alertes critiques</Text>
            </View>
          </View>
          <Switch
            value={alertesSon}
            onValueChange={setAlertesSon}
            trackColor={{ false: colors.cardBorder, true: colors.primary + '66' }}
            thumbColor={alertesSon ? colors.primary : colors.textMuted}
          />
        </View>
      </View>

      {/* AIDE */}
      <Text style={[styles.sectionTitre, { color: colors.textMuted }]}>AIDE</Text>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {[
          { icon: 'help-circle-outline',   label: 'Comment utiliser FarmShield', color: colors.info,          modal: 'guide'   },
          { icon: 'chatbubble-outline',     label: 'Nous contacter',              color: colors.info,          modal: 'contact' },
          { icon: 'document-text-outline', label: "Conditions d'utilisation",    color: colors.textSecondary, modal: 'cgu'     },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.rowItem, i > 0 && { borderTopWidth: 1, borderTopColor: colors.cardBorder }]}
            onPress={() => setModalAide(item.modal)}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Déconnexion */}
      <TouchableOpacity style={[styles.btnLogout, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '33' }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={[styles.btnLogoutText, { color: colors.danger }]}>Se déconnecter</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: colors.textMuted }]}>FarmShield v1.0.0</Text>
      <View style={{ height: 40 }} />

      {/* ════ MODAL AIDE ════ */}
      <Modal visible={modalAide !== null} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalAide(null)}
        >
          <TouchableOpacity style={[styles.modalCard, { backgroundColor: colors.card }]} activeOpacity={1}>

            <View style={styles.modalHandleRow}>
              <View style={[styles.modalHandle, { backgroundColor: colors.cardBorder }]} />
              <TouchableOpacity onPress={() => setModalAide(null)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* GUIDE */}
            {modalAide === 'guide' && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalTitre, { color: colors.textPrimary }]}>Comment utiliser FarmShield</Text>

                {/* Vidéo locale expo-video */}
                <VideoView
                  style={styles.videoWrapper}
                  player={player}
                  allowsFullscreen
                  allowsPictureInPicture
                />
                <Text style={[styles.videoCaption, { color: colors.textMuted }]}>Tutoriel officiel FarmShield</Text>

                <View style={styles.guideDivider}>
                  <View style={[styles.guideDividerLine, { backgroundColor: colors.cardBorder }]} />
                  <Text style={[styles.guideDividerLabel, { color: colors.textMuted }]}>FONCTIONNALITÉS</Text>
                  <View style={[styles.guideDividerLine, { backgroundColor: colors.cardBorder }]} />
                </View>

                {GUIDE_ITEMS.map((item, i) => (
                  <View key={i} style={styles.guideItem}>
                    <View style={styles.guideLeft}>
                      <View style={[styles.guideIconBox, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '33' }]}>
                        <Ionicons name={item.icon} size={18} color={colors.primary} />
                      </View>
                      {i < GUIDE_ITEMS.length - 1 && <View style={[styles.guideConnector, { backgroundColor: colors.cardBorder }]} />}
                    </View>
                    <View style={styles.guideContent}>
                      <Text style={[styles.guideTitre, { color: colors.textPrimary }]}>{item.titre}</Text>
                      <Text style={[styles.guideDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                    </View>
                  </View>
                ))}
                <View style={{ height: 20 }} />
              </ScrollView>
            )}

            {/* CONTACT */}
            {modalAide === 'contact' && (
              <View>
                <Text style={[styles.modalTitre, { color: colors.textPrimary }]}>Nous contacter</Text>
                <Text style={[styles.contactSub, { color: colors.textSecondary }]}>
                  Une question ou un problème ? Notre équipe vous répond rapidement.
                </Text>
                {[
                  { icon: 'mail-outline',  label: 'Email',    valeur: 'support@farmshield.ma', color: colors.info,          action: () => Linking.openURL('mailto:support@farmshield.ma') },
                  { icon: 'logo-whatsapp', label: 'WhatsApp', valeur: '+212 6XX XXX XXX',      color: colors.success,       action: () => Linking.openURL('https://wa.me/212600000000') },
                  { icon: 'call-outline',  label: 'Téléphone',valeur: '+212 5XX XXX XXX',      color: colors.s1Color,       action: () => Linking.openURL('tel:+212500000000') },
                  { icon: 'time-outline',  label: 'Horaires', valeur: 'Lun–Ven · 9h–18h',     color: colors.textSecondary, action: null },
                ].map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.contactItem, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}
                    onPress={item.action || undefined}
                    disabled={!item.action}
                  >
                    <View style={[styles.iconBox, { backgroundColor: item.color + '22' }]}>
                      <Ionicons name={item.icon} size={20} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                      <Text style={[styles.contactValeur, { color: colors.textPrimary }, item.action && { color: colors.info }]}>
                        {item.valeur}
                      </Text>
                    </View>
                    {item.action && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* CGU */}
            {modalAide === 'cgu' && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalTitre, { color: colors.textPrimary }]}>Conditions d'utilisation</Text>
                <Text style={[styles.cguDate, { color: colors.textMuted }]}>Dernière mise à jour : Juin 2025</Text>
                {[
                  { titre: '1. Objet',               texte: "FarmShield est un système de sécurité agricole intelligent développé pour surveiller et protéger les exploitations agricoles. L'utilisation de l'application implique l'acceptation des présentes conditions." },
                  { titre: '2. Données personnelles', texte: "Les données collectées (email, position GPS de la ferme, historique des capteurs) sont utilisées uniquement pour le fonctionnement du système. Elles ne sont jamais vendues à des tiers." },
                  { titre: '3. Données capteurs',    texte: "Les mesures collectées par les capteurs (poids, débit, mouvement) sont stockées de manière sécurisée et accessibles uniquement par le propriétaire du compte." },
                  { titre: '4. Images et vidéos',    texte: "Les images capturées par la caméra ESP32-CAM lors d'une détection sont stockées temporairement pour permettre l'identification. Elles peuvent servir de preuve légale en cas de vol ou d'intrusion." },
                  { titre: '5. Responsabilité',      texte: "FarmShield fournit un outil de surveillance en temps réel. En cas de panne réseau, les alarmes physiques locales (sirène, fermeture de vanne) continuent à fonctionner de manière autonome." },
                  { titre: '6. Compte utilisateur',  texte: "Chaque compte est lié à une ferme. L'utilisateur est responsable de la confidentialité de ses identifiants de connexion." },
                  { titre: '7. Contact',             texte: "Pour toute question relative à vos données personnelles, contactez-nous à : support@farmshield.ma" },
                ].map((item, i) => (
                  <View key={i} style={styles.cguItem}>
                    <Text style={[styles.cguTitre, { color: colors.textPrimary }]}>{item.titre}</Text>
                    <Text style={[styles.cguTexte, { color: colors.textSecondary }]}>{item.texte}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { padding: 20, paddingTop: 56 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  retourBtn: {
    width: 38, height: 38, borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  titre: { fontSize: 20, fontWeight: 'bold' },

  profilCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16,
    margin: 16, marginTop: 4, padding: 16,
    borderWidth: 1,
  },
  profilAvatar: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  profilNom:       { fontSize: 16, fontWeight: 'bold' },
  profilEmail:     { fontSize: 12, marginTop: 2 },
  profilBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  profilBadgeText: { fontSize: 11, fontWeight: '600' },

  sectionTitre: {
    fontSize: 11,
    letterSpacing: 2, fontWeight: 'bold',
    paddingHorizontal: 16, marginBottom: 8, marginTop: 8,
  },
  section: {
    borderRadius: 14,
    marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  rowLabel:  { fontSize: 14, fontWeight: '500' },
  rowValeur: { fontSize: 12, marginTop: 2 },
  rowSub:    { fontSize: 11, marginTop: 2 },
  editBtn:   { fontSize: 13, fontWeight: '600' },

  editContainer: { paddingHorizontal: 14, paddingBottom: 14 },
  input: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1, marginBottom: 10,
  },
  btnSave:     { borderRadius: 10, padding: 12, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: 'bold' },

  btnLogout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    borderRadius: 14, margin: 16, padding: 16,
    borderWidth: 1,
  },
  btnLogoutText: { fontWeight: 'bold', fontSize: 15 },
  version: { fontSize: 12, textAlign: 'center', marginBottom: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '92%',
  },
  modalHandleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2 },
  modalTitre:  { fontSize: 20, fontWeight: 'bold', marginBottom: 14 },

  videoWrapper: {
    width: '100%',
    height: 210,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 6,
  },
  videoCaption: {
    fontSize: 11,
    textAlign: 'center', marginBottom: 18,
  },

  guideDivider:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  guideDividerLine:  { flex: 1, height: 1 },
  guideDividerLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },

  guideItem:    { flexDirection: 'row', gap: 12, marginBottom: 4 },
  guideLeft:    { alignItems: 'center', width: 38 },
  guideIconBox: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  guideConnector: {
    flex: 1, width: 1.5,
    marginVertical: 3, minHeight: 12,
  },
  guideContent: { flex: 1, paddingBottom: 18, paddingTop: 8 },
  guideTitre:   { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  guideDesc:    { fontSize: 12, lineHeight: 18 },

  contactSub: { fontSize: 13, marginBottom: 20, lineHeight: 20 },
  contactItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14,
    borderRadius: 12, marginBottom: 10,
    borderWidth: 1,
  },
  contactLabel:  { fontSize: 11 },
  contactValeur: { fontSize: 14, fontWeight: '600', marginTop: 2 },

  cguDate:  { fontSize: 11, marginBottom: 16 },
  cguItem:  { marginBottom: 16 },
  cguTitre: { fontSize: 13, fontWeight: 'bold', marginBottom: 6 },
  cguTexte: { fontSize: 12, lineHeight: 20 },
});
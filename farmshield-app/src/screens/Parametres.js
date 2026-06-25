// src/screens/Parametres.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, Switch
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getProfil, updateProfil, updatePassword } from '../api/users';
import colors from '../theme/colors';

export default function Parametres() {
  const { token, user, logout } = useAuth();
  const [profil, setProfil] = useState(null);
  const [nomFerme, setNomFerme] = useState('');
  const [editNom, setEditNom] = useState(false);

  const [ancienMdp, setAncienMdp] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [editMdp, setEditMdp] = useState(false);

  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    chargerProfil();
  }, []);

  const chargerProfil = async () => {
    try {
      const data = await getProfil(token);
      setProfil(data.utilisateur || data);
      setNomFerme(data.utilisateur?.nom_ferme || data.nom_ferme || '');
    } catch (e) {
      console.log('Erreur profil:', e);
    }
  };

  const handleUpdateNom = async () => {
    try {
      const data = await updateProfil(token, nomFerme);
      if (data.erreur) {
        Alert.alert('Erreur', data.erreur);
      } else {
        Alert.alert('Succès', 'Nom de ferme mis à jour.');
        setEditNom(false);
      }
    } catch (e) {
      Alert.alert('Erreur', 'Mise à jour échouée.');
    }
  };

  const handleUpdateMdp = async () => {
    if (!ancienMdp || !nouveauMdp) {
      Alert.alert('Erreur', 'Les deux champs sont obligatoires.');
      return;
    }
    if (nouveauMdp.length < 6) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit avoir au moins 6 caractères.');
      return;
    }
    try {
      const data = await updatePassword(token, ancienMdp, nouveauMdp);
      if (data.erreur) {
        Alert.alert('Erreur', data.erreur);
      } else {
        Alert.alert('Succès', 'Mot de passe modifié.');
        setEditMdp(false);
        setAncienMdp('');
        setNouveauMdp('');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Modification échouée.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: logout }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titre}>⚙️ Paramètres</Text>
        <Text style={styles.sousTitre}>Gestion de votre compte et ferme</Text>
      </View>

      {/* Profil */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>PROFIL</Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🌿</Text>
          </View>
          <View style={styles.profilInfo}>
            <Text style={styles.profilNom}>{profil?.nom_ferme || nomFerme}</Text>
            <Text style={styles.profilEmail}>{profil?.email || user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Nom de ferme */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>INFORMATIONS FERME</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardLabel}>Nom de la ferme</Text>
            <TouchableOpacity onPress={() => setEditNom(!editNom)}>
              <Text style={styles.editBtn}>{editNom ? 'Annuler' : 'Modifier'}</Text>
            </TouchableOpacity>
          </View>
          {editNom ? (
            <>
              <TextInput
                style={styles.input}
                value={nomFerme}
                onChangeText={setNomFerme}
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity style={styles.btnSave} onPress={handleUpdateNom}>
                <Text style={styles.btnSaveText}>Enregistrer</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.cardValeur}>{nomFerme}</Text>
          )}
        </View>
      </View>

      {/* Mot de passe */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>SÉCURITÉ</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardLabel}>Mot de passe</Text>
            <TouchableOpacity onPress={() => setEditMdp(!editMdp)}>
              <Text style={styles.editBtn}>{editMdp ? 'Annuler' : 'Changer'}</Text>
            </TouchableOpacity>
          </View>
          {editMdp && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Ancien mot de passe"
                placeholderTextColor={colors.textMuted}
                value={ancienMdp}
                onChangeText={setAncienMdp}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Nouveau mot de passe"
                placeholderTextColor={colors.textMuted}
                value={nouveauMdp}
                onChangeText={setNouveauMdp}
                secureTextEntry
              />
              <TouchableOpacity style={styles.btnSave} onPress={handleUpdateMdp}>
                <Text style={styles.btnSaveText}>Enregistrer</Text>
              </TouchableOpacity>
            </>
          )}
          {!editMdp && (
            <Text style={styles.cardValeur}>••••••••</Text>
          )}
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardLabel}>Alertes push</Text>
              <Text style={styles.cardSub}>Recevoir les alertes FCM</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.cardBorder, true: colors.primary + '66' }}
              thumbColor={notifications ? colors.primary : colors.textMuted}
            />
          </View>
        </View>
      </View>

      {/* Infos système */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>SYSTÈME</Text>
        <View style={styles.card}>
          {[
            ['Version app', '1.0.0'],
            ['Backend', 'Node.js + PostgreSQL'],
            ['Broker MQTT', 'HiveMQ Cloud'],
            ['Notifications', 'Firebase FCM'],
          ].map(([label, val]) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoVal}>{val}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Déconnexion */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
          <Text style={styles.btnLogoutText}>⎋ Se déconnecter</Text>
        </TouchableOpacity>
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
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitre: {
    color: colors.textMuted, fontSize: 11,
    letterSpacing: 2, fontWeight: 'bold',
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: colors.cardBorder,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary + '22',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28 },
  profilInfo: {},
  profilNom: { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' },
  profilEmail: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  rowBetween: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardLabel: { color: colors.textSecondary, fontSize: 13 },
  cardSub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  cardValeur: { color: colors.textPrimary, fontSize: 15, marginTop: 8, fontWeight: '500' },
  editBtn: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: colors.background, borderRadius: 10,
    padding: 12, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.cardBorder,
    marginTop: 10,
  },
  btnSave: {
    backgroundColor: colors.primary, borderRadius: 10,
    padding: 12, alignItems: 'center', marginTop: 10,
  },
  btnSaveText: { color: '#fff', fontWeight: 'bold' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  infoLabel: { color: colors.textSecondary, fontSize: 13 },
  infoVal: { color: colors.textPrimary, fontSize: 13, fontWeight: '500' },
  btnLogout: {
    backgroundColor: colors.danger + '22',
    borderRadius: 12, padding: 16,
    alignItems: 'center',
    borderWidth: 1, borderColor: colors.danger + '44',
  },
  btnLogoutText: { color: colors.danger, fontWeight: 'bold', fontSize: 15 },
});
// src/screens/Login.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert, ImageBackground, Image
} from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin, register as apiRegister } from '../api/auth';
import colors from '../theme/colors';

export default function Login() {
  const { login } = useAuth();
  const [mode, setMode] = useState('splash');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomFerme, setNomFerme] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Email et mot de passe obligatoires.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      if (data.token) { await login(data.token, data.utilisateur); }
      else { Alert.alert('Erreur', data.erreur || 'Connexion échouée.'); }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !nomFerme) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires.');
      return;
    }
    setLoading(true);
    try {
      let latitude = 0;
      let longitude = 0;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const loc = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
          ]);
          latitude = loc.coords.latitude;
          longitude = loc.coords.longitude;
        } catch (e) {
          console.log('GPS timeout — coordonnées par défaut');
        }
      }

      const data = await apiRegister(email, password, nomFerme, latitude, longitude);
      if (data.utilisateur) {
        const loginData = await apiLogin(email, password);
        if (loginData.token) {
          await login(loginData.token, loginData.utilisateur);
        } else {
          Alert.alert('Succès', 'Compte créé ! Connectez-vous.');
          setMode('login');
        }
      } else {
        Alert.alert('Erreur', data.erreur || 'Inscription échouée.');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  // ── SPLASH ──────────────────────────────────────────────────────
  if (mode === 'splash') {
    return (
      <ImageBackground
        source={require('../../assets/farm.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={styles.splashContent}>
          <View style={styles.logoTextGroup}>
            <View style={styles.logoWrapper}>
              <Image source={require('../../assets/logo.png')} style={styles.logoImg} resizeMode="contain"/>
            </View>
            <Text style={styles.splashTitre}>FarmShield</Text>
            <Text style={styles.splashSub}>Protéger votre ferme,{'\n'}24h/24 et 7j/7</Text>
          </View>
          <View style={styles.splashBtns}>
            <TouchableOpacity style={styles.btnConnexion} onPress={() => setMode('login')}>
              <Text style={styles.btnConnexionText}>Se connecter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCreer} onPress={() => setMode('register')}>
              <Text style={styles.btnCreerText}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    );
  }

  // ── LOGIN + REGISTER ────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => setMode('splash')} style={styles.retourBtn}>
          <Text style={styles.retourText}>← Retour</Text>
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Image source={require('../../assets/logo.png')} style={styles.logoSmall} resizeMode="contain"/>
          <Text style={styles.logoText}>FARMSHIELD</Text>
          <Text style={styles.logoSub}>Protégez votre ferme, 24h/24</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'login' && styles.toggleActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>
                Connexion
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'register' && styles.toggleActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.toggleText, mode === 'register' && styles.toggleTextActive]}>
                Inscription
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'register' && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nom de la ferme</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Ferme Benali"
                  placeholderTextColor={colors.textMuted}
                  value={nomFerme}
                  onChangeText={setNomFerme}
                />
              </View>
              <View style={styles.infoGPS}>
                <Text style={styles.infoGPSText}>
                  📍 Votre position GPS sera capturée automatiquement pour définir la zone de votre ferme.
                </Text>
              </View>
            </>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="agriculteur@email.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={mode === 'login' ? handleLogin : handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>
                  {mode === 'login' ? 'Se connecter' : "S'inscrire"}
                </Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  splashContent: {
    flex: 1, alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60, paddingBottom: 55, paddingHorizontal: 28,
  },
  logoTextGroup: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  logoWrapper: { width: 190, height: 190, marginBottom: 8 },
  logoImg: { width: '100%', height: '100%' },
  splashTitre: {
    fontSize: 38, fontWeight: 'bold', color: '#fff',
    letterSpacing: 3, marginBottom: 6,
  },
  splashSub: {
    fontSize: 16, color: 'rgba(255,255,255,0.8)',
    textAlign: 'center', lineHeight: 24,
  },
  splashBtns: { width: '100%', gap: 12 },
  btnConnexion: {
    backgroundColor: colors.primary, borderRadius: 14,
    padding: 18, alignItems: 'center',
  },
  btnConnexionText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  btnCreer: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14,
    padding: 18, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  btnCreerText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  retourBtn: { marginBottom: 8 },
  retourText: { color: colors.primary, fontSize: 15 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoSmall: { width: 70, height: 70, marginBottom: 10 },
  logoText: { fontSize: 28, fontWeight: 'bold', color: colors.primary, letterSpacing: 4 },
  logoSub: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: colors.card, borderRadius: 16,
    padding: 24, borderWidth: 1, borderColor: colors.cardBorder,
  },
  toggle: {
    flexDirection: 'row', backgroundColor: colors.background,
    borderRadius: 10, padding: 4, marginBottom: 24,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  toggleTextActive: { color: '#fff' },
  inputContainer: { marginBottom: 16 },
  label: {
    color: colors.textSecondary, fontSize: 12,
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.background, borderRadius: 10,
    padding: 14, color: colors.textPrimary, fontSize: 15,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  infoGPS: {
    backgroundColor: colors.primary + '11',
    borderLeftWidth: 3, borderLeftColor: colors.primary,
    padding: 10, borderRadius: 8, marginBottom: 16,
  },
  infoGPSText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  btn: {
    backgroundColor: colors.primary, borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
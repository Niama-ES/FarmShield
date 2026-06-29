// src/screens/Login.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert, ImageBackground, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { login as apiLogin, register as apiRegister } from '../api/auth';

export default function Login() {
  const { login }   = useAuth();
  const { colors }  = useTheme();

  const [mode,     setMode]     = useState('splash');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [nomFerme, setNomFerme] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Erreur', 'Email et mot de passe obligatoires.'); return; }
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      if (data.token) { await login(data.token, data.utilisateur); }
      else { Alert.alert('Erreur', data.erreur || 'Connexion échouée.'); }
    } catch { Alert.alert('Erreur', 'Impossible de contacter le serveur.'); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!email || !password || !nomFerme) { Alert.alert('Erreur', 'Tous les champs sont obligatoires.'); return; }
    setLoading(true);
    try {
      let latitude = 0, longitude = 0;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const loc = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
          ]);
          latitude  = loc.coords.latitude;
          longitude = loc.coords.longitude;
        } catch { console.log('GPS timeout'); }
      }
      const data = await apiRegister(email, password, nomFerme, latitude, longitude);
      if (data.utilisateur) {
        const loginData = await apiLogin(email, password);
        if (loginData.token) { await login(loginData.token, loginData.utilisateur); }
        else { Alert.alert('Succès', 'Compte créé ! Connectez-vous.'); setMode('login'); }
      } else { Alert.alert('Erreur', data.erreur || 'Inscription échouée.'); }
    } catch { Alert.alert('Erreur', 'Impossible de contacter le serveur.'); }
    finally { setLoading(false); }
  };

  // ── SPLASH ─────────────────────────────────────────────────────────────────
  if (mode === 'splash') {
    return (
      <ImageBackground
        source={require('../../assets/farm.jpg')}
        style={s.background}
        resizeMode="cover"
      >
        <View style={s.overlay} />
        <View style={s.splashContent}>
          <View style={s.splashTop}>
            <View style={s.logoWrapper}>
              <Image source={require('../../assets/logo.png')} style={s.logoImg} resizeMode="contain" />
            </View>
            <Text style={s.splashTitre}>FarmShield</Text>
            <Text style={s.splashSub}>Protéger votre ferme,{'\n'}24h/24 et 7j/7</Text>

            {/* Badges features */}
            <View style={s.featuresRow}>
              {[
                { icon: 'shield-checkmark-outline', label: 'Sécurisé' },
                { icon: 'wifi-outline',             label: 'Temps réel' },
                { icon: 'notifications-outline',    label: 'Alertes' },
              ].map((f, i) => (
                <View key={i} style={s.featureBadge}>
                  <Ionicons name={f.icon} size={14} color="rgba(255,255,255,0.9)" />
                  <Text style={s.featureLabel}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={s.splashBtns}>
            <TouchableOpacity style={s.btnConnexion} onPress={() => setMode('login')}>
              <Ionicons name="log-in-outline" size={18} color="#fff" />
              <Text style={s.btnConnexionText}>Se connecter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnCreer} onPress={() => setMode('register')}>
              <Ionicons name="person-add-outline" size={18} color="#fff" />
              <Text style={s.btnCreerText}>Créer un compte</Text>
            </TouchableOpacity>
            <Text style={s.splashVersion}>FarmShield v1.0.0 · Sécurité agricole IoT</Text>
          </View>
        </View>
      </ImageBackground>
    );
  }

  // ── LOGIN + REGISTER ────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[s.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Retour */}
        <TouchableOpacity onPress={() => setMode('splash')} style={s.retourBtn}>
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <Text style={[s.retourText, { color: colors.primary }]}>Retour</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={s.logoContainer}>
          <View style={[s.logoCircle, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '33' }]}>
            <Image source={require('../../assets/logo.png')} style={s.logoSmall} resizeMode="contain" />
          </View>
          <Text style={[s.logoText, { color: colors.primary }]}>FARMSHIELD</Text>
          <Text style={[s.logoSub, { color: colors.textSecondary }]}>Sécurité agricole intelligente</Text>
        </View>

        {/* Card */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>

          {/* Toggle */}
          <View style={[s.toggle, { backgroundColor: colors.background }]}>
            {['login', 'register'].map((m) => (
              <TouchableOpacity
                key={m}
                style={[s.toggleBtn, mode === m && { backgroundColor: colors.primary }]}
                onPress={() => setMode(m)}
              >
                <Text style={[s.toggleText, { color: mode === m ? '#fff' : colors.textSecondary }, mode === m && { fontWeight: 'bold' }]}>
                  {m === 'login' ? 'Connexion' : 'Inscription'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Champ nom ferme (register) */}
          {mode === 'register' && (
            <>
              <Text style={[s.label, { color: colors.textMuted }]}>NOM DE LA FERME</Text>
              <View style={[s.inputWrapper, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                <Ionicons name="home-outline" size={18} color={colors.textMuted} style={s.inputIcon} />
                <TextInput
                  style={[s.input, { color: colors.textPrimary }]}
                  placeholder="Ex: Ferme Benali"
                  placeholderTextColor={colors.textMuted}
                  value={nomFerme} onChangeText={setNomFerme}
                />
              </View>
              <View style={[s.infoGPS, { backgroundColor: colors.primary + '11', borderLeftColor: colors.primary }]}>
                <Ionicons name="location-outline" size={14} color={colors.primary} />
                <Text style={[s.infoGPSText, { color: colors.textSecondary }]}>
                  Votre position GPS sera capturée automatiquement pour définir la zone de votre ferme.
                </Text>
              </View>
            </>
          )}

          {/* Email */}
          <Text style={[s.label, { color: colors.textMuted }]}>EMAIL</Text>
          <View style={[s.inputWrapper, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={s.inputIcon} />
            <TextInput
              style={[s.input, { color: colors.textPrimary }]}
              placeholder="agriculteur@email.com"
              placeholderTextColor={colors.textMuted}
              value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none"
            />
          </View>

          {/* Mot de passe */}
          <Text style={[s.label, { color: colors.textMuted }]}>MOT DE PASSE</Text>
          <View style={[s.inputWrapper, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={s.inputIcon} />
            <TextInput
              style={[s.input, { color: colors.textPrimary, flex: 1 }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password} onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ paddingHorizontal: 12 }}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Bouton principal */}
          <TouchableOpacity
            style={[s.btn, { backgroundColor: colors.primary }, loading && { opacity: 0.6 }]}
            onPress={mode === 'login' ? handleLogin : handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={mode === 'login' ? 'log-in-outline' : 'person-add-outline'} size={18} color="#fff" />
                <Text style={s.btnText}>{mode === 'login' ? 'Se connecter' : "S'inscrire"}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Switch mode */}
          <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')} style={s.switchMode}>
            <Text style={[s.switchModeText, { color: colors.textSecondary }]}>
              {mode === 'login' ? "Pas encore de compte ? " : "Déjà un compte ? "}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                {mode === 'login' ? "S'inscrire" : "Se connecter"}
              </Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  // Splash
  background:    { flex: 1, width: '100%', height: '100%' },
  overlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  splashContent: { flex: 1, justifyContent: 'space-between', paddingTop: 70, paddingBottom: 50, paddingHorizontal: 28 },
  splashTop:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  logoWrapper:   { width: 160, height: 160, marginBottom: 4 },
  logoImg:       { width: '100%', height: '100%' },
  splashTitre:   { fontSize: 38, fontWeight: 'bold', color: '#fff', letterSpacing: 3 },
  splashSub:     { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 24 },
  featuresRow:   { flexDirection: 'row', gap: 10, marginTop: 8 },
  featureBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  featureLabel:  { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' },
  splashBtns:    { gap: 12 },
  btnConnexion:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2ECC71', borderRadius: 16, padding: 18 },
  btnConnexionText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  btnCreer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  btnCreerText:  { color: '#fff', fontWeight: '600', fontSize: 16 },
  splashVersion: { color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', marginTop: 4 },

  // Login/Register
  container:    { flex: 1 },
  scroll:       { flexGrow: 1, justifyContent: 'center', padding: 24 },
  retourBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  retourText:   { fontSize: 15, fontWeight: '600' },

  logoContainer:{ alignItems: 'center', marginBottom: 28 },
  logoCircle:   { width: 80, height: 80, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  logoSmall:    { width: 56, height: 56 },
  logoText:     { fontSize: 24, fontWeight: 'bold', letterSpacing: 4 },
  logoSub:      { fontSize: 13, marginTop: 4 },

  card:         { borderRadius: 20, padding: 24, borderWidth: 1 },
  toggle:       { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 24 },
  toggleBtn:    { flex: 1, paddingVertical: 11, borderRadius: 9, alignItems: 'center' },
  toggleText:   { fontSize: 14 },

  label:        { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  inputIcon:    { paddingLeft: 14 },
  input:        { flex: 1, padding: 14, fontSize: 15 },

  infoGPS:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderLeftWidth: 3, padding: 10, borderRadius: 10, marginBottom: 16 },
  infoGPSText:  { flex: 1, fontSize: 12, lineHeight: 18 },

  btn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, padding: 17, marginTop: 8 },
  btnText:      { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  switchMode:   { alignItems: 'center', marginTop: 20 },
  switchModeText: { fontSize: 13 },
});
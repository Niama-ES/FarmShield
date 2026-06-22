// ============================================================
// src/screens/PlaceholderScreens.js
// ------------------------------------------------------------
// RÔLE DE CE FICHIER :
// Ce ne sont PAS les vrais écrans finaux de l'app — ce sont des
// "écrans temporaires" minimalistes (juste un titre au centre).
// Ils existent pour une seule raison : permettre à App.js de
// fonctionner et de s'afficher DÈS MAINTENANT, sans attendre que
// les 9 écrans définitifs (avec leur vrai design, leurs données
// MQTT, etc.) soient terminés par l'équipe.
//
// QUAND VOUS AUREZ VOS VRAIS ÉCRANS (ex: src/screens/HomeScreen.js,
// src/screens/MapScreen.js...), il suffira de les importer dans
// App.js à la place de ceux-ci — aucune autre modification requise.
// ============================================================

import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

// Petite fonction réutilisable qui fabrique un écran "vide" avec
// juste un titre centré. On évite de répéter 5 fois le même code
// pour 5 écrans quasi identiques à ce stade.
function ecranTemporaire(titre) {
  // On retourne un VRAI composant React (une fonction qui rend du JSX),
  // pas juste un bout de texte — c'est ce que React Navigation attend.
  return function EcranTemporaire() {
    return (
      <View style={styles.container}>
        <Text style={styles.titre}>{titre}</Text>
        <Text style={styles.sousTitre}>Écran à construire</Text>
      </View>
    );
  };
}

// On exporte un composant par onglet, prêt à être branché dans App.js.
export const HomeScreen = ecranTemporaire('🏠 Accueil');
export const MapScreen = ecranTemporaire('🗺️ Carte');
export const AlertsScreen = ecranTemporaire('🚨 Alertes');
export const ControlScreen = ecranTemporaire('🎛️ Contrôle');
export const MenuScreen = ecranTemporaire('☰ Menu');

// Écran affiché uniquement si l'utilisateur n'est PAS connecté
// (voir la logique dans App.js plus bas).
export function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.titre}>FarmShield</Text>
      <Text style={styles.sousTitre}>Écran de connexion à construire</Text>
    </View>
  );
}

// StyleSheet.create = la façon "officielle" en React Native de
// définir des styles (équivalent du CSS, mais en objet JavaScript).
const styles = StyleSheet.create({
  container: {
    flex: 1,                          // prend toute la hauteur disponible
    backgroundColor: colors.background, // fond sombre cohérent avec le thème
    alignItems: 'center',             // centre horizontalement
    justifyContent: 'center',         // centre verticalement
  },
  titre: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  sousTitre: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
});
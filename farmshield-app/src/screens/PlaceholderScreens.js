

import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

function ecranTemporaire(titre) {

  return function EcranTemporaire() {
    return (
      <View style={styles.container}>
        <Text style={styles.titre}>{titre}</Text>
        <Text style={styles.sousTitre}>Écran à construire</Text>
      </View>
    );
  };
}

export const HomeScreen = ecranTemporaire('🏠 Accueil');
export const MapScreen = ecranTemporaire('🗺️ Carte');
export const AlertsScreen = ecranTemporaire('🚨 Alertes');
export const ControlScreen = ecranTemporaire('🎛️ Contrôle');
export const MenuScreen = ecranTemporaire('☰ Menu');

export function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.titre}>FarmShield</Text>
      <Text style={styles.sousTitre}>Écran de connexion à construire</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,                          
    backgroundColor: colors.background, 
    alignItems: 'center',             
    justifyContent: 'center',      
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

import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './src/theme/colors';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import {
  HomeScreen,
  MapScreen,
  AlertsScreen,
  ControlScreen,
  MenuScreen,
  LoginScreen,
} from './src/screens/PlaceholderScreens';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
function TabsPrincipales() {
  return (
   
    <Tab.Navigator
     
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Accueil') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Carte') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Alertes') {
            iconName = focused ? 'warning' : 'warning-outline';
          } else if (route.name === 'Contrôle') {
            iconName = focused ? 'options' : 'options-outline';
          } else if (route.name === 'Menu') {
            iconName = focused ? 'menu' : 'menu-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },

        tabBarActiveTintColor: colors.primary,

        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,  
          borderTopColor: colors.border,    
          borderTopWidth: 1,
        },
      })}
    >
      {}
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Carte" component={MapScreen} />
      <Tab.Screen name="Alertes" component={AlertsScreen} />
      <Tab.Screen name="Contrôle" component={ControlScreen} />
      <Tab.Screen name="Menu" component={MenuScreen} />
    </Tab.Navigator>
  );
}

function NavigationRacine() {
  
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.chargement}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        // Si connecté : on affiche le groupe d'onglets principal.
        <Stack.Screen name="App" component={TabsPrincipales} />
      ) : (
        // Si pas connecté : on affiche uniquement l'écran de connexion.
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
   
    <AuthProvider>

      {}
      <StatusBar style="light" backgroundColor={colors.background} />

      {}
      <NavigationContainer>
        <NavigationRacine />
      </NavigationContainer>

    </AuthProvider>
  );
}


const styles = StyleSheet.create({
  chargement: {
    flex: 1,                          
    backgroundColor: colors.background,
    alignItems: 'center',             
    justifyContent: 'center',         
  },
});
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Text } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import colors from './src/theme/colors';

// Screens NI3MA
import Login from './src/screens/Login';
import Dashboard from './src/screens/Dashboard';
import EspaceStockage from './src/screens/EspaceStockage';
import ProgrammeIrrigation from './src/screens/ProgrammeIrrigation';
import Statistiques from './src/screens/Statistiques';
import Parametres from './src/screens/Parametres';

// Screens REEM
import CarteFerme from './src/screens/CarteFerme';
import Alertes from './src/screens/Alertes';
import Controle from './src/screens/Controle';
import DetailS1 from './src/screens/DetailS1';
import DetailS2 from './src/screens/DetailS2';
import DetailS3 from './src/screens/DetailS3';
import DetailAlerte from './src/screens/DetailAlerte';
import CameraLive from './src/screens/CameraLive';
import UtilisateursAutorises from './src/screens/UtilisateursAutorises';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen name="Dashboard" component={Dashboard}
        options={{ tabBarLabel: 'Accueil', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text> }} />
      <Tab.Screen name="Carte" component={CarteFerme}
        options={{ tabBarLabel: 'Carte', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🗺</Text> }} />
      <Tab.Screen name="Alertes" component={Alertes}
        options={{ tabBarLabel: 'Alertes', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🔔</Text> }} />
      <Tab.Screen name="Controle" component={Controle}
        options={{ tabBarLabel: 'Contrôle', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🎛</Text> }} />
      <Tab.Screen name="Stock" component={EspaceStockage}
        options={{ tabBarLabel: 'Stock', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📦</Text> }} />
      <Tab.Screen name="Irrigation" component={ProgrammeIrrigation}
        options={{ tabBarLabel: 'Eau', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💧</Text> }} />
      <Tab.Screen name="Statistiques" component={Statistiques}
        options={{ tabBarLabel: 'Stats', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📊</Text> }} />
      <Tab.Screen name="Parametres" component={Parametres}
        options={{ tabBarLabel: 'Réglages', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⚙️</Text> }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="DetailS1" component={DetailS1} />
      <Stack.Screen name="DetailS2" component={DetailS2} />
      <Stack.Screen name="DetailS3" component={DetailS3} />
      <Stack.Screen name="DetailAlerte" component={DetailAlerte} />
      <Stack.Screen name="CameraLive" component={CameraLive} />
      <Stack.Screen name="UtilisateursAutorises" component={UtilisateursAutorises} />
    </Stack.Navigator>
  );
}

function Navigation() {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return token ? <AppNavigator /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Navigation />
      </NavigationContainer>
    </AuthProvider>
  );
}
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import colors from './src/theme/colors';

import Login from './src/screens/Login';
import Dashboard from './src/screens/Dashboard';
import EspaceStockage from './src/screens/EspaceStockage';
import ProgrammeIrrigation from './src/screens/ProgrammeIrrigation';
import Statistiques from './src/screens/Statistiques';
import Parametres from './src/screens/Parametres';

const Tab = createBottomTabNavigator();

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
      <Tab.Screen name="Stock" component={EspaceStockage}
        options={{ tabBarLabel: 'Stock', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📦</Text> }} />
      <Tab.Screen name="Irrigation" component={ProgrammeIrrigation}
        options={{ tabBarLabel: 'Irrigation', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💧</Text> }} />
      <Tab.Screen name="Statistiques" component={Statistiques}
        options={{ tabBarLabel: 'Stats', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📊</Text> }} />
      <Tab.Screen name="Parametres" component={Parametres}
        options={{ tabBarLabel: 'Réglages', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⚙️</Text> }} />
    </Tab.Navigator>
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

  return token ? <TabNavigator /> : <Login />;
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
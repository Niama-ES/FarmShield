import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import {
  ActivityIndicator, View, Text, StyleSheet,
  TouchableOpacity, Modal, AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AlertProvider, useAlerte } from './src/context/AlertContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AlerteUrgente from './src/components/AlerteUrgente';
import colors from './src/theme/colors';
import { API_BASE_URL } from './src/api/config';

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

const Tab         = createBottomTabNavigator();
const Stack       = createStackNavigator();
const navigationRef = React.createRef();

// ── MENU MODAL ────────────────────────────────────────────────────────────────
function MenuModal({ visible, onClose }) {
  const navigation = useNavigation();
  const items = [
    { label: 'Stock',        icon: 'cube-outline',      screen: 'Stock'                },
    { label: 'Irrigation',   icon: 'water-outline',     screen: 'Irrigation'           },
    { label: 'Statistiques', icon: 'bar-chart-outline', screen: 'Statistiques'         },
    { label: 'Caméra',       icon: 'camera-outline',    screen: 'CameraLive'           },
    { label: 'Utilisateurs', icon: 'people-outline',    screen: 'UtilisateursAutorises'},
    { label: 'Paramètres',   icon: 'settings-outline',  screen: 'Parametres'           },
  ];
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.menuCard} activeOpacity={1}>
          <View style={styles.menuHandle} />
          <Text style={styles.menuTitre}>Menu</Text>
          <View style={styles.menuGrid}>
            {items.map(item => (
              <TouchableOpacity
                key={item.screen}
                style={styles.menuItem}
                onPress={() => { onClose(); navigation.navigate(item.screen); }}
              >
                <View style={styles.menuIconBox}>
                  <Ionicons name={item.icon} size={26} color={colors.primary} />
                </View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── TAB NAVIGATOR ─────────────────────────────────────────────────────────────
function TabNavigator() {
  const [menuVisible, setMenuVisible] = useState(false);
  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.cardBorder,
            height: 64, paddingBottom: 8, paddingTop: 6,
          },
          tabBarActiveTintColor:   colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        }}
      >
        <Tab.Screen name="Dashboard" component={Dashboard}
          options={{ tabBarLabel: 'Accueil',  tabBarIcon: ({ color, size }) => <Ionicons name="home-outline"          size={size} color={color} /> }} />
        <Tab.Screen name="Carte"     component={CarteFerme}
          options={{ tabBarLabel: 'Carte',    tabBarIcon: ({ color, size }) => <Ionicons name="map-outline"           size={size} color={color} /> }} />
        <Tab.Screen name="Alertes"   component={Alertes}
          options={{ tabBarLabel: 'Alertes',  tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} /> }} />
        <Tab.Screen name="Controle"  component={Controle}
          options={{ tabBarLabel: 'Contrôle', tabBarIcon: ({ color, size }) => <Ionicons name="toggle-outline"        size={size} color={color} /> }} />
        <Tab.Screen name="MenuTab"   component={Dashboard}
          options={{
            tabBarLabel: 'Menu',
            tabBarIcon: ({ color, size }) => <Ionicons name="menu-outline" size={size} color={color} />,
            tabBarButton: (props) => (
              <TouchableOpacity {...props} onPress={() => setMenuVisible(true)} />
            ),
          }}
        />
      </Tab.Navigator>
      <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
}

// ── APP NAVIGATOR ─────────────────────────────────────────────────────────────
function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs"                  component={TabNavigator}          />
      <Stack.Screen name="Stock"                 component={EspaceStockage}        />
      <Stack.Screen name="Irrigation"            component={ProgrammeIrrigation}   />
      <Stack.Screen name="Statistiques"          component={Statistiques}          />
      <Stack.Screen name="Parametres"            component={Parametres}            />
      <Stack.Screen name="CameraLive"            component={CameraLive}            />
      <Stack.Screen name="UtilisateursAutorises" component={UtilisateursAutorises} />
      <Stack.Screen name="DetailS1"              component={DetailS1}              />
      <Stack.Screen name="DetailS2"              component={DetailS2}              />
      <Stack.Screen name="DetailS3"              component={DetailS3}              />
      <Stack.Screen name="DetailAlerte"          component={DetailAlerte}          />
    </Stack.Navigator>
  );
}

// ── ALERT POLLER ──────────────────────────────────────────────────────────────
// Séparé de Navigation() pour ne jamais causer de re-render de l'arbre
function AlertPoller() {
  const { token }            = useAuth();
  const { declencherAlerte } = useAlerte();
  const lastIdRef            = useRef(null);
  const intervalRef          = useRef(null);
  const appStateRef          = useRef(AppState.currentState);
  const initializedRef       = useRef(false);

  const check = async () => {
    if (!token) return;
    try {
      const res  = await fetch(`${API_BASE_URL}/alerts?lu=false`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      if (list.length === 0) return;

      const latest = list[0];

      // Premier check au démarrage — on enregistre l'ID sans déclencher
      if (!initializedRef.current) {
        lastIdRef.current    = latest.id;
        initializedRef.current = true;
        return;
      }

      // Nouvelle alerte → popup
      if (latest.id !== lastIdRef.current) {
        lastIdRef.current = latest.id;
        declencherAlerte(latest);
      }
    } catch {}
  };

  useEffect(() => {
    if (!token) return;

    check();
    intervalRef.current = setInterval(check, 10000);

    const sub = AppState.addEventListener('change', (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        check();
      }
      appStateRef.current = next;
    });

    return () => {
      clearInterval(intervalRef.current);
      sub.remove();
    };
  }, [token]);

  return null;
}

// ── NAVIGATION ROOT ───────────────────────────────────────────────────────────
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

// ── APP ROOT ──────────────────────────────────────────────────────────────────
// AlertPoller et AlerteUrgente sont EN DEHORS de NavigationContainer
// pour éviter tout re-render qui causerait le bug du "seulement au refresh"
function AppWithAlerts() {
  const { token }                      = useAuth();
  const { alerteUrgente, fermerAlerte} = useAlerte();

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <Navigation />
      </NavigationContainer>

      {/* Poller — invisible, tourne en background */}
      {token && <AlertPoller />}

      {/* Popup fullscreen — par-dessus tout */}
      <AlerteUrgente
        alerte={alerteUrgente}
        onFermer={fermerAlerte}
        onVoirAlertes={() => {
          fermerAlerte();
          navigationRef.current?.navigate('Alertes');
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AlertProvider>
          <AppWithAlerts />
        </AlertProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  menuOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end',
  },
  menuCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  menuHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.cardBorder,
    alignSelf: 'center', marginBottom: 20,
  },
  menuTitre:     { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  menuGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuItem:      { width: '30%', alignItems: 'center', gap: 8 },
  menuIconBox: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: colors.primary + '15',
    borderWidth: 1, borderColor: colors.primary + '33',
    justifyContent: 'center', alignItems: 'center',
  },
  menuItemLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
});
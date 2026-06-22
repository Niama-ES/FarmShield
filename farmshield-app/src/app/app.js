// ============================================================
// App.js
// ------------------------------------------------------------
// RÔLE DE CE FICHIER :
// C'est le POINT DE DÉPART de toute l'application FarmShield.
// Quand le téléphone lance l'app, c'est CE fichier qui s'exécute
// en premier. Son travail :
//   1) Englober toute l'app dans <AuthProvider> pour que TOUS les
//      écrans sachent si l'utilisateur est connecté.
//   2) Mettre en place la navigation par onglets en bas de l'écran
//      (Accueil, Carte, Alertes, Contrôle, Menu).
//   3) Décider quoi afficher : l'écran de connexion (si personne
//      n'est connecté) ou les 5 onglets (si quelqu'un est connecté).
//
// Sans ce fichier : aucun écran ne s'affiche, l'app est un écran noir.
// ============================================================

// ---- IMPORTS DE BASE REACT NATIVE ----
// StatusBar : permet de contrôler l'apparence de la barre en haut
// du téléphone (heure, batterie, wifi) — ici on la met en mode clair
// car notre fond d'app est sombre (texte clair sur fond sombre = lisible).
import { StatusBar } from 'expo-status-bar';

// View : équivalent d'une <div> en HTML — un simple conteneur visuel.
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// ---- IMPORTS DE NAVIGATION ----
// NavigationContainer : la "coquille" obligatoire qui doit envelopper
// TOUTE la navigation de l'app (peu importe le type de navigation
// utilisé à l'intérieur). Sans lui, React Navigation plante.
import { NavigationContainer } from '@react-navigation/native';

// createBottomTabNavigator : crée spécifiquement une navigation par
// ONGLETS EN BAS DE L'ÉCRAN (ce qu'on veut : Accueil/Carte/Alertes/
// Contrôle/Menu). Il existe d'autres types (Stack, Drawer) mais
// le cahier des charges demande explicitement 5 onglets en bas.
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// createNativeStackNavigator : permet d'empiler des écrans les uns
// sur les autres (utile ici pour basculer entre "écran de connexion"
// et "app principale avec onglets" sans qu'ils coexistent).
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Ionicons : une bibliothèque d'icônes (fournie avec Expo) — on
// l'utilise pour afficher une icône différente sur chaque onglet
// (maison pour Accueil, carte pour Carte, etc.)
import { Ionicons } from '@expo/vector-icons';

// ---- IMPORTS PROPRES AU PROJET FARMSHIELD ----
// On importe notre fichier de couleurs centralisé (voir colors.js)
// pour que la navigation respecte le thème vert/sombre de l'app.
import { colors } from './src/theme/colors';

// On importe le Provider et le hook créés dans AuthContext.js.
// AuthProvider = la "boîte" qui contient l'info de connexion.
// useAuth = la fonction pour LIRE cette boîte depuis n'importe où.
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Les écrans (temporaires pour l'instant — voir PlaceholderScreens.js).
// Quand l'équipe aura terminé les vrais écrans, on changera UNIQUEMENT
// cette ligne d'import, rien d'autre dans ce fichier.
import {
  HomeScreen,
  MapScreen,
  AlertsScreen,
  ControlScreen,
  MenuScreen,
  LoginScreen,
} from './src/screens/PlaceholderScreens';

// ---- CRÉATION DES NAVIGATEURS ----
// On crée une instance du navigateur par onglets...
const Tab = createBottomTabNavigator();
// ...et une instance du navigateur en pile (pour Login vs App principale).
const Stack = createNativeStackNavigator();

// ============================================================
// COMPOSANT : TabsPrincipales
// ------------------------------------------------------------
// Ce composant définit les 5 onglets du bas, AFFICHÉS UNIQUEMENT
// quand l'utilisateur est connecté. On le sépare dans sa propre
// fonction pour que App.js reste lisible (un composant = une
// responsabilité claire).
// ============================================================
function TabsPrincipales() {
  return (
    // <Tab.Navigator> = le conteneur qui gère l'affichage des onglets
    // et la barre de navigation en bas.
    <Tab.Navigator
      // screenOptions reçoit une fonction qui s'applique à TOUS les
      // onglets en même temps — plutôt que de répéter ces réglages
      // 5 fois (un par onglet), on les centralise ici.
      screenOptions={({ route }) => ({

        // headerShown: false → on cache la barre de titre en haut,
        // car chaque écran gérera son propre en-tête personnalisé
        // (plus de liberté de design écran par écran).
        headerShown: false,

        // tabBarIcon : fonction qui retourne quelle icône afficher
        // pour CET onglet précis, et si elle est "active" (focused)
        // ou pas (pour changer sa couleur/son style).
        tabBarIcon: ({ focused, color, size }) => {
          // On choisit le nom de l'icône Ionicons selon l'onglet
          // (route.name correspond au nom donné plus bas dans
          // <Tab.Screen name="...">).
          let iconName;

          if (route.name === 'Accueil') {
            // Ionicons propose souvent une version "pleine" (active)
            // et une version "contour" (inactive) du même symbole.
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

          // On retourne le composant icône avec sa couleur et sa
          // taille fournies automatiquement par React Navigation
          // (size et color s'adaptent déjà selon focused).
          return <Ionicons name={iconName} size={size} color={color} />;
        },

        // Couleur de l'icône/texte quand l'onglet EST sélectionné.
        tabBarActiveTintColor: colors.primary,

        // Couleur de l'icône/texte quand l'onglet N'EST PAS sélectionné.
        tabBarInactiveTintColor: colors.textMuted,

        // Style visuel de la barre d'onglets elle-même (le fond).
        tabBarStyle: {
          backgroundColor: colors.surface,  // fond sombre cohérent
          borderTopColor: colors.border,    // fine bordure de séparation
          borderTopWidth: 1,
        },
      })}
    >
      {/* Chaque <Tab.Screen> = un onglet. "name" = le texte affiché
          ET la clé utilisée ci-dessus pour choisir l'icône.
          "component" = quel écran afficher quand on appuie sur cet onglet. */}
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Carte" component={MapScreen} />
      <Tab.Screen name="Alertes" component={AlertsScreen} />
      <Tab.Screen name="Contrôle" component={ControlScreen} />
      <Tab.Screen name="Menu" component={MenuScreen} />
    </Tab.Navigator>
  );
}

// ============================================================
// COMPOSANT : NavigationRacine
// ------------------------------------------------------------
// Ce composant décide QUOI afficher selon l'état de connexion :
//   - Pendant le chargement initial → un rond qui tourne (spinner)
//   - Si pas connecté → l'écran de Login
//   - Si connecté → les 5 onglets (TabsPrincipales ci-dessus)
//
// C'est ICI qu'on utilise useAuth() pour LIRE la "boîte partagée"
// définie dans AuthContext.js.
// ============================================================
function NavigationRacine() {
  // On récupère isAuthenticated et isLoading depuis notre contexte.
  // Comme ce composant est rendu À L'INTÉRIEUR de <AuthProvider>
  // (voir plus bas dans le composant App), useAuth() fonctionne.
  const { isAuthenticated, isLoading } = useAuth();

  // Cas 1 : on vérifie encore si une session existait déjà sur le
  // téléphone (voir chargerSessionExistante() dans AuthContext.js).
  // On affiche un simple indicateur de chargement plutôt qu'un
  // écran vide ou un flash de l'écran de login.
  if (isLoading) {
    return (
      <View style={styles.chargement}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Cas 2 et 3 : selon isAuthenticated, on affiche soit le Login,
  // soit les Tabs principales. On utilise un Stack.Navigator même
  // s'il n'y a qu'un écran à la fois, car ça permet à React
  // Navigation de gérer correctement la transition entre les deux
  // (et de désactiver le bouton "retour" physique du téléphone
  // pour revenir accidentellement à un état déconnecté).
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

// ============================================================
// COMPOSANT PRINCIPAL : App
// ------------------------------------------------------------
// C'est LUI que React Native appelle en premier au démarrage.
// Son unique rôle est d'empiler les "couches" nécessaires dans
// le bon ordre :
//
//   <AuthProvider>            ← fournit l'info de connexion
//     <NavigationContainer>   ← active la navigation
//       <NavigationRacine />  ← décide Login vs Tabs
//     </NavigationContainer>
//   </AuthProvider>
//
// L'ORDRE COMPTE : NavigationRacine utilise useAuth(), donc il DOIT
// être à l'intérieur de AuthProvider, sinon erreur au lancement.
// ============================================================
export default function App() {
  return (
    // AuthProvider enveloppe TOUT le reste : ainsi, peu importe
    // l'écran affiché plus tard (même un futur écran ajouté par
    // un collègue), il pourra appeler useAuth() sans problème.
    <AuthProvider>

      {/* StatusBar "light" = texte/icônes clairs en haut de l'écran
          (heure, batterie...), adapté à notre fond sombre. */}
      <StatusBar style="light" backgroundColor={colors.background} />

      {/* NavigationContainer doit envelopper toute navigation,
          c'est une exigence technique de la bibliothèque React Navigation. */}
      <NavigationContainer>
        <NavigationRacine />
      </NavigationContainer>

    </AuthProvider>
  );
}

// Styles utilisés uniquement dans ce fichier (l'écran de chargement).
const styles = StyleSheet.create({
  chargement: {
    flex: 1,                          // occupe tout l'écran
    backgroundColor: colors.background,
    alignItems: 'center',             // centre horizontalement le spinner
    justifyContent: 'center',         // centre verticalement le spinner
  },
});
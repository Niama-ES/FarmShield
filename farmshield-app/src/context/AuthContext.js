// ============================================================
// src/context/AuthContext.js
// ------------------------------------------------------------
// RÔLE DE CE FICHIER :
// Garder en mémoire, PARTOUT dans l'app, deux informations :
//   1) Est-ce que quelqu'un est connecté ? (isAuthenticated)
//   2) Qui est connecté ? (user : son nom, son rôle, etc.)
//
// POURQUOI C'EST NÉCESSAIRE :
// Sans ce fichier, chaque écran (Accueil, Carte, Alertes...)
// devrait redemander lui-même "est-ce que cette personne a le
// droit d'être ici ?" en interrogeant le serveur séparément.
// Ça duplique du code ET ça peut désynchroniser les écrans
// (un écran pense "connecté", un autre pense "déconnecté").
//
// SOLUTION : React fournit un mécanisme appelé "Context" qui agit
// comme une boîte partagée, visible par TOUS les composants enfants,
// sans avoir à passer l'information manuellement de composant en
// composant (ce qu'on appelle le "prop drilling").
// ============================================================

// On importe les outils React nécessaires :
// - createContext : crée la "boîte partagée" vide
// - useContext   : permet à un écran de LIRE le contenu de la boîte
// - useState     : permet de stocker un état qui peut changer (connecté/pas connecté)
// - useEffect    : permet d'exécuter du code automatiquement au démarrage
import { createContext, useContext, useState, useEffect } from 'react';

// AsyncStorage = la "mémoire persistante" du téléphone (équivalent
// du localStorage sur navigateur web). Contrairement à useState qui
// oublie tout si on ferme l'app, AsyncStorage garde les données même
// après fermeture complète de l'application.
// Utile pour ne pas demander à l'agriculteur de se reconnecter
// à chaque fois qu'il rouvre l'app.
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---- ÉTAPE 1 : créer la "boîte" partagée ----
// Au départ elle ne contient rien (undefined). On va la remplir
// plus bas avec les vraies valeurs grâce à <AuthContext.Provider>.
const AuthContext = createContext(undefined);

// ---- ÉTAPE 2 : créer le "Provider" ----
// Le Provider est un composant qui ENVELOPPE toute l'application
// (on le place dans App.js, autour de la navigation). Tout ce qui
// est à l'intérieur de ce Provider peut accéder aux infos de connexion.
//
// "children" = tout ce que ce composant va englober (dans notre cas :
// toute l'app, donc tous les écrans).
export function AuthProvider({ children }) {

  // user : contient les infos de la personne connectée
  // (ex: { id: 1, nom: "Ahmed", role: "agriculteur" })
  // Au départ : null = personne n'est connecté.
  const [user, setUser] = useState(null);

  // isLoading : pendant qu'on vérifie si une session existait déjà
  // sur le téléphone (au démarrage de l'app), on affiche un écran de
  // chargement plutôt que de montrer directement l'écran de connexion
  // (ce qui clignoterait désagréablement si l'utilisateur était déjà connecté).
  const [isLoading, setIsLoading] = useState(true);

  // ---- ÉTAPE 3 : vérifier au démarrage si une session existe déjà ----
  // useEffect avec un tableau vide [] = "exécute ce code une seule fois,
  // juste après que l'app a fini de s'afficher la première fois".
  useEffect(() => {
    chargerSessionExistante();
  }, []);

  // Fonction qui regarde dans la mémoire du téléphone (AsyncStorage)
  // si un token de connexion a déjà été sauvegardé lors d'une
  // connexion précédente.
  async function chargerSessionExistante() {
    try {
      // On va chercher le token et les infos utilisateur sauvegardés
      const token = await AsyncStorage.getItem('farmshield_token');
      const userJson = await AsyncStorage.getItem('farmshield_user');

      // Si les deux existent, on restaure la session automatiquement
      // (l'agriculteur n'a pas besoin de retaper son mot de passe).
      if (token && userJson) {
        setUser(JSON.parse(userJson));
      }
    } catch (error) {
      // Si AsyncStorage échoue pour une raison quelconque, on ne
      // bloque pas l'app : on log juste l'erreur pour le debug.
      console.log('Erreur chargement session :', error);
    } finally {
      // Que ça ait réussi ou échoué, on arrête l'écran de chargement.
      setIsLoading(false);
    }
  }

  // ---- ÉTAPE 4 : fonction de connexion ----
  // Appelée depuis l'écran de Login quand l'agriculteur entre
  // ses identifiants. Dans une vraie app, "token" et "userData"
  // viendraient de la réponse de l'API backend (Node.js/Express).
  async function login(token, userData) {
    try {
      // On sauvegarde dans la mémoire persistante du téléphone...
      await AsyncStorage.setItem('farmshield_token', token);
      await AsyncStorage.setItem('farmshield_user', JSON.stringify(userData));

      // ...ET on met à jour l'état en mémoire vive pour que l'app
      // réagisse immédiatement (changement d'écran, affichage du nom, etc.)
      setUser(userData);
    } catch (error) {
      console.log('Erreur lors de la connexion :', error);
    }
  }

  // ---- ÉTAPE 5 : fonction de déconnexion ----
  // Appelée depuis l'écran Menu quand l'agriculteur clique sur
  // "Se déconnecter".
  async function logout() {
    try {
      // On efface les données sauvegardées sur le téléphone...
      await AsyncStorage.removeItem('farmshield_token');
      await AsyncStorage.removeItem('farmshield_user');

      // ...ET on vide l'état en mémoire, ce qui fera automatiquement
      // revenir l'app vers l'écran de connexion (voir App.js).
      setUser(null);
    } catch (error) {
      console.log('Erreur lors de la déconnexion :', error);
    }
  }

  // ---- ÉTAPE 6 : préparer le contenu de la "boîte partagée" ----
  // Tout ce qu'on met dans cet objet "value" sera accessible depuis
  // n'importe quel écran via le hook useAuth() défini plus bas.
  const value = {
    user,                              // les infos de la personne connectée (ou null)
    isAuthenticated: user !== null,    // vrai/faux calculé automatiquement
    isLoading,                         // vrai pendant la vérification initiale
    login,                             // fonction à appeler pour se connecter
    logout,                            // fonction à appeler pour se déconnecter
  };

  // On "remplit" la boîte (AuthContext.Provider) avec nos valeurs,
  // et on affiche children = tout le reste de l'application à
  // l'intérieur, qui pourra maintenant accéder à ces informations.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ---- ÉTAPE 7 : créer un raccourci pratique pour les écrans ----
// Plutôt que d'écrire "useContext(AuthContext)" dans chaque écran,
// on crée ce petit hook personnalisé "useAuth()". Plus court,
// plus lisible, et on peut ajouter une vérification de sécurité.
export function useAuth() {
  const context = useContext(AuthContext);

  // Si un écran essaie d'utiliser useAuth() SANS être enveloppé
  // dans <AuthProvider> (erreur de structure dans App.js), on
  // préfère planter immédiatement avec un message clair plutôt
  // que de laisser un bug silencieux et difficile à comprendre.
  if (context === undefined) {
    throw new Error('useAuth() doit être utilisé à l\'intérieur de <AuthProvider>');
  }

  return context;
}
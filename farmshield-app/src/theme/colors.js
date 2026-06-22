// ============================================================
// src/theme/colors.js
// ------------------------------------------------------------
// RÔLE DE CE FICHIER :
// C'est le "nuancier" officiel de l'app FarmShield.
// On définit ICI toutes les couleurs une seule fois, puis tous
// les écrans (Accueil, Carte, Alertes, Contrôle, Menu) viennent
// piocher dedans avec : import { colors } from '../theme/colors';
//
// AVANTAGE CONCRET :
// Si demain le prof ou l'équipe dit "le vert FarmShield est trop
// foncé", on change UNE seule ligne ici (colors.primary) et la
// couleur change automatiquement partout dans les 9 écrans.
// Sans ce fichier, il faudrait chercher "#1D9E75" dans 9 fichiers
// différents et risquer d'en oublier un (incohérence visuelle).
// ============================================================

// "export const" = on rend cette variable disponible pour que
// d'autres fichiers puissent l'importer (sinon elle reste privée
// à ce fichier et personne d'autre ne peut s'en servir).
export const colors = {

  // ---- COULEURS PRINCIPALES DE LA MARQUE ----
  // Le vert "FarmShield" : utilisé pour les boutons principaux,
  // les icônes actives en bas de l'app, les statuts "OK / normal".
  primary: '#1D9E75',

  // Une variante plus claire du vert, utilisée pour les fonds légers
  // (ex: fond d'une carte "tout va bien") sans être agressive à l'œil.
  primaryLight: '#5DCAA5',

  // Une variante plus sombre, utile pour les bordures ou le texte
  // sur fond clair (meilleur contraste qu'un vert trop vif).
  primaryDark: '#0D5C45',

  // ---- COULEURS D'ALERTE (codes utilisés dans le cahier des charges) ----
  // Rouge = alerte CRITIQUE (vol détecté, intrusion confirmée).
  // C'est la couleur la plus "dangereuse" de l'app, à utiliser
  // uniquement pour ce qui demande une réaction immédiate.
  danger: '#E24B4A',

  // Version plus foncée du rouge, pour les fonds de carte d'alerte
  // (le texte rouge clair reste lisible dessus).
  dangerDark: '#8B2C0D',

  // Orange = alerte MOYENNE (anomalie de débit, animal sorti de zone).
  // Une étape en dessous du rouge : "à vérifier" plutôt que "urgence".
  warning: '#FAC775',

  // Bleu = information SIMPLE (stock bas, notification informative).
  // C'est la couleur la "moins grave" parmi les 3 niveaux d'alerte.
  info: '#378ADD',

  // ---- COULEURS DE FOND (l'app est en thème sombre) ----
  // Fond principal de toute l'application (presque noir, nuance verte
  // pour rester dans l'univers "nature/agriculture" plutôt qu'un noir pur).
  background: '#080E08',

  // Fond "secondaire", utilisé pour les cartes/blocs qui se détachent
  // légèrement du fond principal (un peu plus clair que background).
  surface: '#0D1F0D',

  // Fond encore plus clair, pour les éléments "au-dessus" des cartes
  // (ex: une sous-section à l'intérieur d'une carte).
  surfaceLight: '#1A2A1A',

  // ---- COULEURS DE TEXTE ----
  // Texte principal : doit être lisible sur le fond sombre (presque blanc).
  textPrimary: '#EAF3DE',

  // Texte secondaire : pour les informations moins importantes
  // (sous-titres, descriptions) — légèrement grisé/verdâtre.
  textSecondary: '#97C459',

  // Texte "désactivé" ou très discret (ex: placeholder dans un champ vide).
  textMuted: '#3D8A5C',

  // ---- COULEURS UTILITAIRES ----
  // Couleur des bordures fines entre les sections.
  border: '#1A2A1A',

  // Blanc pur, réservé aux rares cas où on veut un contraste maximal
  // (ex: texte sur un bouton rouge plein).
  white: '#FFFFFF',

  // Noir pur, utilisé uniquement pour des ombres ou overlays.
  black: '#000000',
};

// ---- RACCOURCIS PAR STATUT ----
// Beaucoup d'écrans doivent juste dire "ce sous-système est-il
// normal, en avertissement, ou en alerte ?". Plutôt que d'écrire
// partout "if (statut === 'ok') couleur = colors.primary" dans
// chaque écran, on centralise cette logique ICI une seule fois.
export const statusColors = {
  ok: colors.primary,        // tout va bien → vert
  warning: colors.warning,   // à surveiller → orange
  danger: colors.danger,     // alerte critique → rouge
  offline: colors.textMuted, // capteur déconnecté → gris/vert terne
};

// "export default" = en plus des exports nommés ci-dessus, on permet
// aussi d'importer tout l'objet "colors" comme valeur par défaut.
// Ça donne de la flexibilité : import colors from '...' OU
// import { colors } from '...' fonctionnent tous les deux.
export default colors;
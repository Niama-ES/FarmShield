
export const colors = {
  primary: '#1D9E75',
  primaryLight: '#5DCAA5',
  primaryDark: '#0D5C45',
  danger: '#E24B4A',
  dangerDark: '#8B2C0D',
  warning: '#FAC775',
  info: '#378ADD',
  background: '#080E08',
  surface: '#0D1F0D',
  surfaceLight: '#1A2A1A',
  textPrimary: '#EAF3DE',
  textSecondary: '#97C459',
  textMuted: '#3D8A5C',
  border: '#1A2A1A',
  white: '#FFFFFF',
  black: '#000000',
};
export const statusColors = {
  ok: colors.primary,        // tout va bien → vert
  warning: colors.warning,   // à surveiller → orange
  danger: colors.danger,     // alerte critique → rouge
  offline: colors.textMuted, // capteur déconnecté → gris/vert terne
};
export default colors;
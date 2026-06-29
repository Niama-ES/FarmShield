// src/context/ThemeContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Palettes ──────────────────────────────────────────────────────────────────
const DARK = {
  background:    '#0A0F0A',
  card:          '#111811',
  cardBorder:    '#1E2E1E',
  primary:       '#2ECC71',
  primaryDark:   '#27AE60',
  danger:        '#E74C3C',
  warning:       '#E67E22',
  success:       '#2ECC71',
  info:          '#3498DB',
  textPrimary:   '#FFFFFF',
  textSecondary: '#8E9E8E',
  textMuted:     '#4A5E4A',
  s1Color:       '#E67E22',
  s2Color:       '#3498DB',
  s3Color:       '#2ECC71',
  isDark:        true,
};

const LIGHT = {
  background:    '#F4F7F4',
  card:          '#FFFFFF',
  cardBorder:    '#E0EBE0',
  primary:       '#27AE60',
  primaryDark:   '#1E8449',
  danger:        '#E74C3C',
  warning:       '#E67E22',
  success:       '#27AE60',
  info:          '#2980B9',
  textPrimary:   '#0D1F0D',
  textSecondary: '#4A6A4A',
  textMuted:     '#8FAF8F',
  s1Color:       '#D35400',
  s2Color:       '#2471A3',
  s3Color:       '#1E8449',
  isDark:        false,
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = useCallback(async () => {
    const next = !isDark;
    setIsDark(next);
    try { await AsyncStorage.setItem('theme', next ? 'dark' : 'light'); } catch {}
  }, [isDark]);

  // Charger le thème sauvegardé au démarrage
  React.useEffect(() => {
    AsyncStorage.getItem('theme').then(val => {
      if (val === 'light') setIsDark(false);
    }).catch(() => {});
  }, []);

  return (
    <ThemeContext.Provider value={{ colors: isDark ? DARK : LIGHT, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Au démarrage — vérifie si token déjà sauvegardé
  useEffect(() => {
    chargerToken();
  }, []);

  const chargerToken = async () => {
    try {
      const tokenSauvegarde = await AsyncStorage.getItem('token');
      const userSauvegarde = await AsyncStorage.getItem('user');
      if (tokenSauvegarde) {
        setToken(tokenSauvegarde);
        setUser(JSON.parse(userSauvegarde));
      }
    } catch (e) {
      console.log('Erreur chargement token:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (tokenRecu, userRecu) => {
    await AsyncStorage.setItem('token', tokenRecu);
    await AsyncStorage.setItem('user', JSON.stringify(userRecu));
    setToken(tokenRecu);
    setUser(userRecu);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook custom — utilisé dans chaque screen comme ça :
// const { token, user, logout } = useAuth();
export const useAuth = () => useContext(AuthContext);
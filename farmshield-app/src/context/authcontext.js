
import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    chargerSessionExistante();
  }, []);
  async function chargerSessionExistante() {
    try {
      const token = await AsyncStorage.getItem('farmshield_token');
      const userJson = await AsyncStorage.getItem('farmshield_user');
      if (token && userJson) {
        setUser(JSON.parse(userJson));
      }
    } catch (error) {
      console.log('Erreur chargement session :', error);
    } finally {
      setIsLoading(false);
    }
  }


  async function login(token, userData) {
    try {
      await AsyncStorage.setItem('farmshield_token', token);
      await AsyncStorage.setItem('farmshield_user', JSON.stringify(userData));

      setUser(userData);
    } catch (error) {
      console.log('Erreur lors de la connexion :', error);
    }
  }


  async function logout() {
    try {
    
      await AsyncStorage.removeItem('farmshield_token');
      await AsyncStorage.removeItem('farmshield_user');
      setUser(null);
    } catch (error) {
      console.log('Erreur lors de la déconnexion :', error);
    }
  }


  const value = {
    user,                              
    isAuthenticated: user !== null,    
    isLoading,                         
    login,                             
    logout,                          
  };

  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth() doit être utilisé à l\'intérieur de <AuthProvider>');
  }

  return context;
}
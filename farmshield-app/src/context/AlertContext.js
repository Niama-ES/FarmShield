// src/context/AlertContext.js
// Context global pour déclencher la popup d'alerte urgente depuis n'importe où
import React, { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [alerteUrgente, setAlerteUrgente] = useState(null);

  const declencherAlerte = useCallback((alerte) => {
    setAlerteUrgente(alerte);
  }, []);

  const fermerAlerte = useCallback(() => {
    setAlerteUrgente(null);
  }, []);

  return (
    <AlertContext.Provider value={{ alerteUrgente, declencherAlerte, fermerAlerte }}>
      {children}
    </AlertContext.Provider>
  );
}

export const useAlerte = () => useContext(AlertContext);
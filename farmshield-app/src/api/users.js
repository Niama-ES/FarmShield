// src/api/users.js
import { API_BASE_URL } from './config';

export const getProfil = async (token) => {
  const response = await fetch(`${API_BASE_URL}/users/profil`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
};

export const updateProfil = async (token, nom_ferme) => {
  const response = await fetch(`${API_BASE_URL}/users/profil`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ nom_ferme }),
  });
  return await response.json();
};

export const updatePassword = async (token, ancien_mot_de_passe, nouveau_mot_de_passe) => {
  const response = await fetch(`${API_BASE_URL}/users/mot-de-passe`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ancien_mot_de_passe, nouveau_mot_de_passe }),
  });
  return await response.json();
};
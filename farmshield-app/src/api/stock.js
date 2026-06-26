// src/api/stock.js
import { API_BASE_URL } from './config';

export const getStock = async (token) => {
  const response = await fetch(`${API_BASE_URL}/stock`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
};

export const addItem = async (token, nom, quantite_initiale, unite, seuil_alerte) => {
  const response = await fetch(`${API_BASE_URL}/stock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ nom, quantite_initiale, unite, seuil_alerte }),
  });
  return await response.json();
};

export const updateItem = async (token, id, champs) => {
  const response = await fetch(`${API_BASE_URL}/stock/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(champs),
  });
  return await response.json();
};

export const deleteItem = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/stock/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
};
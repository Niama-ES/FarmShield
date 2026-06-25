// src/api/irrigation.js
import { API_BASE_URL } from './config';

export const getProgrammes = async (token) => {
  const response = await fetch(`${API_BASE_URL}/irrigation`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
};

export const getActifs = async (token) => {
  const response = await fetch(`${API_BASE_URL}/irrigation/actifs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
};

export const createProgramme = async (token, data) => {
  const response = await fetch(`${API_BASE_URL}/irrigation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return await response.json();
};

export const updateProgramme = async (token, id, data) => {
  const response = await fetch(`${API_BASE_URL}/irrigation/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return await response.json();
};

export const deleteProgramme = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/irrigation/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
};
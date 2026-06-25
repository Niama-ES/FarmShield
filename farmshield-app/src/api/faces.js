import { API_BASE_URL } from './config';

export const getVisages = async (token) => {
  const response = await fetch(`${API_BASE_URL}/faces`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
};

export const addVisage = async (token, nom, photo_base64) => {
  const response = await fetch(`${API_BASE_URL}/faces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ nom, photo_base64 }),
  });
  return await response.json();
};

export const bloquerVisage = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/faces/${id}/bloquer`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
};

export const deleteVisage = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/faces/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
};
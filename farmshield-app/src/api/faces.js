// src/api/faces.js
import { API_BASE_URL } from './config';

// ── GET — liste des visages autorisés ────────────────────────────────────────
export const getVisages = async (token) => {
  const res = await fetch(`${API_BASE_URL}/faces`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

// ── POST — ajouter un visage avec photos base64 ──────────────────────────────
export const addVisage = async (token, nom, photos_base64 = []) => {
  const res = await fetch(`${API_BASE_URL}/faces`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify({ nom, photos_base64 }),
  });
  return res.json();
};

// ── DELETE — supprimer un visage ─────────────────────────────────────────────
export const deleteVisage = async (token, id) => {
  const res = await fetch(`${API_BASE_URL}/faces/${id}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};
// src/api/sensors.js
import { API_BASE_URL } from './config';

export const getStatus = async (token) => {
  const response = await fetch(`${API_BASE_URL}/sensors/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
};

export const getHistory = async (token, systeme) => {
  // systeme = 'S1' | 'S2' | 'S3'
  const response = await fetch(`${API_BASE_URL}/sensors/history/${systeme}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
};
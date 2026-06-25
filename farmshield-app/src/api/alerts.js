import { API_BASE_URL } from './config';

export const getAlertes = async (token, filtre = null) => {
  const url = filtre
    ? `${API_BASE_URL}/alerts?sous_systeme=${filtre}`
    : `${API_BASE_URL}/alerts`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
};

export const marquerLu = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/alerts/${id}/lu`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
};
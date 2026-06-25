import { API_BASE_URL } from './config';

export const actionVanne = async (token, action) => {
  const response = await fetch(`${API_BASE_URL}/control/vanne`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action }),
  });
  return await response.json();
};

export const actionSirene = async (token, action) => {
  const response = await fetch(`${API_BASE_URL}/control/sirene`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action }),
  });
  return await response.json();
};
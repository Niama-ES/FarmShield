import { API_BASE_URL } from './config';

export const getCameraStatus = async (token) => {
  const response = await fetch(`${API_BASE_URL}/camera/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
};
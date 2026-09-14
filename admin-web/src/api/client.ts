import axios from 'axios';
import { API_BASE_URL } from '../config';
import { TOKEN_STORAGE_KEY } from '../auth/AuthContext';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

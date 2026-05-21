import axios from 'axios';
import { getUserFriendlyError } from '../utils/userFriendlyError.js';

// Configuration HTTP client
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Création de l'instance axios
const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token d'authentification
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const userData = localStorage.getItem('auth_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user?.tenantId) {
          config.headers['x-tenant-id'] = user.tenantId;
        }
      } catch {
        // Ignore malformed local data.
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
http.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    error.userMessage = getUserFriendlyError(error);
    const authEndpoints = ['/auth/social'];
    const requestUrl = error.config?.url || '';
    const isAuthRequest = authEndpoints.some((endpoint) => requestUrl.includes(endpoint));

    if (error.response?.status === 401 && !isAuthRequest) {
      // Token expiré ou invalide
      localStorage.removeItem('auth_token');
      // Redirection vers login si nécessaire
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { http, API_BASE_URL };

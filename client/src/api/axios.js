// src/api/axios.js
// Configured Axios instance for all API calls to the backend

import axios from 'axios';

// Create Axios instance with base URL pointing to the Express server
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Handle 401 Unauthorized globally (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('⚠️ Unauthorized — session is unavailable or expired');
    }
    return Promise.reject(error);
  }
);

export default api;

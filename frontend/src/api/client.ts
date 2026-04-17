import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// VITE_API_URL should be the backend root (e.g. https://ojakazi-backend.vercel.app).
// In dev it is left unset and the Vite proxy handles /api/* forwarding.
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/api`
  : '/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
let refreshing = false;
let queue: Array<() => void> = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    if (refreshing) {
      return new Promise((resolve) => {
        queue.push(() => resolve(apiClient(original)));
      });
    }

    refreshing = true;
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
      queue.forEach((fn) => fn());
      queue = [];
      return apiClient(original);
    } catch {
      queue = [];
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    } finally {
      refreshing = false;
    }
  }
);

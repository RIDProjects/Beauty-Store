import axios from 'axios';

// En Vercel usar ruta relativa (/api), en desarrollo usar variable de entorno
const getBaseUrl = () => {
  // Si hay una variable de entorno explícita, usarla (para desarrollo local)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL}/api`;
  }
  // En Vercel, usar ruta relativa (mismo dominio)
  return '/api';
};

const API_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('femstore_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 globally - logout user
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('femstore_token');
      localStorage.removeItem('femstore_user');
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getImageUrl = (url?: string | null): string => {
  if (!url) return '/placeholder-product.jpg';
  if (url.startsWith('http')) return url;
  // En Vercel las imágenes también vienen del mismo dominio
  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
  }
  return url;
};

export default api;

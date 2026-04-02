import axios from 'axios';
import { encryptPayload, decryptResponse, encryptFields } from './encryption';

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

// Campos sensibles a encriptar en requests según el endpoint
// NO incluir password - debe viajar en texto plano para bcrypt en backend
const SENSITIVE_FIELDS_MAP: Record<string, string[]> = {
  '/orders': ['customer_phone', 'customer_email', 'delivery_address', 'notes'],
  '/auth/register': ['name', 'email', 'phone'],
  '/auth/login': ['email'], // Solo email, NO password
};

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
  
  // Encriptar datos sensibles en el payload de requests POST/PUT/PATCH
  if (config.data && (config.method === 'post' || config.method === 'put' || config.method === 'patch')) {
    const url = config.url || '';
    const sensitiveFields = SENSITIVE_FIELDS_MAP[url] || [];
    
    if (sensitiveFields.length > 0) {
      const sensitiveData: Record<string, unknown> = {};
      let hasSensitiveData = false;
      
      for (const field of sensitiveFields) {
        if (config.data[field]) {
          sensitiveData[field] = config.data[field];
          hasSensitiveData = true;
        }
      }
      
      if (hasSensitiveData) {
        // Encriptar solo los campos sensibles
        config.data = { ...config.data, ...encryptFields(sensitiveData, sensitiveFields) };
      }
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

// Helper para desencriptar responses con datos sensibles
export const decryptOrder = <T extends Record<string, unknown>>(order: T): T => {
  return decryptResponse(order);
};

export const decryptOrders = <T extends Record<string, unknown>>(orders: T[]): T[] => {
  return orders.map(order => decryptResponse(order));
};

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

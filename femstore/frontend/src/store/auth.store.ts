import { create } from 'zustand';
import { User } from '../types';
import api from '../lib/api';
import { useCartStore } from './cart.store';

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string }) => Promise<void>;
}

// Decodifica un JWT sin verificar la firma para leer su payload (exp).
// La verificación real ocurre en el backend; esto es solo para no enviar
// tokens claramente expirados.
function isJwtExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    ) as { exp?: number };
    if (!decoded.exp) return false;
    // exp viene en segundos
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function clearAuthStorage() {
  localStorage.removeItem('femstore_token');
  localStorage.removeItem('femstore_user');
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('femstore_token');
    const userStr = localStorage.getItem('femstore_user');

    if (!token || !userStr) {
      set({ isInitialized: true });
      return;
    }

    // 1) Chequeo local: si el JWT está expirado, no hace falta llamar al backend.
    if (isJwtExpired(token)) {
      clearAuthStorage();
      set({ user: null, token: null, isInitialized: true });
      return;
    }

    // 2) Hidratamos optimistamente con el user en localStorage
    let optimisticUser: User | null = null;
    try {
      optimisticUser = JSON.parse(userStr) as User;
      set({ user: optimisticUser, token });
    } catch {
      clearAuthStorage();
      set({ user: null, token: null, isInitialized: true });
      return;
    }

    // 3) Validamos contra backend con /auth/me. Si falla con 401, el interceptor
    // de axios ya limpia el storage; nosotros sincronizamos el state.
    try {
      const { data } = await api.get('/auth/me');
      const user = data.data as User;
      localStorage.setItem('femstore_user', JSON.stringify(user));
      set({ user, token, isInitialized: true });
    } catch {
      clearAuthStorage();
      set({ user: null, token: null, isInitialized: true });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user, token } = data.data;
      localStorage.setItem('femstore_token', token);
      localStorage.setItem('femstore_user', JSON.stringify(user));
      set({ user, token, isLoading: false });
    } catch (error: unknown) {
      set({ isLoading: false });
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al iniciar sesión';
      throw new Error(msg);
    }
  },

  register: async (name, email, password, phone) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/register', { name, email, password, phone });
      const { user, token } = data.data;
      localStorage.setItem('femstore_token', token);
      localStorage.setItem('femstore_user', JSON.stringify(user));
      set({ user, token, isLoading: false });
    } catch (error: unknown) {
      set({ isLoading: false });
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al registrarse';
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('femstore_token');
    localStorage.removeItem('femstore_user');
    // Limpiar carrito para evitar que el siguiente usuario vea items del anterior
    useCartStore.getState().clearCart();
    set({ user: null, token: null });
  },

  updateProfile: async (data) => {
    const { data: res } = await api.put('/auth/profile', data);
    const updatedUser = res.data;
    localStorage.setItem('femstore_user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
}));

// Selector helpers
export const useUser = () => useAuthStore((s) => s.user);
export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'admin');
export const useIsAuthenticated = () => useAuthStore((s) => !!s.user);

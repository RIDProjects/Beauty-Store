import { create } from 'zustand';
import { User } from '../types';
import api from '../lib/api';

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
  updateProfile: (data: { name?: string; phone?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,

  initialize: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('femstore_token');
    const userStr = localStorage.getItem('femstore_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, token, isInitialized: true });
        return;
      } catch {
        localStorage.removeItem('femstore_token');
        localStorage.removeItem('femstore_user');
      }
    }
    set({ isInitialized: true });
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

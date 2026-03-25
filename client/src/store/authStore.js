import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('edusync_user') || 'null'),
  token: localStorage.getItem('edusync_token') || null,
  isAuthenticated: !!localStorage.getItem('edusync_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('edusync_token', data.token);
      localStorage.setItem('edusync_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  register: async (name, email, password, role, joinCode) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role, joinCode });
      localStorage.setItem('edusync_token', data.token);
      localStorage.setItem('edusync_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('edusync_token');
    localStorage.removeItem('edusync_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      localStorage.setItem('edusync_user', JSON.stringify(data));
      set({ user: data });
    } catch {
      get().logout();
    }
  },
}));

export default useAuthStore;

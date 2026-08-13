import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  // ─── State ──────────────────────────────────────────────────
  user: null,
  isAuthenticated: false,
  isLoading: true, // True initially until we check for existing session
  error: null,

  // ─── Actions ────────────────────────────────────────────────

  /**
   * Register a new user.
   */
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', userData);
      if (data.data?.accessToken && data.data?.user) {
        localStorage.setItem('accessToken', data.data.accessToken);
        set({
          user: data.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed.';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Verify email with OTP.
   */
  verifyEmail: async (email, otp) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/verify-email', { email, otp });
      localStorage.setItem('accessToken', data.data.accessToken);
      set({
        user: data.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed.';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Login user.
   */
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', data.data.accessToken);
      set({
        user: data.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed.';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Logout user.
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Proceed with client-side logout even if API call fails
    }
    localStorage.removeItem('accessToken');
    set({ user: null, isAuthenticated: false, error: null });
  },

  /**
   * Delete user account permanently.
   */
  deleteAccount: async () => {
    set({ isLoading: true, error: null });
    try {
      await api.delete('/users/me');
      localStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete account.';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Check if user has an existing session (on app load).
   */
  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const { data } = await api.get('/users/me');
      set({
        user: data.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem('accessToken');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  /**
   * Update user data in the store (after profile edits, avatar uploads, etc.)
   */
  updateUser: (updatedData) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...updatedData } });
    }
  },

  /**
   * Clear error state.
   */
  clearError: () => set({ error: null }),
}));

export default useAuthStore;

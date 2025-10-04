import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "../services/authService";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      // Login action
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(credentials);
          const { user, token } = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Set token untuk request selanjutnya
          localStorage.setItem("token", token);

          return { success: true, data: response.data };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error.response?.data?.message || "Login failed",
          };
        }
      },

      // Register action
      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(userData);
          set({ isLoading: false });
          return { success: true, data: response.data };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error.response?.data?.message || "Registration failed",
          };
        }
      },

      // Logout action
      logout: () => {
        localStorage.removeItem("token");
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      // Initialize dari localStorage
      initialize: () => {
        const token = localStorage.getItem("token");
        if (token) {
          // Verifikasi token masih valid
          authService
            .verifyToken()
            .then((response) => {
              set({
                user: response.data.user,
                token,
                isAuthenticated: true,
                isInitialized: true,
              });
            })
            .catch(() => {
              localStorage.removeItem("token");
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                isInitialized: true,
              });
            });
        } else {
          set({ isInitialized: true });
        }
      },

      // Update user profile
      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

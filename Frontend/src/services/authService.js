import api from "../utils/api";

export const authService = {
  // Login
  login: async (credentials) => {
    return await api.post("/auth/login", credentials);
  },

  // Register
  register: async (userData) => {
    return await api.post("/auth/register", userData);
  },

  // Verify token
  verifyToken: async () => {
    try {
      return await api.get("/auth/verify");
    } catch (error) {
      // Jika backend tidak tersedia, anggap token invalid
      throw new Error("Token verification failed");
    }
  },

  // Refresh token
  refreshToken: async () => {
    return await api.post("/auth/refresh");
  },

  // Logout
  logout: async () => {
    try {
      return await api.post("/auth/logout");
    } catch (error) {
      // Ignore error saat logout, tetap clear local storage
      console.log("Logout API failed, clearing local storage anyway");
      return { data: { message: "Logged out locally" } };
    }
  },

  // Get user profile
  getProfile: async () => {
    return await api.get("/auth/profile");
  },

  // Update profile
  updateProfile: async (userData) => {
    return await api.put("/auth/profile", userData);
  },
};

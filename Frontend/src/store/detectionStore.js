import { create } from "zustand";

export const useDetectionStore = create((set, get) => ({
  detections: [],
  stats: {
    total: 0,
    low: 0,
    medium: 0,
    high: 0,
  },
  isLoading: false,
  error: null,

  // Fetch detection history
  fetchDetections: async () => {
    set({ isLoading: true, error: null });
    try {
      // Implementasi API call nanti
      const response = await fetch("/api/extension/detections", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      set({
        detections: data.detections || [],
        stats: data.stats || { total: 0, low: 0, medium: 0, high: 0 },
        isLoading: false,
      });
    } catch (error) {
      console.log("Failed to fetch detections:", error.message);
      set({
        isLoading: false,
        error: error.message,
        // Set default values jika API gagal
        detections: [],
        stats: { total: 0, low: 0, medium: 0, high: 0 },
      });
    }
  },

  // Add new detection
  addDetection: (detection) => {
    const currentDetections = get().detections;
    const currentStats = get().stats;

    set({
      detections: [detection, ...currentDetections],
      stats: {
        total: currentStats.total + 1,
        [detection.level]: currentStats[detection.level] + 1,
      },
    });
  },

  // Clear all detections
  clearDetections: () => {
    set({
      detections: [],
      stats: { total: 0, low: 0, medium: 0, high: 0 },
    });
  },
}));

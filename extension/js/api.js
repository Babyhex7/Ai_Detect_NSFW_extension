// API communication handler
class ApiHandler {
  constructor() {
    this.baseUrl = "http://localhost:3000/api";
    this.timeout = 30000; // 30 seconds
  }

  // Get auth token dari storage
  async getAuthToken() {
    try {
      const result = await chrome.storage.local.get(["authToken"]);
      return result.authToken;
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to get auth token", error);
      return null;
    }
  }

  // Set auth token ke storage
  async setAuthToken(token) {
    try {
      await chrome.storage.local.set({ authToken: token });
      return true;
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to set auth token", error);
      return false;
    }
  }

  // Remove auth token dari storage
  async removeAuthToken() {
    try {
      await chrome.storage.local.remove(["authToken"]);
      return true;
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to remove auth token", error);
      return false;
    }
  }

  // Generic fetch dengan auth
  async makeRequest(endpoint, options = {}) {
    try {
      const token = await this.getAuthToken();
      const url = `${this.baseUrl}${endpoint}`;

      const defaultOptions = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        timeout: this.timeout,
      };

      const requestOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      ExtensionHelpers.log("error", `API request failed: ${endpoint}`, error);

      if (error.name === "AbortError") {
        return { success: false, error: "Request timeout" };
      }

      return { success: false, error: error.message };
    }
  }

  // Detect image content
  async detectImage(imageData) {
    try {
      const response = await this.makeRequest("/detect", {
        method: "POST",
        body: JSON.stringify({
          image: imageData.dataUrl,
          url: imageData.url,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          domain: ExtensionHelpers.getDomainFromUrl(window.location.href),
        }),
      });

      return response;
    } catch (error) {
      ExtensionHelpers.log("error", "Image detection failed", error);
      return { success: false, error: error.message };
    }
  }

  // Log activity
  async logActivity(activityData) {
    try {
      const response = await this.makeRequest("/log", {
        method: "POST",
        body: JSON.stringify({
          ...activityData,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          domain: ExtensionHelpers.getDomainFromUrl(window.location.href),
        }),
      });

      return response;
    } catch (error) {
      ExtensionHelpers.log("error", "Activity logging failed", error);
      return { success: false, error: error.message };
    }
  }

  // Get user settings from server
  async getSettings() {
    try {
      const response = await this.makeRequest("/settings");
      return response;
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to get settings", error);
      return { success: false, error: error.message };
    }
  }

  // Update user settings
  async updateSettings(settings) {
    try {
      const response = await this.makeRequest("/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });

      return response;
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to update settings", error);
      return { success: false, error: error.message };
    }
  }

  // Get detection history
  async getHistory(page = 1, limit = 20) {
    try {
      const response = await this.makeRequest(
        `/history?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to get history", error);
      return { success: false, error: error.message };
    }
  }

  // Get analytics data
  async getAnalytics(period = "7d") {
    try {
      const response = await this.makeRequest(`/analytics?period=${period}`);
      return response;
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to get analytics", error);
      return { success: false, error: error.message };
    }
  }

  // Verify auth token
  async verifyAuth() {
    try {
      const response = await this.makeRequest("/auth/verify");
      return response;
    } catch (error) {
      ExtensionHelpers.log("error", "Auth verification failed", error);
      return { success: false, error: error.message };
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.makeRequest("/health");
      return response;
    } catch (error) {
      ExtensionHelpers.log("error", "Health check failed", error);
      return { success: false, error: error.message };
    }
  }

  // Batch processing untuk multiple images
  async batchDetect(imagesData) {
    try {
      const response = await this.makeRequest("/detect/batch", {
        method: "POST",
        body: JSON.stringify({
          images: imagesData,
          timestamp: Date.now(),
          domain: ExtensionHelpers.getDomainFromUrl(window.location.href),
        }),
      });

      return response;
    } catch (error) {
      ExtensionHelpers.log("error", "Batch detection failed", error);
      return { success: false, error: error.message };
    }
  }

  // Report false positive/negative
  async reportFeedback(detectionId, feedback) {
    try {
      const response = await this.makeRequest("/feedback", {
        method: "POST",
        body: JSON.stringify({
          detectionId,
          feedback,
          timestamp: Date.now(),
        }),
      });

      return response;
    } catch (error) {
      ExtensionHelpers.log("error", "Feedback submission failed", error);
      return { success: false, error: error.message };
    }
  }
}

// Export global instance
window.apiHandler = new ApiHandler();

// Popup script untuk extension
class PopupManager {
  constructor() {
    this.isAuthenticated = false;
    this.isDetectionActive = false;
    this.userInfo = null;
    this.stats = {
      detected: 0,
      blocked: 0,
    };
    this.dashboardUrl = "http://localhost:3001";
  }

  // Initialize popup
  async init() {
    try {
      await this.loadAuthStatus();
      await this.loadUserInfo();
      await this.loadStats();
      this.setupEventListeners();
      this.updateUI();
    } catch (error) {
      console.error("Popup initialization failed:", error);
      this.showError("Gagal memuat data extension");
    }
  }

  // Load authentication status
  async loadAuthStatus() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "GET_AUTH_STATUS",
      });
      this.isAuthenticated = response.isAuthenticated;

      if (this.isAuthenticated) {
        await this.loadDetectionStatus();
      }
    } catch (error) {
      console.error("Failed to load auth status:", error);
      this.isAuthenticated = false;
    }
  }

  // Load user information
  async loadUserInfo() {
    if (!this.isAuthenticated) return;

    try {
      const result = await chrome.storage.local.get(["userInfo"]);
      this.userInfo = result.userInfo;
    } catch (error) {
      console.error("Failed to load user info:", error);
    }
  }

  // Load detection status
  async loadDetectionStatus() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab) return;

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "GET_STATUS",
      });
      if (response && !response.error) {
        this.isDetectionActive = response.isDetectionEnabled;
      }
    } catch (error) {
      console.error("Failed to load detection status:", error);
    }
  }

  // Load statistics
  async loadStats() {
    try {
      // Get from storage or API
      const result = await chrome.storage.local.get(["dailyStats"]);
      const today = new Date().toDateString();
      const dailyStats = result.dailyStats || {};
      const todayStats = dailyStats[today] || { detected: 0, blocked: 0 };

      this.stats = todayStats;
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Login button
    document.getElementById("loginBtn").addEventListener("click", () => {
      this.handleLogin();
    });

    // Toggle detection button
    document
      .getElementById("toggleDetectionBtn")
      .addEventListener("click", () => {
        this.handleToggleDetection();
      });

    // Dashboard button
    document.getElementById("dashboardBtn").addEventListener("click", () => {
      this.openDashboard();
    });

    // Logout button
    document.getElementById("logoutBtn").addEventListener("click", () => {
      this.handleLogout();
    });

    // Footer links
    document.getElementById("settingsLink").addEventListener("click", (e) => {
      e.preventDefault();
      this.openDashboard("/settings");
    });

    document.getElementById("helpLink").addEventListener("click", (e) => {
      e.preventDefault();
      this.openDashboard("/help");
    });
  }

  // Update UI based on state
  updateUI() {
    this.hideAllStates();

    if (this.isAuthenticated) {
      this.showAuthenticatedState();
    } else {
      this.showNotAuthenticatedState();
    }
  }

  // Hide all state containers
  hideAllStates() {
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("notAuthState").style.display = "none";
    document.getElementById("authState").style.display = "none";
  }

  // Show not authenticated state
  showNotAuthenticatedState() {
    document.getElementById("notAuthState").style.display = "block";
  }

  // Show authenticated state
  showAuthenticatedState() {
    document.getElementById("authState").style.display = "block";
    this.updateUserInfo();
    this.updateDetectionStatus();
    this.updateStats();
  }

  // Update user information
  updateUserInfo() {
    const userInfoEl = document.getElementById("userInfo");

    if (this.userInfo) {
      userInfoEl.style.display = "block";
      userInfoEl.querySelector(".user-name").textContent =
        this.userInfo.name || "User";
      userInfoEl.querySelector(".user-email").textContent =
        this.userInfo.email || "";
    } else {
      userInfoEl.style.display = "none";
    }
  }

  // Update detection status
  updateDetectionStatus() {
    const statusEl = document.getElementById("detectionStatus");
    const toggleBtn = document.getElementById("toggleDetectionBtn");

    if (this.isDetectionActive) {
      statusEl.className = "status-indicator status-active";
      statusEl.querySelector("span").textContent = "Aktif";
      toggleBtn.textContent = "Stop Deteksi";
      toggleBtn.className = "btn btn-danger";
    } else {
      statusEl.className = "status-indicator status-inactive";
      statusEl.querySelector("span").textContent = "Nonaktif";
      toggleBtn.textContent = "Mulai Deteksi";
      toggleBtn.className = "btn";
    }
  }

  // Update statistics
  updateStats() {
    document.getElementById("detectedCount").textContent = this.stats.detected;
    document.getElementById("blockedCount").textContent = this.stats.blocked;
  }

  // Handle login
  async handleLogin() {
    try {
      const loginUrl = `${this.dashboardUrl}/login?source=extension`;
      await chrome.tabs.create({ url: loginUrl, active: true });
      window.close(); // Close popup
    } catch (error) {
      console.error("Login failed:", error);
      this.showError("Gagal membuka halaman login");
    }
  }

  // Handle logout
  async handleLogout() {
    try {
      // Clear auth data
      await chrome.storage.local.remove([
        "authToken",
        "userInfo",
        "loginTimestamp",
      ]);

      // Notify background script
      chrome.runtime.sendMessage({ type: "LOGOUT" });

      // Update UI
      this.isAuthenticated = false;
      this.isDetectionActive = false;
      this.userInfo = null;
      this.updateUI();
    } catch (error) {
      console.error("Logout failed:", error);
      this.showError("Gagal logout");
    }
  }

  // Handle toggle detection
  async handleToggleDetection() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab) return;

      const messageType = this.isDetectionActive
        ? "STOP_DETECTION"
        : "START_DETECTION";
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: messageType,
      });

      if (response && response.success) {
        this.isDetectionActive = !this.isDetectionActive;
        this.updateDetectionStatus();

        // Save setting
        await chrome.storage.local.set({
          detectionEnabled: this.isDetectionActive,
        });
      }
    } catch (error) {
      console.error("Toggle detection failed:", error);
      this.showError("Gagal mengubah status deteksi");
    }
  }

  // Open dashboard
  async openDashboard(path = "") {
    try {
      const url = `${this.dashboardUrl}${path}`;
      await chrome.tabs.create({ url: url, active: true });
      window.close();
    } catch (error) {
      console.error("Failed to open dashboard:", error);
      this.showError("Gagal membuka dashboard");
    }
  }

  // Show error message
  showError(message) {
    // Simple error handling - bisa diperbaiki dengan toast/notification
    alert(message);
  }

  // Show loading state
  showLoading() {
    this.hideAllStates();
    document.getElementById("loadingState").style.display = "block";
  }

  // Refresh data
  async refresh() {
    this.showLoading();
    await this.init();
  }
}

// Initialize popup when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const popupManager = new PopupManager();
  popupManager.init();

  // Listen for auth status changes
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "AUTH_STATUS_CHANGED") {
      popupManager.refresh();
    }
  });
});

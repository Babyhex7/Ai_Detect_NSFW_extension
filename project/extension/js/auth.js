// Authentication handler
class AuthHandler {
  constructor() {
    this.dashboardUrl = "http://localhost:3001"; // Frontend dashboard URL
    this.apiHandler = window.apiHandler;
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const token = await this.getToken();
      if (!token) return false;

      // Verify token dengan server
      const response = await this.apiHandler.verifyAuth();
      return response.success;
    } catch (error) {
      ExtensionHelpers.log("error", "Authentication check failed", error);
      return false;
    }
  }

  // Get stored auth token
  async getToken() {
    try {
      const result = await chrome.storage.local.get(["authToken"]);
      return result.authToken;
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to get auth token", error);
      return null;
    }
  }

  // Store auth token
  async setToken(token) {
    try {
      await chrome.storage.local.set({
        authToken: token,
        loginTimestamp: Date.now(),
      });
      return true;
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to store auth token", error);
      return false;
    }
  }

  // Remove auth token (logout)
  async logout() {
    try {
      await chrome.storage.local.remove([
        "authToken",
        "loginTimestamp",
        "userInfo",
      ]);

      // Clear any cached settings
      await chrome.storage.local.remove([
        "serverSettings",
        "lastSyncTimestamp",
      ]);

      ExtensionHelpers.log("info", "User logged out successfully");
      return true;
    } catch (error) {
      ExtensionHelpers.log("error", "Logout failed", error);
      return false;
    }
  }

  // Open login page di dashboard
  async openLoginPage() {
    try {
      const loginUrl = `${this.dashboardUrl}/login?source=extension`;

      // Open in new tab
      const tab = await chrome.tabs.create({
        url: loginUrl,
        active: true,
      });

      ExtensionHelpers.log("info", "Login page opened", { tabId: tab.id });
      return tab;
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to open login page", error);
      return null;
    }
  }

  // Handle login success callback dari dashboard
  async handleLoginSuccess(token, userInfo) {
    try {
      // Store token
      await this.setToken(token);

      // Store user info
      await chrome.storage.local.set({
        userInfo: userInfo,
        lastSyncTimestamp: Date.now(),
      });

      // Sync settings dari server
      await this.syncSettings();

      ExtensionHelpers.log("info", "Login successful", { userId: userInfo.id });
      return true;
    } catch (error) {
      ExtensionHelpers.log("error", "Login success handling failed", error);
      return false;
    }
  }

  // Get user info dari storage
  async getUserInfo() {
    try {
      const result = await chrome.storage.local.get(["userInfo"]);
      return result.userInfo || null;
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to get user info", error);
      return null;
    }
  }

  // Sync settings dengan server
  async syncSettings() {
    try {
      const response = await this.apiHandler.getSettings();

      if (response.success) {
        await chrome.storage.local.set({
          serverSettings: response.data,
          lastSyncTimestamp: Date.now(),
        });

        ExtensionHelpers.log("info", "Settings synced successfully");
        return true;
      } else {
        ExtensionHelpers.log("warn", "Settings sync failed", response.error);
        return false;
      }
    } catch (error) {
      ExtensionHelpers.log("error", "Settings sync error", error);
      return false;
    }
  }

  // Check if token akan expire soon
  async checkTokenExpiry() {
    try {
      const result = await chrome.storage.local.get(["loginTimestamp"]);
      const loginTime = result.loginTimestamp;

      if (!loginTime) return true; // Consider expired if no timestamp

      const now = Date.now();
      const tokenAge = now - loginTime;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      return tokenAge > maxAge;
    } catch (error) {
      ExtensionHelpers.log("error", "Token expiry check failed", error);
      return true; // Consider expired on error
    }
  }

  // Auto refresh token jika perlu
  async refreshTokenIfNeeded() {
    try {
      const isExpired = await this.checkTokenExpiry();

      if (isExpired) {
        const response = await this.apiHandler.verifyAuth();

        if (!response.success) {
          // Token invalid, force logout
          await this.logout();
          return false;
        }

        // Update timestamp
        await chrome.storage.local.set({
          loginTimestamp: Date.now(),
        });
      }

      return true;
    } catch (error) {
      ExtensionHelpers.log("error", "Token refresh failed", error);
      return false;
    }
  }

  // Listen untuk messages dari dashboard (untuk login callback)
  setupMessageListener() {
    // Listen untuk messages dari dashboard web
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "LOGIN_SUCCESS") {
        this.handleLoginSuccess(message.token, message.userInfo).then(
          (success) => {
            sendResponse({ success });

            // Notify content scripts about login
            chrome.tabs.query({}, (tabs) => {
              tabs.forEach((tab) => {
                chrome.tabs.sendMessage(tab.id, {
                  type: "AUTH_STATUS_CHANGED",
                  isAuthenticated: true,
                });
              });
            });
          }
        );
        return true; // Async response
      }

      if (message.type === "LOGOUT") {
        this.logout().then((success) => {
          sendResponse({ success });

          // Notify content scripts about logout
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
              chrome.tabs.sendMessage(tab.id, {
                type: "AUTH_STATUS_CHANGED",
                isAuthenticated: false,
              });
            });
          });
        });
        return true; // Async response
      }
    });
  }

  // Initialize auth handler
  init() {
    this.setupMessageListener();

    // Check token on startup
    this.refreshTokenIfNeeded();
  }
}

// Export global instance
window.authHandler = new AuthHandler();

// Initialize
window.authHandler.init();

// Background Service Worker
class BackgroundService {
  constructor() {
    this.init();
  }

  init() {
    // Listener untuk pesan dari content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Async response
    });

    // Listener untuk perubahan tab
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo);
    });

    // Listener untuk update tab
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdated(tabId, changeInfo, tab);
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case "DETECT_IMAGE":
          const result = await this.detectImage(message.data);
          sendResponse(result);
          break;

        case "LOG_ACTIVITY":
          await this.logActivity(message.data);
          sendResponse({ success: true });
          break;

        case "CLOSE_TAB":
          await this.closeTab(sender.tab.id);
          sendResponse({ success: true });
          break;

        case "GET_AUTH_STATUS":
          const authStatus = await this.getAuthStatus();
          sendResponse(authStatus);
          break;

        default:
          sendResponse({ error: "Unknown message type" });
      }
    } catch (error) {
      console.error("Background error:", error);
      sendResponse({ error: error.message });
    }
  }

  async detectImage(imageData) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { error: "Not authenticated" };
      }

      const response = await fetch("http://localhost:3000/api/detect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: imageData.dataUrl,
          url: imageData.url,
          timestamp: Date.now(),
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Detection error:", error);
      return { error: "Detection failed" };
    }
  }

  async logActivity(activityData) {
    try {
      const token = await this.getAuthToken();
      if (!token) return;

      await fetch("http://localhost:3000/api/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(activityData),
      });
    } catch (error) {
      console.error("Log activity error:", error);
    }
  }

  async closeTab(tabId) {
    try {
      await chrome.tabs.remove(tabId);
    } catch (error) {
      console.error("Close tab error:", error);
    }
  }

  async getAuthToken() {
    try {
      const result = await chrome.storage.local.get(["authToken"]);
      return result.authToken;
    } catch (error) {
      console.error("Get auth token error:", error);
      return null;
    }
  }

  async getAuthStatus() {
    try {
      const token = await this.getAuthToken();
      return { isAuthenticated: !!token };
    } catch (error) {
      return { isAuthenticated: false };
    }
  }

  handleTabActivated(activeInfo) {
    // Reset detection state when switching tabs
    chrome.tabs.sendMessage(activeInfo.tabId, { type: "RESET_DETECTION" });
  }

  handleTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === "complete" && tab.url) {
      // Tab loaded, start detection if enabled
      chrome.tabs.sendMessage(tabId, { type: "START_DETECTION" });
    }
  }
}

// Initialize background service
new BackgroundService();

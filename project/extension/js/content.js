// Main content script - Entry point untuk detection
class ContentScript {
  constructor() {
    this.isInitialized = false;
    this.isDetectionEnabled = false;
    this.pageLoadTime = Date.now();
  }

  // Initialize content script
  async init() {
    try {
      if (this.isInitialized) return;

      ExtensionHelpers.log("info", "Initializing content script", {
        url: window.location.href,
        title: document.title,
      });

      // Check authentication status
      const isAuthenticated = await window.authHandler.isAuthenticated();
      if (!isAuthenticated) {
        ExtensionHelpers.log(
          "info",
          "User not authenticated, skipping detection"
        );
        return;
      }

      // Load settings
      const settings = await ExtensionHelpers.getSettings();
      this.isDetectionEnabled = settings.detectionEnabled;

      if (!this.isDetectionEnabled) {
        ExtensionHelpers.log("info", "Detection disabled in settings");
        return;
      }

      // Check domain restrictions
      if (await this.shouldSkipDomain()) {
        ExtensionHelpers.log("info", "Domain restricted, skipping detection");
        return;
      }

      // Setup message listeners
      this.setupMessageListeners();

      // Initialize DOM observers
      window.domObservers.init();

      // Start detection after page load
      this.startDetection();

      this.isInitialized = true;
      ExtensionHelpers.log("info", "Content script initialized successfully");
    } catch (error) {
      ExtensionHelpers.log(
        "error",
        "Content script initialization failed",
        error
      );
    }
  }

  // Check if domain should be skipped
  async shouldSkipDomain() {
    try {
      const currentUrl = window.location.href;
      const domain = ExtensionHelpers.getDomainFromUrl(currentUrl);

      if (!domain) return true;

      // Skip extension and browser pages
      if (
        domain.includes("chrome-extension://") ||
        domain.includes("moz-extension://") ||
        domain.includes("about:") ||
        domain.includes("chrome://")
      ) {
        return true;
      }

      // Check blacklist
      const isBlacklisted = await ExtensionHelpers.isDomainBlacklisted(
        currentUrl
      );
      if (isBlacklisted) {
        return true;
      }

      // Check whitelist (skip jika ada whitelist tapi domain tidak ada di dalamnya)
      const settings = await ExtensionHelpers.getSettings();
      if (
        settings.whitelistedDomains &&
        settings.whitelistedDomains.length > 0
      ) {
        const isWhitelisted = await ExtensionHelpers.isDomainWhitelisted(
          currentUrl
        );
        return !isWhitelisted;
      }

      return false;
    } catch (error) {
      ExtensionHelpers.log("error", "Domain check failed", error);
      return true; // Skip on error
    }
  }

  // Setup message listeners dari background dan popup
  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Async response
    });
  }

  // Handle messages
  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case "START_DETECTION":
          await this.startDetection();
          sendResponse({ success: true });
          break;

        case "STOP_DETECTION":
          await this.stopDetection();
          sendResponse({ success: true });
          break;

        case "RESET_DETECTION":
          await this.resetDetection();
          sendResponse({ success: true });
          break;

        case "GET_STATUS":
          const status = await this.getStatus();
          sendResponse(status);
          break;

        case "AUTH_STATUS_CHANGED":
          await this.handleAuthStatusChange(message.isAuthenticated);
          sendResponse({ success: true });
          break;

        case "SETTINGS_UPDATED":
          await this.handleSettingsUpdate(message.settings);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ error: "Unknown message type" });
      }
    } catch (error) {
      ExtensionHelpers.log("error", "Message handling failed", error);
      sendResponse({ error: error.message });
    }
  }

  // Start detection process
  async startDetection() {
    try {
      if (!this.isInitialized) {
        await this.init();
        return;
      }

      this.isDetectionEnabled = true;

      // Reset observers untuk fresh start
      window.domObservers.reset();

      ExtensionHelpers.log("info", "Detection started");

      // Log page visit
      await this.logPageVisit();
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to start detection", error);
    }
  }

  // Stop detection process
  async stopDetection() {
    try {
      this.isDetectionEnabled = false;

      // Stop observers
      window.domObservers.stopObserving();

      // Cleanup processing
      window.processingHandler.cleanup();

      // Close any open modals
      window.modalHandler.forceClose();

      ExtensionHelpers.log("info", "Detection stopped");
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to stop detection", error);
    }
  }

  // Reset detection (untuk page reload/navigation)
  async resetDetection() {
    try {
      await this.stopDetection();

      // Small delay before restart
      setTimeout(async () => {
        if (this.isDetectionEnabled) {
          await this.startDetection();
        }
      }, 1000);
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to reset detection", error);
    }
  }

  // Get current status
  async getStatus() {
    try {
      const settings = await ExtensionHelpers.getSettings();
      const isAuthenticated = await window.authHandler.isAuthenticated();
      const observerStats = window.domObservers.getStats();
      const processingStats = window.processingHandler.getStats();

      return {
        isInitialized: this.isInitialized,
        isDetectionEnabled: this.isDetectionEnabled,
        isAuthenticated: isAuthenticated,
        settings: settings,
        stats: {
          observers: observerStats,
          processing: processingStats,
          pageLoadTime: this.pageLoadTime,
          uptime: Date.now() - this.pageLoadTime,
        },
        domain: ExtensionHelpers.getDomainFromUrl(window.location.href),
        url: window.location.href,
      };
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to get status", error);
      return {
        isInitialized: false,
        isDetectionEnabled: false,
        error: error.message,
      };
    }
  }

  // Handle authentication status change
  async handleAuthStatusChange(isAuthenticated) {
    try {
      if (isAuthenticated) {
        // User logged in, start detection
        if (!this.isDetectionEnabled) {
          await this.init();
        }
      } else {
        // User logged out, stop detection
        await this.stopDetection();
        this.isInitialized = false;
      }
    } catch (error) {
      ExtensionHelpers.log(
        "error",
        "Auth status change handling failed",
        error
      );
    }
  }

  // Handle settings update
  async handleSettingsUpdate(newSettings) {
    try {
      // Save new settings
      await ExtensionHelpers.saveSettings(newSettings);

      // Update detection state
      this.isDetectionEnabled = newSettings.detectionEnabled;

      if (this.isDetectionEnabled) {
        await this.startDetection();
      } else {
        await this.stopDetection();
      }

      ExtensionHelpers.log("info", "Settings updated", newSettings);
    } catch (error) {
      ExtensionHelpers.log("error", "Settings update failed", error);
    }
  }

  // Log page visit untuk analytics
  async logPageVisit() {
    try {
      await window.apiHandler.logActivity({
        type: "page_visit",
        url: window.location.href,
        domain: ExtensionHelpers.getDomainFromUrl(window.location.href),
        title: document.title,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to log page visit", error);
    }
  }

  // Cleanup saat page unload
  cleanup() {
    try {
      this.stopDetection();

      // Cleanup global handlers
      if (window.domObservers) {
        window.domObservers.cleanup();
      }

      if (window.processingHandler) {
        window.processingHandler.cleanup();
      }

      if (window.modalHandler) {
        window.modalHandler.forceClose();
      }

      ExtensionHelpers.log("info", "Content script cleaned up");
    } catch (error) {
      ExtensionHelpers.log("error", "Cleanup failed", error);
    }
  }
}

// Initialize content script
const contentScript = new ContentScript();

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    contentScript.init();
  });
} else {
  contentScript.init();
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  contentScript.cleanup();
});

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Page hidden, pause detection
    contentScript.stopDetection();
  } else {
    // Page visible, resume detection
    if (contentScript.isDetectionEnabled) {
      contentScript.startDetection();
    }
  }
});

// Export untuk debugging
window.nsfwDetector = {
  contentScript,
  helpers: window.ExtensionHelpers,
  api: window.apiHandler,
  auth: window.authHandler,
  levels: window.RiskLevels,
  modal: window.modalHandler,
  processing: window.processingHandler,
  observers: window.domObservers,
};

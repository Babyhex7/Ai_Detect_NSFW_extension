// Helper functions untuk extension
class ExtensionHelpers {
  // Cek apakah gambar terlalu kecil untuk diproses
  static isImageTooSmall(element, minWidth = 100, minHeight = 100) {
    if (!element) return true;

    const width = element.naturalWidth || element.width || element.offsetWidth;
    const height =
      element.naturalHeight || element.height || element.offsetHeight;

    return width < minWidth || height < minHeight;
  }

  // Cek apakah element sudah pernah diproses
  static hasBeenProcessed(element) {
    return element.hasAttribute("data-nsfw-processed");
  }

  // Mark element sebagai sudah diproses
  static markAsProcessed(element) {
    element.setAttribute("data-nsfw-processed", "true");
  }

  // Cek apakah element sedang dalam viewport
  static isInViewport(element) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // Cek apakah element visible
  static isVisible(element) {
    if (!element) return false;

    const style = window.getComputedStyle(element);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  }

  // Get domain dari URL
  static getDomainFromUrl(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }

  // Cek apakah domain dalam whitelist
  static async isDomainWhitelisted(url) {
    try {
      const domain = this.getDomainFromUrl(url);
      if (!domain) return false;

      const result = await chrome.storage.local.get(["whitelistedDomains"]);
      const whitelist = result.whitelistedDomains || [];

      return whitelist.some(
        (whitelistedDomain) =>
          domain.includes(whitelistedDomain) ||
          whitelistedDomain.includes(domain)
      );
    } catch (error) {
      console.error("Error checking whitelist:", error);
      return false;
    }
  }

  // Cek apakah domain dalam blacklist
  static async isDomainBlacklisted(url) {
    try {
      const domain = this.getDomainFromUrl(url);
      if (!domain) return false;

      const result = await chrome.storage.local.get(["blacklistedDomains"]);
      const blacklist = result.blacklistedDomains || [];

      return blacklist.some(
        (blacklistedDomain) =>
          domain.includes(blacklistedDomain) ||
          blacklistedDomain.includes(domain)
      );
    } catch (error) {
      console.error("Error checking blacklist:", error);
      return false;
    }
  }

  // Get pengaturan extension
  static async getSettings() {
    try {
      const result = await chrome.storage.local.get([
        "detectionEnabled",
        "captureInterval",
        "privacyMode",
        "whitelistedDomains",
        "blacklistedDomains",
      ]);

      return {
        detectionEnabled: result.detectionEnabled !== false, // default true
        captureInterval: result.captureInterval || 5000, // default 5 seconds
        privacyMode: result.privacyMode || false, // default false
        whitelistedDomains: result.whitelistedDomains || [],
        blacklistedDomains: result.blacklistedDomains || [],
      };
    } catch (error) {
      console.error("Error getting settings:", error);
      return {
        detectionEnabled: true,
        captureInterval: 5000,
        privacyMode: false,
        whitelistedDomains: [],
        blacklistedDomains: [],
      };
    }
  }

  // Save pengaturan extension
  static async saveSettings(settings) {
    try {
      await chrome.storage.local.set(settings);
      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      return false;
    }
  }

  // Throttle function untuk membatasi frequency
  static throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Debounce function untuk delay execution
  static debounce(func, delay) {
    let debounceTimer;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
  }

  // Generate unique ID
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Log dengan timestamp
  static log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (level === "error") {
      console.error(logMessage, data);
    } else if (level === "warn") {
      console.warn(logMessage, data);
    } else {
      console.log(logMessage, data);
    }
  }

  // Sleep function
  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Validate image URL
  static isValidImageUrl(url) {
    if (!url) return false;

    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
    ];
    const urlLower = url.toLowerCase();

    return (
      imageExtensions.some((ext) => urlLower.includes(ext)) ||
      url.startsWith("data:image/") ||
      url.startsWith("blob:")
    );
  }

  // Get file extension from URL
  static getFileExtension(url) {
    try {
      const pathname = new URL(url).pathname;
      return pathname.split(".").pop().toLowerCase();
    } catch {
      return null;
    }
  }

  // Format file size
  static formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

// Export untuk digunakan di file lain
window.ExtensionHelpers = ExtensionHelpers;

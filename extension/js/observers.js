// DOM observers untuk mendeteksi gambar dan video baru
class DOMObservers {
  constructor() {
    this.mutationObserver = null;
    this.intersectionObserver = null;
    this.isObserving = false;
    this.observedElements = new WeakSet();
    this.processingQueue = [];
    this.isProcessingQueue = false;
  }

  // Initialize semua observers
  init() {
    try {
      this.setupMutationObserver();
      this.setupIntersectionObserver();
      this.startObserving();

      ExtensionHelpers.log("info", "DOM observers initialized");
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to initialize observers", error);
    }
  }

  // Setup MutationObserver untuk detect elemen baru
  setupMutationObserver() {
    this.mutationObserver = new MutationObserver((mutations) => {
      const addedElements = [];

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check node itu sendiri
            if (this.isTargetElement(node)) {
              addedElements.push(node);
            }

            // Check child elements
            const childImages = node.querySelectorAll
              ? node.querySelectorAll("img, video")
              : [];
            childImages.forEach((child) => {
              if (this.isTargetElement(child)) {
                addedElements.push(child);
              }
            });
          }
        });
      });

      if (addedElements.length > 0) {
        this.queueElementsForProcessing(addedElements);
      }
    });
  }

  // Setup IntersectionObserver untuk detect elemen masuk viewport
  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: "50px", // Start observing 50px before entering viewport
      threshold: 0.1, // Trigger when 10% visible
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      const visibleElements = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => entry.target)
        .filter((element) => !this.observedElements.has(element));

      if (visibleElements.length > 0) {
        this.queueElementsForProcessing(visibleElements);
      }
    }, options);
  }

  // Start observing
  startObserving() {
    if (this.isObserving) return;

    // Start mutation observer
    this.mutationObserver.observe(document, {
      childList: true,
      subtree: true,
      attributeFilter: ["src", "data-src"], // Watch for lazy loading
    });

    // Observe existing elements
    this.observeExistingElements();

    this.isObserving = true;
    ExtensionHelpers.log("info", "Started DOM observation");
  }

  // Stop observing
  stopObserving() {
    if (!this.isObserving) return;

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    this.isObserving = false;
    this.processingQueue = [];

    ExtensionHelpers.log("info", "Stopped DOM observation");
  }

  // Observe elemen yang sudah ada di halaman
  observeExistingElements() {
    try {
      const existingElements = document.querySelectorAll("img, video");
      const validElements = Array.from(existingElements).filter((element) =>
        this.isTargetElement(element)
      );

      // Add ke intersection observer untuk lazy processing
      validElements.forEach((element) => {
        this.intersectionObserver.observe(element);
      });

      ExtensionHelpers.log(
        "info",
        `Observing ${validElements.length} existing elements`
      );
    } catch (error) {
      ExtensionHelpers.log(
        "error",
        "Failed to observe existing elements",
        error
      );
    }
  }

  // Check apakah element adalah target (img/video)
  isTargetElement(element) {
    if (!element || !element.tagName) return false;

    const tagName = element.tagName.toLowerCase();
    return tagName === "img" || tagName === "video";
  }

  // Queue elements untuk processing
  queueElementsForProcessing(elements) {
    try {
      const validElements = elements.filter((element) => {
        // Skip jika sudah di-observe
        if (this.observedElements.has(element)) {
          return false;
        }

        // Basic validation
        if (!this.isTargetElement(element)) {
          return false;
        }

        // Mark sebagai observed
        this.observedElements.add(element);

        // Add ke intersection observer untuk future visibility tracking
        if (this.intersectionObserver) {
          this.intersectionObserver.observe(element);
        }

        return true;
      });

      if (validElements.length > 0) {
        this.processingQueue.push(...validElements);
        this.processQueue();

        ExtensionHelpers.log(
          "info",
          `Queued ${validElements.length} elements for processing`
        );
      }
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to queue elements", error);
    }
  }

  // Process queue dengan throttling
  async processQueue() {
    if (this.isProcessingQueue || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Process batch (max 3 elemen per batch)
      const batchSize = 3;
      const batch = this.processingQueue.splice(0, batchSize);

      await Promise.all(batch.map((element) => this.processElement(element)));

      // Continue processing jika ada yang tersisa
      if (this.processingQueue.length > 0) {
        setTimeout(() => {
          this.isProcessingQueue = false;
          this.processQueue();
        }, 1000); // 1 second delay antara batch
      } else {
        this.isProcessingQueue = false;
      }
    } catch (error) {
      ExtensionHelpers.log("error", "Queue processing failed", error);
      this.isProcessingQueue = false;
    }
  }

  // Process single element
  async processElement(element) {
    try {
      // Check settings
      const settings = await ExtensionHelpers.getSettings();
      if (!settings.detectionEnabled) {
        return;
      }

      // Check authentication
      const isAuth = await window.authHandler.isAuthenticated();
      if (!isAuth) {
        return;
      }

      // Check domain filters
      const currentUrl = window.location.href;
      const isWhitelisted = await ExtensionHelpers.isDomainWhitelisted(
        currentUrl
      );
      const isBlacklisted = await ExtensionHelpers.isDomainBlacklisted(
        currentUrl
      );

      if (
        isBlacklisted ||
        (settings.whitelistedDomains.length > 0 && !isWhitelisted)
      ) {
        return;
      }

      // Process berdasarkan tipe element
      if (element.tagName.toLowerCase() === "img") {
        await window.processingHandler.processImage(element);
      } else if (element.tagName.toLowerCase() === "video") {
        await window.processingHandler.processVideo(element);
      }
    } catch (error) {
      ExtensionHelpers.log("error", "Element processing failed", error);
    }
  }

  // Handle lazy loaded images
  handleLazyLoading(element) {
    // Watch untuk src changes (lazy loading)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          (mutation.attributeName === "src" ||
            mutation.attributeName === "data-src")
        ) {
          const newSrc = element.src || element.getAttribute("data-src");
          if (newSrc && ExtensionHelpers.isValidImageUrl(newSrc)) {
            this.queueElementsForProcessing([element]);
          }
        }
      });
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ["src", "data-src"],
    });

    // Auto disconnect setelah src terisi
    setTimeout(() => {
      if (element.src || element.getAttribute("data-src")) {
        observer.disconnect();
      }
    }, 5000);
  }

  // Reset observers (untuk halaman baru)
  reset() {
    this.stopObserving();
    this.observedElements = new WeakSet();
    this.processingQueue = [];
    this.isProcessingQueue = false;

    // Restart dengan delay
    setTimeout(() => {
      this.init();
    }, 1000);
  }

  // Get observer statistics
  getStats() {
    return {
      isObserving: this.isObserving,
      queueLength: this.processingQueue.length,
      isProcessingQueue: this.isProcessingQueue,
      observedElementsCount: this.observedElements ? "WeakSet" : 0,
    };
  }

  // Cleanup observers
  cleanup() {
    this.stopObserving();
    this.observedElements = null;
    this.processingQueue = [];
    this.mutationObserver = null;
    this.intersectionObserver = null;
  }
}

// Export global instance
window.domObservers = new DOMObservers();

// Image and video processing untuk NSFW detection
class ProcessingHandler {
  constructor() {
    this.frameRate = 25; // Capture every 25 frames for video
    this.maxImageSize = 224; // Max dimension untuk model
    this.activeVideos = new Map(); // Track video processing
    this.imageQueue = []; // Queue untuk batch processing
    this.isProcessing = false;
  }

  // Process gambar element
  async processImage(imgElement) {
    try {
      // Validasi element
      if (!this.isValidImageElement(imgElement)) {
        return null;
      }

      // Check jika sudah diproses
      if (ExtensionHelpers.hasBeenProcessed(imgElement)) {
        return null;
      }

      // Load dan resize image
      const imageData = await this.loadAndResizeImage(imgElement);
      if (!imageData) {
        return null;
      }

      // Mark sebagai processed
      ExtensionHelpers.markAsProcessed(imgElement);

      // Send untuk deteksi
      const result = await this.detectContent(imageData, imgElement.src);

      if (result && result.success) {
        await this.handleDetectionResult(result.data, imgElement.src);
      }

      return result;
    } catch (error) {
      ExtensionHelpers.log("error", "Image processing failed", error);
      return null;
    }
  }

  // Process video element
  async processVideo(videoElement) {
    try {
      // Validasi element
      if (!this.isValidVideoElement(videoElement)) {
        return null;
      }

      // Check jika sudah diproses
      if (ExtensionHelpers.hasBeenProcessed(videoElement)) {
        return null;
      }

      // Setup video processing
      const videoId = ExtensionHelpers.generateId();
      this.setupVideoProcessing(videoElement, videoId);

      // Mark sebagai processed
      ExtensionHelpers.markAsProcessed(videoElement);

      return { success: true, videoId };
    } catch (error) {
      ExtensionHelpers.log("error", "Video processing failed", error);
      return null;
    }
  }

  // Validasi image element
  isValidImageElement(imgElement) {
    if (!imgElement || imgElement.tagName !== "IMG") {
      return false;
    }

    // Check ukuran
    if (ExtensionHelpers.isImageTooSmall(imgElement)) {
      return false;
    }

    // Check visibility
    if (!ExtensionHelpers.isVisible(imgElement)) {
      return false;
    }

    // Check source
    if (!imgElement.src || !ExtensionHelpers.isValidImageUrl(imgElement.src)) {
      return false;
    }

    return true;
  }

  // Validasi video element
  isValidVideoElement(videoElement) {
    if (!videoElement || videoElement.tagName !== "VIDEO") {
      return false;
    }

    // Check ukuran
    if (ExtensionHelpers.isImageTooSmall(videoElement)) {
      return false;
    }

    // Check visibility
    if (!ExtensionHelpers.isVisible(videoElement)) {
      return false;
    }

    return true;
  }

  // Load dan resize image
  async loadAndResizeImage(imgElement) {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Create temporary image untuk cross-origin handling
        const tempImg = new Image();
        tempImg.crossOrigin = "anonymous";

        tempImg.onload = () => {
          try {
            const { width, height } = this.calculateResize(
              tempImg.width,
              tempImg.height
            );

            canvas.width = width;
            canvas.height = height;

            // Draw resized image
            ctx.drawImage(tempImg, 0, 0, width, height);

            // Convert ke data URL
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

            resolve({
              dataUrl: dataUrl,
              width: width,
              height: height,
              originalWidth: tempImg.width,
              originalHeight: tempImg.height,
            });
          } catch (error) {
            ExtensionHelpers.log("error", "Canvas processing failed", error);
            resolve(null);
          }
        };

        tempImg.onerror = () => {
          ExtensionHelpers.log("warn", "Failed to load image", imgElement.src);
          resolve(null);
        };

        tempImg.src = imgElement.src;
      } catch (error) {
        ExtensionHelpers.log("error", "Image loading failed", error);
        resolve(null);
      }
    });
  }

  // Calculate optimal resize dimensions
  calculateResize(originalWidth, originalHeight) {
    const maxSize = this.maxImageSize;

    if (originalWidth <= maxSize && originalHeight <= maxSize) {
      return { width: originalWidth, height: originalHeight };
    }

    const aspectRatio = originalWidth / originalHeight;

    if (originalWidth > originalHeight) {
      return {
        width: maxSize,
        height: Math.round(maxSize / aspectRatio),
      };
    } else {
      return {
        width: Math.round(maxSize * aspectRatio),
        height: maxSize,
      };
    }
  }

  // Setup video frame capture
  setupVideoProcessing(videoElement, videoId) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    let frameCount = 0;
    let positiveCount = 0;
    let negativeCount = 0;

    const processFrame = async () => {
      try {
        frameCount++;

        // Capture frame setiap frameRate
        if (frameCount % this.frameRate !== 0) {
          return;
        }

        // Check jika video masih playing
        if (videoElement.paused || videoElement.ended) {
          this.stopVideoProcessing(videoId);
          return;
        }

        // Capture frame
        const frameData = this.captureVideoFrame(videoElement, canvas, ctx);
        if (!frameData) {
          return;
        }

        // Detect frame
        const result = await this.detectContent(frameData, videoElement.src);

        if (result && result.success) {
          const classification = RiskLevels.classifyResult(result.data);

          // Count positive/negative detections
          if (
            classification.name === "MEDIUM" ||
            classification.name === "HIGH"
          ) {
            positiveCount++;
          } else {
            negativeCount++;
          }

          // Threshold untuk menentukan action
          const totalDetections = positiveCount + negativeCount;
          if (totalDetections >= 5) {
            // After 5 detections
            const positiveRatio = positiveCount / totalDetections;

            if (positiveRatio > 0.6) {
              // 60% positive
              await this.handleDetectionResult(result.data, videoElement.src);
              this.stopVideoProcessing(videoId);
            } else if (totalDetections >= 10) {
              // Reset after 10 detections
              positiveCount = 0;
              negativeCount = 0;
            }
          }
        }
      } catch (error) {
        ExtensionHelpers.log("error", "Video frame processing failed", error);
      }
    };

    // Store processing info
    this.activeVideos.set(videoId, {
      element: videoElement,
      interval: setInterval(processFrame, 1000 / 30), // 30 FPS check
      canvas: canvas,
      ctx: ctx,
    });

    // Auto cleanup on video end
    videoElement.addEventListener("ended", () => {
      this.stopVideoProcessing(videoId);
    });

    videoElement.addEventListener("pause", () => {
      this.stopVideoProcessing(videoId);
    });
  }

  // Capture single video frame
  captureVideoFrame(videoElement, canvas, ctx) {
    try {
      const { width, height } = this.calculateResize(
        videoElement.videoWidth || videoElement.width,
        videoElement.videoHeight || videoElement.height
      );

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(videoElement, 0, 0, width, height);

      return {
        dataUrl: canvas.toDataURL("image/jpeg", 0.8),
        width: width,
        height: height,
        originalWidth: videoElement.videoWidth,
        originalHeight: videoElement.videoHeight,
      };
    } catch (error) {
      ExtensionHelpers.log("error", "Video frame capture failed", error);
      return null;
    }
  }

  // Stop video processing
  stopVideoProcessing(videoId) {
    const videoInfo = this.activeVideos.get(videoId);
    if (videoInfo) {
      clearInterval(videoInfo.interval);
      this.activeVideos.delete(videoId);
    }
  }

  // Send untuk content detection
  async detectContent(imageData, sourceUrl) {
    try {
      // Add ke queue jika sedang processing
      if (this.isProcessing) {
        this.imageQueue.push({ imageData, sourceUrl });
        return { success: true, queued: true };
      }

      this.isProcessing = true;

      const result = await window.apiHandler.detectImage({
        dataUrl: imageData.dataUrl,
        url: sourceUrl,
        width: imageData.width,
        height: imageData.height,
        timestamp: Date.now(),
      });

      this.isProcessing = false;

      // Process queue
      this.processQueue();

      return result;
    } catch (error) {
      this.isProcessing = false;
      ExtensionHelpers.log("error", "Content detection failed", error);
      return { success: false, error: error.message };
    }
  }

  // Process queue batch
  async processQueue() {
    if (this.imageQueue.length === 0 || this.isProcessing) {
      return;
    }

    // Process next item in queue
    const nextItem = this.imageQueue.shift();
    if (nextItem) {
      setTimeout(() => {
        this.detectContent(nextItem.imageData, nextItem.sourceUrl);
      }, 100); // Small delay
    }
  }

  // Handle detection result
  async handleDetectionResult(detectionData, imageUrl) {
    try {
      // Show modal jika ada konten yang terdeteksi
      const classification = RiskLevels.classifyResult(detectionData);

      // Only show modal untuk MEDIUM dan HIGH risk
      if (classification.name === "MEDIUM" || classification.name === "HIGH") {
        await window.modalHandler.showModal(detectionData, imageUrl);
      }

      // Log activity
      await window.apiHandler.logActivity({
        type: "content_detected",
        level: classification.name,
        confidence: classification.confidence,
        url: imageUrl,
        domain: ExtensionHelpers.getDomainFromUrl(window.location.href),
        timestamp: Date.now(),
      });
    } catch (error) {
      ExtensionHelpers.log("error", "Detection result handling failed", error);
    }
  }

  // Cleanup semua processing
  cleanup() {
    // Stop semua video processing
    this.activeVideos.forEach((videoInfo, videoId) => {
      this.stopVideoProcessing(videoId);
    });

    // Clear queue
    this.imageQueue = [];
    this.isProcessing = false;
  }

  // Get processing statistics
  getStats() {
    return {
      activeVideos: this.activeVideos.size,
      queueLength: this.imageQueue.length,
      isProcessing: this.isProcessing,
    };
  }
}

// Export global instance
window.processingHandler = new ProcessingHandler();

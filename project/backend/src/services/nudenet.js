const axios = require("axios");

class NudeNetService {
  constructor() {
    this.baseUrl = process.env.NUDENET_SERVICE_URL || "http://localhost:8000";
    this.apiKey = process.env.NUDENET_API_KEY;
    this.timeout = 30000; // 30 seconds
  }

  async detectImage(imageData) {
    try {
      const startTime = Date.now();

      const response = await axios.post(
        `${this.baseUrl}/detect`,
        {
          image: imageData,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
          timeout: this.timeout,
        }
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          predictions: response.data.predictions || [],
          confidence: response.data.confidence || 0,
          processingTime,
        },
      };
    } catch (error) {
      console.error("NudeNet detection failed:", error.message);

      if (error.code === "ECONNREFUSED") {
        return {
          success: false,
          error: "NudeNet service unavailable",
          code: "SERVICE_UNAVAILABLE",
        };
      }

      if (error.response && error.response.status === 429) {
        return {
          success: false,
          error: "Rate limit exceeded",
          code: "RATE_LIMIT",
        };
      }

      return {
        success: false,
        error: error.message,
        code: "DETECTION_FAILED",
      };
    }
  }

  async batchDetect(imagesData) {
    try {
      const startTime = Date.now();

      const response = await axios.post(
        `${this.baseUrl}/detect/batch`,
        {
          images: imagesData,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
          timeout: this.timeout * 2, // Double timeout for batch
        }
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          results: response.data.results || [],
          processingTime,
        },
      };
    } catch (error) {
      console.error("NudeNet batch detection failed:", error.message);

      return {
        success: false,
        error: error.message,
        code: "BATCH_DETECTION_FAILED",
      };
    }
  }

  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000,
      });

      return {
        success: true,
        status: response.data.status || "unknown",
        version: response.data.version || "unknown",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Classify risk level based on predictions
  classifyRiskLevel(predictions, confidence) {
    if (!predictions || !Array.isArray(predictions)) {
      return "LOW";
    }

    const categories = this.analyzePredictions(predictions);

    // Threshold values
    const EXPLICIT_THRESHOLD = 0.3;
    const NUDE_THRESHOLD = 0.4;
    const SUGGESTIVE_THRESHOLD = 0.6;

    // HIGH risk - explicit content
    if (categories.explicit > EXPLICIT_THRESHOLD) {
      return "HIGH";
    }

    // HIGH risk - nude content with high confidence
    if (categories.nude > NUDE_THRESHOLD && confidence > 0.7) {
      return "HIGH";
    }

    // MEDIUM risk - nude content with medium confidence
    if (categories.nude > NUDE_THRESHOLD) {
      return "MEDIUM";
    }

    // MEDIUM risk - suggestive content with high confidence
    if (categories.suggestive > SUGGESTIVE_THRESHOLD && confidence > 0.8) {
      return "MEDIUM";
    }

    // LOW risk - suggestive content with low confidence
    if (categories.suggestive > SUGGESTIVE_THRESHOLD) {
      return "LOW";
    }

    return "LOW";
  }

  analyzePredictions(predictions) {
    const categories = {
      safe: 0,
      suggestive: 0,
      nude: 0,
      explicit: 0,
    };

    predictions.forEach((pred) => {
      const className = pred.className?.toLowerCase() || "";
      const probability = pred.probability || 0;

      if (className.includes("safe") || className.includes("neutral")) {
        categories.safe = Math.max(categories.safe, probability);
      } else if (
        className.includes("suggestive") ||
        className.includes("partial")
      ) {
        categories.suggestive = Math.max(categories.suggestive, probability);
      } else if (className.includes("nude") || className.includes("naked")) {
        categories.nude = Math.max(categories.nude, probability);
      } else if (className.includes("explicit") || className.includes("porn")) {
        categories.explicit = Math.max(categories.explicit, probability);
      }
    });

    return categories;
  }
}

module.exports = new NudeNetService();

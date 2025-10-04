// Risk levels and classification
class RiskLevels {
  static LEVELS = {
    LOW: {
      name: "LOW",
      priority: 1,
      color: "#22c55e", // green
      description: "Konten berpotensi tidak pantas namun relatif aman",
      actions: ["ignore", "close"],
    },
    MEDIUM: {
      name: "MEDIUM",
      priority: 2,
      color: "#f59e0b", // yellow/orange
      description: "Konten mengandung unsur dewasa yang perlu perhatian",
      actions: ["close"],
    },
    HIGH: {
      name: "HIGH",
      priority: 3,
      color: "#ef4444", // red
      description: "Konten dewasa eksplisit yang tidak pantas",
      actions: ["close"],
    },
  };

  // Klasifikasi berdasarkan confidence score dan kategori
  static classifyResult(detectionResult) {
    try {
      const { predictions, confidence } = detectionResult;

      if (!predictions || !Array.isArray(predictions)) {
        return this.LEVELS.LOW;
      }

      // Analisis berdasarkan kategori deteksi
      const categories = this.analyzePredictions(predictions);

      // Tentukan level berdasarkan kategori dan confidence
      const level = this.determineRiskLevel(categories, confidence);

      return {
        ...this.LEVELS[level],
        confidence: confidence,
        categories: categories,
        timestamp: Date.now(),
      };
    } catch (error) {
      ExtensionHelpers.log("error", "Classification error", error);
      return this.LEVELS.LOW;
    }
  }

  // Analisis predictions dari model
  static analyzePredictions(predictions) {
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

  // Tentukan risk level berdasarkan kategori dan confidence
  static determineRiskLevel(categories, confidence) {
    // Threshold values
    const EXPLICIT_THRESHOLD = 0.3;
    const NUDE_THRESHOLD = 0.4;
    const SUGGESTIVE_THRESHOLD = 0.6;

    // HIGH risk - explicit content
    if (categories.explicit > EXPLICIT_THRESHOLD) {
      return "HIGH";
    }

    // HIGH risk - nude content dengan confidence tinggi
    if (categories.nude > NUDE_THRESHOLD && confidence > 0.7) {
      return "HIGH";
    }

    // MEDIUM risk - nude content dengan confidence sedang
    if (categories.nude > NUDE_THRESHOLD) {
      return "MEDIUM";
    }

    // MEDIUM risk - suggestive content dengan confidence tinggi
    if (categories.suggestive > SUGGESTIVE_THRESHOLD && confidence > 0.8) {
      return "MEDIUM";
    }

    // LOW risk - suggestive content dengan confidence rendah
    if (categories.suggestive > SUGGESTIVE_THRESHOLD) {
      return "LOW";
    }

    // Default to LOW untuk konten yang relatif aman
    return "LOW";
  }

  // Get available actions untuk level tertentu
  static getAvailableActions(level) {
    const levelData = this.LEVELS[level];
    return levelData ? levelData.actions : ["ignore"];
  }

  // Get color untuk level
  static getColor(level) {
    const levelData = this.LEVELS[level];
    return levelData ? levelData.color : "#6b7280";
  }

  // Get description untuk level
  static getDescription(level) {
    const levelData = this.LEVELS[level];
    return levelData ? levelData.description : "Status tidak diketahui";
  }

  // Check if level memerlukan action wajib
  static requiresMandatoryAction(level) {
    return level === "MEDIUM" || level === "HIGH";
  }

  // Get recommended action untuk level
  static getRecommendedAction(level) {
    switch (level) {
      case "LOW":
        return "ignore";
      case "MEDIUM":
      case "HIGH":
        return "close";
      default:
        return "ignore";
    }
  }

  // Format hasil klasifikasi untuk display
  static formatClassificationResult(result) {
    return {
      level: result.name,
      levelName: result.name,
      description: result.description,
      color: result.color,
      confidence: Math.round(result.confidence * 100),
      categories: result.categories,
      actions: result.actions,
      mandatory: this.requiresMandatoryAction(result.name),
      recommended: this.getRecommendedAction(result.name),
      timestamp: result.timestamp,
    };
  }

  // Get statistics dari multiple classifications
  static getStatistics(classifications) {
    if (!Array.isArray(classifications) || classifications.length === 0) {
      return {
        total: 0,
        low: 0,
        medium: 0,
        high: 0,
        averageConfidence: 0,
      };
    }

    const stats = {
      total: classifications.length,
      low: classifications.filter((c) => c.level === "LOW").length,
      medium: classifications.filter((c) => c.level === "MEDIUM").length,
      high: classifications.filter((c) => c.level === "HIGH").length,
      averageConfidence: 0,
    };

    const totalConfidence = classifications.reduce(
      (sum, c) => sum + (c.confidence || 0),
      0
    );
    stats.averageConfidence = Math.round(
      totalConfidence / classifications.length
    );

    return stats;
  }

  // Validate classification result
  static validateResult(result) {
    if (!result || typeof result !== "object") {
      return false;
    }

    const requiredFields = [
      "name",
      "priority",
      "color",
      "description",
      "actions",
    ];
    return requiredFields.every((field) => field in result);
  }
}

// Export untuk digunakan di file lain
window.RiskLevels = RiskLevels;

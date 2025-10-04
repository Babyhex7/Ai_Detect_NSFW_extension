// Modal handler untuk menampilkan warning NSFW
class ModalHandler {
  constructor() {
    this.modal = null;
    this.isShowing = false;
    this.currentResult = null;
  }

  // Show modal dengan hasil deteksi
  async showModal(detectionResult, imageUrl = "") {
    try {
      if (this.isShowing) {
        ExtensionHelpers.log("warn", "Modal already showing, skipping");
        return;
      }

      // Classify hasil deteksi
      const classification = RiskLevels.classifyResult(detectionResult);
      const formattedResult =
        RiskLevels.formatClassificationResult(classification);

      this.currentResult = formattedResult;
      this.isShowing = true;

      // Create modal element
      await this.createModal(formattedResult, imageUrl);

      // Show modal
      this.displayModal();

      // Log activity
      await this.logModalActivity("shown", formattedResult);

      ExtensionHelpers.log(
        "info",
        `Modal shown for ${formattedResult.level} risk content`
      );
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to show modal", error);
      this.isShowing = false;
    }
  }

  // Create modal HTML structure
  async createModal(result, imageUrl) {
    // Remove existing modal
    this.removeModal();

    // Create modal container
    this.modal = document.createElement("div");
    this.modal.id = "nsfw-detector-modal";
    this.modal.className = "nsfw-modal-overlay";

    // Modal content
    const modalContent = `
      <div class="nsfw-modal-content">
        <div class="nsfw-modal-header">
          <div class="nsfw-modal-icon" style="background-color: ${
            result.color
          };">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V11M12 15H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2 class="nsfw-modal-title">Konten Terdeteksi</h2>
        </div>
        
        <div class="nsfw-modal-body">
          <div class="nsfw-risk-level" style="border-color: ${result.color};">
            <span class="nsfw-risk-badge" style="background-color: ${
              result.color
            };">
              ${result.level} RISK
            </span>
            <p class="nsfw-risk-description">${result.description}</p>
          </div>
          
          <div class="nsfw-detection-details">
            <div class="nsfw-confidence">
              <span>Confidence: <strong>${result.confidence}%</strong></span>
            </div>
            ${
              imageUrl
                ? `<div class="nsfw-image-info"><span>URL: ${this.truncateUrl(
                    imageUrl
                  )}</span></div>`
                : ""
            }
          </div>
          
          ${this.renderCategories(result.categories)}
        </div>
        
        <div class="nsfw-modal-actions">
          ${this.renderActions(result)}
        </div>
        
        <div class="nsfw-modal-footer">
          <span class="nsfw-powered-by">Powered by NSFW Detector Extension</span>
        </div>
      </div>
    `;

    this.modal.innerHTML = modalContent;

    // Add event listeners
    this.addEventListeners();
  }

  // Render kategori deteksi
  renderCategories(categories) {
    if (!categories) return "";

    const categoryList = Object.entries(categories)
      .filter(([_, value]) => value > 0.1) // Only show significant categories
      .map(([category, value]) => {
        const percentage = Math.round(value * 100);
        return `<div class="nsfw-category-item">
          <span class="nsfw-category-name">${category}</span>
          <span class="nsfw-category-value">${percentage}%</span>
        </div>`;
      })
      .join("");

    if (!categoryList) return "";

    return `
      <div class="nsfw-categories">
        <h4>Detail Deteksi:</h4>
        <div class="nsfw-categories-list">
          ${categoryList}
        </div>
      </div>
    `;
  }

  // Render action buttons
  renderActions(result) {
    const actions = result.actions || ["close"];

    return actions
      .map((action) => {
        switch (action) {
          case "ignore":
            return `<button class="nsfw-btn nsfw-btn-secondary" data-action="ignore">
            Abaikan & Lanjutkan
          </button>`;
          case "close":
            return `<button class="nsfw-btn nsfw-btn-danger" data-action="close">
            Tutup Tab
          </button>`;
          default:
            return "";
        }
      })
      .join("");
  }

  // Add event listeners untuk actions
  addEventListeners() {
    if (!this.modal) return;

    // Action buttons
    const actionButtons = this.modal.querySelectorAll("[data-action]");
    actionButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const action = e.target.getAttribute("data-action");
        this.handleAction(action);
      });
    });

    // Prevent closing modal by clicking outside
    this.modal.addEventListener("click", (e) => {
      if (
        e.target === this.modal &&
        !RiskLevels.requiresMandatoryAction(this.currentResult?.level)
      ) {
        this.handleAction("ignore");
      }
    });

    // Keyboard events
    document.addEventListener("keydown", this.handleKeydown.bind(this));
  }

  // Handle keyboard events
  handleKeydown(e) {
    if (!this.isShowing) return;

    if (
      e.key === "Escape" &&
      !RiskLevels.requiresMandatoryAction(this.currentResult?.level)
    ) {
      this.handleAction("ignore");
    }
  }

  // Handle action button clicks
  async handleAction(action) {
    try {
      ExtensionHelpers.log("info", `Modal action: ${action}`);

      // Log activity
      await this.logModalActivity("action", {
        action,
        level: this.currentResult?.level,
      });

      switch (action) {
        case "ignore":
          this.closeModal();
          break;

        case "close":
          await this.closeTab();
          break;

        default:
          ExtensionHelpers.log("warn", `Unknown action: ${action}`);
      }
    } catch (error) {
      ExtensionHelpers.log("error", `Action ${action} failed`, error);
    }
  }

  // Close current tab
  async closeTab() {
    try {
      // Send message ke background script untuk close tab
      chrome.runtime.sendMessage({
        type: "CLOSE_TAB",
        reason: "nsfw_detection",
      });
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to close tab", error);
    }
  }

  // Display modal
  displayModal() {
    if (!this.modal) return;

    // Add to DOM
    document.body.appendChild(this.modal);

    // Force reflow
    this.modal.offsetHeight;

    // Add show class for animation
    this.modal.classList.add("nsfw-modal-show");

    // Disable page scrolling
    document.body.style.overflow = "hidden";
  }

  // Close modal
  closeModal() {
    if (!this.modal || !this.isShowing) return;

    // Remove show class
    this.modal.classList.remove("nsfw-modal-show");

    // Remove after animation
    setTimeout(() => {
      this.removeModal();
    }, 300);

    this.isShowing = false;
    this.currentResult = null;

    // Restore page scrolling
    document.body.style.overflow = "";

    // Remove keyboard listener
    document.removeEventListener("keydown", this.handleKeydown.bind(this));
  }

  // Remove modal dari DOM
  removeModal() {
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
    }
    this.modal = null;
  }

  // Log modal activity
  async logModalActivity(type, data = {}) {
    try {
      await window.apiHandler.logActivity({
        type: "modal_activity",
        action: type,
        data: data,
        url: window.location.href,
        timestamp: Date.now(),
      });
    } catch (error) {
      ExtensionHelpers.log("error", "Failed to log modal activity", error);
    }
  }

  // Truncate URL untuk display
  truncateUrl(url, maxLength = 50) {
    if (!url || url.length <= maxLength) return url;
    return url.substring(0, maxLength) + "...";
  }

  // Check if modal sedang showing
  isModalShowing() {
    return this.isShowing;
  }

  // Force close modal (untuk cleanup)
  forceClose() {
    this.closeModal();
  }
}

// Export global instance
window.modalHandler = new ModalHandler();

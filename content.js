// Click Timer Extension - Content Script
// Measures time between consecutive mouse clicks with high precision

class ClickTimer {
  constructor() {
    this.lastClickTime = null;
    this.clickCount = 0;
    this.isEnabled = true;
    this.visualIndicator = null;
    this.indicatorTimeout = null;
    this.storageKey = 'clickTimerData';
    this.pageLoadTime = Date.now(); // Track when this page loaded

    // Initialize the timer
    this.init();
  }

  init() {
    // Bind methods to preserve context
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundCleanup = this.cleanup.bind(this);

    // Attach event listeners immediately (don't wait for async operations)
    document.addEventListener('click', this.boundHandleClick, true);
    window.addEventListener('beforeunload', this.boundCleanup);

    console.log('[Click Timer] Event listeners attached');

    // Load persisted data asynchronously (non-blocking)
    this.loadPersistedData().then(() => {
      console.log('[Click Timer] Extension fully initialized and ready');
    });
  }

  handleClick(event) {
    console.log('[Click Timer] Click detected at:', event.target.tagName, event.target.className);
    console.log('[Click Timer] Current enabled state:', this.isEnabled);

    if (!this.isEnabled) {
      console.log('[Click Timer] Timer disabled, ignoring click');
      return;
    }

    if (!this.isValidPageClick(event)) {
      console.log('[Click Timer] Invalid page click, ignoring');
      return;
    }

    console.log('[Click Timer] Processing valid click...');

    // Record high-precision timestamp
    const currentTime = this.getHighPrecisionTime();

    if (this.lastClickTime !== null) {
      // Calculate time difference in seconds with 3 decimal precision
      const timeDiff = (currentTime - this.lastClickTime) / 1000;
      this.clickCount++;

      this.logTimingData(timeDiff, this.clickCount);
      this.updateVisualFeedback(timeDiff, this.clickCount);
    } else {
      // First click initialization
      this.clickCount = 1;
      this.logTimingData('First click', this.clickCount);
      this.showVisualFeedback('First click recorded', this.clickCount);
    }

    // Update timestamp for next calculation
    this.lastClickTime = currentTime;

    // Persist data for cross-page continuity (non-blocking)
    this.savePersistedData().catch(error => {
      console.warn('[Click Timer] Non-critical storage error:', error);
    });
  }

  getHighPrecisionTime() {
    try {
      // Use Date.now() for cross-page consistency
      return Date.now();
    } catch (error) {
      console.warn('[Click Timer] Date API unavailable, using fallback');
      return new Date().getTime();
    }
  }

  isValidPageClick(event) {
    const target = event.target;

    // Exclude clicks outside document body
    if (!document.body.contains(target)) {
      return false;
    }

    // Exclude scrollbar clicks (approximate detection)
    const isScrollbarClick = (
      event.clientX > window.innerWidth - 20 || // Right scrollbar
      event.clientY > window.innerHeight - 20   // Bottom scrollbar
    );

    // Exclude browser UI elements
    const isBrowserUI = target.closest('html') === null;

    // Exclude extension's own visual indicator
    if (target.closest('.click-timer-indicator')) {
      return false;
    }

    return !isScrollbarClick && !isBrowserUI;
  }

  logTimingData(timeDiff, clickCount) {
    if (typeof timeDiff === 'number') {
      console.log(`[Click Timer] Click #${clickCount} - Time since last click: ${timeDiff.toFixed(3)}s (Total: ${clickCount})`);
    } else {
      console.log(`[Click Timer] Click #${clickCount} - ${timeDiff}`);
    }
  }

  updateVisualFeedback(timeDiff, clickCount) {
    const message = `${timeDiff.toFixed(3)}s`;
    this.showVisualFeedback(message, clickCount);
  }

  showVisualFeedback(message, clickCount) {
    // Immediately remove any existing indicator and timers
    this.removeVisualIndicator();

    // Create new visual indicator
    this.createVisualIndicator(message, clickCount);

    // Set new auto-hide timer
    this.indicatorTimeout = setTimeout(() => {
      this.removeVisualIndicator();
    }, 2000);
  }

  createVisualIndicator(message, clickCount) {
    this.visualIndicator = document.createElement('div');
    this.visualIndicator.className = 'click-timer-indicator';
    this.visualIndicator.textContent = `#${clickCount}: ${message}`;

    // Apply styles
    Object.assign(this.visualIndicator.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 123, 255, 0.9)',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: '999999',
      pointerEvents: 'none',
      transition: 'opacity 0.2s ease, transform 0.1s ease',
      transform: 'scale(1.05)',
      opacity: '0'
    });

    document.body.appendChild(this.visualIndicator);

    // Trigger animation immediately for rapid clicks
    requestAnimationFrame(() => {
      if (this.visualIndicator) {
        this.visualIndicator.style.opacity = '1';
        this.visualIndicator.style.transform = 'scale(1)';
      }
    });
  }

  removeVisualIndicator() {
    // Clear any existing timeout immediately
    if (this.indicatorTimeout) {
      clearTimeout(this.indicatorTimeout);
      this.indicatorTimeout = null;
    }

    // If there's an existing indicator, remove it immediately
    if (this.visualIndicator && this.visualIndicator.parentNode) {
      // Cancel any ongoing animations
      this.visualIndicator.style.transition = 'none';
      this.visualIndicator.parentNode.removeChild(this.visualIndicator);
      this.visualIndicator = null;
    }
  }

  resetTimer() {
    this.lastClickTime = null;
    this.clickCount = 0;
    this.removeVisualIndicator();
    this.savePersistedData().catch(error => {
      console.warn('[Click Timer] Non-critical storage error on reset:', error);
    });
    console.log('[Click Timer] Timer reset');
  }

  enable() {
    this.isEnabled = true;
    this.savePersistedData().catch(error => {
      console.warn('[Click Timer] Non-critical storage error on enable:', error);
    });
    console.log('[Click Timer] Timer enabled');
  }

  disable() {
    this.isEnabled = false;
    this.removeVisualIndicator();
    this.savePersistedData().catch(error => {
      console.warn('[Click Timer] Non-critical storage error on disable:', error);
    });
    console.log('[Click Timer] Timer disabled');
  }

  cleanup() {
    console.log('[Click Timer] Cleanup called');
    this.removeVisualIndicator();
    if (this.boundHandleClick) {
      document.removeEventListener('click', this.boundHandleClick, true);
    }
    if (this.boundCleanup) {
      window.removeEventListener('beforeunload', this.boundCleanup);
    }
    // Don't call disable() here as it sets isEnabled to false
  }

  // Persistence methods for cross-page continuity
  async loadPersistedData() {
    try {
      // Check if chrome.storage is available
      if (!chrome || !chrome.storage || !chrome.storage.local) {
        console.warn('[Click Timer] Chrome storage API not available');
        return;
      }

      const result = await chrome.storage.local.get([this.storageKey]);
      const data = result[this.storageKey];

      if (data) {
        // Check if the last click was from a different page/session
        const timeSinceLastSave = Date.now() - (data.timestamp || 0);
        const pageNavigationThreshold = 5000; // 5 seconds

        if (data.lastClickTime && timeSinceLastSave < pageNavigationThreshold) {
          // Recent data, likely same session - but check if it's reasonable
          const timeDiffFromLoad = Date.now() - data.lastClickTime;
          if (timeDiffFromLoad > 0 && timeDiffFromLoad < 300000) { // Less than 5 minutes
            this.lastClickTime = data.lastClickTime;
          } else {
            console.log('[Click Timer] Last click too old, resetting timestamp');
            this.lastClickTime = null;
          }
        } else {
          console.log('[Click Timer] Page navigation detected, resetting timestamp');
          this.lastClickTime = null;
        }

        this.clickCount = data.clickCount || 0;
        this.isEnabled = data.isEnabled !== undefined ? data.isEnabled : true;
        console.log('[Click Timer] Loaded persisted data:', data);
        console.log('[Click Timer] Set enabled state to:', this.isEnabled);
        console.log('[Click Timer] Last click time:', this.lastClickTime);
      } else {
        console.log('[Click Timer] No persisted data found, starting fresh');
        console.log('[Click Timer] Default enabled state:', this.isEnabled);
      }
    } catch (error) {
      console.warn('[Click Timer] Could not load persisted data:', error);
      // Continue without persisted data
    }
  }

  async savePersistedData() {
    try {
      // Check if chrome.storage is available
      if (!chrome || !chrome.storage || !chrome.storage.local) {
        console.warn('[Click Timer] Chrome storage API not available for saving');
        return;
      }

      const data = {
        lastClickTime: this.lastClickTime,
        clickCount: this.clickCount,
        isEnabled: this.isEnabled,
        timestamp: Date.now()
      };

      await chrome.storage.local.set({ [this.storageKey]: data });
      console.log('[Click Timer] Data saved successfully');
    } catch (error) {
      console.warn('[Click Timer] Could not save persisted data:', error);
      // Continue without saving (extension still works without persistence)
    }
  }

  // Public API for potential extension of functionality
  getStats() {
    return {
      clickCount: this.clickCount,
      lastClickTime: this.lastClickTime,
      isEnabled: this.isEnabled
    };
  }
}

// Initialize the click timer when the content script loads
let clickTimer;

// Ensure proper initialization
function initializeClickTimer() {
  if (!clickTimer) {
    clickTimer = new ClickTimer();
    window.clickTimer = clickTimer;
    console.log('[Click Timer] Content script loaded and initialized');
  }
}

// Initialize immediately if document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeClickTimer);
} else {
  initializeClickTimer();
}

// Also initialize on window load as fallback
window.addEventListener('load', () => {
  if (!clickTimer) {
    console.log('[Click Timer] Fallback initialization on window load');
    initializeClickTimer();
  }
});

// Debug logging to check if script is running
console.log('[Click Timer] Content script file loaded at:', new Date().toISOString());

// Click Timer Extension - Popup Script
// Handles popup interface and communication with content scripts

class PopupController {
  constructor() {
    this.isEnabled = true;
    this.clickCount = 0;
    this.lastInterval = null;
    this.sessionStartTime = Date.now();
    this.sessionTimer = null;

    this.init();
  }

  init() {
    // Get DOM elements
    this.elements = {
      statusIndicator: document.getElementById('statusIndicator'),
      statusText: document.getElementById('statusText'),
      clickCount: document.getElementById('clickCount'),
      lastInterval: document.getElementById('lastInterval'),
      sessionTime: document.getElementById('sessionTime'),
      resetBtn: document.getElementById('resetBtn'),
      toggleBtn: document.getElementById('toggleBtn')
    };

    // Add event listeners
    this.elements.resetBtn.addEventListener('click', this.handleReset.bind(this));
    this.elements.toggleBtn.addEventListener('click', this.handleToggle.bind(this));

    // Initialize UI state
    this.updateUI();
    this.startSessionTimer();

    // Get current stats from active tab
    this.getCurrentTabStats();
  }

  async getCurrentTabStats() {
    try {
      // First try to get stats from storage (persisted data)
      const result = await chrome.storage.local.get(['clickTimerData']);
      const persistedData = result.clickTimerData;

      if (persistedData) {
        this.clickCount = persistedData.clickCount || 0;
        this.isEnabled = persistedData.isEnabled !== undefined ? persistedData.isEnabled : true;
        this.updateUI();
      }

      // Then try to get current stats from content script if available
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab) return;

      // Execute script to get stats from content script
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          if (window.clickTimer) {
            return window.clickTimer.getStats();
          }
          return null;
        }
      });

      if (results && results[0] && results[0].result) {
        const stats = results[0].result;
        this.clickCount = stats.clickCount || 0;
        this.isEnabled = stats.isEnabled !== undefined ? stats.isEnabled : true;
        this.updateUI();
      }
    } catch (error) {
      console.warn('[Click Timer Popup] Could not get stats:', error);
      // This is normal for pages where content script hasn't loaded yet
    }
  }

  async executeInContentScript(command, params = {}) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab) return;

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: (cmd, args) => {
          if (window.clickTimer) {
            switch (cmd) {
              case 'reset':
                window.clickTimer.resetTimer();
                break;
              case 'enable':
                window.clickTimer.enable();
                break;
              case 'disable':
                window.clickTimer.disable();
                break;
            }
          }
        },
        args: [command, params]
      });
    } catch (error) {
      console.warn('[Click Timer Popup] Could not execute in content script:', error);
    }
  }

  async handleReset() {
    this.clickCount = 0;
    this.lastInterval = null;
    this.sessionStartTime = Date.now();
    this.updateUI();

    // Clear storage
    try {
      await chrome.storage.local.remove(['clickTimerData']);
    } catch (error) {
      console.warn('[Click Timer Popup] Could not clear storage:', error);
    }

    this.executeInContentScript('reset');
  }

  handleToggle() {
    this.isEnabled = !this.isEnabled;
    this.updateUI();

    if (this.isEnabled) {
      this.executeInContentScript('enable');
    } else {
      this.executeInContentScript('disable');
    }
  }

  updateUI() {
    // Update status indicator and text
    if (this.isEnabled) {
      this.elements.statusIndicator.className = 'status-indicator active';
      this.elements.statusText.textContent = 'Active - Monitoring clicks';
      this.elements.toggleBtn.textContent = 'Disable';
      this.elements.toggleBtn.className = 'btn secondary';
    } else {
      this.elements.statusIndicator.className = 'status-indicator inactive';
      this.elements.statusText.textContent = 'Disabled - Click to enable';
      this.elements.toggleBtn.textContent = 'Enable';
      this.elements.toggleBtn.className = 'btn primary';
    }

    // Update stats
    this.elements.clickCount.textContent = this.clickCount;
    this.elements.lastInterval.textContent = this.lastInterval
      ? `${this.lastInterval.toFixed(3)}s`
      : '--';
  }

  startSessionTimer() {
    this.updateSessionTime();
    this.sessionTimer = setInterval(() => {
      this.updateSessionTime();
    }, 1000);
  }

  updateSessionTime() {
    const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    this.elements.sessionTime.textContent =
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  cleanup() {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
    }
  }
}

// Enhanced popup functionality with message passing
class EnhancedPopupController extends PopupController {
  constructor() {
    super();
    this.setupMessageListener();
  }

  setupMessageListener() {
    // Listen for messages from content script (if implemented in future)
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'click-stats-update') {
        this.clickCount = message.clickCount || 0;
        this.lastInterval = message.lastInterval || null;
        this.updateUI();
      }
    });
  }

  async checkExtensionStatus() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab) return;

      // Check if current page is a valid web page
      const url = new URL(tab.url);
      const isValidPage = ['http:', 'https:'].includes(url.protocol);

      if (!isValidPage) {
        this.elements.statusText.textContent = 'Not available on this page';
        this.elements.statusIndicator.className = 'status-indicator inactive';
        this.elements.toggleBtn.disabled = true;
        this.elements.resetBtn.disabled = true;
        return;
      }

      // Re-enable controls for valid pages
      this.elements.toggleBtn.disabled = false;
      this.elements.resetBtn.disabled = false;
    } catch (error) {
      console.warn('[Click Timer Popup] Error checking extension status:', error);
    }
  }

  init() {
    super.init();
    this.checkExtensionStatus();
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const popup = new EnhancedPopupController();

  // Cleanup when popup is closed
  window.addEventListener('beforeunload', () => {
    popup.cleanup();
  });
});

// Handle popup close
window.addEventListener('unload', () => {
  // Any cleanup needed when popup closes
});

# Privacy Policy – Click Timer

Last updated: 2025-08-20

This browser extension measures the time between your mouse clicks on web pages and shows a tiny on‑screen indicator. We care about your privacy and designed the extension to work entirely on your device.

## What data we handle

The extension keeps a small amount of runtime state only on your device:
- clickCount (number of clicks in the current session)
- lastClickTime (timestamp in milliseconds of the last click)
- isEnabled (whether tracking is on)
- timestamp (when the state was last saved)

This state is stored locally via the browser’s `chrome.storage.local` API and does not leave your device.

## What we do NOT collect or send

- No personal data
- No browsing history or page content
- No cookies
- No network requests to our servers or third parties
- No analytics, tracking, or fingerprinting

The content script listens for click events to compute intervals and renders a small on‑page indicator. For debugging, it may write minimal logs to your local developer console (e.g., element tag name/class). These logs are visible only to you and are not transmitted anywhere.

## Permissions

- `storage`: used solely to persist the minimal state listed above so the extension can maintain continuity across quick navigations.
- The content script runs on web pages to listen for clicks and display the indicator. It does not exfiltrate data.

## Your controls

- Toggle on/off in the extension popup.
- Reset clears the stored state immediately.
- Uninstalling the extension removes all of its stored data.

## Data retention

All state remains on your device and can be cleared via Reset or by uninstalling the extension. There is no server‑side storage.

## Contact

If you have questions or requests, please use the repository’s issue tracker for this project or the extension store listing’s contact channel.

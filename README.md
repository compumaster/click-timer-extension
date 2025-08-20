# Click Timer

A tiny, zero-dependency Chrome/Edge extension that measures the time between your mouse clicks on any website and shows a lightweight on-screen indicator (e.g., “#3: 0.127s”). It also provides a popup to enable/disable tracking and reset the session, with basic stats.

## Features

- High-precision interval timing between consecutive clicks
- Subtle visual overlay: “#N: 0.123s” in the top-right corner
- Popup with enable/disable, reset, and session stats
- Persists state (enabled/disabled, last timestamp, click count) using browser storage
- Manifest V3, minimal permission footprint (storage only)

## How it works

- A content script attaches a capture-phase click listener on every page to timestamp clicks and compute deltas.
- An ephemeral visual indicator is shown for ~2 seconds with the click number and interval.
- State is saved in `chrome.storage.local` for continuity during quick navigations.
- The popup reads state and lets you enable/disable or reset without reloading the page.

## Install (from source)

Chrome or Edge
- Clone or download this repository.
- Open the browser’s Extensions page:
	- Chrome: chrome://extensions
	- Edge: edge://extensions
- Enable “Developer mode”.
- Choose “Load unpacked” and select this project folder.

Note for local files: If you need timing on file:// pages, enable “Allow access to file URLs” in the extension’s details.

## Usage

- Browse to any website and simply click anywhere on the page.
- Watch the top-right indicator show “#N: X.XXXs”.
- Open the extension popup to:
	- Toggle Active/Disabled
	- Reset the click count and last timestamp
	- See total clicks and session time
- For verbose details, open DevTools Console to view logs from the content script.

## Permissions & Privacy

- Permissions: `storage` (to persist minimal state)
- No network requests, analytics, or trackers
- No data leaves your browser; all data is stored locally via `chrome.storage.local`

## Development

Project structure
- `manifest.json` – MV3 manifest
- `content.js` – Click timing logic and on-page indicator
- `popup.html`, `popup.js` – Popup UI and controls
- `LICENSE` – Apache-2.0

Workflow
- No build step required; it’s plain JS/HTML/CSS.
- After editing files, click “Reload” on the extension in the Extensions page and refresh your target tab.

## Troubleshooting

- Not working on internal pages: Extensions can’t run on chrome://, edge://, or the Web Store.
- Local files: Enable “Allow access to file URLs” in the extension details if needed.
- Indicator not visible: Ensure you’re not clicking the indicator itself (it’s pointer-events: none) and that the extension is Active in the popup.
- State didn’t carry over: Cross-page continuity is conservative (quick navigations only). Very old timestamps (> ~5 minutes) are discarded by design.

## Project status

- Authored by an AI coding agent and lightly reviewed by a human.
- Tested and working well in Microsoft Edge as of August 2025.

## License

Apache-2.0 – see `LICENSE`.

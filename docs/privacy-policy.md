# Privacy Policy — 1Short

**Effective date:** 2026-05-20

---

## Overview

1Short is a Chrome extension that automatically scrolls through YouTube Shorts and TikTok videos, and optionally skips sponsored content on YouTube Shorts. This policy explains what data is handled and how.

---

## Data Collected

**No data is collected.** 1Short does not read, store, or transmit any personal information.

The extension operates entirely within the current browser tab:

- It listens to video playback events (`timeupdate`, `ended`) to detect when a video finishes
- It inspects DOM elements to detect sponsored content on YouTube Shorts
- It communicates toggle state between the popup and the content script via `chrome.tabs.sendMessage`
- It persists toggle state within the tab session using `chrome.storage.session`

---

## Where Data Is Stored

The enabled/disabled toggle state is stored in `chrome.storage.session` for the lifetime of the browser session.

- `chrome.storage.session` data is cleared automatically when the browser session ends — it is never written to disk or retained across restarts
- No data is transmitted to any external server
- No data is shared with third parties
- No analytics or tracking of any kind is performed

---

## Permissions Used

| Permission | Reason |
|------------|--------|
| `tabs` | Read the URL and ID of the active tab to detect the current platform (YouTube Shorts or TikTok) |
| `storage` | Persist toggle state within the browser session using `chrome.storage.session` |
| `host_permissions: youtube.com, tiktok.com` | Inject the content script into supported platforms only |

---

## Contact

For questions or concerns, please open an issue at:  
https://github.com/wonkyungup/1short/issues

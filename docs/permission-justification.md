# Permission Justification — 1Short

## `tabs`

### Why this permission is needed

The `tabs` permission is used to retrieve the URL and ID of the currently active tab. This is required to:

1. Detect which platform the user is on (YouTube Shorts or TikTok) so the popup can display the correct state and available options
2. Send messages to the content script running in that tab via `chrome.tabs.sendMessage`

### How the permission is used responsibly

- Only the active tab's URL and ID are accessed — no browsing history, no background tab access
- No URL data is stored or transmitted

---

## `host_permissions: *://*.youtube.com/*, *://*.tiktok.com/*`

### Why this permission is needed

The content script must be injected into YouTube and TikTok pages to listen for video playback events and detect sponsored content. Host permissions for these specific domains are required for the content script to run.

### How the permission is used responsibly

- Permissions are scoped to the minimum required domains only (YouTube and TikTok)
- The content script only listens to video events and reads DOM structure — it does not read cookies, form data, or any user input
- No data is extracted from the page or transmitted anywhere

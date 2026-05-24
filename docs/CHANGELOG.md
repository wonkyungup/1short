# Changelog

## [1.0.3] - 2026-05-24

### Fixed
- Ad Skip: fixed an issue where videos were skipped every 3 seconds even without ads. Ad-related DOM elements (`reels-ad-metadata-view-model`, `ad-badge-view-model`) remained cached in the DOM after navigation, causing false positives. Added visibility validation (`getBoundingClientRect` + `getComputedStyle`) to confirm the element is actually rendered on screen before treating it as an active ad.

---

## [1.0.2] - 2025-04-25

### Fixed
- Ad skip loop fix — prevented repeated skipping when ad elements persisted across navigations
- Cleaned up unnecessary permissions

---

## [1.0.1] - 2025-04-20

### Added
- Initial release
- Auto Scroll for YouTube Shorts and TikTok
- Ad Skip for YouTube Shorts

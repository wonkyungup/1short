let enabled = false;
let adSkip = false;
let currentVideo: HTMLVideoElement | null = null;
let goingNext = false;
let attachedAt = 0;
let prevTime = 0;
let adCheckTimer: ReturnType<typeof setInterval> | null = null;
let lastAdSkipTime = 0;

function detectPlatform(): 'youtube-shorts' | 'tiktok' | null {
  const host = location.hostname;
  const path = location.pathname;
  if (host.includes('youtube.com') && path.includes('/shorts/')) return 'youtube-shorts';
  if (host.includes('tiktok.com')) return 'tiktok';
  return null;
}

function isElementVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

function isYouTubeAd(): boolean {
  const els = [
    document.querySelector('reels-ad-metadata-view-model'),
    document.querySelector('ad-badge-view-model'),
  ];
  return els.some(
    (el) =>
      el !== null &&
      el.closest('[aria-hidden="true"]') === null &&
      isElementVisible(el),
  );
}

function goNext() {
  const platform = detectPlatform();
  if (!platform) return;

  const arrowDown = () => {
    const ev = new KeyboardEvent('keydown', {
      key: 'ArrowDown', code: 'ArrowDown',
      keyCode: 40, which: 40,
      bubbles: true, cancelable: true,
    });
    document.dispatchEvent(ev);
    document.body.dispatchEvent(ev);
  };

  if (platform === 'youtube-shorts') {
    const btn =
      document.querySelector<HTMLElement>('#navigation-button-down button') ||
      document.querySelector<HTMLElement>('ytd-shorts [aria-label="Next video"]');
    if (btn) { btn.click(); return; }
    arrowDown();
  } else if (platform === 'tiktok') {
    arrowDown();
  }
}

function triggerNext() {
  if (!enabled || goingNext) return;
  goingNext = true;
  if (currentVideo) {
    currentVideo.pause();
    currentVideo.muted = true;
  }
  goNext();
  setTimeout(() => { goingNext = false; attach(); }, 1500);
}

function onTimeUpdate(this: HTMLVideoElement) {
  const dur = this.duration;
  const curr = this.currentTime;
  if (enabled && dur > 0 && prevTime >= dur - 1.5 && curr < 1.0) {
    triggerNext();
  }
  prevTime = curr;
}

function onEnded() {
  if (Date.now() - attachedAt < 1000) return;
  if (!enabled) return;
  triggerNext();
}

function detach() {
  if (!currentVideo) return;
  currentVideo.removeEventListener('timeupdate', onTimeUpdate);
  currentVideo.removeEventListener('ended', onEnded);
  currentVideo = null;
}

function attach() {
  if (!detectPlatform()) return;
  const videos = Array.from(document.querySelectorAll<HTMLVideoElement>('video'));
  const video =
    videos.find((v) => !v.paused && v.duration > 0) ||
    videos.find((v) => v.duration > 0) ||
    videos[0];
  if (!video || video === currentVideo) return;
  detach();
  currentVideo = video;
  currentVideo.loop = false;
  attachedAt = Date.now();
  prevTime = currentVideo.currentTime;
  currentVideo.addEventListener('timeupdate', onTimeUpdate);
  currentVideo.addEventListener('ended', onEnded);
}

function startAdCheck() {
  if (adCheckTimer !== null) return;
  adCheckTimer = setInterval(() => {
    if (!adSkip || detectPlatform() !== 'youtube-shorts' || goingNext) return;
    if (isYouTubeAd()) {
      const now = Date.now();
      if (now - lastAdSkipTime < 3000) return;
      lastAdSkipTime = now;
      goingNext = true;
      goNext();
      setTimeout(() => { goingNext = false; attach(); }, 1500);
    }
  }, 800);
}

function stopAdCheck() {
  if (adCheckTimer === null) return;
  clearInterval(adCheckTimer);
  adCheckTimer = null;
}

function applySettings(nextEnabled: boolean, nextAdSkip: boolean) {
  enabled = nextEnabled;
  adSkip = nextAdSkip;
  chrome.storage.session.set({ enabled, adSkip });
  if (adSkip && detectPlatform() === 'youtube-shorts') {
    startAdCheck();
  } else {
    stopAdCheck();
  }
}

chrome.storage.session.get(['enabled', 'adSkip']).then((result) => {
  enabled = (result['enabled'] as boolean) ?? false;
  adSkip = (result['adSkip'] as boolean) ?? false;
  if (adSkip && detectPlatform() === 'youtube-shorts') startAdCheck();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'UPDATE_SETTINGS') {
    applySettings(message.enabled as boolean, (message.adSkip as boolean) ?? adSkip);
    sendResponse({ ok: true });
  } else if (message.type === 'GET_STATE') {
    sendResponse({ enabled, adSkip });
  }
  return true;
});

(['pushState', 'replaceState'] as const).forEach((method) => {
  const original = history[method].bind(history);
  (history as any)[method] = function (...args: Parameters<typeof history.pushState>) {
    detach();
    const result = original(...args);
    setTimeout(attach, 800);
    return result;
  };
});

let attachTimer: ReturnType<typeof setTimeout> | null = null;
new MutationObserver(() => {
  if (attachTimer) clearTimeout(attachTimer);
  attachTimer = setTimeout(attach, 200);
}).observe(document.documentElement, { subtree: true, childList: true });

attach();

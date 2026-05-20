let enabled = false;
let adSkip = false;
let currentVideo: HTMLVideoElement | null = null;
let goingNext = false;
let attachedAt = 0;
let prevTime = 0;
let adCheckTimer: ReturnType<typeof setInterval> | null = null;

function detectPlatform(): 'youtube-shorts' | 'tiktok' | null {
  const host = location.hostname;
  const path = location.pathname;
  if (host.includes('youtube.com') && path.includes('/shorts/')) return 'youtube-shorts';
  if (host.includes('tiktok.com')) return 'tiktok';
  return null;
}

function isYouTubeAd(): boolean {
  return (
    document.querySelector('reels-ad-metadata-view-model') !== null ||
    document.querySelector('ad-avatar-view-model') !== null ||
    document.querySelector('ad-badge-view-model') !== null
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
    if (!adSkip || detectPlatform() !== 'youtube-shorts') return;
    if (isYouTubeAd()) goNext();
  }, 800);
}

function stopAdCheck() {
  if (adCheckTimer === null) return;
  clearInterval(adCheckTimer);
  adCheckTimer = null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'UPDATE_SETTINGS') {
    enabled = message.enabled as boolean;
    adSkip = (message.adSkip as boolean) ?? adSkip;
    if (adSkip && detectPlatform() === 'youtube-shorts') {
      startAdCheck();
    } else {
      stopAdCheck();
    }
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

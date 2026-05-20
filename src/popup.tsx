import * as React from 'react';
import { createRoot } from 'react-dom/client';
import Browser from 'webextension-polyfill';
import { useTranslation } from 'react-i18next';
import './i18n';

type Platform = 'youtube-shorts' | 'tiktok' | null;

function detectPlatformFromUrl(url: string): Platform {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.pathname.includes('/shorts/')) return 'youtube-shorts';
    if (u.hostname.includes('tiktok.com')) return 'tiktok';
  } catch {}
  return null;
}

const PLATFORM_LABELS: Record<NonNullable<Platform>, string> = {
  'youtube-shorts': 'YouTube Shorts',
  'tiktok': 'TikTok',
};

const PLATFORM_COLORS: Record<NonNullable<Platform>, string> = {
  'youtube-shorts': '#ff0000',
  'tiktok': '#010101',
};

const App = () => {
  const { t } = useTranslation();
  const [enabled, setEnabled] = React.useState(false);
  const [adSkip, setAdSkip] = React.useState(false);
  const [platform, setPlatform] = React.useState<Platform>(null);
  const [tabId, setTabId] = React.useState<number | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const [tab] = await Browser.tabs.query({ active: true, currentWindow: true });
      if (tab.id) setTabId(tab.id);
      if (tab.url) setPlatform(detectPlatformFromUrl(tab.url));
      if (tab.id) {
        try {
          const res = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATE' });
          if (res?.enabled !== undefined) setEnabled(res.enabled);
          if (res?.adSkip !== undefined) setAdSkip(res.adSkip);
        } catch {}
      }
      setLoaded(true);
    })();
  }, []);

  const sendSettings = async (nextEnabled: boolean, nextAdSkip: boolean) => {
    if (tabId !== null) {
      try {
        await chrome.tabs.sendMessage(tabId, { type: 'UPDATE_SETTINGS', enabled: nextEnabled, adSkip: nextAdSkip });
      } catch {}
    }
  };

  const handleToggle = async () => {
    const next = !enabled;
    setEnabled(next);
    await sendSettings(next, adSkip);
  };

  const handleAdSkip = async () => {
    const next = !adSkip;
    setAdSkip(next);
    await sendSettings(enabled, next);
  };

  if (!loaded) return null;

  const accentColor = platform ? PLATFORM_COLORS[platform] : '#1976d2';

  return (
    <div style={{ width: 280, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', padding: '14px 16px', userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.5, color: '#111' }}>1Short</div>
        <div style={{
          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
          background: platform ? `${accentColor}18` : '#e8e8e8',
          color: platform ? accentColor : '#666',
        }}>
          {platform ? PLATFORM_LABELS[platform] : t('msg_not_supported')}
        </div>
      </div>

      <div style={{ height: 1, background: '#f2f2f2', marginBottom: 10 }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#222' }}>{t('label_auto_scroll')}</div>
          <div style={{ fontSize: 10, color: '#888', marginTop: 2, lineHeight: '14px' }}>{t('label_auto_scroll_desc')}</div>
        </div>
        <div
          onClick={platform ? handleToggle : undefined}
          style={{
            width: 34, height: 20, borderRadius: 10,
            background: !platform ? '#eee' : enabled ? accentColor : '#ddd',
            position: 'relative', cursor: platform ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s', flexShrink: 0,
            opacity: platform ? 1 : 0.5,
          }}
        >
          <div style={{
            position: 'absolute', top: 3, left: enabled && platform ? 17 : 3,
            width: 14, height: 14, borderRadius: 7, background: '#fff',
            transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </div>
      </div>

      {platform === 'youtube-shorts' && (
        <>
          <div style={{ height: 1, background: '#f2f2f2', margin: '10px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#222' }}>{t('label_ad_skip')}</div>
              <div style={{ fontSize: 10, color: '#888', marginTop: 2, lineHeight: '14px' }}>{t('label_ad_skip_desc')}</div>
            </div>
            <div
              onClick={handleAdSkip}
              style={{
                width: 34, height: 20, borderRadius: 10,
                background: adSkip ? accentColor : '#ddd',
                position: 'relative', cursor: 'pointer',
                transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: adSkip ? 17 : 3,
                width: 14, height: 14, borderRadius: 7, background: '#fff',
                transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

createRoot(document.getElementById('popup')!).render(<App />);

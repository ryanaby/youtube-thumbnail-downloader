let isDevMode = false;
browser.runtime.sendMessage({ type: 'GET_DEV_MODE' }, (response) => {
  if (response && response.isDevMode) {
    isDevMode = true;
  }
});

function debugLog(...args) {
  if (isDevMode) {
    console.log(...args);
  }
}

async function fetchAsPngBlob(url) {
  const res = await fetch(url);
  const jpegBlob = await res.blob();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        blob ? resolve(blob) : reject(new Error('Conversion failed'));
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(jpegBlob);
  });
}

function getVideoIdFromAnchor(anchor) {
  const href = anchor?.getAttribute('href');
  const match = href?.match(/v=([a-zA-Z0-9_-]+)/);
  return match?.[1] || null;
}

function createIconButton(label, title, accentColor, onClick) {
  const btn = document.createElement('div');
  btn.textContent = label;
  btn.title = title;
  Object.assign(btn.style, buttonStyle(accentColor));

  btn.addEventListener('mouseenter', () => {
    btn.style.filter = 'brightness(1.25)';
    btn.style.transform = 'scale(1.08)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.filter = 'brightness(1)';
    btn.style.transform = 'scale(1)';
  });
  btn.addEventListener('mousedown', () => {
    btn.style.transform = 'scale(0.94)';
  });
  btn.addEventListener('mouseup', () => {
    btn.style.transform = 'scale(1.08)';
  });

  btn.onclick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onClick(btn);
  };
  return btn;
}

function buildButtons(videoId, container) {
  const viewBtn = createIconButton('🔍', 'View thumbnail',
    'linear-gradient(135deg, #1a6fc4 0%, #2389e8 100%)',
    () => window.open(`https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`, '_blank')
  );

  const downloadBtn = createIconButton('⬇️', 'Download thumbnail',
    'linear-gradient(135deg, #1a8a4a 0%, #22b05e 100%)',
    async () => {
      try {
        const url = `https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
        const blob = await fetch(url).then((r) => r.blob());
        const blobURL = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobURL;
        a.download = `${videoId}_maxres.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobURL);
      } catch (err) {
        alert('⚠️ Failed to download thumbnail.');
        console.error(err);
      }
    }
  );

  const copyBtn = createIconButton('📋', 'Copy thumbnail to clipboard',
    'linear-gradient(135deg, #b07a10 0%, #e0a020 100%)',
    async (btn) => {
      try {
        const origBg = btn.style.background;
        btn.style.background = 'linear-gradient(135deg, #f5e642 0%, #ffe066 100%)';
        setTimeout(() => { btn.style.background = origBg; }, 900);

        const url = `https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
        const pngBlob = await fetchAsPngBlob(url);
        const item = new ClipboardItem({ 'image/png': pngBlob });
        await navigator.clipboard.write([item]);
      } catch (err) {
        console.error(err);
      }
    }
  );

  container.append(viewBtn, downloadBtn, copyBtn);
}

function injectOverlayIntoTitleLink(anchor) {
  const videoId = getVideoIdFromAnchor(anchor);
  if (!videoId) return;

  if (anchor.dataset.stealthId === videoId) return;
  anchor.dataset.stealthId = videoId;

  const parent = anchor.parentElement;
  if (!parent) return;

  const old = parent.querySelector('.yt-thumb-pill-wrapper');
  if (old) old.remove();

  const pill = document.createElement('div');
  pill.className = 'yt-thumb-pill';
  Object.assign(pill.style, {
    position: 'absolute',
    top: '-38px',
    left: '0',
    display: 'flex',
    gap: '6px',
    padding: '5px 8px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, rgba(15,15,25,0.90) 0%, rgba(30,30,55,0.93) 100%)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 18px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.07) inset',
    border: '1px solid rgba(255,255,255,0.13)',
    opacity: '0',
    pointerEvents: 'none',
    zIndex: '99999',
    transition: 'opacity 0.18s ease, top 0.22s cubic-bezier(0.34,1.56,0.64,1)',
    whiteSpace: 'nowrap',
  });

  buildButtons(videoId, pill);

  const wrapper = document.createElement('div');
  wrapper.className = 'yt-thumb-pill-wrapper';
  Object.assign(wrapper.style, {
    position: 'absolute',
    pointerEvents: 'none',
  });

  wrapper.appendChild(pill);
  parent.insertBefore(wrapper, anchor);

  const show = (e) => {
    debugLog('[YT-Thumb] SHOW triggered by:', e?.currentTarget, 'Target:', e?.target);
    pill.style.opacity = '1';
    pill.style.top = '0px';
    pill.style.pointerEvents = 'auto';
  };

  const hide = (e) => {
    debugLog('[YT-Thumb] HIDE triggered by:', e?.currentTarget, 'Target:', e?.target, 'RelatedTarget:', e?.relatedTarget);
    pill.style.opacity = '0';
    pill.style.top = '-38px';
    pill.style.pointerEvents = 'none';
  };

  anchor.addEventListener('mouseenter', show);
  anchor.addEventListener('mouseleave', (e) => {
    if (!pill.contains(e.relatedTarget)) hide(e);
  });

  pill.addEventListener('mouseenter', show);
  pill.addEventListener('mouseleave', (e) => {
    if (!anchor.contains(e.relatedTarget)) hide(e);
  });
}

function scanAllTitleLinks() {
  document.querySelectorAll('a[href*="watch?v="]').forEach((anchor) => {
    if (anchor.id === 'thumbnail') return;
    if (anchor.id === 'video-title') return;
    if (anchor.closest('#masthead, ytd-masthead, .ytp-title-link')) return;

    injectOverlayIntoTitleLink(anchor);
  });
}

function injectButtonToWatchPage() {
  const overlay = document.querySelector('.ytp-cued-thumbnail-overlay');
  if (!overlay || overlay.querySelector('.yt-thumb-pill')) return;

  const videoId = new URL(location.href).searchParams.get('v');
  if (!videoId) return;

  const pill = document.createElement('div');
  pill.className = 'yt-thumb-pill';
  Object.assign(pill.style, {
    position: 'absolute',
    top: '8px',
    left: '8px',
    display: 'flex',
    gap: '6px',
    padding: '5px 8px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, rgba(15,15,25,0.90) 0%, rgba(30,30,55,0.93) 100%)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 18px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.07) inset',
    border: '1px solid rgba(255,255,255,0.13)',
    opacity: '0',
    pointerEvents: 'none',
    zIndex: '99999',
    transition: 'opacity 0.2s ease',
    whiteSpace: 'nowrap',
  });

  buildButtons(videoId, pill);
  overlay.style.position = 'relative';
  overlay.appendChild(pill);

  overlay.addEventListener('mouseenter', (e) => {
    debugLog('[YT-Thumb] Watch Page SHOW triggered by:', e.currentTarget, 'Target:', e.target);
    pill.style.opacity = '1';
    pill.style.pointerEvents = 'auto';
  });
  overlay.addEventListener('mouseleave', (e) => {
    debugLog('[YT-Thumb] Watch Page HIDE triggered by:', e.currentTarget, 'Target:', e.target, 'RelatedTarget:', e.relatedTarget);
    pill.style.opacity = '0';
    pill.style.pointerEvents = 'none';
  });
}

function buttonStyle(accentColor) {
  return {
    background: accentColor || 'rgba(255,255,255,0.10)',
    color: 'white',
    fontSize: '15px',
    padding: '5px 8px',
    borderRadius: '7px',
    cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.15)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
    transition: 'filter 0.15s ease, transform 0.12s ease',
    userSelect: 'none',
    lineHeight: '1',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

function init() {
  scanAllTitleLinks();
  injectButtonToWatchPage();

  new MutationObserver(() => {
    scanAllTitleLinks();
    injectButtonToWatchPage();
  }).observe(document.body, { childList: true, subtree: true });
}

setTimeout(init, 1000);

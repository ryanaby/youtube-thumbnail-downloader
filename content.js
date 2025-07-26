// == Thumbnail Utils == //

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

// == Button UI == //

function createIconButton(label, title, onClick) {
  const btn = document.createElement('div');
  btn.textContent = label;
  btn.title = title;
  Object.assign(btn.style, buttonStyle());

  btn.onclick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onClick(btn);
  };
  return btn;
}

function createButtonOverlay() {
  const wrapper = document.createElement('div');
  wrapper.className = 'thumb-hover-zone';
  Object.assign(wrapper.style, wrapperStyle());

  const container = document.createElement('div');
  Object.assign(container.style, containerStyle());

  wrapper.appendChild(container);
  wrapper.addEventListener('mouseenter', () => {
    container.style.opacity = '1';
    container.style.pointerEvents = 'auto';
  });
  wrapper.addEventListener('mouseleave', () => {
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
  });

  return { wrapper, container };
}

function createThumbnailButtons(anchor) {
  const videoId = getVideoIdFromAnchor(anchor);
  if (!videoId) return null;

  const { wrapper, container } = createButtonOverlay();

  const viewBtn = createIconButton('🔍', 'View thumbnail', () =>
    window.open(`https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`, '_blank')
  );

  const downloadBtn = createIconButton('⬇️', 'Download thumbnail', async () => {
    try {
      const url = `https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
      const blob = await fetch(url).then((res) => res.blob());
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
  });

  const copyBtn = createIconButton('📋', 'Copy thumbnail to clipboard', async (btn) => {
    try {
      const originalBg = btn.style.background;
      btn.style.background = '#fffb00ff';
      setTimeout(() => {
        btn.style.background = originalBg;
      }, 1000);

      const url = `https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
      const pngBlob = await fetchAsPngBlob(url);
      const item = new ClipboardItem({ 'image/png': pngBlob });
      await navigator.clipboard.write([item]);
    } catch (err) {
      console.error(err);
    }
  });

  container.append(viewBtn, downloadBtn, copyBtn);
  return wrapper;
}

// == DOM Integration == //

function injectButtonsIntoThumbnail(anchor) {
  const videoId = getVideoIdFromAnchor(anchor);
  if (!videoId) return;

  const parent = anchor.parentElement;
  if (!parent) return;

  const existing = parent.querySelector('.thumb-hover-zone');
  if (existing) {
    const currentId = existing.getAttribute('data-stealth-id');
    if (currentId === videoId) return;
    existing.remove();
  }

  const buttons = createThumbnailButtons(anchor);
  if (!buttons) return;

  buttons.setAttribute('data-stealth-id', videoId);
  parent.style.position = 'relative';
  parent.appendChild(buttons);
}

function scanAllThumbnails() {
  document.querySelectorAll('a#thumbnail[href*="watch?v="]').forEach(injectButtonsIntoThumbnail);
}

function injectButtonToWatchPage() {
  const overlay = document.querySelector('.ytp-cued-thumbnail-overlay');
  if (!overlay || overlay.querySelector('.thumb-hover-zone')) return;

  const videoId = new URL(location.href).searchParams.get('v');
  if (!videoId) return;

  const dummyAnchor = document.createElement('a');
  dummyAnchor.href = `/watch?v=${videoId}`;
  const buttons = createThumbnailButtons(dummyAnchor);
  if (buttons) {
    overlay.style.position = 'relative';
    overlay.appendChild(buttons);
  }
}

// == Styles == //

function wrapperStyle() {
  return {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '80px',
    height: '60px',
    zIndex: '9998',
  };
}

function containerStyle() {
  return {
    opacity: '0',
    pointerEvents: 'none',
    position: 'absolute',
    top: '8px',
    left: '8px',
    display: 'flex',
    gap: '4px',
    zIndex: '9999',
    transition: 'opacity 0.2s ease',
  };
}

function buttonStyle() {
  return {
    background: 'rgba(0,0,0,0.7)',
    color: 'white',
    fontSize: '16px',
    padding: '4px 6px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  };
}

// == Init == //

function init() {
  scanAllThumbnails();
  injectButtonToWatchPage();

  new MutationObserver(() => {
    scanAllThumbnails();
    injectButtonToWatchPage();
  }).observe(document.body, { childList: true, subtree: true });
}

setTimeout(init, 1000);

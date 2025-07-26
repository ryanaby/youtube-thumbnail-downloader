// == Core Functions == //
async function convertJpegBlobToPngBlob(jpegBlob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          resolve(pngBlob);
        } else {
          reject(new Error('Failed to convert JPEG to PNG'));
        }
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(jpegBlob);
  });
}

function createStealthButton(videoId) {
  const wrapper = document.createElement('div');
  wrapper.className = 'thumb-hover-zone';
  Object.assign(wrapper.style, baseWrapperStyle());

  const container = document.createElement('div');
  Object.assign(container.style, baseContainerStyle());

  const viewBtn = createIconButton('🔍', 'View maxres thumbnail', () => {
    window.open(`https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`, '_blank');
  });

  const downloadBtn = createIconButton('⬇️', 'Download maxres thumbnail', async () => {
    const url = `https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${videoId}_maxres.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      alert('⚠️ Failed to download thumbnail!');
      console.error(err);
    }
  });

  const copyBtn = createIconButton('📋', 'Copy thumbnail to clipboard', async () => {
    const url = `https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  
    try {
      const res = await fetch(url);
      const jpegBlob = await res.blob();
      const pngBlob = await convertJpegBlobToPngBlob(jpegBlob);
  
      window.ClipboardItem = window.ClipboardItem || window.WebKitClipboardItem || class ClipboardItem {
        constructor(items) {
          this.items = items;
        }
      };
  
      const item = new ClipboardItem({ 'image/png': pngBlob });
      await navigator.clipboard.write([item]);
  
      alert('✅ Thumbnail copied to clipboard (as PNG)!');
    } catch (err) {
      alert('⚠️ Failed to copy thumbnail!');
      console.error('Copy error:', err);
    }
  });

  container.append(viewBtn, downloadBtn, copyBtn);
  wrapper.appendChild(container);

  wrapper.addEventListener('mouseenter', () => {
    container.style.opacity = '1';
    container.style.pointerEvents = 'auto';
  });

  wrapper.addEventListener('mouseleave', () => {
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
  });

  return wrapper;
}

function createIconButton(icon, title, onClick) {
  const btn = document.createElement('div');
  btn.textContent = icon;
  btn.title = title;
  Object.assign(btn.style, baseBtnStyle());
  btn.onclick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onClick();
  };
  return btn;
}

function addStealthButton(thumbnailAnchor) {
  const href = thumbnailAnchor.getAttribute('href');
  const match = href?.match(/v=([a-zA-Z0-9_-]+)/);
  if (!match) return;

  const videoId = match[1];
  const container = thumbnailAnchor.parentElement;
  if (!container || container.querySelector('.thumb-hover-zone')) return;

  container.style.position = 'relative';
  const stealthButton = createStealthButton(videoId);
  container.appendChild(stealthButton);
}

function scanThumbnails() {
  document.querySelectorAll('a#thumbnail[href*="watch?v="]').forEach(addStealthButton);
}

function addStealthToWatchPage() {
  const cuedThumb = document.querySelector('.ytp-cued-thumbnail-overlay');
  if (!cuedThumb || cuedThumb.querySelector('.thumb-hover-zone')) return;

  const url = new URL(window.location.href);
  const videoId = url.searchParams.get('v');
  if (!videoId) return;

  cuedThumb.style.position = 'relative';
  cuedThumb.appendChild(createStealthButton(videoId));
}

// == Style == //

function baseWrapperStyle() {
  return {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '80px',
    height: '60px',
    zIndex: '9998',
  };
}

function baseContainerStyle() {
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

function baseBtnStyle() {
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

setTimeout(() => {
  scanThumbnails();
  addStealthToWatchPage();
}, 1500);

new MutationObserver(() => {
  scanThumbnails();
  addStealthToWatchPage();
}).observe(document.body, { childList: true, subtree: true });

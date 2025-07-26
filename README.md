# 🖼️ YouTube Thumbnail Downloader

A simple browser extension that adds a subtle overlay button on YouTube video thumbnails. With one click, you can **view**, **download**, or even **copy** the full-resolution thumbnail (`maxresdefault.jpg`) of any video.

---

## ✨ Features

- 🔍 View max resolution YouTube thumbnails in a new tab  
- ⬇️ Download thumbnails in full quality instantly  
- 📋 Copy thumbnail image directly to clipboard (as PNG)
- 🧼 Clean UI – buttons only appear on hover  
- 🦊 Works on YouTube channel pages, search results, and single video pages  
- ⚡ Lightweight, no background scripts, no tracking

---

## 📦 Installation

### 🧪 Load as temporary extension (for development/testing)

1. Clone or download this repository  
2. Open **Firefox** and go to: `about:debugging`  
3. Click **"This Firefox"** → **"Load Temporary Add-on..."**  
4. Select the `manifest.json` file from this project folder  
5. Go to YouTube and hover over any thumbnail to see it in action!

---

## 🛠️ How it works

The extension scans YouTube for video thumbnails and overlays a button in the top-left corner on hover. The buttons allow you to:

- 🔍 Open the full-resolution thumbnail (`maxresdefault.jpg`) in a new tab  
- ⬇️ Download the thumbnail using a Blob object (to bypass redirects)  
- 📋 Copy the actual image to clipboard as a PNG, ready to paste into apps like Photoshop, Figma, or chat

---

## 🧪 Clipboard Notes

- Copying image to clipboard uses `image/png` format (converted from JPEG)
- Fully works on **Firefox** and **Chrome** (desktop)
- On some browsers, clipboard access might require user gesture or secure context

---

## ✍️ Author

Made with 💡 by [Ryan Aby](https://github.com/ryanaby)

---

## 📄 License

MIT – Free for personal and commercial use. Contributions welcome!

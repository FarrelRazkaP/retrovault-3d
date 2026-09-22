# 🕹️ RetroVault 3D

> **Interactive 3D Retro Terminal & Application Showcase Repository**  
> *Crafted with Three.js, Web Audio API, and Cyber-Retro / Pinterest Moodboard Aesthetics.*

![RetroVault 3D Preview](https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop)

---

## ✨ Features

- **🖥️ Interactive 3D CRT Workstation**: Built procedurally using Three.js with orbit controls, realistic lighting, and an animated phosphor canvas screen.
- **⚡ Dynamic Screen Projection**: Clicking any app card instantly projects its name, version, and animated oscilloscope onto the 3D CRT monitor.
- **💾 Ejectable Floppy Drive**: Interactive 3.5" floppy disk with sound effects and physical eject animation.
- **📺 Authentic CRT Overlay**: Toggleable scanlines, phosphor glow, and screen vignette.
- **🔊 Procedural 8-bit Audio Engine**: Zero external audio files; all click, boot, seek, and coin fanfare sounds are generated live using Web Audio API.
- **📌 Pinterest-style Moodboard Cards**: Polaroid frames with scotch tape, retro stickers (`HOT`, `NEW`, `VERIFIED`), and platform badges.
- **🚀 Application Publishing Hub**: Modal form to publish new apps with support for Pinterest/Unsplash image URLs or local image uploads, platform selection, direct download links, and changelogs.
- **📦 Backup & Restore**: One-click JSON database export and restore.

---

## 🛠️ Tech Stack

- **Three.js** — 3D Computer graphics, lighting, raycasting, and dynamic canvas textures.
- **Vite** — Next-generation frontend build tooling.
- **Vanilla Modern JavaScript (ES Modules)** — Clean, fast, zero-bloat state management.
- **CSS3 Design System** — Custom HSL neon tokens, CRT scanlines, and pixel-art typography.
- **Web Audio API** — Real-time synthesized 8-bit retro sound generator.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
```
The optimized production bundle will be generated in `dist/`.

---

## 🌐 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New Project** and select `FarrelRazkaP/retrovault-3d`.
3. Keep default settings (Framework preset: `Vite`, Build command: `npm run build`, Output directory: `dist`).
4. Click **Deploy**!

---

## 📜 License
MIT © 2026 [FarrelRazkaP](https://github.com/FarrelRazkaP)

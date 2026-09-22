/**
 * RetroVault - Local & Cloud Database Management
 * Handles persistent storage of published applications, preset retro data,
 * download stats, JSON backup export/import, and automatic Firebase Cloud Firestore sync.
 */

import { 
  isFirebaseConfigured, 
  fetchRemoteApps, 
  pushRemoteApp, 
  deleteRemoteApp, 
  incrementRemoteDownload 
} from './firebase-config.js';

const STORAGE_KEY = 'retrovault_apps_v1';

// Initial aesthetic preset apps with Pinterest moodboard screenshots
export const DEFAULT_APPS = [
  {
    id: 'cyberrunner-2084',
    title: 'CyberRunner 2084',
    tagline: 'Fast-paced 16-bit neon cyber-dystopia endless platformer',
    category: 'Games',
    platform: 'Windows, Linux, Web',
    version: 'v1.4.2',
    size: '64 MB',
    releaseDate: '2026-03-15',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop'
    ],
    downloadUrl: '#download-cyberrunner',
    demoUrl: 'https://itch.io',
    downloadsCount: 1284,
    rating: 4.9,
    sticker: 'HOT',
    description: 'A neon-soaked retro arcade runner set in the smoggy cyber alleys of Neo-Jakarta 2084. Featuring customizable synthwave soundtracks, pixel-perfect collision detection, and secret underground boss encounters.',
    features: [
      'Original 80s analog synth soundtrack',
      'High-speed grappling hook mechanics',
      'Native gamepad & arcade stick support',
      'Global retro CRT leaderboard system'
    ],
    requirements: 'Windows 10/11 or Ubuntu 22.04+ • 2GB RAM • DirectX 11 support',
    changelog: 'Added stage 4 "Neon Rain" and fixed framerate stutter on 144Hz monitors.'
  },
  {
    id: 'pixelstudio-fx',
    title: 'PixelStudio FX Pro',
    tagline: 'Lightweight pixel art studio & sprite animator with CRT preview',
    category: 'Creative',
    platform: 'Windows, macOS, Web',
    version: 'v2.1.0',
    size: '32 MB',
    releaseDate: '2026-02-28',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop'
    ],
    downloadUrl: '#download-pixelstudio',
    demoUrl: 'https://github.com',
    downloadsCount: 3420,
    rating: 4.8,
    sticker: 'STAFF PICK',
    description: 'Designed specifically for retro indie developers and pixel artists. Includes palette generators inspired by Game Boy, NES, SNES, and Commodore 64, onion skinning animation, and one-click spritesheet exporter.',
    features: [
      'Authentic retro hardware palette presets',
      'Multi-layer timeline with onion skinning',
      'Real-time CRT scanlines and curve preview mode',
      'Direct export to GIF, PNG spritesheet, and Godot atlas'
    ],
    requirements: 'Any 64-bit OS • 1GB RAM • 100MB free disk space',
    changelog: 'Added isometric grid snapping and palette quantization wizard.'
  },
  {
    id: 'vaporsynth-tracker',
    title: 'VaporSynth DAW',
    tagline: '8-Channel Chiptune tracker & FM synthesis workstation',
    category: 'Audio',
    platform: 'Windows, Linux',
    version: 'v0.9.8',
    size: '48 MB',
    releaseDate: '2026-04-10',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop'
    ],
    downloadUrl: '#download-vaporsynth',
    demoUrl: 'https://github.com',
    downloadsCount: 890,
    rating: 4.7,
    sticker: 'NEW',
    description: 'Relive the golden era of Tracker music creation like ProTracker and FastTracker II with modern stereo panning, built-in vintage reverb impulse responses, and MIDI keyboard plug-and-play.',
    features: [
      'Dual YM2612 and SID chip emulation modules',
      'Tracker pattern matrix editor with keyboard shortcuts',
      'Real-time frequency spectrum & stereo vector scope',
      'Direct WAV & MP3 320kbps master export'
    ],
    requirements: 'Windows 10/11 • Audio interface or ASIO4ALL recommended',
    changelog: 'Initial public beta with 12 vintage synthesizer sample packs.'
  },
  {
    id: 'retro-terminal-os',
    title: 'RetroDeck Terminal OS',
    tagline: 'Hacker simulation & fantasy console development kit',
    category: 'Dev Tools',
    platform: 'Windows, Linux, macOS',
    version: 'v3.0.1',
    size: '18 MB',
    releaseDate: '2026-05-02',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop'
    ],
    downloadUrl: '#download-retrodeck',
    demoUrl: 'https://github.com',
    downloadsCount: 2150,
    rating: 4.9,
    sticker: 'VERIFIED',
    description: 'A sandboxed fantasy console environment inspired by 1980s mainframe terminals. Write scripts in Lua, assemble bytecodes, simulate cyber warfare networks, or run vintage text RPG adventures.',
    features: [
      'Built-in Lua 5.4 runtime and code editor',
      'Customizable CRT glow, phosphor persistence & grain',
      'Networking simulator with mock BBS dial-up',
      'Extensive CLI documentation and cheat sheets'
    ],
    requirements: 'Cross-platform CLI • 512MB RAM',
    changelog: 'Integrated sound synthesizer module and BBS bulletin board server.'
  },
  {
    id: 'gameboy-rom-injector',
    title: 'RetroRom PatchCraft',
    tagline: 'Universal IPS/BPS patcher and retro cartridge utility',
    category: 'Emulators',
    platform: 'Windows, Android',
    version: 'v1.2.0',
    size: '12 MB',
    releaseDate: '2026-01-20',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?q=80&w=800&auto=format&fit=crop'
    ],
    downloadUrl: '#download-patchcraft',
    demoUrl: '',
    downloadsCount: 4120,
    rating: 4.95,
    sticker: 'HOT',
    description: 'Clean, modern patcher for fan translations, ROM hacks, and checksum verification for Game Boy, GBA, SNES, and Mega Drive ROMs. Automated header repair and backup system.',
    features: [
      'Supports IPS, UPS, BPS, and XDelta patch files',
      'Automatic SHA-1 & CRC32 database verification',
      'One-click batch patching mode for multiple ROMs',
      '100% safe zero-overwrite backup safeguard'
    ],
    requirements: 'Windows 7+ or Android 9.0+',
    changelog: 'Added support for BPS multi-file patching and modern dark theme.'
  }
];

class StorageManager {
  constructor() {
    this.init();
  }

  async init() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_APPS));
    }

    // Attempt background sync if Firebase is active
    if (isFirebaseConfigured()) {
      this.syncWithCloud();
    }
  }

  async syncWithCloud() {
    const remoteApps = await fetchRemoteApps();
    if (remoteApps && remoteApps.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteApps));
      console.log(`[RetroVault] Synchronized ${remoteApps.length} apps from Firebase Cloud!`);
    } else if (remoteApps && remoteApps.length === 0) {
      // First time cloud setup: seed default apps to Firestore
      for (const app of DEFAULT_APPS) {
        await pushRemoteApp(app);
      }
      console.log('[RetroVault] Initialized Cloud Firestore with default apps collection.');
    }
  }

  getAllApps() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : DEFAULT_APPS;
    } catch (e) {
      console.error('Failed to parse apps storage:', e);
      return DEFAULT_APPS;
    }
  }

  getAppById(id) {
    const apps = this.getAllApps();
    return apps.find(a => a.id === id) || null;
  }

  saveApp(appData) {
    const apps = this.getAllApps();
    const existingIndex = apps.findIndex(a => a.id === appData.id);

    let savedApp = null;
    if (existingIndex >= 0) {
      savedApp = { ...apps[existingIndex], ...appData, updatedAt: new Date().toISOString() };
      apps[existingIndex] = savedApp;
    } else {
      savedApp = {
        id: appData.id || 'app-' + Date.now(),
        releaseDate: new Date().toISOString().split('T')[0],
        downloadsCount: 0,
        rating: 5.0,
        sticker: appData.sticker || 'NEW',
        screenshots: appData.screenshots || [appData.thumbnailUrl],
        ...appData
      };
      apps.unshift(savedApp);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));

    // Cloud push
    if (isFirebaseConfigured() && savedApp) {
      pushRemoteApp(savedApp);
    }

    return apps;
  }

  deleteApp(id) {
    let apps = this.getAllApps();
    apps = apps.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));

    // Cloud delete
    if (isFirebaseConfigured()) {
      deleteRemoteApp(id);
    }

    return apps;
  }

  incrementDownloads(id) {
    const apps = this.getAllApps();
    const app = apps.find(a => a.id === id);
    if (app) {
      app.downloadsCount = (app.downloadsCount || 0) + 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));

      // Cloud atomic increment
      if (isFirebaseConfigured()) {
        incrementRemoteDownload(id);
      }

      return app.downloadsCount;
    }
    return 0;
  }

  exportData() {
    const apps = this.getAllApps();
    const dataStr = JSON.stringify(apps, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `retrovault-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        if (isFirebaseConfigured()) {
          parsed.forEach(app => pushRemoteApp(app));
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  resetToDefaults() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_APPS));
    return DEFAULT_APPS;
  }
}

export const storage = new StorageManager();

/**
 * RetroVault - Local & Cloud Database Management
 * Handles persistent storage of published applications,
 * download stats, JSON backup export/import, and automatic Firebase Cloud Firestore sync.
 * 
 * Empty by default so user starts with a clean slate to upload their own apps.
 */

import { 
  isFirebaseConfigured, 
  fetchRemoteApps, 
  pushRemoteApp, 
  deleteRemoteApp, 
  incrementRemoteDownload 
} from './firebase-config.js';

const STORAGE_KEY = 'retrovault_apps_v2';

// Empty default: ready for user's own software uploads
export const DEFAULT_APPS = [];

class StorageManager {
  constructor() {
    this.init();
  }

  async init() {
    // Purge old mock sample apps from previous versions
    localStorage.removeItem('retrovault_apps_v1');

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
    }
  }

  getAllApps() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse apps storage:', e);
      return [];
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  }
}

export const storage = new StorageManager();

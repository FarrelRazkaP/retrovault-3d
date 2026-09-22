/**
 * RetroVault - Admin Authentication & Access Control
 * Restricts application publishing, editing, and deletion to authenticated owner.
 */

const SESSION_KEY = 'retrovault_admin_auth';
const DEFAULT_MASTER_PIN = 'farrel2026';

class AuthManager {
  constructor() {
    this.subscribers = [];
  }

  getMasterPin() {
    // Allows custom pin via .env or falls back to default master pin
    return import.meta.env.VITE_ADMIN_PIN || DEFAULT_MASTER_PIN;
  }

  isAdmin() {
    return sessionStorage.getItem(SESSION_KEY) === 'authenticated_true';
  }

  login(enteredPin) {
    const validPin = this.getMasterPin();
    if (enteredPin.trim() === validPin) {
      sessionStorage.setItem(SESSION_KEY, 'authenticated_true');
      this.notify(true);
      return { success: true };
    }
    return { success: false, error: 'INVALID ADMIN ACCESS CODE' };
  }

  logout() {
    sessionStorage.removeItem(SESSION_KEY);
    this.notify(false);
  }

  onAuthChange(callback) {
    this.subscribers.push(callback);
    callback(this.isAdmin());
  }

  notify(status) {
    this.subscribers.forEach((cb) => {
      try {
        cb(status);
      } catch (e) {
        console.error('Auth notification error:', e);
      }
    });
  }
}

export const auth = new AuthManager();

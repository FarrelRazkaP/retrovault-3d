/**
 * RetroVault - Main Application Entry Point
 * Mounts the 3D scene, Sound System, and UI controllers.
 */

import { RetroScene } from './three-scene.js';
import { UIManager } from './ui-manager.js';
import { sound } from './sound-fx.js';
import { storage } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log(`%c
   ____  _____ _____ ____   _____   __     __     _   _ _____ 
  |  _ \\| ____|_   _|  _ \\ / _ \\ \\ / / /\\  | |   | | | |_   _|
  | |_) |  _|   | | | |_) | | | \\ V / /  \\ | |   | | | | | |  
  |  _ <| |___  | | |  _ <| |_| || | / /\\ \\| |___| |_| | | |  
  |_| \\_\\_____| |_| |_| \\_\\\\___/ |_|/_/  \\_\\_____|\\___/  |_|  
  -- INTERACTIVE 3D RETRO SHOWCASE & APP REPOSITORY --
  `, 'color: #00f0ff; font-family: monospace; font-weight: bold;');

  let uiManager = null;

  // Initialize Three.js 3D Scene
  const retroScene = new RetroScene('three-canvas-container', (app) => {
    if (uiManager && app) {
      uiManager.openDetailModal(app);
    }
  });

  // Initialize UI Manager
  uiManager = new UIManager(retroScene);

  // Hook 3D Viewport Toolbar Controls
  const btnResetCamera = document.getElementById('btn-reset-camera');
  if (btnResetCamera) {
    btnResetCamera.addEventListener('click', () => {
      retroScene.resetCamera();
    });
  }

  const btnFloppyEject = document.getElementById('btn-floppy-eject');
  if (btnFloppyEject) {
    btnFloppyEject.addEventListener('click', () => {
      retroScene.toggleFloppy();
    });
  }

  // Smooth scroll links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        sound.playClick();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});

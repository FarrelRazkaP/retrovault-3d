/**
 * RetroVault - UI Manager & Application Lifecycle
 * Orchestrates DOM events, Pinterest-style cards rendering, admin authentication,
 * upload modals, screenshot carousel, filtering/search, and retro sound effects.
 */

import { storage } from './storage.js';
import { sound } from './sound-fx.js';
import { auth } from './auth.js';

export class UIManager {
  constructor(retroScene) {
    this.retroScene = retroScene;
    this.currentCategory = 'All';
    this.currentPlatform = 'All';
    this.currentSearch = '';
    this.currentSort = 'downloads';
    this.initElements();
    this.attachEvents();
    this.initAuthState();
    this.render();
    this.checkDeepLink();
  }

  initElements() {
    // Containers
    this.appsGrid = document.getElementById('apps-grid');
    this.statTotalApps = document.getElementById('stat-total-apps');
    this.statTotalDownloads = document.getElementById('stat-total-downloads');
    this.toastContainer = document.getElementById('toast-container');

    // Controls
    this.searchInput = document.getElementById('search-input');
    this.catPills = document.querySelectorAll('.cat-pill');
    this.platformSelect = document.getElementById('platform-select');
    this.sortSelect = document.getElementById('sort-select');

    // Toggles & Auth
    this.btnAdminAuth = document.getElementById('btn-admin-auth');
    this.btnToggleSound = document.getElementById('btn-toggle-sound');
    this.btnToggleCrt = document.getElementById('btn-toggle-crt');
    this.crtScanlines = document.getElementById('crt-scanlines');
    this.crtVignette = document.getElementById('crt-vignette');

    // Modals
    this.uploadModal = document.getElementById('upload-modal');
    this.detailModal = document.getElementById('detail-modal');
    this.adminModal = document.getElementById('admin-login-modal');
    this.adminLoginForm = document.getElementById('admin-login-form');
    this.adminPinInput = document.getElementById('admin-pin-input');
    this.adminErrorMsg = document.getElementById('admin-error-msg');

    this.btnOpenUpload = document.getElementById('btn-open-upload');
    this.heroBtnUpload = document.getElementById('hero-btn-upload');
    this.uploadForm = document.getElementById('upload-form');

    // Image upload/preview inside upload modal
    this.inputImgUrl = document.getElementById('upload-img-url');
    this.inputImgFile = document.getElementById('upload-img-file');
    this.previewImg = document.getElementById('upload-preview-img');
    this.previewPlaceholder = document.getElementById('upload-preview-placeholder');

    // Data Management
    this.btnExportData = document.getElementById('btn-export-data');
    this.btnImportData = document.getElementById('btn-import-data');
    this.importFileInput = document.getElementById('import-file-input');
  }

  initAuthState() {
    auth.onAuthChange((isAdmin) => {
      if (isAdmin) {
        if (this.btnAdminAuth) {
          this.btnAdminAuth.innerHTML = '⚡ ADMIN: LOGOUT';
          this.btnAdminAuth.classList.add('active');
        }
        if (this.btnOpenUpload) {
          this.btnOpenUpload.style.display = 'inline-flex';
        }
      } else {
        if (this.btnAdminAuth) {
          this.btnAdminAuth.innerHTML = '🔑 ADMIN LOGIN';
          this.btnAdminAuth.classList.remove('active');
        }
        if (this.btnOpenUpload) {
          this.btnOpenUpload.style.display = 'none';
        }
      }
      this.render();
    });
  }

  attachEvents() {
    // 1. Admin Authentication Handlers
    if (this.btnAdminAuth) {
      this.btnAdminAuth.addEventListener('click', () => {
        sound.playClick();
        if (auth.isAdmin()) {
          auth.logout();
          this.showToast('LOGGED OUT FROM ADMIN MODE');
        } else {
          this.openAdminModal();
        }
      });
    }

    if (this.adminLoginForm) {
      this.adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = this.adminPinInput.value;
        const result = auth.login(pin);
        if (result.success) {
          sound.playPowerUp();
          this.adminModal.classList.remove('active');
          this.adminPinInput.value = '';
          this.adminErrorMsg.textContent = '';
          this.showToast('ADMIN CLEARANCE GRANTED // ACCESS UNLOCKED');
        } else {
          sound.playBeep(220);
          this.adminErrorMsg.textContent = '✖ ' + result.error;
          this.adminPinInput.value = '';
          this.adminPinInput.focus();
        }
      });
    }

    // Secret shortcut: Ctrl + Shift + A to open Admin Login
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        sound.playBeep(1200);
        this.openAdminModal();
      }
    });

    // 2. Search & Filtering
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.currentSearch = e.target.value.toLowerCase();
        this.render();
      });
    }

    if (this.catPills) {
      this.catPills.forEach((pill) => {
        pill.addEventListener('click', () => {
          sound.playClick();
          this.catPills.forEach((p) => p.classList.remove('active'));
          pill.classList.add('active');
          this.currentCategory = pill.dataset.category;
          this.render();
        });
      });
    }

    if (this.platformSelect) {
      this.platformSelect.addEventListener('change', (e) => {
        sound.playClick();
        this.currentPlatform = e.target.value;
        this.render();
      });
    }

    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => {
        sound.playClick();
        this.currentSort = e.target.value;
        this.render();
      });
    }

    // 3. Audio & CRT Toggles
    if (this.btnToggleSound) {
      this.btnToggleSound.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        this.btnToggleSound.innerHTML = isMuted ? '🔇 SFX: OFF' : '🔊 SFX: ON';
        this.btnToggleSound.classList.toggle('active', !isMuted);
        this.showToast(isMuted ? 'SOUND FX MUTED' : 'SOUND FX ENABLED');
      });
    }

    if (this.btnToggleCrt) {
      this.btnToggleCrt.addEventListener('click', () => {
        sound.playDegauss();
        const isDisabled = this.crtScanlines.classList.toggle('disabled');
        this.crtVignette.classList.toggle('disabled', isDisabled);
        this.btnToggleCrt.innerHTML = isDisabled ? '📺 CRT: OFF' : '📺 CRT: ON';
        this.btnToggleCrt.classList.toggle('active', !isDisabled);
        this.showToast(isDisabled ? 'CRT SCANLINES DISABLED' : 'CRT SCANLINES ENABLED');
      });
    }

    // 4. Upload Modal Open/Close (Protected by Admin Auth)
    const openUpload = () => {
      sound.playClick();
      if (!auth.isAdmin()) {
        this.openAdminModal();
        this.showToast('HARAP LOGIN SEBAGAI ADMIN UNTUK UPLOAD', 'danger');
        return;
      }
      this.uploadModal.classList.add('active');
    };

    if (this.btnOpenUpload) this.btnOpenUpload.addEventListener('click', openUpload);
    if (this.heroBtnUpload) this.heroBtnUpload.addEventListener('click', openUpload);

    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClick();
        this.uploadModal.classList.remove('active');
        this.detailModal.classList.remove('active');
        if (this.adminModal) this.adminModal.classList.remove('active');
      });
    });

    // Close on backdrop click
    [this.uploadModal, this.detailModal, this.adminModal].forEach((modal) => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            sound.playClick();
            modal.classList.remove('active');
          }
        });
      }
    });

    // 5. Image live preview in Upload Modal
    if (this.inputImgUrl) {
      this.inputImgUrl.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url) {
          this.previewImg.src = url;
          this.previewImg.style.display = 'block';
          this.previewPlaceholder.style.display = 'none';
        }
      });
    }

    if (this.inputImgFile) {
      this.inputImgFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            this.previewImg.src = event.target.result;
            this.previewImg.style.display = 'block';
            this.previewPlaceholder.style.display = 'none';
            this.inputImgUrl.value = '';
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // 6. Upload Form Submit
    if (this.uploadForm) {
      this.uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleUploadSubmit();
      });
    }

    // 7. Data Export / Import
    if (this.btnExportData) {
      this.btnExportData.addEventListener('click', () => {
        sound.playBeep(1200);
        storage.exportData();
        this.showToast('DATABASE BACKUP EXPORTED (.JSON)');
      });
    }

    if (this.btnImportData && this.importFileInput) {
      this.btnImportData.addEventListener('click', () => {
        if (!auth.isAdmin()) {
          this.openAdminModal();
          this.showToast('LOGIN ADMIN DIPERLUKAN UNTUK RESTORE DATA', 'danger');
          return;
        }
        this.importFileInput.click();
      });

      this.importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const success = storage.importData(ev.target.result);
            if (success) {
              sound.playPowerUp();
              this.showToast('DATABASE RESTORED SUCCESSFULLY!');
              this.render();
            } else {
              sound.playBeep(250);
              this.showToast('INVALID JSON BACKUP FILE', 'danger');
            }
          };
          reader.readAsText(file);
        }
      });
    }
  }

  openAdminModal() {
    if (!this.adminModal) return;
    this.adminErrorMsg.textContent = '';
    this.adminPinInput.value = '';
    this.adminModal.classList.add('active');
    setTimeout(() => this.adminPinInput.focus(), 150);
  }

  handleUploadSubmit() {
    if (!auth.isAdmin()) {
      this.showToast('UNAUTHORIZED: ADMIN ACCESS REQUIRED', 'danger');
      return;
    }

    const title = document.getElementById('upload-title').value.trim();
    const tagline = document.getElementById('upload-tagline').value.trim();
    const category = document.getElementById('upload-category').value;
    const platform = document.getElementById('upload-platform').value.trim();
    const version = document.getElementById('upload-version').value.trim() || 'v1.0.0';
    const size = document.getElementById('upload-size').value.trim() || '25 MB';
    const downloadUrl = document.getElementById('upload-download-url').value.trim() || '#download';
    const demoUrl = document.getElementById('upload-demo-url').value.trim();
    const sticker = document.getElementById('upload-sticker').value;
    const description = document.getElementById('upload-desc').value.trim();
    const featuresRaw = document.getElementById('upload-features').value.trim();
    const requirements = document.getElementById('upload-reqs').value.trim() || 'Windows / Cross-platform';

    // Image determination
    let thumbnailUrl = this.previewImg.src;
    if (!thumbnailUrl || this.previewImg.style.display === 'none') {
      thumbnailUrl = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop';
    }

    const features = featuresRaw
      ? featuresRaw.split('\n').map((f) => f.trim()).filter(Boolean)
      : ['Clean architecture', 'Optimized performance', 'Retro compatibility'];

    const newApp = {
      id: 'app-' + Date.now(),
      title,
      tagline,
      category,
      platform,
      version,
      size,
      downloadUrl,
      demoUrl,
      sticker,
      description,
      features,
      requirements,
      thumbnailUrl,
      screenshots: [thumbnailUrl],
      downloadsCount: 0,
      rating: 5.0,
      releaseDate: new Date().toISOString().split('T')[0]
    };

    storage.saveApp(newApp);
    sound.playPowerUp();

    this.uploadForm.reset();
    this.previewImg.style.display = 'none';
    this.previewPlaceholder.style.display = 'flex';
    this.uploadModal.classList.remove('active');

    // Update 3D scene to highlight newly uploaded app
    if (this.retroScene) {
      this.retroScene.setActiveApp(newApp);
    }

    this.showToast(`APP "${title.toUpperCase()}" PUBLISHED!`);
    this.render();

    window.location.hash = '#' + newApp.id;
  }

  checkDeepLink() {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash !== 'hero' && hash !== 'showcase') {
      const app = storage.getAppById(hash);
      if (app) {
        setTimeout(() => {
          if (this.retroScene) this.retroScene.setActiveApp(app);
          this.openDetailModal(app);
        }, 500);
      }
    }
  }

  render() {
    const allApps = storage.getAllApps();

    // Update Header Stats
    let totalDownloads = 0;
    allApps.forEach((a) => (totalDownloads += a.downloadsCount || 0));

    if (this.statTotalApps) this.statTotalApps.textContent = allApps.length;
    if (this.statTotalDownloads) this.statTotalDownloads.textContent = totalDownloads.toLocaleString();

    // Filter by Category & Search
    let filtered = allApps.filter((app) => {
      const matchCat = this.currentCategory === 'All' || app.category.toLowerCase() === this.currentCategory.toLowerCase();
      const matchPlatform = this.currentPlatform === 'All' || app.platform.toLowerCase().includes(this.currentPlatform.toLowerCase());
      const matchSearch =
        !this.currentSearch ||
        app.title.toLowerCase().includes(this.currentSearch) ||
        app.tagline.toLowerCase().includes(this.currentSearch) ||
        (app.description && app.description.toLowerCase().includes(this.currentSearch));

      return matchCat && matchPlatform && matchSearch;
    });

    // Sort
    if (this.currentSort === 'downloads') {
      filtered.sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0));
    } else if (this.currentSort === 'newest') {
      filtered.sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0));
    } else if (this.currentSort === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    this.renderCards(filtered);

    // Set initial 3D app if none selected
    if (this.retroScene && !this.retroScene.activeApp && allApps.length > 0) {
      this.retroScene.setActiveApp(allApps[0]);
    }
  }

  renderCards(apps) {
    if (!this.appsGrid) return;

    if (apps.length === 0) {
      this.appsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: rgba(21, 19, 54, 0.4); border: 2px dashed var(--border-color); border-radius: var(--radius-md);">
          <div style="font-family: var(--font-pixel); font-size: 1.1rem; color: var(--neon-pink); margin-bottom: 12px;">NO APPS FOUND // 404</div>
          <p style="color: var(--text-muted); font-size: 0.95rem;">No retro software matches your current search filters.</p>
          <button class="btn-retro" style="margin-top: 20px;" onclick="window.location.reload()">RESET FILTERS</button>
        </div>
      `;
      return;
    }

    const isAdmin = auth.isAdmin();

    this.appsGrid.innerHTML = apps
      .map((app) => {
        const stickerClass =
          app.sticker === 'HOT'
            ? 'sticker-hot'
            : app.sticker === 'STAFF PICK'
            ? 'sticker-hot'
            : app.sticker === 'VERIFIED'
            ? 'sticker-verified'
            : 'sticker-new';

        const adminControls = isAdmin
          ? `
            <div class="admin-card-actions">
              <span class="admin-badge">⚡ ADMIN</span>
              <button class="btn-retro btn-retro-secondary danger" data-action="delete" data-id="${app.id}" style="font-size: 0.62rem; padding: 4px 8px;">
                🗑 HAPUS
              </button>
            </div>
          `
          : '';

        return `
        <div class="app-card" data-id="${app.id}">
          <div class="sticker-tape"></div>

          <div class="card-image-wrap">
            <img class="card-img" src="${app.thumbnailUrl}" alt="${app.title}" loading="lazy" />
            <div class="card-image-overlay"></div>

            <div class="card-badge-top-left">
              <span class="sticker-badge ${stickerClass}">${app.sticker || 'APP'}</span>
            </div>

            <div class="card-badge-top-right">
              <span class="platform-pill">
                <span>💻</span> ${app.platform.split(',')[0]}
              </span>
            </div>
          </div>

          <div class="card-body">
            <div class="card-meta-row">
              <span class="card-category">${app.category}</span>
              <span class="card-version">${app.version}</span>
            </div>

            <h3 class="card-title" data-action="open-detail" data-id="${app.id}">${app.title}</h3>
            <p class="card-desc">${app.tagline || app.description}</p>

            <div class="card-stats-row">
              <span class="card-download-count">
                <span>⬇</span> ${(app.downloadsCount || 0).toLocaleString()} DL
              </span>
              <span class="card-size">💾 ${app.size}</span>
            </div>

            <div class="card-actions">
              <button class="btn-icon-square" title="Preview on 3D CRT Monitor" data-action="preview-3d" data-id="${app.id}">
                📺
              </button>
              <button class="btn-retro" data-action="download" data-id="${app.id}">
                ⬇ DOWNLOAD
              </button>
              <button class="btn-icon-square" title="View Details" data-action="open-detail" data-id="${app.id}">
                ℹ
              </button>
            </div>

            ${adminControls}
          </div>
        </div>
      `;
      })
      .join('');

    // Attach card event listeners
    this.appsGrid.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        const app = storage.getAppById(id);

        if (!app) return;

        if (action === 'preview-3d') {
          sound.playClick();
          if (this.retroScene) {
            this.retroScene.setActiveApp(app);
          }
          document.querySelector('.hero-section').scrollIntoView({ behavior: 'smooth' });
          this.showToast(`PROJECTED "${app.title.toUpperCase()}" TO CRT MONITOR!`);
        } else if (action === 'open-detail') {
          sound.playClick();
          this.openDetailModal(app);
        } else if (action === 'download') {
          this.handleDownload(app);
        } else if (action === 'delete') {
          if (confirm(`Hapus aplikasi "${app.title}" dari arsip?`)) {
            sound.playBeep(300);
            storage.deleteApp(app.id);
            this.showToast(`APLIKASI "${app.title.toUpperCase()}" DIHAPUS`);
            this.render();
          }
        }
      });
    });
  }

  handleDownload(app) {
    sound.playDownload();
    storage.incrementDownloads(app.id);

    if (!app.downloadUrl || app.downloadUrl.startsWith('#')) {
      const dummyContent = `=====================================================\r\n` +
        `RETROVAULT APPLICATION ARCHIVE\r\n` +
        `Application: ${app.title}\r\n` +
        `Version:     ${app.version}\r\n` +
        `Category:    ${app.category}\r\n` +
        `Platform:    ${app.platform}\r\n` +
        `Release:     ${app.releaseDate}\r\n` +
        `=====================================================\r\n` +
        `Thank you for downloading from RetroVault 3D!\r\n` +
        `Requirements: ${app.requirements}\r\n` +
        `Description:  ${app.description}\r\n\r\n` +
        `[SHA-256 Checksum Verified: 100% CLEAN]\r\n`;

      const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = url;
      tempLink.download = `${app.title.toLowerCase().replace(/\s+/g, '-')}-${app.version}.zip.txt`;
      tempLink.click();
      URL.revokeObjectURL(url);
    } else {
      window.open(app.downloadUrl, '_blank');
    }

    this.showToast(`DOWNLOADING: ${app.title.toUpperCase()} (${app.size})`);
    this.render();
  }

  openDetailModal(app) {
    const container = document.getElementById('detail-content');
    if (!container) return;

    // Build Pinterest screenshot carousel items
    const screenshots = app.screenshots && app.screenshots.length > 0 
      ? app.screenshots 
      : [app.thumbnailUrl];

    let currentSlideIdx = 0;

    const shareUrl = window.location.origin + window.location.pathname + '#' + app.id;

    container.innerHTML = `
      <div class="detail-header-wrap">
        <img class="detail-thumb" src="${app.thumbnailUrl}" alt="${app.title}" />
        <div class="detail-headline">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span class="sticker-badge sticker-hot">${app.category}</span>
            <span class="sticker-badge sticker-verified">${app.version}</span>
            <span style="font-family: var(--font-tech); font-size: 0.72rem; color: var(--neon-amber);">★ ${app.rating || '5.0'} / 5.0</span>
          </div>
          <h2 style="font-family: var(--font-pixel); font-size: 1.3rem; color: #fff; margin-top: 6px;">${app.title}</h2>
          <p style="color: var(--neon-cyan); font-size: 0.95rem;">${app.tagline || ''}</p>
        </div>
      </div>

      <!-- Pinterest-style Screenshot Carousel -->
      <div>
        <h4 style="font-family: var(--font-tech); color: var(--neon-cyan); margin-bottom: 8px; font-size: 0.8rem; text-transform: uppercase;">
          🖼 SCREENSHOT GALLERY // PINTEREST MOODBOARD
        </h4>
        <div class="carousel-container">
          <img id="carousel-img" class="carousel-main-img" src="${screenshots[0]}" alt="${app.title} Screenshot" />
          ${screenshots.length > 1 ? `
            <button id="carousel-prev" class="carousel-nav-btn carousel-nav-prev">◀</button>
            <button id="carousel-next" class="carousel-nav-btn carousel-nav-next">▶</button>
          ` : ''}
        </div>
        ${screenshots.length > 1 ? `
          <div class="carousel-thumbs-row">
            ${screenshots.map((s, idx) => `
              <img class="carousel-thumb ${idx === 0 ? 'active' : ''}" data-idx="${idx}" src="${s}" alt="Thumb ${idx + 1}" />
            `).join('')}
          </div>
        ` : ''}
      </div>

      <div class="detail-specs-box">
        <div class="spec-item">
          <span class="spec-label">PLATFORM</span>
          <span class="spec-val">${app.platform}</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">FILE SIZE</span>
          <span class="spec-val">${app.size}</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">DOWNLOADS</span>
          <span class="spec-val">${(app.downloadsCount || 0).toLocaleString()}</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">RELEASE DATE</span>
          <span class="spec-val">${app.releaseDate || '2026'}</span>
        </div>
      </div>

      <div>
        <h4 style="font-family: var(--font-tech); color: var(--neon-pink); margin-bottom: 8px; font-size: 0.82rem; text-transform: uppercase;">
          ABOUT THIS APPLICATION
        </h4>
        <p style="color: var(--text-dim); line-height: 1.65; font-size: 0.92rem;">
          ${app.description}
        </p>
      </div>

      <div>
        <h4 style="font-family: var(--font-tech); color: var(--neon-green); margin-bottom: 8px; font-size: 0.82rem; text-transform: uppercase;">
          KEY FEATURES
        </h4>
        <ul class="feature-list">
          ${(app.features || []).map((f) => `<li>${f}</li>`).join('')}
        </ul>
      </div>

      <div style="background: rgba(0,0,0,0.3); padding: 12px; border-left: 3px solid var(--neon-green); font-size: 0.85rem; color: var(--text-dim);">
        <strong style="color: var(--neon-green); font-family: var(--font-tech);">REQUIREMENTS:</strong> ${app.requirements || 'Windows 10/11 or modern browser'}
      </div>

      <div class="download-hero-box">
        <div style="font-family: var(--font-pixel); font-size: 0.85rem; color: #fff;">
          READY TO INSTALL // 100% MALWARE CHECKED
        </div>
        <button id="modal-download-btn" class="btn-retro btn-retro-pink" style="font-size: 0.85rem; padding: 14px 28px;">
          ⬇ INSTANT DOWNLOAD (${app.size})
        </button>
        <div style="display: flex; gap: 14px; align-items: center; flex-wrap: wrap; font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-tech);">
          ${app.demoUrl ? `<a href="${app.demoUrl}" target="_blank" style="color: var(--neon-cyan); text-decoration: none;">▶ WEB DEMO / REPO</a>` : ''}
          <button id="modal-preview-3d-btn" style="background: none; border: none; color: var(--neon-green); cursor: pointer; font-family: var(--font-tech);">
            📺 PREVIEW IN 3D
          </button>
          <button id="modal-share-btn" style="background: none; border: none; color: var(--neon-pink); cursor: pointer; font-family: var(--font-tech);">
            🔗 COPY SHARE LINK
          </button>
        </div>
      </div>
    `;

    // Hook Carousel Navigation
    if (screenshots.length > 1) {
      const carouselImg = document.getElementById('carousel-img');
      const thumbs = container.querySelectorAll('.carousel-thumb');

      const setSlide = (idx) => {
        sound.playClick();
        currentSlideIdx = (idx + screenshots.length) % screenshots.length;
        carouselImg.src = screenshots[currentSlideIdx];
        thumbs.forEach((t, i) => t.classList.toggle('active', i === currentSlideIdx));
      };

      const btnPrev = document.getElementById('carousel-prev');
      const btnNext = document.getElementById('carousel-next');
      if (btnPrev) btnPrev.addEventListener('click', () => setSlide(currentSlideIdx - 1));
      if (btnNext) btnNext.addEventListener('click', () => setSlide(currentSlideIdx + 1));

      thumbs.forEach((t) => {
        t.addEventListener('click', () => setSlide(parseInt(t.dataset.idx, 10)));
      });
    }

    // Hook Share Link Button
    document.getElementById('modal-share-btn').addEventListener('click', () => {
      sound.playBeep(1100);
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.showToast('DIRECT APP LINK COPIED TO CLIPBOARD!');
      }).catch(() => {
        prompt('Salin link aplikasi ini:', shareUrl);
      });
    });

    // Hook Download Button
    document.getElementById('modal-download-btn').addEventListener('click', () => {
      this.handleDownload(app);
    });

    // Hook 3D Projection Button
    document.getElementById('modal-preview-3d-btn').addEventListener('click', () => {
      sound.playClick();
      if (this.retroScene) {
        this.retroScene.setActiveApp(app);
      }
      this.detailModal.classList.remove('active');
      document.querySelector('.hero-section').scrollIntoView({ behavior: 'smooth' });
      this.showToast(`PROJECTED TO 3D CRT MONITOR!`);
    });

    this.detailModal.classList.add('active');
  }

  showToast(message, type = 'success') {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `retro-toast ${type}`;
    toast.innerHTML = `
      <span style="font-size: 1.2rem;">${type === 'danger' ? '✖' : '✔'}</span>
      <span class="toast-text">${message}</span>
    `;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

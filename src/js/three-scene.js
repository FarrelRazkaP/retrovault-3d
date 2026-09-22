/**
 * RetroVault - Interactive 3D Retro Terminal & CRT Workstation
 * Built with Three.js. Features procedural 3D retro computer, dynamic CRT canvas texture,
 * interactive floppy drive, glowing synthwave grid, and particle dust.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { sound } from './sound-fx.js';

export class RetroScene {
  constructor(containerId, onMonitorClick) {
    this.container = document.getElementById(containerId);
    this.onMonitorClick = onMonitorClick;
    this.activeApp = null;
    this.mouse = new THREE.Vector2();
    this.targetRotation = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.clickableObjects = [];
    this.isHoveringClickable = false;

    // Canvas texture for the CRT screen
    this.screenCanvas = document.createElement('canvas');
    this.screenCanvas.width = 512;
    this.screenCanvas.height = 384;
    this.screenCtx = this.screenCanvas.getContext('2d');
    this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTexture.minFilter = THREE.LinearFilter;
    this.screenTexture.magFilter = THREE.NearestFilter;

    // Visualizer animation state for CRT screen
    this.animTime = 0;
    this.flashAlpha = 0;
    this.floppyEjected = false;

    this.init();
  }

  init() {
    if (!this.container) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090818);
    this.scene.fog = new THREE.FogExp2(0x090818, 0.038);

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    this.defaultCameraPos = new THREE.Vector3(0, 1.8, 4.4);
    this.camera.position.copy(this.defaultCameraPos);

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 3. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't clip through floor
    this.controls.minPolarAngle = Math.PI / 6;
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 7.0;
    this.controls.target.set(0, 0.9, 0);

    // 4. Lighting
    this.setupLighting();

    // 5. Environment (Synthwave Neon Grid & Cyber Dust)
    this.setupEnvironment();

    // 6. Procedural Retro Computer Assembly
    this.setupRetroComputer();

    // 7. Event Listeners
    this.setupEvents();

    // Render initial CRT screen
    this.drawScreenContent();

    // 8. Start Animation Loop
    this.clock = new THREE.Clock();
    this.animate();
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x2d1f4e, 1.8);
    this.scene.add(ambientLight);

    // Key Directional Light
    const dirLight = new THREE.DirectionalLight(0xfff5ea, 2.2);
    dirLight.position.set(3, 6, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 15;
    this.scene.add(dirLight);

    // Neon Pink Accent Light (Right)
    const pinkLight = new THREE.PointLight(0xff2a85, 3.5, 6);
    pinkLight.position.set(2.8, 1.5, 1.2);
    this.scene.add(pinkLight);

    // Neon Cyan Accent Light (Left)
    const cyanLight = new THREE.PointLight(0x00f0ff, 3.5, 6);
    cyanLight.position.set(-2.8, 1.5, 1.2);
    this.scene.add(cyanLight);

    // Phosphor Green screen glow casting forward
    this.screenGlowLight = new THREE.PointLight(0x00ff88, 1.2, 3);
    this.screenGlowLight.position.set(0, 1.2, 0.8);
    this.scene.add(this.screenGlowLight);
  }

  setupEnvironment() {
    // Neon Synthwave Grid Floor
    const gridHelper = new THREE.GridHelper(26, 52, 0xff2a85, 0x1f1b47);
    gridHelper.position.y = -0.01;
    this.scene.add(gridHelper);

    // Floating Cyber Dust Particles
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x00f0ff);
    const color2 = new THREE.Color(0xff2a85);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = Math.random() * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      const mixedColor = color1.clone().lerp(color2, Math.random());
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(particleGeo, particleMat);
    this.scene.add(this.particles);

    // Distant Neon Horizon Ring / Sun
    const sunGeo = new THREE.RingGeometry(5.2, 5.4, 64);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xff2a85,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(0, 3.5, -9);
    this.scene.add(sunMesh);
  }

  setupRetroComputer() {
    this.computerGroup = new THREE.Group();

    // Materials
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0xd6cebd, // Classic 80s/90s retro ivory beige
      roughness: 0.55,
      metalness: 0.1
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x322e3f,
      roughness: 0.7,
      metalness: 0.2
    });

    // 1. Desk Pad
    const deskGeo = new THREE.BoxGeometry(3.6, 0.08, 2.2);
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x121024, roughness: 0.9 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, 0.04, 0.2);
    desk.receiveShadow = true;
    this.computerGroup.add(desk);

    // 2. PC Base Tower / Desktop Unit
    const baseGeo = new THREE.BoxGeometry(1.9, 0.38, 1.6);
    const baseUnit = new THREE.Mesh(baseGeo, chassisMat);
    baseUnit.position.set(0, 0.27, -0.1);
    baseUnit.castShadow = true;
    baseUnit.receiveShadow = true;
    this.computerGroup.add(baseUnit);

    // Floppy Drive Slot
    const driveGeo = new THREE.BoxGeometry(0.7, 0.06, 0.04);
    const driveSlot = new THREE.Mesh(driveGeo, darkTrimMat);
    driveSlot.position.set(0.4, 0.32, 0.71);
    this.computerGroup.add(driveSlot);

    // Floppy Disk (Interactive Clickable)
    const diskGeo = new THREE.BoxGeometry(0.55, 0.03, 0.4);
    const diskMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.3 });
    this.floppyDisk = new THREE.Mesh(diskGeo, diskMat);
    this.floppyDisk.position.set(0.4, 0.32, 0.76);
    this.floppyDisk.userData = { type: 'floppy' };
    this.clickableObjects.push(this.floppyDisk);
    this.computerGroup.add(this.floppyDisk);

    // Power LED (Glowing green)
    const ledGeo = new THREE.SphereGeometry(0.025, 12, 12);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(-0.7, 0.32, 0.71);
    this.computerGroup.add(led);

    // 3. CRT Monitor Chassis
    const monitorGeo = new THREE.BoxGeometry(1.5, 1.25, 1.2);
    const monitorCase = new THREE.Mesh(monitorGeo, chassisMat);
    monitorCase.position.set(0, 1.15, -0.1);
    monitorCase.castShadow = true;
    monitorCase.receiveShadow = true;
    this.computerGroup.add(monitorCase);

    // Monitor Bezel Frame
    const bezelGeo = new THREE.BoxGeometry(1.36, 1.05, 0.08);
    const bezel = new THREE.Mesh(bezelGeo, darkTrimMat);
    bezel.position.set(0, 1.16, 0.51);
    this.computerGroup.add(bezel);

    // 4. CRT Curved Screen (Interactive Clickable Screen)
    const screenGeo = new THREE.PlaneGeometry(1.18, 0.88);
    this.screenMaterial = new THREE.MeshBasicMaterial({
      map: this.screenTexture,
      toneMapped: false
    });
    this.crtScreen = new THREE.Mesh(screenGeo, this.screenMaterial);
    this.crtScreen.position.set(0, 1.17, 0.56);
    this.crtScreen.userData = { type: 'monitor' };
    this.clickableObjects.push(this.crtScreen);
    this.computerGroup.add(this.crtScreen);

    // 5. Mechanical Keyboard
    const kbGeo = new THREE.BoxGeometry(1.5, 0.08, 0.6);
    const kbBase = new THREE.Mesh(kbGeo, chassisMat);
    kbBase.position.set(0, 0.12, 0.85);
    kbBase.rotation.x = 0.08;
    kbBase.castShadow = true;
    this.computerGroup.add(kbBase);

    // Keyboard Keybed
    const keysGeo = new THREE.BoxGeometry(1.38, 0.04, 0.48);
    const keys = new THREE.Mesh(keysGeo, darkTrimMat);
    keys.position.set(0, 0.16, 0.85);
    keys.rotation.x = 0.08;
    this.computerGroup.add(keys);

    // 6. Retro Mouse
    const mouseGeo = new THREE.BoxGeometry(0.18, 0.08, 0.28);
    const mouse = new THREE.Mesh(mouseGeo, chassisMat);
    mouse.position.set(1.0, 0.12, 0.85);
    mouse.rotation.y = -0.15;
    mouse.castShadow = true;
    this.computerGroup.add(mouse);

    this.scene.add(this.computerGroup);
  }

  setupEvents() {
    window.addEventListener('resize', () => this.onResize());

    // Mouse movement for raycasting & parallax tilt
    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Parallax rotation target
      this.targetRotation.x = this.mouse.y * 0.08;
      this.targetRotation.y = this.mouse.x * 0.12;

      // Raycast hover check
      this.checkRaycastHover();
    });

    // Click handler for 3D objects
    this.container.addEventListener('click', () => {
      this.checkRaycastClick();
    });
  }

  checkRaycastHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.clickableObjects);

    if (intersects.length > 0) {
      if (!this.isHoveringClickable) {
        this.isHoveringClickable = true;
        this.container.style.cursor = 'pointer';
        sound.playClick();
      }
    } else {
      if (this.isHoveringClickable) {
        this.isHoveringClickable = false;
        this.container.style.cursor = 'grab';
      }
    }
  }

  checkRaycastClick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.clickableObjects);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.userData.type === 'monitor') {
        sound.playPowerUp();
        this.flashScreen();
        if (this.onMonitorClick && this.activeApp) {
          this.onMonitorClick(this.activeApp);
        }
      } else if (hit.userData.type === 'floppy') {
        this.toggleFloppy();
      }
    }
  }

  toggleFloppy() {
    sound.playFloppySeek();
    this.floppyEjected = !this.floppyEjected;

    const targetZ = this.floppyEjected ? 0.92 : 0.76;
    let progress = 0;
    const startZ = this.floppyDisk.position.z;

    const slide = () => {
      progress += 0.12;
      this.floppyDisk.position.z = THREE.MathUtils.lerp(startZ, targetZ, progress);
      if (progress < 1) {
        requestAnimationFrame(slide);
      }
    };
    slide();
  }

  flashScreen() {
    this.flashAlpha = 0.9;
  }

  setActiveApp(app) {
    this.activeApp = app;
    sound.playBeep(1150);
    this.flashScreen();
    this.drawScreenContent();
  }

  drawScreenContent() {
    const ctx = this.screenCtx;
    const w = this.screenCanvas.width;
    const h = this.screenCanvas.height;

    // Clear with dark phosphor background
    ctx.fillStyle = '#05140b';
    ctx.fillRect(0, 0, w, h);

    // Subtle CRT scanlines on screen texture
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 2);
    }

    // Border glowing frame
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Header bar
    ctx.fillStyle = 'rgba(0, 255, 102, 0.15)';
    ctx.fillRect(14, 14, w - 28, 38);

    ctx.fillStyle = '#00ff66';
    ctx.font = 'bold 18px Courier, monospace';
    ctx.fillText('RETROVAULT // OS 2.6', 24, 39);

    ctx.fillStyle = '#00f0ff';
    ctx.font = '14px Courier, monospace';
    ctx.fillText('ONLINE [60 FPS]', w - 165, 39);

    // App Information
    const title = this.activeApp ? this.activeApp.title : 'CYBERRUNNER 2084';
    const version = this.activeApp ? this.activeApp.version : 'v1.4.2';
    const category = this.activeApp ? this.activeApp.category : 'GAMES';
    const platform = this.activeApp ? this.activeApp.platform : 'WIN / LINUX / WEB';

    // Main App Title Banner
    ctx.fillStyle = '#ff2a85';
    ctx.font = 'bold 26px Courier, monospace';
    ctx.fillText('► ' + title.toUpperCase(), 28, 95);

    ctx.fillStyle = '#00f0ff';
    ctx.font = '16px Courier, monospace';
    ctx.fillText(`BUILD: ${version}  |  CAT: [${category.toUpperCase()}]`, 28, 126);

    ctx.fillStyle = '#ffb800';
    ctx.font = '14px Courier, monospace';
    ctx.fillText(`TARGET: ${platform}`, 28, 150);

    // Animated Oscilloscope / Pixel Waveform in Center
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const waveY = 225;
    for (let x = 28; x < w - 28; x += 6) {
      const offset = Math.sin((x * 0.04) + this.animTime * 6) * 28 * Math.cos(x * 0.015);
      if (x === 28) ctx.moveTo(x, waveY + offset);
      else ctx.lineTo(x, waveY + offset);
    }
    ctx.stroke();

    // Equalizer bars
    const barWidth = 14;
    const barSpacing = 8;
    const startX = 32;
    const numBars = 16;
    for (let i = 0; i < numBars; i++) {
      const barH = 15 + Math.sin(this.animTime * 5 + i * 0.8) * 20 + 20;
      ctx.fillStyle = i % 2 === 0 ? '#00f0ff' : '#ff2a85';
      ctx.fillRect(startX + i * (barWidth + barSpacing), 280 - barH, barWidth, barH);
    }

    // Bottom Action Prompt
    ctx.fillStyle = '#00ff66';
    ctx.font = 'bold 15px Courier, monospace';
    ctx.fillText('► CLICK SCREEN TO INSPECT APP / DOWNLOAD', 28, 325);

    ctx.fillStyle = 'rgba(0, 255, 102, 0.6)';
    ctx.font = '12px Courier, monospace';
    ctx.fillText('SYS_MEM: 640K OK  •  DMA CHANNEL 1 ACTIVE', 28, 352);

    // White Flash overlay effect if triggered
    if (this.flashAlpha > 0.01) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, w, h);
      this.flashAlpha *= 0.82;
    }

    this.screenTexture.needsUpdate = true;
  }

  resetCamera() {
    sound.playBeep(800);
    let t = 0;
    const startPos = this.camera.position.clone();
    const animateReset = () => {
      t += 0.08;
      this.camera.position.lerpVectors(startPos, this.defaultCameraPos, t);
      this.controls.target.set(0, 0.9, 0);
      if (t < 1) {
        requestAnimationFrame(animateReset);
      }
    };
    animateReset();
  }

  onResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    this.animTime += delta;

    // Floating particles subtle drift
    if (this.particles) {
      this.particles.rotation.y += delta * 0.03;
    }

    // Parallax tilt interpolation for computer group
    if (this.computerGroup) {
      this.computerGroup.rotation.x = THREE.MathUtils.lerp(this.computerGroup.rotation.x, this.targetRotation.x, 0.06);
      this.computerGroup.rotation.y = THREE.MathUtils.lerp(this.computerGroup.rotation.y, this.targetRotation.y, 0.06);
    }

    // Update screen canvas visualizer periodically
    this.drawScreenContent();

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

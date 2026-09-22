/**
 * RetroVault - 8-Bit Web Audio API Sound Generator
 * Generates authentic retro sound effects procedurally without external audio assets.
 */

class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initAudioContext();
  }

  initAudioContext() {
    // Lazy initialize on first user interaction to satisfy browser autoplay policies
    const unlockAudio = () => {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      } else if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (!this.muted) {
      this.playBeep();
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  // 1. Classic button click / key clack
  playClick() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      console.warn('Audio FX error:', e);
    }
  }

  // 2. High pitch 8-bit blip / toggle
  playBeep(freq = 980) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn('Audio FX error:', e);
    }
  }

  // 3. Floppy drive / Disk read sound
  playFloppySeek() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const stepTime = now + (i * 0.05);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140 + (i * 40), stepTime);

        gain.gain.setValueAtTime(0.12, stepTime);
        gain.gain.exponentialRampToValueAtTime(0.01, stepTime + 0.03);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(stepTime);
        osc.stop(stepTime + 0.03);
      }
    } catch (e) {
      console.warn('Audio FX error:', e);
    }
  }

  // 4. Power up / 3D Boot Arpeggio
  playPowerUp() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C E G C E G
      
      notes.forEach((freq, idx) => {
        const noteTime = now + (idx * 0.05);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.08, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.12);
      });
    } catch (e) {
      console.warn('Audio FX error:', e);
    }
  }

  // 5. Download complete 8-bit coin fanfare
  playDownload() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.1); // E6

      osc2.frequency.setValueAtTime(493.88, now);
      osc2.frequency.setValueAtTime(659.25, now + 0.1);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio FX error:', e);
    }
  }

  // 6. CRT degauss buzz
  playDegauss() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Audio FX error:', e);
    }
  }

  // 7. Security alert / Access Denied buzzer
  playSecurityAlarm() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 2; i++) {
        const stepTime = now + (i * 0.15);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, stepTime);
        osc.frequency.setValueAtTime(110, stepTime + 0.06);

        gain.gain.setValueAtTime(0.2, stepTime);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(stepTime);
        osc.stop(stepTime + 0.12);
      }
    } catch (e) {
      console.warn('Audio FX error:', e);
    }
  }
}

export const sound = new SoundFX();

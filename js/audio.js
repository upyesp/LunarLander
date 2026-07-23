/* ============================================================
   Lunar Lander - tiny WebAudio synth for SFX (no asset files)
   ============================================================ */
const Audio = {
  ctx: null,
  thrustGain: null,
  ready: false,
  muted: false,

  // Lazily create the AudioContext (must follow a user gesture)
  init() {
    if (this.ready) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();

      // looping white-noise source -> lowpass -> gain -> output (thrust rumble)
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf; src.loop = true;

      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 420;

      this.thrustGain = this.ctx.createGain();
      this.thrustGain.gain.value = 0;

      src.connect(lp); lp.connect(this.thrustGain); this.thrustGain.connect(this.ctx.destination);
      src.start();
      this.ready = true;
    } catch (e) {
      console.warn('Audio init failed:', e);
    }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  setMuted(m) {
    this.muted = m;
    if (m) this.setThrust(false);
  },

  setThrust(on) {
    if (!this.ready || this.muted) return;
    this.thrustGain.gain.setTargetAtTime(on ? 0.16 : 0, this.ctx.currentTime, 0.05);
  },

  beep(freq, dur, type) {
    if (!this.ready || this.muted) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.value = 0.0001;
    o.connect(g); g.connect(this.ctx.destination);
    const n = this.ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.2, n + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
    o.start(n); o.stop(n + dur + 0.02);
  },

  click() { this.beep(440, 0.05); },

  success() {
    this.beep(660, 0.12);
    setTimeout(() => this.beep(880, 0.14), 130);
    setTimeout(() => this.beep(1320, 0.22), 290);
  },

  crash() {
    if (!this.ready || this.muted) return;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.4, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    const g = this.ctx.createGain(); g.gain.value = 0.5;
    src.connect(lp); lp.connect(g); g.connect(this.ctx.destination);
    src.start();
  }
};

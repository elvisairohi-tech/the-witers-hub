/**
 * Procedural Web Audio Synthesis Engine for The Writer's Opus
 * Zero external audio files; 100% synthesized realistic soundscapes:
 * - Mechanical typewriter key clicks with subtle pitch/timbre variations
 * - Authentic carriage return brass bell (*ding!*)
 * - Atmospheric rain on window glass
 * - Cozy fireplace hearth crackle
 * - Deep harmonic epiphany chime
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private rainNode: AudioNode | null = null;
  private fireNode: AudioNode | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private isRainPlaying: boolean = true;
  private isFirePlaying: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.startAmbientRain();
      this.startFireplaceCrackle();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Procedural Typewriter Keystroke
   * Produces a distinct mechanical thud, metallic spring click, and subtle resonant body decay.
   */
  public playKeyClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const now = t;

    // 1. Initial mechanical impact (short noise impulse)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.035);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400 + Math.random() * 400, now);
    filter.Q.setValueAtTime(2.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45 + Math.random() * 0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);

    // 2. Metallic typebar strike resonance (sine pulse)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    const strikeFreq = 380 + Math.random() * 120;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(strikeFreq, now);
    osc.frequency.exponentialRampToValueAtTime(strikeFreq * 0.5, now + 0.04);

    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);

    // 3. Desk wood body thud (low sub impulse)
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(90 + Math.random() * 20, now);
    thud.frequency.exponentialRampToValueAtTime(40, now + 0.06);

    thudGain.gain.setValueAtTime(0.25, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    thud.connect(thudGain);
    thudGain.connect(this.masterGain);
    thud.start(now);
    thud.stop(now + 0.065);
  }

  /**
   * Carriage Return Bell (The famous antique typewriter "Ding!")
   */
  public playCarriageBell() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // Harmonic bell frequencies
    const fundamental = 2640; // High brass bell
    const harmonics = [fundamental, fundamental * 1.58, fundamental * 2.25];
    const decays = [1.2, 0.8, 0.5];

    harmonics.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.35 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[idx]);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + decays[idx] + 0.05);
    });
  }

  /**
   * Epiphany / Inspiration Harmonic Chime (Ethereal piano/celesta resonance)
   */
  public playEpiphanyChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    // Major 9th literary chord (D4, F#4, A4, C#5, E5)
    const freqs = [293.66, 369.99, 440.0, 554.37, 659.25];

    freqs.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.2, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 2.0);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 2.1);
    });
  }

  /**
   * Procedural Rain Generator (filtered pink noise with random droplet impulses)
   */
  private startAmbientRain() {
    if (!this.ctx || !this.ambientGain) return;
    try {
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
        b6 = white * 0.115926;
      }

      const rainSource = this.ctx.createBufferSource();
      rainSource.buffer = noiseBuffer;
      rainSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, this.ctx.currentTime);

      const rainGain = this.ctx.createGain();
      rainGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      rainSource.connect(filter);
      filter.connect(rainGain);
      rainGain.connect(this.ambientGain);

      rainSource.start();
      this.rainNode = rainSource;
    } catch {
      // Audio fallback silent
    }
  }

  /**
   * Cozy Fireplace Hearth Crackle (sparse low-freq pops)
   */
  private startFireplaceCrackle() {
    if (!this.ctx || !this.ambientGain) return;
    try {
      // Periodic crackle scheduler
      const schedulePop = () => {
        if (!this.ctx || !this.ambientGain || !this.isFirePlaying || this.isMuted) {
          setTimeout(schedulePop, 300);
          return;
        }

        const now = this.ctx.currentTime;
        const popOsc = this.ctx.createOscillator();
        const popGain = this.ctx.createGain();

        popOsc.type = 'square';
        popOsc.frequency.setValueAtTime(80 + Math.random() * 260, now);

        const dur = 0.015 + Math.random() * 0.02;
        popGain.gain.setValueAtTime(0.04 + Math.random() * 0.05, now);
        popGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        popOsc.connect(popGain);
        popGain.connect(this.ambientGain);
        popOsc.start(now);
        popOsc.stop(now + dur + 0.01);

        setTimeout(schedulePop, 120 + Math.random() * 450);
      };

      setTimeout(schedulePop, 600);
    } catch {
      // fallback
    }
  }

  /**
   * High-speed synthesis tick for the 2-Billion Codex code generation build-up
   */
  public playCodexRampTick(progress: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pitch rises from 440Hz to 1760Hz as generation builds up to 2,000,000,000
    const freq = 380 + progress * 1200 + Math.random() * 80;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.025);

    gain.gain.setValueAtTime(0.08 + progress * 0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  /**
   * Triumphant Celestial Apex Chord when reaching 2,000,000,000 codes
   */
  public playCodexApexCompletion() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    // Golden C-major 9th arpeggiated chord
    const freqs = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51];

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.25, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 2.8);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 3.0);
    });
  }
}

export const soundEngine = new SoundEngine();

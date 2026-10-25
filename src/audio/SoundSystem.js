/**
 * SoundSystem.js
 * Ultra-realistic procedural audio engine for the 3D Metal Ball Maze.
 * Uses Web Audio API to synthesize authentic physical metal collisions,
 * dynamic rolling rumble, spark crackle, industrial facility ambiance, and UI audio.
 */

export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.reverbNode = null;
    this.dryGain = null;
    this.wetGain = null;

    // Rolling sound state
    this.rollingSource = null;
    this.rollingGain = null;
    this.rollingFilter = null;
    this.rollingResonance = null;
    this.rollingResonanceGain = null;
    this.isRollingPlaying = false;
    this.targetRollVolume = 0;
    this.currentRollVolume = 0;

    // Ambient sound state
    this.ambientNodes = [];
    this.isAmbientPlaying = false;

    // Last impact timestamp to prevent sound clustering
    this.lastImpactTime = 0;
  }

  /**
   * Initializes AudioContext upon user gesture (click / keypress)
   */
  async init() {
    if (this.ctx && this.ctx.state !== 'suspended') return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!this.ctx) {
      this.ctx = new AudioContextClass();
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this._setupMasterBus();
    this._setupRollingSound();
    this._setupAmbientDrone();
  }

  _setupMasterBus() {
    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    // Convolver reverb for industrial acoustic space
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this._generateIndustrialReverbBuffer(1.8, 2.2);

    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 0.85;

    this.wetGain = this.ctx.createGain();
    this.wetGain.gain.value = 0.35;

    // Bus routing: dry -> master; wet (reverb) -> master -> destination
    this.dryGain.connect(this.masterGain);
    this.reverbNode.connect(this.wetGain);
    this.wetGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  /**
   * Generates a procedural impulse response buffer mimicking a cavernous concrete/metal hall
   */
  _generateIndustrialReverbBuffer(duration, decay) {
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / length;
      // Exponential decay with industrial flutter echoes
      const env = Math.pow(1 - t, decay);
      const flutter = 1.0 + 0.15 * Math.sin(t * 120.0);
      left[i] = (Math.random() * 2 - 1) * env * flutter;
      right[i] = (Math.random() * 2 - 1) * env * flutter;
    }
    return impulse;
  }

  /**
   * Continuous procedural rolling audio setup
   */
  _setupRollingSound() {
    if (this.isRollingPlaying) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Generate brown/pink texture noise for heavy ball rolling
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.04 * white)) / 1.04;
      lastOut = output[i];
      output[i] *= 3.5; // Gain compensation
    }

    this.rollingSource = this.ctx.createBufferSource();
    this.rollingSource.buffer = noiseBuffer;
    this.rollingSource.loop = true;

    // Lowpass filter responsive to speed
    this.rollingFilter = this.ctx.createBiquadFilter();
    this.rollingFilter.type = 'lowpass';
    this.rollingFilter.frequency.value = 180;
    this.rollingFilter.Q.value = 2.0;

    // Metallic rumble resonance
    this.rollingResonance = this.ctx.createBiquadFilter();
    this.rollingResonance.type = 'peaking';
    this.rollingResonance.frequency.value = 420;
    this.rollingResonance.gain.value = 6;
    this.rollingResonance.Q.value = 4;

    this.rollingGain = this.ctx.createGain();
    this.rollingGain.gain.value = 0;

    this.rollingSource.connect(this.rollingFilter);
    this.rollingFilter.connect(this.rollingResonance);
    this.rollingResonance.connect(this.rollingGain);
    this.rollingGain.connect(this.dryGain);
    this.rollingGain.connect(this.reverbNode);

    this.rollingSource.start(0);
    this.isRollingPlaying = true;
  }

  /**
   * Updates rolling sound volume and pitch based on current rolling velocity
   */
  updateRollingSound(speed, isGrounded = true) {
    if (!this.ctx || !this.rollingGain || this.isMuted) return;

    // If airborne, quickly diminish rolling rumble
    const effectiveSpeed = isGrounded ? speed : speed * 0.15;
    const normalizedSpeed = Math.min(Math.max(effectiveSpeed / 15.0, 0), 1.0);

    // Volume curve: smooth threshold so idle ball is dead silent
    if (normalizedSpeed < 0.02) {
      this.targetRollVolume = 0;
    } else {
      // Dynamic volume curve
      this.targetRollVolume = Math.pow(normalizedSpeed, 1.2) * 0.75;
    }

    // Smooth volume interpolation
    this.currentRollVolume += (this.targetRollVolume - this.currentRollVolume) * 0.12;
    this.rollingGain.gain.setValueAtTime(this.currentRollVolume, this.ctx.currentTime);

    // Dynamic frequency modulation: higher pitch and brighter timbre as speed increases
    const cutoffFreq = 160 + normalizedSpeed * 1200;
    const resonanceFreq = 380 + normalizedSpeed * 650;
    this.rollingFilter.frequency.setValueAtTime(cutoffFreq, this.ctx.currentTime);
    this.rollingResonance.frequency.setValueAtTime(resonanceFreq, this.ctx.currentTime);
  }

  /**
   * Industrial background drone & airflow
   */
  _setupAmbientDrone() {
    if (this.isAmbientPlaying) return;

    // Low sub drone (55Hz)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 55;

    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.value = 110;

    const gain1 = this.ctx.createGain();
    gain1.gain.value = 0.12;

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(this.dryGain);
    gain1.connect(this.reverbNode);

    // Air draft noise
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.08;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 320;
    bandpass.Q.value = 1.2;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0.15;

    noiseSource.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(this.dryGain);
    noiseGain.connect(this.reverbNode);

    osc1.start(0);
    noiseSource.start(0);

    this.ambientNodes.push(osc1, noiseSource);
    this.isAmbientPlaying = true;
  }

  /**
   * Synthesize ultra-realistic physical metallic collision
   * @param {number} impactVelocity - Magnitude of collision speed (m/s)
   * @param {string} surfaceType - 'metal' | 'concrete' | 'floor'
   */
  playCollisionSound(impactVelocity, surfaceType = 'metal') {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    if (now - this.lastImpactTime < 0.04) return; // Prevent audio burst tearing
    this.lastImpactTime = now;

    // Velocity tiers:
    // Low: 1.5 - 4.0 m/s  -> light metallic tap/clink
    // Medium: 4.0 - 9.0 m/s -> solid metallic thud + ring
    // High: > 9.0 m/s      -> heavy steel impact + prolonged metallic ring
    const normalizedImpact = Math.min(Math.max((impactVelocity - 1.2) / 16.0, 0.05), 1.0);
    const isHardImpact = normalizedImpact > 0.45;
    const isMediumImpact = normalizedImpact > 0.2;

    const collisionGain = this.ctx.createGain();
    collisionGain.gain.setValueAtTime(normalizedImpact * 0.9, now);
    collisionGain.connect(this.dryGain);
    collisionGain.connect(this.reverbNode);

    // 1. Sharp Transient Impulse (physical surface click)
    const clickDuration = 0.008;
    const clickBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * clickDuration), this.ctx.sampleRate);
    const clickData = clickBuffer.getChannelData(0);
    for (let i = 0; i < clickData.length; i++) {
      clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (clickData.length * 0.25));
    }
    const clickSource = this.ctx.createBufferSource();
    clickSource.buffer = clickBuffer;

    const clickFilter = this.ctx.createBiquadFilter();
    clickFilter.type = 'highpass';
    clickFilter.frequency.value = surfaceType === 'metal' ? 2400 : 1200;

    const clickGain = this.ctx.createGain();
    clickGain.gain.setValueAtTime(isHardImpact ? 1.0 : 0.6, now);

    clickSource.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(collisionGain);
    clickSource.start(now);

    // 2. Heavy Steel Body Thud (low-frequency inertia punch)
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thudOsc.type = 'triangle';
    const baseThudFreq = 120 + Math.random() * 30;
    thudOsc.frequency.setValueAtTime(baseThudFreq, now);
    thudOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    thudGain.gain.setValueAtTime(normalizedImpact * 0.8, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    thudOsc.connect(thudGain);
    thudGain.connect(collisionGain);
    thudOsc.start(now);
    thudOsc.stop(now + 0.15);

    // 3. Metallic Resonant Modal Frequencies (Steel Sphere Eigenmodes)
    // Physical steel sphere modal frequencies roughly follow Bessel function ratios:
    // f1 (fundamental), f2 = ~1.73*f1, f3 = ~2.62*f1, f4 = ~3.84*f1, f5 = ~5.1*f1
    const baseFreq = 540 + (Math.random() - 0.5) * 40; // ~540Hz
    const modeRatios = [1.0, 1.73, 2.61, 3.82, 5.14];
    const ringDuration = isHardImpact ? 0.75 : isMediumImpact ? 0.35 : 0.15;

    modeRatios.forEach((ratio, idx) => {
      const modeOsc = this.ctx.createOscillator();
      const modeGain = this.ctx.createGain();

      modeOsc.type = 'sine';
      // Slight randomized detune for realism
      const freq = baseFreq * ratio * (1.0 + (Math.random() - 0.5) * 0.02);
      modeOsc.frequency.setValueAtTime(freq, now);

      // Higher modes decay faster
      const modeDecay = ringDuration / (1.0 + idx * 0.55);
      const amp = (1.0 / (idx + 1)) * (isHardImpact ? 0.45 : 0.25);

      modeGain.gain.setValueAtTime(amp, now);
      modeGain.gain.exponentialRampToValueAtTime(0.0001, now + modeDecay);

      modeOsc.connect(modeGain);
      modeGain.connect(collisionGain);

      modeOsc.start(now);
      modeOsc.stop(now + modeDecay + 0.05);
    });
  }

  /**
   * Sound effect for high-friction grinding / spark shower
   */
  playSparkSizzle(duration = 0.2, intensity = 0.5) {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4500 + Math.random() * 1500;
    filter.Q.value = 4.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(intensity * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.dryGain);

    source.start(now);
  }

  /**
   * Victory Fanfare when entering the finish goal beacon
   */
  playVictorySound() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const chords = [
      [523.25, 659.25, 783.99],       // C Major
      [659.25, 783.99, 987.77],       // E Minor
      [783.99, 987.77, 1174.66],      // G Major
      [1046.50, 1318.51, 1567.98]     // High C Major Chime
    ];

    chords.forEach((chord, chordIdx) => {
      const chordTime = now + chordIdx * 0.28;
      chord.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, chordTime);

        gain.gain.setValueAtTime(0.001, chordTime);
        gain.gain.linearRampToValueAtTime(0.2, chordTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, chordTime + 1.8);

        osc.connect(gain);
        gain.connect(this.dryGain);
        gain.connect(this.reverbNode);

        osc.start(chordTime);
        osc.stop(chordTime + 2.0);
      });
    });
  }

  /**
   * UI Click feedback
   */
  playUIClick() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.dryGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

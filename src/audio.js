/**
 * Minimal Web Audio API Procedural Sound Synthesizer
 * Generates all SFX in code (zero external audio files, zero latency, ~2KB payload).
 * Fully compatible with iOS Safari / Chrome on iOS 14+.
 */

let audioCtx = null;
let isMuted = false;
let lastPingTime = 0;

// Feature #6: Carrying Hum nodes
let carryOsc = null;
let carryGain = null;

// Feature #5: Ambient Drone nodes
let ambientNodes = [];

export function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function toggleMute() {
  isMuted = !isMuted;
  return isMuted;
}

export function getMuteState() {
  return isMuted;
}

/**
 * 1. Radar Sonar Blip (Scanning proximity)
 * @param {number} distance - Distance in meters (typically 0.5 to 3.0)
 */
export function playRadarPing(distance) {
  if (isMuted || !audioCtx) return;
  const now = audioCtx.currentTime;
  
  // Rate limits pings based on distance: closer = faster repetition
  const interval = Math.max(0.18, Math.min(1.2, distance * 0.35));
  if (now - lastPingTime < interval) return;
  lastPingTime = now;

  // Closer = higher pitched ping (500Hz to 950Hz)
  const freq = Math.max(500, Math.min(950, 1000 - distance * 150));

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.08);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}

/**
 * 2. Lock-On Discovery Chime (Coaster verified)
 * Sparkling two-tone chord
 */
export function playLockOn() {
  if (isMuted || !audioCtx) return;
  const now = audioCtx.currentTime;

  [587.33, 880.0].forEach((freq, i) => { // D5, A5
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + i * 0.07);

    gain.gain.setValueAtTime(0.12, now + i * 0.07);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.25);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now + i * 0.07);
    osc.stop(now + i * 0.07 + 0.26);
  });
}

/**
 * 3. Pick Up Harmonic Rise (Ring lifts to camera)
 * Upward sweep
 */
export function playPickUp() {
  if (isMuted || !audioCtx) return;
  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(740, now + 0.22);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.linearRampToValueAtTime(0.1, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.25);
}

/**
 * 4. Drop & Hologram Materialize (Pillar beam up)
 * Low warm bass hum followed by crystal chime
 */
export function playDropBeam() {
  if (isMuted || !audioCtx) return;
  const now = audioCtx.currentTime;

  // Sub hum
  const subOsc = audioCtx.createOscillator();
  const subGain = audioCtx.createGain();
  subOsc.type = 'triangle';
  subOsc.frequency.setValueAtTime(110, now);
  subOsc.frequency.exponentialRampToValueAtTime(160, now + 0.4);
  subGain.gain.setValueAtTime(0.2, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  subOsc.connect(subGain);
  subGain.connect(audioCtx.destination);
  subOsc.start(now);
  subOsc.stop(now + 0.46);

  // Crystal shimmer tones
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => { // C-E-G-C arpeggio
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const startTime = now + 0.1 + idx * 0.06;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.09, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.36);
  });
}

/**
 * 5. Drawer UI Soft Click
 */
export function playDrawerTick() {
  if (isMuted || !audioCtx) return;
  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, now);
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.04);
}

/**
 * 6. Birthday Celebration Fanfare
 * Warm, uplifting chord
 */
export function playCelebrationFanfare() {
  if (isMuted || !audioCtx) return;
  const now = audioCtx.currentTime;

  const chord = [392.00, 493.88, 587.33, 783.99, 987.77]; // G major 9
  chord.forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const startTime = now + idx * 0.08;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.12, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.85);
  });
}

/* --------------------------------------------------------------------------
   Feature #6: Carrying Hum — 220Hz triangle oscillator while holding hologram
   -------------------------------------------------------------------------- */
export function startCarryingHum() {
  if (isMuted || !audioCtx || carryOsc) return;
  carryOsc = audioCtx.createOscillator();
  carryGain = audioCtx.createGain();

  carryOsc.type = 'triangle';
  carryOsc.frequency.setValueAtTime(220, audioCtx.currentTime);
  carryGain.gain.setValueAtTime(0, audioCtx.currentTime);
  carryGain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.3);

  carryOsc.connect(carryGain);
  carryGain.connect(audioCtx.destination);
  carryOsc.start();
}

export function stopCarryingHum() {
  if (!carryOsc || !audioCtx) return;
  const now = audioCtx.currentTime;
  carryGain.gain.linearRampToValueAtTime(0, now + 0.2);
  carryOsc.stop(now + 0.25);
  carryOsc = null;
  carryGain = null;
}

/* --------------------------------------------------------------------------
   Feature #5: Ambient Room Awakening Drone — layered sawtooth pads
   -------------------------------------------------------------------------- */
export function startAmbientDrone(layerCount) {
  if (isMuted || !audioCtx) return;
  const baseFreq = 80;
  const freq = baseFreq * layerCount;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.025, audioCtx.currentTime + 2.0);

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(200, audioCtx.currentTime);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();

  ambientNodes.push({ osc, gain, filter });
}

export function stopAllAmbient() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  ambientNodes.forEach(({ osc, gain }) => {
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    osc.stop(now + 0.6);
  });
  ambientNodes = [];
}

/**
 * AR Scavenger Hunt — Main Game Controller
 * Orchestrates MindAR, iOS WebKit permissions, 3D parenting,
 * Proximity Radar, Audio SFX, and the Menu Panel.
 *
 * Phase 2: Floor Reticle (#2), Carrying Hum (#6), Ambient Drone (#5), LERP (#1).
 * Phase 3: Chroma Key Hologram — shader applied to Target 1 via chromakey.js.
 * Phase 4: Living Photo Frames — Targets 2–4, isEasterEgg: true, zero coaster UI.
 *
 * 5-TARGET ROSTER (v2 — calibrated 2026-10-02):
 *   Index 0 — COASTER: Birthday Wishes   → dummy.mp4 (swap → montage.mp4 on release)
 *   Index 1 — COASTER: Uncle Memorial    → memorial.mp4  [Chroma Key]
 *   Index 2 — EASTER EGG FRAME #1        → frame1_live.mp4
 *   Index 3 — EASTER EGG FRAME #2        → frame2_live.mp4
 *   Index 4 — EASTER EGG FRAME #3        → frame3_live.mp4
 */

// Phase 3: chromakey.js must register AFRAME.registerShader('chromakey') before
// any A-Frame component tries to use material="shader: chromakey".
import './style.css';
import './chromakey.js';

import {
  initAudio,
  playLockOn,
  playPickUp,
  playDropBeam,
  playDrawerTick,
  playCelebrationFanfare,
  toggleMute,
  startCarryingHum,
  stopCarryingHum,
  startAmbientDrone,
  stopAllAmbient
} from './audio.js';
import { initRadar, setRadarActive, setActiveTarget, triggerLockOnEffect } from './radar.js';
import { animateMaterialization } from './animations.js';

// ─── Application State Machine ────────────────────────────────────────────────
const STATE = {
  UNINITIALIZED: 'UNINITIALIZED',
  SCANNING:      'SCANNING',
  TARGET_FOUND:  'TARGET_FOUND',
  CARRYING:      'CARRYING',
  PLACED:        'PLACED'
};

let currentState         = STATE.UNINITIALIZED;
let activeTargetIndex    = null;
let currentCarriedEntity = null;
const placedEntities     = {}; // targetIndex → placed A-Frame entity

// Feature #2: Floor placement reticle
let floorReticle = null;

// ─── TARGETS — Single Source of Truth ────────────────────────────────────────
//
//  isEasterEgg: true  → parallel track; zero coaster UI; excluded from celebration.
//  shader: 'chromakey'→ custom GLSL material registered by chromakey.js.
//  aspectRatio        → { w, h } for frame <a-video>. null = use defaults below.
//
//  Frame defaults: portrait 3:4 (standard 4×6 photo frame)
//    width  = FRAME_DEFAULT_W = 1.2
//    height = FRAME_DEFAULT_H = 1.6
//
const FRAME_DEFAULT_W = 1.2;
const FRAME_DEFAULT_H = 1.6;

const TARGETS = [
  // ── COASTERS (Scavenger Hunt) ─────────────────────────────────────────────
  {
    index:       0,
    title:       'Uncle Memorial',
    videoId:     'video-memorial',
    emoji:       '🕊️',
    shader:      'chromakey',   // Green screen chroma key
    isEasterEgg: false,
    discovered:  false,
    placed:      false,
  },
  {
    index:       1,
    title:       'Birthday Wishes',
    videoId:     'video-montage', // dummy.mp4
    emoji:       '🎂',
    shader:      'flat',
    isEasterEgg: false,
    discovered:  false,
    placed:      false,
  },

  // ── LIVING PHOTO FRAMES (Silent Easter Eggs) ──────────────────────────────
  // Target 2: River — 16.5cm length × 11.5cm breadth → aspect ratio 11.5/16.5 = 0.697
  {
    index:       2,
    title:       'Living Frame 1 (River)',
    videoId:     'video-frame1',
    isEasterEgg: true,
    width:       1.0,
    height:      0.697, // 16.5cm × 11.5cm
    rotation:    '0 0 0',
  },
  // Target 3: Wedding — 15.5cm length × 11cm breadth → aspect ratio 11/15.5 = 0.710
  {
    index:       3,
    title:       'Living Frame 2 (Wedding)',
    videoId:     'video-frame2',
    isEasterEgg: true,
    width:       1.0,
    height:      0.710, // 15.5cm × 11cm
    rotation:    '0 0 0',
  },
  // Target 4: A2 Frame — ISO A2 standard (42.0cm × 59.4cm) → 1.414 portrait (or 0.707 landscape)
  {
    index:       4,
    title:       'Living Frame 3 (A2 Frame)',
    videoId:     'video-frame3',
    isEasterEgg: true,
    width:       1.0,
    height:      1.414, // ISO A2 portrait (59.4 / 42.0)
    rotation:    '0 0 0',
  },
];

// Derived subsets — computed once; never hardcode counts anywhere.
// Celebration fires when COASTER_TARGETS.every(t => t.placed) — never when frames trigger.
const COASTER_TARGETS    = TARGETS.filter(t => !t.isEasterEgg); // length: 2
const EASTER_EGG_TARGETS = TARGETS.filter(t =>  t.isEasterEgg); // length: 3

// ─── DOM Elements ─────────────────────────────────────────────────────────────
let sceneEl, cameraEl, worldRootEl;
let mainActionBtn, guidanceBox;
let menuBtn, menuPanel, menuCloseBtn, sfxToggleRow, sfxToggle;
let progressList, emptyProgressMsg, restartSection, restartBtn;
let celebrationOverlay, celebrationRestartBtn;

function initApp() {
  sceneEl      = document.querySelector('#ar-scene');
  cameraEl     = document.querySelector('#main-camera');
  worldRootEl  = document.querySelector('#world-holograms-root');
  const vignetteEl = document.querySelector('#radar-vignette');

  mainActionBtn = document.querySelector('#main-action-btn');
  guidanceBox   = document.querySelector('#guidance-box');

  menuBtn       = document.querySelector('#menu-btn');
  menuPanel     = document.querySelector('#menu-panel');
  menuCloseBtn  = document.querySelector('#menu-close');
  sfxToggleRow  = document.querySelector('#sfx-toggle-row');
  sfxToggle     = document.querySelector('#sfx-toggle');

  progressList     = document.querySelector('#progress-list');
  emptyProgressMsg = document.querySelector('#empty-progress-msg');
  restartSection   = document.querySelector('#restart-section');
  restartBtn       = document.querySelector('#restart-btn');

  celebrationOverlay    = document.querySelector('#celebration-overlay');
  celebrationRestartBtn = document.querySelector('#celebration-restart-btn');

  sceneEl.addEventListener('renderstart', () => {
    if (sceneEl.renderer) sceneEl.renderer.setClearColor(0x000000, 0);
  });

  sceneEl.addEventListener('arReady', () => {
    createFloorReticle();
    enterScanningState();
  });

  // Ensure camera video stream stays styled behind WebGL canvas, and asset videos stay hidden
  const checkVideo = () => {
    document.querySelectorAll('a-assets video').forEach(v => {
      v.style.display = 'none';
    });

    const cameraVideoEl = document.querySelector('video:not([id])');
    if (cameraVideoEl) {
      cameraVideoEl.style.position = 'absolute';
      cameraVideoEl.style.top = '0px';
      cameraVideoEl.style.left = '0px';
      cameraVideoEl.style.width = '100%';
      cameraVideoEl.style.height = '100%';
      cameraVideoEl.style.objectFit = 'cover';
      cameraVideoEl.style.zIndex = '0';
      cameraVideoEl.style.display = 'block';
      cameraVideoEl.style.opacity = '1';
      cameraVideoEl.play().catch(() => {});
    }
  };
  setInterval(checkVideo, 300);

  initRadar(vignetteEl, cameraEl);
  setupUIEventListeners();
  setupMindAREventListeners();

  // Unlock Web Audio API context on first user touch anywhere
  const unlockAudio = () => {
    initAudio();
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  };
  window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
  window.addEventListener('click', unlockAudio, { once: true });

  // Direct camera start: Start in scanning mode with live camera viewfinder
  enterScanningState();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

/* ─── UI Event Handling ────────────────────────────────────────────────────── */
function setupUIEventListeners() {
  mainActionBtn.addEventListener('click', handleMainActionButton);

  menuBtn.addEventListener('click', () => {
    playDrawerTick();
    menuPanel.classList.toggle('open');
  });

  menuCloseBtn.addEventListener('click', () => {
    playDrawerTick();
    menuPanel.classList.remove('open');
  });

  sfxToggleRow.addEventListener('click', () => {
    const muted = toggleMute();
    sfxToggle.classList.toggle('active', !muted);
    sfxToggleRow.querySelector('span').textContent = muted ? '🔇 Sound Effects' : '🔊 Sound Effects';
    if (!muted) playDrawerTick();
  });

  // Coaster Target Order Swap
  const swapBtn = document.querySelector('#swap-targets-btn');
  if (swapBtn) {
    swapBtn.addEventListener('click', () => {
      playDrawerTick();
      const t0 = TARGETS[0];
      const t1 = TARGETS[1];
      const tempVideo = t0.videoId;
      const tempTitle = t0.title;
      const tempEmoji = t0.emoji;
      const tempShader = t0.shader;

      t0.videoId = t1.videoId;
      t0.title = t1.title;
      t0.emoji = t1.emoji;
      t0.shader = t1.shader;

      t1.videoId = tempVideo;
      t1.title = tempTitle;
      t1.emoji = tempEmoji;
      t1.shader = tempShader;

      guidanceBox.textContent = `🔄 Swapped: Coaster 0 is "${t0.title}", Coaster 1 is "${t1.title}"`;
      menuPanel.classList.remove('open');
    });
  }

  restartBtn.addEventListener('click', restartScavengerHunt);
  celebrationRestartBtn.addEventListener('click', restartScavengerHunt);
}

/**
 * Primary Contextual Action Button Handler
 */
async function handleMainActionButton() {
  switch (currentState) {
    case STATE.UNINITIALIZED:
      await startARSession();
      break;
    case STATE.TARGET_FOUND:
      pickUpMemory(activeTargetIndex);
      break;
    case STATE.CARRYING:
      dropMemoryOnFloor();
      break;
    case STATE.PLACED:
      enterScanningState();
      break;
  }
}

/**
 * Step 1: Initialize AR, iOS WebKit Permissions, and Web Audio
 */
async function startARSession() {
  initAudio();
  guidanceBox.textContent = '📹 Starting camera...';

  try {
    const arSystem = sceneEl.systems['mindar-image-system'];
    if (arSystem) {
      arSystem.start();
    }
  } catch (err) {
    console.warn('AR start caught:', err);
  }
  enterScanningState();
}

function enterScanningState() {
  currentState      = STATE.SCANNING;
  activeTargetIndex = null;
  setActiveTarget(null);
  setRadarActive(true);

  guidanceBox.textContent = '🔍 Point camera at a coaster to discover...';
  mainActionBtn.innerHTML = '<span>🔍 Scanning for Coasters...</span>';
  mainActionBtn.classList.add('secondary');
  mainActionBtn.style.display = 'inline-flex';
}

/* ─── MindAR Target Detection Listeners ─────────────────────────────────────── */
function setupMindAREventListeners() {
  TARGETS.forEach(target => {
    const targetEl = document.querySelector(`#target-${target.index}`);
    if (!targetEl) return;

    if (target.isEasterEgg) {
      // Phase 4: Easter Egg parallel track — fully decoupled from coaster state machine
      attachEasterEggListeners(target, targetEl);
    } else {
      // Coaster scavenger hunt track — full state machine + radar + pick/place
      attachCoasterListeners(target, targetEl);
    }
  });
}

/**
 * Phase 4: Easter Egg handler — play/pause only; zero coaster logic runs.
 *
 * Audio guard: if any coaster video is currently playing when the frame is
 * detected, the frame video plays muted. When a coaster video starts playing
 * (in dropMemoryOnFloor), any active frame videos are also muted.
 */
function attachEasterEggListeners(target, targetEl) {
  targetEl.addEventListener('targetFound', () => {
    const vid = document.getElementById(target.videoId);
    if (!vid) return;

    // Audio guard: check if any coaster is playing
    const anyCoasterPlaying = COASTER_TARGETS.some(ct => {
      const v = document.getElementById(ct.videoId);
      return v && !v.paused;
    });
    vid.muted = anyCoasterPlaying;

    // Inject flush planar video overlay on first detection
    if (!targetEl.querySelector('.frame-video-plane')) {
      attachFrameVideoPlane(target, targetEl);
    }

    vid.play().catch(e => console.warn(`Frame ${target.index} play blocked:`, e));
  });

  targetEl.addEventListener('targetLost', () => {
    const vid = document.getElementById(target.videoId);
    if (vid) vid.pause();
  });
}

/**
 * Builds the flush planar video inside a Living Photo Frame target entity.
 * Uses exact frame dimensions and rotation to fit within the physical frame border.
 */
function attachFrameVideoPlane(target, targetEl) {
  const vid = document.getElementById(target.videoId);
  let w = target.width || 1.0;
  let h = target.height || 0.75;
  let rot = target.rotation || '0 0 0';

  // For Target 4 (A2 Frame), check whether video is landscape or portrait
  if (target.index === 4 && vid && vid.videoWidth && vid.videoHeight) {
    h = vid.videoWidth > vid.videoHeight ? 0.707 : 1.414;
  }

  const plane = document.createElement('a-video');
  plane.classList.add('frame-video-plane');
  plane.setAttribute('src', `#${target.videoId}`);
  plane.setAttribute('width',    w);
  plane.setAttribute('height',   h);
  plane.setAttribute('position', '0 0 0.01'); // slight offset prevents z-fighting
  plane.setAttribute('rotation', rot);
  plane.setAttribute('material', 'shader: flat; side: double');
  targetEl.appendChild(plane);
}

/**
 * Coaster listeners — full state machine, radar, pick/place.
 */
function attachCoasterListeners(target, targetEl) {
  targetEl.addEventListener('targetFound', () => {
    // Only block if currently carrying a memory, or if this coaster was already placed
    if (currentState === STATE.CARRYING) return;
    if (target.placed) return;

    activeTargetIndex = target.index;
    setActiveTarget(targetEl);
    triggerLockOnEffect();
    playLockOn();

    attachRingToCoaster(target.index, targetEl);

    currentState = STATE.TARGET_FOUND;
    guidanceBox.textContent = `✨ Discovered: ${target.title}!`;
    mainActionBtn.innerHTML = '<span>⚡ Tap to "Pick Up" Memory</span>';
    mainActionBtn.classList.remove('secondary');
    mainActionBtn.style.display = '';
  });

  targetEl.addEventListener('targetLost', () => {
    if (currentState === STATE.TARGET_FOUND && activeTargetIndex === target.index) {
      const existingRing = targetEl.querySelector('.hologram-container');
      if (existingRing) existingRing.remove();
      enterScanningState();
    }
  });
}

/* ─── 3D Ring & Hologram Construction ─────────────────────────────────────── */
function attachRingToCoaster(targetIndex, targetElement) {
  const old = targetElement.querySelector('.hologram-container');
  if (old) old.remove();
  const container = createHologram3DStructure(targetIndex);
  targetElement.appendChild(container);
}

function createHologram3DStructure(targetIndex) {
  const target    = TARGETS[targetIndex];
  const container = document.createElement('a-entity');
  container.classList.add('hologram-container');
  container.dataset.targetIndex = targetIndex;

  // 1. Glowing AR Ring (Torus)
  const ring = document.createElement('a-torus');
  ring.classList.add('ar-ring-model');
  ring.setAttribute('radius',          '0.45');
  ring.setAttribute('radius-tubular',  '0.025');
  ring.setAttribute('rotation',        '90 0 0');
  ring.setAttribute('material',        'color: #00e5ff; emissive: #00e5ff; emissiveIntensity: 0.8; metalness: 0.2; roughness: 0.3');
  ring.setAttribute('animation__spin', 'property: rotation; to: 90 360 0; loop: true; dur: 6000; easing: linear');
  container.appendChild(ring);

  // 2. Hologram Light Beam
  const beam = document.createElement('a-cylinder');
  beam.classList.add('hologram-beam');
  beam.setAttribute('radius',   '0.44');
  beam.setAttribute('height',   '1.6');
  beam.setAttribute('position', '0 0.8 0');
  beam.setAttribute('material', 'color: #00e5ff; transparent: true; opacity: 0; side: double');
  beam.setAttribute('visible',  'false');
  container.appendChild(beam);

  // 3. Video Plane (Standard a-plane with direct shader binding)
  const videoPlane = document.createElement('a-plane');
  videoPlane.classList.add('video-screen');
  videoPlane.classList.add('interactive');
  videoPlane.setAttribute('width',    '1.6');
  videoPlane.setAttribute('height',   '0.9');
  videoPlane.setAttribute('position', '0 0.9 0');
  videoPlane.setAttribute('visible',  'false');

  if (target.shader === 'chromakey') {
    videoPlane.setAttribute('material',
      `shader: chromakey; src: #${target.videoId}; colorThreshold: 0.4; smoothness: 0.08; rimStrength: 0.35; side: double; transparent: true; depthWrite: false;`
    );
  } else {
    videoPlane.setAttribute('material', `shader: flat; src: #${target.videoId}; side: double; transparent: true; depthWrite: false;`);
  }

  // Tapping video plane in 3D directly plays or unmutes
  videoPlane.addEventListener('click', () => {
    const video = document.getElementById(target.videoId);
    if (!video) return;
    if (video.paused) {
      video.muted = false;
      video.play().catch(e => console.warn('Tap to play:', e));
    } else {
      video.pause();
    }
  });

  container.appendChild(videoPlane);
  return container;
}

/* ─── Feature #2: Floor Placement Reticle ─────────────────────────────────── */
function createFloorReticle() {
  if (floorReticle) return;
  floorReticle = document.createElement('a-ring');
  floorReticle.id = 'floor-reticle';
  floorReticle.setAttribute('radius-inner', '0.18');
  floorReticle.setAttribute('radius-outer', '0.22');
  floorReticle.setAttribute('rotation',     '-90 0 0');
  floorReticle.setAttribute('position',     '0 -0.6 -1.4');
  floorReticle.setAttribute('material',     'color: #00e5ff; transparent: true; opacity: 0.5; side: double');
  floorReticle.setAttribute('animation__pulse',
    'property: material.opacity; from: 0.3; to: 0.6; dur: 800; dir: alternate; loop: true; easing: easeInOutSine'
  );
  floorReticle.setAttribute('visible', 'false');
  cameraEl.appendChild(floorReticle);
}

/* ─── Feature #1: LERP — easeOutBack smooth interpolation ─────────────────── */
function lerpEntity(entity, targetPos, duration, onComplete) {
  if (!entity || !entity.object3D) {
    if (onComplete) onComplete();
    return;
  }

  const startPos  = {
    x: entity.object3D.position.x,
    y: entity.object3D.position.y,
    z: entity.object3D.position.z
  };
  const startTime = performance.now();

  function tick(now) {
    if (!entity || !entity.object3D) return;
    const elapsed = now - startTime;
    const t       = Math.min(1, elapsed / duration);
    const c1      = 1.70158;
    const c3      = c1 + 1;
    const ease    = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);

    entity.object3D.position.x = startPos.x + (targetPos.x - startPos.x) * ease;
    entity.object3D.position.y = startPos.y + (targetPos.y - startPos.y) * ease;
    entity.object3D.position.z = startPos.z + (targetPos.z - startPos.z) * ease;

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      entity.object3D.position.set(targetPos.x, targetPos.y, targetPos.z);
      if (onComplete) onComplete();
    }
  }
  requestAnimationFrame(tick);
}

/* ─── Step 3 & 4: Pick & Place Re-Parenting (LERP + Hum + Reticle) ─────────── */
function pickUpMemory(targetIndex) {
  const targetEl  = document.querySelector(`#target-${targetIndex}`);
  const container = targetEl ? targetEl.querySelector('.hologram-container') : null;
  if (!container || !container.object3D) return;

  playPickUp();
  startCarryingHum();
  setRadarActive(false);

  const THREE = AFRAME.THREE || window.THREE;
  const worldPos = new THREE.Vector3();
  container.object3D.getWorldPosition(worldPos);

  currentCarriedEntity = container;
  cameraEl.appendChild(container);

  const cameraWorldPos  = new THREE.Vector3();
  const cameraWorldQuat = new THREE.Quaternion();
  cameraEl.object3D.getWorldPosition(cameraWorldPos);
  cameraEl.object3D.getWorldQuaternion(cameraWorldQuat);
  const localPos = worldPos.sub(cameraWorldPos).applyQuaternion(cameraWorldQuat.invert());
  container.object3D.position.copy(localPos);

  lerpEntity(container, { x: 0, y: -0.35, z: -1.4 }, 400, () => {
    if (container) container.setAttribute('rotation', '20 0 0');
  });

  if (floorReticle) floorReticle.setAttribute('visible', 'true');

  currentState = STATE.CARRYING;
  guidanceBox.textContent = '🚶 Move & aim at the floor where you want to place it...';
  mainActionBtn.innerHTML = '<span>📍 Tap to "Drop" on Floor</span>';
  mainActionBtn.style.display = '';
}

function dropMemoryOnFloor() {
  if (!currentCarriedEntity || !currentCarriedEntity.object3D) return;

  playDropBeam();
  stopCarryingHum();
  if (floorReticle) floorReticle.setAttribute('visible', 'false');

  const targetIdx = parseInt(currentCarriedEntity.dataset.targetIndex, 10);
  const target    = TARGETS[targetIdx];

  // Offset Coaster 0 to the left and Coaster 1 to the right so BOTH remain visible together!
  const xOffset = targetIdx === 0 ? -0.55 : 0.55;

  worldRootEl.appendChild(currentCarriedEntity);
  currentCarriedEntity.setAttribute('position', `${xOffset} -0.45 -1.5`);
  currentCarriedEntity.setAttribute('rotation', '0 0 0');
  currentCarriedEntity.setAttribute('visible', 'true');

  placedEntities[targetIdx] = currentCarriedEntity;

  // Video playback: start immediately with audio, fallback to muted if browser blocks unmuted
  const video = document.getElementById(target.videoId);
  if (video) {
    EASTER_EGG_TARGETS.forEach(et => {
      const fv = document.getElementById(et.videoId);
      if (fv && !fv.paused) fv.muted = true;
    });

    video.playsInline = true;
    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Autoplay unmuted blocked by browser policy, falling back to muted autoplay:', err);
        video.muted = true;
        video.play().catch(e => console.warn('Muted play also blocked:', e));
      });
    }
  }

  const entityRef = currentCarriedEntity;
  animateMaterialization(entityRef, () => {
    // Ensure video is playing once materialization completes
    if (video && video.paused) {
      video.muted = true;
      video.play().catch(e => console.warn('Delayed play attempt:', e));
    }
  });

  markTargetDiscovered(targetIdx);
  currentCarriedEntity = null;
  currentState         = STATE.PLACED;

  guidanceBox.textContent = `🎉 ${target.title} activated! Tap below to search for more.`;
  mainActionBtn.innerHTML = '<span>🔍 Search for Next Memory</span>';
  mainActionBtn.classList.add('secondary');
  mainActionBtn.style.display = '';
}

/**
 * Drift Recovery: Re-Pick a placed memory from the Menu
 */
function rePlaceHologram(targetIndex) {
  const existing = placedEntities[targetIndex];
  if (!existing) return;

  menuPanel.classList.remove('open');
  playDrawerTick();
  playPickUp();
  startCarryingHum();

  const video = document.getElementById(TARGETS[targetIndex].videoId);
  if (video) video.pause();

  const beam       = existing.querySelector('.hologram-beam');
  const videoPlane = existing.querySelector('.video-screen');
  if (beam)       beam.setAttribute('visible', 'false');
  if (videoPlane) videoPlane.setAttribute('visible', 'false');

  currentCarriedEntity = existing;
  cameraEl.appendChild(existing);
  existing.setAttribute('position', '0 -0.35 -1.4');
  existing.setAttribute('rotation', '20 0 0');

  if (floorReticle) floorReticle.setAttribute('visible', 'true');

  activeTargetIndex = targetIndex;
  currentState      = STATE.CARRYING;

  guidanceBox.textContent = '🚶 Re-positioning memory: Aim at floor and tap Drop...';
  mainActionBtn.innerHTML = '<span>📍 Tap to "Drop" on Floor</span>';
  mainActionBtn.classList.remove('secondary');
  mainActionBtn.style.display = '';
}

function toggleVideoPlayback(targetIndex) {
  const video = document.getElementById(TARGETS[targetIndex].videoId);
  if (!video) return;
  playDrawerTick();
  if (video.paused) {
    video.muted = false;
    video.play().catch(e => console.warn('Tap to play:', e));
  } else {
    video.pause();
  }
}

/* ─── Progress Tracking, Menu Updates & Celebration ───────────────────────── */
function markTargetDiscovered(targetIndex) {
  const target      = TARGETS[targetIndex];
  target.discovered = true;
  target.placed     = true;

  emptyProgressMsg.style.display = 'none';
  restartSection.style.display   = 'block';

  // Prevent duplicate cards: check if card already exists!
  let card = document.getElementById(`card-target-${targetIndex}`);
  if (!card) {
    card = document.createElement('div');
    card.classList.add('memory-card');
    card.id = `card-target-${targetIndex}`;
    card.innerHTML = `
      <div class="memory-card-header">
        <div class="memory-thumb">${target.emoji}</div>
        <div class="memory-info">
          <h4>${target.title}</h4>
          <p>✅ Discovered & Placed</p>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn-small btn-replace interactive" data-target="${targetIndex}">📍 Re-place</button>
        <button class="btn-small btn-toggle-play interactive" data-target="${targetIndex}">▶ Play/Pause</button>
      </div>
    `;

    card.querySelector('.btn-replace').addEventListener('click', (e) => {
      rePlaceHologram(parseInt(e.target.dataset.target, 10));
    });
    card.querySelector('.btn-toggle-play').addEventListener('click', (e) => {
      toggleVideoPlayback(parseInt(e.target.dataset.target, 10));
    });

    progressList.appendChild(card);
  } else {
    const statusText = card.querySelector('.memory-info p');
    if (statusText) statusText.textContent = '✅ Discovered & Placed';
  }

  // Feature #5: One ambient drone layer per coaster placed
  const placedCount = COASTER_TARGETS.filter(t => t.placed).length;
  startAmbientDrone(placedCount);

  // ── CELEBRATION CHECK ────────────────────────────────────────────────────
  // Fires ONLY when both coasters are placed.
  // EASTER_EGG_TARGETS are NEVER counted — this check is coaster-only by design.
  const allCoastersPlaced = COASTER_TARGETS.every(t => t.placed);
  if (allCoastersPlaced) {
    setTimeout(() => triggerCelebration(), 1500);
  }
}

function triggerCelebration() {
  stopAllAmbient();
  playCelebrationFanfare();
  celebrationOverlay.classList.add('visible');
}

function restartScavengerHunt() {
  celebrationOverlay.classList.remove('visible');
  menuPanel.classList.remove('open');
  playDrawerTick();
  stopAllAmbient();
  stopCarryingHum();

  // Reset coaster state
  COASTER_TARGETS.forEach(target => {
    target.discovered = false;
    target.placed     = false;
    const video = document.getElementById(target.videoId);
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  });

  // Pause Easter Egg frame videos (they resume naturally on next targetFound)
  EASTER_EGG_TARGETS.forEach(target => {
    const video = document.getElementById(target.videoId);
    if (video) video.pause();
  });

  // Clear dynamically created progress cards
  progressList.querySelectorAll('.memory-card').forEach(card => card.remove());
  emptyProgressMsg.style.display = 'block';
  restartSection.style.display   = 'none';

  if (floorReticle) floorReticle.setAttribute('visible', 'false');

  // Clear 3D world holograms
  while (worldRootEl.firstChild) {
    worldRootEl.removeChild(worldRootEl.firstChild);
  }
  Object.keys(placedEntities).forEach(k => delete placedEntities[k]);
  currentCarriedEntity = null;

  enterScanningState();
}

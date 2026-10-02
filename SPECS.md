# Protocol0510 — Coding Specifications

> **Read `IMPLEMENTATION-PLAN.md` FIRST** for full context, state machine, and acceptance criteria.
> This file contains the exact code changes to implement.

---

## SPEC-PHASE-1: Menu System + Clean Camera

### Step 1 of 7: Modify `index.html`

Replace the entire UI section (lines 18-93) with the new structure. Keep lines 1-17 and 94+ exactly as they are.

**REMOVE the old top-hud, drawer-toggle, asset-drawer, and move celebration restart button ID:**

```html
    <!-- UI Overlay Layer -->
    <div id="ui-layer">
      <!-- Top HUD — Menu Only -->
      <div class="top-hud">
        <div></div>
        <button id="menu-btn" class="icon-btn interactive" title="Menu">☰</button>
      </div>

      <!-- Center Dynamic Guidance Prompt -->
      <div id="guidance-box" class="guidance-box">
        Tap below to start your birthday AR journey!
      </div>

      <!-- Bottom Context Action Controls -->
      <div class="bottom-controls">
        <button id="main-action-btn" class="action-btn interactive">
          <span>✨ Start Scavenger Hunt</span>
        </button>
      </div>
    </div>

    <!-- Slide-In Menu Panel -->
    <div id="menu-panel">
      <div class="menu-header">
        <div class="menu-title">Menu</div>
        <button id="menu-close" class="icon-btn" style="width:30px;height:30px;font-size:12px;">✕</button>
      </div>

      <!-- SFX Toggle -->
      <div class="menu-section">
        <div class="menu-row interactive" id="sfx-toggle-row">
          <span>🔊 Sound Effects</span>
          <div class="toggle-switch active" id="sfx-toggle">
            <div class="toggle-knob"></div>
          </div>
        </div>
      </div>

      <!-- Saved Progress -->
      <div class="menu-section">
        <div class="menu-section-label">Saved Progress</div>
        <div id="progress-list">
          <div class="empty-progress" id="empty-progress-msg">
            No memories discovered yet
          </div>
          <!-- Cards injected dynamically by JS on discovery -->
        </div>
      </div>

      <!-- Restart (hidden until first discovery) -->
      <div class="menu-section" id="restart-section" style="display: none;">
        <button id="restart-btn" class="menu-restart-btn interactive">
          🔄 Restart Scavenger Hunt
        </button>
      </div>
    </div>

    <!-- Celebration Screen (Unlocked on all discovered) -->
    <div id="celebration-overlay">
      <div class="celebration-title">🎉 Happy Birthday! 🎉</div>
      <div class="celebration-message">
        You discovered all the holographic memories! Enjoy the moments and keep them with you always.
      </div>
      <button id="celebration-restart-btn" class="action-btn interactive">
        <span>🔄 Restart Scavenger Hunt</span>
      </button>
    </div>
```

> **IMPORTANT:** The celebration overlay restart button ID is now `celebration-restart-btn` (not `restart-btn`, which is used by the menu). Both call the same function.

> **IMPORTANT:** The A-Frame scene block (lines 95-137 in the original) stays EXACTLY as is. Do not touch it.

**Add scalability comment above the A-Frame scene:**

```html
    <!--
      SCALABILITY: To add new targets:
      1. Add a <video> element in <a-assets> below
      2. Add an <a-entity mindar-image-target> with the next targetIndex
      3. Add an entry to the TARGETS array in src/main.js
      4. Regenerate targets.mind with MindAR image compiler
    -->
```

---

### Step 2 of 7: Modify `src/style.css`

**REMOVE these entire rule blocks:**
- `#radar-vignette.idle-scan` (the `box-shadow` + `animation: breathingGlow` rule)
- `@keyframes breathingGlow` (the 0%/50%/100% opacity keyframe)
- `#drawer-toggle` (the entire fixed-position drawer tab button)
- `#asset-drawer` (the entire drawer panel styling)
- `#asset-drawer.open`
- `.drawer-header`
- `.drawer-title`
- `.drawer-list`

**KEEP these rules (they are reused by the menu):**
- `.memory-card`, `.memory-card.unlocked`, `.memory-card-header`, `.memory-thumb`, `.memory-info h4`, `.memory-info p`, `.card-actions`, `.btn-small`

**ADD these new rules** (append after the kept `.btn-small` rule, before the Celebration section):

```css
/* --------------------------------------------------------------------------
   Menu Panel (replaces old drawer)
   -------------------------------------------------------------------------- */
#menu-btn {
  font-size: 20px;
}

#menu-panel {
  position: fixed;
  top: 0;
  right: -320px;
  width: 300px;
  height: 100%;
  background: rgba(8, 12, 20, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-left: 1px solid var(--glass-border);
  z-index: 30;
  padding: env(safe-area-inset-top, 24px) 20px env(safe-area-inset-bottom, 24px) 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: right 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.7);
  overflow-y: auto;
}

#menu-panel.open {
  right: 0;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.menu-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-glow);
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-section-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-secondary);
}

.menu-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  font-size: 14px;
  cursor: pointer;
}

/* SFX Toggle Switch */
.toggle-switch {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  position: relative;
  transition: background 0.25s ease;
  cursor: pointer;
}

.toggle-switch.active {
  background: var(--primary-glow);
}

.toggle-knob {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.25s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.toggle-switch.active .toggle-knob {
  transform: translateX(20px);
}

/* Empty Progress Message */
.empty-progress {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
  padding: 20px 10px;
  font-style: italic;
}

/* Menu Restart Button */
.menu-restart-btn {
  width: 100%;
  background: rgba(255, 80, 80, 0.15);
  border: 1px solid rgba(255, 80, 80, 0.4);
  color: #ff6b6b;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.menu-restart-btn:active {
  background: rgba(255, 80, 80, 0.3);
}
```

---

### Step 3 of 7: Modify `src/radar.js`

**Change `setActiveTarget()` — remove `idle-scan` references:**

```javascript
export function setActiveTarget(targetElement) {
  activeTargetEl = targetElement;
  isTrackingTarget = !!targetElement;
  if (!isTrackingTarget && vignetteEl) {
    vignetteEl.classList.remove('proximity', 'lock');
    // NO idle-scan — camera stays clean
  }
}
```

**Change `setRadarActive()` — remove `idle-scan` references:**

```javascript
export function setRadarActive(active) {
  radarActive = active;
  if (!vignetteEl) return;

  if (active) {
    vignetteEl.classList.add('active');
    // NO idle-scan — clean camera until proximity detected
  } else {
    vignetteEl.classList.remove('active', 'proximity', 'lock');
  }
}
```

**Change the else branch in `startRadarLoop()` update function (around line 84):**

```javascript
      } else {
        if (vignetteEl) {
          vignetteEl.classList.remove('proximity');
          // NO idle-scan fallback — stay clean
        }
      }
```

---

### Step 4 of 7: Modify `src/main.js` — DOM References

**Replace the old DOM variable declarations (around lines 50-52):**

OLD:
```javascript
let sceneEl, cameraEl, worldRootEl;
let mainActionBtn, guidanceBox, memoryCounterEl, muteBtn;
let drawerToggle, assetDrawer, drawerCloseBtn, celebrationOverlay, restartBtn;
```

NEW:
```javascript
let sceneEl, cameraEl, worldRootEl;
let mainActionBtn, guidanceBox;
let menuBtn, menuPanel, menuCloseBtn, sfxToggleRow, sfxToggle;
let progressList, emptyProgressMsg, restartSection, restartBtn;
let celebrationOverlay, celebrationRestartBtn;
```

**Replace the DOM query assignments in the DOMContentLoaded handler:**

OLD:
```javascript
  mainActionBtn = document.querySelector('#main-action-btn');
  guidanceBox = document.querySelector('#guidance-box');
  memoryCounterEl = document.querySelector('#memory-counter');
  muteBtn = document.querySelector('#mute-btn');

  drawerToggle = document.querySelector('#drawer-toggle');
  assetDrawer = document.querySelector('#asset-drawer');
  drawerCloseBtn = document.querySelector('#drawer-close');
  celebrationOverlay = document.querySelector('#celebration-overlay');
  restartBtn = document.querySelector('#restart-btn');
```

NEW:
```javascript
  mainActionBtn = document.querySelector('#main-action-btn');
  guidanceBox = document.querySelector('#guidance-box');

  menuBtn = document.querySelector('#menu-btn');
  menuPanel = document.querySelector('#menu-panel');
  menuCloseBtn = document.querySelector('#menu-close');
  sfxToggleRow = document.querySelector('#sfx-toggle-row');
  sfxToggle = document.querySelector('#sfx-toggle');

  progressList = document.querySelector('#progress-list');
  emptyProgressMsg = document.querySelector('#empty-progress-msg');
  restartSection = document.querySelector('#restart-section');
  restartBtn = document.querySelector('#restart-btn');

  celebrationOverlay = document.querySelector('#celebration-overlay');
  celebrationRestartBtn = document.querySelector('#celebration-restart-btn');
```

---

### Step 5 of 7: Modify `src/main.js` — TARGETS Array

**Add `emoji` field to each target entry:**

```javascript
// Scalability: Add new targets by adding entries here + matching <video>/<a-entity> in index.html
const TARGETS = [
  {
    index: 0,
    title: 'Birthday Montage',
    videoId: 'video-montage',
    emoji: '🎂',
    discovered: false
  },
  {
    index: 1,
    title: 'Special Memorial',
    videoId: 'video-memorial',
    emoji: '🕊️',
    discovered: false
  }
];
```

---

### Step 6 of 7: Modify `src/main.js` — Event Listeners

**Replace `setupUIEventListeners()` entirely:**

```javascript
function setupUIEventListeners() {
  mainActionBtn.addEventListener('click', handleMainActionButton);

  // Menu open/close
  menuBtn.addEventListener('click', () => {
    playDrawerTick();
    menuPanel.classList.toggle('open');
  });

  menuCloseBtn.addEventListener('click', () => {
    playDrawerTick();
    menuPanel.classList.remove('open');
  });

  // SFX toggle
  sfxToggleRow.addEventListener('click', () => {
    const muted = toggleMute();
    sfxToggle.classList.toggle('active', !muted);
    sfxToggleRow.querySelector('span').textContent = muted ? '🔇 Sound Effects' : '🔊 Sound Effects';
    if (!muted) playDrawerTick(); // audible confirmation when unmuting
  });

  // Restart buttons (menu + celebration overlay)
  restartBtn.addEventListener('click', restartScavengerHunt);
  celebrationRestartBtn.addEventListener('click', restartScavengerHunt);
}
```

> **NOTE:** The old `.btn-replace` and `.btn-toggle-play` querySelectorAll listeners are REMOVED. Card button listeners are now attached dynamically inside `markTargetDiscovered()`.

---

### Step 7 of 7: Modify `src/main.js` — Discovery, Restart, Re-place

**Replace `markTargetDiscovered()` entirely:**

```javascript
function markTargetDiscovered(targetIndex) {
  const target = TARGETS[targetIndex];
  target.discovered = true;

  // Hide empty progress message
  emptyProgressMsg.style.display = 'none';

  // Show restart section (appears on first discovery)
  restartSection.style.display = 'block';

  // Dynamically create memory card in Saved Progress
  const card = document.createElement('div');
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

  // Attach event listeners to the new card's buttons
  card.querySelector('.btn-replace').addEventListener('click', (e) => {
    rePlaceHologram(parseInt(e.target.dataset.target, 10));
  });
  card.querySelector('.btn-toggle-play').addEventListener('click', (e) => {
    toggleVideoPlayback(parseInt(e.target.dataset.target, 10));
  });

  progressList.appendChild(card);

  // Check for celebration (uses TARGETS.length, NOT hardcoded 2)
  const discoveredCount = TARGETS.filter(t => t.discovered).length;
  if (discoveredCount === TARGETS.length) {
    setTimeout(() => {
      triggerCelebration();
    }, 1500);
  }
}
```

**Replace `restartScavengerHunt()` entirely:**

```javascript
function restartScavengerHunt() {
  celebrationOverlay.classList.remove('visible');
  menuPanel.classList.remove('open');
  playDrawerTick();

  // Reset all target state
  TARGETS.forEach(target => {
    target.discovered = false;
    const video = document.querySelector(`#${target.videoId}`);
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  });

  // Clear dynamically created progress cards (safe removal)
  progressList.querySelectorAll('.memory-card').forEach(card => card.remove());
  emptyProgressMsg.style.display = 'block';
  restartSection.style.display = 'none';

  // Clear 3D world holograms (safe A-Frame entity removal)
  while (worldRootEl.firstChild) {
    worldRootEl.removeChild(worldRootEl.firstChild);
  }
  Object.keys(placedEntities).forEach(k => delete placedEntities[k]);
  currentCarriedEntity = null;

  enterScanningState();
}
```

**Modify `rePlaceHologram()` — change drawer ref to menu:**

Find and replace this line:
```javascript
  assetDrawer.classList.remove('open');
```
With:
```javascript
  menuPanel.classList.remove('open');
```

**Remove ALL references to `memoryCounterEl`:**
- Delete the line: `memoryCounterEl.textContent = ...` in the old `markTargetDiscovered` (being replaced anyway)
- Delete the line: `memoryCounterEl.textContent = '0/2';` in the old `restartScavengerHunt` (being replaced anyway)

---

## SPEC-PHASE-2: Polish Features

> **DO NOT START Phase 2 until Phase 1 has been reviewed by Opus and approved by the Director.**

---

### Feature #2: Floor Placement Reticle

**File: `src/main.js`**

Add a module-level variable:
```javascript
let floorReticle = null;
```

Add a creation function (call once during `startARSession()` after MindAR starts):
```javascript
function createFloorReticle() {
  floorReticle = document.createElement('a-ring');
  floorReticle.id = 'floor-reticle';
  floorReticle.setAttribute('radius-inner', '0.18');
  floorReticle.setAttribute('radius-outer', '0.22');
  floorReticle.setAttribute('rotation', '-90 0 0');
  floorReticle.setAttribute('position', '0 -0.6 -1.4');
  floorReticle.setAttribute('material', 'color: #00e5ff; transparent: true; opacity: 0.5; side: double');
  floorReticle.setAttribute('animation__pulse', 'property: material.opacity; from: 0.3; to: 0.6; dur: 800; dir: alternate; loop: true; easing: easeInOutSine');
  floorReticle.setAttribute('visible', 'false');
  cameraEl.appendChild(floorReticle);
}
```

Show/hide in state transitions:
- `pickUpMemory()`: Add `if (floorReticle) floorReticle.setAttribute('visible', 'true');`
- `dropMemoryOnFloor()`: Add `if (floorReticle) floorReticle.setAttribute('visible', 'false');`
- `rePlaceHologram()`: Add `if (floorReticle) floorReticle.setAttribute('visible', 'true');`

---

### Feature #6: Carrying Hum

**File: `src/audio.js`**

Add at module level:
```javascript
let carryOsc = null;
let carryGain = null;
```

Add exported functions:
```javascript
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
```

**File: `src/main.js`**

Add to imports:
```javascript
import { ..., startCarryingHum, stopCarryingHum } from './audio.js';
```

- `pickUpMemory()`: Add `startCarryingHum();`
- `rePlaceHologram()`: Add `startCarryingHum();`
- `dropMemoryOnFloor()`: Add `stopCarryingHum();`

---

### Feature #5: Ambient Room Awakening Drone

**File: `src/audio.js`**

Add at module level:
```javascript
let ambientNodes = [];
```

Add exported functions:
```javascript
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
```

**File: `src/main.js`**

Add to imports:
```javascript
import { ..., startAmbientDrone, stopAllAmbient } from './audio.js';
```

- `markTargetDiscovered()`: After appending card, add:
  ```javascript
  startAmbientDrone(discoveredCount);
  ```
- `triggerCelebration()`: Add `stopAllAmbient();`
- `restartScavengerHunt()`: Add `stopAllAmbient();`

---

### Feature #8: Beam Particle Rise

**File: `src/animations.js`**

Add a new function:
```javascript
function spawnBeamParticles(container, count = 10) {
  const beamRadius = 0.4;
  const beamHeight = 1.6;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('a-sphere');
    particle.setAttribute('radius', '0.015');
    particle.setAttribute('material', 'color: #00e5ff; emissive: #00e5ff; emissiveIntensity: 1.0; transparent: true; opacity: 0.8');

    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * beamRadius * 0.7;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const startY = Math.random() * 0.3;

    particle.setAttribute('position', `${x.toFixed(3)} ${startY.toFixed(3)} ${z.toFixed(3)}`);

    const delay = 300 + i * 80;
    particle.setAttribute('animation__rise', {
      property: 'position',
      to: `${x.toFixed(3)} ${beamHeight} ${z.toFixed(3)}`,
      dur: 1200 + Math.random() * 400,
      delay: delay,
      easing: 'easeInQuad'
    });
    particle.setAttribute('animation__fade', {
      property: 'material.opacity',
      from: 0.8,
      to: 0,
      dur: 400,
      delay: delay + 1000,
      easing: 'easeOutQuad'
    });

    container.appendChild(particle);

    // Auto-cleanup
    setTimeout(() => {
      if (particle.parentNode) particle.parentNode.removeChild(particle);
    }, delay + 1600);
  }
}
```

Call inside `animateMaterialization()`, right after the beam becomes visible (around delay 200ms):
```javascript
  // Beam particles
  setTimeout(() => spawnBeamParticles(entityContainer), 200);
```

---

### Feature #3: Holographic Video Scanlines

**File: `src/animations.js`**

Add a new function:
```javascript
function addScanlineOverlay(container) {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < 128; y++) {
    ctx.fillStyle = (y % 4 < 2) ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0)';
    ctx.fillRect(0, y, 2, 1);
  }

  const scanPlane = document.createElement('a-plane');
  scanPlane.classList.add('scanline-overlay');
  scanPlane.setAttribute('width', '1.62');
  scanPlane.setAttribute('height', '0.92');
  scanPlane.setAttribute('position', '0 0.9 0.005');
  scanPlane.setAttribute('material', 'shader: flat; transparent: true; side: double');

  scanPlane.addEventListener('loaded', () => {
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 16);
    const mesh = scanPlane.getObject3D('mesh');
    if (mesh && mesh.material) {
      mesh.material.map = texture;
      mesh.material.needsUpdate = true;
    }
  });

  container.appendChild(scanPlane);
}
```

Call inside `animateMaterialization()`, when the video plane becomes visible:
```javascript
  // Holographic scanlines
  if (videoPlane) {
    setTimeout(() => addScanlineOverlay(entityContainer), 500);
  }
```

---

### Feature #1: Pickup/Drop LERP Animation

> **This feature modifies core pick/drop logic. Implement LAST.**

**File: `src/main.js`**

Add a LERP utility function:
```javascript
function lerpEntity(entity, targetPos, duration, onComplete) {
  const startPos = {
    x: entity.object3D.position.x,
    y: entity.object3D.position.y,
    z: entity.object3D.position.z
  };
  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);
    // easeOutBack curve
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const ease = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);

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
```

**Modify `pickUpMemory()`:**

Replace the instant position set with:
```javascript
function pickUpMemory(targetIndex) {
  const targetEl = document.querySelector(`#target-${targetIndex}`);
  const container = targetEl ? targetEl.querySelector('.hologram-container') : null;
  if (!container) return;

  playPickUp();
  startCarryingHum();
  setRadarActive(false);

  // Capture world position before re-parenting
  const worldPos = new THREE.Vector3();
  container.object3D.getWorldPosition(worldPos);

  // Re-parent to camera
  currentCarriedEntity = container;
  cameraEl.appendChild(container);

  // Convert world position to camera-local space for start position
  const cameraWorldPos = new THREE.Vector3();
  const cameraWorldQuat = new THREE.Quaternion();
  cameraEl.object3D.getWorldPosition(cameraWorldPos);
  cameraEl.object3D.getWorldQuaternion(cameraWorldQuat);
  const localPos = worldPos.sub(cameraWorldPos).applyQuaternion(cameraWorldQuat.invert());
  container.object3D.position.copy(localPos);

  // LERP to HUD position
  lerpEntity(container, { x: 0, y: -0.35, z: -1.4 }, 400, () => {
    container.setAttribute('rotation', '20 0 0');
  });

  if (floorReticle) floorReticle.setAttribute('visible', 'true');

  currentState = STATE.CARRYING;
  guidanceBox.textContent = '🚶 Move & aim at the floor where you want to place it...';
  mainActionBtn.innerHTML = '<span>📍 Tap to "Drop" on Floor</span>';
}
```

**Modify `dropMemoryOnFloor()`:**

Replace the instant position set with:
```javascript
function dropMemoryOnFloor() {
  if (!currentCarriedEntity) return;

  playDropBeam();
  stopCarryingHum();
  if (floorReticle) floorReticle.setAttribute('visible', 'false');

  // Get current world position
  const worldPos = new THREE.Vector3();
  currentCarriedEntity.object3D.getWorldPosition(worldPos);

  // Re-parent to world
  worldRootEl.appendChild(currentCarriedEntity);
  currentCarriedEntity.object3D.position.copy(worldPos);
  currentCarriedEntity.setAttribute('rotation', '0 0 0');

  const floorY = Math.min(worldPos.y, -0.6);
  const targetIdx = parseInt(currentCarriedEntity.dataset.targetIndex, 10);
  placedEntities[targetIdx] = currentCarriedEntity;

  // LERP down to floor
  const entityRef = currentCarriedEntity;
  lerpEntity(entityRef, { x: worldPos.x, y: floorY, z: worldPos.z }, 400, () => {
    // Run materialization after landing
    animateMaterialization(entityRef, () => {
      const video = document.querySelector(`#${TARGETS[targetIdx].videoId}`);
      if (video) {
        video.play().catch(e => console.warn('Inline play needs tap:', e));
      }
    });
  });

  markTargetDiscovered(targetIdx);
  currentCarriedEntity = null;
  currentState = STATE.PLACED;

  guidanceBox.textContent = '🎉 Memory activated! Tap below to search for more.';
  mainActionBtn.innerHTML = '<span>🔍 Search for Next Memory</span>';
  mainActionBtn.classList.add('secondary');
}
```

---

## Final Import Statement for `src/main.js`

After all Phase 2 features are implemented, the imports should be:

```javascript
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
```

---

## STOP AND WAIT

After implementing Phase 1 OR Phase 2, **STOP**. Do not proceed to the next phase. Send your code to the Director who will forward it to Opus for review. Only continue when both Opus and the Director have approved.

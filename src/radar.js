/**
 * Proximity Radar & Edge Haptics Controller
 * Calculates camera-to-target 3D distance and drives screen vignette pulsing + audio pings.
 */

import { playRadarPing } from './audio.js';

let vignetteEl = null;
let activeTargetEl = null;
let cameraEl = null;
let radarActive = false;
let isTrackingTarget = false;

export function initRadar(vignetteElement, cameraElement) {
  vignetteEl = vignetteElement;
  cameraEl = cameraElement;
  startRadarLoop();
}

export function setActiveTarget(targetElement) {
  activeTargetEl = targetElement;
  isTrackingTarget = !!targetElement;
  if (!isTrackingTarget && vignetteEl) {
    vignetteEl.classList.remove('proximity', 'lock');
    // NO idle-scan — camera stays clean
  }
}

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

export function triggerLockOnEffect() {
  if (!vignetteEl) return;
  vignetteEl.classList.remove('proximity');
  vignetteEl.classList.add('lock');
  setTimeout(() => {
    if (vignetteEl) vignetteEl.classList.remove('lock');
  }, 1000);
}

let _targetWorldPos = null;

function startRadarLoop() {
  function update() {
    if (radarActive && isTrackingTarget && activeTargetEl && cameraEl) {
      const targetObj = activeTargetEl.object3D;
      const cameraObj = cameraEl.object3D;

      if (targetObj && targetObj.visible && cameraObj) {
        const THREE = window.THREE || (typeof AFRAME !== 'undefined' && AFRAME.THREE);
        if (!THREE) return;
        if (!_targetWorldPos) _targetWorldPos = new THREE.Vector3();

        // Calculate distance in 3D meters
        targetObj.getWorldPosition(_targetWorldPos);
        const distance = _targetWorldPos.length();

        // Distance range: ~0.4m (close) to ~2.5m (far)
        if (distance > 0.1 && distance < 3.5) {
          vignetteEl.classList.remove('proximity');
          vignetteEl.classList.add('proximity');

          // Normalized scale (0 = touching, 1 = max distance)
          const norm = Math.max(0, Math.min(1, (distance - 0.4) / 2.0));
          
          // Edge pulse speed: 0.2s when close -> 1.2s when far
          const pulseDuration = 0.2 + norm * 1.0;
          vignetteEl.style.setProperty('--pulse-speed', `${pulseDuration.toFixed(2)}s`);

          // Edge glow intensity: high when close, softer when far
          const glowAlpha = 0.85 - norm * 0.55;
          vignetteEl.style.setProperty('--vignette-alpha', glowAlpha.toFixed(2));

          // Trigger audio blip
          playRadarPing(distance);
        }
      } else {
        if (vignetteEl) {
          vignetteEl.classList.remove('proximity');
          // NO idle-scan fallback — stay clean
        }
      }
    }
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

# AR Birthday Scavenger Hunt — Master Architectural Specification

> **Approved by:** The Director  
> **Lead Systems Architect & QA:** Gemini (Antigravity)  
> **Implementation Engineer:** Claude 4.6 Sonnet  

---

## 1. Project Governance & Chain of Command

| Role | Entity | Responsibilities & Review Gates |
| :--- | :--- | :--- |
| **Director / Gatekeeper** | **The User** | Sole decision maker; holds final sign-off authority on every architecture plan, feature, and code diff. |
| **Lead Systems Architect & QA** | **Gemini (Antigravity)** | Blueprint author, constraint enforcement, and final QA verification. |
| **Implementation Engineer** | **Claude 4.6 Sonnet** | Produces implementation specs and executes clean code based on the approved blueprint. |

---

## 2. Updated Storyboard & System Targets (3-Target Architecture)

```
[ 1. CLEAN CAMERA VIEW ] ───► [ 2. ROOM SCANNING ]
                                      │
          ┌───────────────────────────┴───────────────────────────┐
          ▼ (Coasters Detected)                                   ▼ (Photo Frame Detected)
┌──────────────────────────────────────┐                ┌──────────────────────────────────────┐
│  ACTIVE SCAVENGER TARGETS (0 & 1)    │                │  AMBIENT EASTER EGG (Target 2)       │
│  - Proximity Radar & Sonar Active    │                │  - Silent Discovery (No radar/glow)  │
│  - Pick & Place to Floor             │                │  - In-Frame 1:1 Planar Overlay       │
│                                      │                │  - "Harry Potter" living portrait    │
│  Target 0: Birthday Montage (Screen) │                │    plays seamlessly inside frame     │
│  Target 1: Uncle Wish (CHROMA KEY)   │                └──────────────────────────────────────┘
│            - Real-time Green Despill │
│            - Holographic Rim Glow    │
└──────────────────┬───────────────────┘
                   ▼ (Both Coasters Found)
┌──────────────────────────────────────┐
│  CELEBRATION OVERLAY & FANFARE       │
└──────────────────────────────────────┘
```

---

## 3. Specifications for the 2 New Features

### Feature A: Green Screen Chroma Key Hologram (Target 1 - Uncle Wish)
* **Video Asset:** `public/assets/memorial.mp4` (Green screen background).
* **Shader Component:** `src/chromakey.js` (`shader: chromakey`).
* **GLSL Shader Pipeline:**
  1. **Color Keying:** Keys out `#00FF00` with adjustable `colorThreshold` and `smoothness`.
  2. **Green Despill:** `color.g = min(color.g, max(color.r, color.b));` eliminates edge halos.
  3. **Holographic Rim Glow:** Adds cyan/gold silhouette fresnel emission to the edges.
* **Result:** Uncle appears as a free-standing, colorful glowing hologram standing on the AR floor ring.

### Feature B: "Harry Potter" Living Photo Frame (Target 2 - Silent Easter Egg)
* **Target Asset:** `public/assets/marker2.png` (High-contrast photo inside physical frame).
* **Video Asset:** `public/assets/frame_live.mp4` (The moving video version of the photo).
* **Decoupled Architecture:**
  * Flagged as `isEasterEgg: true`.
  * **Zero radar pings, zero edge glow, zero pick-up buttons.**
  * `targetFound` directly starts `frameVideo.play()`; `targetLost` pauses it.
  * Planar mesh dimensions match physical frame aspect ratio (1:1 flush fit).

---

## 4. Required Resources from User
1. `public/assets/memorial.mp4`: Uncle's video on green backdrop.
2. `public/assets/marker2.png`: High-res image of the framed photo.
3. `public/assets/frame_live.mp4`: The living video version for the photo frame.
4. Physical frame aspect ratio (e.g. 4:6, 5:7, 16:9).
5. `public/assets/targets.mind`: Recompiled via MindAR compiler containing all 3 targets (0, 1, 2).

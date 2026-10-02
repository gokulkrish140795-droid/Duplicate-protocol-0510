# 🎂 AR Birthday Scavenger Hunt (`Protocol0510`)

A mobile browser-based Augmented Reality scavenger hunt built with **MindAR**, **A-Frame**, and **Vite**.

---

## 🚀 How to Run the App

1. Open a terminal in this folder and start the local HTTPS dev server:
   ```bash
   npm run dev
   ```

2. Vite will output a local network address (e.g., `https://192.168.1.X:5173/`).

3. On your wife's **iPhone 14 (Chrome or Safari)**:
   * Connect to the same home Wi-Fi network.
   * Open the `https://...` address.
   * When prompted with the self-signed certificate warning, tap **Advanced** $\to$ **Proceed to link**.
   * Tap **"Start Scavenger Hunt"** to grant camera and motion permissions!

---

## 🧪 How to Test Right Now with Placeholders

1. On your computer screen, open `public/assets/marker0.png`.
2. Point the iPhone camera at your monitor.
3. The **Proximity Radar** will pulse cyan and emit sonar blips as you move closer.
4. When in range, the **Glowing AR Ring** locks onto the card.
5. Tap **"Pick Up Memory"** $\to$ the ring floats 1.5m in front of your camera.
6. Aim at your living room floor and tap **"Drop on Floor"** $\to$ the hologram materializes and plays the video!
7. Walk around or open the **Asset Drawer** (tab on the right edge) to re-place or view memories.

---

## 🎨 Swapping in Your Final Personal Media

### 1. Compile Your Final Coasters / Target Images
1. Open the official MindAR online compiler in your browser:
   [https://hiukim.github.io/mind-ar-js-doc/tools/compile](https://hiukim.github.io/mind-ar-js-doc/tools/compile)
2. Upload your 2 target images:
   * Target 0: Coaster #1 (Birthday Montage)
   * Target 1: Coaster #2 (Memorial Video)
3. Download the compiled `targets.mind` file.
4. Place it in `public/assets/targets.mind` (replacing the placeholder).

### 2. Replace the MP4 Videos
Drop your actual video files into:
* `public/assets/montage.mp4` (Birthday montage video)
* `public/assets/memorial.mp4` (Memorial video of her late uncle)

That's it! The app will automatically track your physical coasters and stream your personal videos.

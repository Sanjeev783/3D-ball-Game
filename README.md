# Metal Ball Maze 3D — Ultra-Realistic Physics Game

An ultra-realistic, immersive 3D metal ball maze game built with **Three.js**, **Cannon-es**, and **Web Audio API**.

---

## 🎮 Features & Highlights

1. **Massive 3D Maze with Real Verticality**:
   - Spans over 100 meters with multi-level elevations, elevated catwalks, bridges crossing over ground corridors, sloped metal ramps, sharp 90° corners, wide open chambers, and dead ends.
   - Guaranteed solvable via BFS path verification algorithm.
   - Dark industrial concrete walls with structural steel I-beams, formwork tie rods, water stains, and bottom metal reinforcement skirting plates.

2. **Ultra-Realistic Metal Ball (PBR)**:
   - Polished steel ball rendered with physical PBR materials (`MeshPhysicalMaterial`), micro-scratches, dents, and dynamic environmental reflections.
   - Heavy 8.5kg steel sphere physics with authentic momentum, rolling resistance, inertia, and 3D rotational synchronization.

3. **Cinematic 3rd-Person Follow Camera**:
   - Smooth position and rotation lag interpolation with velocity look-ahead.
   - Dynamic camera occlusion prevention so the camera never clips through walls.
   - Quadratic trauma-based dynamic camera shake on hard wall impacts.
   - Manual mouse orbit (Click & Drag to rotate view, Wheel to zoom).

4. **Directional Spark Particle System & Impact Flash**:
   - Exact contact point and collision normal detection.
   - Dynamic thresholding:
     - **Low Impact (< 2.5 m/s):** Soft metallic tap, no sparks.
     - **Medium Impact (2.5 – 6.0 m/s):** Solid metallic impact sound, 18–35 directional sparks, subtle camera shake.
     - **High Impact (> 6.0 m/s):** Loud ringing steel impact, 60–120 incandescent sparks with gravity and ground bounce, bright localized flash light, camera trauma.
   - Cooling color ramp: White-hot $\rightarrow$ Gold $\rightarrow$ Fiery Orange $\rightarrow$ Deep Amber.

5. **Procedural Web Audio Sound Engine**:
   - Zero-dependency, zero-latency physical audio synthesis via Web Audio API.
   - **Metallic Collisions:** Modal synthesis using physical steel sphere eigenmode frequencies (540Hz, 930Hz, 1400Hz, 2060Hz, 2770Hz) with exponential decay and industrial hall convolver reverb.
   - **Dynamic Rolling Audio:** Lowpass filtered noise with frequency and volume smoothly modulated by rolling velocity.
   - **Industrial Ambient:** Deep 55Hz sub-bass generator hum + atmospheric air draft.
   - **Sparks Sizzle:** High-frequency friction crackle.
   - **Victory Fanfare:** Shimmering harmonic chime chords.

6. **Tactical Radar Mini-Map & Modern HUD**:
   - Real-time speedometer (km/h), distance rolled (m), timer (MM:SS.ms), and collision counter.
   - Rotating radar compass tracking player position and glowing goal portal.
   - High-impact visual alert banners.
   - Start briefing screen, How-to-Play guide, and Victory modal with best time tracking.

---

## 🕹️ Controls

| Action | Control |
|---|---|
| **Roll Forward** | <kbd>W</kbd> or <kbd>↑</kbd> |
| **Roll Backward** | <kbd>S</kbd> or <kbd>↓</kbd> |
| **Roll Left** | <kbd>A</kbd> or <kbd>←</kbd> |
| **Roll Right** | <kbd>D</kbd> or <kbd>→</kbd> |
| **Orbit Camera** | Left/Right Click & Drag |
| **Zoom Camera** | Mouse Wheel / Scroll |
| **Reset Position** | <kbd>R</kbd> or In-Game Reset Button |
| **Toggle Mute** | Sound Button (<kbd>🔊</kbd>) |

---

## 🚀 Running the Game Locally

```bash
# 1. Install dependencies
npm install

# 2. Run local dev server
npm run dev

# 3. Build production bundle
npm run build
```

Open `http://localhost:5173/` in your browser.

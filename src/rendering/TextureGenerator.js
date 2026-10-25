/**
 * TextureGenerator.js
 * Generates ultra-high quality procedural PBR textures for:
 * - Polished scratched steel (ball roughness, bump, normal)
 * - Heavy industrial concrete walls (rough aggregate, scratches, water stains, porous pits)
 * - Industrial steel plates with rivets and seams
 * - High-friction industrial concrete floor slabs with hazard markings
 * - Dynamic environment reflections for PBR steel ball
 */

import * as THREE from 'three';

export class TextureGenerator {
  /**
   * Generates micro-scratched and brushed metallic map for the metal ball
   */
  /**
   * Generates ultra-clear, high-contrast industrial PBR textures for the metal ball:
   * - Dual-tone split hemispheres (dark titanium vs bright brushed chrome)
   * - High-visibility electric cyan & safety hazard racing equator bands with directional chevrons
   * - Distinct quadrant panels with checkered racing patterns, tech target emblems, and bold stencils
   * - Machined 3D rivets and recessed panel seams
   * Guarantees unmistakable, dramatic visual tumbling and rolling in 3D space.
   */
  static createMetalBallTextures() {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // 1. Dual-Tone Split Hemispheres:
    // Top half (North): Polished dark gunmetal titanium
    ctx.fillStyle = '#1e242c';
    ctx.fillRect(0, 0, size, size * 0.5);

    // Bottom half (South): Bright brushed chrome alloy
    ctx.fillStyle = '#dbe2ea';
    ctx.fillRect(0, size * 0.5, size, size * 0.5);

    // 2. Fine Lathe & Machining Grain (subtle circular brushed metal)
    for (let y = 0; y < size; y += 2) {
      const isTop = y < size * 0.5;
      const noise = (Math.random() - 0.5) * 20;
      ctx.fillStyle = isTop
        ? `rgba(${45 + noise}, ${52 + noise}, ${60 + noise}, 0.25)`
        : `rgba(${220 + noise}, ${230 + noise}, ${240 + noise}, 0.25)`;
      ctx.fillRect(0, y, size, 2);
    }

    // Micro surface scratches
    ctx.lineWidth = 1.0;
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const len = 8 + Math.random() * 30;
      const angle = Math.random() * Math.PI * 2;
      ctx.strokeStyle = y < size * 0.5
        ? `rgba(255, 255, 255, ${0.08 + Math.random() * 0.12})`
        : `rgba(30, 35, 40, ${0.1 + Math.random() * 0.15})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }

    // 3. Four Vertical Carbon Meridian Seams (divide into 4 quadrants)
    const meridians = [0, size * 0.25, size * 0.5, size * 0.75];
    for (const mx of meridians) {
      // Dark recessed seam
      ctx.fillStyle = '#0a0d10';
      ctx.fillRect(mx - 8, 0, 16, size);
      // Highlights on seam edges
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mx - 10, 0, 2, size);
      ctx.fillRect(mx + 8, 0, 2, size);
    }

    // 4. Central Equator Racing & Hazard Band (y = 512)
    const eqY = size * 0.5;
    // Dark carbon base band
    ctx.fillStyle = '#0d1014';
    ctx.fillRect(0, eqY - 48, size, 96);

    // Outer white/cyan pinstripes
    ctx.fillStyle = '#00f5d4';
    ctx.fillRect(0, eqY - 48, size, 4);
    ctx.fillRect(0, eqY + 44, size, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, eqY - 44, size, 2);
    ctx.fillRect(0, eqY + 42, size, 2);

    // Vibrant Electric Cyan & Safety Orange center stripe
    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(0, eqY - 24, size, 48);
    ctx.fillStyle = '#00f5d4';
    ctx.fillRect(0, eqY - 8, size, 16);

    // Directional chevron markings along the equator band
    for (let x = 0; x < size; x += 64) {
      ctx.fillStyle = '#0d1014';
      ctx.beginPath();
      ctx.moveTo(x + 10, eqY - 18);
      ctx.lineTo(x + 28, eqY);
      ctx.lineTo(x + 10, eqY + 18);
      ctx.lineTo(x + 18, eqY + 18);
      ctx.lineTo(x + 36, eqY);
      ctx.lineTo(x + 18, eqY - 18);
      ctx.closePath();
      ctx.fill();
    }

    // 5. Distinct Quadrants (high visual contrast to make rolling immediately obvious)
    // Quadrant 1 (x: 0 - 256, center: 128)
    // North: Circular target crosshair & bold stencil "01"
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(128, 256, 52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(128, 256, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 64px "Orbitron", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('01', 128, 256);

    // South: Checkered Racing Pattern
    const checkSize = 24;
    for (let cy = 0; cy < 4; cy++) {
      for (let cx = 0; cx < 5; cx++) {
        ctx.fillStyle = (cx + cy) % 2 === 0 ? '#111417' : '#ffffff';
        ctx.fillRect(128 - 60 + cx * checkSize, 768 - 48 + cy * checkSize, checkSize, checkSize);
      }
    }

    // Quadrant 2 (x: 256 - 512, center: 384)
    // North: Industrial Hazard Stripes (Amber / Black)
    ctx.save();
    ctx.beginPath();
    ctx.rect(384 - 80, 256 - 55, 160, 110);
    ctx.clip();
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(384 - 80, 256 - 55, 160, 110);
    ctx.fillStyle = '#111417';
    for (let hx = 384 - 150; hx < 384 + 150; hx += 32) {
      ctx.beginPath();
      ctx.moveTo(hx, 256 - 55);
      ctx.lineTo(hx + 24, 256 - 55);
      ctx.lineTo(hx - 16, 256 + 55);
      ctx.lineTo(hx - 40, 256 + 55);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // South: Stenciled "TITAN" badge
    ctx.fillStyle = '#0a0d10';
    ctx.fillRect(384 - 80, 768 - 36, 160, 72);
    ctx.fillStyle = '#ff6b35';
    ctx.font = '900 44px "Orbitron", monospace, sans-serif';
    ctx.fillText('TITAN', 384, 768);

    // Quadrant 3 (x: 512 - 768, center: 640)
    // North: Glowing Cyan Gyro Emblem
    ctx.fillStyle = '#0a0d10';
    ctx.beginPath();
    ctx.arc(640, 256, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(640, 256, 44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#00f5d4';
    ctx.fillText('MK-X', 640, 256);

    // South: Triple High-Contrast Speed Chevron Arrows
    for (let arrowY = 768 - 36; arrowY <= 768 + 36; arrowY += 36) {
      ctx.fillStyle = '#00f5d4';
      ctx.beginPath();
      ctx.moveTo(640 - 45, arrowY + 14);
      ctx.lineTo(640, arrowY - 14);
      ctx.lineTo(640 + 45, arrowY + 14);
      ctx.lineTo(640 + 32, arrowY + 14);
      ctx.lineTo(640, arrowY - 2);
      ctx.lineTo(640 - 32, arrowY + 14);
      ctx.closePath();
      ctx.fill();
    }

    // Quadrant 4 (x: 768 - 1024, center: 896)
    // North: Warning Hexagon Badge
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 52px "Orbitron", monospace, sans-serif';
    ctx.fillText('X-9', 896, 256);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let a = 0; a < 6; a++) {
      const angle = (a * Math.PI) / 3;
      const hx = 896 + Math.cos(angle) * 54;
      const hy = 256 + Math.sin(angle) * 54;
      if (a === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();

    // South: Bold Dual Sport Racing Bands
    ctx.fillStyle = '#111417';
    ctx.fillRect(896 - 40, 768 - 55, 30, 110);
    ctx.fillRect(896 + 10, 768 - 55, 30, 110);
    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(896 - 35, 768 - 55, 20, 110);
    ctx.fillRect(896 + 15, 768 - 55, 20, 110);

    // 6. Machined 3D Shaded Rivets along Seams and Equator
    const drawRivet = (rx, ry) => {
      // Dark rim shadow
      ctx.fillStyle = '#080a0c';
      ctx.beginPath();
      ctx.arc(rx, ry, 6, 0, Math.PI * 2);
      ctx.fill();
      // Metallic body
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
      ctx.fill();
      // Specular pin highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(rx - 1.5, ry - 1.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
    };

    // Equator border rivets
    for (let x = 16; x < size; x += 48) {
      drawRivet(x, eqY - 36);
      drawRivet(x, eqY + 36);
    }

    // Meridian seam rivets
    for (const mx of meridians) {
      for (let y = 32; y < size; y += 64) {
        if (Math.abs(y - eqY) > 50) {
          drawRivet(mx, y);
        }
      }
    }

    // Polar caps (North Pole y=0, South Pole y=size)
    ctx.fillStyle = '#0d1014';
    ctx.fillRect(0, 0, size, 24);
    ctx.fillRect(0, size - 24, size, 24);
    ctx.fillStyle = '#00f5d4';
    ctx.fillRect(0, 22, size, 3);
    ctx.fillRect(0, size - 25, size, 3);

    const diffuseTexture = new THREE.CanvasTexture(canvas);
    diffuseTexture.wrapS = THREE.RepeatWrapping;
    diffuseTexture.wrapT = THREE.RepeatWrapping;

    // 7. High-Contrast Roughness Canvas
    // Smooth polished metal (dark grey ~0.15 - 0.25) vs matte carbon/paint (lighter grey ~0.55 - 0.70)
    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = size;
    roughCanvas.height = size;
    const rCtx = roughCanvas.getContext('2d');

    // Base polished metal roughness
    rCtx.fillStyle = '#32363b';
    rCtx.fillRect(0, 0, size, size);

    // Carbon equator band is matte (rougher)
    rCtx.fillStyle = '#808080';
    rCtx.fillRect(0, eqY - 48, size, 96);

    // Meridian seams are rougher
    for (const mx of meridians) {
      rCtx.fillStyle = '#909090';
      rCtx.fillRect(mx - 8, 0, 16, size);
    }

    // Painted emblems and hazard stripes are rougher
    rCtx.fillStyle = '#757575';
    rCtx.beginPath();
    rCtx.arc(128, 256, 55, 0, Math.PI * 2);
    rCtx.fill();
    rCtx.fillRect(384 - 80, 256 - 55, 160, 110);
    rCtx.beginPath();
    rCtx.arc(640, 256, 56, 0, Math.PI * 2);
    rCtx.fill();

    const roughnessTexture = new THREE.CanvasTexture(roughCanvas);
    roughnessTexture.wrapS = THREE.RepeatWrapping;
    roughnessTexture.wrapT = THREE.RepeatWrapping;

    // 8. High-Fidelity Bump Canvas (recessed grooves, raised seams, rivets)
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bCtx = bumpCanvas.getContext('2d');
    bCtx.fillStyle = '#808080'; // Neutral 50% grey
    bCtx.fillRect(0, 0, 512, 512);

    const bEqY = 256;
    // Deep equator groove seams
    bCtx.fillStyle = '#202020';
    bCtx.fillRect(0, bEqY - 24, 512, 4);
    bCtx.fillRect(0, bEqY + 22, 512, 4);
    bCtx.fillStyle = '#e8e8e8';
    bCtx.fillRect(0, bEqY - 26, 512, 2);
    bCtx.fillRect(0, bEqY + 26, 512, 2);

    // Meridian grooves
    const bMeridians = [0, 128, 256, 384];
    for (const bmx of bMeridians) {
      bCtx.fillStyle = '#202020';
      bCtx.fillRect(bmx - 4, 0, 8, 512);
      bCtx.fillStyle = '#e8e8e8';
      bCtx.fillRect(bmx - 5, 0, 1, 512);
      bCtx.fillRect(bmx + 4, 0, 1, 512);
    }

    // Raised bump rivets
    for (let bx = 8; bx < 512; bx += 24) {
      bCtx.fillStyle = '#ffffff';
      bCtx.beginPath();
      bCtx.arc(bx, bEqY - 18, 2.5, 0, Math.PI * 2);
      bCtx.arc(bx, bEqY + 18, 2.5, 0, Math.PI * 2);
      bCtx.fill();
    }

    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;

    return {
      map: diffuseTexture,
      roughnessMap: roughnessTexture,
      bumpMap: bumpTexture
    };
  }

  /**
   * Generates dark reinforced concrete wall textures with aggregate grain,
   * damp streaks, seams, metal trim reinforcement and chips.
   */
  static createConcreteWallTextures() {
    const width = 1024;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Base concrete dark tone
    ctx.fillStyle = '#3a3d40';
    ctx.fillRect(0, 0, width, height);

    // Fine porous noise / aggregate
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 32;
      data[i] = Math.min(Math.max(data[i] + noise, 0), 255);
      data[i + 1] = Math.min(Math.max(data[i + 1] + noise, 0), 255);
      data[i + 2] = Math.min(Math.max(data[i + 2] + noise, 0), 255);
    }
    ctx.putImageData(imgData, 0, 0);

    // Horizontal concrete form-work lines (cast concrete panels)
    ctx.strokeStyle = '#222426';
    ctx.lineWidth = 4;
    for (let y = 128; y < height; y += 256) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Formwork tie-rod holes with rusted staining
      for (let x = 64; x < width; x += 192) {
        ctx.fillStyle = '#1a1b1d';
        ctx.beginPath();
        ctx.arc(x, y - 24, 7, 0, Math.PI * 2);
        ctx.fill();

        // Rust drip
        const rustGrad = ctx.createLinearGradient(x, y - 24, x, y + 45);
        rustGrad.addColorStop(0, 'rgba(110, 55, 30, 0.45)');
        rustGrad.addColorStop(1, 'rgba(80, 45, 25, 0)');
        ctx.fillStyle = rustGrad;
        ctx.fillRect(x - 5, y - 24, 10, 60);
      }
    }

    // Weathered water stains and grime gradients
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * width;
      const w = 40 + Math.random() * 90;
      const grad = ctx.createLinearGradient(x, 0, x, height);
      grad.addColorStop(0, 'rgba(20, 22, 24, 0.5)');
      grad.addColorStop(0.3 + Math.random() * 0.4, 'rgba(30, 32, 35, 0.2)');
      grad.addColorStop(1, 'rgba(15, 17, 19, 0.7)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, w, height);
    }

    // Metal bottom bumper / skirting plate
    const bottomSkirtingHeight = 75;
    const skirtGrad = ctx.createLinearGradient(0, height - bottomSkirtingHeight, 0, height);
    skirtGrad.addColorStop(0, '#2b2d30');
    skirtGrad.addColorStop(0.5, '#404449');
    skirtGrad.addColorStop(1, '#1e2022');
    ctx.fillStyle = skirtGrad;
    ctx.fillRect(0, height - bottomSkirtingHeight, width, bottomSkirtingHeight);

    // Skirting rivets
    ctx.fillStyle = '#7a8087';
    for (let x = 32; x < width; x += 64) {
      ctx.beginPath();
      ctx.arc(x, height - bottomSkirtingHeight / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const diffuseTexture = new THREE.CanvasTexture(canvas);
    diffuseTexture.wrapS = THREE.RepeatWrapping;
    diffuseTexture.wrapT = THREE.RepeatWrapping;

    // Concrete Bump / Normal Map
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bCtx = bumpCanvas.getContext('2d');
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 512, 512);

    const bImg = bCtx.getImageData(0, 0, 512, 512);
    for (let i = 0; i < bImg.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 50;
      bImg.data[i] = Math.min(Math.max(128 + n, 0), 255);
      bImg.data[i + 1] = Math.min(Math.max(128 + n, 0), 255);
      bImg.data[i + 2] = Math.min(Math.max(128 + n, 0), 255);
    }
    bCtx.putImageData(bImg, 0, 0);

    // Deep groove seams in bump
    bCtx.strokeStyle = '#202020';
    bCtx.lineWidth = 4;
    for (let y = 64; y < 512; y += 128) {
      bCtx.beginPath();
      bCtx.moveTo(0, y);
      bCtx.lineTo(512, y);
      bCtx.stroke();
    }

    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;

    return {
      map: diffuseTexture,
      bumpMap: bumpTexture
    };
  }

  /**
   * Generates heavy industrial stone/concrete floor tile textures with expansion joints
   */
  static createFloorTextures() {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base concrete floor tone
    ctx.fillStyle = '#2d3135';
    ctx.fillRect(0, 0, size, size);

    // Fine speckle noise
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 24;
      data[i] = Math.min(Math.max(data[i] + n, 0), 255);
      data[i + 1] = Math.min(Math.max(data[i + 1] + n, 0), 255);
      data[i + 2] = Math.min(Math.max(data[i + 2] + n, 0), 255);
    }
    ctx.putImageData(imgData, 0, 0);

    // Heavy slab grid lines
    ctx.strokeStyle = '#181a1c';
    ctx.lineWidth = 6;
    for (let p = 0; p <= size; p += 256) {
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(size, p);
      ctx.stroke();
    }

    // Subtle tire/ball scuff marks and oil smudges
    for (let i = 0; i < 25; i++) {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const rad = 25 + Math.random() * 80;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      grad.addColorStop(0, 'rgba(15, 17, 19, 0.4)');
      grad.addColorStop(1, 'rgba(45, 49, 53, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    const diffuse = new THREE.CanvasTexture(canvas);
    diffuse.wrapS = THREE.RepeatWrapping;
    diffuse.wrapT = THREE.RepeatWrapping;

    // Floor Roughness Canvas
    const rCanvas = document.createElement('canvas');
    rCanvas.width = 512;
    rCanvas.height = 512;
    const rCtx = rCanvas.getContext('2d');
    rCtx.fillStyle = '#b0b0b0'; // Concrete is fairly rough (~0.7)
    rCtx.fillRect(0, 0, 512, 512);

    // Floor Bump Map
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 512;
    bCanvas.height = 512;
    const bCtx = bCanvas.getContext('2d');
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 512, 512);

    bCtx.strokeStyle = '#303030';
    bCtx.lineWidth = 5;
    for (let p = 0; p <= 512; p += 128) {
      bCtx.beginPath();
      bCtx.moveTo(p, 0);
      bCtx.lineTo(p, 512);
      bCtx.stroke();

      bCtx.beginPath();
      bCtx.moveTo(0, p);
      bCtx.lineTo(512, p);
      bCtx.stroke();
    }

    const bump = new THREE.CanvasTexture(bCanvas);
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;

    return {
      map: diffuse,
      bumpMap: bump
    };
  }

  /**
   * Generates industrial metal ramp / catwalk texture with hazard chevron borders
   */
  static createMetalRampTextures() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Diamond tread base metal
    ctx.fillStyle = '#3a3f45';
    ctx.fillRect(0, 0, size, size);

    // Non-slip diamond pattern
    ctx.strokeStyle = '#525960';
    ctx.lineWidth = 2;
    for (let y = -size; y < size * 2; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, y + size);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    // Yellow & Black hazard border stripes on sides
    const stripeWidth = 48;
    const drawHazardStripe = (startX) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(startX, 0, stripeWidth, size);
      ctx.clip();

      ctx.fillStyle = '#e6af19';
      ctx.fillRect(startX, 0, stripeWidth, size);

      ctx.fillStyle = '#1c1e20';
      ctx.lineWidth = 14;
      for (let y = -stripeWidth * 2; y < size + stripeWidth * 2; y += 28) {
        ctx.beginPath();
        ctx.moveTo(startX - 10, y);
        ctx.lineTo(startX + stripeWidth + 10, y + stripeWidth);
        ctx.lineTo(startX + stripeWidth + 10, y + stripeWidth + 14);
        ctx.lineTo(startX - 10, y + 14);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    };

    drawHazardStripe(0);
    drawHazardStripe(size - stripeWidth);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Generates high-dynamic range environment reflections for the metal ball
   * Uses an equirectangular canvas rendering of an industrial testing hanger
   */
  static createIndustrialEnvironmentMap(renderer) {
    const width = 2048;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Sky / ceiling dark gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#10141a');      // Top roof
    skyGrad.addColorStop(0.48, '#262d36');   // Horizon upper
    skyGrad.addColorStop(0.52, '#181b20');   // Horizon lower
    skyGrad.addColorStop(1, '#0c0e11');      // Ground
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Industrial overhead tubular fluorescent light strips
    for (let x = 150; x < width; x += 320) {
      const lightGrad = ctx.createLinearGradient(x - 40, 60, x + 40, 220);
      lightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      lightGrad.addColorStop(0.5, 'rgba(200, 230, 255, 0.8)');
      lightGrad.addColorStop(1, 'rgba(100, 160, 240, 0)');

      ctx.fillStyle = lightGrad;
      ctx.fillRect(x - 30, 60, 60, 160);

      // Bright core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 4, 80, 8, 120);
    }

    // Warm tungsten sodium vapor spotlight fixtures
    const warmLights = [width * 0.22, width * 0.65, width * 0.88];
    warmLights.forEach(x => {
      const grad = ctx.createRadialGradient(x, 260, 5, x, 260, 180);
      grad.addColorStop(0, '#fff4d6');
      grad.addColorStop(0.2, '#ffaa44');
      grad.addColorStop(0.6, 'rgba(180, 80, 20, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, 260, 180, 0, Math.PI * 2);
      ctx.fill();
    });

    // Metallic structural girders silhouette on ceiling
    ctx.strokeStyle = '#111417';
    ctx.lineWidth = 12;
    for (let x = 0; x < width; x += 180) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 90, 480);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + 90, 0);
      ctx.lineTo(x, 480);
      ctx.stroke();
    }
    // Horizontal girder
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(0, 240);
    ctx.lineTo(width, 240);
    ctx.stroke();

    const envTexture = new THREE.CanvasTexture(canvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;

    // Generate PMREM for physical PBR roughness response
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const renderTarget = pmremGenerator.fromEquirectangular(envTexture);
    pmremGenerator.dispose();

    return renderTarget.texture;
  }
}

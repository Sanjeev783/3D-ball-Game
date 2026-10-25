/**
 * BallSkins.js
 * Definitions and procedural texture generation for customizable ball skins:
 * 1. CHROME ALLOY (Default polished industrial split steel with racing stripes)
 * 2. CARBON FIBER (Dark woven composite with neon green racing accents)
 * 3. GOLDEN SPHERE (Brushed luxury titanium gold with engraved circuit lines)
 * 4. CYBER MAGENTA (Synthwave dark chrome with glowing neon pink & violet accents)
 * 5. TOXIC REACTOR (Industrial hazard yellow and matte radioactive radiation emblems)
 * 6. PLASMA VOID (Deep space cobalt blue, stellar dust, and cyan energy rings)
 */

import * as THREE from 'three';

export const BALL_SKINS = [
  {
    id: 'chrome',
    name: 'CHROME ALLOY',
    tag: 'FACTORY SPEC',
    accentColor: '#00f5d4',
    previewColor: '#94a3b8',
    metalness: 0.78,
    roughness: 0.24,
    bumpScale: 0.035,
    envMapIntensity: 1.45,
    colors: {
      top: '#1e242c',
      bottom: '#dbe2ea',
      stripe1: '#ff6b35',
      stripe2: '#00f5d4',
      badge: '#00f5d4'
    }
  },
  {
    id: 'carbon',
    name: 'CARBON WEAVE',
    tag: 'ULTRALIGHT',
    accentColor: '#39ff14',
    previewColor: '#1a1f26',
    metalness: 0.45,
    roughness: 0.38,
    bumpScale: 0.045,
    envMapIntensity: 1.2,
    colors: {
      top: '#121417',
      bottom: '#181c22',
      stripe1: '#39ff14',
      stripe2: '#00b4d8',
      badge: '#39ff14'
    }
  },
  {
    id: 'gold',
    name: 'GOLDEN SPHERE',
    tag: 'LUXURY TITANIUM',
    accentColor: '#ffd700',
    previewColor: '#e6b800',
    metalness: 0.92,
    roughness: 0.18,
    bumpScale: 0.025,
    envMapIntensity: 1.6,
    colors: {
      top: '#5a4208',
      bottom: '#d4af37',
      stripe1: '#fff3b0',
      stripe2: '#b8860b',
      badge: '#ffd700'
    }
  },
  {
    id: 'cyber',
    name: 'CYBER MAGENTA',
    tag: 'SYNTH RUNNER',
    accentColor: '#ff007f',
    previewColor: '#ff007f',
    metalness: 0.82,
    roughness: 0.22,
    bumpScale: 0.038,
    envMapIntensity: 1.5,
    colors: {
      top: '#1c0b24',
      bottom: '#3a1347',
      stripe1: '#ff007f',
      stripe2: '#7b2cbf',
      badge: '#ff007f'
    }
  },
  {
    id: 'toxic',
    name: 'TOXIC REACTOR',
    tag: 'BIOHAZARD',
    accentColor: '#ffee00',
    previewColor: '#d4a017',
    metalness: 0.65,
    roughness: 0.35,
    bumpScale: 0.042,
    envMapIntensity: 1.3,
    colors: {
      top: '#1c1b0c',
      bottom: '#f4d03f',
      stripe1: '#111111',
      stripe2: '#ffee00',
      badge: '#ffee00'
    }
  },
  {
    id: 'plasma',
    name: 'PLASMA VOID',
    tag: 'DEEP SPACE',
    accentColor: '#00d2ff',
    previewColor: '#0077b6',
    metalness: 0.88,
    roughness: 0.19,
    bumpScale: 0.032,
    envMapIntensity: 1.55,
    colors: {
      top: '#050c1e',
      bottom: '#102a5c',
      stripe1: '#00d2ff',
      stripe2: '#3a0ca3',
      badge: '#00d2ff'
    }
  }
];

export class SkinGenerator {
  /**
   * Generates procedural PBR diffuse, roughness, and bump maps for a specific ball skin
   */
  static generateSkinTextures(skin) {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = size;
    roughCanvas.height = size;
    const rCtx = roughCanvas.getContext('2d');

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bCtx = bumpCanvas.getContext('2d');

    // 1. Dual-Tone Hemispheres
    ctx.fillStyle = skin.colors.top;
    ctx.fillRect(0, 0, size, size * 0.5);
    ctx.fillStyle = skin.colors.bottom;
    ctx.fillRect(0, size * 0.5, size, size * 0.5);

    // Roughness base
    rCtx.fillStyle = '#30343a';
    rCtx.fillRect(0, 0, size, size);

    // Bump base (neutral 128)
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    // 2. Texture pattern overlay based on skin ID
    if (skin.id === 'carbon') {
      // Carbon fiber weave check pattern
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      const weaveStep = 16;
      for (let y = 0; y < size; y += weaveStep) {
        for (let x = 0; x < size; x += weaveStep) {
          if ((x / weaveStep + y / weaveStep) % 2 === 0) {
            ctx.fillRect(x, y, weaveStep, weaveStep);
            bCtx.fillStyle = '#909090';
            bCtx.fillRect(x, y, weaveStep, weaveStep);
          }
        }
      }
    } else {
      // Machining lathe / brushed metallic rings
      for (let y = 0; y < size; y += 3) {
        const isTop = y < size * 0.5;
        const noise = (Math.random() - 0.5) * 24;
        ctx.fillStyle = `rgba(${128 + noise}, ${128 + noise}, ${128 + noise}, 0.14)`;
        ctx.fillRect(0, y, size, 2);
      }
    }

    // Micro scratches
    ctx.lineWidth = 1.0;
    for (let i = 0; i < 260; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const len = 8 + Math.random() * 26;
      const angle = Math.random() * Math.PI * 2;
      ctx.strokeStyle = y < size * 0.5
        ? 'rgba(255, 255, 255, 0.09)'
        : 'rgba(20, 24, 30, 0.12)';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }

    // 3. Four Vertical Carbon Meridian Seams
    const meridians = [0, size * 0.25, size * 0.5, size * 0.75];
    for (const mx of meridians) {
      ctx.fillStyle = '#0a0d10';
      ctx.fillRect(mx - 8, 0, 16, size);

      ctx.fillStyle = skin.colors.badge;
      ctx.fillRect(mx - 2, 0, 4, size);

      // Bump grooves
      bCtx.fillStyle = '#404040';
      bCtx.fillRect(mx - 8, 0, 16, size);

      // Roughness seam
      rCtx.fillStyle = '#858585';
      rCtx.fillRect(mx - 8, 0, 16, size);
    }

    // 4. Equator Racing Band
    const eqY = size * 0.5;
    ctx.fillStyle = '#0a0e12';
    ctx.fillRect(0, eqY - 48, size, 96);

    ctx.fillStyle = skin.colors.stripe1;
    ctx.fillRect(0, eqY - 24, size, 48);

    ctx.fillStyle = skin.colors.stripe2;
    ctx.fillRect(0, eqY - 8, size, 16);

    rCtx.fillStyle = '#7a7a7a';
    rCtx.fillRect(0, eqY - 48, size, 96);

    // Directional Chevrons
    for (let x = 0; x < size; x += 64) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x + 12, eqY - 18);
      ctx.lineTo(x + 36, eqY);
      ctx.lineTo(x + 12, eqY + 18);
      ctx.lineTo(x + 22, eqY);
      ctx.closePath();
      ctx.fill();
    }

    // 5. Quadrant Emblems
    // Q1 Target Emblem
    ctx.fillStyle = skin.colors.badge;
    ctx.beginPath();
    ctx.arc(128, 256, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0d10';
    ctx.beginPath();
    ctx.arc(128, 256, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(128, 256, 12, 0, Math.PI * 2);
    ctx.fill();

    // Q2 Racing Number
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 68px "Orbitron", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('07', 384, 256);

    // Q3 Stencil Hazard or Stars
    ctx.fillStyle = skin.colors.badge;
    ctx.font = '900 48px "Orbitron", monospace, sans-serif';
    ctx.fillText('TITAN', 640, 256);

    // Q4 Hexagon Tech Crest
    ctx.strokeStyle = skin.colors.badge;
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let a = 0; a < 6; a++) {
      const angle = (a * Math.PI) / 3;
      const hx = 896 + Math.cos(angle) * 48;
      const hy = 256 + Math.sin(angle) * 48;
      if (a === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();

    // 6. 3D Rivets
    const drawRivet = (rx, ry) => {
      ctx.fillStyle = '#05070a';
      ctx.beginPath();
      ctx.arc(rx, ry, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = skin.previewColor;
      ctx.beginPath();
      ctx.arc(rx, ry, 4.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(rx - 1.5, ry - 1.5, 1.8, 0, Math.PI * 2);
      ctx.fill();

      bCtx.fillStyle = '#d0d0d0';
      bCtx.beginPath();
      bCtx.arc(rx, ry, 5, 0, Math.PI * 2);
      bCtx.fill();
    };

    for (let x = 16; x < size; x += 48) {
      drawRivet(x, eqY - 36);
      drawRivet(x, eqY + 36);
    }

    // Polar caps
    ctx.fillStyle = '#0d1014';
    ctx.fillRect(0, 0, size, 24);
    ctx.fillRect(0, size - 24, size, 24);
    ctx.fillStyle = skin.colors.badge;
    ctx.fillRect(0, 22, size, 3);
    ctx.fillRect(0, size - 25, size, 3);

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;

    const roughnessMap = new THREE.CanvasTexture(roughCanvas);
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;

    return { map, roughnessMap, bumpMap };
  }
}

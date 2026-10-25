/**
 * DustAtmosphere.js
 * Creates ambient floating dust motes drifting through light beams
 * and impact concrete dust puffs on hard collisions.
 */

import * as THREE from 'three';

export class DustAtmosphere {
  constructor(scene, count = 900) {
    this.scene = scene;
    this.count = count;
    this.range = 50.0; // Volume box around the player

    this.positions = new Float32Array(count * 3);
    this.velocities = [];

    this._initDustParticles();
  }

  _initDustParticles() {
    // Generate soft circular dust particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(230, 240, 255, 0.7)');
    grad.addColorStop(0.4, 'rgba(200, 220, 245, 0.25)');
    grad.addColorStop(1, 'rgba(200, 220, 245, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const dustTexture = new THREE.CanvasTexture(canvas);

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      this.positions[idx] = (Math.random() - 0.5) * this.range;
      this.positions[idx + 1] = Math.random() * 8.0;
      this.positions[idx + 2] = (Math.random() - 0.5) * this.range;

      this.velocities.push({
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.15,
        vz: (Math.random() - 0.5) * 0.25,
        phase: Math.random() * Math.PI * 2
      });
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.14,
      map: dustTexture,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  /**
   * Updates floating dust motes around the player ball's current location
   */
  update(ballPos, time, delta) {
    const halfRange = this.range / 2;

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      const v = this.velocities[i];

      // Subtle air current undulation
      const driftX = v.vx + Math.sin(time * 0.5 + v.phase) * 0.1;
      const driftY = v.vy + Math.cos(time * 0.4 + v.phase) * 0.08;
      const driftZ = v.vz + Math.cos(time * 0.5 + v.phase) * 0.1;

      this.positions[idx] += driftX * delta;
      this.positions[idx + 1] += driftY * delta;
      this.positions[idx + 2] += driftZ * delta;

      // Wrap particles inside floating box around ball position
      if (this.positions[idx] < ballPos.x - halfRange) this.positions[idx] += this.range;
      if (this.positions[idx] > ballPos.x + halfRange) this.positions[idx] -= this.range;

      if (this.positions[idx + 1] < 0.2) this.positions[idx + 1] = 7.5;
      if (this.positions[idx + 1] > 8.0) this.positions[idx + 1] = 0.3;

      if (this.positions[idx + 2] < ballPos.z - halfRange) this.positions[idx + 2] += this.range;
      if (this.positions[idx + 2] > ballPos.z + halfRange) this.positions[idx + 2] -= this.range;
    }

    this.geometry.attributes.position.needsUpdate = true;
  }
}

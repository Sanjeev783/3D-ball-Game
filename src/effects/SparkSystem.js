/**
 * SparkSystem.js
 * High-performance, physically accurate spark & impact flash effect system.
 * Generates directional sparks along collision normals with gravity, air resistance,
 * ground bounce, incandescent cooling color ramp, and transient impact flash point light.
 */

import * as THREE from 'three';

export class SparkSystem {
  constructor(scene, maxParticles = 600) {
    this.scene = scene;
    this.maxParticles = maxParticles;

    // Particle pool data
    this.positions = new Float32Array(this.maxParticles * 3);
    this.velocities = new Float32Array(this.maxParticles * 3);
    this.lifetimes = new Float32Array(this.maxParticles);
    this.maxLifetimes = new Float32Array(this.maxParticles);
    this.sizes = new Float32Array(this.maxParticles);
    this.activeCount = 0;

    // Color gradient definitions
    this.colorWhite = new THREE.Color(0xffffff);
    this.colorYellow = new THREE.Color(0xffe066);
    this.colorOrange = new THREE.Color(0xff6b35);
    this.colorRed = new THREE.Color(0x9a031e);
    this.tempColor = new THREE.Color();

    this._createParticleMesh();
    this._createFlashLight();
  }

  _createParticleMesh() {
    // Generate circular spark glow texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.25, 'rgba(255, 220, 150, 0.9)');
    grad.addColorStop(0.6, 'rgba(255, 110, 40, 0.4)');
    grad.addColorStop(1, 'rgba(200, 30, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const sparkTexture = new THREE.CanvasTexture(canvas);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    // Custom colors per particle
    this.colors = new Float32Array(this.maxParticles * 3);
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.16,
      map: sparkTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      depthWrite: false
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  _createFlashLight() {
    // Transient flash point light for hard impacts
    this.flashLight = new THREE.PointLight(0xffeedd, 0, 10, 2.0);
    this.scene.add(this.flashLight);
    this.flashDuration = 0.08;
    this.flashTimer = 0;
  }

  /**
   * Spawns a directional shower of sparks from an exact contact point
   * @param {Object} impact - { point, normal, velocity, impactForce }
   */
  spawnSparks(impact) {
    const { point, normal, velocity } = impact;

    // Thresholds:
    // < 2.5 m/s: No sparks
    // 2.5 - 6.0 m/s: Medium (18 - 35 sparks)
    // > 6.0 m/s: Heavy (60 - 120 sparks)
    if (velocity < 2.5) return;

    const isHighImpact = velocity >= 6.0;
    const sparkCount = isHighImpact
      ? Math.floor(65 + Math.random() * 55)
      : Math.floor(18 + Math.random() * 20);

    // Collision normal vector (pointing away from wall)
    const norm = new THREE.Vector3(normal.x, normal.y, normal.z).normalize();

    // Trigger bright flash light at exact collision point
    this.flashLight.position.set(point.x, point.y, point.z);
    this.flashLight.intensity = isHighImpact ? 24.0 : 10.0;
    this.flashTimer = isHighImpact ? 0.09 : 0.05;

    for (let i = 0; i < sparkCount; i++) {
      if (this.activeCount >= this.maxParticles) break;

      const idx = this.activeCount;
      const pIdx = idx * 3;

      // Start at exact collision contact point + tiny normal offset to avoid inside-wall spawn
      this.positions[pIdx] = point.x + norm.x * 0.05;
      this.positions[pIdx + 1] = point.y + norm.y * 0.05;
      this.positions[pIdx + 2] = point.z + norm.z * 0.05;

      // Realistic ejection physics:
      // Cone around reflection normal + randomized velocity magnitude
      const spreadAngle = 0.75; // cone spread radians
      const randomDir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();

      const sparkDir = norm.clone().lerp(randomDir, spreadAngle).normalize();
      // Ensure spark moves outward from the wall
      if (sparkDir.dot(norm) < 0.1) {
        sparkDir.addScaledVector(norm, 0.4).normalize();
      }

      const sparkSpeed = (velocity * 0.8 + 3.0 + Math.random() * 10.0);
      this.velocities[pIdx] = sparkDir.x * sparkSpeed;
      this.velocities[pIdx + 1] = sparkDir.y * sparkSpeed;
      this.velocities[pIdx + 2] = sparkDir.z * sparkSpeed;

      const lifetime = 0.25 + Math.random() * 0.45;
      this.lifetimes[idx] = lifetime;
      this.maxLifetimes[idx] = lifetime;
      this.sizes[idx] = 0.08 + Math.random() * 0.12;

      // Initial white-hot color
      this.colors[pIdx] = 1.0;
      this.colors[pIdx + 1] = 1.0;
      this.colors[pIdx + 2] = 1.0;

      this.activeCount++;
    }
  }

  /**
   * Updates spark particle physics: gravity, drag, ground bounce, color cooling ramp
   */
  update(delta) {
    // 1. Update Flash Light decay
    if (this.flashTimer > 0) {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) {
        this.flashLight.intensity = 0;
      } else {
        this.flashLight.intensity *= Math.max(0, 1.0 - delta * 25.0);
      }
    }

    if (this.activeCount === 0) return;

    const gravity = -20.0; // Gravity pulling sparks downward
    const airDrag = 0.94;  // Atmospheric drag

    let writeIdx = 0;
    for (let readIdx = 0; readIdx < this.activeCount; readIdx++) {
      this.lifetimes[readIdx] -= delta;

      if (this.lifetimes[readIdx] > 0) {
        const rP = readIdx * 3;
        const wP = writeIdx * 3;

        // Apply physics
        this.velocities[rP + 1] += gravity * delta;
        this.velocities[rP] *= airDrag;
        this.velocities[rP + 1] *= airDrag;
        this.velocities[rP + 2] *= airDrag;

        let px = this.positions[rP] + this.velocities[rP] * delta;
        let py = this.positions[rP + 1] + this.velocities[rP + 1] * delta;
        let pz = this.positions[rP + 2] + this.velocities[rP + 2] * delta;

        // Ground bounce
        if (py <= 0.05) {
          py = 0.05;
          this.velocities[rP + 1] = -this.velocities[rP + 1] * 0.42; // Restitution
          this.velocities[rP] *= 0.7; // Ground friction
          this.velocities[rP + 2] *= 0.7;
        }

        this.positions[wP] = px;
        this.positions[wP + 1] = py;
        this.positions[wP + 2] = pz;

        this.velocities[wP] = this.velocities[rP];
        this.velocities[wP + 1] = this.velocities[rP + 1];
        this.velocities[wP + 2] = this.velocities[rP + 2];

        this.lifetimes[writeIdx] = this.lifetimes[readIdx];
        this.maxLifetimes[writeIdx] = this.maxLifetimes[readIdx];
        this.sizes[writeIdx] = this.sizes[readIdx];

        // Incandescent temperature cooling color ramp:
        // Life 1.0 -> 0.75: White-hot
        // Life 0.75 -> 0.4: Bright gold-yellow
        // Life 0.4 -> 0.15: Fiery orange
        // Life 0.15 -> 0.0: Deep cooling red
        const lifeFrac = this.lifetimes[writeIdx] / this.maxLifetimes[writeIdx];
        if (lifeFrac > 0.7) {
          this.tempColor.copy(this.colorWhite).lerp(this.colorYellow, (1.0 - lifeFrac) / 0.3);
        } else if (lifeFrac > 0.35) {
          this.tempColor.copy(this.colorYellow).lerp(this.colorOrange, (0.7 - lifeFrac) / 0.35);
        } else {
          this.tempColor.copy(this.colorOrange).lerp(this.colorRed, (0.35 - lifeFrac) / 0.35);
        }

        // Fade brightness towards end of life
        const brightness = Math.min(lifeFrac * 1.5, 1.0);
        this.colors[wP] = this.tempColor.r * brightness;
        this.colors[wP + 1] = this.tempColor.g * brightness;
        this.colors[wP + 2] = this.tempColor.b * brightness;

        writeIdx++;
      }
    }

    this.activeCount = writeIdx;

    // Zero out remaining positions so they don't render
    for (let i = this.activeCount; i < this.maxParticles; i++) {
      const pIdx = i * 3;
      this.positions[pIdx] = 0;
      this.positions[pIdx + 1] = -9999;
      this.positions[pIdx + 2] = 0;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }
}

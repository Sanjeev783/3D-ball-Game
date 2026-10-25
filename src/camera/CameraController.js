/**
 * CameraController.js
 * Cinematic 3rd-person follow camera for the 3D Metal Ball Maze.
 * Features:
 * - Smooth positional and rotational lag interpolation
 * - Velocity look-ahead anticipating upcoming turns and corridors
 * - Manual mouse orbit (drag to look around, scroll to zoom)
 * - Auto-aligning follow mode behind ball trajectory
 * - Wall occlusion raycasting (never clips into walls)
 * - Trauma-based dynamic camera shake on physical wall impacts
 */

import * as THREE from 'three';

export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Target to follow
    this.target = new THREE.Vector3();
    this.targetLookAhead = new THREE.Vector3();

    // Spherical coordinates - Elevated third-person view for clear maze navigation
    this.distance = 13.5;
    this.targetDistance = 13.5;
    this.minDistance = 4.0;
    this.maxDistance = 26.0;

    this.yaw = 0;       // Horizontal orbit angle
    this.targetYaw = 0;
    this.pitch = 1.02;  // High-angle elevation (~58.5 deg) for full maze overview
    this.targetPitch = 1.02;
    this.minPitch = 0.35;
    this.maxPitch = 1.50; // Allows up to near-top-down tactical angle

    // Smoothing speeds: stable responsive follow without twitching
    this.posLerpSpeed = 8.0;
    this.rotLerpSpeed = 6.0;
    this.autoAlignStrength = 0.0; // Disabled auto-alignment so camera doesn't spin automatically

    // Mouse control state
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.mouseSensitivity = 0.003;

    // Trauma camera shake
    this.trauma = 0.0;
    this.shakeTime = 0.0;
    this.shakeOffset = new THREE.Vector3();

    // Raycaster for camera wall collision prevention
    this.raycaster = new THREE.Raycaster();
    this.collisionObjects = [];
    this.currentEffectiveDist = this.distance;

    this._bindEvents();
  }

  setCollisionObjects(objects) {
    this.collisionObjects = objects;
  }

  _bindEvents() {
    this.domElement.addEventListener('mousedown', (e) => {
      // Allow orbit on left or right click
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.targetYaw -= deltaX * this.mouseSensitivity;
      this.targetPitch += deltaY * this.mouseSensitivity;
      this.targetPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.targetPitch));

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    this.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.targetDistance += e.deltaY * 0.005;
      this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
    }, { passive: false });

    // Touch support for mobile / touchpads
    let touchStartX = 0;
    let touchStartY = 0;
    this.domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    });

    this.domElement.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        this.targetYaw -= dx * 0.004;
        this.targetPitch += dy * 0.004;
        this.targetPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.targetPitch));
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    });
  }

  /**
   * Adds trauma from a physical impact to trigger dynamic camera shake
   * @param {number} amount - 0.0 to 1.0 trauma score
   */
  addTrauma(amount) {
    this.trauma = Math.min(0.6, this.trauma + amount * 0.5);
  }

  /**
   * Updates camera position and orientation every frame with rock-solid stability.
   * Supports smooth right-analog-stick camera look from game controllers.
   */
  update(ballPosition, ballVelocity, delta, cameraLook = null) {
    this.shakeTime += delta;

    // Apply right analog stick input from game controller
    if (cameraLook) {
      if (Math.abs(cameraLook.x) > 0.001) {
        this.targetYaw -= cameraLook.x * delta * 2.4;
      }
      if (Math.abs(cameraLook.y) > 0.001) {
        this.targetPitch += cameraLook.y * delta * 1.8;
        this.targetPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.targetPitch));
      }
    }

    // 1. Decay trauma over time
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - delta * 3.0);
    }
    const shakeIntensity = this.trauma * this.trauma;

    // Subtle micro vibration offset on impact — no violent jarring
    if (shakeIntensity > 0.001) {
      const freq = 36.0;
      this.shakeOffset.set(
        Math.sin(this.shakeTime * freq) * shakeIntensity * 0.08,
        Math.cos(this.shakeTime * freq * 1.15) * shakeIntensity * 0.06,
        Math.sin(this.shakeTime * freq * 0.85) * shakeIntensity * 0.06
      );
    } else {
      this.shakeOffset.set(0, 0, 0);
    }

    // 2. Stably follow ball position directly (no velocity look-ahead twitching)
    this.target.lerp(ballPosition, Math.min(1.0, delta * this.posLerpSpeed));

    // 3. Smooth manual rotation (yaw and pitch only change when user drags or moves right stick)
    this.yaw += (this.targetYaw - this.yaw) * Math.min(1.0, delta * this.rotLerpSpeed);
    this.pitch += (this.targetPitch - this.pitch) * Math.min(1.0, delta * this.rotLerpSpeed);
    this.distance += (this.targetDistance - this.distance) * Math.min(1.0, delta * 6.0);

    // 4. Smooth occlusion raycasting
    let targetDist = this.distance;
    const horizDist = targetDist * Math.cos(this.pitch);
    const vertDist = targetDist * Math.sin(this.pitch);

    const desiredCamPos = new THREE.Vector3(
      this.target.x + horizDist * Math.sin(this.yaw),
      this.target.y + vertDist + 2.0,
      this.target.z + horizDist * Math.cos(this.yaw)
    );

    if (this.collisionObjects.length > 0) {
      const rayDir = desiredCamPos.clone().sub(this.target).normalize();
      this.raycaster.set(this.target, rayDir);
      this.raycaster.near = 1.0;
      this.raycaster.far = targetDist;

      const intersects = this.raycaster.intersectObjects(this.collisionObjects, false);
      if (intersects.length > 0 && intersects[0].distance < targetDist && intersects[0].distance > 2.5) {
        targetDist = Math.max(this.minDistance, intersects[0].distance - 0.4);
      }
    }

    // Smoothly transition effective distance so walls never snap the camera
    this.currentEffectiveDist += (targetDist - this.currentEffectiveDist) * Math.min(1.0, delta * 5.0);

    const finalHorizDist = this.currentEffectiveDist * Math.cos(this.pitch);
    const finalVertDist = this.currentEffectiveDist * Math.sin(this.pitch);

    const stableCamPos = new THREE.Vector3(
      this.target.x + finalHorizDist * Math.sin(this.yaw),
      this.target.y + finalVertDist + 2.0,
      this.target.z + finalHorizDist * Math.cos(this.yaw)
    );

    // Apply stable camera position with subtle micro-shake
    this.camera.position.copy(stableCamPos).add(this.shakeOffset);

    // Lock camera focus squarely on the center of the ball
    const lookTarget = new THREE.Vector3(this.target.x, this.target.y + 0.35, this.target.z);
    this.camera.lookAt(lookTarget);
    this.camera.rotation.z = 0; // Horizon stays level and stable
  }

  getYaw() {
    return this.yaw;
  }
}

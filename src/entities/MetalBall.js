/**
 * MetalBall.js
 * The player's heavy metallic ball with PBR polished steel material,
 * realistic momentum, physical torque-based rolling controls, and synchronized 3D rotation.
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { BALL_SKINS, SkinGenerator } from './BallSkins.js';

export class MetalBall {
  constructor(scene, physicsWorld, envMap, startPosition = new THREE.Vector3(0, 2, 0), radius = 0.75) {
    this.scene = scene;
    this.physics = physicsWorld;
    this.envMap = envMap;
    this.radius = radius;
    this.mass = 8.5; // Heavy 8.5kg solid steel sphere

    this.position = startPosition.clone();
    this.totalDistance = 0;
    this.lastPosition = startPosition.clone();
    this.lastRollingPosition = startPosition.clone();
    this.maxSpeed = 0;
    this.isGrounded = true;
    this.ceilingY = 5.2; // Matches MazeBuilder ceilingHeight

    // Active skin
    this.currentSkinId = 'chrome';

    // Movement control tuning
    this.moveForce = 120.0;  // Linear propulsion force
    this.torqueForce = 85.0; // Rotational torque

    this._createMesh(envMap);
    this._createPhysicsBody();
  }

  _createMesh(envMap) {
    const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
    const skinDef = BALL_SKINS.find(s => s.id === this.currentSkinId) || BALL_SKINS[0];
    const textures = SkinGenerator.generateSkinTextures(skinDef);

    this.material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: skinDef.metalness,
      roughness: skinDef.roughness,
      roughnessMap: textures.roughnessMap,
      bumpMap: textures.bumpMap,
      bumpScale: skinDef.bumpScale,
      map: textures.map,
      envMap: envMap,
      envMapIntensity: skinDef.envMapIntensity
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.set(this.position.x, this.position.y + this.radius, this.position.z);
    this.scene.add(this.mesh);
  }

  /**
   * Dynamically applies a new skin to the metal ball
   */
  setSkin(skinId) {
    const skinDef = BALL_SKINS.find(s => s.id === skinId);
    if (!skinDef) return;
    this.currentSkinId = skinId;

    const textures = SkinGenerator.generateSkinTextures(skinDef);
    this.material.map = textures.map;
    this.material.roughnessMap = textures.roughnessMap;
    this.material.bumpMap = textures.bumpMap;
    this.material.bumpScale = skinDef.bumpScale;
    this.material.metalness = skinDef.metalness;
    this.material.roughness = skinDef.roughness;
    this.material.envMapIntensity = skinDef.envMapIntensity;
    this.material.needsUpdate = true;
  }

  _createPhysicsBody() {
    const shape = new CANNON.Sphere(this.radius);
    this.body = new CANNON.Body({
      mass: this.mass,
      material: this.physics.ballMaterial,
      shape: shape,
      position: new CANNON.Vec3(this.position.x, this.position.y + this.radius, this.position.z),
      linearDamping: 0.12,  // Authentic rolling inertia
      angularDamping: 0.16 // Ground friction rolling resistance
    });

    // CCD continuous collision detection flags
    this.body.ccdSpeedThreshold = 1.0;
    this.body.ccdIterations = 5;

    this.physics.addBody(this.body);
    this.physics.setupBallCollisionListener(this.body);
  }

  /**
   * Applies physics force and torque relative to camera orientation.
   * Includes anti-sticking wall tangential projection so pressing into a wall slides smoothly
   * without magnetizing the ball in an unintended direction.
   * @param {Object} input - { forward: number, right: number, brake: boolean } (-1 to 1)
   * @param {number} cameraYaw - current camera horizontal angle
   */
  applyInput(input, cameraYaw) {
    if (input.brake) {
      this.body.velocity.x *= 0.93;
      this.body.velocity.z *= 0.93;
      this.body.angularVelocity.scale(0.93, this.body.angularVelocity);
    }

    if (input.forward === 0 && input.right === 0) return;

    // Calculate camera-relative forward and right vectors
    const forwardX = -Math.sin(cameraYaw);
    const forwardZ = -Math.cos(cameraYaw);
    const rightX = -Math.sin(cameraYaw - Math.PI / 2);
    const rightZ = -Math.cos(cameraYaw - Math.PI / 2);

    // Desired direction vector in world space
    let dirX = forwardX * input.forward + rightX * input.right;
    let dirZ = forwardZ * input.forward + rightZ * input.right;

    const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
    if (len > 0.001) {
      dirX /= len;
      dirZ /= len;

      // Anti-Wall Magnetism & Ramp Slope Alignment:
      // 1. Wall contact projection: glide tangentially along walls without stickiness.
      // 2. Ramp contact projection: align propulsion force along the ramp's incline for effortless climbing.
      let wallNormalX = 0;
      let wallNormalZ = 0;
      let wallContactCount = 0;

      let rampNormalX = 0;
      let rampNormalY = 0;
      let rampNormalZ = 0;
      let rampContactCount = 0;

      for (const contact of this.physics.world.contacts) {
        if (contact.bi === this.body || contact.bj === this.body) {
          const isBi = contact.bi === this.body;
          const otherBody = isBi ? contact.bj : contact.bi;
          const sType = otherBody.userData?.surfaceType;
          if (sType === 'wall') {
            const nx = isBi ? -contact.ni.x : contact.ni.x;
            const nz = isBi ? -contact.ni.z : contact.ni.z;
            const nLen = Math.hypot(nx, nz);
            if (nLen > 0.3) {
              wallNormalX += nx / nLen;
              wallNormalZ += nz / nLen;
              wallContactCount++;
            }
          } else if (sType === 'ramp') {
            const nx = isBi ? -contact.ni.x : contact.ni.x;
            const ny = isBi ? -contact.ni.y : contact.ni.y;
            const nz = isBi ? -contact.ni.z : contact.ni.z;
            rampNormalX += nx;
            rampNormalY += ny;
            rampNormalZ += nz;
            rampContactCount++;
          }
        }
      }

      if (wallContactCount > 0) {
        const avgNormLen = Math.hypot(wallNormalX, wallNormalZ);
        if (avgNormLen > 0.01) {
          const nx = wallNormalX / avgNormLen;
          const nz = wallNormalZ / avgNormLen;

          // Dot product of input direction with wall normal (points away from wall)
          const dot = dirX * nx + dirZ * nz;

          // If the player is pushing into the wall (dot < 0), subtract the inward component:
          // Result is a clean tangential glide vector parallel to the wall corridor.
          if (dot < 0) {
            dirX = dirX - dot * nx;
            dirZ = dirZ - dot * nz;
            const glideLen = Math.hypot(dirX, dirZ);
            if (glideLen > 0.001) {
              dirX /= glideLen;
              dirZ /= glideLen;
            }
          }
        }
      }

      let fy = 0;
      if (rampContactCount > 0) {
        const rLen = Math.hypot(rampNormalX, rampNormalY, rampNormalZ);
        if (rLen > 0.01) {
          const rnx = rampNormalX / rLen;
          const rny = rampNormalY / rLen;
          const rnz = rampNormalZ / rLen;
          // Project movement direction onto ramp tangent surface for natural incline propulsion
          const dot = dirX * rnx + dirZ * rnz;
          const tx = dirX - dot * rnx;
          const ty = -dot * rny;
          const tz = dirZ - dot * rnz;
          const tLen = Math.hypot(tx, ty, tz);
          if (tLen > 0.001) {
            dirX = tx / tLen;
            fy = (ty / tLen) * this.moveForce;
            dirZ = tz / tLen;
          }
        }
      }

      // 1. Apply directional propulsion force to the center of mass
      const fx = dirX * this.moveForce;
      const fz = dirZ * this.moveForce;
      this.body.applyForce(new CANNON.Vec3(fx, fy, fz), this.body.position);

      // 2. Apply rolling torque perpendicular to movement direction:
      const tx = dirZ * this.torqueForce;
      const tz = -dirX * this.torqueForce;
      this.body.applyTorque(new CANNON.Vec3(tx, 0, tz));
    }
  }

  /**
   * Syncs mesh to physics body, computes authentic rolling rotation,
   * enforces invisible ceiling limit, and tracks telemetry.
   * @param {number} delta - frame time in seconds
   */
  update(delta) {
    // Synchronize 3D mesh position
    this.mesh.position.copy(this.body.position);
    this.position.copy(this.mesh.position);

    // Invisible ceiling hard safety barrier:
    // Prevents the ball from ever penetrating or hopping above the ceiling/wall height
    const maxCenterY = this.ceilingY - this.radius;
    if (this.body.position.y > maxCenterY) {
      this.body.position.y = maxCenterY;
      this.mesh.position.y = maxCenterY;
      if (this.body.velocity.y > 0) {
        this.body.velocity.y = 0;
      }
    }

    // Suppress excessive upward vertical impulses from collisions or ramps
    if (this.body.velocity.y > 2.2) {
      this.body.velocity.y = 2.2;
    }

    // Authentic, non-slip 3D rolling rotation calculated from physical spatial movement:
    // Arc length = distance = radius * angle => angle = distance / radius
    const dx = this.body.position.x - this.lastRollingPosition.x;
    const dy = this.body.position.y - this.lastRollingPosition.y;
    const dz = this.body.position.z - this.lastRollingPosition.z;
    const moveDist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (moveDist > 0.0002 && moveDist < 4.0) {
      // Rotation axis perpendicular to motion direction on the ground plane (or slope):
      // Moving along (dx, dz): rotation axis is (dz, 0, -dx) normalized
      const horizDist = Math.hypot(dx, dz);
      let axis;
      if (horizDist > 0.0001) {
        axis = new THREE.Vector3(dz / horizDist, 0, -dx / horizDist);
      } else {
        axis = new THREE.Vector3(1, 0, 0);
      }

      const angle = moveDist / this.radius;
      const rotQuat = new THREE.Quaternion().setFromAxisAngle(axis, angle);
      this.mesh.quaternion.premultiply(rotQuat);

      // Keep physics body rotation synchronized with visual rolling mesh
      this.body.quaternion.copy(this.mesh.quaternion);
    }
    this.lastRollingPosition.copy(this.body.position);

    // Calculate velocity telemetry
    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;
    const vz = this.body.velocity.z;
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

    if (speed > this.maxSpeed) {
      this.maxSpeed = speed;
    }

    // Distance accumulated
    const dPos = this.position.distanceTo(this.lastPosition);
    if (dPos > 0.001 && dPos < 5.0) { // filter teleport resets
      this.totalDistance += dPos;
    }
    this.lastPosition.copy(this.position);

    // Ground check: check if vertical velocity is near zero or contact with floor
    this.isGrounded = Math.abs(vy) < 1.5;

    return {
      speed: speed,
      position: this.position,
      isGrounded: this.isGrounded,
      totalDistance: this.totalDistance
    };
  }

  /**
   * Teleport / reset ball to starting position
   */
  reset(pos) {
    this.body.position.set(pos.x, pos.y + this.radius + 0.1, pos.z);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.set(0, 0, 0, 1);
    this.lastPosition.copy(this.mesh.position);
    this.lastRollingPosition.copy(this.mesh.position);
    this.totalDistance = 0;
    this.maxSpeed = 0;
  }
}

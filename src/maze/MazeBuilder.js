/**
 * MazeBuilder.js
 * Constructs the physical and visual 3D environment for the maze:
 * - High-detail PBR concrete walls with steel reinforcement I-beams
 * - Multi-level elevated catwalks, bridges, and sloped metal ramps
 * - Atmospheric industrial lighting fixtures (hanging warehouse lamps)
 * - Industrial concrete floor slabs with grime and expansion joints
 * - Launch pad and glowing finish goal zone
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { TextureGenerator } from '../rendering/TextureGenerator.js';

export class MazeBuilder {
  constructor(scene, physicsWorld, cellSize = 6.0) {
    this.scene = scene;
    this.physics = physicsWorld;
    this.cellSize = cellSize;
    this.wallHeight = 5.2;
    this.ceilingHeight = 5.2;
    this.wallThickness = cellSize;
    this.elevatedHeight = 3.2;

    this.meshes = [];
    this.physicsBodies = [];
    this.wallMeshes = [];
    this.decorativeMeshes = [];
    this.lamps = [];
    this.goalPosition = new THREE.Vector3();
    this.goalTriggerRadius = 2.5;

    // Goal visual elements for animation
    this.goalRings = [];
    this.goalLight = null;
    this.goalPillar = null;
  }

  _addMesh(mesh) {
    this.scene.add(mesh);
    this.meshes.push(mesh);
    return mesh;
  }

  _addBody(body, surfaceType = null) {
    if (surfaceType) {
      body.userData = { surfaceType };
    }
    this.physics.addBody(body);
    this.physicsBodies.push(body);
    return body;
  }

  /**
   * Completely tears down and cleans up all level meshes, lights, and physics bodies
   */
  clear() {
    for (const m of this.meshes) {
      this.scene.remove(m);
      if (m.geometry) m.geometry.dispose();
    }
    this.meshes = [];
    this.wallMeshes = [];
    this.decorativeMeshes = [];

    for (const lamp of this.lamps) {
      this.scene.remove(lamp.group);
      this.scene.remove(lamp.light);
      if (lamp.light && lamp.light.target) this.scene.remove(lamp.light.target);
    }
    this.lamps = [];

    for (const r of this.goalRings) {
      this.scene.remove(r.mesh);
      if (r.mesh.geometry) r.mesh.geometry.dispose();
    }
    this.goalRings = [];

    if (this.goalPillar) {
      this.scene.remove(this.goalPillar);
      if (this.goalPillar.geometry) this.goalPillar.geometry.dispose();
      this.goalPillar = null;
    }

    if (this.goalLight) {
      this.scene.remove(this.goalLight);
      this.goalLight = null;
    }

    for (const b of this.physicsBodies) {
      this.physics.world.removeBody(b);
      const idx = this.physics.bodies.indexOf(b);
      if (idx !== -1) this.physics.bodies.splice(idx, 1);
    }
    this.physicsBodies = [];
  }

  /**
   * Builds the complete 3D maze environment from MazeGenerator data
   */
  build(mazeData, levelConfig = null) {
    this.clear();

    const { size, grid, startPos, endPos, ramps, elevatedCells } = mazeData;
    this.mazeSize = size;
    const elevatedSet = new Set(elevatedCells);

    // Textures
    const wallTextures = TextureGenerator.createConcreteWallTextures();
    const floorTextures = TextureGenerator.createFloorTextures();
    const rampTexture = TextureGenerator.createMetalRampTextures();

    // PBR Materials
    const concreteWallMaterial = new THREE.MeshStandardMaterial({
      map: wallTextures.map,
      bumpMap: wallTextures.bumpMap,
      bumpScale: 0.08,
      roughness: 0.88,
      metalness: 0.12,
      shadowSide: THREE.DoubleSide
    });

    const steelBeamMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a4048,
      metalness: 0.85,
      roughness: 0.35
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTextures.map,
      bumpMap: floorTextures.bumpMap,
      bumpScale: 0.04,
      roughness: 0.80,
      metalness: 0.15
    });

    const elevatedFloorMaterial = new THREE.MeshStandardMaterial({
      map: floorTextures.map,
      bumpMap: floorTextures.bumpMap,
      bumpScale: 0.04,
      roughness: 0.70,
      metalness: 0.35,
      color: 0x889098
    });

    const rampMaterial = new THREE.MeshStandardMaterial({
      map: rampTexture,
      roughness: 0.50,
      metalness: 0.55
    });

    // 1. Build Base Ground Floor & Physics Plane
    this._buildFloor(size, floorMaterial);

    // 2. Build Maze Walls & Physics Colliders
    this._buildWalls(size, grid, elevatedSet, concreteWallMaterial, steelBeamMaterial);

    // 3. Build Elevated Platforms & Walkways
    this._buildElevatedPlatforms(size, grid, elevatedSet, elevatedFloorMaterial);

    // 4. Build Sloped Ramps
    this._buildRamps(ramps, rampMaterial);

    // 5. Build Ceiling Crossbeams & Overhead Industrial Fixtures
    this._buildCeilingGirdersAndLights(size);

    // 6. Build Start Pad
    this._buildStartPad(startPos);

    // 7. Build Glowing Finish Zone with level-specific beacon color
    const beaconColor = levelConfig?.theme?.beaconColor || 0x00f5d4;
    this._buildFinishGoal(endPos, beaconColor);

    return {
      startWorldPos: this.gridToWorld(startPos.x, startPos.z, 0),
      goalWorldPos: this.goalPosition
    };
  }

  /**
   * Helper to convert grid coordinates (x, z) to centered 3D world space
   */
  gridToWorld(gx, gz, gy = 0) {
    const half = (this.mazeSize * this.cellSize) / 2;
    return new THREE.Vector3(
      gx * this.cellSize - half + this.cellSize / 2,
      gy,
      gz * this.cellSize - half + this.cellSize / 2
    );
  }

  /**
   * Builds ground floor visuals and Cannon.js floor body
   */
  _buildFloor(size, material) {
    const totalDim = size * this.cellSize;
    const geometry = new THREE.PlaneGeometry(totalDim + 40, totalDim + 40);
    const floorMesh = new THREE.Mesh(geometry, material);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    this._addMesh(floorMesh);

    // Physics floor plane (or flat box)
    const floorShape = new CANNON.Plane();
    const floorBody = new CANNON.Body({
      mass: 0, // static
      material: this.physics.floorMaterial
    });
    floorBody.addShape(floorShape);
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this._addBody(floorBody, 'floor');

    // Build solid invisible box ceiling directly capping the maze walls
    this._buildInvisibleCeiling(size);
  }

  /**
   * Builds an invisible physical ceiling directly on top of the walls at ceilingHeight (5.2m).
   * Uses a 2m thick Cannon.js Box shape completely sealing the maze top,
   * guaranteeing that the ball can never fly off, pop over walls, or launch into the sky.
   */
  _buildInvisibleCeiling(size) {
    const totalDim = size * this.cellSize;
    const ceilingThickness = 2.0;
    const halfExtents = new CANNON.Vec3(
      (totalDim + 60) / 2,
      ceilingThickness / 2,
      (totalDim + 60) / 2
    );
    const ceilingBody = new CANNON.Body({
      mass: 0,
      material: this.physics.ceilingMaterial,
      position: new CANNON.Vec3(0, this.ceilingHeight + ceilingThickness / 2, 0)
    });
    ceilingBody.addShape(new CANNON.Box(halfExtents));
    this._addBody(ceilingBody, 'ceiling');
  }

  /**
   * Builds concrete walls with instancing and physics box colliders
   */
  _buildWalls(size, grid, elevatedSet, wallMaterial, beamMaterial) {
    const wallGeom = new THREE.BoxGeometry(this.cellSize, this.wallHeight, this.cellSize);
    const half = (size * this.cellSize) / 2;

    // Collect wall transforms
    const wallMatrices = [];
    const beamPositions = [];

    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        if (grid[z][x] === 1) {
          const wx = x * this.cellSize - half + this.cellSize / 2;
          const wz = z * this.cellSize - half + this.cellSize / 2;
          const wy = this.wallHeight / 2;

          const matrix = new THREE.Matrix4().setPosition(wx, wy, wz);
          wallMatrices.push(matrix);

          // Add Physics Box Body
          const halfExtents = new CANNON.Vec3(this.cellSize / 2, this.wallHeight / 2, this.cellSize / 2);
          const wallBody = new CANNON.Body({
            mass: 0,
            material: this.physics.wallMaterial,
            position: new CANNON.Vec3(wx, wy, wz)
          });
          wallBody.addShape(new CANNON.Box(halfExtents));
          this._addBody(wallBody, 'wall');

          // Corner reinforcements at periodic intersections
          if ((x % 3 === 0 || z % 3 === 0) && Math.random() < 0.4) {
            beamPositions.push(new THREE.Vector3(wx, 0, wz));
          }
        }
      }
    }

    // InstancedMesh for concrete walls
    const wallInstanced = new THREE.InstancedMesh(wallGeom, wallMaterial, wallMatrices.length);
    wallInstanced.castShadow = true;
    wallInstanced.receiveShadow = true;

    for (let i = 0; i < wallMatrices.length; i++) {
      wallInstanced.setMatrixAt(i, wallMatrices[i]);
    }
    wallInstanced.instanceMatrix.needsUpdate = true;
    this._addMesh(wallInstanced);
    this.wallMeshes.push(wallInstanced);

    // Steel Corner Columns / I-Beams
    if (beamPositions.length > 0) {
      const beamGeom = new THREE.BoxGeometry(0.5, this.wallHeight + 0.4, 0.5);
      const beamInstanced = new THREE.InstancedMesh(beamGeom, beamMaterial, beamPositions.length);
      beamInstanced.castShadow = true;
      beamInstanced.receiveShadow = true;

      const dummy = new THREE.Object3D();
      for (let i = 0; i < beamPositions.length; i++) {
        dummy.position.copy(beamPositions[i]);
        dummy.position.y = (this.wallHeight + 0.4) / 2;
        dummy.updateMatrix();
        beamInstanced.setMatrixAt(i, dummy.matrix);
      }
      beamInstanced.instanceMatrix.needsUpdate = true;
      this._addMesh(beamInstanced);
      this.decorativeMeshes.push(beamInstanced);
    }
  }

  /**
   * Elevated catwalks & platforms
   */
  _buildElevatedPlatforms(size, grid, elevatedSet, floorMaterial) {
    const platformGeom = new THREE.BoxGeometry(this.cellSize, 0.5, this.cellSize);
    const half = (size * this.cellSize) / 2;

    elevatedSet.forEach((key) => {
      const [xStr, zStr] = key.split(',');
      const x = parseInt(xStr, 10);
      const z = parseInt(zStr, 10);

      const wx = x * this.cellSize - half + this.cellSize / 2;
      const wz = z * this.cellSize - half + this.cellSize / 2;
      const wy = this.elevatedHeight;

      // Visual platform mesh
      const mesh = new THREE.Mesh(platformGeom, floorMaterial);
      mesh.position.set(wx, wy - 0.25, wz);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      this._addMesh(mesh);

      // Support pillars beneath elevated floor
      const pillarGeom = new THREE.CylinderGeometry(0.25, 0.25, wy - 0.25, 8);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x22252a, metalness: 0.8, roughness: 0.4 });
      const pillar1 = new THREE.Mesh(pillarGeom, pillarMat);
      pillar1.position.set(wx - this.cellSize * 0.4, (wy - 0.25) / 2, wz - this.cellSize * 0.4);
      pillar1.castShadow = true;
      this._addMesh(pillar1);

      const pillar2 = pillar1.clone();
      pillar2.position.set(wx + this.cellSize * 0.4, (wy - 0.25) / 2, wz + this.cellSize * 0.4);
      this._addMesh(pillar2);

      // Physics elevated platform box
      const boxShape = new CANNON.Box(new CANNON.Vec3(this.cellSize / 2, 0.25, this.cellSize / 2));
      const platformBody = new CANNON.Body({
        mass: 0,
        material: this.physics.floorMaterial,
        position: new CANNON.Vec3(wx, wy - 0.25, wz)
      });
      platformBody.addShape(boxShape);
      this._addBody(platformBody, 'floor');
    });
  }

  /**
   * Sloped ramps connecting ground and elevated sectors
   */
  _buildRamps(ramps, rampMaterial) {
    for (const r of ramps) {
      const gPos = this.gridToWorld(r.groundX, r.groundZ, 0);
      const ePos = this.gridToWorld(r.elevX, r.elevZ, this.elevatedHeight);

      // Incline length and angle
      const dx = ePos.x - gPos.x;
      const dz = ePos.z - gPos.z;
      const run = Math.sqrt(dx * dx + dz * dz);
      const rampLength = Math.sqrt(run * run + this.elevatedHeight * this.elevatedHeight);
      const pitchAngle = Math.atan2(this.elevatedHeight, run);
      const yawAngle = Math.atan2(dx, dz);

      // Position: The ramp is located in the corridor cell (groundX, groundZ).
      // It starts at the ground entrance of (groundX, groundZ) at y=0,
      // and rises to meet the elevated platform at the boundary with (elevX, elevZ) at y=elevatedHeight.
      const midX = gPos.x;
      const midZ = gPos.z;

      const rampThickness = 0.55; // Substantial thickness prevents high-speed tunneling through collider
      // Align top surface flush: floor (y=0) at bottom entrance, and platform (y=elevatedHeight) at top exit
      const topOffset = (rampThickness / 2) / Math.cos(pitchAngle);
      const midY = (this.elevatedHeight / 2) - topOffset;

      // Cannon.js rotation:
      // In right-handed coordinates, rotating around +X by -pitchAngle tilts local +Z UPWARDS towards ePos
      const qYaw = new CANNON.Quaternion();
      qYaw.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), yawAngle);
      const qPitch = new CANNON.Quaternion();
      qPitch.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -pitchAngle);
      const qRamp = qYaw.mult(qPitch);

      // Visual Ramp Mesh
      const rampGeom = new THREE.BoxGeometry(this.cellSize * 0.98, rampThickness, rampLength + 0.15);
      const rampMesh = new THREE.Mesh(rampGeom, rampMaterial);
      rampMesh.position.set(midX, midY, midZ);
      // Synchronize quaternion directly from Cannon for 100% exact alignment across all axes
      rampMesh.quaternion.set(qRamp.x, qRamp.y, qRamp.z, qRamp.w);
      rampMesh.castShadow = true;
      rampMesh.receiveShadow = true;
      this._addMesh(rampMesh);

      // Physics sloped box body
      const halfExtents = new CANNON.Vec3((this.cellSize * 0.98) / 2, rampThickness / 2, (rampLength + 0.15) / 2);
      const rampBody = new CANNON.Body({
        mass: 0,
        material: this.physics.rampMaterial,
        position: new CANNON.Vec3(midX, midY, midZ),
        quaternion: qRamp
      });
      rampBody.addShape(new CANNON.Box(halfExtents));

      this._addBody(rampBody, 'ramp');
    }
  }

  /**
   * Overhead industrial girders, pipes, and lighting fixtures
   */
  _buildCeilingGirdersAndLights(size) {
    const totalDim = size * this.cellSize;
    const girderMat = new THREE.MeshStandardMaterial({
      color: 0x1f2327,
      metalness: 0.9,
      roughness: 0.4
    });

    // Horizontal structural I-beams high above the maze
    const beamY = this.wallHeight + 2.5;
    for (let z = -totalDim / 2 + 15; z < totalDim / 2; z += 24) {
      const beamGeom = new THREE.BoxGeometry(totalDim, 0.6, 0.8);
      const beam = new THREE.Mesh(beamGeom, girderMat);
      beam.position.set(0, beamY, z);
      beam.castShadow = true;
      this._addMesh(beam);

      // Hanging lamps from this girder
      for (let x = -totalDim / 2 + 20; x < totalDim / 2; x += 30) {
        this._createHangingIndustrialLamp(x, beamY, z);
      }
    }
  }

  /**
   * Creates an authentic industrial warehouse high-bay lamp with warm cone light
   */
  _createHangingIndustrialLamp(x, ceilingY, z) {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(x, ceilingY, z);

    // Hanging wire
    const wireGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const wire = new THREE.Mesh(wireGeom, wireMat);
    wire.position.y = -0.9;
    lampGroup.add(wire);

    // Bell shade reflector
    const shadeGeom = new THREE.ConeGeometry(0.8, 0.6, 12, 1, true);
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0x3d434a,
      metalness: 0.8,
      roughness: 0.3,
      side: THREE.DoubleSide
    });
    const shade = new THREE.Mesh(shadeGeom, shadeMat);
    shade.position.y = -1.8;
    shade.rotation.x = Math.PI;
    lampGroup.add(shade);

    // Glowing bulb
    const bulbGeom = new THREE.SphereGeometry(0.22, 12, 12);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffdfaa });
    const bulb = new THREE.Mesh(bulbGeom, bulbMat);
    bulb.position.y = -1.75;
    lampGroup.add(bulb);

    // Warm SpotLight / PointLight (illumination without expensive shadow maps)
    const spot = new THREE.SpotLight(0xffecd0, 16.0, 24, Math.PI / 3.2, 0.65, 1.5);
    spot.position.set(x, ceilingY - 1.8, z);
    spot.target.position.set(x, 0, z);
    spot.castShadow = false;

    this.scene.add(lampGroup);
    this.scene.add(spot);
    this.scene.add(spot.target);
    this.lamps.push({ group: lampGroup, light: spot });
  }

  /**
   * Build starting area marker pad
   */
  _buildStartPad(startPos) {
    const wPos = this.gridToWorld(startPos.x, startPos.z, 0.05);

    // Start circle platform
    const padGeom = new THREE.CylinderGeometry(2.0, 2.2, 0.1, 32);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x2e3338,
      metalness: 0.85,
      roughness: 0.35
    });
    const pad = new THREE.Mesh(padGeom, padMat);
    pad.position.copy(wPos);
    pad.receiveShadow = true;
    this._addMesh(pad);

    // Inner glowing ring
    const ringGeom = new THREE.RingGeometry(1.4, 1.6, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x48cae4,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(wPos.x, wPos.y + 0.06, wPos.z);
    this._addMesh(ring);
  }

  /**
   * Build glowing Finish Goal Beacon with particle pillar and rotating energy rings
   */
  _buildFinishGoal(endPos, beaconColor = 0x00f5d4) {
    const wPos = this.gridToWorld(endPos.x, endPos.z, 0);
    this.goalPosition.copy(wPos);

    // Goal base pedestal
    const baseGeom = new THREE.CylinderGeometry(2.4, 2.6, 0.25, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1a2522,
      metalness: 0.9,
      roughness: 0.25
    });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(wPos.x, 0.125, wPos.z);
    base.receiveShadow = true;
    this._addMesh(base);

    // Rotating neon energy rings
    const ringGeom = new THREE.TorusGeometry(1.8, 0.08, 16, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: beaconColor,
      transparent: true,
      opacity: 0.85
    });

    const ring1 = new THREE.Mesh(ringGeom, ringMat);
    ring1.position.set(wPos.x, 1.2, wPos.z);
    ring1.rotation.x = Math.PI / 2;
    this.scene.add(ring1);
    this.goalRings.push({ mesh: ring1, rotSpeed: 1.2, axis: 'y' });

    const ring2 = new THREE.Mesh(ringGeom, ringMat);
    ring2.position.set(wPos.x, 2.0, wPos.z);
    ring2.rotation.x = Math.PI / 2;
    this.scene.add(ring2);
    this.goalRings.push({ mesh: ring2, rotSpeed: -1.6, axis: 'y' });

    // Vertical translucent light pillar
    const pillarGeom = new THREE.CylinderGeometry(1.6, 1.6, 9.0, 24, 1, true);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: beaconColor,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const pillar = new THREE.Mesh(pillarGeom, pillarMat);
    pillar.position.set(wPos.x, 4.5, wPos.z);
    this.scene.add(pillar);
    this.goalPillar = pillar;

    // Bright PointLight beacon
    const goalLight = new THREE.PointLight(beaconColor, 8.0, 16, 1.8);
    goalLight.position.set(wPos.x, 2.5, wPos.z);
    this.scene.add(goalLight);
    this.goalLight = goalLight;
  }

  /**
   * Animates goal beacon rings and pulsing light
   */
  update(time, delta) {
    for (const r of this.goalRings) {
      r.mesh.rotation.z += r.rotSpeed * delta;
      r.mesh.position.y += Math.sin(time * 3 + r.rotSpeed) * 0.003;
    }

    if (this.goalLight) {
      this.goalLight.intensity = 7.0 + Math.sin(time * 4) * 2.5;
    }

    if (this.goalPillar) {
      this.goalPillar.rotation.y += 0.4 * delta;
    }
  }

  /**
   * Check if player ball has reached the goal
   */
  checkGoalReached(ballPosition) {
    const distSq = (ballPosition.x - this.goalPosition.x) ** 2 + (ballPosition.z - this.goalPosition.z) ** 2;
    return distSq < this.goalTriggerRadius * this.goalTriggerRadius;
  }
}

/**
 * Game.js
 * Master orchestrator for the Ultra-Realistic 3D Metal Ball Maze Game.
 * Coordinates rendering, physics, audio synthesis, camera, sparks, maze builder, and HUD.
 */

import * as THREE from 'three';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { SoundSystem } from './audio/SoundSystem.js';
import { TextureGenerator } from './rendering/TextureGenerator.js';
import { MazeGenerator } from './maze/MazeGenerator.js';
import { MazeBuilder } from './maze/MazeBuilder.js';
import { LEVEL_CONFIGS } from './maze/LevelConfig.js';
import { MetalBall } from './entities/MetalBall.js';
import { BALL_SKINS } from './entities/BallSkins.js';
import { CameraController } from './camera/CameraController.js';
import { SparkSystem } from './effects/SparkSystem.js';
import { DustAtmosphere } from './effects/DustAtmosphere.js';
import { InputManager } from './input/InputManager.js';
import { HUD } from './ui/HUD.js';

export const GAME_STATES = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  VICTORY: 'VICTORY'
};

export class Game {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.state = GAME_STATES.START;

    // Levels
    this.levels = LEVEL_CONFIGS;
    this.currentLevelIndex = 0;

    // Timing and stats
    this.clock = new THREE.Clock();
    this.gameTime = 0;
    this.collisions = 0;
    this.totalDistance = 0;
    this.maxRecordedImpact = 0;

    // Start positions
    this.startWorldPos = new THREE.Vector3();
    this.goalWorldPos = new THREE.Vector3();

    this._initGraphics();
    this._initSystems();
    this._setupCollisionPipeline();
    this._bindEvents();

    // Start animation loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  _initGraphics() {
    // 1. Scene & Industrial Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111417);
    this.scene.fog = new THREE.FogExp2(0x111417, 0.016);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      450
    );

    // 3. WebGL Renderer with High-End PBR Settings
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting Rig
    this._setupLighting();

    // 5. Procedural Industrial Environment Map for Metallic Reflections
    this.envMap = TextureGenerator.createIndustrialEnvironmentMap(this.renderer);
    this.scene.environment = this.envMap;
  }

  _setupLighting() {
    // Soft cool ambient light
    this.ambientLight = new THREE.AmbientLight(0x2a333d, 1.2);
    this.scene.add(this.ambientLight);

    // Main industrial sunlight / high key directional light
    this.sunLight = new THREE.DirectionalLight(0xdce7f2, 2.4);
    this.sunLight.position.set(45, 65, 35);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 250;

    const d = 110;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0006;
    this.scene.add(this.sunLight);

    // Subtle warm rim light for depth
    this.rimLight = new THREE.DirectionalLight(0xffa64d, 0.7);
    this.rimLight.position.set(-40, 20, -40);
    this.scene.add(this.rimLight);
  }

  _initSystems() {
    // 1. Audio System
    this.sound = new SoundSystem();

    // 2. Physics Engine
    this.physics = new PhysicsWorld();

    // 3. Maze Construction
    this.mazeBuilder = new MazeBuilder(this.scene, this.physics, 6.0);

    // 4. Metal Ball Character (will be repositioned when level loads)
    this.ball = new MetalBall(this.scene, this.physics, this.envMap, new THREE.Vector3(0, 0.75, 0), 0.75);

    // 5. Cinematic Follow Camera
    this.cameraController = new CameraController(this.camera, this.renderer.domElement);

    // 6. Particle & Atmospheric FX
    this.sparks = new SparkSystem(this.scene, 700);
    this.dust = new DustAtmosphere(this.scene, 900);

    // 7. Inputs with Gamepad Support
    this.input = new InputManager();
    this.input.onReset(() => this.resetGame());
    this.input.onAction((actionType) => {
      if (this.state === GAME_STATES.START) {
        this.startGame();
        this.hud.hideStartScreen();
      } else if (this.state === GAME_STATES.VICTORY) {
        this.hud.hideVictoryModal();
        this.nextLevel();
      }
    });

    // 8. User Interface (HUD)
    this.hud = new HUD({
      onStart: () => this.startGame(),
      onRestart: () => this.resetGame(),
      onToggleMute: () => this.sound.toggleMute(),
      onSelectLevel: (index) => this.loadLevel(index),
      onNextLevel: () => this.nextLevel(),
      onPrevLevel: () => this.prevLevel(),
      onSelectSkin: (skinId) => {
        this.ball.setSkin(skinId);
      }
    });

    // Connect input gamepad status events to HUD
    this.input.onGamepadStatus((status) => {
      this.hud.updateGamepadStatus(status);
    });

    // Initialize HUD skin tabs
    this.hud.initSkins(BALL_SKINS, 'chrome');

    // Initialize HUD levels tabs
    this.hud.initLevels(this.levels, this.currentLevelIndex);

    // Build the initial level
    this.loadLevel(this.currentLevelIndex, false);
  }

  /**
   * Loads and builds a specific level by index
   */
  loadLevel(index, startPlaying = false) {
    if (index < 0 || index >= this.levels.length) return;
    this.currentLevelIndex = index;
    const levelConfig = this.levels[this.currentLevelIndex];

    // 1. Generate maze data based on level configuration
    this.mazeGen = new MazeGenerator(levelConfig.size, {
      elevatedSectors: levelConfig.theme.elevatedSectors || []
    });
    const mazeData = this.mazeGen.generate();

    // 2. Build 3D world meshes and physics
    const { startWorldPos, goalWorldPos } = this.mazeBuilder.build(mazeData, levelConfig);
    this.startWorldPos.copy(startWorldPos);
    this.goalWorldPos.copy(goalWorldPos);

    // 3. Update Camera Collision Meshes
    this.cameraController.setCollisionObjects(this.mazeBuilder.wallMeshes);

    // 4. Update scene theme lighting and fog
    if (levelConfig.theme) {
      const theme = levelConfig.theme;
      if (theme.fogColor) {
        this.scene.background.set(theme.fogColor);
        this.scene.fog.color.set(theme.fogColor);
      }
      if (theme.fogDensity) {
        this.scene.fog.density = theme.fogDensity;
      }
      if (theme.ambientColor && this.ambientLight) {
        this.ambientLight.color.set(theme.ambientColor);
      }
      if (theme.sunColor && this.sunLight) {
        this.sunLight.color.set(theme.sunColor);
      }
      if (theme.sunIntensity && this.sunLight) {
        this.sunLight.intensity = theme.sunIntensity;
      }
      if (theme.rimColor && this.rimLight) {
        this.rimLight.color.set(theme.rimColor);
      }
    }

    // 5. Update ball position and reset stats
    this.gameTime = 0;
    this.collisions = 0;
    this.totalDistance = 0;
    this.maxRecordedImpact = 0;
    this.ball.reset(this.startWorldPos);

    // 6. Camera reset
    this.cameraController.target.set(this.startWorldPos.x, this.startWorldPos.y + 0.75, this.startWorldPos.z);
    this.cameraController.yaw = 0;
    this.cameraController.targetYaw = 0;
    this.cameraController.pitch = 1.08;
    this.cameraController.targetPitch = 1.08;
    this.cameraController.distance = 14.0;
    this.cameraController.targetDistance = 14.0;
    this.cameraController.currentEffectiveDist = 14.0;

    // 7. Update HUD
    this.hud.updateLevelSelection(this.currentLevelIndex);
    this.hud.hideVictoryModal();

    if (startPlaying) {
      this.state = GAME_STATES.PLAYING;
      this.hud.hideStartScreen();
    }
  }

  nextLevel() {
    const nextIdx = (this.currentLevelIndex + 1) % this.levels.length;
    this.loadLevel(nextIdx, true);
  }

  prevLevel() {
    const prevIdx = (this.currentLevelIndex - 1 + this.levels.length) % this.levels.length;
    this.loadLevel(prevIdx, true);
  }

  /**
   * Comprehensive collision handling pipeline with controller haptic rumble
   */
  _setupCollisionPipeline() {
    this.physics.onImpact((impact) => {
      if (this.state !== GAME_STATES.PLAYING) return;

      const v = impact.velocity;
      this.collisions++;

      if (v > this.maxRecordedImpact) {
        this.maxRecordedImpact = v;
      }

      // Audio feedback tailored to impact velocity
      this.sound.playCollisionSound(v, impact.surfaceType);

      // Trigger Gamepad Haptic Rumble
      const rumbleStrength = Math.min(1.0, v / 11.0);
      const rumbleDuration = v > 6.0 ? 180 : 100;
      this.input.triggerRumble(rumbleStrength, rumbleDuration);

      // FX & Camera Shake Logic (tuned to reduce jarring speed bump feel)
      if (v < 3.2) {
        // Soft impact or glance: subtle audio only, no camera shake or alert
      } else if (v < 6.8) {
        // Medium impact: audible metallic ring, sparks, modest shake
        this.sparks.spawnSparks(impact);
        this.cameraController.addTrauma(0.12);
        this.hud.showImpactAlert('WALL COLLISION');
      } else {
        // High impact: heavy metallic ring, big spark shower, bright flash
        this.sparks.spawnSparks(impact);
        this.cameraController.addTrauma(0.28);
        this.sound.playSparkSizzle(0.25, 0.7);
        this.hud.showImpactAlert('HEAVY IMPACT!');
      }
    });
  }

  _bindEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // User interaction to unlock audio
    const unlockAudio = () => {
      this.sound.init();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
  }

  startGame() {
    this.sound.init();
    this.state = GAME_STATES.PLAYING;
    this.gameTime = 0;
    this.collisions = 0;
    this.totalDistance = 0;
    this.ball.reset(this.startWorldPos);
    this.cameraController.target.set(this.startWorldPos.x, this.startWorldPos.y + 0.75, this.startWorldPos.z);
    this.cameraController.yaw = 0;
    this.cameraController.targetYaw = 0;
    this.cameraController.pitch = 1.08;
    this.cameraController.targetPitch = 1.08;
    this.cameraController.distance = 14.0;
    this.cameraController.targetDistance = 14.0;
    this.cameraController.currentEffectiveDist = 14.0;
  }

  resetGame() {
    this.state = GAME_STATES.PLAYING;
    this.gameTime = 0;
    this.collisions = 0;
    this.totalDistance = 0;
    this.ball.reset(this.startWorldPos);
    this.cameraController.target.set(this.startWorldPos.x, this.startWorldPos.y + 0.75, this.startWorldPos.z);
    this.hud.hideVictoryModal();
  }

  triggerVictory() {
    if (this.state === GAME_STATES.VICTORY) return;
    this.state = GAME_STATES.VICTORY;

    // Victory audio fanfare
    this.sound.playVictorySound();

    // Haptic pulse for victory
    this.input.triggerRumble(0.8, 400);

    // Celebration spark burst at goal
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.sparks.spawnSparks({
          point: {
            x: this.goalWorldPos.x + (Math.random() - 0.5) * 2,
            y: 2.0 + Math.random() * 2,
            z: this.goalWorldPos.z + (Math.random() - 0.5) * 2
          },
          normal: { x: (Math.random() - 0.5), y: 1.0, z: (Math.random() - 0.5) },
          velocity: 12.0
        });
      }, i * 220);
    }

    // Show completion UI with current level index and total level count
    this.hud.showVictoryModal({
      time: this.gameTime,
      collisions: this.collisions,
      distance: this.totalDistance,
      maxSpeed: this.ball.maxSpeed
    }, this.currentLevelIndex, this.levels.length);
  }

  /**
   * Main game loop (60 FPS)
   */
  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.05); // Cap delta to avoid frame spikes
    const elapsed = this.clock.getElapsedTime();

    if (this.state === GAME_STATES.START) {
      // Cinematic overhead orbit focused directly on the metal ball on the launch pad
      const orbitRadius = 13;
      const orbitSpeed = 0.35;
      const camX = this.startWorldPos.x + Math.sin(elapsed * orbitSpeed) * orbitRadius;
      const camZ = this.startWorldPos.z + Math.cos(elapsed * orbitSpeed) * orbitRadius;
      this.camera.position.set(camX, 9.5 + Math.sin(elapsed * 0.4) * 1.5, camZ);
      this.camera.lookAt(this.startWorldPos.x, 0.75, this.startWorldPos.z);

      // Keep ball synced and grounded
      this.ball.mesh.position.copy(this.ball.body.position);
      this.ball.mesh.quaternion.copy(this.ball.body.quaternion);

      // Update goal beacon visuals
      this.mazeBuilder.update(elapsed, delta);
      this.dust.update(this.startWorldPos, elapsed, delta);

    } else if (this.state === GAME_STATES.PLAYING) {
      this.gameTime += delta;

      // 1. Process player movement input (keyboard, touch, controller)
      const input = this.input.getInput();
      this.ball.applyInput(input, this.cameraController.getYaw());

      // 2. Step rigid body physics
      this.physics.step(delta);

      // 3. Update Ball mesh & telemetry
      const ballStats = this.ball.update(delta);
      this.totalDistance = ballStats.totalDistance;

      // 4. Update audio rolling sound
      this.sound.updateRollingSound(ballStats.speed, ballStats.isGrounded);

      // 5. Update Camera with controller right-stick orbit
      const ballVel = new THREE.Vector3(
        this.ball.body.velocity.x,
        this.ball.body.velocity.y,
        this.ball.body.velocity.z
      );
      this.cameraController.update(ballStats.position, ballVel, delta, input.cameraLook);

      // 6. Update visual effects
      this.sparks.update(delta);
      this.dust.update(ballStats.position, elapsed, delta);
      this.mazeBuilder.update(elapsed, delta);

      // 7. Update HUD Telemetry & Radar
      const currentLevel = this.levels[this.currentLevelIndex];
      const accentColor = currentLevel?.theme?.accentColor || '#00f5d4';

      this.hud.updateTelemetry(this.gameTime, this.collisions, this.totalDistance, ballStats.speed);
      this.hud.drawRadar(
        ballStats.position,
        this.goalWorldPos,
        this.mazeBuilder.mazeSize,
        this.mazeBuilder.cellSize,
        this.cameraController.getYaw(),
        accentColor
      );

      // 8. Check Goal Reached
      if (this.mazeBuilder.checkGoalReached(ballStats.position)) {
        this.triggerVictory();
      }

    } else if (this.state === GAME_STATES.VICTORY) {
      // Victory slow-motion camera orbit around ball & goal beacon
      const orbitSpeed = 0.5;
      const vCamX = this.goalWorldPos.x + Math.sin(elapsed * orbitSpeed) * 9;
      const vCamZ = this.goalWorldPos.z + Math.cos(elapsed * orbitSpeed) * 9;
      this.camera.position.set(vCamX, 6.0, vCamZ);
      this.camera.lookAt(this.goalWorldPos.x, 1.2, this.goalWorldPos.z);

      this.sparks.update(delta);
      this.mazeBuilder.update(elapsed, delta);
      this.dust.update(this.goalWorldPos, elapsed, delta);
      this.sound.updateRollingSound(0, true);
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }
}


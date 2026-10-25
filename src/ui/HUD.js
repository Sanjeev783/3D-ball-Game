/**
 * HUD.js
 * Cyberpunk/industrial telemetry HUD, start screen with 10-level selector,
 * ball skin customizer, controller connection status, victory modal, and radar beacon.
 */

export class HUD {
  constructor(callbacks = {}) {
    this.callbacks = callbacks; // { onStart, onRestart, onToggleMute, onSelectLevel, onNextLevel, onPrevLevel, onSelectSkin }

    // DOM Elements
    this.startScreen = document.getElementById('start-screen');
    this.howToModal = document.getElementById('howto-modal');
    this.victoryModal = document.getElementById('victory-modal');
    this.hudOverlay = document.getElementById('hud-overlay');

    // Telemetry text elements
    this.timerEl = document.getElementById('hud-timer');
    this.collisionsEl = document.getElementById('hud-collisions');
    this.distanceEl = document.getElementById('hud-distance');
    this.speedEl = document.getElementById('hud-speed');
    this.impactAlertEl = document.getElementById('hud-impact-alert');

    // Level Header Elements
    this.hudLevelTitleEl = document.getElementById('hud-level-title');
    this.btnPrevLevel = document.getElementById('btn-prev-level');
    this.btnNextLevel = document.getElementById('btn-next-level');

    // Gamepad indicator elements
    this.startGamepadBadge = document.getElementById('start-gamepad-badge');
    this.startGamepadName = document.getElementById('start-gamepad-name');
    this.hudGamepadBadge = document.getElementById('hud-gamepad-badge');
    this.hudGamepadName = document.getElementById('hud-gamepad-name');

    // Start Screen Level Selection
    this.startLevelTabs = document.getElementById('start-level-tabs');
    this.selectedLevelInfo = document.getElementById('selected-level-info');

    // Start Screen Skin Selection
    this.startSkinTabs = document.getElementById('start-skin-tabs');
    this.selectedSkinInfo = document.getElementById('selected-skin-info');

    // Victory screen stats elements
    this.vicTitleEl = document.getElementById('vic-title');
    this.vicSubtitleEl = document.getElementById('vic-subtitle');
    this.vicTimeEl = document.getElementById('vic-time');
    this.vicCollisionsEl = document.getElementById('vic-collisions');
    this.vicDistanceEl = document.getElementById('vic-distance');
    this.vicBestTimeEl = document.getElementById('vic-best-time');
    this.btnNextLevelVic = document.getElementById('btn-next-level-vic');

    // Radar canvas
    this.radarCanvas = document.getElementById('radar-canvas');
    if (this.radarCanvas) {
      this.radarCtx = this.radarCanvas.getContext('2d');
    }

    this.impactTimeout = null;
    this.levels = [];
    this.currentLevelIndex = 0;
    this.currentSkinId = 'chrome';
    this.skins = [];

    this._bindButtonEvents();
  }

  _bindButtonEvents() {
    // Start Screen Buttons
    const btnStart = document.getElementById('btn-start-game');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        if (this.callbacks.onStart) this.callbacks.onStart();
        this.hideStartScreen();
      });
    }

    const btnHowTo = document.getElementById('btn-how-to');
    if (btnHowTo) {
      btnHowTo.addEventListener('click', () => {
        this.showHowToModal();
      });
    }

    const btnCloseHowTo = document.getElementById('btn-close-howto');
    if (btnCloseHowTo) {
      btnCloseHowTo.addEventListener('click', () => {
        this.hideHowToModal();
      });
    }

    // In-Game Prev/Next Level
    if (this.btnPrevLevel) {
      this.btnPrevLevel.addEventListener('click', () => {
        if (this.callbacks.onPrevLevel) this.callbacks.onPrevLevel();
      });
    }

    if (this.btnNextLevel) {
      this.btnNextLevel.addEventListener('click', () => {
        if (this.callbacks.onNextLevel) this.callbacks.onNextLevel();
      });
    }

    // Victory Screen Buttons
    const btnRestartVic = document.getElementById('btn-restart-victory');
    if (btnRestartVic) {
      btnRestartVic.addEventListener('click', () => {
        this.hideVictoryModal();
        if (this.callbacks.onRestart) this.callbacks.onRestart();
      });
    }

    if (this.btnNextLevelVic) {
      this.btnNextLevelVic.addEventListener('click', () => {
        this.hideVictoryModal();
        if (this.callbacks.onNextLevel) this.callbacks.onNextLevel();
      });
    }

    // Top Bar In-Game Restart & Mute Buttons
    const btnResetInGame = document.getElementById('btn-reset-ingame');
    if (btnResetInGame) {
      btnResetInGame.addEventListener('click', () => {
        if (this.callbacks.onRestart) this.callbacks.onRestart();
      });
    }

    const btnMute = document.getElementById('btn-toggle-mute');
    if (btnMute) {
      btnMute.addEventListener('click', () => {
        if (this.callbacks.onToggleMute) {
          const isMuted = this.callbacks.onToggleMute();
          btnMute.innerHTML = isMuted ? '🔇' : '🔊';
        }
      });
    }
  }

  /**
   * Initializes the level selector UI tabs (supports up to 99 levels)
   */
  initLevels(levels, initialIndex = 0) {
    this.levels = levels;
    this.currentLevelIndex = initialIndex;

    if (this.startLevelTabs) {
      this.startLevelTabs.innerHTML = '';
      levels.forEach((lvl, idx) => {
        const btn = document.createElement('button');
        btn.className = `level-tab-btn ${idx === initialIndex ? 'active' : ''}`;
        const idStr = String(lvl.id).padStart(2, '0');
        btn.textContent = `${idStr} ${lvl.name.split(' ')[0]}`;
        btn.title = lvl.name;
        btn.addEventListener('click', () => {
          this.currentLevelIndex = idx;
          this.updateLevelSelection(idx);
          if (this.callbacks.onSelectLevel) this.callbacks.onSelectLevel(idx);
        });
        this.startLevelTabs.appendChild(btn);
      });
    }

    this.updateLevelSelection(initialIndex);
  }

  /**
   * Updates level selector card and in-game level titles
   */
  updateLevelSelection(levelIndex) {
    this.currentLevelIndex = levelIndex;
    const level = this.levels[levelIndex];
    if (!level) return;

    // Update active tab button style
    if (this.startLevelTabs) {
      const buttons = this.startLevelTabs.querySelectorAll('.level-tab-btn');
      buttons.forEach((btn, idx) => {
        if (idx === levelIndex) btn.classList.add('active');
        else btn.classList.remove('active');
      });
    }

    // Update start screen info card
    if (this.selectedLevelInfo) {
      const diffClass = `diff-${level.difficulty.toLowerCase()}`;
      const idStr = String(level.id).padStart(2, '0');
      this.selectedLevelInfo.innerHTML = `
        <div class="level-card-header">
          <span class="level-card-title">SECTOR ${idStr}: ${level.name} (${level.size}x${level.size})</span>
          <span class="level-card-diff ${diffClass}">${level.difficulty}</span>
        </div>
        <div class="level-card-desc">${level.description}</div>
      `;
    }

    // Update In-Game HUD title
    if (this.hudLevelTitleEl) {
      const idStr = String(level.id).padStart(2, '0');
      this.hudLevelTitleEl.textContent = `LEVEL ${idStr}: ${level.name}`;
      this.hudLevelTitleEl.style.color = level.theme.accentColor || '#00f5d4';
    }
  }

  /**
   * Initializes the ball skin selector UI in the start screen
   */
  initSkins(skins, initialSkinId = 'chrome') {
    this.skins = skins;
    this.currentSkinId = initialSkinId;

    if (!this.startSkinTabs) return;
    this.startSkinTabs.innerHTML = '';

    skins.forEach((skin) => {
      const btn = document.createElement('button');
      btn.className = `skin-tab-btn ${skin.id === initialSkinId ? 'active' : ''}`;
      btn.dataset.skinId = skin.id;
      btn.style.color = skin.accentColor;

      const dot = document.createElement('span');
      dot.className = 'skin-preview-dot';
      dot.style.background = skin.previewColor;
      dot.style.boxShadow = `0 0 6px ${skin.previewColor}`;

      btn.appendChild(dot);
      btn.appendChild(document.createTextNode(skin.name));

      btn.addEventListener('click', () => {
        this.currentSkinId = skin.id;
        this.updateSkinSelection(skin.id);
        if (this.callbacks.onSelectSkin) this.callbacks.onSelectSkin(skin.id);
      });

      this.startSkinTabs.appendChild(btn);
    });

    this.updateSkinSelection(initialSkinId);
  }

  /**
   * Updates the active skin tab and skin info card
   */
  updateSkinSelection(skinId) {
    this.currentSkinId = skinId;
    const skin = this.skins.find(s => s.id === skinId);
    if (!skin) return;

    if (this.startSkinTabs) {
      const buttons = this.startSkinTabs.querySelectorAll('.skin-tab-btn');
      buttons.forEach((btn) => {
        if (btn.dataset.skinId === skinId) btn.classList.add('active');
        else btn.classList.remove('active');
      });
    }

    if (this.selectedSkinInfo) {
      this.selectedSkinInfo.innerHTML = `
        <span class="skin-preview-dot" style="width:22px;height:22px;background:${skin.previewColor};box-shadow:0 0 10px ${skin.previewColor};flex-shrink:0;border-radius:50%;"></span>
        <span class="skin-card-name">${skin.name}</span>
        <span class="skin-card-tag" style="color:${skin.accentColor};">${skin.tag}</span>
      `;
    }
  }

  /**
   * Updates Gamepad connection status in the UI
   */
  updateGamepadStatus(status) {
    if (status.connected) {
      const shortName = (status.id || 'Controller').split('(')[0].trim();
      if (this.startGamepadBadge) {
        this.startGamepadBadge.classList.remove('hidden');
        if (this.startGamepadName) this.startGamepadName.textContent = `🎮 ${shortName}`;
      }
      if (this.hudGamepadBadge) {
        this.hudGamepadBadge.classList.remove('hidden');
        if (this.hudGamepadName) this.hudGamepadName.textContent = `🎮 ${shortName}`;
      }
    } else {
      if (this.startGamepadBadge) this.startGamepadBadge.classList.add('hidden');
      if (this.hudGamepadBadge) this.hudGamepadBadge.classList.add('hidden');
    }
  }

  showStartScreen() {
    if (this.startScreen) this.startScreen.classList.remove('hidden');
    if (this.hudOverlay) this.hudOverlay.classList.add('hidden');
  }

  hideStartScreen() {
    if (this.startScreen) this.startScreen.classList.add('hidden');
    if (this.hudOverlay) this.hudOverlay.classList.remove('hidden');
  }

  showHowToModal() {
    if (this.howToModal) this.howToModal.classList.remove('hidden');
  }

  hideHowToModal() {
    if (this.howToModal) this.howToModal.classList.add('hidden');
  }

  showVictoryModal(stats, currentLevelIndex = 0, totalLevels = 10) {
    if (this.victoryModal) {
      const level = this.levels[currentLevelIndex] || { name: 'SECTOR' };
      const sectorId = String(currentLevelIndex + 1).padStart(2, '0');
      const nextId = String(currentLevelIndex + 2).padStart(2, '0');

      if (this.vicTitleEl) {
        this.vicTitleEl.textContent = currentLevelIndex === totalLevels - 1
          ? '🏆 ALL 10 SECTORS CLEARED!'
          : `SECTOR ${sectorId} CLEARED!`;
      }

      if (this.vicSubtitleEl) {
        this.vicSubtitleEl.textContent = currentLevelIndex === totalLevels - 1
          ? 'Legendary mastery! You have conquered all 10 sectors of the Omega Nexus.'
          : `Exceptional navigation through ${level.name}. Ready for the next challenge?`;
      }

      this.vicTimeEl.textContent = this.formatTime(stats.time);
      this.vicCollisionsEl.textContent = stats.collisions;
      this.vicDistanceEl.textContent = `${stats.distance.toFixed(1)} m`;

      // Read or update best time in localStorage per level
      const recordKey = `metal_maze_best_time_lvl_${currentLevelIndex + 1}`;
      const best = localStorage.getItem(recordKey);
      if (!best || stats.time < parseFloat(best)) {
        localStorage.setItem(recordKey, stats.time.toFixed(2));
        this.vicBestTimeEl.textContent = `${this.formatTime(stats.time)} (NEW RECORD!)`;
      } else {
        this.vicBestTimeEl.textContent = this.formatTime(parseFloat(best));
      }

      // Next level button text
      if (this.btnNextLevelVic) {
        if (currentLevelIndex < totalLevels - 1) {
          this.btnNextLevelVic.textContent = `NEXT SECTOR ▶ (LEVEL ${nextId})`;
        } else {
          this.btnNextLevelVic.textContent = 'REPLAY FROM SECTOR 01 🏆';
        }
      }

      this.victoryModal.classList.remove('hidden');
    }
  }

  hideVictoryModal() {
    if (this.victoryModal) this.victoryModal.classList.add('hidden');
  }

  /**
   * Updates real-time HUD metrics
   */
  updateTelemetry(timeElapsed, collisions, distance, speed) {
    if (this.timerEl) {
      this.timerEl.textContent = this.formatTime(timeElapsed);
    }
    if (this.collisionsEl) {
      this.collisionsEl.textContent = collisions;
    }
    if (this.distanceEl) {
      this.distanceEl.textContent = `${distance.toFixed(1)} m`;
    }
    if (this.speedEl) {
      const kmh = (speed * 3.6).toFixed(1);
      this.speedEl.textContent = `${kmh} km/h`;
    }
  }

  /**
   * Shows a brief visual impact warning tag for hard collisions
   */
  showImpactAlert(intensityStr) {
    if (!this.impactAlertEl) return;
    this.impactAlertEl.textContent = intensityStr;
    this.impactAlertEl.classList.remove('opacity-0');
    this.impactAlertEl.classList.add('opacity-100');

    clearTimeout(this.impactTimeout);
    this.impactTimeout = setTimeout(() => {
      this.impactAlertEl.classList.remove('opacity-100');
      this.impactAlertEl.classList.add('opacity-0');
    }, 700);
  }

  /**
   * Draws a real-time radar showing player ball and goal position
   */
  drawRadar(ballPos, goalPos, mazeSize, cellSize, cameraYaw, beaconColor = '#00f5d4') {
    if (!this.radarCtx) return;
    const ctx = this.radarCtx;
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Radar circular frame
    ctx.strokeStyle = 'rgba(72, 202, 228, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.stroke();

    // Radar scan sweep ring
    ctx.strokeStyle = 'rgba(72, 202, 228, 0.15)';
    ctx.beginPath();
    ctx.arc(cx, cy, (cx - 2) * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Calculate relative offset of goal from player ball
    const totalDim = mazeSize * cellSize;
    const radarScale = (cx - 8) / (totalDim * 0.7);

    const relGoalX = (goalPos.x - ballPos.x) * radarScale;
    const relGoalZ = (goalPos.z - ballPos.z) * radarScale;

    // Rotate relative coords so 'up' matches camera orientation
    const cosYaw = Math.cos(cameraYaw);
    const sinYaw = Math.sin(cameraYaw);
    const rx = relGoalX * cosYaw - relGoalZ * sinYaw;
    const ry = relGoalX * sinYaw + relGoalZ * cosYaw;

    // Clamp goal marker inside radar circle
    const gDist = Math.sqrt(rx * rx + ry * ry);
    const maxR = cx - 8;
    const gxClamped = gDist > maxR ? (rx / gDist) * maxR : rx;
    const gyClamped = gDist > maxR ? (ry / gDist) * maxR : ry;

    // Draw Goal Beacon (Glowing accent color)
    ctx.fillStyle = beaconColor;
    ctx.shadowColor = beaconColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx + gxClamped, cy + gyClamped, 5.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Player Ball at center (Polished Steel white/blue)
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#48cae4';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, 4.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Player direction indicator
    ctx.strokeStyle = '#48cae4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - 9);
    ctx.stroke();
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    const mm = mins.toString().padStart(2, '0');
    const ss = secs.toString().padStart(2, '0');
    const mss = ms.toString().padStart(2, '0');
    return `${mm}:${ss}.${mss}`;
  }
}

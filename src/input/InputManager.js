/**
 * InputManager.js
 * Handles keyboard input, mobile touch controls, and full Gamepad / Controller support:
 * - Left analog stick and D-pad for omnidirectional ball control
 * - Right analog stick for smooth manual camera orbit
 * - Action buttons for braking, resetting, and level navigation
 * - Dual-motor haptic rumble feedback on collisions
 */

export class InputManager {
  constructor() {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      brake: false
    };

    // Virtual / Touch analog inputs (-1 to 1)
    this.touchVector = { x: 0, y: 0 };
    this.touchActive = false;

    // Gamepad state
    this.gamepadConnected = false;
    this.gamepadId = '';
    this.lastResetPressed = false;
    this.lastActionPressed = false;

    // Callbacks
    this.onResetCallback = null;
    this.onActionCallback = null;
    this.onGamepadStatusChange = null;

    this._bindKeyboard();
    this._bindTouchControls();
    this._bindGamepadEvents();
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'Space':
          this.keys.brake = true;
          break;
        case 'KeyR':
          if (this.onResetCallback) this.onResetCallback();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'Space':
          this.keys.brake = false;
          break;
      }
    });
  }

  _bindTouchControls() {
    // 1. Digital D-Pad fallback buttons
    const btnUp = document.getElementById('touch-btn-up');
    const btnDown = document.getElementById('touch-btn-down');
    const btnLeft = document.getElementById('touch-btn-left');
    const btnRight = document.getElementById('touch-btn-right');

    const bindTouchBtn = (btn, keyName) => {
      if (!btn) return;
      const start = (e) => { e.preventDefault(); this.keys[keyName] = true; };
      const end = (e) => { e.preventDefault(); this.keys[keyName] = false; };
      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end, { passive: false });
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
    };

    bindTouchBtn(btnUp, 'forward');
    bindTouchBtn(btnDown, 'backward');
    bindTouchBtn(btnLeft, 'left');
    bindTouchBtn(btnRight, 'right');

    // 2. Analog Floating Touch Joystick zone (supports smooth drag on mobile)
    const joystickZone = document.getElementById('touch-joystick-zone');
    const joystickThumb = document.getElementById('touch-joystick-thumb');

    if (joystickZone && joystickThumb) {
      let touchId = null;
      let center = { x: 0, y: 0 };
      const maxRadius = 45;

      const handleStart = (e) => {
        const touch = e.changedTouches ? e.changedTouches[0] : e;
        if (touchId === null && (e.changedTouches || e.button === 0)) {
          if (e.changedTouches) touchId = touch.identifier;
          const rect = joystickZone.getBoundingClientRect();
          center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          this.touchActive = true;
          handleMove(e);
        }
      };

      const handleMove = (e) => {
        if (!this.touchActive) return;
        let clientX = 0;
        let clientY = 0;

        if (e.changedTouches) {
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId) {
              clientX = e.changedTouches[i].clientX;
              clientY = e.changedTouches[i].clientY;
              break;
            }
          }
        } else {
          clientX = e.clientX;
          clientY = e.clientY;
        }

        const dx = clientX - center.x;
        const dy = clientY - center.y;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, maxRadius);
        const angle = Math.atan2(dy, dx);

        const thumbX = Math.cos(angle) * clampedDist;
        const thumbY = Math.sin(angle) * clampedDist;

        joystickThumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;

        // Normalized analog output: x (-1 to 1), y (-1 to 1, note up on screen is negative Y)
        this.touchVector.x = (thumbX / maxRadius);
        this.touchVector.y = (thumbY / maxRadius);
      };

      const handleEnd = (e) => {
        if (e.changedTouches && touchId !== null) {
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId) {
              touchId = null;
              break;
            }
          }
        } else {
          touchId = null;
        }

        if (touchId === null) {
          this.touchActive = false;
          this.touchVector = { x: 0, y: 0 };
          joystickThumb.style.transform = 'translate(0px, 0px)';
        }
      };

      joystickZone.addEventListener('touchstart', handleStart, { passive: false });
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('touchcancel', handleEnd);

      joystickZone.addEventListener('mousedown', handleStart);
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
    }
  }

  _bindGamepadEvents() {
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadConnected = true;
      this.gamepadId = e.gamepad.id || 'Standard Controller';
      if (this.onGamepadStatusChange) {
        this.onGamepadStatusChange({ connected: true, id: this.gamepadId });
      }
    });

    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadConnected = false;
      this.gamepadId = '';
      if (this.onGamepadStatusChange) {
        this.onGamepadStatusChange({ connected: false, id: '' });
      }
    });
  }

  /**
   * Helper to get active connected gamepad
   */
  _getActiveGamepad() {
    if (!navigator.getGamepads) return null;
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp && gp.connected) {
        if (!this.gamepadConnected) {
          this.gamepadConnected = true;
          this.gamepadId = gp.id || 'Standard Controller';
          if (this.onGamepadStatusChange) {
            this.onGamepadStatusChange({ connected: true, id: this.gamepadId });
          }
        }
        return gp;
      }
    }
    if (this.gamepadConnected) {
      this.gamepadConnected = false;
      this.gamepadId = '';
      if (this.onGamepadStatusChange) {
        this.onGamepadStatusChange({ connected: false, id: '' });
      }
    }
    return null;
  }

  /**
   * Applies a deadzone calculation to analog stick input
   */
  _applyDeadzone(x, y, threshold = 0.15) {
    const mag = Math.hypot(x, y);
    if (mag <= threshold) {
      return { x: 0, y: 0 };
    }
    const factor = Math.min(1.0, (mag - threshold) / (1.0 - threshold));
    return {
      x: (x / mag) * factor,
      y: (y / mag) * factor
    };
  }

  /**
   * Triggers haptic rumble vibration on modern gamepads
   */
  triggerRumble(intensity = 0.5, duration = 120) {
    const gp = this._getActiveGamepad();
    if (gp && gp.vibrationActuator && gp.vibrationActuator.playEffect) {
      const clamped = Math.max(0, Math.min(1, intensity));
      gp.vibrationActuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration: duration,
        weakMagnitude: clamped * 0.7,
        strongMagnitude: clamped * 0.9
      }).catch(() => {});
    }
  }

  /**
   * Returns current combined input state from keyboard, touch, and controller
   */
  getInput() {
    let forward = 0;
    let right = 0;
    let brake = this.keys.brake;
    const cameraLook = { x: 0, y: 0 };

    // 1. Keyboard Inputs
    if (this.keys.forward) forward += 1;
    if (this.keys.backward) forward -= 1;
    if (this.keys.right) right += 1;
    if (this.keys.left) right -= 1;

    // 2. Touch D-Pad
    if (Math.abs(this.touchVector.y) > 0.05) forward += -this.touchVector.y;
    if (Math.abs(this.touchVector.x) > 0.05) right += this.touchVector.x;

    // 3. Gamepad / Controller Inputs
    const gp = this._getActiveGamepad();
    if (gp) {
      // Left Analog Stick (Axes 0, 1)
      const leftStick = this._applyDeadzone(gp.axes[0] || 0, gp.axes[1] || 0, 0.15);
      right += leftStick.x;
      forward += -leftStick.y; // In Gamepad API, -1 is Up / Forward

      // D-Pad Buttons (12: Up, 13: Down, 14: Left, 15: Right)
      if (gp.buttons[12]?.pressed) forward += 1;
      if (gp.buttons[13]?.pressed) forward -= 1;
      if (gp.buttons[14]?.pressed) right -= 1;
      if (gp.buttons[15]?.pressed) right += 1;

      // Right Analog Stick for Camera Orbit (Axes 2, 3)
      const rightStick = this._applyDeadzone(gp.axes[2] || 0, gp.axes[3] || 0, 0.15);
      cameraLook.x = rightStick.x;
      cameraLook.y = rightStick.y;

      // Action Buttons
      // Button 0 (A), Button 1 (B), Button 2 (X), Triggers (6, 7): Brake
      if (gp.buttons[0]?.pressed || gp.buttons[1]?.pressed || gp.buttons[2]?.pressed ||
          (gp.buttons[6]?.value && gp.buttons[6].value > 0.2) ||
          (gp.buttons[7]?.value && gp.buttons[7].value > 0.2)) {
        brake = true;
      }

      // Button 3 (Y) or Button 8 (Select/Back): Reset Ball Position (edge-triggered)
      const resetPressed = Boolean(gp.buttons[3]?.pressed || gp.buttons[8]?.pressed);
      if (resetPressed && !this.lastResetPressed) {
        if (this.onResetCallback) this.onResetCallback();
      }
      this.lastResetPressed = resetPressed;

      // Button 9 (Start/Menu) or Button 0 (A): Action callback (edge-triggered)
      const actionPressed = Boolean(gp.buttons[9]?.pressed || gp.buttons[0]?.pressed);
      if (actionPressed && !this.lastActionPressed) {
        if (this.onActionCallback) {
          this.onActionCallback(gp.buttons[9]?.pressed ? 'start' : 'select');
        }
      }
      this.lastActionPressed = actionPressed;
    }

    // Normalize diagonal movement magnitude to max 1.0
    const len = Math.sqrt(forward * forward + right * right);
    if (len > 1.0) {
      forward /= len;
      right /= len;
    }

    return {
      forward,
      right,
      brake,
      cameraLook,
      gamepadConnected: this.gamepadConnected,
      gamepadId: this.gamepadId
    };
  }

  onReset(callback) {
    this.onResetCallback = callback;
  }

  onAction(callback) {
    this.onActionCallback = callback;
  }

  onGamepadStatus(callback) {
    this.onGamepadStatusChange = callback;
  }
}

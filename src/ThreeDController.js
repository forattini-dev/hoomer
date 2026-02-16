// ── ThreeDController.js ─────────────────────────────────────
// Extracted from App.js — 3D view, navigation modes, mobile walk controls.

import { Viewer3D } from './Viewer3D.js';

export class ThreeDController {
  constructor(app) {
    this.app = app;

    // 3D state
    this.viewer3D = null;
    this.is3DMode = false;
    this._mobileNavMove = { up: 0, down: 0, left: 0, right: 0 };
    this._mobileLookPointerId = null;
    this._mobileLookStart = null;
    this._mobileWalkMovePointers = new Map();
    this._mobileNavBoundHandlers = [];
  }

  _isMobilePointerEnvironment() {
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse), (hover: none)').matches;
  }

  _setNavModeAttribute(mode) {
    const host = this.app.hostElement;
    if (!host) return;
    if (mode) {
      host.setAttribute('data-nav-mode', mode);
    } else {
      host.removeAttribute('data-nav-mode');
    }
  }

  _clearMobileWalkInput() {
    this._mobileNavMove.up = 0;
    this._mobileNavMove.down = 0;
    this._mobileNavMove.left = 0;
    this._mobileNavMove.right = 0;
    this._mobileLookPointerId = null;
    this._mobileLookStart = null;
    const fps = this.viewer3D?.fpsControls;
    if (fps) fps.setTouchMove(0, 0);
  }

  _applyMobileWalkVector() {
    const fps = this.viewer3D?.fpsControls;
    if (!fps) return;
    const x = (this._mobileNavMove.right || 0) - (this._mobileNavMove.left || 0);
    const z = (this._mobileNavMove.down || 0) - (this._mobileNavMove.up || 0);
    fps.setTouchMove(x, z);
  }

  bindMobileWalkControls() {
    const app = this.app;
    const moveButtons = [
      { id: 'walk-btn-up', key: 'up' },
      { id: 'walk-btn-down', key: 'down' },
      { id: 'walk-btn-left', key: 'left' },
      { id: 'walk-btn-right', key: 'right' },
    ];
    const lookPad = app.$('mobile-look-control');

    if (!lookPad) return;

    const clearMovePointer = (e) => {
      const key = this._mobileWalkMovePointers.get(e.pointerId);
      if (!key) return;
      this._mobileWalkMovePointers.delete(e.pointerId);
      this._mobileNavMove[key] = Math.max(0, (this._mobileNavMove[key] || 0) - 1);
      this._applyMobileWalkVector();
    };

    const onMoveBtnDown = (key) => (e) => {
      if (!this.is3DMode || app.hostElement.getAttribute('data-nav-mode') !== 'fps') return;
      if (!this._isMobilePointerEnvironment()) return;
      e.preventDefault();
      this._mobileWalkMovePointers.set(e.pointerId, key);
      this._mobileNavMove[key] = (this._mobileNavMove[key] || 0) + 1;
      this._applyMobileWalkVector();
      if (e.pointerId != null) {
        try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
      }
    };
    const onMoveBtnUp = (e) => {
      clearMovePointer(e);
      if (e.pointerId != null) {
        try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    };

    for (const item of moveButtons) {
      const btn = app.$(item.id);
      if (!btn) continue;
      const down = onMoveBtnDown(item.key);
      const up = onMoveBtnUp;
      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('pointerleave', up);
      btn.addEventListener('pointerout', up);
      this._mobileNavBoundHandlers.push(
        { el: btn, type: 'pointerdown', handler: down },
        { el: btn, type: 'pointerup', handler: up },
        { el: btn, type: 'pointercancel', handler: up },
        { el: btn, type: 'pointerleave', handler: up },
        { el: btn, type: 'pointerout', handler: up }
      );
    }

    const lookStart = (e) => {
      if (!this.is3DMode || app.hostElement.getAttribute('data-nav-mode') !== 'fps') return;
      if (!this._isMobilePointerEnvironment()) return;
      e.preventDefault();
      this._mobileLookPointerId = e.pointerId;
      this._mobileLookStart = { x: e.clientX, y: e.clientY };
      try { lookPad.setPointerCapture(e.pointerId); } catch (err) {}
    };
    const lookMove = (e) => {
      if (!this.viewer3D || this._mobileLookPointerId !== e.pointerId) return;
      if (e.pointerId == null || app.hostElement.getAttribute('data-nav-mode') !== 'fps') return;
      if (!this._mobileLookStart) return;
      const dx = e.clientX - this._mobileLookStart.x;
      const dy = e.clientY - this._mobileLookStart.y;
      this._mobileLookStart = { x: e.clientX, y: e.clientY };
      this.viewer3D.fpsControls?.addTouchLook(dx, dy);
    };
    const lookEnd = () => {
      if (!this._mobileLookStart) return;
      this._mobileLookPointerId = null;
      this._mobileLookStart = null;
    };

    lookPad.addEventListener('pointerdown', lookStart);
    lookPad.addEventListener('pointermove', lookMove);
    lookPad.addEventListener('pointerup', lookEnd);
    lookPad.addEventListener('pointercancel', lookEnd);
    lookPad.addEventListener('pointerleave', lookEnd);
    lookPad.addEventListener('pointerout', lookEnd);
    this._mobileNavBoundHandlers.push(
      { el: lookPad, type: 'pointerdown', handler: lookStart },
      { el: lookPad, type: 'pointermove', handler: lookMove },
      { el: lookPad, type: 'pointerup', handler: lookEnd },
      { el: lookPad, type: 'pointercancel', handler: lookEnd },
      { el: lookPad, type: 'pointerleave', handler: lookEnd },
      { el: lookPad, type: 'pointerout', handler: lookEnd }
    );
  }

  toggle3D() {
    if (this.is3DMode) {
      this.exit3D();
    } else {
      this.enter3D();
    }
  }

  enter3D() {
    const app = this.app;

    this.is3DMode = true;
    app.hostElement.setAttribute('data-mode', '3d');

    const container = app.$('canvas-container');
    if (!this.viewer3D) {
      this.viewer3D = new Viewer3D(container, app.root);
      this.viewer3D.onNavModeChange = (mode) => {
        const btnNav = app.$('btn-nav-mode');
        if (!btnNav) return;
        if (mode === 'orbit') {
          btnNav.textContent = 'Orbit';
          btnNav.classList.remove('active');
          this._setNavModeAttribute('orbit');
          this._clearMobileWalkInput();
          app._status(this._isMobilePointerEnvironment()
            ? 'Orbit mode — one-finger drag to look'
            : 'Orbit mode — drag to rotate, scroll to zoom'
          );
        } else {
          btnNav.textContent = 'Walk';
          btnNav.classList.add('active');
          this._setNavModeAttribute('fps');
          app._status(this._isMobilePointerEnvironment()
            ? 'Walk mode — use arrows + right drag'
            : 'Walk mode — WASD to move, click to lock mouse'
          );
          this._applyMobileWalkVector();
        }
      };
    }

    this.viewer3D.buildScene(app.stories, app.terrainWidth, app.terrainHeight, app.axisOrigin);
    this.viewer3D.resize();
    this.viewer3D.start();

    const btn3d = app.$('btn-3d');
    if (btn3d) btn3d.classList.add('active');
    const btnNav = app.$('btn-nav-mode');
    if (btnNav) btnNav.style.display = '';
    this._setNavModeAttribute('orbit');

    app._status('3D View — Press 0 to return to 2D');
  }

  exit3D() {
    const app = this.app;

    if (this.viewer3D) {
      this.viewer3D.stop();
      this.viewer3D.setNavigationMode('orbit');
    }
    this._setNavModeAttribute(null);
    this.is3DMode = false;
    app.hostElement.removeAttribute('data-mode');

    const btn3d = app.$('btn-3d');
    if (btn3d) btn3d.classList.remove('active');
    const btnNav = app.$('btn-nav-mode');
    if (btnNav) {
      btnNav.style.display = 'none';
      btnNav.textContent = 'Orbit';
      btnNav.classList.remove('active');
    }
    this._clearMobileWalkInput();

    app._render();
    app._status('2D View');
  }

  toggleNavMode() {
    const app = this.app;
    if (!this.viewer3D || !this.is3DMode) return;
    const btnNav = app.$('btn-nav-mode');
    if (this.viewer3D.navMode === 'orbit') {
      this.viewer3D.setNavigationMode('fps');
      if (btnNav) { btnNav.textContent = 'Walk'; btnNav.classList.add('active'); }
      app._status(this._isMobilePointerEnvironment()
        ? 'Walk mode — use arrows + right drag'
        : 'Walk mode — WASD to move, click to lock mouse'
      );
    } else {
      this.viewer3D.setNavigationMode('orbit');
      if (btnNav) { btnNav.textContent = 'Orbit'; btnNav.classList.remove('active'); }
      app._status(this._isMobilePointerEnvironment()
        ? 'Orbit mode — one-finger drag to look'
        : 'Orbit mode — drag to rotate, scroll to zoom'
      );
      this._clearMobileWalkInput();
    }
  }

  destroy() {
    for (const { el, type, handler } of this._mobileNavBoundHandlers) {
      el.removeEventListener(type, handler);
    }
    this._mobileNavBoundHandlers.length = 0;
    this._mobileWalkMovePointers.clear();
    this._clearMobileWalkInput();

    if (this.viewer3D) {
      this.viewer3D.dispose();
      this.viewer3D = null;
    }
  }
}

// ── InputManager.js ─────────────────────────────────────
// Manages canvas input events: pointer/mouse, keyboard, wheel.
// Handles gesture recognition (pan, pinch-to-zoom) and coordinate conversion.
// Delegates tool/entity actions to the app via callbacks.

import { CONFIG } from './config.js';
import { Geom } from './geometry.js';

export class InputManager {
  constructor(canvas, hostElement, app) {
    this.canvas = canvas;
    this.hostElement = hostElement;
    this.app = app;
    this._listeners = [];

    // Pointer tracking
    this._pointers = new Map();
    this._pinchState = null;
    this._primaryPointerId = null;

    // Pan state
    this.isPanning = false;
    this.panStart = null;

    this._bindEvents();
  }

  // ── Coordinate Conversion ───────────────────

  _getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { sx: e.clientX - rect.left, sy: e.clientY - rect.top };
  }

  _isInsideCanvas(sx, sy) {
    const rect = this.canvas.getBoundingClientRect();
    return sx >= 0 && sy >= 0 && sx <= rect.width && sy <= rect.height;
  }

  _pointerToWorld(sx, sy) {
    const world = this.screenToWorld(sx, sy);
    return { world, snapped: this._snap(world.x, world.y) };
  }

  _syncPointerMove(world, snapped) {
    this.app.mouseWorld = snapped;
    this.app._handleCanvasMove(world, snapped);
  }

  screenToWorld(sx, sy) {
    return {
      x: (sx - this.app.panX) / this.app.zoom,
      y: (sy - this.app.panY) / this.app.zoom,
    };
  }

  _snap(wx, wy) {
    let x = wx, y = wy;
    this.app.snapPoint = null;

    if (this.app.snapEndpoint) {
      let minDist = CONFIG.SNAP_RADIUS / this.app.zoom;
      for (const wall of this.app.walls) {
        for (const pt of [{ x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 }]) {
          const d = Geom.dist(wx, wy, pt.x, pt.y);
          if (d < minDist) { minDist = d; x = pt.x; y = pt.y; this.app.snapPoint = { x, y, type: 'endpoint' }; }
        }
      }
    }

    if (this.app.snapGrid && !this.app.snapPoint) {
      const s = Geom.snapToGrid(x, y, this.app.gridSize);
      x = s.x; y = s.y;
      this.app.snapPoint = { x, y, type: 'grid' };
    }

    if (this.app.snapAngle && this.app.isDrawing && this.app.drawStart) {
      const s = Geom.snapAngle(this.app.drawStart.x, this.app.drawStart.y, x, y, this.app.snapAngleDeg);
      x = s.x; y = s.y;
      if (this.app.snapGrid) { const g = Geom.snapToGrid(x, y, this.app.gridSize); x = g.x; y = g.y; }
    }

    return { x, y };
  }

  // ── Zoom ─────────────────────────────────────

  _setZoomAround(sx, sy, nextZoom) {
    const clamped = Math.max(CONFIG.MIN_ZOOM, Math.min(CONFIG.MAX_ZOOM, nextZoom));
    const world = this.screenToWorld(sx, sy);
    this.app.zoom = clamped;
    this.app.panX = sx - world.x * clamped;
    this.app.panY = sy - world.y * clamped;
    this.app.$('zoom-display').textContent = Math.round(this.app.zoom * 100) + '%';
  }

  // ── Event Binding ────────────────────────────

  _bindEvents() {
    const cv = this.canvas;

    const on = (target, type, handler, options = false) => {
      if (!target || !type || !handler) return;
      target.addEventListener(type, handler, options);
      this._listeners.push({ target, type, handler, options });
    };

    const focus = (e) => {
      if (this.hostElement) this.hostElement.focus();
    };
    const onPointerDown = (e) => this._onPointerDown(e);
    const onPointerMove = (e) => this._onPointerMove(e);
    const onPointerUp = (e) => this._onPointerUp(e);
    const onPointerCancel = (e) => this._onPointerUp(e);
    const onMouseDown = (e) => this._onMouseDown(e);
    const onMouseMove = (e) => this._onMouseMove(e);
    const onMouseUp = (e) => this._onMouseUp(e);
    const onWheel = (e) => this._onWheel(e);
    const onContextMenu = (e) => {
      e.preventDefault();
      this.app._onRightClick();
    };
    const onKeyDown = (e) => this._onKeyDown(e);
    const onKeyUp = (e) => this._onKeyUp(e);

    // Unified pointer events (with mouse fallback for very old browsers)
    if ('PointerEvent' in window) {
      on(cv, 'pointerdown', onPointerDown, { passive: false });
      on(cv, 'pointermove', onPointerMove, { passive: false });
      on(cv, 'pointerup', onPointerUp, { passive: false });
      on(cv, 'pointercancel', onPointerCancel);
      on(cv, 'pointerleave', onPointerCancel);
      on(cv, 'pointerout', onPointerCancel);
      on(window, 'pointermove', onPointerMove, { passive: false });
      on(window, 'pointerup', onPointerUp, { passive: false });
      on(window, 'pointercancel', onPointerCancel);
    } else {
      on(cv, 'mousedown', onMouseDown);
      on(cv, 'mousemove', onMouseMove);
      on(cv, 'mouseup', onMouseUp);
      on(window, 'mousemove', onMouseMove);
      on(window, 'mouseup', onMouseUp);
    }

    on(cv, 'wheel', onWheel, { passive: false });
    on(cv, 'contextmenu', onContextMenu);

    on(this.hostElement, 'keydown', onKeyDown);
    on(this.hostElement, 'keyup', onKeyUp);

    // Focus canvas on click
    on(cv, 'pointerdown', focus, { capture: true, passive: true });
    on(cv, 'mousedown', focus, { capture: true, passive: true });
  }

  destroy() {
    for (const { target, type, handler, options } of this._listeners) {
      target?.removeEventListener(type, handler, options);
    }
    this._listeners.length = 0;
    this._pointers.clear();
    this._pinchState = null;
    this._primaryPointerId = null;
    this.isPanning = false;
    this.panStart = null;
    this.app = null;
    this.canvas = null;
    this.hostElement = null;
  }

  // ── Mouse Handlers (fallback) ────────────────

  _onMouseDown(e) {
    if (this.app.is3DMode) return;
    if (e.button === 1 || e.button === 2) {
      this._startPanning(e);
      return;
    }
    this.app._startToolAction(e);
  }

  _onMouseMove(e) {
    if (this.app.is3DMode) return;
    const { sx, sy } = this._getCanvasCoords(e);
    if (this.isPanning) {
      this.app.panX = this.panStart.panX + (e.clientX - this.panStart.x);
      this.app.panY = this.panStart.panY + (e.clientY - this.panStart.y);
      this.app._render();
      return;
    }

    const { world, snapped } = this._pointerToWorld(sx, sy);
    this._syncPointerMove(world, snapped);
  }

  _onMouseUp() {
    if (this.app.is3DMode) return;
    if (this.isPanning) {
      this.isPanning = false;
      this.canvas.style.cursor = 'crosshair';
    }
    if (this.app.drag.isDragging) this.app._finishDrag();
  }

  // ── Pointer Handlers (touch + mouse unified) ─

  _onPointerDown(e) {
    if (this.app.is3DMode) return;
    if (e.button === 2) return;
    e.preventDefault();

    this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!this._primaryPointerId) this._primaryPointerId = e.pointerId;

    // Pinch detection (2+ pointers)
    if (this._pointers.size >= 2) {
      const ids = [...this._pointers.keys()];
      const p1 = this._pointers.get(ids[0]);
      const p2 = this._pointers.get(ids[1]);
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      this._pinchState = {
        ids: [ids[0], ids[1]],
        startDist: Math.max(1, Math.hypot(dx, dy)),
        startZoom: this.app.zoom,
      };
      this.isPanning = false;
      this.app.drag.isDragging = false;
      this.app.drag._dragFurniture = null;
      this.app.drag.dragWall = null;
      this.app.drag._dragFurnitureOffset = null;
      return;
    }

    if (e.pointerType === 'mouse' && !e.isPrimary) return;
    if (e.button === 1 || e.button === 2 || e.button === 5) {
      this._startPanning(e);
      return;
    }
    this.app._startToolAction(e);
  }

  _onPointerMove(e) {
    if (this.app.is3DMode) return;

    if (!this._pointers.has(e.pointerId)) {
      // Hover move (pointer not down) — update cursor/snap/preview within canvas
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      if (this._isInsideCanvas(sx, sy)) {
        const { world, snapped } = this._pointerToWorld(sx, sy);
        this._syncPointerMove(world, snapped);
      }
      return;
    }

    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Pinch-to-zoom
    if (this._pinchState && this._pinchState.ids.includes(e.pointerId)) {
      const [id1, id2] = this._pinchState.ids;
      const p1 = this._pointers.get(id1);
      const p2 = this._pointers.get(id2);
      if (!p1 || !p2) return;

      const cx = (p1.x + p2.x) / 2 - rect.left;
      const cy = (p1.y + p2.y) / 2 - rect.top;
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const nextZoom = this._pinchState.startZoom * (dist / this._pinchState.startDist);
      this._setZoomAround(cx, cy, nextZoom);
      this.app._render();
      return;
    }

    if (!this._primaryPointerId || e.pointerId !== this._primaryPointerId) return;

    const { sx, sy } = { sx: e.clientX - rect.left, sy: e.clientY - rect.top };
    const { world, snapped } = this._pointerToWorld(sx, sy);
    if (this.isPanning) {
      this.app.panX = this.panStart.panX + (e.clientX - this.panStart.x);
      this.app.panY = this.panStart.panY + (e.clientY - this.panStart.y);
      this.app._render();
      return;
    }
    this._syncPointerMove(world, snapped);
  }

  _onPointerUp(e) {
    if (this.app.is3DMode) return;
    e.preventDefault();
    this._pointers.delete(e.pointerId);
    if (this._pinchState && this._pinchState.ids.includes(e.pointerId)) {
      this._pinchState = null;
    }

    if (this._primaryPointerId === e.pointerId) {
      const remaining = [...this._pointers.keys()];
      this._primaryPointerId = remaining[0] || null;
    }

    if (this._pointers.size === 0) {
      if (this.isPanning) {
        this.isPanning = false;
        this.canvas.style.cursor = 'crosshair';
      }
      if (this.app.drag.isDragging) this.app._finishDrag();
    }
  }

  // ── Pan ──────────────────────────────────────

  _startPanning(e) {
    this.isPanning = true;
    this.panStart = { x: e.clientX, y: e.clientY, panX: this.app.panX, panY: this.app.panY };
    this.canvas.style.cursor = 'grabbing';
  }

  // ── Wheel ────────────────────────────────────

  _onWheel(e) {
    if (this.app.is3DMode) return;
    e.preventDefault();
    const { sx, sy } = this._getCanvasCoords(e);
    const delta = e.deltaY > 0 ? -CONFIG.ZOOM_STEP : CONFIG.ZOOM_STEP;
    const nextZoom = this.app.zoom + delta * this.app.zoom;
    this._setZoomAround(sx, sy, nextZoom);
    this.app._render();
  }

  // ── Keyboard ─────────────────────────────────

  _onKeyDown(e) {
    const active = this.app.root.activeElement;
    const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');

    // Undo/redo — works in any tab
    if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); this.app._undo(); return; }
    if (e.ctrlKey && e.shiftKey && e.key === 'Z') { e.preventDefault(); this.app._redo(); return; }

    // 3D toggle — works always
    if (e.key === '0' && !e.ctrlKey && !e.altKey && !e.metaKey && !isInput) {
      if (this.app.activeTab === 'creative') this.app._toggle3D();
      return;
    }

    // Skip 2D shortcuts when in 3D mode
    if (this.app.is3DMode) return;

    if (e.code === 'Space' && !e.repeat) this.canvas.style.cursor = 'grab';

    if (e.key === 'Escape') {
      if (this.app.polylinePoints.length > 0) {
        this.app._finishPolyline();
      } else if (this.app.isDrawing) {
        this.app.isDrawing = false;
        this.app.drawStart = null;
        this.app._status('Cancelled');
      }
      this.app._clearSelection();
      this.app._syncSelection();
      this.app._render();
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
      this.app._deleteSelected();
    }

    if (!e.ctrlKey && !e.altKey && !e.metaKey && !isInput) {
      if (e.key === '1') this.app._switchLayer('structure');
      if (e.key === '2') this.app._switchLayer('furniture');
      if (e.key === '3') this.app._switchLayer('electrical');
      if (e.key === '4') this.app._switchLayer('plumbing');
      if (e.key === 'b') this.app._switchTab('costs');

      const layerShortcut = this.app._getToolShortcuts();
      const toolForKey = layerShortcut ? layerShortcut[e.key] : '';
      if (toolForKey) this.app._setTool(toolForKey);

      if (e.key === 'PageUp') { e.preventDefault(); this.app._switchStory(this.app.activeStoryIndex + 1); }
      if (e.key === 'PageDown') { e.preventDefault(); this.app._switchStory(this.app.activeStoryIndex - 1); }
    }
  }

  _onKeyUp(e) {
    if (e.code === 'Space') this.canvas.style.cursor = 'crosshair';
  }
}

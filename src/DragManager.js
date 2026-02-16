// ── DragManager.js ─────────────────────────────────────
// Extracted from App.js — wall and furniture dragging logic.

import { CONFIG } from './config.js';
import { Geom } from './geometry.js';

export class DragManager {
  constructor(app) {
    this.app = app;

    // Drag state
    this.isDragging = false;
    this.dragType = null;
    this.dragWall = null;
    this.dragOffset = null;
    this.dragStartState = null;
    this._dragFurniture = null;
    this._dragFurnitureOffset = null;
  }

  tryStartDrag(wx, wy, snapped) {
    const app = this.app;
    if (!app.selectedWall) return false;
    const wall = app.selectedWall;
    const threshold = CONFIG.SNAP_RADIUS / app.zoom;

    if (Geom.dist(wx, wy, wall.x1, wall.y1) < threshold) {
      this.isDragging = true;
      this.dragType = 'endpoint1';
      this.dragWall = wall;
      this.dragStartState = { x1: wall.x1, y1: wall.y1, x2: wall.x2, y2: wall.y2 };
      app.canvas.style.cursor = 'move';
      app._pushHistory();
      return true;
    }
    if (Geom.dist(wx, wy, wall.x2, wall.y2) < threshold) {
      this.isDragging = true;
      this.dragType = 'endpoint2';
      this.dragWall = wall;
      this.dragStartState = { x1: wall.x1, y1: wall.y1, x2: wall.x2, y2: wall.y2 };
      app.canvas.style.cursor = 'move';
      app._pushHistory();
      return true;
    }
    if (wall.hitTest(wx, wy)) {
      this.isDragging = true;
      this.dragType = 'body';
      this.dragWall = wall;
      this.dragOffset = { dx: wx - wall.x1, dy: wy - wall.y1 };
      this.dragStartState = { x1: wall.x1, y1: wall.y1, x2: wall.x2, y2: wall.y2 };
      app.canvas.style.cursor = 'move';
      app._pushHistory();
      return true;
    }
    return false;
  }

  doDrag(sx, sy) {
    const wall = this.dragWall;
    if (!wall) return;

    if (this.dragType === 'endpoint1') {
      wall.x1 = sx; wall.y1 = sy;
    } else if (this.dragType === 'endpoint2') {
      wall.x2 = sx; wall.y2 = sy;
    } else if (this.dragType === 'body') {
      const dx = sx - this.dragOffset.dx - wall.x1;
      const dy = sy - this.dragOffset.dy - wall.y1;
      wall.x1 += dx; wall.y1 += dy;
      wall.x2 += dx; wall.y2 += dy;
    }
    this.app._syncSelection();
  }

  finishDrag() {
    const app = this.app;
    if (this.isDragging && this.dragWall) {
      const wall = this.dragWall;
      if (wall.length < CONFIG.MIN_WALL_LENGTH) {
        const s = this.dragStartState;
        wall.x1 = s.x1; wall.y1 = s.y1;
        wall.x2 = s.x2; wall.y2 = s.y2;
        app._status('Wall too short — reverted');
      } else {
        app._status('Wall moved');
      }
      app._syncSelection();
      app._render();
      app._schedulePersist();
    }
    if (this.isDragging && this._dragFurniture) {
      app._status('Furniture moved');
      app._syncSelection();
      app._render();
      app._schedulePersist();
    }
    this.isDragging = false;
    this.dragType = null;
    this.dragWall = null;
    this.dragOffset = null;
    this.dragStartState = null;
    this._dragFurniture = null;
    this._dragFurnitureOffset = null;
    app.canvas.style.cursor = app.activeTool === 'select' ? 'default' : 'crosshair';
  }

  tryStartFurnitureDrag(wx, wy) {
    const app = this.app;
    if (!app.selectedFurniture) return false;
    if (!app.selectedFurniture.hitTest(wx, wy)) return false;
    this.isDragging = true;
    this._dragFurniture = app.selectedFurniture;
    this._dragFurnitureOffset = { dx: wx - app.selectedFurniture.x, dy: wy - app.selectedFurniture.y };
    app.canvas.style.cursor = 'move';
    app._pushHistory();
    return true;
  }
}

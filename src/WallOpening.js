// ── WallOpening.js ─────────────────────────────────────
// Base class for Door and Window — shared wall-position logic.

import { CONFIG } from './config.js';
import { Geom } from './geometry.js';
import { nextId } from './IdGenerator.js';

export class WallOpening {
  constructor(wall, position, width) {
    this.wall = wall;
    this.position = position; // 0–1 along wall
    this.width = width;       // cm
    this.id = nextId();
  }

  get center() {
    const t = this.position;
    return {
      x: this.wall.x1 + (this.wall.x2 - this.wall.x1) * t,
      y: this.wall.y1 + (this.wall.y2 - this.wall.y1) * t,
    };
  }

  get endpoints() {
    const a = Geom.angle(this.wall.x1, this.wall.y1, this.wall.x2, this.wall.y2);
    const c = this.center;
    const half = this.width / 2;
    const dx = Math.cos(a) * half;
    const dy = Math.sin(a) * half;
    return {
      p1: { x: c.x - dx, y: c.y - dy },
      p2: { x: c.x + dx, y: c.y + dy },
    };
  }

  hitTest(px, py) {
    const c = this.center;
    return Geom.dist(px, py, c.x, c.y) <= this.width / 2 + CONFIG.HIT_MARGIN;
  }
}

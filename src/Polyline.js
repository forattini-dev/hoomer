// ── Polyline.js ─────────────────────────────────────
// Base class for Wire and Pipe — shared points/length/hitTest logic.

import { CONFIG } from './config.js';
import { Geom } from './geometry.js';
import { nextId } from './IdGenerator.js';

export class Polyline {
  constructor(points = []) {
    this.points = points;
    this.id = nextId();
  }

  get totalLength() {
    let len = 0;
    for (let i = 1; i < this.points.length; i++) {
      len += Geom.dist(this.points[i - 1].x, this.points[i - 1].y, this.points[i].x, this.points[i].y);
    }
    return len;
  }

  hitTest(px, py) {
    const threshold = CONFIG.HIT_MARGIN_LINE;
    for (let i = 1; i < this.points.length; i++) {
      const d = Geom.pointToSegmentDist(px, py,
        this.points[i - 1].x, this.points[i - 1].y,
        this.points[i].x, this.points[i].y);
      if (d <= threshold) return true;
    }
    return false;
  }
}

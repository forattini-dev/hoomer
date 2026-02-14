import { CONFIG } from './config.js';
import { Geom } from './geometry.js';

let nextId = 1;

export class Window {
  constructor(wall, position, width = 60, windowType = 'fixed', height = CONFIG.DEFAULT_WINDOW_HEIGHT, sillHeight = CONFIG.DEFAULT_WINDOW_SILL_HEIGHT) {
    this.wall = wall;
    this.position = position; // 0–1 along wall
    this.width = width;       // cm
    this.windowType = windowType; // 'fixed' | 'sliding' | 'casement'
    this.height = height;           // cm (3D)
    this.sillHeight = sillHeight;   // cm (3D)
    this.id = nextId++;
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
    return Geom.dist(px, py, c.x, c.y) <= this.width / 2 + 5;
  }

  serialize(wallIndex) {
    return {
      wallIndex,
      position: this.position,
      width: this.width,
      windowType: this.windowType,
      height: this.height,
      sillHeight: this.sillHeight,
    };
  }

  static fromData(d, wall) {
    return new Window(wall, d.position, d.width, d.windowType || 'fixed', d.height || CONFIG.DEFAULT_WINDOW_HEIGHT, d.sillHeight || CONFIG.DEFAULT_WINDOW_SILL_HEIGHT);
  }
}

import { CONFIG } from './config.js';
import { Geom } from './geometry.js';

let nextId = 1;

export class Door {
  constructor(wall, position, width = 80, hingeSide = 'left', openDir = 1, doorType = 'single', height = CONFIG.DEFAULT_DOOR_HEIGHT) {
    this.wall = wall;
    this.position = position; // 0–1 along wall
    this.width = width;       // cm
    this.hingeSide = hingeSide; // 'left' | 'right'
    this.openDir = openDir;     // 1 | -1 (which side of wall the door swings to)
    this.doorType = doorType;   // 'single' | 'double' | 'sliding'
    this.height = height;       // cm (3D)
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
      hingeSide: this.hingeSide,
      openDir: this.openDir,
      doorType: this.doorType,
      height: this.height,
    };
  }

  static fromData(d, wall) {
    return new Door(wall, d.position, d.width, d.hingeSide, d.openDir, d.doorType || 'single', d.height || CONFIG.DEFAULT_DOOR_HEIGHT);
  }
}

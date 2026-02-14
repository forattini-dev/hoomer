import { CONFIG } from './config.js';
import { Geom } from './geometry.js';

let nextId = 1;

export class Wall {
  constructor(x1, y1, x2, y2, thickness = CONFIG.DEFAULT_WALL_THICKNESS, material = CONFIG.DEFAULT_WALL_MATERIAL) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.thickness = thickness;
    this.material = material;
    this.id = nextId++;
  }

  get length() {
    return Geom.dist(this.x1, this.y1, this.x2, this.y2);
  }

  get angleDeg() {
    return Geom.angleDeg(this.x1, this.y1, this.x2, this.y2);
  }

  get rect() {
    return Geom.wallRect(this.x1, this.y1, this.x2, this.y2, this.thickness);
  }

  hitTest(px, py) {
    return Geom.pointToSegmentDist(px, py, this.x1, this.y1, this.x2, this.y2) <= this.thickness / 2 + 3;
  }

  serialize() {
    return {
      x1: this.x1, y1: this.y1,
      x2: this.x2, y2: this.y2,
      thickness: this.thickness,
      material: this.material,
    };
  }

  static fromData(d) {
    return new Wall(d.x1, d.y1, d.x2, d.y2, d.thickness, d.material);
  }
}

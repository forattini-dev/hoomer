import { CONFIG } from './config.js';
import { Geom } from './geometry.js';
import { nextId } from './IdGenerator.js';

export class Wall {
  constructor(x1, y1, x2, y2, thickness = CONFIG.DEFAULT_WALL_THICKNESS, material = CONFIG.DEFAULT_WALL_MATERIAL) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.thickness = thickness;
    this.material = material;
    this.id = nextId();
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
    return Geom.pointToSegmentDist(px, py, this.x1, this.y1, this.x2, this.y2) <= this.thickness / 2 + CONFIG.HIT_MARGIN;
  }

  serialize() {
    return {
      x1: this.x1, y1: this.y1,
      x2: this.x2, y2: this.y2,
      thickness: this.thickness,
      material: this.material,
      id: this.id,
    };
  }

  static fromData(d) {
    const wall = new Wall(d.x1, d.y1, d.x2, d.y2, d.thickness, d.material);
    if (d.id) wall.id = d.id;
    return wall;
  }
}

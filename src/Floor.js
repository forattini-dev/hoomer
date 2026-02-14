import { CONFIG } from './config.js';
import { Geom } from './geometry.js';

let nextId = 1;

export class Floor {
  constructor(polygon, material = CONFIG.DEFAULT_FLOOR_MATERIAL) {
    this.polygon = polygon;
    this.material = material;
    this.id = nextId++;
  }

  hitTest(px, py) {
    return Geom.pointInPolygon(px, py, this.polygon);
  }

  serialize() {
    return { polygon: this.polygon.map(p => ({ ...p })), material: this.material };
  }

  static fromData(d) {
    return new Floor(d.polygon, d.material);
  }
}

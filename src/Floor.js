import { CONFIG } from './config.js';
import { Geom } from './geometry.js';
import { nextId } from './IdGenerator.js';

export class Floor {
  constructor(polygon, material = CONFIG.DEFAULT_FLOOR_MATERIAL) {
    this.polygon = polygon;
    this.material = material;
    this.id = nextId();
  }

  hitTest(px, py) {
    return Geom.pointInPolygon(px, py, this.polygon);
  }

  serialize() {
    return { polygon: this.polygon.map(p => ({ ...p })), material: this.material, id: this.id };
  }

  static fromData(d) {
    const floor = new Floor(d.polygon, d.material);
    if (d.id) floor.id = d.id;
    return floor;
  }
}

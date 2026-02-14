import { Geom } from './geometry.js';

let nextId = 1;

export class Wire {
  constructor(points = [], gauge = 2.5) {
    this.points = points;
    this.gauge = gauge;
    this.id = nextId++;
  }

  get totalLength() {
    let len = 0;
    for (let i = 1; i < this.points.length; i++) {
      len += Geom.dist(this.points[i - 1].x, this.points[i - 1].y, this.points[i].x, this.points[i].y);
    }
    return len;
  }

  hitTest(px, py) {
    const threshold = 6;
    for (let i = 1; i < this.points.length; i++) {
      const d = Geom.pointToSegmentDist(px, py,
        this.points[i - 1].x, this.points[i - 1].y,
        this.points[i].x, this.points[i].y);
      if (d <= threshold) return true;
    }
    return false;
  }

  serialize() {
    return {
      points: this.points.map(p => ({ x: p.x, y: p.y })),
      gauge: this.gauge,
    };
  }

  static fromData(d) {
    return new Wire(d.points, d.gauge);
  }
}

import { Polyline } from './Polyline.js';

export class Wire extends Polyline {
  constructor(points = [], gauge = 2.5) {
    super(points);
    this.gauge = gauge;
  }

  serialize() {
    return {
      points: this.points.map(p => ({ x: p.x, y: p.y })),
      gauge: this.gauge,
      id: this.id,
    };
  }

  static fromData(d) {
    const wire = new Wire(d.points, d.gauge);
    if (d.id) wire.id = d.id;
    return wire;
  }
}

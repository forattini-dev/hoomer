import { Polyline } from './Polyline.js';

export class Pipe extends Polyline {
  constructor(points = [], pipeType = 'cold', diameter = 25, flowDir = 1) {
    super(points);
    this.pipeType = pipeType;
    this.diameter = diameter;
    this.flowDir = flowDir; // 1 = forward (start->end), -1 = reverse
  }

  serialize() {
    return {
      points: this.points.map(p => ({ x: p.x, y: p.y })),
      pipeType: this.pipeType,
      diameter: this.diameter,
      flowDir: this.flowDir,
      id: this.id,
    };
  }

  static fromData(d) {
    const pipe = new Pipe(d.points, d.pipeType, d.diameter, d.flowDir || 1);
    if (d.id) pipe.id = d.id;
    return pipe;
  }
}

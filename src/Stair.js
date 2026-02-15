let nextId = 1;

export class Stair {
  constructor(x, y, width = 100, length = 280, rotation = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.length = length;
    this.rotation = rotation; // degrees: 0, 90, 180, 270
    this.stepDepth = 28;
    this.id = nextId++;
  }

  get stepCount() {
    return Math.floor(this.length / this.stepDepth);
  }

  get corners() {
    const rad = this.rotation * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const pts = [
      { x: 0, y: 0 },
      { x: this.width, y: 0 },
      { x: this.width, y: this.length },
      { x: 0, y: this.length },
    ];
    return pts.map(p => ({
      x: this.x + p.x * cos - p.y * sin,
      y: this.y + p.x * sin + p.y * cos,
    }));
  }

  hitTest(px, py) {
    const rad = -this.rotation * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = px - this.x;
    const dy = py - this.y;
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    return lx >= 0 && lx <= this.width && ly >= 0 && ly <= this.length;
  }

  serialize() {
    return {
      x: this.x, y: this.y,
      width: this.width, length: this.length,
      rotation: this.rotation,
    };
  }

  static fromData(d) {
    return new Stair(d.x, d.y, d.width, d.length, d.rotation);
  }
}

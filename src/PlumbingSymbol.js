let nextId = 1;

export class PlumbingSymbol {
  constructor(x, y, symbolType = 'valve', rotation = 0) {
    this.x = x;
    this.y = y;
    this.symbolType = symbolType;
    this.rotation = rotation;
    this.id = nextId++;
  }

  hitTest(px, py) {
    const r = 14;
    const dx = px - this.x;
    const dy = py - this.y;
    return dx * dx + dy * dy <= r * r;
  }

  serialize() {
    return {
      x: this.x, y: this.y,
      symbolType: this.symbolType,
      rotation: this.rotation,
    };
  }

  static fromData(d) {
    return new PlumbingSymbol(d.x, d.y, d.symbolType, d.rotation);
  }
}

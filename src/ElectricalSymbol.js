let nextId = 1;

export class ElectricalSymbol {
  constructor(x, y, symbolType = 'outlet_low', rotation = 0, circuitId = '', amperageA = 10) {
    this.x = x;
    this.y = y;
    this.symbolType = symbolType;
    this.rotation = rotation;
    this.circuitId = circuitId;
    this.amperageA = amperageA;
    this.id = nextId++;
  }

  hitTest(px, py) {
    const r = this.symbolType === 'distribution_panel' ? 20 : 14;
    const dx = px - this.x;
    const dy = py - this.y;
    return dx * dx + dy * dy <= r * r;
  }

  serialize() {
    return {
      x: this.x, y: this.y,
      symbolType: this.symbolType,
      rotation: this.rotation,
      circuitId: this.circuitId,
      amperageA: this.amperageA,
    };
  }

  static fromData(d) {
    return new ElectricalSymbol(d.x, d.y, d.symbolType, d.rotation, d.circuitId || '', d.amperageA || 10);
  }
}

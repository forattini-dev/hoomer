import { nextPrefixedId } from './IdGenerator.js';

export class ElectricalPanel {
  constructor(x, y, name = 'QD-1', voltage = 220, phases = 1, mainBreakerA = 63, busCapacityA = 100) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.voltage = voltage;
    this.phases = phases;
    this.mainBreakerA = mainBreakerA;
    this.busCapacityA = busCapacityA;
    this.id = nextPrefixedId('panel');
  }

  hitTest(px, py) {
    const r = 24; // radius-based hit test (covers 40x12 rotated box)
    return (px - this.x) ** 2 + (py - this.y) ** 2 <= r * r;
  }

  serialize() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      name: this.name,
      voltage: this.voltage,
      phases: this.phases,
      mainBreakerA: this.mainBreakerA,
      busCapacityA: this.busCapacityA,
    };
  }

  static fromData(d) {
    const panel = new ElectricalPanel(d.x, d.y, d.name, d.voltage, d.phases, d.mainBreakerA, d.busCapacityA);
    if (d.id) panel.id = d.id;
    return panel;
  }
}


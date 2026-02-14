let nextId = 1;

export class ElectricalPanel {
  constructor(x, y, name = 'QD-1', voltage = 220, phases = 1, mainBreakerA = 63, busCapacityA = 100) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.voltage = voltage;
    this.phases = phases;
    this.mainBreakerA = mainBreakerA;
    this.busCapacityA = busCapacityA;
    this.id = `panel_${nextId++}`;
  }

  hitTest(px, py) {
    const w = 52;
    const h = 36;
    return px >= this.x - w / 2 && px <= this.x + w / 2 &&
      py >= this.y - h / 2 && py <= this.y + h / 2;
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


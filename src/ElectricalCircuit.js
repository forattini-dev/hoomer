import { nextPrefixedId } from './IdGenerator.js';

export class ElectricalCircuit {
  constructor(panelId, name = 'C1', breakerA = 20, poles = 1, curve = 'C') {
    this.panelId = panelId;
    this.name = name;
    this.breakerA = breakerA;
    this.poles = poles;
    this.curve = curve;
    this.id = nextPrefixedId('circuit');
  }

  serialize() {
    return {
      id: this.id,
      panelId: this.panelId,
      name: this.name,
      breakerA: this.breakerA,
      poles: this.poles,
      curve: this.curve,
    };
  }

  static fromData(d) {
    const c = new ElectricalCircuit(d.panelId, d.name, d.breakerA, d.poles, d.curve);
    if (d.id) c.id = d.id;
    return c;
  }
}


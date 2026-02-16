import { describe, it, expect, beforeEach } from 'vitest';
import { Wall } from '../Wall.js';
import { Floor } from '../Floor.js';
import { Door } from '../Door.js';
import { Window } from '../Window.js';
import { Stair } from '../Stair.js';
import { Label } from '../Label.js';
import { Wire } from '../Wire.js';
import { Pipe } from '../Pipe.js';
import { ElectricalPanel } from '../ElectricalPanel.js';
import { ElectricalCircuit } from '../ElectricalCircuit.js';
import { ElectricalSymbol } from '../ElectricalSymbol.js';
import { PlumbingSymbol } from '../PlumbingSymbol.js';
import { Furniture } from '../Furniture.js';
import { resetCounter } from '../IdGenerator.js';

beforeEach(() => {
  resetCounter(0);
});

describe('Wall round-trip', () => {
  it('serialize then fromData preserves all fields', () => {
    const wall = new Wall(0, 0, 200, 0, 15, 'brick');
    const data = wall.serialize();
    const restored = Wall.fromData(data);
    expect(restored.x1).toBe(0);
    expect(restored.y1).toBe(0);
    expect(restored.x2).toBe(200);
    expect(restored.y2).toBe(0);
    expect(restored.thickness).toBe(15);
    expect(restored.material).toBe('brick');
    expect(restored.id).toBe(data.id);
  });
});

describe('Floor round-trip', () => {
  it('serialize then fromData preserves polygon and material', () => {
    const polygon = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];
    const floor = new Floor(polygon, 'ceramic');
    const data = floor.serialize();
    const restored = Floor.fromData(data);
    expect(restored.polygon).toEqual(polygon);
    expect(restored.material).toBe('ceramic');
    expect(restored.id).toBe(data.id);
  });
});

describe('Door round-trip', () => {
  it('serialize with wallIndex then fromData with wall reference', () => {
    const wall = new Wall(0, 0, 300, 0);
    const door = new Door(wall, 0.5, 80, 'left', 1, 'single', 210);
    const wallIndex = 0;
    const data = door.serialize(wallIndex);

    expect(data.wallIndex).toBe(0);

    const restored = Door.fromData(data, wall);
    expect(restored.position).toBe(0.5);
    expect(restored.width).toBe(80);
    expect(restored.hingeSide).toBe('left');
    expect(restored.openDir).toBe(1);
    expect(restored.doorType).toBe('single');
    expect(restored.height).toBe(210);
    expect(restored.wall).toBe(wall);
    expect(restored.id).toBe(data.id);
  });
});

describe('Window round-trip', () => {
  it('serialize with wallIndex then fromData with wall reference', () => {
    const wall = new Wall(0, 0, 300, 0);
    const win = new Window(wall, 0.3, 60, 'casement', 120, 90);
    const data = win.serialize(0);

    expect(data.wallIndex).toBe(0);

    const restored = Window.fromData(data, wall);
    expect(restored.position).toBe(0.3);
    expect(restored.width).toBe(60);
    expect(restored.windowType).toBe('casement');
    expect(restored.height).toBe(120);
    expect(restored.sillHeight).toBe(90);
    expect(restored.wall).toBe(wall);
    expect(restored.id).toBe(data.id);
  });
});

describe('Stair round-trip', () => {
  it('serialize then fromData preserves all fields', () => {
    const stair = new Stair(50, 50, 100, 280, 90);
    const data = stair.serialize();
    const restored = Stair.fromData(data);
    expect(restored.x).toBe(50);
    expect(restored.y).toBe(50);
    expect(restored.width).toBe(100);
    expect(restored.length).toBe(280);
    expect(restored.rotation).toBe(90);
    expect(restored.id).toBe(data.id);
  });
});

describe('Label round-trip', () => {
  it('serialize then fromData preserves all fields', () => {
    const label = new Label(100, 200, 'Living Room', 18);
    const data = label.serialize();
    const restored = Label.fromData(data);
    expect(restored.x).toBe(100);
    expect(restored.y).toBe(200);
    expect(restored.text).toBe('Living Room');
    expect(restored.fontSize).toBe(18);
    expect(restored.id).toBe(data.id);
  });
});

describe('Wire round-trip', () => {
  it('serialize then fromData preserves points and gauge', () => {
    const points = [{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 0 }];
    const wire = new Wire(points, 4);
    const data = wire.serialize();
    const restored = Wire.fromData(data);
    expect(restored.points).toEqual(points);
    expect(restored.gauge).toBe(4);
    expect(restored.id).toBe(data.id);
  });
});

describe('Pipe round-trip', () => {
  it('serialize then fromData preserves all fields', () => {
    const points = [{ x: 0, y: 0 }, { x: 100, y: 100 }];
    const pipe = new Pipe(points, 'hot', 32, -1);
    const data = pipe.serialize();
    const restored = Pipe.fromData(data);
    expect(restored.points).toEqual(points);
    expect(restored.pipeType).toBe('hot');
    expect(restored.diameter).toBe(32);
    expect(restored.flowDir).toBe(-1);
    expect(restored.id).toBe(data.id);
  });
});

describe('ElectricalPanel round-trip', () => {
  it('serialize then fromData preserves all fields', () => {
    const panel = new ElectricalPanel(10, 20, 'QD-2', 127, 2, 40, 80);
    const data = panel.serialize();
    const restored = ElectricalPanel.fromData(data);
    expect(restored.x).toBe(10);
    expect(restored.y).toBe(20);
    expect(restored.name).toBe('QD-2');
    expect(restored.voltage).toBe(127);
    expect(restored.phases).toBe(2);
    expect(restored.mainBreakerA).toBe(40);
    expect(restored.busCapacityA).toBe(80);
    expect(restored.id).toBe(data.id);
  });
});

describe('ElectricalCircuit round-trip', () => {
  it('serialize then fromData preserves all fields', () => {
    const circuit = new ElectricalCircuit('panel_1', 'C3', 32, 2, 'B');
    const data = circuit.serialize();
    const restored = ElectricalCircuit.fromData(data);
    expect(restored.panelId).toBe('panel_1');
    expect(restored.name).toBe('C3');
    expect(restored.breakerA).toBe(32);
    expect(restored.poles).toBe(2);
    expect(restored.curve).toBe('B');
    expect(restored.id).toBe(data.id);
  });
});

describe('ElectricalSymbol round-trip', () => {
  it('serialize then fromData preserves all fields', () => {
    const sym = new ElectricalSymbol(30, 40, 'switch_single', 45, 'circuit_5', 15);
    const data = sym.serialize();
    const restored = ElectricalSymbol.fromData(data);
    expect(restored.x).toBe(30);
    expect(restored.y).toBe(40);
    expect(restored.symbolType).toBe('switch_single');
    expect(restored.rotation).toBe(45);
    expect(restored.circuitId).toBe('circuit_5');
    expect(restored.amperageA).toBe(15);
    expect(restored.id).toBe(data.id);
  });
});

describe('PlumbingSymbol round-trip', () => {
  it('serialize then fromData preserves all fields', () => {
    const sym = new PlumbingSymbol(60, 70, 'drain', 180);
    const data = sym.serialize();
    const restored = PlumbingSymbol.fromData(data);
    expect(restored.x).toBe(60);
    expect(restored.y).toBe(70);
    expect(restored.symbolType).toBe('drain');
    expect(restored.rotation).toBe(180);
    expect(restored.id).toBe(data.id);
  });
});

describe('Furniture round-trip', () => {
  it('serialize then fromData preserves all fields', () => {
    const furn = new Furniture(100, 200, 'sofa_2seat', 90);
    const data = furn.serialize();
    const restored = Furniture.fromData(data);
    expect(restored.x).toBe(100);
    expect(restored.y).toBe(200);
    expect(restored.furnitureType).toBe('sofa_2seat');
    expect(restored.rotation).toBe(90);
    expect(restored.id).toBe(data.id);
  });
});

describe('Entity id assignment', () => {
  it('entities get sequential ids from the shared counter', () => {
    const wall = new Wall(0, 0, 100, 0);
    const floor = new Floor([{ x: 0, y: 0 }], 'ceramic');
    const label = new Label(0, 0, 'Test');
    expect(wall.id).toBe(1);
    expect(floor.id).toBe(2);
    expect(label.id).toBe(3);
  });

  it('prefixed entities get prefixed sequential ids', () => {
    const panel = new ElectricalPanel(0, 0);
    const circuit = new ElectricalCircuit('p1', 'C1');
    expect(panel.id).toBe('panel_1');
    expect(circuit.id).toBe('circuit_2');
  });
});

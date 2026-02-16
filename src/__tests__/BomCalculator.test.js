import { describe, it, expect, beforeEach } from 'vitest';
import { BomCalculator } from '../BomCalculator.js';
import { Wall } from '../Wall.js';
import { Floor } from '../Floor.js';
import { Door } from '../Door.js';
import { Window } from '../Window.js';
import { Stair } from '../Stair.js';
import { Wire } from '../Wire.js';
import { Pipe } from '../Pipe.js';
import { ElectricalPanel } from '../ElectricalPanel.js';
import { ElectricalCircuit } from '../ElectricalCircuit.js';
import { ElectricalSymbol } from '../ElectricalSymbol.js';
import { PlumbingSymbol } from '../PlumbingSymbol.js';
import { resetCounter } from '../IdGenerator.js';

beforeEach(() => {
  resetCounter(0);
});

function emptyStory(name = 'Ground Floor') {
  return {
    name,
    layers: {
      structure: { walls: [], doors: [], windows: [], floors: [], stairs: [], labels: [] },
      furniture: { items: [] },
      electrical: { panels: [], circuits: [], wires: [], symbols: [] },
      plumbing: { pipes: [], symbols: [] },
    },
  };
}

describe('BomCalculator.calculate', () => {
  it('returns empty items for empty story', () => {
    const result = BomCalculator.calculate([emptyStory()]);
    expect(result.stories).toHaveLength(1);
    expect(result.stories[0].items).toHaveLength(0);
    expect(result.totals).toHaveLength(0);
  });

  it('counts walls grouped by material and thickness', () => {
    const story = emptyStory();
    story.layers.structure.walls = [
      new Wall(0, 0, 200, 0, 15, 'brick'),
      new Wall(0, 0, 0, 300, 15, 'brick'),
    ];
    const result = BomCalculator.calculate([story]);
    const wallItems = result.stories[0].items.filter(i => i.category === 'Walls');
    expect(wallItems).toHaveLength(1);
    expect(wallItems[0].count).toBe(2);
    expect(wallItems[0].unit).toBe('m');
  });

  it('counts doors grouped by type and width', () => {
    const story = emptyStory();
    const wall = new Wall(0, 0, 500, 0);
    story.layers.structure.walls = [wall];
    story.layers.structure.doors = [
      new Door(wall, 0.3, 80, 'left', 1, 'single'),
      new Door(wall, 0.7, 80, 'right', 1, 'single'),
    ];
    const result = BomCalculator.calculate([story]);
    const doorItems = result.stories[0].items.filter(i => i.category === 'Doors');
    expect(doorItems).toHaveLength(1);
    expect(doorItems[0].count).toBe(2);
    expect(doorItems[0].unit).toBe('pcs');
  });

  it('counts windows grouped by type and width', () => {
    const story = emptyStory();
    const wall = new Wall(0, 0, 500, 0);
    story.layers.structure.walls = [wall];
    story.layers.structure.windows = [
      new Window(wall, 0.5, 60, 'fixed'),
    ];
    const result = BomCalculator.calculate([story]);
    const winItems = result.stories[0].items.filter(i => i.category === 'Windows');
    expect(winItems).toHaveLength(1);
    expect(winItems[0].count).toBe(1);
  });

  it('counts stairs', () => {
    const story = emptyStory();
    story.layers.structure.stairs = [new Stair(0, 0, 100, 280)];
    const result = BomCalculator.calculate([story]);
    const stairItems = result.stories[0].items.filter(i => i.category === 'Stairs');
    expect(stairItems).toHaveLength(1);
    expect(stairItems[0].count).toBe(1);
  });

  it('calculates floor area using shoelace formula', () => {
    const story = emptyStory();
    // 100x100 square = 10000 sq cm = 1 m2
    const polygon = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];
    story.layers.structure.floors = [new Floor(polygon, 'ceramic')];
    const result = BomCalculator.calculate([story]);
    const floorItems = result.stories[0].items.filter(i => i.category === 'Floors');
    expect(floorItems).toHaveLength(1);
    expect(parseFloat(floorItems[0].quantity)).toBeCloseTo(1.0);
    expect(floorItems[0].unit).toBe('m\u00B2');
  });

  it('aggregates totals across multiple stories', () => {
    const story1 = emptyStory('Ground Floor');
    story1.layers.structure.walls = [new Wall(0, 0, 200, 0, 15, 'brick')];

    const story2 = emptyStory('Floor 1');
    story2.layers.structure.walls = [new Wall(0, 0, 300, 0, 15, 'brick')];

    const result = BomCalculator.calculate([story1, story2]);
    expect(result.stories).toHaveLength(2);
    const totalWall = result.totals.find(t => t.category === 'Walls');
    expect(totalWall).toBeDefined();
    expect(totalWall.count).toBe(2);
  });

  it('counts electrical components', () => {
    const story = emptyStory();
    story.layers.electrical.panels = [new ElectricalPanel(0, 0, 'QD-1')];
    story.layers.electrical.circuits = [new ElectricalCircuit('panel_1', 'C1', 20)];
    story.layers.electrical.wires = [new Wire([{ x: 0, y: 0 }, { x: 100, y: 0 }], 2.5)];
    story.layers.electrical.symbols = [new ElectricalSymbol(0, 0, 'outlet_low')];
    const result = BomCalculator.calculate([story]);
    const categories = result.stories[0].items.map(i => i.category);
    expect(categories).toContain('Panels');
    expect(categories).toContain('Breakers');
    expect(categories).toContain('Wires');
    expect(categories).toContain('Electrical');
  });

  it('counts plumbing components', () => {
    const story = emptyStory();
    story.layers.plumbing.pipes = [new Pipe([{ x: 0, y: 0 }, { x: 200, y: 0 }], 'cold', 25)];
    story.layers.plumbing.symbols = [new PlumbingSymbol(0, 0, 'valve')];
    const result = BomCalculator.calculate([story]);
    const categories = result.stories[0].items.map(i => i.category);
    expect(categories).toContain('Pipes');
    expect(categories).toContain('Plumbing');
  });
});

describe('BomCalculator.toCSV', () => {
  it('generates CSV with header row', () => {
    const result = BomCalculator.calculate([emptyStory()]);
    const csv = BomCalculator.toCSV(result);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Floor,Category,Description,Quantity,Unit');
  });
});

describe('BomCalculator.toText', () => {
  it('generates human-readable text with story headers', () => {
    const result = BomCalculator.calculate([emptyStory('Ground Floor')]);
    const text = BomCalculator.toText(result);
    expect(text).toContain('=== Ground Floor ===');
    expect(text).toContain('=== TOTALS ===');
  });
});

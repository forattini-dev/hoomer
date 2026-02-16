import { describe, it, expect, beforeEach } from 'vitest';
import { getCircuitsForPanel, computeCircuitLoadA, newCircuitForPanel, getPanelElectricalStatus } from '../ElectricalCalc.js';
import { ElectricalPanel } from '../ElectricalPanel.js';
import { ElectricalCircuit } from '../ElectricalCircuit.js';
import { ElectricalSymbol } from '../ElectricalSymbol.js';
import { resetCounter } from '../IdGenerator.js';

beforeEach(() => {
  resetCounter(0);
});

describe('getCircuitsForPanel', () => {
  it('filters circuits by panelId', () => {
    const circuits = [
      new ElectricalCircuit('panel_1', 'C1'),
      new ElectricalCircuit('panel_2', 'C2'),
      new ElectricalCircuit('panel_1', 'C3'),
    ];
    const result = getCircuitsForPanel(circuits, 'panel_1');
    expect(result).toHaveLength(2);
    expect(result.every(c => c.panelId === 'panel_1')).toBe(true);
  });

  it('returns empty array when no circuits match', () => {
    const circuits = [new ElectricalCircuit('panel_1', 'C1')];
    expect(getCircuitsForPanel(circuits, 'panel_999')).toHaveLength(0);
  });

  it('returns empty array for empty circuits list', () => {
    expect(getCircuitsForPanel([], 'panel_1')).toHaveLength(0);
  });
});

describe('computeCircuitLoadA', () => {
  it('sums amperage for symbols with matching circuitId', () => {
    const symbols = [
      new ElectricalSymbol(0, 0, 'outlet_low', 0, 'circuit_10', 5),
      new ElectricalSymbol(0, 0, 'outlet_low', 0, 'circuit_10', 3),
      new ElectricalSymbol(0, 0, 'outlet_low', 0, 'circuit_other', 10),
    ];
    expect(computeCircuitLoadA(symbols, 'circuit_10')).toBe(8);
  });

  it('returns 0 when no symbols match', () => {
    const symbols = [new ElectricalSymbol(0, 0, 'outlet_low', 0, 'c1', 10)];
    expect(computeCircuitLoadA(symbols, 'nonexistent')).toBe(0);
  });
});

describe('newCircuitForPanel', () => {
  it('creates a new circuit with correct name index', () => {
    const panel = new ElectricalPanel(0, 0, 'QD-1');
    const panelId = panel.id;
    const existing = [
      new ElectricalCircuit(panelId, 'C1'),
      new ElectricalCircuit(panelId, 'C2'),
    ];
    const newCircuit = newCircuitForPanel(existing, panelId);
    expect(newCircuit.name).toBe('C3');
    expect(newCircuit.panelId).toBe(panelId);
  });

  it('creates C1 when no existing circuits for panel', () => {
    const newCircuit = newCircuitForPanel([], 'panel_1');
    expect(newCircuit.name).toBe('C1');
  });
});

describe('getPanelElectricalStatus', () => {
  it('returns null for unknown panel', () => {
    const result = getPanelElectricalStatus([], [], [], 'missing');
    expect(result).toBeNull();
  });

  it('returns full status object for valid panel', () => {
    const panel = new ElectricalPanel(0, 0, 'QD-1', 220, 1, 63, 100);
    const panelId = panel.id;
    const circuit = new ElectricalCircuit(panelId, 'C1', 20);
    const symbol = new ElectricalSymbol(0, 0, 'outlet_low', 0, circuit.id, 10);

    const status = getPanelElectricalStatus([panel], [circuit], [symbol], panelId);
    expect(status).not.toBeNull();
    expect(status.panel).toBe(panel);
    expect(status.totalLoadA).toBe(10);
    expect(status.mainBreakerA).toBe(63);
    expect(status.panelOverload).toBe(false);
    expect(status.hasIssue).toBe(false);
    expect(status.circuitStatuses).toHaveLength(1);
  });

  it('detects circuit overload', () => {
    const panel = new ElectricalPanel(0, 0, 'QD-1', 220, 1, 63, 100);
    const panelId = panel.id;
    const circuit = new ElectricalCircuit(panelId, 'C1', 10);
    const sym1 = new ElectricalSymbol(0, 0, 'outlet_low', 0, circuit.id, 8);
    const sym2 = new ElectricalSymbol(0, 0, 'outlet_low', 0, circuit.id, 5);

    const status = getPanelElectricalStatus([panel], [circuit], [sym1, sym2], panelId);
    expect(status.circuitStatuses[0].overload).toBe(true);
    expect(status.overloadedCircuits).toHaveLength(1);
    expect(status.hasIssue).toBe(true);
  });

  it('detects panel overload', () => {
    const panel = new ElectricalPanel(0, 0, 'QD-1', 220, 1, 5, 100);
    const panelId = panel.id;
    const circuit = new ElectricalCircuit(panelId, 'C1', 100);
    const sym = new ElectricalSymbol(0, 0, 'outlet_low', 0, circuit.id, 10);

    const status = getPanelElectricalStatus([panel], [circuit], [sym], panelId);
    expect(status.panelOverload).toBe(true);
    expect(status.hasIssue).toBe(true);
  });
});

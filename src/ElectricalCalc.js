// ── ElectricalCalc.js ───────────────────────────
// Pure functions for electrical panel/circuit calculations.
// No side effects — takes data, returns results.

import { CONFIG } from './config.js';
import { ElectricalCircuit } from './ElectricalCircuit.js';

export function getCircuitsForPanel(circuits, panelId) {
  return circuits.filter(c => c.panelId === panelId);
}

export function computeCircuitLoadA(symbols, circuitId) {
  return symbols
    .filter(sym => sym.circuitId === circuitId)
    .reduce((sum, sym) => sum + (Number(sym.amperageA) || 0), 0);
}

export function newCircuitForPanel(circuits, panelId) {
  const existing = circuits.filter(c => c.panelId === panelId);
  const index = existing.length + 1;
  return new ElectricalCircuit(panelId, `C${index}`, CONFIG.DEFAULT_CIRCUIT_BREAKER_A, 1, 'C');
}

export function getPanelElectricalStatus(panels, circuits, symbols, panelId) {
  const panel = panels.find(p => p.id === panelId);
  if (!panel) return null;
  const panelCircuits = getCircuitsForPanel(circuits, panelId);
  const circuitStatuses = panelCircuits.map(c => {
    const loadA = computeCircuitLoadA(symbols, c.id);
    const breakerA = Math.max(1, Number(c.breakerA) || 1);
    return { circuit: c, loadA, breakerA, overload: loadA > breakerA };
  });
  const totalLoadA = circuitStatuses.reduce((sum, s) => sum + s.loadA, 0);
  const mainBreakerA = Math.max(1, Number(panel.mainBreakerA) || 1);
  const overloadedCircuits = circuitStatuses.filter(s => s.overload);
  const panelOverload = totalLoadA > mainBreakerA;
  return {
    panel,
    circuitStatuses,
    overloadedCircuits,
    totalLoadA,
    mainBreakerA,
    panelOverload,
    hasIssue: panelOverload || overloadedCircuits.length > 0,
  };
}

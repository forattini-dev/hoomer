// ── ElectricalCalc.js ───────────────────────────
// Pure functions for electrical panel/circuit calculations.
// No side effects — takes data, returns results.

/** @typedef {{ id: string, panelId: string, name: string, breakerA: number }} Circuit */
/** @typedef {{ id: string, circuitId: string, amperageA: number, symbolType: string }} Symbol */
/** @typedef {{ id: string, mainBreakerA: number }} Panel */

/** @typedef {{ circuit: Circuit, loadA: number, breakerA: number, overload: boolean }} CircuitStatus */
/** @typedef {{ panel: Panel, circuitStatuses: CircuitStatus[], overloadedCircuits: CircuitStatus[], totalLoadA: number, mainBreakerA: number, panelOverload: boolean, hasIssue: boolean }} PanelStatus */

import { CONFIG } from './config.js';
import { ElectricalCircuit } from './ElectricalCircuit.js';

/**
 * Filter circuits belonging to a panel.
 * @param {Circuit[]} circuits @param {string} panelId
 * @returns {Circuit[]}
 */
export function getCircuitsForPanel(circuits, panelId) {
  return circuits.filter(c => c.panelId === panelId);
}

/**
 * Sum amperage of symbols assigned to a circuit.
 * @param {Symbol[]} symbols @param {string} circuitId
 * @returns {number}
 */
export function computeCircuitLoadA(symbols, circuitId) {
  return symbols
    .filter(sym => sym.circuitId === circuitId)
    .reduce((sum, sym) => sum + (Number(sym.amperageA) || 0), 0);
}

/**
 * Create a new circuit for a panel with auto-incremented name.
 * @param {Circuit[]} circuits @param {string} panelId
 * @returns {ElectricalCircuit}
 */
export function newCircuitForPanel(circuits, panelId) {
  const existing = circuits.filter(c => c.panelId === panelId);
  const index = existing.length + 1;
  return new ElectricalCircuit(panelId, `C${index}`, CONFIG.DEFAULT_CIRCUIT_BREAKER_A, 1, 'C');
}

/**
 * Compute full load/overload status for a panel.
 * @param {Panel[]} panels @param {Circuit[]} circuits @param {Symbol[]} symbols @param {string} panelId
 * @returns {PanelStatus|null}
 */
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

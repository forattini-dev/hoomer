// ── ElectricalRenderer.js ─────────────────────
// Electrical layer drawing: panels, wires, symbols.

import { CONFIG } from '../config.js';
import { Geom } from '../geometry.js';
import { drawElecSymbolShape } from '../ElectricalShapes.js';
import { drawTextWithBg, drawSelectionPolyline, drawSelectionCircle } from './helpers.js';

const C = CONFIG.COLORS;
const { SELECTION, TEXT } = C;

export function drawElectricalLayer(ctx, layer, state, isActive) {
  const zoom = state.zoom;
  for (const panel of (layer.panels || [])) {
    drawElectricalPanel(ctx, panel, state, isActive && panel === state.selectedPanel, zoom);
  }
  for (const wire of layer.wires) {
    drawWire(ctx, wire, isActive && wire === state.selectedWire, zoom);
  }
  for (const sym of layer.symbols) {
    drawElectricalSymbol(ctx, sym, state, isActive && sym === state.selectedElectricalSymbol, zoom);
  }
}

// ── Wires ─────────────────────────────────────

export function drawWire(ctx, wire, isSelected, zoom) {
  if (wire.points.length < 2) return;
  const color = CONFIG.WIRE_COLORS;
  const thickness = (CONFIG.WIRE_THICKNESS[wire.gauge] || 2) / zoom;

  ctx.save();
  ctx.strokeStyle = isSelected ? SELECTION : color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(wire.points[0].x, wire.points[0].y);
  for (let i = 1; i < wire.points.length; i++) {
    ctx.lineTo(wire.points[i].x, wire.points[i].y);
  }
  ctx.stroke();

  // Draw points at vertices
  for (const p of wire.points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 / zoom, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? SELECTION : color;
    ctx.fill();
  }

  // Gauge label at midpoint
  if (wire.points.length >= 2) {
    const mid = Math.floor(wire.points.length / 2);
    const p0 = wire.points[mid - 1];
    const p1 = wire.points[mid];
    const mx = (p0.x + p1.x) / 2;
    const my = (p0.y + p1.y) / 2;
    const fontSize = Math.max(8, 10 / zoom);
    drawTextWithBg(ctx, `${wire.gauge}mm\u00B2`, mx, my, {
      fontSize, zoom, textColor: isSelected ? SELECTION : CONFIG.COLORS.ELEC_LABEL,
    });
  }

  // Selection highlight
  if (isSelected) {
    drawSelectionPolyline(ctx, wire.points, zoom);
  }

  ctx.restore();
}

// ── Electrical Panels ─────────────────────────

export function getPanelLoadStatus(panel, state) {
  const elec = state.currentStory?.layers?.electrical;
  if (!elec) return { totalLoadA: 0, mainBreakerA: 1, hasIssue: false };
  const circuits = (elec.circuits || []).filter(c => c.panelId === panel.id);
  const symbols = elec.symbols || [];
  const totalLoadA = circuits.reduce((sum, c) => {
    const load = symbols
      .filter(sym => sym.circuitId === c.id)
      .reduce((acc, sym) => acc + (Number(sym.amperageA) || 0), 0);
    return sum + load;
  }, 0);
  const mainBreakerA = Math.max(1, Number(panel.mainBreakerA) || 1);
  const circuitOverload = circuits.some(c => {
    const load = symbols
      .filter(sym => sym.circuitId === c.id)
      .reduce((acc, sym) => acc + (Number(sym.amperageA) || 0), 0);
    const breaker = Math.max(1, Number(c.breakerA) || 1);
    return load > breaker;
  });
  const panelOverload = totalLoadA > mainBreakerA;
  return {
    totalLoadA,
    mainBreakerA,
    hasIssue: circuitOverload || panelOverload,
    panelOverload,
  };
}

export function drawElectricalPanel(ctx, panel, state, isSelected, zoom) {
  // Top-down view: panel as a box protruding from nearest wall
  const pw = 40;   // width along wall (cm)
  const pd = 12;   // depth / protrusion from wall (cm)

  const status = state ? getPanelLoadStatus(panel, state) : { totalLoadA: 0, mainBreakerA: 1, hasIssue: false };
  const danger = status.hasIssue && !isSelected;

  // Find nearest wall to orient the panel
  const walls = state?.currentStory?.layers?.structure?.walls || [];
  let wallAngle = 0;
  let bestDist = Infinity;
  for (const wall of walls) {
    const d = Geom.pointToSegmentDist(panel.x, panel.y, wall.x1, wall.y1, wall.x2, wall.y2);
    if (d < bestDist) {
      bestDist = d;
      wallAngle = Geom.angle(wall.x1, wall.y1, wall.x2, wall.y2);
    }
  }

  ctx.save();
  ctx.translate(panel.x, panel.y);
  ctx.rotate(wallAngle);

  // Panel box (top-down: width along wall, depth perpendicular)
  ctx.fillStyle = isSelected
    ? 'rgba(123,150,170,0.2)'
    : danger
      ? 'rgba(207,77,58,0.12)'
      : 'rgba(245,166,35,0.12)';
  ctx.strokeStyle = isSelected ? SELECTION : (danger ? C.PANEL_DANGER : CONFIG.COLORS.WIRE_LABEL);
  ctx.lineWidth = (isSelected ? 2 : 1.4) / zoom;
  ctx.fillRect(-pw / 2, -pd / 2, pw, pd);
  ctx.strokeRect(-pw / 2, -pd / 2, pw, pd);

  // Inner detail line (panel door edge)
  ctx.beginPath();
  ctx.moveTo(-pw / 2 + 3, -pd / 2 + 3);
  ctx.lineTo(pw / 2 - 3, -pd / 2 + 3);
  ctx.lineTo(pw / 2 - 3, pd / 2 - 3);
  ctx.lineTo(-pw / 2 + 3, pd / 2 - 3);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();

  // Label — draw unrotated so text is always readable
  const fontSize = Math.max(9, 11 / zoom);
  drawTextWithBg(ctx, panel.name, panel.x, panel.y, {
    fontSize, zoom,
    textColor: isSelected ? '#6a8599' : (danger ? C.PANEL_DANGER_TEXT : C.PANEL_NORMAL_TEXT),
  });

  // Load text below
  const loadFontSize = Math.max(7, 9 / zoom);
  drawTextWithBg(ctx, `${status.totalLoadA.toFixed(1)}A`, panel.x, panel.y + pd / 2 + (10 / zoom), {
    fontSize: loadFontSize, zoom,
    textColor: isSelected ? '#6a8599' : (danger ? C.PANEL_DANGER_TEXT : C.PANEL_NORMAL_TEXT),
  });

  // Danger indicator
  if (danger) {
    const dx = Math.cos(wallAngle) * (pw / 2 - 4) - Math.sin(wallAngle) * (-pd / 2 + 4);
    const dy = Math.sin(wallAngle) * (pw / 2 - 4) + Math.cos(wallAngle) * (-pd / 2 + 4);
    ctx.beginPath();
    ctx.arc(panel.x + dx, panel.y + dy, 4 / zoom, 0, Math.PI * 2);
    ctx.fillStyle = C.PANEL_DANGER;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${Math.max(7, 8 / zoom)}px ${CONFIG.FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', panel.x + dx, panel.y + dy);
  }
}

// ── Electrical Symbols ────────────────────────

export function drawElectricalSymbol(ctx, sym, state, isSelected, zoom) {
  ctx.save();
  ctx.translate(sym.x, sym.y);
  ctx.rotate(sym.rotation * Math.PI / 180);

  const r = 10 / zoom;
  const color = isSelected ? SELECTION : CONFIG.WIRE_COLORS;

  drawElecSymbolShape(ctx, sym.symbolType, r, color, zoom);

  ctx.restore();

  // Selection highlight
  if (isSelected) {
    drawSelectionCircle(ctx, sym.x, sym.y, 16 / zoom, zoom);
  }

  _drawElectricalCircuitLabel(ctx, sym, state, zoom, isSelected);
}

function _drawElectricalCircuitLabel(ctx, sym, state, zoom, isSelected) {
  const circuits = state.currentStory?.layers?.electrical?.circuits || [];
  const circuit = circuits.find(c => c.id === sym.circuitId);
  const circLabel = circuit ? circuit.name : 'NC';
  const amp = Number(sym.amperageA) || 0;
  const text = `${circLabel} ${amp.toFixed(1)}A`;
  drawTextWithBg(ctx, text, sym.x + 12 / zoom, sym.y + 10 / zoom, {
    fontSize: Math.max(8, 10 / zoom), zoom, align: 'left', baseline: 'top',
    textColor: isSelected ? SELECTION : CONFIG.COLORS.WIRE_LABEL,
  });
}

export function drawElectricalSymbolExport(ctx, sym) {
  ctx.save();
  ctx.translate(sym.x, sym.y);
  ctx.rotate(sym.rotation * Math.PI / 180);
  drawElecSymbolShape(ctx, sym.symbolType, 10, CONFIG.WIRE_COLORS, 1);
  ctx.restore();
  drawTextWithBg(ctx, `${sym.amperageA || 0}A`, sym.x + 12, sym.y + 10, {
    fontSize: 10, align: 'left', baseline: 'top', textColor: CONFIG.COLORS.WIRE_LABEL,
  });
}

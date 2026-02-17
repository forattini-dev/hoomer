// ── PlumbingRenderer.js ───────────────────────
// Plumbing layer drawing: pipes, flow arrows, symbols.

import { CONFIG } from '../config.js';
import { drawPlumbSymbolShape } from '../PlumbingShapes.js';
import { drawTextWithBg, drawSelectionPolyline, drawSelectionCircle } from './helpers.js';

const C = CONFIG.COLORS;
const { SELECTION } = C;

export function drawPlumbingLayer(ctx, layer, state, isActive) {
  const zoom = state.zoom;
  for (const pipe of layer.pipes) {
    drawPipe(ctx, pipe, isActive && pipe === state.selectedPipe, zoom);
  }
  for (const sym of layer.symbols) {
    drawPlumbingSymbol(ctx, sym, isActive && sym === state.selectedPlumbingSymbol, zoom);
  }
}

// ── Pipes ─────────────────────────────────────

export function drawPipe(ctx, pipe, isSelected, zoom) {
  if (pipe.points.length < 2) return;
  const color = isSelected ? SELECTION : (CONFIG.PIPE_COLORS[pipe.pipeType] || '#4a90d9');
  const dash = CONFIG.PIPE_DASH[pipe.pipeType] || [];
  const thickness = (CONFIG.PIPE_THICKNESS || 2.5) / zoom;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (dash.length) ctx.setLineDash(dash.map(d => d / zoom));
  ctx.beginPath();
  ctx.moveTo(pipe.points[0].x, pipe.points[0].y);
  for (let i = 1; i < pipe.points.length; i++) {
    ctx.lineTo(pipe.points[i].x, pipe.points[i].y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw points at vertices
  for (const p of pipe.points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 / zoom, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Flow arrows (one per segment, centered)
  _drawPipeFlowArrows(ctx, pipe, zoom, color);

  // Diameter label at midpoint
  if (pipe.points.length >= 2) {
    const mid = Math.floor(pipe.points.length / 2);
    const p0 = pipe.points[mid - 1];
    const p1 = pipe.points[mid];
    const mx = (p0.x + p1.x) / 2;
    const my = (p0.y + p1.y) / 2;
    drawTextWithBg(ctx, `\u00D8${pipe.diameter}`, mx, my, {
      fontSize: Math.max(8, 10 / zoom), zoom,
      textColor: isSelected ? SELECTION : (CONFIG.PIPE_COLORS[pipe.pipeType] || '#4a90d9'),
    });
  }

  // Selection highlight
  if (isSelected) {
    drawSelectionPolyline(ctx, pipe.points, zoom);
  }

  ctx.restore();
}

function _drawPipeFlowArrows(ctx, pipe, zoom, color) {
  if (pipe.points.length < 2) return;
  const dir = pipe.flowDir || 1;
  const pts = pipe.points;
  const baseArrowLen = Math.max(12 / zoom, 6);
  const minSegLen = baseArrowLen * 1.4;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1 / zoom, 0.8);

  for (let i = 0; i < pts.length - 1; i++) {
    const a = dir >= 0 ? pts[i] : pts[i + 1];
    const b = dir >= 0 ? pts[i + 1] : pts[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < minSegLen) continue;

    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;

    const arrowLen = Math.min(baseArrowLen, len * 0.6);
    const headSize = Math.min(arrowLen * 0.4, Math.max(5 / zoom, 3));
    const midx = (a.x + b.x) / 2;
    const midy = (a.y + b.y) / 2;
    const tip = { x: midx + ux * (arrowLen / 2), y: midy + uy * (arrowLen / 2) };
    const tail = { x: midx - ux * (arrowLen / 2), y: midy - uy * (arrowLen / 2) };

    ctx.beginPath();
    ctx.moveTo(tail.x, tail.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(tip.x - ux * headSize + nx * headSize * 0.6, tip.y - uy * headSize + ny * headSize * 0.6);
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(tip.x - ux * headSize - nx * headSize * 0.6, tip.y - uy * headSize - ny * headSize * 0.6);
    ctx.stroke();
  }

  ctx.restore();
}

// ── Plumbing Symbols ──────────────────────────

export function drawPlumbingSymbol(ctx, sym, isSelected, zoom) {
  ctx.save();
  ctx.translate(sym.x, sym.y);
  ctx.rotate(sym.rotation * Math.PI / 180);

  const r = 10 / zoom;
  const color = isSelected ? SELECTION : CONFIG.LAYER_COLORS.plumbing;

  drawPlumbSymbolShape(ctx, sym.symbolType, r, color, zoom);

  ctx.restore();

  // Selection highlight
  if (isSelected) {
    drawSelectionCircle(ctx, sym.x, sym.y, 16 / zoom, zoom);
  }
}

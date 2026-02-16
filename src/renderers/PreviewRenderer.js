// ── PreviewRenderer.js ────────────────────────
// Preview drawing: wall preview, polyline preview, floor polygon, snap indicator.

import { CONFIG } from '../config.js';
import { Geom } from '../geometry.js';
import { Materials } from '../materials.js';
import { drawTextWithBg } from './helpers.js';

const C = CONFIG.COLORS;
const { SELECTION } = C;

// ── Wall Preview ──────────────────────────────

export function drawPreview(ctx, state) {
  const { x: x1, y: y1 } = state.drawStart;
  const { x: x2, y: y2 } = state.mouseWorld;
  const length = Geom.dist(x1, y1, x2, y2);
  if (length < 1) return;
  const rect = Geom.wallRect(x1, y1, x2, y2, state.wallThickness);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(rect[0].x, rect[0].y);
  for (let i = 1; i < rect.length; i++) ctx.lineTo(rect[i].x, rect[i].y);
  ctx.closePath();

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = Materials.getWall(state.wallMaterial, ctx) || C.WALL_FALLBACK;
  ctx.fill();
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = SELECTION; ctx.lineWidth = 1.5 / state.zoom;
  ctx.setLineDash([6 / state.zoom, 4 / state.zoom]); ctx.stroke(); ctx.setLineDash([]);

  ctx.globalAlpha = 0.9;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const angle = Geom.angle(x1, y1, x2, y2);
  const perpAngle = angle + Math.PI / 2;
  const offset = state.wallThickness / 2 + 15;
  ctx.translate(mx + Math.cos(perpAngle) * offset, my + Math.sin(perpAngle) * offset);
  let textAngle = angle;
  if (textAngle > Math.PI / 2) textAngle -= Math.PI;
  if (textAngle < -Math.PI / 2) textAngle += Math.PI;
  ctx.rotate(textAngle);
  drawTextWithBg(ctx, Geom.formatLength(length), 0, 0, {
    fontSize: Math.max(10, 12 / state.zoom), zoom: state.zoom,
    pad: 4 / state.zoom, fontWeight: '700',
    bgColor: 'rgba(123,150,170,0.12)', textColor: '#6a8599',
  });
  ctx.restore();

  ctx.beginPath(); ctx.arc(x1, y1, 4 / state.zoom, 0, Math.PI * 2);
  ctx.fillStyle = SELECTION; ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 / state.zoom; ctx.stroke();
}

// ── Floor Polygon Preview ─────────────────────

export function drawFloorPolygonPreview(ctx, state) {
  const pts = state.polylinePoints;
  if (!pts || pts.length === 0) return;

  ctx.save();

  // Fill preview
  if (pts.length >= 2) {
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    if (state.mouseWorld) ctx.lineTo(state.mouseWorld.x, state.mouseWorld.y);
    ctx.closePath();
    ctx.fillStyle = C.FLOOR_PREVIEW_FILL;
    ctx.fill();
  }

  // Outline
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = C.FLOOR_PREVIEW;
  ctx.lineWidth = 2 / state.zoom;
  ctx.setLineDash([6 / state.zoom, 4 / state.zoom]);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  if (state.mouseWorld) ctx.lineTo(state.mouseWorld.x, state.mouseWorld.y);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // Vertex dots
  ctx.globalAlpha = 0.9;
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4 / state.zoom, 0, Math.PI * 2);
    ctx.fillStyle = C.FLOOR_PREVIEW;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5 / state.zoom;
    ctx.stroke();
  }

  // Close indicator (highlight first point when mouse is near)
  if (pts.length >= 3 && state.mouseWorld) {
    const d = Geom.dist(state.mouseWorld.x, state.mouseWorld.y, pts[0].x, pts[0].y);
    if (d < 10) {
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, 8 / state.zoom, 0, Math.PI * 2);
      ctx.strokeStyle = C.FLOOR_PREVIEW;
      ctx.lineWidth = 2.5 / state.zoom;
      ctx.stroke();
    }
  }

  ctx.restore();
}

// ── Polyline Preview (wire/pipe) ──────────────

export function drawPolylinePreview(ctx, state) {
  const pts = state.polylinePoints;
  if (!pts || pts.length === 0) return;

  const isWire = state.activeTool === 'wire';
  const isPipe = state.activeTool === 'pipe';
  if (!isWire && !isPipe) return;

  const color = isWire ? CONFIG.WIRE_COLORS : (CONFIG.PIPE_COLORS[state.pipeType] || '#4a90d9');
  const dash = isPipe ? (CONFIG.PIPE_DASH[state.pipeType] || []) : [];
  const thickness = isWire
    ? (CONFIG.WIRE_THICKNESS[state.wireGauge] || 2) / state.zoom
    : (CONFIG.PIPE_THICKNESS || 2.5) / state.zoom;

  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (dash.length) ctx.setLineDash(dash.map(d => d / state.zoom));

  // Draw committed segments
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  // Preview segment to cursor
  if (state.mouseWorld) {
    ctx.lineTo(state.mouseWorld.x, state.mouseWorld.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw vertex dots
  ctx.globalAlpha = 0.8;
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5 / state.zoom, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1 / state.zoom;
    ctx.stroke();
  }

  ctx.restore();
}

// ── Snap Indicator ────────────────────────────

export function drawSnap(ctx, snapPoint, zoom) {
  const { x, y, type } = snapPoint;
  const r = 6 / zoom;
  ctx.save();
  if (type === 'endpoint') {
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(139,184,158,0.35)'; ctx.fill();
    ctx.strokeStyle = C.SNAP_ENDPOINT; ctx.lineWidth = 1.5 / zoom; ctx.stroke();
  } else {
    ctx.strokeStyle = 'rgba(123,150,170,0.45)'; ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
    ctx.moveTo(x, y - r); ctx.lineTo(x, y + r);
    ctx.stroke();
  }
  ctx.restore();
}

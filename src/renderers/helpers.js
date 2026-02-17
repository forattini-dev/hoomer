// ── Renderer Helpers ─────────────────────────
// Shared drawing utilities used by all sub-renderers.

import { CONFIG } from '../config.js';

export function drawTextWithBg(ctx, text, x, y, { fontSize, zoom = 1, textColor = CONFIG.COLORS.TEXT, bgColor = 'rgba(255,255,255,0.85)', pad, align = 'center', baseline = 'middle', fontWeight = '600' } = {}) {
  const p = pad ?? 2 / zoom;
  ctx.font = `${fontWeight} ${fontSize}px ${CONFIG.FONT_FAMILY}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  const metrics = ctx.measureText(text);
  const bx = align === 'center' ? x - metrics.width / 2 - p : x - p;
  const by = baseline === 'middle' ? y - fontSize / 2 - p : y - p;
  ctx.fillStyle = bgColor;
  ctx.fillRect(bx, by, metrics.width + p * 2, fontSize + p * 2);
  ctx.fillStyle = textColor;
  ctx.fillText(text, x, y);
}

export function drawSelectionDash(ctx, zoom) {
  ctx.strokeStyle = CONFIG.COLORS.SELECTION;
  ctx.lineWidth = 1.5 / zoom;
  ctx.setLineDash([5 / zoom, 3 / zoom]);
}

export function endDash(ctx) {
  ctx.setLineDash([]);
}

export function drawSelectionCircle(ctx, x, y, radius, zoom) {
  ctx.save();
  ctx.strokeStyle = CONFIG.COLORS.SELECTION;
  ctx.lineWidth = 1 / zoom;
  ctx.setLineDash([4 / zoom, 3 / zoom]);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

export function drawSelectionPolyline(ctx, points, zoom) {
  if (points.length < 2) return;
  ctx.setLineDash([4 / zoom, 3 / zoom]);
  ctx.strokeStyle = CONFIG.COLORS.SELECTION;
  ctx.lineWidth = 1 / zoom;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
  ctx.setLineDash([]);
}

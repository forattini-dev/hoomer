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

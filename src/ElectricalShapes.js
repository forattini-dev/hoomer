// ── ElectricalShapes.js ─────────────────────────────────────
// Standalone module for electrical symbol drawing logic.
// Uses SHAPE_DRAWERS map pattern (same as FurnitureShapes).

import { CONFIG } from './config.js';

const SHAPE_DRAWERS = {
  outlet_low(ctx, r) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 1.4, 0);
    ctx.lineTo(r * 1.4, 0);
    ctx.stroke();
  },

  outlet_med(ctx, r) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    const cr = r * 0.6;
    ctx.beginPath();
    ctx.moveTo(-cr, -cr); ctx.lineTo(cr, cr);
    ctx.moveTo(cr, -cr); ctx.lineTo(-cr, cr);
    ctx.stroke();
  },

  outlet_high(ctx, r) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    const tr = r * 0.6;
    ctx.beginPath();
    ctx.moveTo(0, -tr);
    ctx.lineTo(-tr, tr * 0.7);
    ctx.lineTo(tr, tr * 0.7);
    ctx.closePath();
    ctx.stroke();
  },

  switch_single(ctx, r) {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r * 1.3, -r * 1.0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 1.0, -r * 1.2);
    ctx.lineTo(r * 1.6, -r * 0.8);
    ctx.stroke();
  },

  switch_double(ctx, r) {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r * 1.3, -r * 1.0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 1.0, -r * 1.2);
    ctx.lineTo(r * 1.6, -r * 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.8, -r * 1.4);
    ctx.lineTo(r * 1.4, -r * 1.0);
    ctx.stroke();
  },

  switch_parallel(ctx, r) {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r * 1.3, -r * 1.0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 1.0, -r * 1.2);
    ctx.lineTo(r * 1.6, -r * 0.8);
    ctx.stroke();
    const fs = r * 0.8;
    ctx.font = `700 ${fs}px ${CONFIG.FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', r * 1.7, -r * 0.3);
  },

  light_ceiling(ctx, r) {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    const innerR = r * 0.55;
    const outerR = r * 1.1;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
      ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
      ctx.stroke();
    }
  },

  light_wall(ctx, r) {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.7, -Math.PI / 2, Math.PI / 2);
    ctx.closePath();
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 4) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7);
      ctx.lineTo(Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2);
      ctx.stroke();
    }
  },

  distribution_panel(ctx, r) {
    const bw = r * 1.8;
    const bh = r * 1.4;
    ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    const fs = r * 0.8;
    ctx.font = `700 ${fs}px ${CONFIG.FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('QD', 0, 0);
  },
};

export function drawElecSymbolShape(ctx, type, r, color, zoom) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5 / zoom;

  const drawer = SHAPE_DRAWERS[type];
  if (drawer) drawer(ctx, r);
}

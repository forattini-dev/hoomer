// ── PlumbingShapes.js ─────────────────────────────────────
// Standalone module for plumbing symbol drawing logic.
// Uses SHAPE_DRAWERS map pattern (same as FurnitureShapes).

import { CONFIG } from './config.js';

const SHAPE_DRAWERS = {
  valve(ctx, r) {
    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.7);
    ctx.lineTo(0, 0);
    ctx.lineTo(-r, r * 0.7);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r, -r * 0.7);
    ctx.lineTo(0, 0);
    ctx.lineTo(r, r * 0.7);
    ctx.closePath();
    ctx.stroke();
  },

  drain(ctx, r) {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, r * 0.6);
    ctx.lineTo(0, r * 1.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, r * 1.4);
    ctx.lineTo(-r * 0.3, r * 1.0);
    ctx.lineTo(r * 0.3, r * 1.0);
    ctx.closePath();
    ctx.fill();
  },

  water_tank(ctx, r) {
    const bw = r * 1.8;
    const bh = r * 1.4;
    ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    const fs = r * 0.7;
    ctx.font = `700 ${fs}px ${CONFIG.FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CX', 0, 0);
  },

  water_pump(ctx, r) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    const fs = r * 0.9;
    ctx.font = `700 ${fs}px ${CONFIG.FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', 0, 0);
  },

  pool(ctx, r) {
    const bw = r * 2;
    const bh = r * 1.2;
    ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    const waveY = -bh * 0.1;
    const step = bw / 8;
    ctx.beginPath();
    ctx.moveTo(-bw / 2 + step, waveY);
    for (let i = 1; i < 8; i++) {
      const x = -bw / 2 + step * (i + 1);
      ctx.quadraticCurveTo(-bw / 2 + step * i + step / 2, i % 2 === 0 ? waveY + r * 0.2 : waveY - r * 0.2, x, waveY);
    }
    ctx.stroke();
  },

  motor(ctx, r) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    const fs = r * 0.7;
    ctx.font = `700 ${fs}px ${CONFIG.FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MO', 0, 0);
  },
};

export function drawPlumbSymbolShape(ctx, type, r, color, zoom) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5 / zoom;

  const drawer = SHAPE_DRAWERS[type];
  if (drawer) drawer(ctx, r);
}

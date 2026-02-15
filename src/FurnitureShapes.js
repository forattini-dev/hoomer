// ── FurnitureShapes.js ─────────────────────────────────────
// Standalone module for all furniture drawing logic.
// Extracted from Renderer to keep shape definitions independent.

import { CONFIG } from './config.js';

// ── Utility functions ────────────────────────────────────

function toRgb(color) {
  if (typeof color !== 'string' || !color.startsWith('#')) return null;
  const raw = color.slice(1);
  const normalized = raw.length === 3
    ? raw.split('').map(v => v + v).join('')
    : raw;

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  const num = parseInt(normalized, 16);

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function isColorDark(color) {
  const rgb = toRgb(color);
  if (!rgb) return false;
  const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  return luminance < 125;
}

function withAlpha(color, alpha) {
  const rgb = toRgb(color);
  if (!rgb) return color;
  const raw = Number(alpha);
  const safeAlpha = Number.isFinite(raw) ? Math.max(0, Math.min(1, raw)) : 1;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${safeAlpha})`;
}

function drawRoundedRect(ctx, x, y, w, h, radius) {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath();
  if (r === 0) {
    ctx.rect(x, y, w, h);
    return;
  }

  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawFurnitureTopTexture(ctx, w, d, radius, color, zoom, opts = {}) {
  const hw = w / 2;
  const hd = d / 2;
  const minDim = Math.min(w, d);
  const baseAlpha = opts.baseAlpha ?? 0.11;
  const lineAlpha = opts.lineAlpha ?? 0.09;
  const spacing = Math.max(5 / zoom, minDim * (opts.spacing ?? 0.1));
  const angle = opts.angle ?? (Math.PI / 4);
  const cross = Boolean(opts.cross);

  const lines = withAlpha(color, lineAlpha);
  const linesStrong = withAlpha(color, Math.min(1, lineAlpha + 0.05));

  ctx.save();
  drawRoundedRect(ctx, -hw, -hd, w, d, radius);
  ctx.clip();

  const grad = ctx.createLinearGradient(-hw, -hd, hw, hd);
  grad.addColorStop(0, withAlpha(color, baseAlpha + 0.02));
  grad.addColorStop(0.45, withAlpha(color, 0.02));
  grad.addColorStop(1, withAlpha(color, baseAlpha + 0.02));
  ctx.fillStyle = grad;
  ctx.fillRect(-hw, -hd, w, d);

  ctx.save();
  ctx.translate(0, 0);
  ctx.rotate(angle);
  ctx.strokeStyle = lines;
  ctx.lineWidth = Math.max(0.8 / zoom, spacing * 0.09);
  const span = Math.max(w, d) * 1.2;

  for (let i = -span; i <= span; i += spacing) {
    ctx.beginPath();
    ctx.moveTo(-span, i);
    ctx.lineTo(span, i);
    ctx.stroke();
  }

  if (cross) {
    ctx.rotate(-Math.PI / 3);
    ctx.strokeStyle = linesStrong;
    for (let i = -span; i <= span; i += spacing * 1.25) {
      ctx.beginPath();
      ctx.moveTo(-span, i);
      ctx.lineTo(span, i);
      ctx.stroke();
    }
  }
  ctx.restore();

  ctx.restore();
}

function drawFurnitureTopLabel(ctx, text, w, d, color, zoom) {
  const raw = (text || '').toString().trim();
  if (!raw) return;

  const label = raw.slice(0, 4).toUpperCase();
  const fontSize = Math.max(6, Math.min(10, Math.min(w, d) * 0.12)) / zoom;

  ctx.save();
  ctx.font = `600 ${fontSize}px ${CONFIG.FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(label);
  const padX = 3 / zoom;
  const padY = 2 / zoom;
  const width = Math.max(fontSize * 1.8, metrics.width + padX * 2);
  const height = fontSize + padY * 2;
  const y = (d / 2) - height - (1 / zoom);

  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 0.8 / zoom;
  ctx.beginPath();
  drawRoundedRect(ctx, -width / 2, y, width, height, Math.min(4 / zoom, height / 2));
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isColorDark(color) ? '#f6f7f8' : '#272727';
  ctx.fillText(label, 0, y + height / 2);
  ctx.restore();
}

// ── Shape drawer helpers ─────────────────────────────────

function _drawSofa(ctx, p, seats) {
  const { hw, hd, w, d, inset, soft, arcR, texture } = p;

  drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
  ctx.fill();
  ctx.stroke();

  const seatW = w / seats;
  ctx.fillStyle = soft;
  for (let i = 0; i < seats; i++) {
    const cx = -hw + seatW * (i + 0.5);
    const sw = seatW * 0.92;
    const sh = d * 0.74;
    const sx = cx - sw / 2;
    ctx.fillRect(sx, -sh / 2, sw, sh);
  }
  for (let i = 1; i < seats; i++) {
    const x = -hw + (w / seats) * i;
    ctx.beginPath();
    ctx.moveTo(x, -hd + inset);
    ctx.lineTo(x, hd - inset);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-hw + inset, -hd + inset / 2);
  ctx.quadraticCurveTo(-hw, -hd, -hw + inset, -hd + inset * 1.5);
  ctx.moveTo(hw - inset, -hd + inset / 2);
  ctx.quadraticCurveTo(hw, -hd, hw - inset, -hd + inset * 1.5);
  ctx.stroke();
  texture.spacing = 0.09;
  texture.cross = true;
  texture.baseAlpha = 0.06;
}

function _drawBed(ctx, p, type) {
  const { hw, hd, w, d, arcR, lw, zoom, color, texture } = p;

  drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
  ctx.fill();
  ctx.stroke();

  const pillowH = d * 0.1;
  const pillowMargin = w * 0.08;
  ctx.fillStyle = withAlpha(color, 0.17);
  if (type === 'bed_single') {
    ctx.fillRect(-hw + pillowMargin, -hd + d * 0.03, w - pillowMargin * 2, pillowH);
  } else {
    const pillowW = (w - pillowMargin * 3) / 2;
    ctx.fillRect(-hw + pillowMargin, -hd + d * 0.03, pillowW, pillowH);
    ctx.fillRect(-pillowMargin / 2, -hd + d * 0.03, pillowW, pillowH);
  }

  ctx.lineWidth = 3 / zoom;
  ctx.beginPath();
  ctx.moveTo(-hw, -hd);
  ctx.lineTo(hw, -hd);
  ctx.stroke();
  ctx.lineWidth = lw;

  ctx.setLineDash([4 / zoom, 4 / zoom]);
  ctx.beginPath();
  ctx.moveTo(-hw, hd - hd * 0.22);
  ctx.lineTo(hw, hd - hd * 0.22);
  ctx.stroke();
  ctx.setLineDash([]);
  texture.baseAlpha = 0.09;
  texture.lineAlpha = 0.06;
  texture.cross = true;
}

// ── Shape drawer map ─────────────────────────────────────

const SHAPE_DRAWERS = {
  sofa_2seat: (ctx, p) => _drawSofa(ctx, p, 2),

  sofa_3seat: (ctx, p) => _drawSofa(ctx, p, 3),

  armchair: (ctx, p) => {
    const { hw, hd, w, d, inset, soft, arcR, texture } = p;

    drawRoundedRect(ctx, -hw, -hd, w, d, arcR * 0.8);
    ctx.fill();
    ctx.stroke();
    drawRoundedRect(ctx, -hw + inset, -hd + inset, w - inset * 2, d - inset * 2, arcR * 0.7);
    ctx.fillStyle = soft;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-hw + inset, -hd + inset);
    ctx.quadraticCurveTo(-hw, 0, -hw + inset, hd - inset);
    ctx.moveTo(hw - inset, -hd + inset);
    ctx.quadraticCurveTo(hw, 0, hw - inset, hd - inset);
    ctx.stroke();
    texture.cross = false;
    texture.baseAlpha = 0.06;
  },

  coffee_table: (ctx, p) => {
    const { hw, hd, w, d, soft, arcR, texture } = p;

    drawRoundedRect(ctx, -hw, -hd, w, d, arcR * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = soft;
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(hw, hd) * 0.85, 0, Math.PI * 2);
    ctx.fill();
    texture.cross = true;
    texture.baseAlpha = 0.07;
  },

  tv_console: (ctx, p) => {
    const { hw, hd, w, d, arcR, zoom, texture } = p;

    drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
    ctx.fill();
    ctx.stroke();

    const margin = w * 0.05;
    const panelW = w - margin * 2;
    const panelH = d * 0.35;
    const px = -hw + margin;
    const py = -hd + d * 0.1;
    drawRoundedRect(ctx, px, py, panelW, panelH, arcR * 0.5);
    ctx.stroke();
    drawRoundedRect(ctx, px + margin * 0.5, py + panelH * 0.45, panelW - margin, panelH * 0.35, Math.max(2 / zoom, arcR * 0.3));
    texture.cross = true;
    texture.baseAlpha = 0.06;
  },

  dining_table: (ctx, p) => {
    const { hw, hd, w, d, inset, arcR, zoom, color, texture } = p;

    drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
    ctx.fill();
    ctx.stroke();

    const legInset = Math.max(6 / zoom, inset * 0.55);
    const legSize = Math.max(3 / zoom, inset * 0.3);
    const corners = [[-hw + legInset, -hd + legInset], [hw - legInset, -hd + legInset],
                     [-hw + legInset, hd - legInset], [hw - legInset, hd - legInset]];
    for (const [cx, cy] of corners) {
      ctx.fillStyle = color;
      ctx.fillRect(cx - legSize / 2, cy - legSize / 2, legSize, legSize);
    }
    texture.cross = false;
    texture.spacing = 0.2;
  },

  round_table: (ctx, p) => {
    const { hw, hd, color, strokeColor, texture } = p;

    const radius = Math.min(hw, hd);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = withAlpha(color, 0.5);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * radius * 0.8, Math.sin(a) * radius * 0.8);
      ctx.stroke();
    }
    ctx.strokeStyle = strokeColor;
    texture.baseAlpha = 0.13;
    texture.cross = false;
  },

  chair: (ctx, p) => {
    const { hw, hd, w, d, arcR, texture } = p;

    drawRoundedRect(ctx, -hw, -hd, w, d, arcR * 0.9);
    ctx.fill();
    ctx.stroke();
    const r = Math.min(hw, hd) * 0.55;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    texture.cross = false;
    texture.spacing = 0.2;
  },

  bed_single: (ctx, p) => _drawBed(ctx, p, 'bed_single'),

  bed_double: (ctx, p) => _drawBed(ctx, p, 'bed_double'),

  bed_queen: (ctx, p) => _drawBed(ctx, p, 'bed_queen'),

  wardrobe: (ctx, p) => {
    const { hw, hd, w, d, inset, arcR, zoom, color, strokeColor, texture } = p;

    drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
    ctx.fill();
    ctx.stroke();

    const innerInset = inset * 0.8;
    const innerW = w - innerInset * 2;
    const innerH = d - innerInset * 2;
    const innerX = -hw + innerInset;
    const innerY = -hd + innerInset;
    drawRoundedRect(ctx, innerX, innerY, innerW, innerH, arcR * 0.5);
    ctx.strokeStyle = withAlpha(color, 0.38);
    ctx.stroke();
    ctx.strokeStyle = strokeColor;

    ctx.beginPath();
    ctx.moveTo(0, -hd + inset * 0.4);
    ctx.lineTo(0, hd - inset * 0.4);
    ctx.setLineDash([3 / zoom, 3 / zoom]);
    ctx.stroke();
    ctx.setLineDash([]);

    const shelfY = -hd + innerH * 0.36;
    ctx.beginPath();
    ctx.moveTo(innerX, shelfY);
    ctx.lineTo(innerX + innerW, shelfY);
    ctx.strokeStyle = withAlpha(color, 0.55);
    ctx.stroke();
    ctx.strokeStyle = strokeColor;

    const knob = Math.max(1.6 / zoom, inset * 0.15);
    ctx.beginPath();
    ctx.arc(-hw + inset * 1.2, 0, knob, 0, Math.PI * 2);
    ctx.arc(hw - inset * 1.2, 0, knob, 0, Math.PI * 2);
    ctx.fill();
    texture.baseAlpha = 0.06;
    texture.cross = false;
    texture.angle = Math.PI / 6;
  },

  nightstand: (ctx, p) => {
    const { hw, hd, w, d, arcR, lw, zoom, texture } = p;

    drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-hw, 0);
    ctx.lineTo(hw, 0);
    ctx.setLineDash([2 / zoom, 2 / zoom]);
    ctx.stroke();
    ctx.setLineDash([]);

    const handleW = w * 0.3;
    ctx.beginPath();
    ctx.moveTo(-handleW / 2, 0);
    ctx.lineTo(handleW / 2, 0);
    ctx.lineWidth = 2 / zoom;
    ctx.stroke();
    ctx.lineWidth = lw;
    texture.cross = false;
    texture.spacing = 0.18;
  },

  kitchen_sink: (ctx, p) => {
    const { hw, hd, w, d, arcR, zoom, color, strokeColor, texture } = p;

    drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 0, hw * 0.62, hd * 0.54, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, hw * 0.55, hd * 0.45, 0, 0, Math.PI * 2);
    ctx.strokeStyle = withAlpha(color, 0.5);
    ctx.stroke();
    ctx.strokeStyle = strokeColor;

    ctx.beginPath();
    ctx.arc(0, -hd * 0.7, 2.8 / zoom, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    texture.cross = false;
    texture.baseAlpha = 0.06;
  },

  stove: (ctx, p) => {
    const { hw, hd, w, d, arcR } = p;

    drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
    ctx.fill();
    ctx.stroke();

    const bRadius = Math.min(hw, hd) * 0.22;
    const bx = hw * 0.4;
    const by = hd * 0.4;
    for (const [cx, cy] of [[-bx, -by], [bx, -by], [-bx, by], [bx, by]]) {
      ctx.beginPath();
      ctx.arc(cx, cy, bRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - bRadius * 0.6, cy);
      ctx.lineTo(cx + bRadius * 0.6, cy);
      ctx.moveTo(cx, cy - bRadius * 0.6);
      ctx.lineTo(cx, cy + bRadius * 0.6);
      ctx.stroke();
    }
  },

  fridge: (ctx, p) => {
    const { hw, hd, w, d, inset, soft, arcR, lw, zoom } = p;

    drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
    ctx.fill();
    ctx.stroke();

    const splitY = -hd + d * 0.35;
    ctx.beginPath();
    ctx.moveTo(-hw, splitY);
    ctx.lineTo(hw, splitY);
    ctx.stroke();

    const compW = w - inset * 1.5;
    const topH = d * 0.11;
    const botH = d * 0.46;
    ctx.fillStyle = soft;
    ctx.fillRect(-hw + inset * 0.75, -hd + d * 0.11, compW, topH);
    ctx.fillRect(-hw + inset * 0.75, splitY + d * 0.06, compW, botH);

    const hx = hw - inset * 1.1;
    ctx.beginPath();
    ctx.moveTo(hx, splitY - d * 0.1);
    ctx.lineTo(hx, splitY - d * 0.02);
    ctx.moveTo(hx, splitY + d * 0.1);
    ctx.lineTo(hx, splitY + d * 0.2);
    ctx.lineWidth = 2 / zoom;
    ctx.stroke();
    ctx.lineWidth = lw;
  },

  toilet: (ctx, p) => {
    const { hw, hd, w, d, arcR } = p;

    const tankH = d * 0.3;
    drawRoundedRect(ctx, -hw, -hd, w, tankH, arcR * 0.8);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, hd * 0.12, Math.min(hw, hd) * 0.65, hd * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  },

  bath_sink: (ctx, p) => {
    const { hw, hd, w, d, arcR, zoom, color } = p;

    drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, Math.min(hw, hd) * 0.65, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -hd * 0.6, 2.4 / zoom, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  },

  bathtub: (ctx, p) => {
    const { hw, hd, w, d, arcR, color, strokeColor, texture } = p;

    drawRoundedRect(ctx, -hw, -hd, w, d, arcR * 1.4);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 0, hw * 0.88, hd * 0.67, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, hw * 0.62, hd * 0.48, 0, 0, Math.PI * 2);
    ctx.strokeStyle = withAlpha(color, 0.5);
    ctx.stroke();
    ctx.strokeStyle = strokeColor;
    texture.cross = true;
  },

  shower: (ctx, p) => {
    const { hw, hd, w, d, arcR, zoom, texture } = p;

    drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, Math.min(hw, hd) * 0.15, 0, Math.PI * 2);
    ctx.stroke();

    const step = w * 0.25;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * step - 4 / zoom, -6 / zoom);
      ctx.quadraticCurveTo(i * step, -2 / zoom, i * step + 4 / zoom, 4 / zoom);
      ctx.stroke();
    }
    texture.cross = false;
    texture.spacing = 0.18;
  },

  desk: (ctx, p) => {
    const { hw, hd, w, d, arcR, texture } = p;

    drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
    ctx.fill();
    ctx.stroke();

    const drawerW = w * 0.35;
    drawRoundedRect(ctx, hw - drawerW, -hd, drawerW, d, arcR * 0.6);
    ctx.stroke();
    for (let i = 0; i < 2; i++) {
      const y = -hd + d * (0.3 + i * 0.4);
      ctx.beginPath();
      ctx.moveTo(hw - drawerW * 0.3, y);
      ctx.lineTo(hw - drawerW * 0.7, y);
      ctx.stroke();
    }
    texture.cross = true;
  },

  office_chair: (ctx, p) => {
    const { hw, hd, color, strokeColor, texture } = p;

    const radius = Math.min(hw, hd);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.62, 0, Math.PI * 2);
    ctx.strokeStyle = withAlpha(color, 0.75);
    ctx.stroke();
    ctx.strokeStyle = strokeColor;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.45, -radius * 0.35);
    ctx.quadraticCurveTo(0, radius * -0.68, radius * 0.45, -radius * 0.35);
    ctx.stroke();
    texture.cross = false;
  },
};

// ── Main export ──────────────────────────────────────────

export function drawFurnitureShape(ctx, type, w, d, color, zoom, label) {
  const lw = 1.5 / zoom;
  const hw = w / 2;
  const hd = d / 2;
  const inset = Math.min(w, d) * 0.06;
  const minSide = Math.min(w, d);
  const soft = withAlpha(color, 0.16);
  const strokeColor = withAlpha(color, 0.88);
  const arcR = Math.min(hw, hd) * 0.12;
  const texture = {
    spacing: 0.1,
    angle: Math.PI / 4,
    baseAlpha: 0.08,
    lineAlpha: 0.08,
    cross: false,
  };

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lw;
  ctx.fillStyle = withAlpha(color, 0.12);

  const p = { hw, hd, w, d, inset, minSide, soft, strokeColor, arcR, lw, zoom, color, texture };
  const drawer = SHAPE_DRAWERS[type];
  if (drawer) {
    drawer(ctx, p);
  } else {
    ctx.fillRect(-hw, -hd, w, d);
    ctx.strokeRect(-hw, -hd, w, d);
  }

  if (minSide >= 55) {
    drawFurnitureTopTexture(ctx, w, d, arcR, color, zoom, texture);
  } else if (minSide >= 40 && texture.cross === false && texture.baseAlpha < 0.1) {
    drawFurnitureTopTexture(ctx, w, d, arcR * 0.7, color, zoom, {
      ...texture,
      cross: false,
      baseAlpha: Math.max(0.03, texture.baseAlpha),
      spacing: Math.max(texture.spacing, 0.2),
      lineAlpha: Math.max(0.03, texture.lineAlpha),
    });
  }

  drawFurnitureTopLabel(ctx, label, w, d, color, zoom);
}

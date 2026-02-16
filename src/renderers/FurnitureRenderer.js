// ── FurnitureRenderer.js ──────────────────────
// Furniture layer drawing.

import { CONFIG } from '../config.js';
import { drawFurnitureShape } from '../FurnitureShapes.js';
import { drawSelectionDash, endDash } from './helpers.js';

const { SELECTION } = CONFIG.COLORS;

export function drawFurnitureLayer(ctx, layer, state, isActive) {
  const zoom = state.zoom;
  for (const item of (layer.items || [])) {
    drawFurnitureItem(ctx, item, isActive && item === state.selectedFurniture, zoom);
  }
}

export function drawFurnitureItem(ctx, item, isSelected, zoom) {
  const catalog = CONFIG.FURNITURE_CATALOG[item.furnitureType];
  if (!catalog) return;

  const w = catalog.w;
  const d = catalog.d;
  const color = catalog.color || CONFIG.LAYER_COLORS.furniture;

  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate(item.rotation * Math.PI / 180);

  drawFurnitureShape(ctx, item.furnitureType, w, d, color, zoom, catalog.topLabel || catalog.label);

  ctx.restore();

  // Selection highlight
  if (isSelected) {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rotation * Math.PI / 180);
    drawSelectionDash(ctx, zoom);
    const margin = 4 / zoom;
    ctx.strokeRect(-w / 2 - margin, -d / 2 - margin, w + margin * 2, d + margin * 2);
    endDash(ctx);
    ctx.restore();
  }
}

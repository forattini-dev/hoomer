// ── StructureRenderer.js ─────────────────────────────────────────────
// Structure-layer drawing functions extracted from Renderer.js
// Handles walls, floors, doors, windows, stairs, labels, and dimensions.
// ─────────────────────────────────────────────────────────────────────

import { CONFIG } from '../config.js';
import { Geom } from '../geometry.js';
import { Materials } from '../materials.js';
import { drawTextWithBg, drawSelectionDash, endDash } from './helpers.js';

const C = CONFIG.COLORS;
const { SELECTION, TEXT } = C;

// ── Structure Layer Orchestrator ────────────────────────────────────

export function drawStructureLayer(ctx, layer, state, isActive) {
  const zoom = state.zoom;
  for (const floor of layer.floors) {
    drawFloor(ctx, floor, isActive && floor === state.selectedFloor, zoom);
  }
  drawCornerJoins(ctx, layer.walls, zoom);
  for (const wall of layer.walls) {
    drawWall(ctx, wall, isActive && wall === state.selectedWall, isActive && wall === state.hoveredWall, zoom);
  }
  for (const door of layer.doors) {
    drawDoor(ctx, door, isActive && door === state.selectedDoor, zoom);
  }
  for (const win of layer.windows) {
    drawWindow(ctx, win, isActive && win === state.selectedWindow, zoom);
  }
  for (const stair of layer.stairs) {
    drawStair(ctx, stair, isActive && stair === state.selectedStair, zoom);
  }
  for (const label of layer.labels) {
    drawLabel(ctx, label, isActive && label === state.selectedLabel, zoom);
  }
  for (const wall of layer.walls) {
    drawDimension(ctx, wall, zoom);
  }
}

// ── Walls ───────────────────────────────────────────────────────────

export function drawWall(ctx, wall, isSelected, isHovered, zoom) {
  const rect = wall.rect;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(rect[0].x, rect[0].y);
  for (let i = 1; i < rect.length; i++) ctx.lineTo(rect[i].x, rect[i].y);
  ctx.closePath();
  ctx.fillStyle = Materials.getWall(wall.material, ctx) || C.WALL_FALLBACK;
  ctx.fill();
  ctx.strokeStyle = isSelected ? SELECTION : isHovered ? C.WALL_HOVER : TEXT;
  ctx.lineWidth = isSelected ? 2.5 / zoom : 1.5 / zoom;
  ctx.stroke();
  if (isSelected) {
    ctx.setLineDash([6 / zoom, 4 / zoom]);
    ctx.strokeStyle = SELECTION; ctx.lineWidth = 1.5 / zoom; ctx.stroke();
    ctx.setLineDash([]);
    for (const pt of [{ x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 }]) {
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 4 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = SELECTION; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 / zoom; ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawWallGhost(ctx, wall, zoom) {
  const rect = wall.rect;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(rect[0].x, rect[0].y);
  for (let i = 1; i < rect.length; i++) ctx.lineTo(rect[i].x, rect[i].y);
  ctx.closePath();
  ctx.fillStyle = C.GHOST;
  ctx.fill();
  ctx.strokeStyle = C.GHOST_STROKE;
  ctx.lineWidth = 1 / zoom;
  ctx.stroke();
  ctx.restore();
}

// ── Corner Joins ────────────────────────────────────────────────────

export function drawCornerJoins(ctx, walls, zoom, overrideColor) {
  const endpointMap = Geom.buildEndpointMap(walls);
  for (const [, joint] of endpointMap) {
    if (joint.connections.length < 2) continue;
    const poly = Geom.cornerFillPolygon(joint);
    if (!poly || poly.length < 3) continue;
    const material = joint.connections[0].wall.material;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fillStyle = overrideColor || Materials.getWall(material, ctx) || C.WALL_FALLBACK;
    ctx.fill();
    ctx.restore();
  }
}

// ── Floors ──────────────────────────────────────────────────────────

export function drawFloor(ctx, floor, isSelected, zoom) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(floor.polygon[0].x, floor.polygon[0].y);
  for (let i = 1; i < floor.polygon.length; i++) ctx.lineTo(floor.polygon[i].x, floor.polygon[i].y);
  ctx.closePath();
  ctx.fillStyle = Materials.getFloor(floor.material, ctx) || C.FLOOR_FALLBACK;
  ctx.fill();
  if (isSelected) {
    ctx.strokeStyle = SELECTION; ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([6 / zoom, 4 / zoom]); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();
}

// ── Doors ───────────────────────────────────────────────────────────

export function drawDoor(ctx, door, isSelected, zoom) {
  const wall = door.wall;
  const wallAngle = Geom.angle(wall.x1, wall.y1, wall.x2, wall.y2);
  const center = door.center;
  const halfW = door.width / 2;

  const wdx = Math.cos(wallAngle);
  const wdy = Math.sin(wallAngle);
  const p1 = { x: center.x - wdx * halfW, y: center.y - wdy * halfW };
  const p2 = { x: center.x + wdx * halfW, y: center.y + wdy * halfW };

  const perpAngle = wallAngle + Math.PI / 2;
  const pdx = Math.cos(perpAngle) * door.openDir;
  const pdy = Math.sin(perpAngle) * door.openDir;
  const halfThick = wall.thickness / 2 + 1;

  // Gap — erase wall at door position
  ctx.save();
  ctx.fillStyle = C.CANVAS_BG;
  const gpdx = Math.cos(perpAngle) * halfThick;
  const gpdy = Math.sin(perpAngle) * halfThick;
  ctx.beginPath();
  ctx.moveTo(p1.x + gpdx, p1.y + gpdy);
  ctx.lineTo(p2.x + gpdx, p2.y + gpdy);
  ctx.lineTo(p2.x - gpdx, p2.y - gpdy);
  ctx.lineTo(p1.x - gpdx, p1.y - gpdy);
  ctx.closePath();
  ctx.fill();

  // Wall end caps at gap edges
  ctx.strokeStyle = TEXT;
  ctx.lineWidth = 1.5 / zoom;
  ctx.beginPath();
  ctx.moveTo(p1.x + gpdx, p1.y + gpdy);
  ctx.lineTo(p1.x - gpdx, p1.y - gpdy);
  ctx.moveTo(p2.x + gpdx, p2.y + gpdy);
  ctx.lineTo(p2.x - gpdx, p2.y - gpdy);
  ctx.stroke();

  const doorType = door.doorType || 'single';

  if (doorType === 'single') {
    _drawDoorSingle(ctx, door, p1, p2, pdx, pdy, isSelected, zoom);
  } else if (doorType === 'double') {
    _drawDoorDouble(ctx, door, center, p1, p2, pdx, pdy, wallAngle, isSelected, zoom);
  } else if (doorType === 'sliding') {
    _drawDoorSliding(ctx, door, center, p1, p2, wdx, wdy, perpAngle, isSelected, zoom);
  }

  // Selection highlight
  if (isSelected) {
    ctx.strokeStyle = SELECTION;
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([4 / zoom, 3 / zoom]);
    ctx.beginPath();
    ctx.arc(center.x, center.y, door.width / 2 + 5 / zoom, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

// ── Windows ─────────────────────────────────────────────────────────

export function drawWindow(ctx, win, isSelected, zoom) {
  const wall = win.wall;
  const wallAngle = Geom.angle(wall.x1, wall.y1, wall.x2, wall.y2);
  const center = win.center;
  const halfW = win.width / 2;

  const wdx = Math.cos(wallAngle);
  const wdy = Math.sin(wallAngle);
  const p1 = { x: center.x - wdx * halfW, y: center.y - wdy * halfW };
  const p2 = { x: center.x + wdx * halfW, y: center.y + wdy * halfW };

  const perpAngle = wallAngle + Math.PI / 2;
  const halfThick = wall.thickness / 2 + 1;
  const gpdx = Math.cos(perpAngle) * halfThick;
  const gpdy = Math.sin(perpAngle) * halfThick;

  ctx.save();
  ctx.fillStyle = C.CANVAS_BG;
  ctx.beginPath();
  ctx.moveTo(p1.x + gpdx, p1.y + gpdy);
  ctx.lineTo(p2.x + gpdx, p2.y + gpdy);
  ctx.lineTo(p2.x - gpdx, p2.y - gpdy);
  ctx.lineTo(p1.x - gpdx, p1.y - gpdy);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = TEXT;
  ctx.lineWidth = 1.5 / zoom;
  ctx.beginPath();
  ctx.moveTo(p1.x + gpdx, p1.y + gpdy);
  ctx.lineTo(p1.x - gpdx, p1.y - gpdy);
  ctx.moveTo(p2.x + gpdx, p2.y + gpdy);
  ctx.lineTo(p2.x - gpdx, p2.y - gpdy);
  ctx.stroke();

  const winType = win.windowType || 'fixed';
  const ndx = Math.cos(perpAngle);
  const ndy = Math.sin(perpAngle);
  const glassOffset = wall.thickness * 0.3;
  const glassColor = isSelected ? CONFIG.COLORS.SELECTION : C.WINDOW_GLASS;

  if (winType === 'fixed') {
    _drawWindowFixed(ctx, p1, p2, ndx, ndy, glassOffset, glassColor, zoom);
  } else if (winType === 'sliding') {
    _drawWindowSliding(ctx, p1, p2, center, wdx, wdy, ndx, ndy, glassOffset, glassColor, win.width, isSelected, zoom);
  } else if (winType === 'casement') {
    _drawWindowCasement(ctx, p1, p2, ndx, ndy, glassColor, win.width, isSelected, zoom);
  }

  if (isSelected) {
    drawSelectionDash(ctx, zoom);
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    ctx.arc(center.x, center.y, win.width / 2 + 5 / zoom, 0, Math.PI * 2);
    ctx.stroke();
    endDash(ctx);
  }

  ctx.restore();
}

// ── Stairs ──────────────────────────────────────────────────────────

export function drawStair(ctx, stair, isSelected, zoom) {
  ctx.save();
  ctx.translate(stair.x, stair.y);
  ctx.rotate(stair.rotation * Math.PI / 180);

  ctx.fillStyle = C.STAIR_FILL;
  ctx.fillRect(0, 0, stair.width, stair.length);

  ctx.strokeStyle = C.STAIR_STEP;
  ctx.lineWidth = 0.8 / zoom;
  const count = stair.stepCount;
  for (let i = 0; i <= count; i++) {
    const y = i * stair.stepDepth;
    if (y > stair.length) break;
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(stair.width, y);
    ctx.stroke();
  }

  const midX = stair.width / 2;
  const arrowStart = stair.length * 0.85;
  const arrowEnd = stair.length * 0.15;
  ctx.strokeStyle = TEXT;
  ctx.lineWidth = 2 / zoom;
  ctx.beginPath();
  ctx.moveTo(midX, arrowStart); ctx.lineTo(midX, arrowEnd);
  ctx.stroke();

  const headSize = Math.min(12, stair.width * 0.12);
  ctx.beginPath();
  ctx.moveTo(midX, arrowEnd);
  ctx.lineTo(midX - headSize, arrowEnd + headSize * 1.8);
  ctx.lineTo(midX + headSize, arrowEnd + headSize * 1.8);
  ctx.closePath();
  ctx.fillStyle = TEXT;
  ctx.fill();

  ctx.fillStyle = C.STAIR_TEXT;
  const fontSize = Math.min(12, stair.width * 0.12);
  ctx.font = `600 ${fontSize}px ${CONFIG.FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('UP', midX, stair.length * 0.55);

  ctx.strokeStyle = isSelected ? SELECTION : TEXT;
  ctx.lineWidth = isSelected ? 2.5 / zoom : 1.5 / zoom;
  ctx.strokeRect(0, 0, stair.width, stair.length);

  if (isSelected) {
    ctx.setLineDash([6 / zoom, 4 / zoom]);
    ctx.strokeStyle = SELECTION;
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(-2 / zoom, -2 / zoom, stair.width + 4 / zoom, stair.length + 4 / zoom);
    ctx.setLineDash([]);
  }

  ctx.restore();
}

// ── Labels ──────────────────────────────────────────────────────────

export function drawLabel(ctx, label, isSelected, zoom) {
  ctx.save();
  ctx.font = `500 ${label.fontSize}px ${CONFIG.FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = TEXT;
  ctx.fillText(label.text, label.x, label.y);

  if (isSelected) {
    const metrics = ctx.measureText(label.text);
    const w = metrics.width;
    const h = label.fontSize * 1.2;
    ctx.strokeStyle = SELECTION;
    ctx.lineWidth = 1.5 / zoom;
    ctx.setLineDash([4 / zoom, 3 / zoom]);
    ctx.strokeRect(label.x - w / 2 - 4 / zoom, label.y - h / 2 - 2 / zoom, w + 8 / zoom, h + 4 / zoom);
    ctx.setLineDash([]);
  }
  ctx.restore();
}

// ── Dimensions ──────────────────────────────────────────────────────

export function drawDimension(ctx, wall, zoom) {
  const length = wall.length;
  if (length < 20) return;
  const mx = (wall.x1 + wall.x2) / 2;
  const my = (wall.y1 + wall.y2) / 2;
  const angle = Geom.angle(wall.x1, wall.y1, wall.x2, wall.y2);
  const perpAngle = angle + Math.PI / 2;
  const offset = wall.thickness / 2 + CONFIG.DIMENSION_OFFSET;
  const lx = mx + Math.cos(perpAngle) * offset;
  const ly = my + Math.sin(perpAngle) * offset;
  const text = Geom.formatLength(length);

  ctx.save();
  ctx.translate(lx, ly);
  let textAngle = angle;
  if (textAngle > Math.PI / 2) textAngle -= Math.PI;
  if (textAngle < -Math.PI / 2) textAngle += Math.PI;
  ctx.rotate(textAngle);

  const fontSize = Math.max(9, 11 / zoom);
  const pad = 3 / zoom;
  drawTextWithBg(ctx, text, 0, 0, { fontSize, zoom, pad, bgColor: 'rgba(255,255,255,0.9)' });

  // Dimension lines — need text width for gap
  ctx.font = `600 ${fontSize}px ${CONFIG.FONT_FAMILY}`;
  const tw = ctx.measureText(text).width;
  const halfLen = length / 2;
  ctx.strokeStyle = C.GRID_LABEL; ctx.lineWidth = 0.8 / zoom;
  ctx.beginPath();
  ctx.moveTo(-halfLen, -3 / zoom); ctx.lineTo(-halfLen, 3 / zoom);
  ctx.moveTo(halfLen, -3 / zoom); ctx.lineTo(halfLen, 3 / zoom);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-halfLen, 0); ctx.lineTo(-tw / 2 - pad - 2 / zoom, 0);
  ctx.moveTo(tw / 2 + pad + 2 / zoom, 0); ctx.lineTo(halfLen, 0);
  ctx.stroke();
  ctx.restore();
}

// ── Door Sub-type Helpers (module-private) ──────────────────────────

function _drawDoorSingle(ctx, door, p1, p2, pdx, pdy, isSelected, zoom) {
  const hinge = door.hingeSide === 'left' ? p1 : p2;
  const free = door.hingeSide === 'left' ? p2 : p1;

  const leafEnd = { x: hinge.x + pdx * door.width, y: hinge.y + pdy * door.width };

  ctx.strokeStyle = isSelected ? SELECTION : TEXT;
  ctx.lineWidth = 2 / zoom;
  ctx.beginPath();
  ctx.moveTo(hinge.x, hinge.y);
  ctx.lineTo(leafEnd.x, leafEnd.y);
  ctx.stroke();

  const arcStart = Math.atan2(leafEnd.y - hinge.y, leafEnd.x - hinge.x);
  const arcEnd = Math.atan2(free.y - hinge.y, free.x - hinge.x);
  const ccw = (door.hingeSide === 'right') !== (door.openDir < 0);

  ctx.strokeStyle = isSelected ? 'rgba(123,150,170,0.5)' : 'rgba(90,85,80,0.25)';
  ctx.lineWidth = 1 / zoom;
  ctx.setLineDash([3 / zoom, 3 / zoom]);
  ctx.beginPath();
  ctx.arc(hinge.x, hinge.y, door.width, arcStart, arcEnd, ccw);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(hinge.x, hinge.y, 2.5 / zoom, 0, Math.PI * 2);
  ctx.fillStyle = isSelected ? SELECTION : TEXT;
  ctx.fill();
}

function _drawDoorDouble(ctx, door, center, p1, p2, pdx, pdy, wallAngle, isSelected, zoom) {
  const halfWidth = door.width / 2;

  const leafEnd1 = { x: center.x + pdx * halfWidth, y: center.y + pdy * halfWidth };
  const leafEnd2 = { x: center.x - pdx * halfWidth, y: center.y - pdy * halfWidth };

  ctx.strokeStyle = isSelected ? SELECTION : TEXT;
  ctx.lineWidth = 2 / zoom;
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(leafEnd1.x, leafEnd1.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(leafEnd2.x, leafEnd2.y);
  ctx.stroke();

  const arcStart1 = Math.atan2(leafEnd1.y - center.y, leafEnd1.x - center.x);
  const arcEnd1 = Math.atan2(p1.y - center.y, p1.x - center.x);
  const arcStart2 = Math.atan2(leafEnd2.y - center.y, leafEnd2.x - center.x);
  const arcEnd2 = Math.atan2(p2.y - center.y, p2.x - center.x);

  ctx.strokeStyle = isSelected ? 'rgba(123,150,170,0.5)' : 'rgba(90,85,80,0.25)';
  ctx.lineWidth = 1 / zoom;
  ctx.setLineDash([3 / zoom, 3 / zoom]);
  ctx.beginPath();
  ctx.arc(center.x, center.y, halfWidth, arcStart1, arcEnd1, door.openDir < 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(center.x, center.y, halfWidth, arcStart2, arcEnd2, door.openDir >= 0);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(center.x, center.y, 2.5 / zoom, 0, Math.PI * 2);
  ctx.fillStyle = isSelected ? SELECTION : TEXT;
  ctx.fill();
}

function _drawDoorSliding(ctx, door, center, p1, p2, wdx, wdy, perpAngle, isSelected, zoom) {
  const panelWidth = door.width * 0.8;
  const panelThick = 3 / zoom;
  const ndx = Math.cos(perpAngle);
  const ndy = Math.sin(perpAngle);
  const offset = panelThick;

  const panelCenter = { x: center.x + ndx * offset, y: center.y + ndy * offset };
  const px1 = { x: panelCenter.x - wdx * panelWidth / 2, y: panelCenter.y - wdy * panelWidth / 2 };
  const px2 = { x: panelCenter.x + wdx * panelWidth / 2, y: panelCenter.y + wdy * panelWidth / 2 };

  ctx.strokeStyle = isSelected ? SELECTION : TEXT;
  ctx.lineWidth = panelThick;
  ctx.beginPath();
  ctx.moveTo(px1.x, px1.y);
  ctx.lineTo(px2.x, px2.y);
  ctx.stroke();

  const arrowLen = door.width * 0.3;
  const arrowStart = { x: center.x - wdx * arrowLen / 2, y: center.y - wdy * arrowLen / 2 };
  const arrowEnd = { x: center.x + wdx * arrowLen / 2, y: center.y + wdy * arrowLen / 2 };

  ctx.strokeStyle = isSelected ? 'rgba(123,150,170,0.6)' : 'rgba(90,85,80,0.35)';
  ctx.lineWidth = 1.5 / zoom;
  ctx.setLineDash([3 / zoom, 2 / zoom]);
  ctx.beginPath();
  ctx.moveTo(arrowStart.x, arrowStart.y);
  ctx.lineTo(arrowEnd.x, arrowEnd.y);
  ctx.stroke();
  ctx.setLineDash([]);

  const headSize = 4 / zoom;
  ctx.beginPath();
  ctx.moveTo(arrowEnd.x, arrowEnd.y);
  ctx.lineTo(arrowEnd.x - wdx * headSize + ndy * headSize * 0.5, arrowEnd.y - wdy * headSize - ndx * headSize * 0.5);
  ctx.moveTo(arrowEnd.x, arrowEnd.y);
  ctx.lineTo(arrowEnd.x - wdx * headSize - ndy * headSize * 0.5, arrowEnd.y - wdy * headSize + ndx * headSize * 0.5);
  ctx.stroke();
}

// ── Window Sub-type Helpers (module-private) ────────────────────────

function _drawWindowFixed(ctx, p1, p2, ndx, ndy, glassOffset, color, zoom) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 / zoom;
  for (const sign of [-1, 1]) {
    const off = glassOffset * sign;
    ctx.beginPath();
    ctx.moveTo(p1.x + ndx * off, p1.y + ndy * off);
    ctx.lineTo(p2.x + ndx * off, p2.y + ndy * off);
    ctx.stroke();
  }
}

function _drawWindowSliding(ctx, p1, p2, center, wdx, wdy, ndx, ndy, glassOffset, color, width, isSelected, zoom) {
  const panelW = width * 0.55;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 / zoom;

  const lc = { x: center.x - wdx * width * 0.12, y: center.y - wdy * width * 0.12 };
  ctx.beginPath();
  ctx.moveTo(lc.x - wdx * panelW / 2 + ndx * glassOffset, lc.y - wdy * panelW / 2 + ndy * glassOffset);
  ctx.lineTo(lc.x + wdx * panelW / 2 + ndx * glassOffset, lc.y + wdy * panelW / 2 + ndy * glassOffset);
  ctx.stroke();

  const rc = { x: center.x + wdx * width * 0.12, y: center.y + wdy * width * 0.12 };
  ctx.beginPath();
  ctx.moveTo(rc.x - wdx * panelW / 2 - ndx * glassOffset, rc.y - wdy * panelW / 2 - ndy * glassOffset);
  ctx.lineTo(rc.x + wdx * panelW / 2 - ndx * glassOffset, rc.y + wdy * panelW / 2 - ndy * glassOffset);
  ctx.stroke();

  const arrowLen = width * 0.2;
  ctx.strokeStyle = isSelected ? 'rgba(123,150,170,0.6)' : 'rgba(88,150,176,0.4)';
  ctx.lineWidth = 1 / zoom;
  ctx.setLineDash([2 / zoom, 2 / zoom]);
  ctx.beginPath();
  ctx.moveTo(center.x - wdx * arrowLen / 2, center.y - wdy * arrowLen / 2);
  ctx.lineTo(center.x + wdx * arrowLen / 2, center.y + wdy * arrowLen / 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function _drawWindowCasement(ctx, p1, p2, ndx, ndy, color, width, isSelected, zoom) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 / zoom;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  const arcRadius = width * 0.4;
  const arcEnd = { x: p1.x + ndx * arcRadius, y: p1.y + ndy * arcRadius };
  const arcStartAngle = Math.atan2(arcEnd.y - p1.y, arcEnd.x - p1.x);
  const arcEndAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  ctx.strokeStyle = isSelected ? 'rgba(123,150,170,0.4)' : 'rgba(88,150,176,0.3)';
  ctx.lineWidth = 1 / zoom;
  ctx.setLineDash([2 / zoom, 2 / zoom]);
  ctx.beginPath();
  ctx.arc(p1.x, p1.y, arcRadius, arcStartAngle, arcEndAngle, true);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = color;
  ctx.lineWidth = 1 / zoom;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(arcEnd.x, arcEnd.y);
  ctx.stroke();
}

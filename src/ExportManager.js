// ── ExportManager.js ─────────────────────────────────────
// Handles PNG and JSON export for the floor plan editor.

import { CONFIG } from './config.js';
import { Geom } from './geometry.js';
import { Materials } from './materials.js';

const CANVAS_BG = '#fff';
const FALLBACK_FLOOR = '#f0e8d8';
const FALLBACK_WALL = '#95a5a6';

export function exportPNG(story, renderer, storyName) {
  const struct = story.layers.structure;
  const elec = story.layers.electrical;
  const plumb = story.layers.plumbing;
  const furn = story.layers.furniture;
  const hasContent = struct.walls.length || struct.stairs.length || struct.labels.length ||
    elec.panels.length || elec.wires.length || elec.symbols.length || plumb.pipes.length || plumb.symbols.length ||
    furn.items.length;
  if (!hasContent) return false;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const wall of struct.walls) {
    for (const p of wall.rect) {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }
  }
  for (const stair of struct.stairs) {
    for (const p of stair.corners) {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }
  }
  for (const label of struct.labels) {
    const charW = label.fontSize * 0.6;
    const hw = label.text.length * charW / 2;
    const hh = label.fontSize;
    minX = Math.min(minX, label.x - hw); minY = Math.min(minY, label.y - hh);
    maxX = Math.max(maxX, label.x + hw); maxY = Math.max(maxY, label.y + hh);
  }
  for (const wire of elec.wires) {
    for (const p of wire.points) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
  }
  for (const sym of elec.symbols) {
    minX = Math.min(minX, sym.x - 20); minY = Math.min(minY, sym.y - 20); maxX = Math.max(maxX, sym.x + 20); maxY = Math.max(maxY, sym.y + 20);
  }
  for (const panel of elec.panels) {
    minX = Math.min(minX, panel.x - 30); minY = Math.min(minY, panel.y - 24); maxX = Math.max(maxX, panel.x + 30); maxY = Math.max(maxY, panel.y + 24);
  }
  for (const pipe of plumb.pipes) {
    for (const p of pipe.points) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
  }
  for (const sym of plumb.symbols) {
    minX = Math.min(minX, sym.x - 20); minY = Math.min(minY, sym.y - 20); maxX = Math.max(maxX, sym.x + 20); maxY = Math.max(maxY, sym.y + 20);
  }
  for (const item of furn.items) {
    const cat = CONFIG.FURNITURE_CATALOG[item.furnitureType];
    if (!cat) continue;
    const half = Math.max(cat.w, cat.d) / 2 + 10;
    minX = Math.min(minX, item.x - half); minY = Math.min(minY, item.y - half);
    maxX = Math.max(maxX, item.x + half); maxY = Math.max(maxY, item.y + half);
  }

  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 100; maxY = 100; }

  const pad = 100;
  const ew = maxX - minX + pad * 2;
  const eh = maxY - minY + pad * 2;

  const c = document.createElement('canvas');
  c.width = ew * 2; c.height = eh * 2;
  const g = c.getContext('2d');
  g.scale(2, 2);
  g.fillStyle = CANVAS_BG;
  g.fillRect(0, 0, ew, eh);
  g.save();
  g.translate(-minX + pad, -minY + pad);

  // Floors
  for (const floor of struct.floors) {
    g.beginPath();
    g.moveTo(floor.polygon[0].x, floor.polygon[0].y);
    for (let i = 1; i < floor.polygon.length; i++) g.lineTo(floor.polygon[i].x, floor.polygon[i].y);
    g.closePath();
    g.fillStyle = Materials.getFloor(floor.material, g) || FALLBACK_FLOOR;
    g.fill();
  }
  // Corner joins
  const endpointMap = Geom.buildEndpointMap(struct.walls);
  for (const [, joint] of endpointMap) {
    if (joint.connections.length < 2) continue;
    const poly = Geom.cornerFillPolygon(joint);
    if (!poly || poly.length < 3) continue;
    g.beginPath();
    g.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) g.lineTo(poly[i].x, poly[i].y);
    g.closePath();
    g.fillStyle = Materials.getWall(joint.connections[0].wall.material, g) || FALLBACK_WALL;
    g.fill();
  }
  // Walls
  for (const wall of struct.walls) {
    const rect = wall.rect;
    g.beginPath();
    g.moveTo(rect[0].x, rect[0].y);
    for (let i = 1; i < rect.length; i++) g.lineTo(rect[i].x, rect[i].y);
    g.closePath();
    g.fillStyle = Materials.getWall(wall.material, g) || FALLBACK_WALL;
    g.fill();
    g.strokeStyle = CONFIG.COLORS.TEXT; g.lineWidth = 1.5; g.stroke();
  }
  for (const door of struct.doors) { renderer.drawDoorExport(g, door); }
  for (const win of struct.windows) { renderer.drawWindowExport(g, win); }
  for (const stair of struct.stairs) { renderer.drawStairExport(g, stair); }
  for (const label of struct.labels) { renderer.drawLabelExport(g, label); }
  for (const wire of elec.wires) { renderer.drawWireExport(g, wire); }
  for (const panel of elec.panels) { renderer.drawElectricalPanelExport(g, panel); }
  for (const sym of elec.symbols) { renderer.drawElectricalSymbolExport(g, sym); }
  for (const pipe of plumb.pipes) { renderer.drawPipeExport(g, pipe); }
  for (const sym of plumb.symbols) { renderer.drawPlumbingSymbolExport(g, sym); }
  for (const item of furn.items) { renderer.drawFurnitureExport(g, item); }
  // Dimensions
  for (const wall of struct.walls) {
    const length = wall.length;
    if (length < 20) continue;
    const mx = (wall.x1 + wall.x2) / 2, my = (wall.y1 + wall.y2) / 2;
    const angle = Geom.angle(wall.x1, wall.y1, wall.x2, wall.y2);
    const perp = angle + Math.PI / 2;
    const off = wall.thickness / 2 + 20;
    g.save();
    g.translate(mx + Math.cos(perp) * off, my + Math.sin(perp) * off);
    let ta = angle;
    if (ta > Math.PI / 2) ta -= Math.PI;
    if (ta < -Math.PI / 2) ta += Math.PI;
    g.rotate(ta);
    g.font = `600 12px ${CONFIG.FONT_FAMILY}`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const text = Geom.formatLength(length);
    const m = g.measureText(text);
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.fillRect(-m.width / 2 - 3, -9, m.width + 6, 18);
    g.fillStyle = CONFIG.COLORS.TEXT;
    g.fillText(text, 0, 0);
    g.restore();
  }

  g.restore();

  const link = document.createElement('a');
  link.download = `floorplan-${storyName.toLowerCase().replace(/\s/g, '-')}.png`;
  link.href = c.toDataURL('image/png');
  link.click();
  return true;
}

export function exportJSON(stateData, projectName) {
  const json = JSON.stringify(stateData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

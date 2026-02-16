// ── Renderer.js ─────────────────────────────────
// Thin coordinator — delegates layer drawing to sub-renderers.

import { CONFIG } from './config.js';

// Sub-renderers
import { drawStructureLayer, drawWallGhost, drawCornerJoins, drawDoor, drawWindow, drawStair, drawLabel } from './renderers/StructureRenderer.js';
import { drawElectricalLayer, drawWire, drawElectricalPanel, drawElectricalSymbolExport } from './renderers/ElectricalRenderer.js';
import { drawPlumbingLayer, drawPipe, drawPlumbingSymbol } from './renderers/PlumbingRenderer.js';
import { drawFurnitureLayer, drawFurnitureItem } from './renderers/FurnitureRenderer.js';
import { drawPreview, drawFloorPolygonPreview, drawPolylinePreview, drawSnap } from './renderers/PreviewRenderer.js';

const C = CONFIG.COLORS;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
  }

  resize() {
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  get width() { return this.canvas.width / this.dpr; }
  get height() { return this.canvas.height / this.dpr; }

  render(state) {
    const ctx = this.ctx;
    const cw = this.width;
    const ch = this.height;

    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    ctx.fillStyle = C.CANVAS_BG;
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(state.panX, state.panY);
    ctx.scale(state.zoom, state.zoom);

    this._drawGrid(ctx, cw, ch, state);

    // Terrain boundary
    if (state.showTerrain && state.terrainWidth && state.terrainHeight) {
      this._drawTerrain(ctx, state);
    }

    // Ghost floor (floor below)
    if (state.ghostWalls && state.ghostWalls.length) {
      ctx.globalAlpha = 0.12;
      drawCornerJoins(ctx, state.ghostWalls, state.zoom, C.GHOST);
      for (const wall of state.ghostWalls) {
        drawWallGhost(ctx, wall, state.zoom);
      }
      ctx.globalAlpha = 1;
    }

    // ── Layer-aware rendering ──
    const story = state.currentStory;
    const activeLayer = story.activeLayer;
    const layers = story.layers;
    const layerOrder = CONFIG.LAYERS;

    for (const layerName of layerOrder) {
      const layer = layers[layerName];
      if (!layer.visible) continue;

      const isActive = layerName === activeLayer;
      const alpha = isActive ? 1.0 : CONFIG.INACTIVE_LAYER_OPACITY;

      ctx.save();
      ctx.globalAlpha = alpha;

      if (layerName === 'structure') {
        drawStructureLayer(ctx, layer, state, isActive);
      } else if (layerName === 'electrical') {
        drawElectricalLayer(ctx, layer, state, isActive);
      } else if (layerName === 'plumbing') {
        drawPlumbingLayer(ctx, layer, state, isActive);
      } else if (layerName === 'furniture') {
        drawFurnitureLayer(ctx, layer, state, isActive);
      }

      ctx.restore();
    }

    // Wall preview (only when structure layer active)
    if (activeLayer === 'structure' && state.isDrawing && state.drawStart) {
      drawPreview(ctx, state);
    }

    // Polyline preview (wire/pipe/floor-draw)
    if (state.polylinePoints && state.polylinePoints.length > 0 && state.mouseWorld) {
      if (state.activeTool === 'floor') {
        drawFloorPolygonPreview(ctx, state);
      } else {
        drawPolylinePreview(ctx, state);
      }
    }

    // Snap indicator
    const snapTools = ['wall', 'stair', 'label', 'panel', 'wire', 'pipe', 'electrical_symbol', 'plumbing_symbol', 'furniture_item', 'floor'];
    if (state.snapPoint && (snapTools.includes(state.activeTool) || state.isDrawing || state.polylinePoints.length > 0)) {
      drawSnap(ctx, state.snapPoint, state.zoom);
    }

    ctx.restore();
    this._drawOrigin(ctx, state);
    ctx.restore();
  }

  // ── Grid ──────────────────────────────────────
  _drawGrid(ctx, cw, ch, state) {
    const gs = state.gridSize;
    const majorEvery = gs * CONFIG.MAJOR_GRID_MULT;
    const zoom = state.zoom;
    const topLeft = screenToWorld(0, 0, state);
    const bottomRight = screenToWorld(cw, ch, state);
    const startX = Math.floor(topLeft.x / gs) * gs;
    const startY = Math.floor(topLeft.y / gs) * gs;
    const endX = Math.ceil(bottomRight.x / gs) * gs;
    const endY = Math.ceil(bottomRight.y / gs) * gs;

    ctx.strokeStyle = C.GRID_MINOR;
    ctx.lineWidth = 0.5 / zoom;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += gs) { if (x % majorEvery === 0) continue; ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
    for (let y = startY; y <= endY; y += gs) { if (y % majorEvery === 0) continue; ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
    ctx.stroke();

    ctx.strokeStyle = C.GRID_MAJOR;
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += gs) { if (x % majorEvery !== 0) continue; ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
    for (let y = startY; y <= endY; y += gs) { if (y % majorEvery !== 0) continue; ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
    ctx.stroke();

    ctx.strokeStyle = C.GRID_AXIS;
    ctx.lineWidth = 1.5 / zoom;
    ctx.beginPath();
    ctx.moveTo(startX, 0); ctx.lineTo(endX, 0);
    ctx.moveTo(0, startY); ctx.lineTo(0, endY);
    ctx.stroke();

    if (zoom > 0.3) {
      ctx.fillStyle = C.GRID_LABEL;
      ctx.font = `${11 / zoom}px ${CONFIG.FONT_FAMILY}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (let x = startX; x <= endX; x += majorEvery) {
        if (x === 0) continue;
        ctx.fillText((x / 100).toFixed(x % 100 === 0 ? 0 : 1) + 'm', x, 4 / zoom);
      }
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      for (let y = startY; y <= endY; y += majorEvery) {
        if (y === 0) continue;
        ctx.fillText((y / 100).toFixed(y % 100 === 0 ? 0 : 1) + 'm', 4 / zoom, y);
      }
    }
  }

  // ── Terrain ──────────────────────────────────
  _drawTerrain(ctx, state) {
    const w = state.terrainWidth;
    const h = state.terrainHeight;
    const zoom = state.zoom;

    let x0, y0;
    if (state.axisOrigin === 'bottom-left') {
      x0 = 0; y0 = -h;
    } else {
      x0 = -w / 2; y0 = -h / 2;
    }

    ctx.save();
    ctx.fillStyle = 'rgba(123, 150, 170, 0.03)';
    ctx.fillRect(x0, y0, w, h);

    ctx.strokeStyle = C.TERRAIN_BORDER;
    ctx.lineWidth = 1.5 / zoom;
    ctx.setLineDash([8 / zoom, 4 / zoom]);
    ctx.strokeRect(x0, y0, w, h);
    ctx.setLineDash([]);

    const fontSize = Math.max(10, 12 / zoom);
    ctx.font = `500 ${fontSize}px ${CONFIG.FONT_FAMILY}`;
    ctx.fillStyle = C.GRID_LABEL;

    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const widthLabel = (w / 100).toFixed(w % 100 === 0 ? 0 : 1) + 'm';
    ctx.fillText(widthLabel, x0 + w / 2, y0 + h + 8 / zoom);

    ctx.save();
    ctx.translate(x0 - 8 / zoom, y0 + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    const heightLabel = (h / 100).toFixed(h % 100 === 0 ? 0 : 1) + 'm';
    ctx.fillText(heightLabel, 0, 0);
    ctx.restore();

    ctx.restore();
  }

  // ── Origin ────────────────────────────────────
  _drawOrigin(ctx, state) {
    const sx = state.panX;
    const sy = state.panY;
    ctx.save();
    ctx.fillStyle = C.GRID_LABEL;
    ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.font = `10px ${CONFIG.FONT_FAMILY}`;
    ctx.fillText('0,0', sx + 6, sy + 4);
    ctx.restore();
  }

  // ── Export Wrappers (for ExportManager) ────────
  drawDoorExport(ctx, door) { drawDoor(ctx, door, false, 1); }
  drawWindowExport(ctx, win) { drawWindow(ctx, win, false, 1); }
  drawStairExport(ctx, stair) { drawStair(ctx, stair, false, 1); }
  drawLabelExport(ctx, label) { drawLabel(ctx, label, false, 1); }
  drawWireExport(ctx, wire) { drawWire(ctx, wire, false, 1); }
  drawElectricalPanelExport(ctx, panel) { drawElectricalPanel(ctx, panel, null, false, 1); }
  drawElectricalSymbolExport(ctx, sym) { drawElectricalSymbolExport(ctx, sym); }
  drawPipeExport(ctx, pipe) { drawPipe(ctx, pipe, false, 1); }
  drawPlumbingSymbolExport(ctx, sym) { drawPlumbingSymbol(ctx, sym, false, 1); }
  drawFurnitureExport(ctx, item) { drawFurnitureItem(ctx, item, false, 1); }
}

function screenToWorld(sx, sy, state) {
  return { x: (sx - state.panX) / state.zoom, y: (sy - state.panY) / state.zoom };
}

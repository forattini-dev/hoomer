import { CONFIG } from './config.js';
import { Geom } from './geometry.js';
import { Materials } from './materials.js';

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

    ctx.fillStyle = '#fefefe';
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
      this._drawCornerJoins(ctx, state.ghostWalls, state.zoom, '#c5c0b8');
      for (const wall of state.ghostWalls) {
        this._drawWallGhost(ctx, wall, state.zoom);
      }
      ctx.globalAlpha = 1;
    }

    // ── Layer-aware rendering ──
    const story = state.currentStory;
    const activeLayer = story.activeLayer;
    const layers = story.layers;
    const layerOrder = CONFIG.LAYERS; // ['structure', 'furniture', 'electrical', 'plumbing']

    for (const layerName of layerOrder) {
      const layer = layers[layerName];
      if (!layer.visible) continue;

      const isActive = layerName === activeLayer;
      const alpha = isActive ? 1.0 : CONFIG.INACTIVE_LAYER_OPACITY;

      ctx.save();
      ctx.globalAlpha = alpha;

      if (layerName === 'structure') {
        this._drawStructureLayer(ctx, layer, state, isActive);
      } else if (layerName === 'electrical') {
        this._drawElectricalLayer(ctx, layer, state, isActive);
      } else if (layerName === 'plumbing') {
        this._drawPlumbingLayer(ctx, layer, state, isActive);
      } else if (layerName === 'furniture') {
        this._drawFurnitureLayer(ctx, layer, state, isActive);
      }

      ctx.restore();
    }

    // Wall preview (only when structure layer active)
    if (activeLayer === 'structure' && state.isDrawing && state.drawStart) {
      this._drawPreview(ctx, state);
    }

    // Polyline preview (wire/pipe)
    if (state.polylinePoints && state.polylinePoints.length > 0 && state.mouseWorld) {
      this._drawPolylinePreview(ctx, state);
    }

    // Snap indicator
    const snapTools = ['wall', 'stair', 'label', 'panel', 'wire', 'pipe', 'electrical_symbol', 'plumbing_symbol', 'furniture_item'];
    if (state.snapPoint && (snapTools.includes(state.activeTool) || state.isDrawing || state.polylinePoints.length > 0)) {
      this._drawSnap(ctx, state.snapPoint, state.zoom);
    }

    ctx.restore();
    this._drawOrigin(ctx, state);
    ctx.restore();
  }

  // ── Structure Layer ─────────────────────────
  _drawStructureLayer(ctx, layer, state, isActive) {
    const zoom = state.zoom;
    for (const floor of layer.floors) {
      this._drawFloor(ctx, floor, isActive && floor === state.selectedFloor, zoom);
    }
    this._drawCornerJoins(ctx, layer.walls, zoom);
    for (const wall of layer.walls) {
      this._drawWall(ctx, wall, isActive && wall === state.selectedWall, isActive && wall === state.hoveredWall, zoom);
    }
    for (const door of layer.doors) {
      this._drawDoor(ctx, door, isActive && door === state.selectedDoor, zoom);
    }
    for (const win of layer.windows) {
      this._drawWindow(ctx, win, isActive && win === state.selectedWindow, zoom);
    }
    for (const stair of layer.stairs) {
      this._drawStair(ctx, stair, isActive && stair === state.selectedStair, zoom);
    }
    for (const label of layer.labels) {
      this._drawLabel(ctx, label, isActive && label === state.selectedLabel, zoom);
    }
    for (const wall of layer.walls) {
      this._drawDimension(ctx, wall, zoom);
    }
  }

  // ── Electrical Layer ────────────────────────
  _drawElectricalLayer(ctx, layer, state, isActive) {
    const zoom = state.zoom;
    for (const panel of (layer.panels || [])) {
      this._drawElectricalPanel(ctx, panel, state, isActive && panel === state.selectedPanel, zoom);
    }
    for (const wire of layer.wires) {
      this._drawWire(ctx, wire, isActive && wire === state.selectedWire, zoom);
    }
    for (const sym of layer.symbols) {
      this._drawElectricalSymbol(ctx, sym, state, isActive && sym === state.selectedElectricalSymbol, zoom);
    }
  }

  // ── Plumbing Layer ──────────────────────────
  _drawPlumbingLayer(ctx, layer, state, isActive) {
    const zoom = state.zoom;
    for (const pipe of layer.pipes) {
      this._drawPipe(ctx, pipe, isActive && pipe === state.selectedPipe, zoom);
    }
    for (const sym of layer.symbols) {
      this._drawPlumbingSymbol(ctx, sym, isActive && sym === state.selectedPlumbingSymbol, zoom);
    }
  }

  // ── Grid ──────────────────────────────────
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

    ctx.strokeStyle = '#eeece8';
    ctx.lineWidth = 0.5 / zoom;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += gs) { if (x % majorEvery === 0) continue; ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
    for (let y = startY; y <= endY; y += gs) { if (y % majorEvery === 0) continue; ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
    ctx.stroke();

    ctx.strokeStyle = '#ddd9d3';
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += gs) { if (x % majorEvery !== 0) continue; ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
    for (let y = startY; y <= endY; y += gs) { if (y % majorEvery !== 0) continue; ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
    ctx.stroke();

    ctx.strokeStyle = '#c0bdb6';
    ctx.lineWidth = 1.5 / zoom;
    ctx.beginPath();
    ctx.moveTo(startX, 0); ctx.lineTo(endX, 0);
    ctx.moveTo(0, startY); ctx.lineTo(0, endY);
    ctx.stroke();

    if (zoom > 0.3) {
      ctx.fillStyle = '#b0aca5';
      ctx.font = `${11 / zoom}px "Segoe UI", system-ui, sans-serif`;
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

  // ── Walls ─────────────────────────────────
  _drawWall(ctx, wall, isSelected, isHovered, zoom) {
    const rect = wall.rect;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(rect[0].x, rect[0].y);
    for (let i = 1; i < rect.length; i++) ctx.lineTo(rect[i].x, rect[i].y);
    ctx.closePath();
    ctx.fillStyle = Materials.getWall(wall.material, ctx) || '#95a5a6';
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#7b96aa' : isHovered ? '#9ab3c5' : '#5a5550';
    ctx.lineWidth = isSelected ? 2.5 / zoom : 1.5 / zoom;
    ctx.stroke();
    if (isSelected) {
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      ctx.strokeStyle = '#7b96aa'; ctx.lineWidth = 1.5 / zoom; ctx.stroke();
      ctx.setLineDash([]);
      for (const pt of [{ x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 }]) {
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 4 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = '#7b96aa'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 / zoom; ctx.stroke();
      }
    }
    ctx.restore();
  }

  _drawWallGhost(ctx, wall, zoom) {
    const rect = wall.rect;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(rect[0].x, rect[0].y);
    for (let i = 1; i < rect.length; i++) ctx.lineTo(rect[i].x, rect[i].y);
    ctx.closePath();
    ctx.fillStyle = '#c5c0b8';
    ctx.fill();
    ctx.strokeStyle = '#b0aaa0';
    ctx.lineWidth = 1 / zoom;
    ctx.stroke();
    ctx.restore();
  }

  _drawCornerJoins(ctx, walls, zoom, overrideColor) {
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
      ctx.fillStyle = overrideColor || Materials.getWall(material, ctx) || '#95a5a6';
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Floors ────────────────────────────────
  _drawFloor(ctx, floor, isSelected, zoom) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(floor.polygon[0].x, floor.polygon[0].y);
    for (let i = 1; i < floor.polygon.length; i++) ctx.lineTo(floor.polygon[i].x, floor.polygon[i].y);
    ctx.closePath();
    ctx.fillStyle = Materials.getFloor(floor.material, ctx) || '#f0e8d8';
    ctx.fill();
    if (isSelected) {
      ctx.strokeStyle = '#7b96aa'; ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([6 / zoom, 4 / zoom]); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // ── Doors ─────────────────────────────────
  _drawDoor(ctx, door, isSelected, zoom) {
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
    ctx.fillStyle = '#fefefe';
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
    ctx.strokeStyle = '#5a5550';
    ctx.lineWidth = 1.5 / zoom;
    ctx.beginPath();
    ctx.moveTo(p1.x + gpdx, p1.y + gpdy);
    ctx.lineTo(p1.x - gpdx, p1.y - gpdy);
    ctx.moveTo(p2.x + gpdx, p2.y + gpdy);
    ctx.lineTo(p2.x - gpdx, p2.y - gpdy);
    ctx.stroke();

    const doorType = door.doorType || 'single';

    if (doorType === 'single') {
      this._drawDoorSingle(ctx, door, p1, p2, pdx, pdy, isSelected, zoom);
    } else if (doorType === 'double') {
      this._drawDoorDouble(ctx, door, center, p1, p2, pdx, pdy, wallAngle, isSelected, zoom);
    } else if (doorType === 'sliding') {
      this._drawDoorSliding(ctx, door, center, p1, p2, wdx, wdy, perpAngle, isSelected, zoom);
    }

    // Selection highlight
    if (isSelected) {
      ctx.strokeStyle = '#7b96aa';
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([4 / zoom, 3 / zoom]);
      ctx.beginPath();
      ctx.arc(center.x, center.y, door.width / 2 + 5 / zoom, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  _drawDoorSingle(ctx, door, p1, p2, pdx, pdy, isSelected, zoom) {
    const hinge = door.hingeSide === 'left' ? p1 : p2;
    const free = door.hingeSide === 'left' ? p2 : p1;

    const leafEnd = { x: hinge.x + pdx * door.width, y: hinge.y + pdy * door.width };

    ctx.strokeStyle = isSelected ? '#7b96aa' : '#5a5550';
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
    ctx.fillStyle = isSelected ? '#7b96aa' : '#5a5550';
    ctx.fill();
  }

  _drawDoorDouble(ctx, door, center, p1, p2, pdx, pdy, wallAngle, isSelected, zoom) {
    const halfWidth = door.width / 2;

    const leafEnd1 = { x: center.x + pdx * halfWidth, y: center.y + pdy * halfWidth };
    const leafEnd2 = { x: center.x - pdx * halfWidth, y: center.y - pdy * halfWidth };

    ctx.strokeStyle = isSelected ? '#7b96aa' : '#5a5550';
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
    ctx.fillStyle = isSelected ? '#7b96aa' : '#5a5550';
    ctx.fill();
  }

  _drawDoorSliding(ctx, door, center, p1, p2, wdx, wdy, perpAngle, isSelected, zoom) {
    const panelWidth = door.width * 0.8;
    const panelThick = 3 / zoom;
    const ndx = Math.cos(perpAngle);
    const ndy = Math.sin(perpAngle);
    const offset = panelThick;

    const panelCenter = { x: center.x + ndx * offset, y: center.y + ndy * offset };
    const px1 = { x: panelCenter.x - wdx * panelWidth / 2, y: panelCenter.y - wdy * panelWidth / 2 };
    const px2 = { x: panelCenter.x + wdx * panelWidth / 2, y: panelCenter.y + wdy * panelWidth / 2 };

    ctx.strokeStyle = isSelected ? '#7b96aa' : '#5a5550';
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

  drawDoorExport(ctx, door) {
    this._drawDoor(ctx, door, false, 1);
  }

  // ── Windows ───────────────────────────────
  _drawWindow(ctx, win, isSelected, zoom) {
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
    ctx.fillStyle = '#fefefe';
    ctx.beginPath();
    ctx.moveTo(p1.x + gpdx, p1.y + gpdy);
    ctx.lineTo(p2.x + gpdx, p2.y + gpdy);
    ctx.lineTo(p2.x - gpdx, p2.y - gpdy);
    ctx.lineTo(p1.x - gpdx, p1.y - gpdy);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#5a5550';
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

    if (winType === 'fixed') {
      ctx.strokeStyle = isSelected ? '#7b96aa' : '#5896b0';
      ctx.lineWidth = 1.5 / zoom;
      for (const sign of [-1, 1]) {
        const off = glassOffset * sign;
        ctx.beginPath();
        ctx.moveTo(p1.x + ndx * off, p1.y + ndy * off);
        ctx.lineTo(p2.x + ndx * off, p2.y + ndy * off);
        ctx.stroke();
      }
    } else if (winType === 'sliding') {
      const panelW = win.width * 0.55;
      const thick = 2 / zoom;
      ctx.strokeStyle = isSelected ? '#7b96aa' : '#5896b0';
      ctx.lineWidth = thick;

      const lc = { x: center.x - wdx * win.width * 0.12, y: center.y - wdy * win.width * 0.12 };
      ctx.beginPath();
      ctx.moveTo(lc.x - wdx * panelW / 2 + ndx * glassOffset, lc.y - wdy * panelW / 2 + ndy * glassOffset);
      ctx.lineTo(lc.x + wdx * panelW / 2 + ndx * glassOffset, lc.y + wdy * panelW / 2 + ndy * glassOffset);
      ctx.stroke();

      const rc = { x: center.x + wdx * win.width * 0.12, y: center.y + wdy * win.width * 0.12 };
      ctx.beginPath();
      ctx.moveTo(rc.x - wdx * panelW / 2 - ndx * glassOffset, rc.y - wdy * panelW / 2 - ndy * glassOffset);
      ctx.lineTo(rc.x + wdx * panelW / 2 - ndx * glassOffset, rc.y + wdy * panelW / 2 - ndy * glassOffset);
      ctx.stroke();

      const arrowLen = win.width * 0.2;
      ctx.strokeStyle = isSelected ? 'rgba(123,150,170,0.6)' : 'rgba(88,150,176,0.4)';
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([2 / zoom, 2 / zoom]);
      ctx.beginPath();
      ctx.moveTo(center.x - wdx * arrowLen / 2, center.y - wdy * arrowLen / 2);
      ctx.lineTo(center.x + wdx * arrowLen / 2, center.y + wdy * arrowLen / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (winType === 'casement') {
      ctx.strokeStyle = isSelected ? '#7b96aa' : '#5896b0';
      ctx.lineWidth = 1.5 / zoom;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      const arcRadius = win.width * 0.4;
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

      ctx.strokeStyle = isSelected ? '#7b96aa' : '#5896b0';
      ctx.lineWidth = 1 / zoom;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(arcEnd.x, arcEnd.y);
      ctx.stroke();
    }

    if (isSelected) {
      ctx.strokeStyle = '#7b96aa';
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([4 / zoom, 3 / zoom]);
      ctx.beginPath();
      ctx.arc(center.x, center.y, win.width / 2 + 5 / zoom, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  drawWindowExport(ctx, win) {
    this._drawWindow(ctx, win, false, 1);
  }

  // ── Stairs ────────────────────────────────
  _drawStair(ctx, stair, isSelected, zoom) {
    ctx.save();
    ctx.translate(stair.x, stair.y);
    ctx.rotate(stair.rotation * Math.PI / 180);

    ctx.fillStyle = '#f5f2ec';
    ctx.fillRect(0, 0, stair.width, stair.length);

    ctx.strokeStyle = '#c5c0b8';
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
    ctx.strokeStyle = '#5a5550';
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
    ctx.fillStyle = '#5a5550';
    ctx.fill();

    ctx.fillStyle = '#8a8580';
    const fontSize = Math.min(12, stair.width * 0.12);
    ctx.font = `600 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('UP', midX, stair.length * 0.55);

    ctx.strokeStyle = isSelected ? '#7b96aa' : '#5a5550';
    ctx.lineWidth = isSelected ? 2.5 / zoom : 1.5 / zoom;
    ctx.strokeRect(0, 0, stair.width, stair.length);

    if (isSelected) {
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      ctx.strokeStyle = '#7b96aa';
      ctx.lineWidth = 1.5 / zoom;
      ctx.strokeRect(-2 / zoom, -2 / zoom, stair.width + 4 / zoom, stair.length + 4 / zoom);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  drawStairExport(ctx, stair) {
    ctx.save();
    ctx.translate(stair.x, stair.y);
    ctx.rotate(stair.rotation * Math.PI / 180);

    ctx.fillStyle = '#f5f2ec';
    ctx.fillRect(0, 0, stair.width, stair.length);

    ctx.strokeStyle = '#c5c0b8'; ctx.lineWidth = 0.8;
    const count = stair.stepCount;
    for (let i = 0; i <= count; i++) {
      const y = i * stair.stepDepth;
      if (y > stair.length) break;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(stair.width, y); ctx.stroke();
    }

    const midX = stair.width / 2;
    ctx.strokeStyle = '#5a5550'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(midX, stair.length * 0.85); ctx.lineTo(midX, stair.length * 0.15); ctx.stroke();

    const hs = Math.min(12, stair.width * 0.12);
    ctx.beginPath();
    ctx.moveTo(midX, stair.length * 0.15);
    ctx.lineTo(midX - hs, stair.length * 0.15 + hs * 1.8);
    ctx.lineTo(midX + hs, stair.length * 0.15 + hs * 1.8);
    ctx.closePath(); ctx.fillStyle = '#5a5550'; ctx.fill();

    ctx.fillStyle = '#8a8580';
    ctx.font = `600 ${Math.min(12, stair.width * 0.12)}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('UP', midX, stair.length * 0.55);

    ctx.strokeStyle = '#5a5550'; ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, stair.width, stair.length);
    ctx.restore();
  }

  // ── Labels ──────────────────────────────
  _drawLabel(ctx, label, isSelected, zoom) {
    ctx.save();
    ctx.font = `500 ${label.fontSize}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#5a5550';
    ctx.fillText(label.text, label.x, label.y);

    if (isSelected) {
      const metrics = ctx.measureText(label.text);
      const w = metrics.width;
      const h = label.fontSize * 1.2;
      ctx.strokeStyle = '#7b96aa';
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([4 / zoom, 3 / zoom]);
      ctx.strokeRect(label.x - w / 2 - 4 / zoom, label.y - h / 2 - 2 / zoom, w + 8 / zoom, h + 4 / zoom);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  drawLabelExport(ctx, label) {
    ctx.save();
    ctx.font = `500 ${label.fontSize}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#5a5550';
    ctx.fillText(label.text, label.x, label.y);
    ctx.restore();
  }

  // ── Wires ─────────────────────────────────
  _drawWire(ctx, wire, isSelected, zoom) {
    if (wire.points.length < 2) return;
    const color = CONFIG.WIRE_COLORS;
    const thickness = (CONFIG.WIRE_THICKNESS[wire.gauge] || 2) / zoom;

    ctx.save();
    ctx.strokeStyle = isSelected ? '#7b96aa' : color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(wire.points[0].x, wire.points[0].y);
    for (let i = 1; i < wire.points.length; i++) {
      ctx.lineTo(wire.points[i].x, wire.points[i].y);
    }
    ctx.stroke();

    // Draw points at vertices
    for (const p of wire.points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#7b96aa' : color;
      ctx.fill();
    }

    // Gauge label at midpoint
    if (wire.points.length >= 2) {
      const mid = Math.floor(wire.points.length / 2);
      const p0 = wire.points[mid - 1];
      const p1 = wire.points[mid];
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      const fontSize = Math.max(8, 10 / zoom);
      ctx.font = `600 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = `${wire.gauge}mm\u00B2`;
      const metrics = ctx.measureText(text);
      const pad = 2 / zoom;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(mx - metrics.width / 2 - pad, my - fontSize / 2 - pad, metrics.width + pad * 2, fontSize + pad * 2);
      ctx.fillStyle = isSelected ? '#7b96aa' : '#c87a10';
      ctx.fillText(text, mx, my);
    }

    // Selection highlight
    if (isSelected) {
      ctx.setLineDash([4 / zoom, 3 / zoom]);
      ctx.strokeStyle = '#7b96aa';
      ctx.lineWidth = 1 / zoom;
      ctx.beginPath();
      ctx.moveTo(wire.points[0].x, wire.points[0].y);
      for (let i = 1; i < wire.points.length; i++) {
        ctx.lineTo(wire.points[i].x, wire.points[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  drawWireExport(ctx, wire) {
    if (wire.points.length < 2) return;
    const color = CONFIG.WIRE_COLORS;
    const thickness = CONFIG.WIRE_THICKNESS[wire.gauge] || 2;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(wire.points[0].x, wire.points[0].y);
    for (let i = 1; i < wire.points.length; i++) {
      ctx.lineTo(wire.points[i].x, wire.points[i].y);
    }
    ctx.stroke();

    for (const p of wire.points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    if (wire.points.length >= 2) {
      const mid = Math.floor(wire.points.length / 2);
      const p0 = wire.points[mid - 1];
      const p1 = wire.points[mid];
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      ctx.font = '600 10px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = `${wire.gauge}mm\u00B2`;
      const metrics = ctx.measureText(text);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(mx - metrics.width / 2 - 2, my - 7, metrics.width + 4, 14);
      ctx.fillStyle = '#c87a10';
      ctx.fillText(text, mx, my);
    }

    ctx.restore();
  }

  // ── Electrical Symbols ────────────────────
  _getPanelLoadStatus(panel, state) {
    const elec = state.currentStory?.layers?.electrical;
    if (!elec) return { totalLoadA: 0, mainBreakerA: 1, hasIssue: false };
    const circuits = (elec.circuits || []).filter(c => c.panelId === panel.id);
    const symbols = elec.symbols || [];
    const totalLoadA = circuits.reduce((sum, c) => {
      const load = symbols
        .filter(sym => sym.circuitId === c.id)
        .reduce((acc, sym) => acc + (Number(sym.amperageA) || 0), 0);
      return sum + load;
    }, 0);
    const mainBreakerA = Math.max(1, Number(panel.mainBreakerA) || 1);
    const circuitOverload = circuits.some(c => {
      const load = symbols
        .filter(sym => sym.circuitId === c.id)
        .reduce((acc, sym) => acc + (Number(sym.amperageA) || 0), 0);
      const breaker = Math.max(1, Number(c.breakerA) || 1);
      return load > breaker;
    });
    const panelOverload = totalLoadA > mainBreakerA;
    return {
      totalLoadA,
      mainBreakerA,
      hasIssue: circuitOverload || panelOverload,
      panelOverload,
    };
  }

  _drawElectricalPanel(ctx, panel, state, isSelected, zoom) {
    const w = 52;
    const h = 36;
    const status = state ? this._getPanelLoadStatus(panel, state) : { totalLoadA: 0, mainBreakerA: 1, hasIssue: false };
    const danger = status.hasIssue && !isSelected;
    ctx.save();
    ctx.translate(panel.x, panel.y);
    ctx.fillStyle = isSelected
      ? 'rgba(123,150,170,0.15)'
      : danger
        ? 'rgba(207,77,58,0.09)'
        : 'rgba(245,166,35,0.08)';
    ctx.strokeStyle = isSelected ? '#7b96aa' : (danger ? '#cf4d3a' : '#b27b12');
    ctx.lineWidth = (isSelected ? 2 : 1.4) / zoom;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 6, -h / 2 + 10);
    ctx.lineTo(w / 2 - 6, -h / 2 + 10);
    ctx.moveTo(-w / 2 + 6, -h / 2 + 18);
    ctx.lineTo(w / 2 - 6, -h / 2 + 18);
    ctx.stroke();
    ctx.font = `${Math.max(9, 11 / zoom)}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isSelected ? '#6a8599' : (danger ? '#b33221' : '#9b6c10');
    ctx.fillText(panel.name, 0, 0);
    ctx.font = `${Math.max(7, 9 / zoom)}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillText(`${status.totalLoadA.toFixed(1)}A`, 0, h / 2 + (8 / zoom));
    if (danger) {
      ctx.beginPath();
      ctx.arc(w / 2 - 6, -h / 2 + 6, 4 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#cf4d3a';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `700 ${Math.max(7, 8 / zoom)}px "Segoe UI", system-ui, sans-serif`;
      ctx.fillText('!', w / 2 - 6, -h / 2 + 6);
    }
    ctx.restore();
  }

  drawElectricalPanelExport(ctx, panel) {
    this._drawElectricalPanel(ctx, panel, null, false, 1);
  }

  _drawElectricalSymbol(ctx, sym, state, isSelected, zoom) {
    ctx.save();
    ctx.translate(sym.x, sym.y);
    ctx.rotate(sym.rotation * Math.PI / 180);

    const r = 10 / zoom;
    const color = isSelected ? '#7b96aa' : CONFIG.WIRE_COLORS;

    this._drawElecSymbolShape(ctx, sym.symbolType, r, color, zoom);

    ctx.restore();

    // Selection highlight
    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = '#7b96aa';
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([4 / zoom, 3 / zoom]);
      ctx.beginPath();
      ctx.arc(sym.x, sym.y, 16 / zoom, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    this._drawElectricalCircuitLabel(ctx, sym, state, zoom, isSelected);
  }

  _drawElecSymbolShape(ctx, type, r, color, zoom) {
    const lw = 1.5 / zoom;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lw;

    switch (type) {
      case 'outlet_low': {
        // Circle + horizontal line (tomada baixa)
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-r * 1.4, 0);
        ctx.lineTo(r * 1.4, 0);
        ctx.stroke();
        break;
      }
      case 'outlet_med': {
        // Circle + cross (tomada média)
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        const cr = r * 0.6;
        ctx.beginPath();
        ctx.moveTo(-cr, -cr); ctx.lineTo(cr, cr);
        ctx.moveTo(cr, -cr); ctx.lineTo(-cr, cr);
        ctx.stroke();
        break;
      }
      case 'outlet_high': {
        // Circle + triangle (tomada alta)
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
        break;
      }
      case 'switch_single': {
        // Circle + diagonal line
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(r * 1.3, -r * 1.0);
        ctx.stroke();
        // Small dash at end
        ctx.beginPath();
        ctx.moveTo(r * 1.0, -r * 1.2);
        ctx.lineTo(r * 1.6, -r * 0.8);
        ctx.stroke();
        break;
      }
      case 'switch_double': {
        // Circle + two diagonal lines
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
        // Second dash
        ctx.beginPath();
        ctx.moveTo(r * 0.8, -r * 1.4);
        ctx.lineTo(r * 1.4, -r * 1.0);
        ctx.stroke();
        break;
      }
      case 'switch_parallel': {
        // Circle + diagonal + "P"
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
        // "P" label
        const fs = r * 0.8;
        ctx.font = `700 ${fs}px "Segoe UI", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', r * 1.7, -r * 0.3);
        break;
      }
      case 'light_ceiling': {
        // Circle with rays (sun symbol)
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
        ctx.stroke();
        const rays = 8;
        const innerR = r * 0.55;
        const outerR = r * 1.1;
        for (let i = 0; i < rays; i++) {
          const a = (i / rays) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
          ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
          ctx.stroke();
        }
        break;
      }
      case 'light_wall': {
        // Semicircle with rays
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.7, -Math.PI / 2, Math.PI / 2);
        ctx.closePath();
        ctx.stroke();
        const wallRays = 5;
        for (let i = 0; i < wallRays; i++) {
          const a = -Math.PI / 2 + (i / (wallRays - 1)) * Math.PI;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7);
          ctx.lineTo(Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2);
          ctx.stroke();
        }
        break;
      }
      case 'distribution_panel': {
        // Rectangle with "QD"
        const bw = r * 1.8;
        const bh = r * 1.4;
        ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
        const fs = r * 0.8;
        ctx.font = `700 ${fs}px "Segoe UI", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QD', 0, 0);
        break;
      }
    }
  }

  _drawElectricalCircuitLabel(ctx, sym, state, zoom, isSelected) {
    const circuits = state.currentStory?.layers?.electrical?.circuits || [];
    const circuit = circuits.find(c => c.id === sym.circuitId);
    const circLabel = circuit ? circuit.name : 'NC';
    const amp = Number(sym.amperageA) || 0;
    const text = `${circLabel} ${amp.toFixed(1)}A`;
    const fs = Math.max(8, 10 / zoom);
    ctx.font = `600 ${fs}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const x = sym.x + 12 / zoom;
    const y = sym.y + 10 / zoom;
    const m = ctx.measureText(text);
    const pad = 2 / zoom;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(x - pad, y - pad, m.width + pad * 2, fs + pad * 2);
    ctx.fillStyle = isSelected ? '#7b96aa' : '#b27b12';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  drawElectricalSymbolExport(ctx, sym) {
    ctx.save();
    ctx.translate(sym.x, sym.y);
    ctx.rotate(sym.rotation * Math.PI / 180);
    this._drawElecSymbolShape(ctx, sym.symbolType, 10, CONFIG.WIRE_COLORS, 1);
    ctx.restore();
    // Export fallback when no state context is available
    const text = `${sym.amperageA || 0}A`;
    ctx.font = '600 10px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const x = sym.x + 12;
    const y = sym.y + 10;
    const m = ctx.measureText(text);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(x - 2, y - 2, m.width + 4, 14);
    ctx.fillStyle = '#b27b12';
    ctx.fillText(text, x, y);
  }

  // ── Pipes ─────────────────────────────────
  _drawPipe(ctx, pipe, isSelected, zoom) {
    if (pipe.points.length < 2) return;
    const color = isSelected ? '#7b96aa' : (CONFIG.PIPE_COLORS[pipe.pipeType] || '#4a90d9');
    const dash = CONFIG.PIPE_DASH[pipe.pipeType] || [];
    const thickness = (CONFIG.PIPE_THICKNESS || 2.5) / zoom;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (dash.length) ctx.setLineDash(dash.map(d => d / zoom));
    ctx.beginPath();
    ctx.moveTo(pipe.points[0].x, pipe.points[0].y);
    for (let i = 1; i < pipe.points.length; i++) {
      ctx.lineTo(pipe.points[i].x, pipe.points[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw points at vertices
    for (const p of pipe.points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Flow arrows (one per segment, centered)
    this._drawPipeFlowArrows(ctx, pipe, zoom, color);

    // Diameter label at midpoint
    if (pipe.points.length >= 2) {
      const mid = Math.floor(pipe.points.length / 2);
      const p0 = pipe.points[mid - 1];
      const p1 = pipe.points[mid];
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      const fontSize = Math.max(8, 10 / zoom);
      ctx.font = `600 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = `\u00D8${pipe.diameter}`;
      const metrics = ctx.measureText(text);
      const pad = 2 / zoom;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(mx - metrics.width / 2 - pad, my - fontSize / 2 - pad, metrics.width + pad * 2, fontSize + pad * 2);
      ctx.fillStyle = isSelected ? '#7b96aa' : (CONFIG.PIPE_COLORS[pipe.pipeType] || '#4a90d9');
      ctx.fillText(text, mx, my);
    }

    // Selection highlight
    if (isSelected) {
      ctx.setLineDash([4 / zoom, 3 / zoom]);
      ctx.strokeStyle = '#7b96aa';
      ctx.lineWidth = 1 / zoom;
      ctx.beginPath();
      ctx.moveTo(pipe.points[0].x, pipe.points[0].y);
      for (let i = 1; i < pipe.points.length; i++) {
        ctx.lineTo(pipe.points[i].x, pipe.points[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  _drawPipeFlowArrows(ctx, pipe, zoom, color) {
    if (pipe.points.length < 2) return;
    const dir = pipe.flowDir || 1;
    const pts = pipe.points;
    const baseArrowLen = Math.max(12 / zoom, 6);
    const minSegLen = baseArrowLen * 1.4;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1 / zoom, 0.8);

    for (let i = 0; i < pts.length - 1; i++) {
      const a = dir >= 0 ? pts[i] : pts[i + 1];
      const b = dir >= 0 ? pts[i + 1] : pts[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < minSegLen) continue;

      const ux = dx / len;
      const uy = dy / len;
      const nx = -uy;
      const ny = ux;

      const arrowLen = Math.min(baseArrowLen, len * 0.6);
      const headSize = Math.min(arrowLen * 0.4, Math.max(5 / zoom, 3));
      const midx = (a.x + b.x) / 2;
      const midy = (a.y + b.y) / 2;
      const tip = { x: midx + ux * (arrowLen / 2), y: midy + uy * (arrowLen / 2) };
      const tail = { x: midx - ux * (arrowLen / 2), y: midy - uy * (arrowLen / 2) };

      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(tip.x - ux * headSize + nx * headSize * 0.6, tip.y - uy * headSize + ny * headSize * 0.6);
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(tip.x - ux * headSize - nx * headSize * 0.6, tip.y - uy * headSize - ny * headSize * 0.6);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawPipeExport(ctx, pipe) {
    if (pipe.points.length < 2) return;
    const color = CONFIG.PIPE_COLORS[pipe.pipeType] || '#4a90d9';
    const dash = CONFIG.PIPE_DASH[pipe.pipeType] || [];
    const thickness = CONFIG.PIPE_THICKNESS || 2.5;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (dash.length) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(pipe.points[0].x, pipe.points[0].y);
    for (let i = 1; i < pipe.points.length; i++) {
      ctx.lineTo(pipe.points[i].x, pipe.points[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    for (const p of pipe.points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    if (pipe.points.length >= 2) {
      const mid = Math.floor(pipe.points.length / 2);
      const p0 = pipe.points[mid - 1];
      const p1 = pipe.points[mid];
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      ctx.font = '600 10px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = `\u00D8${pipe.diameter}`;
      const metrics = ctx.measureText(text);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(mx - metrics.width / 2 - 2, my - 7, metrics.width + 4, 14);
      ctx.fillStyle = color;
      ctx.fillText(text, mx, my);
    }

    this._drawPipeFlowArrows(ctx, pipe, 1, color);

    ctx.restore();
  }

  // ── Plumbing Symbols ──────────────────────
  _drawPlumbingSymbol(ctx, sym, isSelected, zoom) {
    ctx.save();
    ctx.translate(sym.x, sym.y);
    ctx.rotate(sym.rotation * Math.PI / 180);

    const r = 10 / zoom;
    const color = isSelected ? '#7b96aa' : CONFIG.LAYER_COLORS.plumbing;

    this._drawPlumbSymbolShape(ctx, sym.symbolType, r, color, zoom);

    ctx.restore();

    // Selection highlight
    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = '#7b96aa';
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([4 / zoom, 3 / zoom]);
      ctx.beginPath();
      ctx.arc(sym.x, sym.y, 16 / zoom, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  _drawPlumbSymbolShape(ctx, type, r, color, zoom) {
    const lw = 1.5 / zoom;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lw;

    switch (type) {
      case 'valve': {
        // Bowtie shape
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
        break;
      }
      case 'drain': {
        // Circle + arrow pointing down
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        // Arrow down
        ctx.beginPath();
        ctx.moveTo(0, r * 0.6);
        ctx.lineTo(0, r * 1.4);
        ctx.stroke();
        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(0, r * 1.4);
        ctx.lineTo(-r * 0.3, r * 1.0);
        ctx.lineTo(r * 0.3, r * 1.0);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'water_tank': {
        // Rectangle with "CX"
        const bw = r * 1.8;
        const bh = r * 1.4;
        ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
        const fs = r * 0.7;
        ctx.font = `700 ${fs}px "Segoe UI", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CX', 0, 0);
        break;
      }
      case 'water_pump': {
        // Circle with "M"
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        const fs = r * 0.9;
        ctx.font = `700 ${fs}px "Segoe UI", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('M', 0, 0);
        break;
      }
      case 'pool': {
        // Rectangle with waves
        const bw = r * 2;
        const bh = r * 1.2;
        ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
        // Wave lines
        ctx.beginPath();
        const waveY = -bh * 0.1;
        const step = bw / 8;
        ctx.moveTo(-bw / 2 + step, waveY);
        for (let i = 1; i < 8; i++) {
          const x = -bw / 2 + step * (i + 1);
          const y = waveY + (i % 2 === 0 ? -r * 0.2 : r * 0.2);
          ctx.quadraticCurveTo(-bw / 2 + step * i + step / 2, i % 2 === 0 ? waveY + r * 0.2 : waveY - r * 0.2, x, waveY);
        }
        ctx.stroke();
        break;
      }
      case 'motor': {
        // Circle with "MO"
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        const fs = r * 0.7;
        ctx.font = `700 ${fs}px "Segoe UI", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MO', 0, 0);
        break;
      }
    }
  }

  drawPlumbingSymbolExport(ctx, sym) {
    ctx.save();
    ctx.translate(sym.x, sym.y);
    ctx.rotate(sym.rotation * Math.PI / 180);
    this._drawPlumbSymbolShape(ctx, sym.symbolType, 10, CONFIG.LAYER_COLORS.plumbing, 1);
    ctx.restore();
  }

  // ── Furniture Layer ────────────────────────
  _drawFurnitureLayer(ctx, layer, state, isActive) {
    const zoom = state.zoom;
    for (const item of (layer.items || [])) {
      this._drawFurnitureItem(ctx, item, isActive && item === state.selectedFurniture, zoom);
    }
  }

  _drawFurnitureItem(ctx, item, isSelected, zoom) {
    const catalog = CONFIG.FURNITURE_CATALOG[item.furnitureType];
    if (!catalog) return;

    const w = catalog.w;
    const d = catalog.d;
    const color = catalog.color || CONFIG.LAYER_COLORS.furniture;

    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rotation * Math.PI / 180);

    this._drawFurnitureShape(ctx, item.furnitureType, w, d, color, zoom, catalog.topLabel || catalog.label);

    ctx.restore();

    // Selection highlight
    if (isSelected) {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rotation * Math.PI / 180);
      ctx.strokeStyle = '#7b96aa';
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([5 / zoom, 3 / zoom]);
      const margin = 4 / zoom;
      ctx.strokeRect(-w / 2 - margin, -d / 2 - margin, w + margin * 2, d + margin * 2);
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  _toRgb(color) {
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

  _isColorDark(color) {
    const rgb = this._toRgb(color);
    if (!rgb) return false;
    const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
    return luminance < 125;
  }

  _withAlpha(color, alpha) {
    const rgb = this._toRgb(color);
    if (!rgb) return color;
    const raw = Number(alpha);
    const safeAlpha = Number.isFinite(raw) ? Math.max(0, Math.min(1, raw)) : 1;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${safeAlpha})`;
  }

  _drawRoundedRect(ctx, x, y, w, h, radius) {
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

  _drawFurnitureTopTexture(ctx, w, d, radius, color, zoom, opts = {}) {
    const hw = w / 2;
    const hd = d / 2;
    const minDim = Math.min(w, d);
    const baseAlpha = opts.baseAlpha ?? 0.11;
    const lineAlpha = opts.lineAlpha ?? 0.09;
    const spacing = Math.max(5 / zoom, minDim * (opts.spacing ?? 0.1));
    const angle = opts.angle ?? (Math.PI / 4);
    const cross = Boolean(opts.cross);

    const lines = this._withAlpha(color, lineAlpha);
    const linesStrong = this._withAlpha(color, Math.min(1, lineAlpha + 0.05));

    ctx.save();
    this._drawRoundedRect(ctx, -hw, -hd, w, d, radius);
    ctx.clip();

    const grad = ctx.createLinearGradient(-hw, -hd, hw, hd);
    grad.addColorStop(0, this._withAlpha(color, baseAlpha + 0.02));
    grad.addColorStop(0.45, this._withAlpha(color, 0.02));
    grad.addColorStop(1, this._withAlpha(color, baseAlpha + 0.02));
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

  _drawFurnitureTopLabel(ctx, text, w, d, color, zoom) {
    const raw = (text || '').toString().trim();
    if (!raw) return;

    const label = raw.slice(0, 4).toUpperCase();
    const fontSize = Math.max(6, Math.min(10, Math.min(w, d) * 0.12)) / zoom;

    ctx.save();
    ctx.font = `600 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
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
    this._drawRoundedRect(ctx, -width / 2, y, width, height, Math.min(4 / zoom, height / 2));
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this._isColorDark(color) ? '#f6f7f8' : '#272727';
    ctx.fillText(label, 0, y + height / 2);
    ctx.restore();
  }

  _drawFurnitureShape(ctx, type, w, d, color, zoom, label) {
    const lw = 1.5 / zoom;
    const hw = w / 2;
    const hd = d / 2;
    const inset = Math.min(w, d) * 0.06;
    const minSide = Math.min(w, d);
    const soft = this._withAlpha(color, 0.16);
    const strokeColor = this._withAlpha(color, 0.88);
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
    ctx.fillStyle = this._withAlpha(color, 0.12);

    switch (type) {
      case 'sofa_2seat':
      case 'sofa_3seat': {
        this._drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
        ctx.fill();
        ctx.stroke();

        const seats = type === 'sofa_3seat' ? 3 : 2;
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
        break;
      }
      case 'armchair': {
        this._drawRoundedRect(ctx, -hw, -hd, w, d, arcR * 0.8);
        ctx.fill();
        ctx.stroke();
        this._drawRoundedRect(ctx, -hw + inset, -hd + inset, w - inset * 2, d - inset * 2, arcR * 0.7);
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
        break;
      }
      case 'coffee_table': {
        this._drawRoundedRect(ctx, -hw, -hd, w, d, arcR * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = soft;
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(hw, hd) * 0.85, 0, Math.PI * 2);
        ctx.fill();
        texture.cross = true;
        texture.baseAlpha = 0.07;
        break;
      }
      case 'tv_console': {
        this._drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
        ctx.fill();
        ctx.stroke();

        const margin = w * 0.05;
        const panelW = w - margin * 2;
        const panelH = d * 0.35;
        const px = -hw + margin;
        const py = -hd + d * 0.1;
        this._drawRoundedRect(ctx, px, py, panelW, panelH, arcR * 0.5);
        ctx.stroke();
        this._drawRoundedRect(ctx, px + margin * 0.5, py + panelH * 0.45, panelW - margin, panelH * 0.35, Math.max(2 / zoom, arcR * 0.3));
        texture.cross = true;
        texture.baseAlpha = 0.06;
        break;
      }
      case 'dining_table': {
        this._drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
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
        break;
      }
      case 'round_table': {
        const radius = Math.min(hw, hd);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = this._withAlpha(color, 0.5);
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
        break;
      }
      case 'chair': {
        this._drawRoundedRect(ctx, -hw, -hd, w, d, arcR * 0.9);
        ctx.fill();
        ctx.stroke();
        const r = Math.min(hw, hd) * 0.55;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        texture.cross = false;
        texture.spacing = 0.2;
        break;
      }
      case 'bed_single':
      case 'bed_double':
      case 'bed_queen': {
        this._drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
        ctx.fill();
        ctx.stroke();

        const pillowH = d * 0.1;
        const pillowMargin = w * 0.08;
        ctx.fillStyle = this._withAlpha(color, 0.17);
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
        break;
      }
      case 'wardrobe': {
        this._drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
        ctx.fill();
        ctx.stroke();

        const innerInset = inset * 0.8;
        const innerW = w - innerInset * 2;
        const innerH = d - innerInset * 2;
        const innerX = -hw + innerInset;
        const innerY = -hd + innerInset;
        this._drawRoundedRect(ctx, innerX, innerY, innerW, innerH, arcR * 0.5);
        ctx.strokeStyle = this._withAlpha(color, 0.38);
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
        ctx.strokeStyle = this._withAlpha(color, 0.55);
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
        break;
      }
      case 'nightstand': {
        this._drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
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
        break;
      }
      case 'kitchen_sink': {
        this._drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(0, 0, hw * 0.62, hd * 0.54, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, hw * 0.55, hd * 0.45, 0, 0, Math.PI * 2);
        ctx.strokeStyle = this._withAlpha(color, 0.5);
        ctx.stroke();
        ctx.strokeStyle = strokeColor;

        ctx.beginPath();
        ctx.arc(0, -hd * 0.7, 2.8 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        texture.cross = false;
        texture.baseAlpha = 0.06;
        break;
      }
      case 'stove': {
        this._drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
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
        break;
      }
      case 'fridge': {
        this._drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
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
        break;
      }
      case 'toilet': {
        const tankH = d * 0.3;
        this._drawRoundedRect(ctx, -hw, -hd, w, tankH, arcR * 0.8);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(0, hd * 0.12, Math.min(hw, hd) * 0.65, hd * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      }
      case 'bath_sink': {
        this._drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, Math.min(hw, hd) * 0.65, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -hd * 0.6, 2.4 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        break;
      }
      case 'bathtub': {
        this._drawRoundedRect(ctx, -hw, -hd, w, d, arcR * 1.4);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(0, 0, hw * 0.88, hd * 0.67, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, hw * 0.62, hd * 0.48, 0, 0, Math.PI * 2);
        ctx.strokeStyle = this._withAlpha(color, 0.5);
        ctx.stroke();
        ctx.strokeStyle = strokeColor;
        texture.cross = true;
        break;
      }
      case 'shower': {
        this._drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
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
        break;
      }
      case 'desk': {
        this._drawRoundedRect(ctx, -hw, -hd, w, d, arcR);
        ctx.fill();
        ctx.stroke();

        const drawerW = w * 0.35;
        this._drawRoundedRect(ctx, hw - drawerW, -hd, drawerW, d, arcR * 0.6);
        ctx.stroke();
        for (let i = 0; i < 2; i++) {
          const y = -hd + d * (0.3 + i * 0.4);
          ctx.beginPath();
          ctx.moveTo(hw - drawerW * 0.3, y);
          ctx.lineTo(hw - drawerW * 0.7, y);
          ctx.stroke();
        }
        texture.cross = true;
        break;
      }
      case 'office_chair': {
        const radius = Math.min(hw, hd);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.62, 0, Math.PI * 2);
        ctx.strokeStyle = this._withAlpha(color, 0.75);
        ctx.stroke();
        ctx.strokeStyle = strokeColor;
        ctx.beginPath();
        ctx.moveTo(-radius * 0.45, -radius * 0.35);
        ctx.quadraticCurveTo(0, radius * -0.68, radius * 0.45, -radius * 0.35);
        ctx.stroke();
        texture.cross = false;
        break;
      }
      default: {
        ctx.fillRect(-hw, -hd, w, d);
        ctx.strokeRect(-hw, -hd, w, d);
        break;
      }
    }

    if (minSide >= 55) {
      this._drawFurnitureTopTexture(ctx, w, d, arcR, color, zoom, texture);
    } else if (minSide >= 40 && texture.cross === false && texture.baseAlpha < 0.1) {
      this._drawFurnitureTopTexture(ctx, w, d, arcR * 0.7, color, zoom, {
        ...texture,
        cross: false,
        baseAlpha: Math.max(0.03, texture.baseAlpha),
        spacing: Math.max(texture.spacing, 0.2),
        lineAlpha: Math.max(0.03, texture.lineAlpha),
      });
    }

    this._drawFurnitureTopLabel(ctx, label, w, d, color, zoom);
  }


  drawFurnitureExport(ctx, item) {
    const catalog = CONFIG.FURNITURE_CATALOG[item.furnitureType];
    if (!catalog) return;
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rotation * Math.PI / 180);
    const color = catalog.color || CONFIG.LAYER_COLORS.furniture;
    this._drawFurnitureShape(ctx, item.furnitureType, catalog.w, catalog.d, color, 1, catalog.topLabel || catalog.label);
    ctx.restore();
  }

  // ── Polyline Preview ──────────────────────
  _drawPolylinePreview(ctx, state) {
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

  // ── Dimensions ────────────────────────────
  _drawDimension(ctx, wall, zoom) {
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
    ctx.font = `600 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const metrics = ctx.measureText(text);
    const pad = 3 / zoom;

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(-metrics.width / 2 - pad, -fontSize / 2 - pad, metrics.width + pad * 2, fontSize + pad * 2);
    ctx.fillStyle = '#5a5550';
    ctx.fillText(text, 0, 0);

    const halfLen = length / 2;
    ctx.strokeStyle = '#b0aca5'; ctx.lineWidth = 0.8 / zoom;
    ctx.beginPath();
    ctx.moveTo(-halfLen, -3 / zoom); ctx.lineTo(-halfLen, 3 / zoom);
    ctx.moveTo(halfLen, -3 / zoom); ctx.lineTo(halfLen, 3 / zoom);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-halfLen, 0); ctx.lineTo(-metrics.width / 2 - pad - 2 / zoom, 0);
    ctx.moveTo(metrics.width / 2 + pad + 2 / zoom, 0); ctx.lineTo(halfLen, 0);
    ctx.stroke();
    ctx.restore();
  }

  // ── Preview (Wall) ────────────────────────
  _drawPreview(ctx, state) {
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
    ctx.fillStyle = Materials.getWall(state.wallMaterial, ctx) || '#95a5a6';
    ctx.fill();
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#7b96aa'; ctx.lineWidth = 1.5 / state.zoom;
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
    const fontSize = Math.max(10, 12 / state.zoom);
    ctx.font = `700 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const text = Geom.formatLength(length);
    const metrics = ctx.measureText(text);
    const pad = 4 / state.zoom;
    ctx.fillStyle = 'rgba(123,150,170,0.12)';
    ctx.fillRect(-metrics.width / 2 - pad, -fontSize / 2 - pad, metrics.width + pad * 2, fontSize + pad * 2);
    ctx.fillStyle = '#6a8599';
    ctx.fillText(text, 0, 0);
    ctx.restore();

    ctx.beginPath(); ctx.arc(x1, y1, 4 / state.zoom, 0, Math.PI * 2);
    ctx.fillStyle = '#7b96aa'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 / state.zoom; ctx.stroke();
  }

  // ── Snap ──────────────────────────────────
  _drawSnap(ctx, snapPoint, zoom) {
    const { x, y, type } = snapPoint;
    const r = 6 / zoom;
    ctx.save();
    if (type === 'endpoint') {
      ctx.beginPath();
      ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(139,184,158,0.35)'; ctx.fill();
      ctx.strokeStyle = '#8bb89e'; ctx.lineWidth = 1.5 / zoom; ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(123,150,170,0.45)'; ctx.lineWidth = 1 / zoom;
      ctx.beginPath();
      ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
      ctx.moveTo(x, y - r); ctx.lineTo(x, y + r);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Terrain ──────────────────────────────
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

    ctx.strokeStyle = '#c5c0b8';
    ctx.lineWidth = 1.5 / zoom;
    ctx.setLineDash([8 / zoom, 4 / zoom]);
    ctx.strokeRect(x0, y0, w, h);
    ctx.setLineDash([]);

    const fontSize = Math.max(10, 12 / zoom);
    ctx.font = `500 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = '#b0aca5';

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

  // ── Origin ────────────────────────────────
  _drawOrigin(ctx, state) {
    const sx = state.panX;
    const sy = state.panY;
    ctx.save();
    ctx.fillStyle = '#b0aca5';
    ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.font = '10px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('0,0', sx + 6, sy + 4);
    ctx.restore();
  }
}

function screenToWorld(sx, sy, state) {
  return { x: (sx - state.panX) / state.zoom, y: (sy - state.panY) / state.zoom };
}

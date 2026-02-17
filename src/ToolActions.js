// ── ToolActions.js ─────────────────────────────────────
// Extracted from App.js — all tool dispatch and entity creation logic.

import { CONFIG } from './config.js';
import { Geom } from './geometry.js';
import { Wall } from './Wall.js';
import { Floor } from './Floor.js';
import { Door } from './Door.js';
import { Window } from './Window.js';
import { Stair } from './Stair.js';
import { Label } from './Label.js';
import { Wire } from './Wire.js';
import { ElectricalPanel } from './ElectricalPanel.js';
import { ElectricalSymbol } from './ElectricalSymbol.js';
import { Pipe } from './Pipe.js';
import { PlumbingSymbol } from './PlumbingSymbol.js';
import { Furniture } from './Furniture.js';
import { newCircuitForPanel } from './ElectricalCalc.js';

export class ToolActions {
  constructor(app) {
    this.app = app;
  }

  dispatch(tool, snapped, world) {
    const app = this.app;

    switch (tool) {
      case 'wall':
        if (!app.isDrawing) {
          app.isDrawing = true;
          app.drawStart = { x: snapped.x, y: snapped.y };
          app._status('Click to define the wall endpoint');
        } else {
          this.finishWall(snapped.x, snapped.y);
        }
        break;
      case 'select':
        if (app.activeLayer === 'structure') {
          if (app.drag.tryStartDrag(world.x, world.y, snapped)) break;
        } else if (app.activeLayer === 'furniture') {
          if (app.drag.tryStartFurnitureDrag(world.x, world.y)) break;
        }
        app.selection.selectAt(world.x, world.y);
        break;
      case 'eraser':
        app.selection.eraseAt(world.x, world.y);
        break;
      case 'floor':
        if (app.floorMode === 'draw') {
          this.addFloorPoint(snapped.x, snapped.y);
        } else {
          this.addFloorAt(world.x, world.y);
        }
        break;
      case 'door':
        this.addDoorAt(world.x, world.y);
        break;
      case 'window':
        this.addWindowAt(world.x, world.y);
        break;
      case 'stair':
        this.addStairAt(snapped.x, snapped.y);
        break;
      case 'label':
        this.addLabelAt(snapped.x, snapped.y);
        break;
      case 'wire':
        this.addPolylinePoint(snapped.x, snapped.y);
        break;
      case 'panel':
        this.addPanelAt(snapped.x, snapped.y);
        break;
      case 'electrical_symbol':
        this.addElectricalSymbolAt(snapped.x, snapped.y);
        break;
      case 'pipe':
        this.addPolylinePoint(snapped.x, snapped.y);
        break;
      case 'plumbing_symbol':
        this.addPlumbingSymbolAt(snapped.x, snapped.y);
        break;
      case 'furniture_item':
        this.addFurnitureAt(snapped.x, snapped.y);
        break;
    }
  }

  // ── Wall ───────────────────────────────────────
  finishWall(x2, y2) {
    const app = this.app;
    const { x: x1, y: y1 } = app.drawStart;
    const length = Geom.dist(x1, y1, x2, y2);
    if (length < CONFIG.MIN_WALL_LENGTH) {
      app._status('Wall too short');
      app.isDrawing = false;
      app.drawStart = null;
      return;
    }
    app._pushHistory();
    app.walls.push(new Wall(x1, y1, x2, y2, app.wallThickness, app.wallMaterial));
    app.drawStart = { x: x2, y: y2 };
    app._status(`Wall: ${Geom.formatLength(length)} — Continue or ESC`);
  }

  // ── Door ───────────────────────────────────────
  addDoorAt(wx, wy) {
    this._addWallOpening({
      wx,
      wy,
      width: this.app.doorWidth,
      tooShortLabel: 'Wall too short for this door',
      missingLabel: 'Click on a wall to place the door',
      successLabel: 'Door added',
      onCreate: (wall, ratio) => new Door(
        wall,
        ratio,
        this.app.doorWidth,
        this.app.doorHinge,
        this.app.doorOpenDir,
        this.app.doorType,
      ),
      onInsert: (opening) => this.app.doors.push(opening),
    });
  }

  // ── Window ─────────────────────────────────────
  addWindowAt(wx, wy) {
    this._addWallOpening({
      wx,
      wy,
      width: this.app.windowWidth,
      tooShortLabel: 'Wall too short for this window',
      missingLabel: 'Click on a wall to place the window',
      successLabel: 'Window added',
      onCreate: (wall, ratio) => new Window(
        wall,
        ratio,
        this.app.windowWidth,
        this.app.windowType,
      ),
      onInsert: (opening) => this.app.windows.push(opening),
    });
  }

  _findWallAtPoint(wx, wy) {
    const app = this.app;
    for (let i = app.walls.length - 1; i >= 0; i--) {
      if (app.walls[i].hitTest(wx, wy)) return app.walls[i];
    }
    return null;
  }

  _addWallOpening({
    wx,
    wy,
    width,
    tooShortLabel,
    missingLabel,
    successLabel,
    onCreate,
    onInsert,
  }) {
    const app = this.app;
    const targetWall = this._findWallAtPoint(wx, wy);
    if (!targetWall) {
      app._status(missingLabel);
      return;
    }

    const wallLen = targetWall.length;
    if (wallLen < width) {
      app._status(tooShortLabel);
      return;
    }

    const dx = targetWall.x2 - targetWall.x1;
    const dy = targetWall.y2 - targetWall.y1;
    const lenSq = dx * dx + dy * dy;
    let t = ((wx - targetWall.x1) * dx + (wy - targetWall.y1) * dy) / lenSq;
    const halfRatio = (width / 2) / wallLen;
    t = Math.max(halfRatio, Math.min(1 - halfRatio, t));

    app._pushHistory();
    const opening = onCreate(targetWall, t);
    if (!opening) return;
    onInsert(opening);
    app._status(successLabel);
  }

  // ── Stair ──────────────────────────────────────
  addStairAt(wx, wy) {
    const app = this.app;
    app._pushHistory();
    const rad = app.stairRotation * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const hw = app.stairWidth / 2;
    const hl = app.stairLength / 2;
    const ox = hw * cos - hl * sin;
    const oy = hw * sin + hl * cos;
    app.stairs.push(new Stair(wx - ox, wy - oy, app.stairWidth, app.stairLength, app.stairRotation));
    app._status('Stair added');
  }

  // ── Label ──────────────────────────────────────
  addLabelAt(wx, wy) {
    const app = this.app;
    const text = prompt('Label text:', 'Room');
    if (!text) return;
    app._pushHistory();
    app.labels.push(new Label(wx, wy, text, app.labelFontSize));
    app._status('Label added');
  }

  // ── Polyline (wire/pipe) ───────────────────────
  addPolylinePoint(wx, wy) {
    const app = this.app;
    app.polylinePoints.push({ x: wx, y: wy });
    if (app.polylinePoints.length === 1) {
      const toolName = app.activeTool === 'wire' ? 'wire' : 'pipe';
      app._status(`Click to add points, ESC to finish ${toolName}`);
    }
    app._render();
  }

  finishPolyline() {
    const app = this.app;
    if (app.activeTool === 'floor') {
      this.finishFloorPolygon();
      return;
    }

    if (app.polylinePoints.length < 2) {
      app.polylinePoints = [];
      app._status('Need at least 2 points');
      return;
    }

    app._pushHistory();
    if (app.activeTool === 'wire') {
      app.wires.push(new Wire([...app.polylinePoints], app.wireGauge));
      app._status('Wire added');
    } else if (app.activeTool === 'pipe') {
      app.pipes.push(new Pipe([...app.polylinePoints], app.pipeType, app.pipeDiameter, app.pipeFlowDir));
      app._status('Pipe added');
    }
    app.polylinePoints = [];
    app._render();
  }

  onRightClick() {
    if (this.app.polylinePoints.length > 0) {
      this.finishPolyline();
    }
  }

  // ── Electrical Panel ───────────────────────────
  addPanelAt(wx, wy) {
    const app = this.app;
    app._pushHistory();
    const next = app.panels.length + 1;
    const name = `${app.panelNamePrefix || 'QD'}-${next}`;
    const panel = new ElectricalPanel(
      wx,
      wy,
      name,
      app.panelVoltage,
      app.panelPhases,
      app.panelMainBreakerA,
      CONFIG.DEFAULT_PANEL_BUS_CAPACITY_A,
    );
    app.panels.push(panel);
    const circuit = newCircuitForPanel(app.circuits, panel.id);
    app.circuits.push(circuit);
    app.electricalCircuitId = circuit.id;
    app._status('Electrical panel added');
    app._refreshCircuitSelects();
  }

  addCircuitToPanel(panel) {
    if (!panel) return;
    const app = this.app;
    app._pushHistory();
    const c = newCircuitForPanel(app.circuits, panel.id);
    app.circuits.push(c);
    app._refreshCircuitSelects();
    app._syncSelection();
    app._render();
  }

  // ── Electrical Symbol ──────────────────────────
  addElectricalSymbolAt(wx, wy) {
    const app = this.app;
    app._pushHistory();
    const circuitId = app.circuits.some(c => c.id === app.electricalCircuitId) ? app.electricalCircuitId : '';
    app.electricalSymbols.push(new ElectricalSymbol(
      wx,
      wy,
      app.electricalSymbolType,
      app.electricalSymbolRotation,
      circuitId,
      app.electricalLoadA,
    ));
    app._status('Electrical symbol added');
  }

  // ── Plumbing Symbol ────────────────────────────
  addPlumbingSymbolAt(wx, wy) {
    const app = this.app;
    app._pushHistory();
    app.plumbingSymbols.push(new PlumbingSymbol(wx, wy, app.plumbingSymbolType, app.plumbingSymbolRotation));
    app._status('Plumbing symbol added');
  }

  // ── Furniture ──────────────────────────────────
  addFurnitureAt(wx, wy) {
    const app = this.app;
    app._pushHistory();
    const item = new Furniture(wx, wy, app.furnitureType, app.furnitureRotation);
    app.furnitureItems.push(item);
    app._clearSelection();
    app.selectedFurniture = item;
    app._setTool('select');
    app._syncSelection();
    app._status('Furniture placed — adjust rotation if needed');
  }

  // ── Floor Detection ────────────────────────────
  addFloorAt(wx, wy) {
    const app = this.app;
    const polygon = detectRoom(app.walls, wx, wy);
    if (polygon && polygon.length >= 3) {
      app._pushHistory();
      app.floors.push(new Floor(polygon, app.floorMaterial));
      app._status('Floor added');
    } else {
      app._status('Closed room not detected — close the walls');
    }
    app._render();
  }

  addFloorPoint(wx, wy) {
    const app = this.app;
    if (app.polylinePoints.length >= 3) {
      const first = app.polylinePoints[0];
      if (Geom.dist(wx, wy, first.x, first.y) < 10) {
        this.finishFloorPolygon();
        return;
      }
    }
    app.polylinePoints.push({ x: wx, y: wy });
    if (app.polylinePoints.length === 1) {
      app._status('Click vertices, click first point or ESC to close');
    }
    app._render();
  }

  finishFloorPolygon() {
    const app = this.app;
    if (app.polylinePoints.length < 3) {
      app.polylinePoints = [];
      app._status('Need at least 3 points');
      return;
    }
    app._pushHistory();
    app.floors.push(new Floor([...app.polylinePoints], app.floorMaterial));
    app._status('Floor added');
    app.polylinePoints = [];
    app._render();
  }
}

// ── Pure function: room detection from walls ─────
export function detectRoom(walls, wx, wy) {
  const eps = 5;
  const vertices = [];
  const addVertex = (x, y) => {
    for (const v of vertices) { if (Geom.dist(v.x, v.y, x, y) < eps) return v; }
    const v = { x, y, edges: [] }; vertices.push(v); return v;
  };
  for (const wall of walls) {
    const v1 = addVertex(wall.x1, wall.y1);
    const v2 = addVertex(wall.x2, wall.y2);
    v1.edges.push(v2); v2.edges.push(v1);
  }
  for (const v of vertices) {
    v.edges.sort((a, b) => Math.atan2(a.y - v.y, a.x - v.x) - Math.atan2(b.y - v.y, b.x - v.x));
  }
  const faces = [];
  const visited = new Set();
  for (const start of vertices) {
    for (const next of start.edges) {
      const key = `${start.x},${start.y}->${next.x},${next.y}`;
      if (visited.has(key)) continue;
      const face = [];
      let cur = start, nxt = next, steps = 0;
      const maxSteps = vertices.length + 2;
      while (steps < maxSteps) {
        const ek = `${cur.x},${cur.y}->${nxt.x},${nxt.y}`;
        if (visited.has(ek)) break;
        visited.add(ek);
        face.push({ x: cur.x, y: cur.y });
        const inAng = Math.atan2(cur.y - nxt.y, cur.x - nxt.x);
        let best = null, bestDiff = Infinity;
        for (const nb of nxt.edges) {
          if (nb === cur && nxt.edges.length > 1) continue;
          const outAng = Math.atan2(nb.y - nxt.y, nb.x - nxt.x);
          let diff = outAng - inAng; if (diff <= 0) diff += Math.PI * 2;
          if (diff < bestDiff) { bestDiff = diff; best = nb; }
        }
        if (!best) break;
        cur = nxt; nxt = best; steps++;
        if (cur === start && nxt === next) break;
      }
      if (face.length >= 3 && cur === start) faces.push(face);
    }
  }
  let bestFace = null, bestArea = Infinity;
  for (const face of faces) {
    if (Geom.pointInPolygon(wx, wy, face)) {
      let area = 0;
      for (let i = 0, j = face.length - 1; i < face.length; j = i++) {
        area += face[j].x * face[i].y - face[i].x * face[j].y;
      }
      area = Math.abs(area / 2);
      if (area < bestArea && area > 0) { bestArea = area; bestFace = face; }
    }
  }
  return bestFace;
}

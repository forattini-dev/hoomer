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
import { ElectricalCircuit } from './ElectricalCircuit.js';
import { ElectricalSymbol } from './ElectricalSymbol.js';
import { Pipe } from './Pipe.js';
import { PlumbingSymbol } from './PlumbingSymbol.js';
import { Furniture } from './Furniture.js';
import { History } from './History.js';
import { Renderer } from './Renderer.js';
import { Viewer3D } from './Viewer3D.js';
import { ShareManager } from './ShareManager.js';
import { exportPNG, exportJSON } from './ExportManager.js';
import { CostsView } from './CostsView.js';

function storyName(i) {
  return i === 0 ? 'Ground Floor' : `Floor ${i}`;
}

function createLayeredStory(name) {
  return {
    name,
    activeLayer: 'structure',
    storyHeight: CONFIG.DEFAULT_STORY_HEIGHT,
    slabThickness: CONFIG.DEFAULT_SLAB_THICKNESS,
    layers: {
      structure:  { visible: true, walls: [], doors: [], windows: [], floors: [], stairs: [], labels: [] },
      furniture:  { visible: true, items: [] },
      electrical: { visible: true, panels: [], circuits: [], wires: [], symbols: [] },
      plumbing:   { visible: true, pipes: [], symbols: [] },
    },
  };
}

export class App {
  constructor(root, hostElement, overrides = {}) {
    this.root = root;
    this.hostElement = hostElement;

    this.canvas = this.$('main-canvas');
    this.renderer = new Renderer(this.canvas);

    // Stories (layered)
    this.stories = [createLayeredStory(storyName(0))];
    this.activeStoryIndex = 0;

    // Selection
    this.selectedWall = null;
    this.selectedFloor = null;
    this.selectedDoor = null;
    this.selectedWindow = null;
    this.selectedStair = null;
    this.selectedLabel = null;
    this.selectedWire = null;
    this.selectedPanel = null;
    this.selectedElectricalSymbol = null;
    this.selectedPipe = null;
    this.selectedPlumbingSymbol = null;
    this.selectedFurniture = null;

    // View
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.gridSize = CONFIG.DEFAULT_GRID;

    // Tool defaults
    this.activeTool = 'wall';
    this.wallThickness = CONFIG.DEFAULT_WALL_THICKNESS;
    this.wallMaterial = CONFIG.DEFAULT_WALL_MATERIAL;
    this.floorMaterial = CONFIG.DEFAULT_FLOOR_MATERIAL;
    this.doorWidth = CONFIG.DEFAULT_DOOR_WIDTH;
    this.doorHinge = 'left';
    this.doorOpenDir = 1;
    this.doorType = 'single';
    this.windowWidth = CONFIG.DEFAULT_WINDOW_WIDTH;
    this.windowType = 'fixed';
    this.stairWidth = CONFIG.DEFAULT_STAIR_WIDTH;
    this.stairLength = CONFIG.DEFAULT_STAIR_LENGTH;
    this.stairRotation = 0;
    this.labelFontSize = CONFIG.DEFAULT_LABEL_FONT_SIZE;

    // Electrical defaults
    this.wireGauge = 2.5;
    this.panelNamePrefix = 'QD';
    this.panelVoltage = CONFIG.DEFAULT_PANEL_VOLTAGE;
    this.panelPhases = CONFIG.DEFAULT_PANEL_PHASES;
    this.panelMainBreakerA = CONFIG.DEFAULT_PANEL_MAIN_BREAKER_A;
    this.electricalLoadA = CONFIG.DEFAULT_SYMBOL_AMPERAGE_A;
    this.electricalCircuitId = '';
    this.electricalSymbolType = 'outlet_low';
    this.electricalSymbolRotation = 0;

    // Plumbing defaults
    this.pipeType = 'cold';
    this.pipeDiameter = 25;
    this.pipeFlowDir = 1;
    this.plumbingSymbolType = 'valve';
    this.plumbingSymbolRotation = 0;

    // Furniture defaults
    this.furnitureType = 'chair';
    this.furnitureRotation = 0;

    // Floor draw mode
    this.floorMode = 'auto'; // 'auto' | 'draw'

    // Polyline drawing state (for wire/pipe/floor-draw)
    this.polylinePoints = [];

    // Terrain / Project
    this.terrainWidth = CONFIG.DEFAULT_TERRAIN_WIDTH;
    this.terrainHeight = CONFIG.DEFAULT_TERRAIN_HEIGHT;
    this.showTerrain = true;
    this.axisOrigin = 'bottom-left';

    // Apply overrides
    for (const [key, val] of Object.entries(overrides)) {
      if (key in this) this[key] = val;
    }

    // Interaction
    this.isDrawing = false;
    this.drawStart = null;
    this.mouseWorld = { x: 0, y: 0 };
    this.isPanning = false;
    this.panStart = null;
    this.hoveredWall = null;

    this._pointers = new Map();
    this._pinchState = null;
    this._primaryPointerId = null;

    // Dragging (select tool)
    this.isDragging = false;
    this.dragType = null;
    this.dragWall = null;
    this.dragOffset = null;
    this.dragStartState = null;

    // Snap
    this.snapGrid = true;
    this.snapAngle = true;
    this.snapAngleDeg = CONFIG.ANGLE_SNAP_DEG;
    this.snapEndpoint = true;
    this.snapPoint = null;

    // Ghost floor data (floor below)
    this.ghostWalls = [];

    // Tab state
    this.activeTab = 'creative';
    this.projectName = 'Untitled Project';
    this.costsView = new CostsView(sel => this.$(sel), msg => this._status(msg));

    // 3D state
    this.viewer3D = null;
    this.is3DMode = false;
    this._mobileNavMove = { up: 0, down: 0, left: 0, right: 0 };
    this._mobileLookPointerId = null;
    this._mobileLookStart = null;
    this._mobileWalkMovePointers = new Map();
    this._mobileNavBoundHandlers = [];

    // History
    this.history = new History();

    this._supportsPointerEvents = typeof window !== 'undefined' && ('PointerEvent' in window);

    // Bound handlers
    this._onMouseDownBound = e => this._onMouseDown(e);
    this._onMouseMoveBound = e => this._onMouseMove(e);
    this._onMouseUpBound = e => this._onMouseUp(e);
    this._onPointerDownBound = e => this._onPointerDown(e);
    this._onPointerMoveBound = e => this._onPointerMove(e);
    this._onPointerUpBound = e => this._onPointerUp(e);
    this._onPointerCancelBound = e => this._onPointerCancel(e);
    this._onWheelBound = e => this._onWheel(e);
    this._onContextMenuBound = e => { e.preventDefault(); this._onRightClick(); };
    this._onCanvasFocusBound = () => this.hostElement.focus();
    this._onKeyDownBound = e => this._onKeyDown(e);
    this._onKeyUpBound = e => this._onKeyUp(e);

    // Label edit state (avoid history spam)
    this._labelEditActive = false;

    this.renderer.resize();
    this._bindEvents();
    this._bindUI();
    this._bindMobileWalkControls();
    this._syncStoryTabs();
    this._syncLayerTabs();
    this._syncToolPalette();
    this._refreshCircuitSelects();
    this._centerView();
    this._render();

    // Detect shared project in URL hash
    queueMicrotask(() => this._loadFromHash());
  }

  // ── DOM helpers ─────────────────────────────
  $(id) { return this.root.getElementById(id); }
  $$(sel) { return this.root.querySelectorAll(sel); }
  $one(sel) { return this.root.querySelector(sel); }

  // ── Current story & layer accessors ─────────
  get currentStory() { return this.stories[this.activeStoryIndex]; }
  get activeLayer() { return this.currentStory.activeLayer; }
  set activeLayer(v) { this.currentStory.activeLayer = v; }

  // Structure layer accessors (backward compatible)
  get walls() { return this.currentStory.layers.structure.walls; }
  set walls(v) { this.currentStory.layers.structure.walls = v; }
  get doors() { return this.currentStory.layers.structure.doors; }
  set doors(v) { this.currentStory.layers.structure.doors = v; }
  get windows() { return this.currentStory.layers.structure.windows; }
  set windows(v) { this.currentStory.layers.structure.windows = v; }
  get floors() { return this.currentStory.layers.structure.floors; }
  set floors(v) { this.currentStory.layers.structure.floors = v; }
  get stairs() { return this.currentStory.layers.structure.stairs; }
  set stairs(v) { this.currentStory.layers.structure.stairs = v; }
  get labels() { return this.currentStory.layers.structure.labels; }
  set labels(v) { this.currentStory.layers.structure.labels = v; }

  // Electrical layer accessors
  get panels() { return this.currentStory.layers.electrical.panels; }
  set panels(v) { this.currentStory.layers.electrical.panels = v; }
  get circuits() { return this.currentStory.layers.electrical.circuits; }
  set circuits(v) { this.currentStory.layers.electrical.circuits = v; }
  get wires() { return this.currentStory.layers.electrical.wires; }
  set wires(v) { this.currentStory.layers.electrical.wires = v; }
  get electricalSymbols() { return this.currentStory.layers.electrical.symbols; }
  set electricalSymbols(v) { this.currentStory.layers.electrical.symbols = v; }

  // Plumbing layer accessors
  get pipes() { return this.currentStory.layers.plumbing.pipes; }
  set pipes(v) { this.currentStory.layers.plumbing.pipes = v; }
  get plumbingSymbols() { return this.currentStory.layers.plumbing.symbols; }
  set plumbingSymbols(v) { this.currentStory.layers.plumbing.symbols = v; }

  // Furniture layer accessors
  get furnitureItems() { return this.currentStory.layers.furniture.items; }
  set furnitureItems(v) { this.currentStory.layers.furniture.items = v; }

  // ── Coordinates ─────────────────────────────
  screenToWorld(sx, sy) {
    return { x: (sx - this.panX) / this.zoom, y: (sy - this.panY) / this.zoom };
  }

  _centerView() {
    if (this.axisOrigin === 'bottom-left') {
      const tw = this.terrainWidth * this.zoom;
      const th = this.terrainHeight * this.zoom;
      this.panX = (this.renderer.width - tw) / 2;
      this.panY = (this.renderer.height + th) / 2;
    } else {
      this.panX = this.renderer.width / 2;
      this.panY = this.renderer.height / 2;
    }
  }

  // ── Snapping ────────────────────────────────
  _snap(wx, wy) {
    let x = wx, y = wy;
    this.snapPoint = null;

    if (this.snapEndpoint) {
      let minDist = CONFIG.SNAP_RADIUS / this.zoom;
      for (const wall of this.walls) {
        for (const pt of [{ x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 }]) {
          const d = Geom.dist(wx, wy, pt.x, pt.y);
          if (d < minDist) { minDist = d; x = pt.x; y = pt.y; this.snapPoint = { x, y, type: 'endpoint' }; }
        }
      }
    }

    if (this.snapGrid && !this.snapPoint) {
      const s = Geom.snapToGrid(x, y, this.gridSize);
      x = s.x; y = s.y;
      this.snapPoint = { x, y, type: 'grid' };
    }

    if (this.snapAngle && this.isDrawing && this.drawStart) {
      const s = Geom.snapAngle(this.drawStart.x, this.drawStart.y, x, y, this.snapAngleDeg);
      x = s.x; y = s.y;
      if (this.snapGrid) { const g = Geom.snapToGrid(x, y, this.gridSize); x = g.x; y = g.y; }
    }

    return { x, y };
  }

  // ── State Serialization ─────────────────────
  _getState() {
    return {
      activeStoryIndex: this.activeStoryIndex,
      activeTool: this.activeTool,
      projectName: this.projectName,
      unitPrices: this._cloneUnitPrices(),
      stories: this.stories.map(s => ({
        name: s.name,
        activeLayer: s.activeLayer,
        storyHeight: s.storyHeight,
        slabThickness: s.slabThickness,
        layers: {
          structure: {
            visible: s.layers.structure.visible,
            walls: s.layers.structure.walls.map(w => w.serialize()),
            doors: s.layers.structure.doors.map(d => d.serialize(s.layers.structure.walls.indexOf(d.wall))),
            windows: s.layers.structure.windows.map(win => win.serialize(s.layers.structure.walls.indexOf(win.wall))),
            floors: s.layers.structure.floors.map(f => f.serialize()),
            stairs: s.layers.structure.stairs.map(st => st.serialize()),
            labels: (s.layers.structure.labels || []).map(lb => lb.serialize()),
          },
          furniture: {
            visible: s.layers.furniture.visible,
            items: s.layers.furniture.items.map(f => f.serialize()),
          },
          electrical: {
            visible: s.layers.electrical.visible,
            panels: (s.layers.electrical.panels || []).map(p => p.serialize()),
            circuits: (s.layers.electrical.circuits || []).map(c => c.serialize()),
            wires: s.layers.electrical.wires.map(w => w.serialize()),
            symbols: s.layers.electrical.symbols.map(sym => sym.serialize()),
          },
          plumbing: {
            visible: s.layers.plumbing.visible,
            pipes: s.layers.plumbing.pipes.map(p => p.serialize()),
            symbols: s.layers.plumbing.symbols.map(sym => sym.serialize()),
          },
        },
      })),
    };
  }

  _cloneUnitPrices() {
    return { ...(this.costsView.unitPrices || {}) };
  }

  _setUnitPrices(prices) {
    if (prices && typeof prices === 'object' && !Array.isArray(prices)) {
      this.costsView.unitPrices = { ...prices };
    } else {
      this.costsView.unitPrices = {};
    }
  }

  _setState(state) {
    const storiesData = Array.isArray(state?.stories) ? state.stories : [];
    const parsedStories = storiesData.map((s) => {
      // Migration: old format without layers
      if (!s.layers) return this._migrateOldStory(s);

      const struct = s.layers.structure || {};
      const walls = (Array.isArray(struct.walls) ? struct.walls : []).map(w => Wall.fromData(w));
      const doors = (struct.doors || []).map(d => {
        if (d.wallIndex < 0 || d.wallIndex >= walls.length) return null;
        return Door.fromData(d, walls[d.wallIndex]);
      }).filter(Boolean);
      const windows = (struct.windows || []).map(w => {
        if (w.wallIndex < 0 || w.wallIndex >= walls.length) return null;
        return Window.fromData(w, walls[w.wallIndex]);
      }).filter(Boolean);
      const floors = (Array.isArray(struct.floors) ? struct.floors : []).map(f => Floor.fromData(f));
      const stairs = (Array.isArray(struct.stairs) ? struct.stairs : []).map(st => Stair.fromData(st));
      const labels = (Array.isArray(struct.labels) ? struct.labels : []).map(lb => Label.fromData(lb));

      const elec = s.layers.electrical || {};
      const panels = (Array.isArray(elec.panels) ? elec.panels : []).map(p => ElectricalPanel.fromData(p));
      const circuits = (Array.isArray(elec.circuits) ? elec.circuits : []).map(c => ElectricalCircuit.fromData(c));
      const wires = (Array.isArray(elec.wires) ? elec.wires : []).map(w => Wire.fromData(w));
      const esymbols = (Array.isArray(elec.symbols) ? elec.symbols : []).map(sym => ElectricalSymbol.fromData(sym));

      const plumb = s.layers.plumbing || {};
      const pipes = (Array.isArray(plumb.pipes) ? plumb.pipes : []).map(p => Pipe.fromData(p));
      const psymbols = (Array.isArray(plumb.symbols) ? plumb.symbols : []).map(sym => PlumbingSymbol.fromData(sym));

      const furn = s.layers.furniture || {};
      const furnitureItems = (Array.isArray(furn.items) ? furn.items : []).map(f => Furniture.fromData(f));

      return {
        name: s.name,
        activeLayer: s.activeLayer || 'structure',
        storyHeight: s.storyHeight || CONFIG.DEFAULT_STORY_HEIGHT,
        slabThickness: s.slabThickness || CONFIG.DEFAULT_SLAB_THICKNESS,
        layers: {
          structure:  { visible: struct.visible !== false, walls, doors, windows, floors, stairs, labels },
          furniture:  { visible: furn.visible !== false, items: furnitureItems },
          electrical: { visible: elec.visible !== false, panels, circuits, wires, symbols: esymbols },
          plumbing:   { visible: plumb.visible !== false, pipes, symbols: psymbols },
        },
      };
    });

    if (!parsedStories.length) {
      parsedStories.push(createLayeredStory(storyName(0)));
    }

    this.activeStoryIndex = Number.isInteger(state?.activeStoryIndex) && state.activeStoryIndex >= 0
      ? Math.min(parsedStories.length - 1, state.activeStoryIndex)
      : 0;
    this.activeTool = state.activeTool || this.activeTool || 'wall';
    this.projectName = state.projectName || this.projectName || 'Untitled Project';
    this._setUnitPrices(state.unitPrices);
    this.stories = parsedStories;
    this._clearSelection();
    this._syncStoryTabs();
    this._syncLayerTabs();
    this._syncToolPalette();
    this._ensureValidTool();
    this._syncActiveToolButton();
    this._refreshCircuitSelects();
    if (this.activeTab === 'costs') {
      this.costsView.render(this.stories);
    }
  }

  _getStoryElevation(index) {
    let elevation = 0;
    for (let i = 0; i < index; i++) {
      elevation += this.stories[i].storyHeight || CONFIG.DEFAULT_STORY_HEIGHT;
    }
    return elevation;
  }

  _migrateOldStory(s) {
    const walls = (s.walls || []).map(w => Wall.fromData(w));
    const doors = (s.doors || []).map(d => {
      if (d.wallIndex < 0 || d.wallIndex >= walls.length) return null;
      return Door.fromData(d, walls[d.wallIndex]);
    }).filter(Boolean);
    const windows = (s.windows || []).map(w => {
      if (w.wallIndex < 0 || w.wallIndex >= walls.length) return null;
      return Window.fromData(w, walls[w.wallIndex]);
    }).filter(Boolean);
    const floors = (s.floors || []).map(f => Floor.fromData(f));
    const stairs = (s.stairs || []).map(st => Stair.fromData(st));
    const labels = (s.labels || []).map(lb => Label.fromData(lb));

    return {
      name: s.name,
      activeLayer: 'structure',
      storyHeight: CONFIG.DEFAULT_STORY_HEIGHT,
      slabThickness: CONFIG.DEFAULT_SLAB_THICKNESS,
      layers: {
        structure:  { visible: true, walls, doors, windows, floors, stairs, labels },
        furniture:  { visible: true, items: [] },
        electrical: { visible: true, panels: [], circuits: [], wires: [], symbols: [] },
        plumbing:   { visible: true, pipes: [], symbols: [] },
      },
    };
  }

  _pushHistory() {
    this.history.push(this._getState());
    this._syncUndoRedo();
  }

  _clearSelection() {
    this.selectedWall = null;
    this.selectedFloor = null;
    this.selectedDoor = null;
    this.selectedWindow = null;
    this.selectedStair = null;
    this.selectedLabel = null;
    this.selectedWire = null;
    this.selectedPanel = null;
    this.selectedElectricalSymbol = null;
    this.selectedPipe = null;
    this.selectedPlumbingSymbol = null;
    this.selectedFurniture = null;
    this._labelEditActive = false;
  }

  // ── Layer Management ────────────────────────
  _switchLayer(layerName) {
    if (!CONFIG.LAYERS.includes(layerName)) return;
    if (this.activeLayer === layerName) return;
    this.activeLayer = layerName;
    this.isDrawing = false;
    this.drawStart = null;
    this.polylinePoints = [];
    this._clearSelection();
    this._syncLayerTabs();
    this._syncToolPalette();
    this._refreshCircuitSelects();
    // Set default tool for layer
    const tools = CONFIG.LAYER_TOOLS[layerName];
    if (tools.length > 0) {
      this._setTool(tools[0]);
    }
    this._render();
  }

  _toggleLayerVisibility(layerName) {
    const layer = this.currentStory.layers[layerName];
    if (layer) {
      layer.visible = !layer.visible;
      const anyVisible = CONFIG.LAYERS.some(ln => this.currentStory.layers[ln]?.visible);
      if (!anyVisible) {
        layer.visible = true;
        this._status('Keep at least one layer visible');
      } else {
        if (!layer.visible && this.activeLayer === layerName) {
          const fallback = CONFIG.LAYERS.find((ln) => ln !== layerName && this.currentStory.layers[ln]?.visible);
          if (fallback) {
            this._switchLayer(fallback);
          }
        }
      }
      this._syncLayerTabs();
      this._render();
    }
  }

  _syncLayerTabs() {
    const container = this.$('layer-tabs');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < CONFIG.LAYERS.length; i++) {
      const layerName = CONFIG.LAYERS[i];
      const color = CONFIG.LAYER_COLORS[layerName];
      const meta = CONFIG.LAYER_META && CONFIG.LAYER_META[layerName] ? CONFIG.LAYER_META[layerName] : {};
      const label = meta.label || CONFIG.LAYER_LABELS[layerName];
      const shortLabel = meta.shortLabel || (CONFIG.LAYER_SHORT_LABELS && CONFIG.LAYER_SHORT_LABELS[layerName]) || label.slice(0, 1).toUpperCase();
      const icon = meta.icon || '';
      const isActive = this.activeLayer === layerName;
      const isVisible = this.currentStory.layers[layerName].visible;
      const keyNum = i + 1;

      const tab = document.createElement('button');
      tab.className = 'layer-tab' + (isActive ? ' active' : '');
      if (isActive) tab.style.background = color;
      tab.title = `${label} layer`;
      if (!isVisible) {
        tab.title = `${label} layer (hidden)`;
      }

      tab.innerHTML =
        `${icon ? `<span class="layer-icon">${icon}</span>` : ''}` +
        `<span class="layer-dot" style="background:${color}"></span>` +
        `<span class="layer-label layer-label-long">${label}</span>` +
        `<span class="layer-label layer-label-short">${shortLabel}</span>` +
        `<span class="layer-vis${isVisible ? '' : ' hidden'}" data-layer="${layerName}" title="Toggle visibility (${keyNum})">${isVisible ? '\u25C9' : '\u25CB'}</span>`;

      tab.addEventListener('click', (e) => {
        if (e.target.classList.contains('layer-vis')) {
          e.stopPropagation();
          this._toggleLayerVisibility(layerName);
          return;
        }
        this._switchLayer(layerName);
      });

      container.appendChild(tab);
    }
  }

  _syncToolPalette() {
    const layer = this.activeLayer;
    for (const ln of CONFIG.LAYERS) {
      const el = this.$(`tools-${ln}`);
      if (el) el.style.display = ln === layer ? '' : 'none';
    }
  }

  // ── Stories ─────────────────────────────────
  _addStory() {
    this._pushHistory();
    const idx = this.stories.length;
    this.stories.push(createLayeredStory(storyName(idx)));
    this._switchStory(idx);
  }

  _removeStory() {
    if (this.stories.length <= 1) return;
    this._pushHistory();
    this.stories.splice(this.activeStoryIndex, 1);
    this.stories.forEach((s, i) => { s.name = storyName(i); });
    if (this.activeStoryIndex >= this.stories.length) this.activeStoryIndex = this.stories.length - 1;
    this._clearSelection();
    this._syncStoryTabs();
    this._syncLayerTabs();
    this._updateGhost();
    this._render();
  }

  _switchStory(idx) {
    if (idx < 0 || idx >= this.stories.length || idx === this.activeStoryIndex) return;
    this.activeStoryIndex = idx;
    this._clearSelection();
    this.isDrawing = false;
    this.drawStart = null;
    this.polylinePoints = [];
    this._syncStoryTabs();
    this._syncLayerTabs();
    this._syncToolPalette();
    this._refreshCircuitSelects();
    this._syncSelection();
    this._updateGhost();
    this._render();
  }

  _updateGhost() {
    this.ghostWalls = this.activeStoryIndex > 0
      ? this.stories[this.activeStoryIndex - 1].layers.structure.walls
      : [];
  }

  _syncStoryTabs() {
    const container = this.$('story-tabs');
    if (!container) return;
    container.innerHTML = '';
    this.stories.forEach((s, i) => {
      const tab = document.createElement('button');
      tab.className = 'story-tab' + (i === this.activeStoryIndex ? ' active' : '');
      tab.textContent = s.name;
      tab.addEventListener('click', () => this._switchStory(i));
      container.appendChild(tab);
    });
    const removeBtn = this.$('btn-remove-story');
    if (removeBtn) removeBtn.disabled = this.stories.length <= 1;
  }

  // ── Events ──────────────────────────────────
  _bindEvents() {
    if (this._supportsPointerEvents) {
      this.canvas.addEventListener('pointerdown', this._onPointerDownBound, { passive: false });
      this.canvas.addEventListener('pointermove', this._onPointerMoveBound, { passive: false });
      this.canvas.addEventListener('pointerup', this._onPointerUpBound, { passive: false });
      this.canvas.addEventListener('pointercancel', this._onPointerCancelBound);
      this.canvas.addEventListener('pointerleave', this._onPointerCancelBound);
      this.canvas.addEventListener('pointerout', this._onPointerCancelBound);
      window.addEventListener('pointermove', this._onPointerMoveBound, { passive: false });
      window.addEventListener('pointerup', this._onPointerUpBound, { passive: false });
      window.addEventListener('pointercancel', this._onPointerCancelBound);
    } else {
      this.canvas.addEventListener('mousedown', this._onMouseDownBound);
      this.canvas.addEventListener('mousemove', this._onMouseMoveBound);
      this.canvas.addEventListener('mouseup', this._onMouseUpBound);
      window.addEventListener('mousemove', this._onMouseMoveBound);
      window.addEventListener('mouseup', this._onMouseUpBound);
    }
    this.canvas.addEventListener('wheel', this._onWheelBound, { passive: false });
    this.canvas.addEventListener('contextmenu', this._onContextMenuBound);

    this.hostElement.addEventListener('keydown', this._onKeyDownBound);
    this.hostElement.addEventListener('keyup', this._onKeyUpBound);

    this.canvas.addEventListener('pointerdown', this._onCanvasFocusBound, true);
    this.canvas.addEventListener('mousedown', this._onCanvasFocusBound, true);
  }

  _getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      sx: e.clientX - rect.left,
      sy: e.clientY - rect.top,
      x: e.clientX,
      y: e.clientY,
    };
  }

  _setZoomAround(sx, sy, nextZoom) {
    const clamped = Math.max(CONFIG.MIN_ZOOM, Math.min(CONFIG.MAX_ZOOM, nextZoom));
    const world = this.screenToWorld(sx, sy);
    this.zoom = clamped;
    this.panX = sx - world.x * clamped;
    this.panY = sy - world.y * clamped;
    this.$('zoom-display').textContent = Math.round(this.zoom * 100) + '%';
  }

  _startToolAction(e) {
    if (this.is3DMode) return;

    const { sx, sy } = this._getCanvasCoords(e);
    const world = this.screenToWorld(sx, sy);
    const snapped = this._snap(world.x, world.y);

    switch (this.activeTool) {
      case 'wall':
        if (!this.isDrawing) {
          this.isDrawing = true;
          this.drawStart = { x: snapped.x, y: snapped.y };
          this._status('Click to define the wall endpoint');
        } else {
          this._finishWall(snapped.x, snapped.y);
        }
        break;
      case 'select':
        if (this.activeLayer === 'structure') {
          if (this._tryStartDrag(world.x, world.y, snapped)) break;
        } else if (this.activeLayer === 'furniture') {
          if (this._tryStartFurnitureDrag(world.x, world.y)) break;
        }
        this._selectAt(world.x, world.y);
        break;
      case 'eraser':
        this._eraseAt(world.x, world.y);
        break;
      case 'floor':
        if (this.floorMode === 'draw') {
          this._addFloorPoint(snapped.x, snapped.y);
        } else {
          this._addFloorAt(world.x, world.y);
        }
        break;
      case 'door':
        this._addDoorAt(world.x, world.y);
        break;
      case 'window':
        this._addWindowAt(world.x, world.y);
        break;
      case 'stair':
        this._addStairAt(snapped.x, snapped.y);
        break;
      case 'label':
        this._addLabelAt(snapped.x, snapped.y);
        break;
      case 'wire':
        this._addPolylinePoint(snapped.x, snapped.y);
        break;
      case 'panel':
        this._addPanelAt(snapped.x, snapped.y);
        break;
      case 'electrical_symbol':
        this._addElectricalSymbolAt(snapped.x, snapped.y);
        break;
      case 'pipe':
        this._addPolylinePoint(snapped.x, snapped.y);
        break;
      case 'plumbing_symbol':
        this._addPlumbingSymbolAt(snapped.x, snapped.y);
        break;
      case 'furniture_item':
        this._addFurnitureAt(snapped.x, snapped.y);
        break;
    }
    this._render();
  }

  _startPanning(e) {
    const { x, y } = { x: e.clientX, y: e.clientY };
    this.isPanning = true;
    this.panStart = { x, y, panX: this.panX, panY: this.panY };
    this.canvas.style.cursor = 'grabbing';
  }

  _onMouseDown(e) {
    if (this.is3DMode) return;
    if (e.button === 1 || e.button === 2) {
      this._startPanning(e);
      return;
    }
    this._startToolAction(e);
  }

  _onPointerDown(e) {
    if (this.is3DMode) return;
    if (e.button === 2) return;
    e.preventDefault();

    this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!this._primaryPointerId) this._primaryPointerId = e.pointerId;

    if (this._pointers.size >= 2) {
      const ids = [...this._pointers.keys()];
      const p1 = this._pointers.get(ids[0]);
      const p2 = this._pointers.get(ids[1]);
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      this._pinchState = {
        ids: [ids[0], ids[1]],
        startDist: Math.max(1, Math.hypot(dx, dy)),
        startZoom: this.zoom,
      };
      this.isPanning = false;
      this.isDragging = false;
      this._dragFurniture = null;
      this.dragWall = null;
      this._dragFurnitureOffset = null;
      this._dragOffset = null;
      return;
    }

    if (e.pointerType === 'mouse' && !e.isPrimary) return;
    if (e.button === 1 || e.button === 2 || e.button === 5) {
      this._startPanning(e);
      return;
    }
    this._startToolAction(e);
  }

  _onMouseMove(e) {
    if (this.is3DMode) return;
    const { sx, sy } = this._getCanvasCoords(e);
    if (this.isPanning) {
      this.panX = this.panStart.panX + (e.clientX - this.panStart.x);
      this.panY = this.panStart.panY + (e.clientY - this.panStart.y);
      this._render();
      return;
    }

    const world = this.screenToWorld(sx, sy);
    const snapped = this._snap(world.x, world.y);
    this.mouseWorld = snapped;

    this.$('status-coords').textContent = `X: ${Math.round(snapped.x)} cm  Y: ${Math.round(snapped.y)} cm`;

    if (this.isDragging && this.dragWall) {
      this._doDrag(snapped.x, snapped.y);
      this._render();
      return;
    }

    if (this.isDragging && this._dragFurniture) {
      this._dragFurniture.x = snapped.x - this._dragFurnitureOffset.dx;
      this._dragFurniture.y = snapped.y - this._dragFurnitureOffset.dy;
      this._syncSelection();
      this._render();
      return;
    }

    if (this.activeTool === 'select' || this.activeTool === 'eraser' || this.activeTool === 'door' || this.activeTool === 'window') {
      this.hoveredWall = null;
      for (const wall of this.walls) {
        if (wall.hitTest(world.x, world.y)) { this.hoveredWall = wall; break; }
      }
      if (this.activeTool === 'select' && this.selectedWall) {
        const threshold = CONFIG.SNAP_RADIUS / this.zoom;
        const w = this.selectedWall;
        if (Geom.dist(world.x, world.y, w.x1, w.y1) < threshold ||
            Geom.dist(world.x, world.y, w.x2, w.y2) < threshold) {
          this.canvas.style.cursor = 'move';
        } else if (this.hoveredWall === w) {
          this.canvas.style.cursor = 'grab';
        } else {
          this.canvas.style.cursor = this.hoveredWall ? 'pointer' : 'default';
        }
      } else {
        this.canvas.style.cursor = this.hoveredWall ? 'pointer' : (this.activeTool === 'select' ? 'default' : 'crosshair');
      }
    }

    this._render();
  }

  _onPointerMove(e) {
    if (this.is3DMode) return;
    e.preventDefault();
    if (!this._pointers.has(e.pointerId)) return;

    const rect = this.canvas.getBoundingClientRect();
    this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this._pinchState && this._pinchState.ids.includes(e.pointerId)) {
      const [id1, id2] = this._pinchState.ids;
      const p1 = this._pointers.get(id1);
      const p2 = this._pointers.get(id2);
      if (!p1 || !p2) return;

      const cx = (p1.x + p2.x) / 2 - rect.left;
      const cy = (p1.y + p2.y) / 2 - rect.top;
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const nextZoom = this._pinchState.startZoom * (dist / this._pinchState.startDist);
      this._setZoomAround(cx, cy, nextZoom);
      this._render();
      return;
    }

    if (!this._pointers.has(e.pointerId)) return;
    if (!this._primaryPointerId || e.pointerId !== this._primaryPointerId) return;

    const { sx, sy } = { sx: e.clientX - rect.left, sy: e.clientY - rect.top };
    const world = this.screenToWorld(sx, sy);
    const snapped = this._snap(world.x, world.y);
    if (this.isPanning) {
      this.panX = this.panStart.panX + (e.clientX - this.panStart.x);
      this.panY = this.panStart.panY + (e.clientY - this.panStart.y);
      this._render();
      return;
    }
    this.mouseWorld = snapped;
    this.$('status-coords').textContent = `X: ${Math.round(snapped.x)} cm  Y: ${Math.round(snapped.y)} cm`;

    if (this.isDragging && this.dragWall) {
      this._doDrag(snapped.x, snapped.y);
      this._render();
      return;
    }

    if (this.isDragging && this._dragFurniture) {
      this._dragFurniture.x = snapped.x - this._dragFurnitureOffset.dx;
      this._dragFurniture.y = snapped.y - this._dragFurnitureOffset.dy;
      this._syncSelection();
      this._render();
      return;
    }

    if (this.activeTool === 'select' || this.activeTool === 'eraser' || this.activeTool === 'door' || this.activeTool === 'window') {
      this.hoveredWall = null;
      for (const wall of this.walls) {
        if (wall.hitTest(world.x, world.y)) { this.hoveredWall = wall; break; }
      }
      if (this.activeTool === 'select' && this.selectedWall) {
        const threshold = CONFIG.SNAP_RADIUS / this.zoom;
        const w = this.selectedWall;
        if (Geom.dist(world.x, world.y, w.x1, w.y1) < threshold ||
            Geom.dist(world.x, world.y, w.x2, w.y2) < threshold) {
          this.canvas.style.cursor = 'move';
        } else if (this.hoveredWall === w) {
          this.canvas.style.cursor = 'grab';
        } else {
          this.canvas.style.cursor = this.hoveredWall ? 'pointer' : 'default';
        }
      } else {
        this.canvas.style.cursor = this.hoveredWall ? 'pointer' : (this.activeTool === 'select' ? 'default' : 'crosshair');
      }
    }

    this._render();
  }

  _onMouseUp() {
    if (this.is3DMode) return;
    if (this.isPanning) {
      this.isPanning = false;
      this.canvas.style.cursor = 'crosshair';
    }
    if (this.isDragging) this._finishDrag();
  }

  _onPointerUp(e) {
    if (this.is3DMode) return;
    e.preventDefault();
    this._pointers.delete(e.pointerId);
    if (this._pinchState && this._pinchState.ids.includes(e.pointerId)) {
      this._pinchState = null;
    }

    if (this._primaryPointerId === e.pointerId) {
      const remaining = [...this._pointers.keys()];
      this._primaryPointerId = remaining[0] || null;
    }

    if (this._pointers.size === 0) {
      if (this.isPanning) {
        this.isPanning = false;
        this.canvas.style.cursor = 'crosshair';
      }
      if (this.isDragging) this._finishDrag();
    }
  }

  _onPointerCancel(e) {
    this._onPointerUp(e);
  }

  _onWheel(e) {
    if (this.is3DMode) return;
    e.preventDefault();
    const { sx, sy } = this._getCanvasCoords(e);
    const delta = e.deltaY > 0 ? -CONFIG.ZOOM_STEP : CONFIG.ZOOM_STEP;
    const nextZoom = this.zoom + delta * this.zoom;
    this._setZoomAround(sx, sy, nextZoom);
    this._render();
  }

  _onKeyDown(e) {
    const active = this.root.activeElement;
    const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');

    // Undo/redo — works in any tab
    if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); this._undo(); return; }
    if (e.ctrlKey && e.shiftKey && e.key === 'Z') { e.preventDefault(); this._redo(); return; }

    // 3D toggle — works always
    if (e.key === '0' && !e.ctrlKey && !e.altKey && !e.metaKey && !isInput) {
      if (this.activeTab === 'creative') this._toggle3D();
      return;
    }

    // Skip 2D shortcuts when in 3D mode
    if (this.is3DMode) return;

    if (e.code === 'Space' && !e.repeat) this.canvas.style.cursor = 'grab';

    if (e.key === 'Escape') {
      if (this.polylinePoints.length > 0) {
        this._finishPolyline();
      } else if (this.isDrawing) {
        this.isDrawing = false;
        this.drawStart = null;
        this._status('Cancelled');
      }
      this._clearSelection();
      this._syncSelection();
      this._render();
    }

    if (e.key === 'Delete' || e.key === 'Backspace') this._deleteSelected();

    if (!e.ctrlKey && !e.altKey && !e.metaKey && !isInput) {
      // Layer switching with number keys
      if (e.key === '1') this._switchLayer('structure');
      if (e.key === '2') this._switchLayer('furniture');
      if (e.key === '3') this._switchLayer('electrical');
      if (e.key === '4') this._switchLayer('plumbing');

      // Costs tab
      if (e.key === 'b') this._switchTab('costs');

      // Layer-specific tool shortcuts
      if (this.activeLayer === 'structure') {
        if (e.key === 'w') this._setTool('wall');
        if (e.key === 'v') this._setTool('select');
        if (e.key === 'f') this._setTool('floor');
        if (e.key === 'e') this._setTool('eraser');
        if (e.key === 'd') this._setTool('door');
        if (e.key === 'n') this._setTool('window');
        if (e.key === 's') this._setTool('stair');
        if (e.key === 'l') this._setTool('label');
      } else if (this.activeLayer === 'electrical') {
        if (e.key === 'q') this._setTool('panel');
        if (e.key === 'w') this._setTool('wire');
        if (e.key === 's') this._setTool('electrical_symbol');
        if (e.key === 'v') this._setTool('select');
        if (e.key === 'e') this._setTool('eraser');
      } else if (this.activeLayer === 'plumbing') {
        if (e.key === 'p') this._setTool('pipe');
        if (e.key === 's') this._setTool('plumbing_symbol');
        if (e.key === 'v') this._setTool('select');
        if (e.key === 'e') this._setTool('eraser');
      } else if (this.activeLayer === 'furniture') {
        if (e.key === 'f') this._setTool('furniture_item');
        if (e.key === 'v') this._setTool('select');
        if (e.key === 'e') this._setTool('eraser');
      }

      if (e.key === 'PageUp') { e.preventDefault(); this._switchStory(this.activeStoryIndex + 1); }
      if (e.key === 'PageDown') { e.preventDefault(); this._switchStory(this.activeStoryIndex - 1); }
    }
  }

  _onKeyUp(e) {
    if (e.code === 'Space') this.canvas.style.cursor = 'crosshair';
  }

  // ── Wall Operations ─────────────────────────
  _finishWall(x2, y2) {
    const { x: x1, y: y1 } = this.drawStart;
    const length = Geom.dist(x1, y1, x2, y2);
    if (length < CONFIG.MIN_WALL_LENGTH) {
      this._status('Wall too short');
      this.isDrawing = false;
      this.drawStart = null;
      return;
    }
    this._pushHistory();
    this.walls.push(new Wall(x1, y1, x2, y2, this.wallThickness, this.wallMaterial));
    this.drawStart = { x: x2, y: y2 };
    this._status(`Wall: ${Geom.formatLength(length)} — Continue or ESC`);
  }

  // ── Door Operations ─────────────────────────
  _addDoorAt(wx, wy) {
    let targetWall = null;
    for (let i = this.walls.length - 1; i >= 0; i--) {
      if (this.walls[i].hitTest(wx, wy)) { targetWall = this.walls[i]; break; }
    }
    if (!targetWall) { this._status('Click on a wall to place the door'); return; }

    const wallLen = targetWall.length;
    if (wallLen < this.doorWidth) { this._status('Wall too short for this door'); return; }

    const dx = targetWall.x2 - targetWall.x1;
    const dy = targetWall.y2 - targetWall.y1;
    const lenSq = dx * dx + dy * dy;
    let t = ((wx - targetWall.x1) * dx + (wy - targetWall.y1) * dy) / lenSq;
    const halfRatio = (this.doorWidth / 2) / wallLen;
    t = Math.max(halfRatio, Math.min(1 - halfRatio, t));

    this._pushHistory();
    this.doors.push(new Door(targetWall, t, this.doorWidth, this.doorHinge, this.doorOpenDir, this.doorType));
    this._status('Door added');
  }

  // ── Window Operations ───────────────────────
  _addWindowAt(wx, wy) {
    let targetWall = null;
    for (let i = this.walls.length - 1; i >= 0; i--) {
      if (this.walls[i].hitTest(wx, wy)) { targetWall = this.walls[i]; break; }
    }
    if (!targetWall) { this._status('Click on a wall to place the window'); return; }

    const wallLen = targetWall.length;
    if (wallLen < this.windowWidth) { this._status('Wall too short for this window'); return; }

    const dx = targetWall.x2 - targetWall.x1;
    const dy = targetWall.y2 - targetWall.y1;
    const lenSq = dx * dx + dy * dy;
    let t = ((wx - targetWall.x1) * dx + (wy - targetWall.y1) * dy) / lenSq;
    const halfRatio = (this.windowWidth / 2) / wallLen;
    t = Math.max(halfRatio, Math.min(1 - halfRatio, t));

    this._pushHistory();
    this.windows.push(new Window(targetWall, t, this.windowWidth, this.windowType));
    this._status('Window added');
  }

  // ── Stair Operations ────────────────────────
  _addStairAt(wx, wy) {
    this._pushHistory();
    const rad = this.stairRotation * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const hw = this.stairWidth / 2;
    const hl = this.stairLength / 2;
    const ox = hw * cos - hl * sin;
    const oy = hw * sin + hl * cos;
    this.stairs.push(new Stair(wx - ox, wy - oy, this.stairWidth, this.stairLength, this.stairRotation));
    this._status('Stair added');
  }

  // ── Label Operations ────────────────────────
  _addLabelAt(wx, wy) {
    const text = prompt('Label text:', 'Room');
    if (!text) return;
    this._pushHistory();
    this.labels.push(new Label(wx, wy, text, this.labelFontSize));
    this._status('Label added');
  }

  // ── Polyline Operations (wire/pipe) ─────────
  _addPolylinePoint(wx, wy) {
    this.polylinePoints.push({ x: wx, y: wy });
    if (this.polylinePoints.length === 1) {
      const toolName = this.activeTool === 'wire' ? 'wire' : 'pipe';
      this._status(`Click to add points, ESC to finish ${toolName}`);
    }
    this._render();
  }

  _finishPolyline() {
    if (this.activeTool === 'floor') {
      this._finishFloorPolygon();
      return;
    }

    if (this.polylinePoints.length < 2) {
      this.polylinePoints = [];
      this._status('Need at least 2 points');
      return;
    }

    this._pushHistory();
    if (this.activeTool === 'wire') {
      this.wires.push(new Wire([...this.polylinePoints], this.wireGauge));
      this._status('Wire added');
    } else if (this.activeTool === 'pipe') {
      this.pipes.push(new Pipe([...this.polylinePoints], this.pipeType, this.pipeDiameter, this.pipeFlowDir));
      this._status('Pipe added');
    }
    this.polylinePoints = [];
    this._render();
  }

  _onRightClick() {
    if (this.polylinePoints.length > 0) {
      this._finishPolyline();
    }
  }

  // ── Electrical Panel Operations ─────────────
  _newCircuitForPanel(panelId) {
    const existing = this.circuits.filter(c => c.panelId === panelId);
    const index = existing.length + 1;
    return new ElectricalCircuit(panelId, `C${index}`, CONFIG.DEFAULT_CIRCUIT_BREAKER_A, 1, 'C');
  }

  _getCircuitsForPanel(panelId) {
    return this.circuits.filter(c => c.panelId === panelId);
  }

  _computeCircuitLoadA(circuitId) {
    return this.electricalSymbols
      .filter(sym => sym.circuitId === circuitId)
      .reduce((sum, sym) => sum + (Number(sym.amperageA) || 0), 0);
  }

  _getPanelElectricalStatus(panelId) {
    const panel = this.panels.find(p => p.id === panelId);
    if (!panel) return null;
    const circuits = this._getCircuitsForPanel(panelId);
    const circuitStatuses = circuits.map(c => {
      const loadA = this._computeCircuitLoadA(c.id);
      const breakerA = Math.max(1, Number(c.breakerA) || 1);
      return {
        circuit: c,
        loadA,
        breakerA,
        overload: loadA > breakerA,
      };
    });
    const totalLoadA = circuitStatuses.reduce((sum, s) => sum + s.loadA, 0);
    const mainBreakerA = Math.max(1, Number(panel.mainBreakerA) || 1);
    const overloadedCircuits = circuitStatuses.filter(s => s.overload);
    const panelOverload = totalLoadA > mainBreakerA;
    return {
      panel,
      circuitStatuses,
      overloadedCircuits,
      totalLoadA,
      mainBreakerA,
      panelOverload,
      hasIssue: panelOverload || overloadedCircuits.length > 0,
    };
  }

  _addPanelAt(wx, wy) {
    this._pushHistory();
    const next = this.panels.length + 1;
    const name = `${this.panelNamePrefix || 'QD'}-${next}`;
    const panel = new ElectricalPanel(
      wx,
      wy,
      name,
      this.panelVoltage,
      this.panelPhases,
      this.panelMainBreakerA,
      CONFIG.DEFAULT_PANEL_BUS_CAPACITY_A,
    );
    this.panels.push(panel);
    const circuit = this._newCircuitForPanel(panel.id);
    this.circuits.push(circuit);
    this.electricalCircuitId = circuit.id;
    this._status('Electrical panel added');
    this._refreshCircuitSelects();
  }

  _addCircuitToPanel(panel) {
    if (!panel) return;
    this._pushHistory();
    const c = this._newCircuitForPanel(panel.id);
    this.circuits.push(c);
    this._refreshCircuitSelects();
    this._syncSelection();
    this._render();
  }

  // ── Electrical Symbol Operations ────────────
  _addElectricalSymbolAt(wx, wy) {
    this._pushHistory();
    const circuitId = this.circuits.some(c => c.id === this.electricalCircuitId) ? this.electricalCircuitId : '';
    this.electricalSymbols.push(new ElectricalSymbol(
      wx,
      wy,
      this.electricalSymbolType,
      this.electricalSymbolRotation,
      circuitId,
      this.electricalLoadA,
    ));
    this._status('Electrical symbol added');
  }

  // ── Plumbing Symbol Operations ──────────────
  _addPlumbingSymbolAt(wx, wy) {
    this._pushHistory();
    this.plumbingSymbols.push(new PlumbingSymbol(wx, wy, this.plumbingSymbolType, this.plumbingSymbolRotation));
    this._status('Plumbing symbol added');
  }

  // ── Furniture Operations ────────────────────
  _addFurnitureAt(wx, wy) {
    this._pushHistory();
    const item = new Furniture(wx, wy, this.furnitureType, this.furnitureRotation);
    this.furnitureItems.push(item);
    // Auto-select the placed item so user can rotate/adjust immediately
    this._clearSelection();
    this.selectedFurniture = item;
    this._setTool('select');
    this._syncSelection();
    this._status('Furniture placed — adjust rotation if needed');
  }

  // ── Select ──────────────────────────────────
  _selectAt(wx, wy) {
    this._clearSelection();

    if (this.activeLayer === 'structure') {
      for (let i = this.doors.length - 1; i >= 0; i--) {
        if (this.doors[i].hitTest(wx, wy)) { this.selectedDoor = this.doors[i]; this._syncSelection(); this._render(); return; }
      }
      for (let i = this.windows.length - 1; i >= 0; i--) {
        if (this.windows[i].hitTest(wx, wy)) { this.selectedWindow = this.windows[i]; this._syncSelection(); this._render(); return; }
      }
      for (let i = this.labels.length - 1; i >= 0; i--) {
        if (this.labels[i].hitTest(wx, wy)) { this.selectedLabel = this.labels[i]; this._syncSelection(); this._render(); return; }
      }
      for (let i = this.stairs.length - 1; i >= 0; i--) {
        if (this.stairs[i].hitTest(wx, wy)) { this.selectedStair = this.stairs[i]; this._syncSelection(); this._render(); return; }
      }
      for (let i = this.walls.length - 1; i >= 0; i--) {
        if (this.walls[i].hitTest(wx, wy)) { this.selectedWall = this.walls[i]; break; }
      }
      if (!this.selectedWall) {
        for (let i = this.floors.length - 1; i >= 0; i--) {
          if (this.floors[i].hitTest(wx, wy)) { this.selectedFloor = this.floors[i]; break; }
        }
      }
    } else if (this.activeLayer === 'electrical') {
      for (let i = this.panels.length - 1; i >= 0; i--) {
        if (this.panels[i].hitTest(wx, wy)) { this.selectedPanel = this.panels[i]; this._syncSelection(); this._render(); return; }
      }
      for (let i = this.electricalSymbols.length - 1; i >= 0; i--) {
        if (this.electricalSymbols[i].hitTest(wx, wy)) { this.selectedElectricalSymbol = this.electricalSymbols[i]; this._syncSelection(); this._render(); return; }
      }
      for (let i = this.wires.length - 1; i >= 0; i--) {
        if (this.wires[i].hitTest(wx, wy)) { this.selectedWire = this.wires[i]; break; }
      }
    } else if (this.activeLayer === 'plumbing') {
      for (let i = this.plumbingSymbols.length - 1; i >= 0; i--) {
        if (this.plumbingSymbols[i].hitTest(wx, wy)) { this.selectedPlumbingSymbol = this.plumbingSymbols[i]; this._syncSelection(); this._render(); return; }
      }
      for (let i = this.pipes.length - 1; i >= 0; i--) {
        if (this.pipes[i].hitTest(wx, wy)) { this.selectedPipe = this.pipes[i]; break; }
      }
    } else if (this.activeLayer === 'furniture') {
      for (let i = this.furnitureItems.length - 1; i >= 0; i--) {
        if (this.furnitureItems[i].hitTest(wx, wy)) {
          this.selectedFurniture = this.furnitureItems[i];
          this._syncSelection(); this._render(); return;
        }
      }
    }
    this._syncSelection();
    this._render();
  }

  // ── Erase ───────────────────────────────────
  _eraseAt(wx, wy) {
    if (this.activeLayer === 'structure') {
      for (let i = this.doors.length - 1; i >= 0; i--) {
        if (this.doors[i].hitTest(wx, wy)) {
          this._pushHistory(); this.doors.splice(i, 1); this._status('Door removed'); this._render(); return;
        }
      }
      for (let i = this.windows.length - 1; i >= 0; i--) {
        if (this.windows[i].hitTest(wx, wy)) {
          this._pushHistory(); this.windows.splice(i, 1); this._status('Window removed'); this._render(); return;
        }
      }
      for (let i = this.labels.length - 1; i >= 0; i--) {
        if (this.labels[i].hitTest(wx, wy)) {
          this._pushHistory(); this.labels.splice(i, 1); this._status('Label removed'); this._render(); return;
        }
      }
      for (let i = this.stairs.length - 1; i >= 0; i--) {
        if (this.stairs[i].hitTest(wx, wy)) {
          this._pushHistory(); this.stairs.splice(i, 1); this._status('Stair removed'); this._render(); return;
        }
      }
      for (let i = this.walls.length - 1; i >= 0; i--) {
        if (this.walls[i].hitTest(wx, wy)) {
          this._pushHistory();
          const wall = this.walls[i];
          this.doors = this.doors.filter(d => d.wall !== wall);
          this.windows = this.windows.filter(w => w.wall !== wall);
          this.walls.splice(i, 1);
          this._status('Wall removed'); this._render(); return;
        }
      }
      for (let i = this.floors.length - 1; i >= 0; i--) {
        if (this.floors[i].hitTest(wx, wy)) {
          this._pushHistory(); this.floors.splice(i, 1); this._status('Floor removed'); this._render(); return;
        }
      }
    } else if (this.activeLayer === 'electrical') {
      for (let i = this.panels.length - 1; i >= 0; i--) {
        if (this.panels[i].hitTest(wx, wy)) {
          this._pushHistory();
          const panel = this.panels[i];
          const panelCircuits = this._getCircuitsForPanel(panel.id).map(c => c.id);
          this.circuits = this.circuits.filter(c => c.panelId !== panel.id);
          this.electricalSymbols.forEach(sym => {
            if (panelCircuits.includes(sym.circuitId)) sym.circuitId = '';
          });
          this.panels.splice(i, 1);
          this._refreshCircuitSelects();
          this._status('Panel removed');
          this._render();
          return;
        }
      }
      for (let i = this.electricalSymbols.length - 1; i >= 0; i--) {
        if (this.electricalSymbols[i].hitTest(wx, wy)) {
          this._pushHistory(); this.electricalSymbols.splice(i, 1); this._status('Symbol removed'); this._render(); return;
        }
      }
      for (let i = this.wires.length - 1; i >= 0; i--) {
        if (this.wires[i].hitTest(wx, wy)) {
          this._pushHistory(); this.wires.splice(i, 1); this._status('Wire removed'); this._render(); return;
        }
      }
    } else if (this.activeLayer === 'plumbing') {
      for (let i = this.plumbingSymbols.length - 1; i >= 0; i--) {
        if (this.plumbingSymbols[i].hitTest(wx, wy)) {
          this._pushHistory(); this.plumbingSymbols.splice(i, 1); this._status('Symbol removed'); this._render(); return;
        }
      }
      for (let i = this.pipes.length - 1; i >= 0; i--) {
        if (this.pipes[i].hitTest(wx, wy)) {
          this._pushHistory(); this.pipes.splice(i, 1); this._status('Pipe removed'); this._render(); return;
        }
      }
    } else if (this.activeLayer === 'furniture') {
      for (let i = this.furnitureItems.length - 1; i >= 0; i--) {
        if (this.furnitureItems[i].hitTest(wx, wy)) {
          this._pushHistory(); this.furnitureItems.splice(i, 1); this._status('Furniture removed'); this._render(); return;
        }
      }
    }
  }

  _deleteSelected() {
    if (this.selectedDoor) {
      this._pushHistory();
      this.doors = this.doors.filter(d => d !== this.selectedDoor);
      this.selectedDoor = null;
      this._syncSelection(); this._status('Door deleted'); this._render();
    } else if (this.selectedWindow) {
      this._pushHistory();
      this.windows = this.windows.filter(w => w !== this.selectedWindow);
      this.selectedWindow = null;
      this._syncSelection(); this._status('Window deleted'); this._render();
    } else if (this.selectedLabel) {
      this._pushHistory();
      this.labels = this.labels.filter(l => l !== this.selectedLabel);
      this.selectedLabel = null;
      this._syncSelection(); this._status('Label deleted'); this._render();
    } else if (this.selectedStair) {
      this._pushHistory();
      this.stairs = this.stairs.filter(s => s !== this.selectedStair);
      this.selectedStair = null;
      this._syncSelection(); this._status('Stair deleted'); this._render();
    } else if (this.selectedWall) {
      this._pushHistory();
      this.doors = this.doors.filter(d => d.wall !== this.selectedWall);
      this.windows = this.windows.filter(w => w.wall !== this.selectedWall);
      this.walls = this.walls.filter(w => w !== this.selectedWall);
      this.selectedWall = null;
      this._syncSelection(); this._status('Wall deleted'); this._render();
    } else if (this.selectedFloor) {
      this._pushHistory();
      this.floors = this.floors.filter(f => f !== this.selectedFloor);
      this.selectedFloor = null;
      this._syncSelection(); this._status('Floor deleted'); this._render();
    } else if (this.selectedWire) {
      this._pushHistory();
      this.wires = this.wires.filter(w => w !== this.selectedWire);
      this.selectedWire = null;
      this._syncSelection(); this._status('Wire deleted'); this._render();
    } else if (this.selectedPanel) {
      this._pushHistory();
      const panelId = this.selectedPanel.id;
      const panelCircuits = this._getCircuitsForPanel(panelId).map(c => c.id);
      this.circuits = this.circuits.filter(c => c.panelId !== panelId);
      this.electricalSymbols.forEach(sym => {
        if (panelCircuits.includes(sym.circuitId)) sym.circuitId = '';
      });
      this.panels = this.panels.filter(p => p !== this.selectedPanel);
      this.selectedPanel = null;
      this._refreshCircuitSelects();
      this._syncSelection(); this._status('Panel deleted'); this._render();
    } else if (this.selectedElectricalSymbol) {
      this._pushHistory();
      this.electricalSymbols = this.electricalSymbols.filter(s => s !== this.selectedElectricalSymbol);
      this.selectedElectricalSymbol = null;
      this._syncSelection(); this._status('Symbol deleted'); this._render();
    } else if (this.selectedPipe) {
      this._pushHistory();
      this.pipes = this.pipes.filter(p => p !== this.selectedPipe);
      this.selectedPipe = null;
      this._syncSelection(); this._status('Pipe deleted'); this._render();
    } else if (this.selectedPlumbingSymbol) {
      this._pushHistory();
      this.plumbingSymbols = this.plumbingSymbols.filter(s => s !== this.selectedPlumbingSymbol);
      this.selectedPlumbingSymbol = null;
      this._syncSelection(); this._status('Symbol deleted'); this._render();
    } else if (this.selectedFurniture) {
      this._pushHistory();
      const idx = this.furnitureItems.indexOf(this.selectedFurniture);
      if (idx !== -1) this.furnitureItems.splice(idx, 1);
      this.selectedFurniture = null;
      this._syncSelection(); this._status('Furniture deleted'); this._render();
    }
  }

  // ── Dragging (Select Tool) ──────────────────
  _tryStartDrag(wx, wy, snapped) {
    if (!this.selectedWall) return false;
    const wall = this.selectedWall;
    const threshold = CONFIG.SNAP_RADIUS / this.zoom;

    if (Geom.dist(wx, wy, wall.x1, wall.y1) < threshold) {
      this.isDragging = true;
      this.dragType = 'endpoint1';
      this.dragWall = wall;
      this.dragStartState = { x1: wall.x1, y1: wall.y1, x2: wall.x2, y2: wall.y2 };
      this.canvas.style.cursor = 'move';
      this._pushHistory();
      return true;
    }
    if (Geom.dist(wx, wy, wall.x2, wall.y2) < threshold) {
      this.isDragging = true;
      this.dragType = 'endpoint2';
      this.dragWall = wall;
      this.dragStartState = { x1: wall.x1, y1: wall.y1, x2: wall.x2, y2: wall.y2 };
      this.canvas.style.cursor = 'move';
      this._pushHistory();
      return true;
    }
    if (wall.hitTest(wx, wy)) {
      this.isDragging = true;
      this.dragType = 'body';
      this.dragWall = wall;
      this.dragOffset = { dx: wx - wall.x1, dy: wy - wall.y1 };
      this.dragStartState = { x1: wall.x1, y1: wall.y1, x2: wall.x2, y2: wall.y2 };
      this.canvas.style.cursor = 'move';
      this._pushHistory();
      return true;
    }
    return false;
  }

  _doDrag(sx, sy) {
    const wall = this.dragWall;
    if (!wall) return;

    if (this.dragType === 'endpoint1') {
      wall.x1 = sx; wall.y1 = sy;
    } else if (this.dragType === 'endpoint2') {
      wall.x2 = sx; wall.y2 = sy;
    } else if (this.dragType === 'body') {
      const dx = sx - this.dragOffset.dx - wall.x1;
      const dy = sy - this.dragOffset.dy - wall.y1;
      wall.x1 += dx; wall.y1 += dy;
      wall.x2 += dx; wall.y2 += dy;
    }
    this._syncSelection();
  }

  _finishDrag() {
    if (this.isDragging && this.dragWall) {
      const wall = this.dragWall;
      if (wall.length < CONFIG.MIN_WALL_LENGTH) {
        const s = this.dragStartState;
        wall.x1 = s.x1; wall.y1 = s.y1;
        wall.x2 = s.x2; wall.y2 = s.y2;
        this._status('Wall too short — reverted');
      } else {
        this._status('Wall moved');
      }
      this._syncSelection();
      this._render();
    }
    if (this.isDragging && this._dragFurniture) {
      this._status('Furniture moved');
      this._syncSelection();
      this._render();
    }
    this.isDragging = false;
    this.dragType = null;
    this.dragWall = null;
    this.dragOffset = null;
    this.dragStartState = null;
    this._dragFurniture = null;
    this._dragFurnitureOffset = null;
    this.canvas.style.cursor = this.activeTool === 'select' ? 'default' : 'crosshair';
  }

  _tryStartFurnitureDrag(wx, wy) {
    if (!this.selectedFurniture) return false;
    if (!this.selectedFurniture.hitTest(wx, wy)) return false;
    this.isDragging = true;
    this._dragFurniture = this.selectedFurniture;
    this._dragFurnitureOffset = { dx: wx - this.selectedFurniture.x, dy: wy - this.selectedFurniture.y };
    this.canvas.style.cursor = 'move';
    this._pushHistory();
    return true;
  }

  // ── Floor Detection ─────────────────────────
  _addFloorAt(wx, wy) {
    const polygon = this._detectRoom(wx, wy);
    if (polygon && polygon.length >= 3) {
      this._pushHistory();
      this.floors.push(new Floor(polygon, this.floorMaterial));
      this._status('Floor added');
    } else {
      this._status('Closed room not detected — close the walls');
    }
    this._render();
  }

  _addFloorPoint(wx, wy) {
    if (this.polylinePoints.length >= 3) {
      const first = this.polylinePoints[0];
      if (Geom.dist(wx, wy, first.x, first.y) < 10) {
        this._finishFloorPolygon();
        return;
      }
    }
    this.polylinePoints.push({ x: wx, y: wy });
    if (this.polylinePoints.length === 1) {
      this._status('Click vertices, click first point or ESC to close');
    }
    this._render();
  }

  _finishFloorPolygon() {
    if (this.polylinePoints.length < 3) {
      this.polylinePoints = [];
      this._status('Need at least 3 points');
      return;
    }
    this._pushHistory();
    this.floors.push(new Floor([...this.polylinePoints], this.floorMaterial));
    this._status('Floor added');
    this.polylinePoints = [];
    this._render();
  }

  _detectRoom(wx, wy) {
    const eps = 5;
    const vertices = [];
    const addVertex = (x, y) => {
      for (const v of vertices) { if (Geom.dist(v.x, v.y, x, y) < eps) return v; }
      const v = { x, y, edges: [] }; vertices.push(v); return v;
    };
    for (const wall of this.walls) {
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

  // ── Tab Switching ───────────────────────────
  _switchTab(tabName) {
    if (this.activeTab === tabName) return;
    this.activeTab = tabName;

    // Toggle button active states
    for (const btn of this.$$('.top-tab')) {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    }

    // Show/hide panels
    const creative = this.$('tab-creative');
    const costs = this.$('tab-costs');
    const project = this.$('tab-project');
    if (creative) creative.style.display = tabName === 'creative' ? '' : 'none';
    if (costs) costs.style.display = tabName === 'costs' ? '' : 'none';
    if (project) project.style.display = tabName === 'project' ? '' : 'none';

    if (tabName === 'costs') {
      this.costsView.render(this.stories);
    } else if (tabName === 'project') {
      this._syncProjectTab();
    } else if (tabName === 'creative') {
      this.renderer.resize();
      this._render();
      if (this.is3DMode && this.viewer3D) this.viewer3D.resize();
    }
  }

  // ── Project Tab ───────────────────────────────
  _syncProjectTab() {
    const nameInput = this.$('project-name');
    if (nameInput) nameInput.value = this.projectName;

    const tw = this.$('proj-terrain-width');
    const th = this.$('proj-terrain-height');
    if (tw) tw.value = Math.round(this.terrainWidth / 100);
    if (th) th.value = Math.round(this.terrainHeight / 100);

    const showTerrain = this.$('proj-show-terrain');
    if (showTerrain) showTerrain.checked = this.showTerrain;

    this.$$('#proj-axis-origin-group .prop-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.value === this.axisOrigin));

    this._renderProjectStories();
    this._refreshCircuitSelects();
  }

  _renderProjectStories() {
    const container = this.$('project-stories-list');
    if (!container) return;
    container.innerHTML = '';
    this.stories.forEach((s, i) => {
      const row = document.createElement('div');
      row.className = 'project-story-row';
      row.innerHTML = `
        <span class="project-story-name">${s.name}</span>
        <label>Height</label>
        <input type="number" class="proj-story-height" data-index="${i}" value="${s.storyHeight}" min="200" max="600" step="10">
        <span style="font-size:10px;color:var(--text-muted)">cm</span>
        <label>Slab</label>
        <input type="number" class="proj-slab-thickness" data-index="${i}" value="${s.slabThickness}" min="5" max="50" step="1">
        <span style="font-size:10px;color:var(--text-muted)">cm</span>
      `;
      container.appendChild(row);
    });

    // Bind change listeners
    for (const input of container.querySelectorAll('.proj-story-height')) {
      input.addEventListener('change', () => {
        const idx = parseInt(input.dataset.index);
        this.stories[idx].storyHeight = parseInt(input.value) || CONFIG.DEFAULT_STORY_HEIGHT;
      });
    }
    for (const input of container.querySelectorAll('.proj-slab-thickness')) {
      input.addEventListener('change', () => {
        const idx = parseInt(input.dataset.index);
        this.stories[idx].slabThickness = parseInt(input.value) || CONFIG.DEFAULT_SLAB_THICKNESS;
      });
    }
  }

  // ── JSON Export / Import ──────────────────────
  _exportJSON() {
    const data = {
      ...this._getState(),
      terrainWidth: this.terrainWidth,
      terrainHeight: this.terrainHeight,
      axisOrigin: this.axisOrigin,
      showTerrain: this.showTerrain,
    };
    exportJSON(data, this.projectName);
    this._status('JSON exported');
  }

  _importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        this._applySharedState(data);
        this._status('Project loaded');
      } catch (err) {
        this._status('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be loaded again
    event.target.value = '';
  }

  _applySharedState(data) {
    this._pushHistory();
    this._setState(data);
    if (data.projectName) this.projectName = data.projectName;
    this._setUnitPrices(data.unitPrices);
    if (data.terrainWidth) this.terrainWidth = data.terrainWidth;
    if (data.terrainHeight) this.terrainHeight = data.terrainHeight;
    if (data.axisOrigin) this.axisOrigin = data.axisOrigin;
    if (data.showTerrain !== undefined) this.showTerrain = data.showTerrain;
    this._centerView();
    this._render();
  }

  async _shareProject() {
    const data = {
      ...this._getState(),
      terrainWidth: this.terrainWidth,
      terrainHeight: this.terrainHeight,
      axisOrigin: this.axisOrigin,
      showTerrain: this.showTerrain,
    };

    const encrypt = this.$('share-encrypt').checked;
    const password = encrypt ? this.$('share-password').value : null;

    if (encrypt && !password) {
      this._status('Enter a password to encrypt the share link');
      return;
    }

    try {
      this._status('Generating share link...');
      const { hash, byteSize } = await ShareManager.createShareHash(data, password);
      const url = window.location.origin + window.location.pathname + hash;

      const resultDiv = this.$('share-result');
      const urlInput = this.$('share-url');
      const sizeSpan = this.$('share-size');

      urlInput.value = url;
      resultDiv.style.display = '';

      const kb = (byteSize / 1024).toFixed(1);
      let sizeText = `${kb} KB compressed`;
      if (url.length > 50000) {
        sizeText += ' — URL is very long, some browsers may not support it';
      }
      sizeSpan.textContent = sizeText;

      await navigator.clipboard.writeText(url);
      this._status('Share link copied to clipboard');
    } catch (err) {
      this._status('Failed to generate share link');
    }
  }

  async _loadFromHash() {
    const hash = window.location.hash;
    const { present, encrypted } = ShareManager.parseHashType(hash);
    if (!present) return;

    if (encrypted) {
      this._showPasswordModal(hash);
    } else {
      try {
        const { data } = await ShareManager.loadFromHash(hash, null);
        this._applySharedState(data);
        this._status('Shared project loaded');
        history.replaceState(null, '', window.location.pathname);
      } catch (err) {
        this._status('Failed to load shared project');
      }
    }
  }

  _showPasswordModal(hash) {
    const modal = this.$('share-password-modal');
    const input = this.$('share-modal-password');
    const errorDiv = this.$('share-modal-error');
    const okBtn = this.$('share-modal-ok');
    const cancelBtn = this.$('share-modal-cancel');
    const backdrop = modal.querySelector('.share-modal-backdrop');

    modal.style.display = '';
    input.value = '';
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    // Focus input after display
    requestAnimationFrame(() => input.focus());

    const cleanup = () => {
      modal.style.display = 'none';
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      backdrop.removeEventListener('click', onCancel);
      input.removeEventListener('keydown', onKeyDown);
    };

    const onOk = async () => {
      const password = input.value;
      if (!password) {
        errorDiv.textContent = 'Please enter a password';
        errorDiv.style.display = '';
        return;
      }
      try {
        okBtn.disabled = true;
        okBtn.textContent = 'Unlocking...';
        const { data } = await ShareManager.loadFromHash(hash, password);
        cleanup();
        this._applySharedState(data);
        this._status('Encrypted project loaded');
        history.replaceState(null, '', window.location.pathname);
      } catch (err) {
        okBtn.disabled = false;
        okBtn.textContent = 'Unlock';
        errorDiv.textContent = 'Wrong password or corrupted data';
        errorDiv.style.display = '';
      }
    };

    const onCancel = () => {
      cleanup();
      history.replaceState(null, '', window.location.pathname);
      this._status('Share link cancelled');
    };

    const onKeyDown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); onOk(); }
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
    };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    backdrop.addEventListener('click', onCancel);
    input.addEventListener('keydown', onKeyDown);
  }

  // ── Undo / Redo ─────────────────────────────
  _undo() {
    const s = this.history.undo(this._getState());
    if (s) { this._setState(s); this._syncSelection(); this._updateGhost(); this._status('Undone'); this._render(); }
    this._syncUndoRedo();
  }

  _redo() {
    const s = this.history.redo(this._getState());
    if (s) { this._setState(s); this._syncSelection(); this._updateGhost(); this._status('Redone'); this._render(); }
    this._syncUndoRedo();
  }

  _syncUndoRedo() {
    this.$('btn-undo').disabled = !this.history.canUndo;
    this.$('btn-redo').disabled = !this.history.canRedo;
  }

  // ── Render ──────────────────────────────────
  _render() {
    this._updateGhost();
    this.renderer.render(this);
  }

  _isMobilePointerEnvironment() {
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse), (hover: none)').matches;
  }

  _setNavModeAttribute(mode) {
    if (!this.hostElement) return;
    if (mode) {
      this.hostElement.setAttribute('data-nav-mode', mode);
    } else {
      this.hostElement.removeAttribute('data-nav-mode');
    }
  }

  _clearMobileWalkInput() {
    this._mobileNavMove.up = 0;
    this._mobileNavMove.down = 0;
    this._mobileNavMove.left = 0;
    this._mobileNavMove.right = 0;
    this._mobileLookPointerId = null;
    this._mobileLookStart = null;
    const fps = this.viewer3D?.fpsControls;
    if (fps) fps.setTouchMove(0, 0);
  }

  _applyMobileWalkVector() {
    const fps = this.viewer3D?.fpsControls;
    if (!fps) return;
    const x = (this._mobileNavMove.right || 0) - (this._mobileNavMove.left || 0);
    const z = (this._mobileNavMove.down || 0) - (this._mobileNavMove.up || 0);
    fps.setTouchMove(x, z);
  }

  _bindMobileWalkControls() {
    const moveButtons = [
      { id: 'walk-btn-up', key: 'up' },
      { id: 'walk-btn-down', key: 'down' },
      { id: 'walk-btn-left', key: 'left' },
      { id: 'walk-btn-right', key: 'right' },
    ];
    const lookPad = this.$('mobile-look-control');

    if (!lookPad) return;

    const clearMovePointer = (e) => {
      const key = this._mobileWalkMovePointers.get(e.pointerId);
      if (!key) return;
      this._mobileWalkMovePointers.delete(e.pointerId);
      this._mobileNavMove[key] = Math.max(0, (this._mobileNavMove[key] || 0) - 1);
      this._applyMobileWalkVector();
    };

    const onMoveBtnDown = (key) => (e) => {
      if (!this.is3DMode || this.hostElement.getAttribute('data-nav-mode') !== 'fps') return;
      if (!this._isMobilePointerEnvironment()) return;
      e.preventDefault();
      this._mobileWalkMovePointers.set(e.pointerId, key);
      this._mobileNavMove[key] = (this._mobileNavMove[key] || 0) + 1;
      this._applyMobileWalkVector();
      if (e.pointerId != null) {
        try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
      }
    };
    const onMoveBtnUp = (e) => {
      clearMovePointer(e);
      if (e.pointerId != null) {
        try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    };

    for (const item of moveButtons) {
      const btn = this.$(item.id);
      if (!btn) continue;
      const down = onMoveBtnDown(item.key);
      const up = onMoveBtnUp;
      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('pointerleave', up);
      btn.addEventListener('pointerout', up);
      this._mobileNavBoundHandlers.push(
        { el: btn, type: 'pointerdown', handler: down },
        { el: btn, type: 'pointerup', handler: up },
        { el: btn, type: 'pointercancel', handler: up },
        { el: btn, type: 'pointerleave', handler: up },
        { el: btn, type: 'pointerout', handler: up }
      );
    }

    const lookStart = (e) => {
      if (!this.is3DMode || this.hostElement.getAttribute('data-nav-mode') !== 'fps') return;
      if (!this._isMobilePointerEnvironment()) return;
      e.preventDefault();
      this._mobileLookPointerId = e.pointerId;
      this._mobileLookStart = { x: e.clientX, y: e.clientY };
      try { lookPad.setPointerCapture(e.pointerId); } catch (err) {}
    };
    const lookMove = (e) => {
      if (!this.viewer3D || this._mobileLookPointerId !== e.pointerId) return;
      if (e.pointerId == null || this.hostElement.getAttribute('data-nav-mode') !== 'fps') return;
      if (!this._mobileLookStart) return;
      const dx = e.clientX - this._mobileLookStart.x;
      const dy = e.clientY - this._mobileLookStart.y;
      this._mobileLookStart = { x: e.clientX, y: e.clientY };
      this.viewer3D.fpsControls?.addTouchLook(dx, dy);
    };
    const lookEnd = () => {
      if (!this._mobileLookStart) return;
      this._mobileLookPointerId = null;
      this._mobileLookStart = null;
    };

    lookPad.addEventListener('pointerdown', lookStart);
    lookPad.addEventListener('pointermove', lookMove);
    lookPad.addEventListener('pointerup', lookEnd);
    lookPad.addEventListener('pointercancel', lookEnd);
    lookPad.addEventListener('pointerleave', lookEnd);
    lookPad.addEventListener('pointerout', lookEnd);
    this._mobileNavBoundHandlers.push(
      { el: lookPad, type: 'pointerdown', handler: lookStart },
      { el: lookPad, type: 'pointermove', handler: lookMove },
      { el: lookPad, type: 'pointerup', handler: lookEnd },
      { el: lookPad, type: 'pointercancel', handler: lookEnd },
      { el: lookPad, type: 'pointerleave', handler: lookEnd },
      { el: lookPad, type: 'pointerout', handler: lookEnd }
    );
  }

  // ── UI ──────────────────────────────────────
  _bindUI() {
    for (const btn of this.$$('.tool-btn')) {
      btn.addEventListener('click', () => this._setTool(btn.dataset.tool));
    }

    // Wall thickness
    this._bindBtnGroup('#wall-thickness-group .prop-btn', btn => { this.wallThickness = parseInt(btn.dataset.value); });
    // Wall material
    this._bindBtnGroup('#wall-material-group .material-btn', btn => { this.wallMaterial = btn.dataset.material; });
    // Floor material
    this._bindBtnGroup('#floor-material-group .material-btn', btn => { this.floorMaterial = btn.dataset.material; });
    // Floor mode
    this._bindBtnGroup('#floor-mode-group .prop-btn', btn => {
      this.floorMode = btn.dataset.value;
      if (this.activeTool === 'floor') {
        this.polylinePoints = [];
        this._status(this.floorMode === 'draw' ? 'Click to place polygon vertices' : 'Click inside a closed room');
        this._render();
      }
    });
    // Door type
    this._bindBtnGroup('#door-type-group .prop-btn', btn => {
      this.doorType = btn.dataset.value;
      const hingeWrap = this.$('door-hinge-wrap');
      const openWrap = this.$('door-opendir-wrap');
      if (hingeWrap) hingeWrap.style.display = btn.dataset.value === 'single' ? '' : 'none';
      if (openWrap) openWrap.style.display = btn.dataset.value === 'sliding' ? 'none' : '';
    });
    // Door width
    this._bindBtnGroup('#door-width-group .prop-btn', btn => { this.doorWidth = parseInt(btn.dataset.value); });
    // Door hinge
    this._bindBtnGroup('#door-hinge-group .prop-btn', btn => { this.doorHinge = btn.dataset.value; });
    // Door open direction
    this._bindBtnGroup('#door-opendir-group .prop-btn', btn => { this.doorOpenDir = parseInt(btn.dataset.value); });
    // Window type
    this._bindBtnGroup('#window-type-group .prop-btn', btn => { this.windowType = btn.dataset.value; });
    // Window width
    this._bindBtnGroup('#window-width-group .prop-btn', btn => { this.windowWidth = parseInt(btn.dataset.value); });
    // Stair width
    this._bindBtnGroup('#stair-width-group .prop-btn', btn => { this.stairWidth = parseInt(btn.dataset.value); });
    // Stair length
    this._bindBtnGroup('#stair-length-group .prop-btn', btn => { this.stairLength = parseInt(btn.dataset.value); });
    // Stair rotation
    this._bindBtnGroup('#stair-rotation-group .prop-btn', btn => { this.stairRotation = parseInt(btn.dataset.value); });
    // Label font size
    this._bindBtnGroup('#label-fontsize-group .prop-btn', btn => { this.labelFontSize = parseInt(btn.dataset.value); });

    // Wire gauge
    this._bindBtnGroup('#wire-gauge-group .prop-btn', btn => { this.wireGauge = parseFloat(btn.dataset.value); });
    // Panel defaults
    const panelNamePrefixInput = this.$('panel-name-prefix');
    if (panelNamePrefixInput) {
      panelNamePrefixInput.addEventListener('input', () => {
        this.panelNamePrefix = panelNamePrefixInput.value || 'QD';
      });
    }
    this._bindBtnGroup('#panel-voltage-group .prop-btn', btn => { this.panelVoltage = parseInt(btn.dataset.value); });
    this._bindBtnGroup('#panel-phases-group .prop-btn', btn => { this.panelPhases = parseInt(btn.dataset.value); });
    this._bindBtnGroup('#panel-main-breaker-group .prop-btn', btn => { this.panelMainBreakerA = parseInt(btn.dataset.value); });
    // Electrical symbol type
    this._bindBtnGroup('#elec-symbol-type-group .prop-btn', btn => { this.electricalSymbolType = btn.dataset.value; });
    // Electrical symbol rotation
    this._bindBtnGroup('#elec-symbol-rotation-group .prop-btn', btn => { this.electricalSymbolRotation = parseInt(btn.dataset.value); });
    const elecLoadInput = this.$('elec-load-a');
    if (elecLoadInput) {
      elecLoadInput.addEventListener('change', () => {
        this.electricalLoadA = Math.max(0.1, parseFloat(elecLoadInput.value) || CONFIG.DEFAULT_SYMBOL_AMPERAGE_A);
        elecLoadInput.value = String(this.electricalLoadA);
      });
    }
    const elecCircuitSelect = this.$('elec-circuit-select');
    if (elecCircuitSelect) {
      elecCircuitSelect.addEventListener('change', () => {
        this.electricalCircuitId = elecCircuitSelect.value;
      });
    }

    // Pipe type
    this._bindBtnGroup('#pipe-type-group .prop-btn', btn => { this.pipeType = btn.dataset.value; });
    // Pipe diameter
    this._bindBtnGroup('#pipe-diameter-group .prop-btn', btn => { this.pipeDiameter = parseInt(btn.dataset.value); });
    // Pipe flow direction
    this._bindBtnGroup('#pipe-flow-group .prop-btn', btn => { this.pipeFlowDir = parseInt(btn.dataset.value); });
    // Plumbing symbol type
    this._bindBtnGroup('#plumb-symbol-type-group .prop-btn', btn => { this.plumbingSymbolType = btn.dataset.value; });
    // Plumbing symbol rotation
    this._bindBtnGroup('#plumb-symbol-rotation-group .prop-btn', btn => { this.plumbingSymbolRotation = parseInt(btn.dataset.value); });

    // Furniture type
    this._bindBtnGroup('#furniture-type-group .prop-btn', btn => { this.furnitureType = btn.dataset.value; });
    // Furniture rotation
    this._bindBtnGroup('#furniture-rotation-group .prop-btn', btn => { this.furnitureRotation = parseInt(btn.dataset.value); });

    // Selection wall thickness
    for (const btn of this.$$('#sel-thickness-group .prop-btn')) {
      btn.addEventListener('click', () => {
        if (!this.selectedWall) return;
        this._pushHistory(); this.selectedWall.thickness = parseInt(btn.dataset.value);
        this._syncSelection(); this._render();
      });
    }
    // Selection wall material
    for (const btn of this.$$('#sel-material-group .material-btn')) {
      btn.addEventListener('click', () => {
        if (!this.selectedWall) return;
        this._pushHistory(); this.selectedWall.material = btn.dataset.material;
        this._syncSelection(); this._render();
      });
    }

    // Selected door controls
    for (const btn of this.$$('#sel-door-type-group .prop-btn')) {
      btn.addEventListener('click', () => {
        if (!this.selectedDoor) return;
        this._pushHistory(); this.selectedDoor.doorType = btn.dataset.value;
        this.$$('#sel-door-type-group .prop-btn').forEach(b => b.classList.toggle('active', b.dataset.value === btn.dataset.value));
        this._syncSelection(); this._render();
      });
    }
    for (const btn of this.$$('#sel-door-width-group .prop-btn')) {
      btn.addEventListener('click', () => {
        if (!this.selectedDoor) return;
        this._pushHistory(); this.selectedDoor.width = parseInt(btn.dataset.value);
        this._syncSelection(); this._render();
      });
    }
    const flipHinge = this.$('btn-flip-hinge');
    if (flipHinge) flipHinge.addEventListener('click', () => {
      if (!this.selectedDoor) return;
      this._pushHistory();
      this.selectedDoor.hingeSide = this.selectedDoor.hingeSide === 'left' ? 'right' : 'left';
      this._syncSelection(); this._render();
    });
    const flipOpen = this.$('btn-flip-open');
    if (flipOpen) flipOpen.addEventListener('click', () => {
      if (!this.selectedDoor) return;
      this._pushHistory();
      this.selectedDoor.openDir *= -1;
      this._syncSelection(); this._render();
    });

    // Selected window controls
    for (const btn of this.$$('#sel-window-type-group .prop-btn')) {
      btn.addEventListener('click', () => {
        if (!this.selectedWindow) return;
        this._pushHistory(); this.selectedWindow.windowType = btn.dataset.value;
        this.$$('#sel-window-type-group .prop-btn').forEach(b => b.classList.toggle('active', b.dataset.value === btn.dataset.value));
        this._syncSelection(); this._render();
      });
    }
    for (const btn of this.$$('#sel-window-width-group .prop-btn')) {
      btn.addEventListener('click', () => {
        if (!this.selectedWindow) return;
        this._pushHistory(); this.selectedWindow.width = parseInt(btn.dataset.value);
        this._syncSelection(); this._render();
      });
    }

    // Selected stair controls
    for (const btn of this.$$('#sel-stair-rotation-group .prop-btn')) {
      btn.addEventListener('click', () => {
        if (!this.selectedStair) return;
        this._pushHistory(); this.selectedStair.rotation = parseInt(btn.dataset.value);
        this._syncSelection(); this._render();
      });
    }

    // Selected label controls
    const selLabelText = this.$('sel-label-text');
    if (selLabelText) {
      selLabelText.addEventListener('input', () => {
        if (!this.selectedLabel) return;
        if (!this._labelEditActive) {
          this._pushHistory();
          this._labelEditActive = true;
        }
        this.selectedLabel.text = selLabelText.value;
        this._render();
      });
      selLabelText.addEventListener('blur', () => {
        this._labelEditActive = false;
      });
      selLabelText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          selLabelText.blur();
        }
      });
    }
    for (const btn of this.$$('#sel-label-fontsize-group .prop-btn')) {
      btn.addEventListener('click', () => {
        if (!this.selectedLabel) return;
        this._pushHistory(); this.selectedLabel.fontSize = parseInt(btn.dataset.value);
        this._syncSelection(); this._render();
      });
    }

    // Selected wire gauge
    for (const btn of this.$$('#sel-wire-gauge-group .prop-btn')) {
      btn.addEventListener('click', () => {
        if (!this.selectedWire) return;
        this._pushHistory(); this.selectedWire.gauge = parseFloat(btn.dataset.value);
        this._syncSelection(); this._render();
      });
    }

    // Selected panel controls
    const selPanelName = this.$('sel-panel-name');
    if (selPanelName) {
      selPanelName.addEventListener('change', () => {
        if (!this.selectedPanel) return;
        this._pushHistory();
        this.selectedPanel.name = selPanelName.value || this.selectedPanel.name;
        this._syncSelection();
        this._render();
      });
    }
    const selPanelMainBreakerInput = this.$('sel-panel-main-breaker-input');
    if (selPanelMainBreakerInput) {
      selPanelMainBreakerInput.addEventListener('change', () => {
        if (!this.selectedPanel) return;
        this._pushHistory();
        this.selectedPanel.mainBreakerA = Math.max(1, parseInt(selPanelMainBreakerInput.value) || this.selectedPanel.mainBreakerA);
        selPanelMainBreakerInput.value = String(this.selectedPanel.mainBreakerA);
        this._syncSelection();
        this._render();
      });
    }
    const addCircuitBtn = this.$('btn-panel-add-circuit');
    if (addCircuitBtn) {
      addCircuitBtn.addEventListener('click', () => {
        if (!this.selectedPanel) return;
        this._addCircuitToPanel(this.selectedPanel);
      });
    }

    // Selected electrical symbol load/circuit
    const selElecLoadInput = this.$('sel-elec-load-a');
    if (selElecLoadInput) {
      selElecLoadInput.addEventListener('change', () => {
        if (!this.selectedElectricalSymbol) return;
        this._pushHistory();
        this.selectedElectricalSymbol.amperageA = Math.max(0.1, parseFloat(selElecLoadInput.value) || CONFIG.DEFAULT_SYMBOL_AMPERAGE_A);
        selElecLoadInput.value = String(this.selectedElectricalSymbol.amperageA);
        this._syncSelection();
        this._render();
      });
    }
    const selElecCircuitSelect = this.$('sel-elec-circuit-select');
    if (selElecCircuitSelect) {
      selElecCircuitSelect.addEventListener('change', () => {
        if (!this.selectedElectricalSymbol) return;
        this._pushHistory();
        this.selectedElectricalSymbol.circuitId = selElecCircuitSelect.value;
        this._syncSelection();
        this._render();
      });
    }

    // Selected pipe flow direction
    for (const btn of this.$$('#sel-pipe-flow-group .prop-btn')) {
      btn.addEventListener('click', () => {
        if (!this.selectedPipe) return;
        this._pushHistory(); this.selectedPipe.flowDir = parseInt(btn.dataset.value);
        this._syncSelection(); this._render();
      });
    }

    // Selected electrical symbol rotation
    for (const btn of this.$$('#sel-elec-symbol-rotation-group .prop-btn')) {
      btn.addEventListener('click', () => {
        if (!this.selectedElectricalSymbol) return;
        this._pushHistory(); this.selectedElectricalSymbol.rotation = parseInt(btn.dataset.value);
        this._syncSelection(); this._render();
      });
    }

    // Selected plumbing symbol rotation
    for (const btn of this.$$('#sel-plumb-symbol-rotation-group .prop-btn')) {
      btn.addEventListener('click', () => {
        if (!this.selectedPlumbingSymbol) return;
        this._pushHistory(); this.selectedPlumbingSymbol.rotation = parseInt(btn.dataset.value);
        this._syncSelection(); this._render();
      });
    }

    // Selected furniture rotation
    for (const btn of this.$$('#sel-furniture-rotation-group .prop-btn')) {
      btn.addEventListener('click', () => {
        if (!this.selectedFurniture) return;
        this._pushHistory(); this.selectedFurniture.rotation = parseInt(btn.dataset.value);
        this._syncSelection(); this._render();
      });
    }

    // Delete buttons
    for (const btn of this.$$('.btn-delete-selected')) {
      btn.addEventListener('click', () => this._deleteSelected());
    }

    this.$('grid-size').addEventListener('change', e => { this.gridSize = parseInt(e.target.value); this._render(); });
    this.$('snap-grid').addEventListener('change', e => { this.snapGrid = e.target.checked; });
    this.$('snap-angle').addEventListener('change', e => { this.snapAngle = e.target.checked; });
    this.$('snap-angle-deg').addEventListener('change', e => { this.snapAngleDeg = parseInt(e.target.value); });
    this.$('snap-endpoint').addEventListener('change', e => { this.snapEndpoint = e.target.checked; });

    this.$('btn-undo').addEventListener('click', () => this._undo());
    this.$('btn-redo').addEventListener('click', () => this._redo());

    // 3D
    this.$('btn-3d').addEventListener('click', () => this._toggle3D());
    this.$('btn-nav-mode').addEventListener('click', () => this._toggleNavMode());

    // Tab switching
    for (const btn of this.$$('.top-tab')) {
      btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
    }

    // Costs tab
    this.$('costs-copy').addEventListener('click', () => this.costsView.copyClipboard());
    this.$('costs-csv').addEventListener('click', () => this.costsView.downloadCSV());

    // Stories
    this.$('btn-add-story').addEventListener('click', () => this._addStory());
    this.$('btn-remove-story').addEventListener('click', () => this._removeStory());

    // Project tab — terrain
    this.$('proj-terrain-width').addEventListener('change', e => {
      this.terrainWidth = Math.max(100, parseInt(e.target.value) * 100);
      this._centerView(); this._render();
    });
    this.$('proj-terrain-height').addEventListener('change', e => {
      this.terrainHeight = Math.max(100, parseInt(e.target.value) * 100);
      this._centerView(); this._render();
    });
    this.$('proj-show-terrain').addEventListener('change', e => {
      this.showTerrain = e.target.checked; this._render();
    });

    // Project tab — axis origin
    this._bindBtnGroup('#proj-axis-origin-group .prop-btn', btn => {
      this.axisOrigin = btn.dataset.value;
      this._centerView(); this._render();
    });

    // Project tab — name
    this.$('project-name').addEventListener('change', e => {
      this.projectName = e.target.value || 'Untitled Project';
    });

    // Project tab — export/import
    this.$('proj-export-png').addEventListener('click', () => this._exportPNG());
    this.$('proj-export-json').addEventListener('click', () => this._exportJSON());
    this.$('proj-import-json').addEventListener('click', () => this.$('proj-import-file').click());
    this.$('proj-import-file').addEventListener('change', e => this._importJSON(e));

    // Project tab — share
    this.$('share-encrypt').addEventListener('change', e => {
      this.$('share-password-row').style.display = e.target.checked ? '' : 'none';
    });
    this.$('btn-share').addEventListener('click', () => this._shareProject());
    this.$('share-url').addEventListener('click', () => {
      const input = this.$('share-url');
      input.select();
      navigator.clipboard.writeText(input.value);
      this._status('Share link copied');
    });

    this._refreshCircuitSelects();
  }

  _bindBtnGroup(selector, callback) {
    const btns = this.$$(selector);
    for (const btn of btns) {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        callback(btn);
      });
    }
  }

  _ensureValidTool() {
    const tools = CONFIG.LAYER_TOOLS[this.activeLayer] || [];
    if (!tools.length) return;
    if (!tools.includes(this.activeTool)) {
      this.activeTool = tools[0];
    }
  }

  _syncActiveToolButton() {
    const currentGroup = this.$(`tools-${this.activeLayer}`);
    if (!currentGroup) return;
    currentGroup.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    currentGroup.querySelector(`.tool-btn[data-tool="${this.activeTool}"]`)?.classList.add('active');
  }

  _setTool(tool) {
    this.activeTool = tool;
    this.isDrawing = false;
    this.drawStart = null;
    if (tool !== 'wire' && tool !== 'pipe' && tool !== 'floor') this.polylinePoints = [];
    this._clearSelection();
    this.hoveredWall = null;

    // Update active state for current tool group
    const currentGroup = this.$(`tools-${this.activeLayer}`);
    if (currentGroup) {
      currentGroup.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      currentGroup.querySelector(`.tool-btn[data-tool="${tool}"]`)?.classList.add('active');
    }

    // Show/hide property panels
    const panels = ['wall-props', 'floor-props', 'door-props', 'window-props', 'stair-props', 'label-props', 'panel-props',
      'wire-props', 'electrical-symbol-props', 'pipe-props', 'plumbing-symbol-props', 'furniture-props',
      'selection-props', 'sel-door-props', 'sel-window-props', 'sel-stair-props', 'sel-label-props', 'sel-panel-props',
      'sel-wire-props', 'sel-elec-symbol-props', 'sel-pipe-props', 'sel-plumb-symbol-props', 'sel-furniture-props'];
    for (const id of panels) {
      const el = this.$(id);
      if (el) el.style.display = 'none';
    }

    const showMap = {
      wall: 'wall-props', floor: 'floor-props', door: 'door-props', window: 'window-props',
      stair: 'stair-props', label: 'label-props',
      panel: 'panel-props',
      wire: 'wire-props', electrical_symbol: 'electrical-symbol-props',
      pipe: 'pipe-props', plumbing_symbol: 'plumbing-symbol-props',
      furniture_item: 'furniture-props',
    };
    if (showMap[tool]) {
      const el = this.$(showMap[tool]);
      if (el) el.style.display = '';
    }

    this.canvas.style.cursor = tool === 'select' ? 'default' : 'crosshair';

    const labels = {
      wall: 'Click to start a wall',
      select: 'Click to select',
      eraser: 'Click to erase',
      floor: this.floorMode === 'draw' ? 'Click to place polygon vertices' : 'Click inside a closed room',
      door: 'Click on a wall to place a door',
      window: 'Click on a wall to place a window',
      stair: 'Click to place a stair',
      label: 'Click to place a label',
      panel: 'Click to place an electrical panel',
      wire: 'Click to start wire, ESC to finish',
      electrical_symbol: 'Click to place electrical symbol',
      pipe: 'Click to start pipe, ESC to finish',
      plumbing_symbol: 'Click to place plumbing symbol',
      furniture_item: 'Click to place furniture',
    };
    this._status(labels[tool] || 'Ready');
    this._refreshCircuitSelects();
    this._render();
  }

  _syncSelection() {
    const panels = ['wall-props', 'floor-props', 'door-props', 'window-props', 'stair-props', 'label-props', 'panel-props',
      'wire-props', 'electrical-symbol-props', 'pipe-props', 'plumbing-symbol-props', 'furniture-props',
      'selection-props', 'sel-door-props', 'sel-window-props', 'sel-stair-props', 'sel-label-props', 'sel-panel-props',
      'sel-wire-props', 'sel-elec-symbol-props', 'sel-pipe-props', 'sel-plumb-symbol-props', 'sel-furniture-props'];
    for (const id of panels) {
      const el = this.$(id);
      if (el) el.style.display = 'none';
    }

    if (this.selectedLabel) {
      const lp = this.$('sel-label-props');
      if (lp) {
        lp.style.display = '';
        const lb = this.selectedLabel;
        this.$('sel-label-text').value = lb.text;
        this.$$('#sel-label-fontsize-group .prop-btn').forEach(b =>
          b.classList.toggle('active', parseInt(b.dataset.value) === lb.fontSize));
      }
    } else if (this.selectedWall) {
      this.$('selection-props').style.display = '';
      const w = this.selectedWall;
      this.$('sel-length').textContent = Geom.formatLength(w.length);
      this.$('sel-thickness').textContent = w.thickness + 'cm';
      this.$('sel-material').textContent = w.material;
      this.$('sel-angle').textContent = Math.abs(w.angleDeg).toFixed(1) + '\u00B0';
      this.$$('#sel-thickness-group .prop-btn').forEach(b =>
        b.classList.toggle('active', parseInt(b.dataset.value) === w.thickness));
      this.$$('#sel-material-group .material-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.material === w.material));
    } else if (this.selectedDoor) {
      const dp = this.$('sel-door-props');
      if (dp) {
        dp.style.display = '';
        const door = this.selectedDoor;
        this.$('sel-door-width').textContent = door.width + 'cm';
        this.$('sel-door-type').textContent = door.doorType === 'single' ? 'Single' : door.doorType === 'double' ? 'Double' : 'Sliding';
        this.$('sel-door-hinge').textContent = door.hingeSide === 'left' ? 'Left' : 'Right';
        this.$$('#sel-door-type-group .prop-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.value === door.doorType));
        this.$$('#sel-door-width-group .prop-btn').forEach(b =>
          b.classList.toggle('active', parseInt(b.dataset.value) === door.width));
        const hingeWrap = this.$('sel-door-hinge-wrap');
        const openWrap = this.$('sel-door-opendir-wrap');
        if (hingeWrap) hingeWrap.style.display = door.doorType === 'single' ? '' : 'none';
        if (openWrap) openWrap.style.display = door.doorType === 'sliding' ? 'none' : '';
      }
    } else if (this.selectedWindow) {
      const wp = this.$('sel-window-props');
      if (wp) {
        wp.style.display = '';
        const win = this.selectedWindow;
        this.$('sel-window-width').textContent = win.width + 'cm';
        this.$('sel-window-type').textContent = win.windowType === 'fixed' ? 'Fixed' : win.windowType === 'sliding' ? 'Sliding' : 'Casement';
        this.$$('#sel-window-type-group .prop-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.value === win.windowType));
        this.$$('#sel-window-width-group .prop-btn').forEach(b =>
          b.classList.toggle('active', parseInt(b.dataset.value) === win.width));
      }
    } else if (this.selectedStair) {
      const sp = this.$('sel-stair-props');
      if (sp) {
        sp.style.display = '';
        this.$('sel-stair-size').textContent =
          `${this.selectedStair.width}x${this.selectedStair.length} cm`;
        this.$('sel-stair-rot').textContent = this.selectedStair.rotation + '\u00B0';
        this.$$('#sel-stair-rotation-group .prop-btn').forEach(b =>
          b.classList.toggle('active', parseInt(b.dataset.value) === this.selectedStair.rotation));
      }
    } else if (this.selectedPanel) {
      const pp = this.$('sel-panel-props');
      if (pp) {
        pp.style.display = '';
        const panel = this.selectedPanel;
        const status = this._getPanelElectricalStatus(panel.id);
        this.$('sel-panel-name').value = panel.name;
        this.$('sel-panel-voltage').textContent = `${panel.voltage}V`;
        this.$('sel-panel-phases').textContent = `${panel.phases}\u03C6`;
        this.$('sel-panel-main-breaker').textContent = `${panel.mainBreakerA}A`;
        this.$('sel-panel-main-breaker-input').value = String(panel.mainBreakerA);
        const alert = this.$('sel-panel-alert');
        if (alert && status) {
          if (!status.hasIssue) {
            alert.className = 'panel-alert ok';
            alert.textContent = `OK: total ${status.totalLoadA.toFixed(1)}A / main ${status.mainBreakerA}A`;
          } else {
            const issues = [];
            if (status.panelOverload) {
              issues.push(`Panel overload: ${status.totalLoadA.toFixed(1)}A > ${status.mainBreakerA}A`);
            }
            for (const s of status.overloadedCircuits) {
              issues.push(`${s.circuit.name}: ${s.loadA.toFixed(1)}A > ${s.breakerA}A`);
            }
            alert.className = 'panel-alert warn';
            alert.textContent = issues.join(' | ');
          }
        }
        this._renderSelectedPanelCircuits(panel);
      }
    } else if (this.selectedWire) {
      const wp = this.$('sel-wire-props');
      if (wp) {
        wp.style.display = '';
        this.$('sel-wire-gauge').textContent = this.selectedWire.gauge + 'mm\u00B2';
        this.$('sel-wire-length').textContent = Geom.formatLength(this.selectedWire.totalLength);
        this.$('sel-wire-points').textContent = this.selectedWire.points.length;
        this.$$('#sel-wire-gauge-group .prop-btn').forEach(b =>
          b.classList.toggle('active', parseFloat(b.dataset.value) === this.selectedWire.gauge));
      }
    } else if (this.selectedElectricalSymbol) {
      const ep = this.$('sel-elec-symbol-props');
      if (ep) {
        ep.style.display = '';
        this.$('sel-elec-symbol-type').textContent = CONFIG.ELECTRICAL_SYMBOL_LABELS[this.selectedElectricalSymbol.symbolType] || this.selectedElectricalSymbol.symbolType;
        const circuit = this.circuits.find(c => c.id === this.selectedElectricalSymbol.circuitId);
        this.$('sel-elec-symbol-circuit').textContent = circuit ? `${circuit.name}` : 'None';
        const load = Math.max(0.1, Number(this.selectedElectricalSymbol.amperageA) || CONFIG.DEFAULT_SYMBOL_AMPERAGE_A);
        this.$('sel-elec-load-a').value = String(load);
        this._fillCircuitSelect('sel-elec-circuit-select', this.selectedElectricalSymbol.circuitId);
        this.$$('#sel-elec-symbol-rotation-group .prop-btn').forEach(b =>
          b.classList.toggle('active', parseInt(b.dataset.value) === this.selectedElectricalSymbol.rotation));
      }
    } else if (this.selectedPipe) {
      const pp = this.$('sel-pipe-props');
      if (pp) {
        pp.style.display = '';
        this.$('sel-pipe-type').textContent = CONFIG.PIPE_LABELS[this.selectedPipe.pipeType] || this.selectedPipe.pipeType;
        this.$('sel-pipe-diameter').textContent = '\u00D8' + this.selectedPipe.diameter + 'mm';
        this.$('sel-pipe-length').textContent = Geom.formatLength(this.selectedPipe.totalLength);
        this.$$('#sel-pipe-flow-group .prop-btn').forEach(b =>
          b.classList.toggle('active', parseInt(b.dataset.value) === (this.selectedPipe.flowDir || 1)));
      }
    } else if (this.selectedPlumbingSymbol) {
      const pp = this.$('sel-plumb-symbol-props');
      if (pp) {
        pp.style.display = '';
        this.$('sel-plumb-symbol-type').textContent = CONFIG.PLUMBING_SYMBOL_LABELS[this.selectedPlumbingSymbol.symbolType] || this.selectedPlumbingSymbol.symbolType;
        this.$$('#sel-plumb-symbol-rotation-group .prop-btn').forEach(b =>
          b.classList.toggle('active', parseInt(b.dataset.value) === this.selectedPlumbingSymbol.rotation));
      }
    } else if (this.selectedFurniture) {
      const fp = this.$('sel-furniture-props');
      if (fp) {
        fp.style.display = '';
        const cat = CONFIG.FURNITURE_CATALOG[this.selectedFurniture.furnitureType];
        this.$('sel-furniture-type').textContent = cat ? cat.label : this.selectedFurniture.furnitureType;
        this.$('sel-furniture-size').textContent = cat ? `${cat.w}×${cat.d} cm` : '—';
        this.$$('#sel-furniture-rotation-group .prop-btn').forEach(b =>
          b.classList.toggle('active', parseInt(b.dataset.value) === this.selectedFurniture.rotation));
      }
    } else {
      // Show default tool panel
      const showMap = {
        wall: 'wall-props', floor: 'floor-props', door: 'door-props', window: 'window-props',
        stair: 'stair-props', label: 'label-props',
        panel: 'panel-props',
        wire: 'wire-props', electrical_symbol: 'electrical-symbol-props',
        pipe: 'pipe-props', plumbing_symbol: 'plumbing-symbol-props',
        furniture_item: 'furniture-props',
      };
      if (showMap[this.activeTool]) {
        const el = this.$(showMap[this.activeTool]);
        if (el) el.style.display = '';
      }
    }
  }

  _fillCircuitSelect(selectId, selectedId = '') {
    const select = this.$(selectId);
    if (!select) return;
    const chosen = selectedId || '';
    select.innerHTML = '<option value="">No circuit</option>';
    for (const c of this.circuits) {
      const panel = this.panels.find(p => p.id === c.panelId);
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = panel ? `${panel.name} / ${c.name}` : c.name;
      select.appendChild(opt);
    }
    select.value = chosen;
    if (select.value !== chosen) select.value = '';
  }

  _refreshCircuitSelects() {
    this._fillCircuitSelect('elec-circuit-select', this.electricalCircuitId);
    if (!this.electricalCircuitId && this.circuits.length) {
      this.electricalCircuitId = this.circuits[0].id;
      this._fillCircuitSelect('elec-circuit-select', this.electricalCircuitId);
    }
    if (this.selectedElectricalSymbol) {
      this._fillCircuitSelect('sel-elec-circuit-select', this.selectedElectricalSymbol.circuitId);
    }
  }

  _renderSelectedPanelCircuits(panel) {
    const container = this.$('sel-panel-circuits-list');
    if (!container) return;
    const status = this._getPanelElectricalStatus(panel.id);
    const circuits = status ? status.circuitStatuses : [];
    container.innerHTML = '';

    if (!circuits.length) {
      container.innerHTML = '<div class="bom-empty">No circuits</div>';
      return;
    }

    for (const s of circuits) {
      const c = s.circuit;
      const loadA = s.loadA;
      const warnStyle = s.overload ? 'background:rgba(207,77,58,0.07);border-bottom-color:#e6b0a8;' : '';
      const loadStyle = s.overload ? 'color:#b33221;font-weight:700;' : '';
      const warnMark = s.overload ? ' !' : '';
      const row = document.createElement('div');
      row.className = 'info-row';
      row.style.cssText = `align-items:center;${warnStyle}`;
      row.innerHTML =
        `<input data-circuit-id="${c.id}" data-field="name" value="${c.name}" style="width:44%;padding:3px 5px;font-size:11px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text)">` +
        `<input data-circuit-id="${c.id}" data-field="breakerA" type="number" min="1" value="${c.breakerA}" style="width:20%;padding:3px 5px;font-size:11px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text)">` +
        `<span style="width:24%;text-align:right;font-size:11px;font-family:var(--font-mono);${loadStyle}">${loadA.toFixed(1)}A${warnMark}</span>` +
        `<button data-circuit-id="${c.id}" data-action="delete" class="prop-btn" style="padding:2px 6px">×</button>`;
      container.appendChild(row);
    }

    container.querySelectorAll('input[data-circuit-id]').forEach(input => {
      input.addEventListener('change', () => {
        const id = input.dataset.circuitId;
        const field = input.dataset.field;
        const circuit = this.circuits.find(c => c.id === id);
        if (!circuit) return;
        this._pushHistory();
        if (field === 'name') circuit.name = input.value || circuit.name;
        if (field === 'breakerA') circuit.breakerA = Math.max(1, parseInt(input.value) || circuit.breakerA);
        this._refreshCircuitSelects();
        this._syncSelection();
        this._render();
      });
    });

    container.querySelectorAll('button[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.circuitId;
        this._pushHistory();
        this.circuits = this.circuits.filter(c => c.id !== id);
        this.electricalSymbols.forEach(sym => { if (sym.circuitId === id) sym.circuitId = ''; });
        this._refreshCircuitSelects();
        this._syncSelection();
        this._render();
      });
    });
  }

  _status(text) {
    this.$('status-text').textContent = text;
  }

  // ── Export PNG ───────────────────────────────
  _exportPNG() {
    if (!exportPNG(this.currentStory, this.renderer, this.currentStory.name)) {
      this._status('Nothing to export');
      return;
    }
    this._status('PNG exported!');
  }

  // ── 3D View ─────────────────────────────────
  _toggle3D() {
    if (this.is3DMode) {
      this._exit3D();
    } else {
      this._enter3D();
    }
  }

  _enter3D() {
    // 1. Switch mode first — CSS shows #three-canvas, hides panels & 2D canvas
    this.is3DMode = true;
    this.hostElement.setAttribute('data-mode', '3d');

    // 2. Create viewer (lazy) — after mode switch so container has full width
    const container = this.$('canvas-container');
    if (!this.viewer3D) {
      this.viewer3D = new Viewer3D(container, this.root);
      this.viewer3D.onNavModeChange = (mode) => {
        const btnNav = this.$('btn-nav-mode');
        if (!btnNav) return;
        if (mode === 'orbit') {
          btnNav.textContent = 'Orbit';
          btnNav.classList.remove('active');
          this._setNavModeAttribute('orbit');
          this._clearMobileWalkInput();
          this._status(this._isMobilePointerEnvironment()
            ? 'Orbit mode — one-finger drag to look'
            : 'Orbit mode — drag to rotate, scroll to zoom'
          );
        } else {
          btnNav.textContent = 'Walk';
          btnNav.classList.add('active');
          this._setNavModeAttribute('fps');
          this._status(this._isMobilePointerEnvironment()
            ? 'Walk mode — use arrows + right drag'
            : 'Walk mode — WASD to move, click to lock mouse'
          );
          this._applyMobileWalkVector();
        }
      };
    }

    // 3. Build, resize (container now at full width), start render loop
    this.viewer3D.buildScene(this.stories, this.terrainWidth, this.terrainHeight, this.axisOrigin);
    this.viewer3D.resize();
    this.viewer3D.start();

    // Button states
    const btn3d = this.$('btn-3d');
    if (btn3d) btn3d.classList.add('active');
    const btnNav = this.$('btn-nav-mode');
    if (btnNav) btnNav.style.display = '';
    this._setNavModeAttribute('orbit');

    this._status('3D View — Press 0 to return to 2D');
  }

  _exit3D() {
    if (this.viewer3D) {
      this.viewer3D.stop();
      this.viewer3D.setNavigationMode('orbit');
    }
    this._setNavModeAttribute(null);
    this.is3DMode = false;
    this.hostElement.removeAttribute('data-mode');

    // Button states
    const btn3d = this.$('btn-3d');
    if (btn3d) btn3d.classList.remove('active');
    const btnNav = this.$('btn-nav-mode');
    if (btnNav) {
      btnNav.style.display = 'none';
      btnNav.textContent = 'Orbit';
      btnNav.classList.remove('active');
    }
    this._clearMobileWalkInput();

    this._render();
    this._status('2D View');
  }

  _toggleNavMode() {
    if (!this.viewer3D || !this.is3DMode) return;
    const btnNav = this.$('btn-nav-mode');
    if (this.viewer3D.navMode === 'orbit') {
      this.viewer3D.setNavigationMode('fps');
      if (btnNav) { btnNav.textContent = 'Walk'; btnNav.classList.add('active'); }
      this._status(this._isMobilePointerEnvironment()
        ? 'Walk mode — use arrows + right drag'
        : 'Walk mode — WASD to move, click to lock mouse'
      );
    } else {
      this.viewer3D.setNavigationMode('orbit');
      if (btnNav) { btnNav.textContent = 'Orbit'; btnNav.classList.remove('active'); }
      this._status(this._isMobilePointerEnvironment()
        ? 'Orbit mode — one-finger drag to look'
        : 'Orbit mode — drag to rotate, scroll to zoom'
      );
      this._clearMobileWalkInput();
    }
  }

  // ── Cleanup ─────────────────────────────────
  destroy() {
    if (this._supportsPointerEvents) {
      this.canvas.removeEventListener('pointerdown', this._onPointerDownBound);
      this.canvas.removeEventListener('pointermove', this._onPointerMoveBound);
      this.canvas.removeEventListener('pointerup', this._onPointerUpBound);
      this.canvas.removeEventListener('pointercancel', this._onPointerCancelBound);
      this.canvas.removeEventListener('pointerleave', this._onPointerCancelBound);
      this.canvas.removeEventListener('pointerout', this._onPointerCancelBound);
      window.removeEventListener('pointermove', this._onPointerMoveBound);
      window.removeEventListener('pointerup', this._onPointerUpBound);
      window.removeEventListener('pointercancel', this._onPointerCancelBound);
    } else {
      this.canvas.removeEventListener('mousedown', this._onMouseDownBound);
      this.canvas.removeEventListener('mousemove', this._onMouseMoveBound);
      this.canvas.removeEventListener('mouseup', this._onMouseUpBound);
      window.removeEventListener('mousemove', this._onMouseMoveBound);
      window.removeEventListener('mouseup', this._onMouseUpBound);
    }
    this.canvas.removeEventListener('wheel', this._onWheelBound, { passive: false });
    this.canvas.removeEventListener('contextmenu', this._onContextMenuBound);
    this.canvas.removeEventListener('pointerdown', this._onCanvasFocusBound, true);
    this.canvas.removeEventListener('mousedown', this._onCanvasFocusBound, true);
    this.hostElement.removeEventListener('keydown', this._onKeyDownBound);
    this.hostElement.removeEventListener('keyup', this._onKeyUpBound);

    for (const { el, type, handler } of this._mobileNavBoundHandlers) {
      el.removeEventListener(type, handler);
    }
    this._mobileNavBoundHandlers.length = 0;
    this._mobileWalkMovePointers.clear();
    this._clearMobileWalkInput();

    if (this.viewer3D) {
      this.viewer3D.dispose();
      this.viewer3D = null;
    }
  }
}

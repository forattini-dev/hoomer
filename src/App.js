import {
  CONFIG,
  TOOL_PANEL_MAP,
  TOOL_SHORTCUTS_BY_LAYER,
  ALL_TOOL_PROP_PANEL_IDS,
} from './config.js';
import { Geom } from './geometry.js';
import { History } from './History.js';
import { Renderer } from './Renderer.js';
import { CostsView } from './CostsView.js';
import {
  createLayeredStory,
  deserializeState,
  serializeState,
  storyName,
  buildProjectPayload,
  parseProjectPayload,
  PROJECT_FORMAT,
  PROJECT_SCHEMA_VERSION,
  PROJECT_FILE_META_KEY,
} from './AppStateIO.js';
import { InputManager } from './InputManager.js';
import { SelectionManager } from './SelectionManager.js';
import { SelectionState } from './SelectionState.js';
import { EventBus } from './EventBus.js';
import { ToolActions } from './ToolActions.js';
import { DragManager } from './DragManager.js';
import { ThreeDController } from './ThreeDController.js';
import { ProjectIO } from './ProjectIO.js';
import { bindUI } from './UIBindings.js';
import { LocalProjectStore } from './LocalProjectStore.js';
import { analyzePlan, formatPlanAdvice } from './PlanAdvisor.js';

export class App {
  constructor(root, hostElement, overrides = {}) {
    this.root = root;
    this.hostElement = hostElement;
    this.bus = new EventBus();
    this.canvas = this.$('main-canvas');
    this.renderer = new Renderer(this.canvas);

    // Stories (layered)
    this.stories = [createLayeredStory(storyName(0))];
    this.activeStoryIndex = 0;

    // Selection state (alias props on app: selectedWall, selectedDoor...).
    this.selectionState = new SelectionState();
    this.selectionState.bindTarget(this);

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
    this.planReview = null;

    // Floor draw mode
    this.floorMode = 'auto'; // 'auto' | 'draw'

    // Polyline drawing state (for wire/pipe/floor-draw)
    this.polylinePoints = [];

    // Terrain / Project
    this.terrainWidth = CONFIG.DEFAULT_TERRAIN_WIDTH;
    this.terrainHeight = CONFIG.DEFAULT_TERRAIN_HEIGHT;
    this.showTerrain = true;
    this.axisOrigin = 'bottom-left';

    this.projectId = 'default';
    this.projectMeta = {
      format: PROJECT_FORMAT,
      schemaVersion: PROJECT_SCHEMA_VERSION,
      projectId: this.projectId,
      projectName: 'Untitled Project',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Apply overrides
    for (const [key, val] of Object.entries(overrides)) {
      if (key in this) this[key] = val;
    }

    // Interaction
    this.isDrawing = false;
    this.drawStart = null;
    this.mouseWorld = { x: 0, y: 0 };
    this.hoveredWall = null;

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

    // History
    this.history = new History();

    // Label edit state (avoid history spam)
    this._labelEditActive = false;

    // Input handling (events, pan, zoom, pointer tracking)
    this.input = new InputManager(this.canvas, this.hostElement, this);

    // Selection management (select, erase, delete, UI sync)
    this.selection = new SelectionManager(this);

    // Tool actions (entity creation)
    this.tools = new ToolActions(this);

    // Drag management (wall & furniture dragging)
    this.drag = new DragManager(this);

    // 3D view management
    this.threeD = new ThreeDController(this);

    // Project I/O (import/export, share)
    this.projectIO = new ProjectIO(this);
    this.storage = new LocalProjectStore({ projectKey: this.projectId });
    this._persistTimer = null;

    this.renderer.resize();
    this._bindUI();
    this.threeD.bindMobileWalkControls();
    this._syncStoryTabs();
    this._syncLayerTabs();
    this._syncToolPalette();
    this._refreshCircuitSelects();
    this._centerView();
    this._render();

    queueMicrotask(() => this._initializeProjectState());
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

  // ── 3D state proxies ───────────────────────
  get is3DMode() { return this.threeD.is3DMode; }
  get viewer3D() { return this.threeD.viewer3D; }

  // ── Coordinates ─────────────────────────────
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

  // ── State Serialization ─────────────────────
  _getState() {
    return serializeState(this);
  }

  _getPersistPayload() {
    return buildProjectPayload(this);
  }

  _setProjectMeta(rawMeta = {}) {
    const nextMeta = {
      ...this.projectMeta,
      ...rawMeta,
      format: PROJECT_FORMAT,
      schemaVersion: PROJECT_SCHEMA_VERSION,
    };
    const createdAt = Number(nextMeta.createdAt);
    const updatedAt = Number(nextMeta.updatedAt);
    if (Number.isFinite(createdAt)) this.projectMeta.createdAt = createdAt;
    if (Number.isFinite(updatedAt)) this.projectMeta.updatedAt = updatedAt;
    this.projectMeta = { ...this.projectMeta, ...nextMeta };
  }

  _setUnitPrices(prices) {
    if (prices && typeof prices === 'object' && !Array.isArray(prices)) {
      this.costsView.unitPrices = { ...prices };
    } else {
      this.costsView.unitPrices = {};
    }
  }

  _setState(state) {
    const normalized = deserializeState(state);
    this.stories = normalized.stories;
    this.activeStoryIndex = normalized.activeStoryIndex;
    this.activeTool = normalized.activeTool;
    this.projectName = normalized.projectName;
    this._setUnitPrices(normalized.unitPrices);
    if (state && typeof state === 'object') {
      const terrainWidth = Number(state.terrainWidth);
      const terrainHeight = Number(state.terrainHeight);
      if (Number.isFinite(terrainWidth) && terrainWidth > 0) this.terrainWidth = terrainWidth;
      if (Number.isFinite(terrainHeight) && terrainHeight > 0) this.terrainHeight = terrainHeight;
      if (typeof state.axisOrigin === 'string') this.axisOrigin = state.axisOrigin;
      if (typeof state.showTerrain === 'boolean') this.showTerrain = state.showTerrain;
    }
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
    const last = Math.max(0, Math.min(index, this.stories.length));
    for (let i = 0; i < last; i++) {
      const storyHeight = Number(this.stories[i]?.storyHeight);
      elevation += Number.isFinite(storyHeight) ? storyHeight : CONFIG.DEFAULT_STORY_HEIGHT;
    }
    return elevation;
  }

  _pushHistory() {
    this.history.push(this._getPersistPayload());
    this._syncUndoRedo();
    this._schedulePersist();
  }

  async _initializeProjectState() {
    const hash = window.location.hash;
    if (hash && hash.length > 2 && (hash.startsWith('#P') || hash.startsWith('#E'))) {
      await this.projectIO.loadFromHash();
      return;
    }

    const saved = await this.storage.load();
    if (saved) {
      const applied = this.applyProjectPayload(saved, { pushHistory: false, silent: true });
      if (applied) {
        this._status('Recovered last project');
      }
    }
    this._schedulePersist();
  }

  applyProjectPayload(payload, { pushHistory = true, silent = false } = {}) {
    const normalized = parseProjectPayload(payload);
    if (!normalized.state) return false;
    if (normalized.meta) {
      this._setProjectMeta(normalized.meta);
    } else {
      this._setProjectMeta({ projectName: normalized.state?.projectName });
    }
    if (pushHistory) this._pushHistory();
    this._setState(normalized.state);
    this._updateGhost();
    this._syncUndoRedo();
    if (!silent) this._status('Project loaded');
    this._centerView();
    this._render();
    return true;
  }

  _schedulePersist() {
    if (this._persistTimer) clearTimeout(this._persistTimer);
    this._persistTimer = setTimeout(() => {
      this._persistProject();
    }, 450);
  }

  async _persistProject() {
    try {
      const payload = this._getPersistPayload();
      await this.storage.save(payload);
      this._setProjectMeta(payload?.[PROJECT_FILE_META_KEY] || {});
    } catch {
      // silent: best-effort local persistence
    }
  }

  runPlanReview() {
    const review = analyzePlan(this);
    this.planReview = review;
    this._renderPlanReview(review);
    this._status('Plan check completed');
    return review;
  }

  _renderPlanReview(review = this.planReview) {
    const out = this.$('plan-review-result');
    if (!out) return;
    if (!review) {
      out.textContent = 'Execute a análise para gerar insights locais (modo offline).';
      return;
    }
    out.textContent = formatPlanAdvice(review);
  }

  _clearSelection() { this.selection.clear(); }

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
    const container = this.$('layer-fab');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < CONFIG.LAYERS.length; i++) {
      const layerName = CONFIG.LAYERS[i];
      const color = CONFIG.LAYER_COLORS[layerName];
      const meta = CONFIG.LAYER_META[layerName] || {};
      const icon = meta.icon || '';
      const label = meta.label || layerName;
      const isActive = this.activeLayer === layerName;
      const isVisible = this.currentStory.layers[layerName].visible;

      const btn = document.createElement('button');
      btn.className = 'fab-layer-btn' + (isActive ? ' active' : '');
      btn.dataset.layer = layerName;
      btn.title = `${label} (${i + 1})`;
      btn.style.setProperty('--layer-color', color);

      if (!isVisible) {
        btn.classList.add('layer-hidden');
        btn.title += ' (hidden)';
      }

      btn.innerHTML = `<span class="fab-icon">${icon}</span>`;
      btn.addEventListener('click', (e) => {
        if (e.shiftKey) {
          this._toggleLayerVisibility(layerName);
        } else {
          this._switchLayer(layerName);
        }
      });
      container.appendChild(btn);
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

  // ── Tool Actions ────────────────────────────
  _startToolAction(e) {
    if (this.is3DMode) return;

    const { sx, sy } = this.input._getCanvasCoords(e);
    const world = this.input.screenToWorld(sx, sy);
    const snapped = this.input._snap(world.x, world.y);
    this.mouseWorld = snapped;

    this.tools.dispatch(this.activeTool, snapped, world);
    this._render();
  }


  _handleCanvasMove(world, snapped) {
    this.mouseWorld = snapped;
    this.$('status-coords').textContent = `X: ${Math.round(snapped.x)} cm  Y: ${Math.round(snapped.y)} cm`;

    if (this.drag.isDragging && this.drag.dragWall) {
      this.drag.doDrag(snapped.x, snapped.y);
      this._render();
      return;
    }

    if (this.drag.isDragging && this.drag._dragFurniture) {
      this.drag._dragFurniture.x = snapped.x - this.drag._dragFurnitureOffset.dx;
      this.drag._dragFurniture.y = snapped.y - this.drag._dragFurnitureOffset.dy;
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

  _getToolShortcuts() {
    return TOOL_SHORTCUTS_BY_LAYER[this.activeLayer];
  }

  _finishPolyline() { this.tools.finishPolyline(); }
  _onRightClick() { this.tools.onRightClick(); }
  _addCircuitToPanel(panel) { this.tools.addCircuitToPanel(panel); }
  _deleteSelected() { this.selection.deleteSelected(); }
  _finishDrag() { this.drag.finishDrag(); }

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
    this._renderPlanReview();
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
        this._schedulePersist();
      });
    }
    for (const input of container.querySelectorAll('.proj-slab-thickness')) {
      input.addEventListener('change', () => {
        const idx = parseInt(input.dataset.index);
        this.stories[idx].slabThickness = parseInt(input.value) || CONFIG.DEFAULT_SLAB_THICKNESS;
        this._schedulePersist();
      });
    }
  }

  // ── Project I/O delegates ──────────────────
  _exportJSON() { this.projectIO.exportJSONFile(); }
  _importJSON(event) { this.projectIO.importJSON(event); }
  _applySharedState(data) { this.applyProjectPayload(data); }
  _shareProject() { this.projectIO.shareProject(); }
  _loadFromHash() { this.projectIO.loadFromHash(); }

  // ── Undo / Redo ─────────────────────────────
  _undo() {
    // Cancel active drawing before undoing history
    if (this.isDrawing || this.polylinePoints.length > 0) {
      this.isDrawing = false;
      this.drawStart = null;
      this.polylinePoints = [];
      this._status('Cancelled');
      this._render();
      return;
    }
    const s = this.history.undo(this._getPersistPayload());
    if (s) {
      const normalized = parseProjectPayload(s);
      if (normalized.meta) this._setProjectMeta(normalized.meta);
      if (normalized.state) this._setState(normalized.state);
      this._syncSelection();
      this._updateGhost();
      this._status('Undone');
      this._render();
    }
    this._syncUndoRedo();
    this._schedulePersist();
  }

  _redo() {
    const s = this.history.redo(this._getPersistPayload());
    if (s) {
      const normalized = parseProjectPayload(s);
      if (normalized.meta) this._setProjectMeta(normalized.meta);
      if (normalized.state) this._setState(normalized.state);
      this._syncSelection();
      this._updateGhost();
      this._status('Redone');
      this._render();
    }
    this._syncUndoRedo();
    this._schedulePersist();
  }

  _syncUndoRedo() {
    this.$('btn-undo').disabled = !this.history.canUndo;
    this.$('btn-redo').disabled = !this.history.canRedo;
  }

  // ── Render ──────────────────────────────────
  _render() {
    this._updateGhost();
    this.renderer.render(this);
    this.bus.emit('render');
  }

  _bindUI() { bindUI(this); }

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
    for (const id of ALL_TOOL_PROP_PANEL_IDS) {
      const el = this.$(id);
      if (el) el.style.display = 'none';
    }

    const panelId = TOOL_PANEL_MAP[tool] || '';
    if (panelId) {
      const el = this.$(panelId);
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

  _syncSelection() { this.selection.syncUI(); }
  _fillCircuitSelect(id, sel) { this.selection.fillCircuitSelect(id, sel); }
  _refreshCircuitSelects() { this.selection.refreshCircuitSelects(); }

  _status(text) {
    this.$('status-text').textContent = text;
    this.bus.emit('status', text);
  }

  // ── 3D / ProjectIO delegates ────────────────
  _toggle3D() { this.threeD.toggle3D(); }
  _toggleNavMode() { this.threeD.toggleNavMode(); }
  _exportPNG() { this.projectIO.exportPNG(); }

  // ── Cleanup ─────────────────────────────────
  destroy() {
    if (this.input) {
      this.input.destroy();
      this.input = null;
    }

    this.threeD.destroy();
    this.bus.destroy();
  }
}

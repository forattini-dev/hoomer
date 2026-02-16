// ── UIBindings.js ─────────────────────────────────────
// Extracted from App.js — all DOM event bindings for tools, properties, and selection.

import { CONFIG } from './config.js';

function bindBtnGroup(app, selector, callback) {
  const btns = app.$$(selector);
  for (const btn of btns) {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      callback(btn);
    });
  }
}

export function bindUI(app) {
  // Tool buttons
  for (const btn of app.$$('.tool-btn')) {
    btn.addEventListener('click', () => app._setTool(btn.dataset.tool));
  }

  // ── Tool Property Defaults ─────────────────

  // Wall thickness
  bindBtnGroup(app, '#wall-thickness-group .prop-btn', btn => { app.wallThickness = parseInt(btn.dataset.value); });
  // Wall material
  bindBtnGroup(app, '#wall-material-group .material-btn', btn => { app.wallMaterial = btn.dataset.material; });
  // Floor material
  bindBtnGroup(app, '#floor-material-group .material-btn', btn => { app.floorMaterial = btn.dataset.material; });
  // Floor mode
  bindBtnGroup(app, '#floor-mode-group .prop-btn', btn => {
    app.floorMode = btn.dataset.value;
    if (app.activeTool === 'floor') {
      app.polylinePoints = [];
      app._status(app.floorMode === 'draw' ? 'Click to place polygon vertices' : 'Click inside a closed room');
      app._render();
    }
  });
  // Door type
  bindBtnGroup(app, '#door-type-group .prop-btn', btn => {
    app.doorType = btn.dataset.value;
    const hingeWrap = app.$('door-hinge-wrap');
    const openWrap = app.$('door-opendir-wrap');
    if (hingeWrap) hingeWrap.style.display = btn.dataset.value === 'single' ? '' : 'none';
    if (openWrap) openWrap.style.display = btn.dataset.value === 'sliding' ? 'none' : '';
  });
  // Door width
  bindBtnGroup(app, '#door-width-group .prop-btn', btn => { app.doorWidth = parseInt(btn.dataset.value); });
  // Door hinge
  bindBtnGroup(app, '#door-hinge-group .prop-btn', btn => { app.doorHinge = btn.dataset.value; });
  // Door open direction
  bindBtnGroup(app, '#door-opendir-group .prop-btn', btn => { app.doorOpenDir = parseInt(btn.dataset.value); });
  // Window type
  bindBtnGroup(app, '#window-type-group .prop-btn', btn => { app.windowType = btn.dataset.value; });
  // Window width
  bindBtnGroup(app, '#window-width-group .prop-btn', btn => { app.windowWidth = parseInt(btn.dataset.value); });
  // Stair width
  bindBtnGroup(app, '#stair-width-group .prop-btn', btn => { app.stairWidth = parseInt(btn.dataset.value); });
  // Stair length
  bindBtnGroup(app, '#stair-length-group .prop-btn', btn => { app.stairLength = parseInt(btn.dataset.value); });
  // Stair rotation
  bindBtnGroup(app, '#stair-rotation-group .prop-btn', btn => { app.stairRotation = parseInt(btn.dataset.value); });
  // Label font size
  bindBtnGroup(app, '#label-fontsize-group .prop-btn', btn => { app.labelFontSize = parseInt(btn.dataset.value); });

  // ── Electrical Tool Defaults ───────────────

  // Wire gauge
  bindBtnGroup(app, '#wire-gauge-group .prop-btn', btn => { app.wireGauge = parseFloat(btn.dataset.value); });
  // Panel name prefix
  const panelNamePrefixInput = app.$('panel-name-prefix');
  if (panelNamePrefixInput) {
    panelNamePrefixInput.addEventListener('input', () => {
      app.panelNamePrefix = panelNamePrefixInput.value || 'QD';
    });
  }
  bindBtnGroup(app, '#panel-voltage-group .prop-btn', btn => { app.panelVoltage = parseInt(btn.dataset.value); });
  bindBtnGroup(app, '#panel-phases-group .prop-btn', btn => { app.panelPhases = parseInt(btn.dataset.value); });
  bindBtnGroup(app, '#panel-main-breaker-group .prop-btn', btn => { app.panelMainBreakerA = parseInt(btn.dataset.value); });
  // Electrical symbol type
  bindBtnGroup(app, '#elec-symbol-type-group .prop-btn', btn => { app.electricalSymbolType = btn.dataset.value; });
  // Electrical symbol rotation
  bindBtnGroup(app, '#elec-symbol-rotation-group .prop-btn', btn => { app.electricalSymbolRotation = parseInt(btn.dataset.value); });
  const elecLoadInput = app.$('elec-load-a');
  if (elecLoadInput) {
    elecLoadInput.addEventListener('change', () => {
      app.electricalLoadA = Math.max(0.1, parseFloat(elecLoadInput.value) || CONFIG.DEFAULT_SYMBOL_AMPERAGE_A);
      elecLoadInput.value = String(app.electricalLoadA);
    });
  }
  const elecCircuitSelect = app.$('elec-circuit-select');
  if (elecCircuitSelect) {
    elecCircuitSelect.addEventListener('change', () => {
      app.electricalCircuitId = elecCircuitSelect.value;
    });
  }

  // ── Plumbing Tool Defaults ─────────────────

  bindBtnGroup(app, '#pipe-type-group .prop-btn', btn => { app.pipeType = btn.dataset.value; });
  bindBtnGroup(app, '#pipe-diameter-group .prop-btn', btn => { app.pipeDiameter = parseInt(btn.dataset.value); });
  bindBtnGroup(app, '#pipe-flow-group .prop-btn', btn => { app.pipeFlowDir = parseInt(btn.dataset.value); });
  bindBtnGroup(app, '#plumb-symbol-type-group .prop-btn', btn => { app.plumbingSymbolType = btn.dataset.value; });
  bindBtnGroup(app, '#plumb-symbol-rotation-group .prop-btn', btn => { app.plumbingSymbolRotation = parseInt(btn.dataset.value); });

  // ── Furniture Tool Defaults ────────────────

  bindBtnGroup(app, '#furniture-type-group .prop-btn', btn => { app.furnitureType = btn.dataset.value; });
  bindBtnGroup(app, '#furniture-rotation-group .prop-btn', btn => { app.furnitureRotation = parseInt(btn.dataset.value); });

  // ── Selection Property Controls ────────────

  // Selected wall thickness
  for (const btn of app.$$('#sel-thickness-group .prop-btn')) {
    btn.addEventListener('click', () => {
      if (!app.selectedWall) return;
      app._pushHistory(); app.selectedWall.thickness = parseInt(btn.dataset.value);
      app._syncSelection(); app._render();
    });
  }
  // Selected wall material
  for (const btn of app.$$('#sel-material-group .material-btn')) {
    btn.addEventListener('click', () => {
      if (!app.selectedWall) return;
      app._pushHistory(); app.selectedWall.material = btn.dataset.material;
      app._syncSelection(); app._render();
    });
  }

  // Selected door controls
  for (const btn of app.$$('#sel-door-type-group .prop-btn')) {
    btn.addEventListener('click', () => {
      if (!app.selectedDoor) return;
      app._pushHistory(); app.selectedDoor.doorType = btn.dataset.value;
      app.$$('#sel-door-type-group .prop-btn').forEach(b => b.classList.toggle('active', b.dataset.value === btn.dataset.value));
      app._syncSelection(); app._render();
    });
  }
  for (const btn of app.$$('#sel-door-width-group .prop-btn')) {
    btn.addEventListener('click', () => {
      if (!app.selectedDoor) return;
      app._pushHistory(); app.selectedDoor.width = parseInt(btn.dataset.value);
      app._syncSelection(); app._render();
    });
  }
  const flipHinge = app.$('btn-flip-hinge');
  if (flipHinge) flipHinge.addEventListener('click', () => {
    if (!app.selectedDoor) return;
    app._pushHistory();
    app.selectedDoor.hingeSide = app.selectedDoor.hingeSide === 'left' ? 'right' : 'left';
    app._syncSelection(); app._render();
  });
  const flipOpen = app.$('btn-flip-open');
  if (flipOpen) flipOpen.addEventListener('click', () => {
    if (!app.selectedDoor) return;
    app._pushHistory();
    app.selectedDoor.openDir *= -1;
    app._syncSelection(); app._render();
  });

  // Selected window controls
  for (const btn of app.$$('#sel-window-type-group .prop-btn')) {
    btn.addEventListener('click', () => {
      if (!app.selectedWindow) return;
      app._pushHistory(); app.selectedWindow.windowType = btn.dataset.value;
      app.$$('#sel-window-type-group .prop-btn').forEach(b => b.classList.toggle('active', b.dataset.value === btn.dataset.value));
      app._syncSelection(); app._render();
    });
  }
  for (const btn of app.$$('#sel-window-width-group .prop-btn')) {
    btn.addEventListener('click', () => {
      if (!app.selectedWindow) return;
      app._pushHistory(); app.selectedWindow.width = parseInt(btn.dataset.value);
      app._syncSelection(); app._render();
    });
  }

  // Selected stair controls
  for (const btn of app.$$('#sel-stair-rotation-group .prop-btn')) {
    btn.addEventListener('click', () => {
      if (!app.selectedStair) return;
      app._pushHistory(); app.selectedStair.rotation = parseInt(btn.dataset.value);
      app._syncSelection(); app._render();
    });
  }

  // Selected label controls
  const selLabelText = app.$('sel-label-text');
  if (selLabelText) {
    selLabelText.addEventListener('input', () => {
      if (!app.selectedLabel) return;
      if (!app._labelEditActive) {
        app._pushHistory();
        app._labelEditActive = true;
      }
      app.selectedLabel.text = selLabelText.value;
      app._render();
    });
    selLabelText.addEventListener('blur', () => {
      app._labelEditActive = false;
    });
    selLabelText.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        selLabelText.blur();
      }
    });
  }
  for (const btn of app.$$('#sel-label-fontsize-group .prop-btn')) {
    btn.addEventListener('click', () => {
      if (!app.selectedLabel) return;
      app._pushHistory(); app.selectedLabel.fontSize = parseInt(btn.dataset.value);
      app._syncSelection(); app._render();
    });
  }

  // Selected wire gauge
  for (const btn of app.$$('#sel-wire-gauge-group .prop-btn')) {
    btn.addEventListener('click', () => {
      if (!app.selectedWire) return;
      app._pushHistory(); app.selectedWire.gauge = parseFloat(btn.dataset.value);
      app._syncSelection(); app._render();
    });
  }

  // Selected panel controls
  const selPanelName = app.$('sel-panel-name');
  if (selPanelName) {
    selPanelName.addEventListener('change', () => {
      if (!app.selectedPanel) return;
      app._pushHistory();
      app.selectedPanel.name = selPanelName.value || app.selectedPanel.name;
      app._syncSelection();
      app._render();
    });
  }
  const selPanelMainBreakerInput = app.$('sel-panel-main-breaker-input');
  if (selPanelMainBreakerInput) {
    selPanelMainBreakerInput.addEventListener('change', () => {
      if (!app.selectedPanel) return;
      app._pushHistory();
      app.selectedPanel.mainBreakerA = Math.max(1, parseInt(selPanelMainBreakerInput.value) || app.selectedPanel.mainBreakerA);
      selPanelMainBreakerInput.value = String(app.selectedPanel.mainBreakerA);
      app._syncSelection();
      app._render();
    });
  }
  const addCircuitBtn = app.$('btn-panel-add-circuit');
  if (addCircuitBtn) {
    addCircuitBtn.addEventListener('click', () => {
      if (!app.selectedPanel) return;
      app._addCircuitToPanel(app.selectedPanel);
    });
  }

  // Selected electrical symbol load/circuit
  const selElecLoadInput = app.$('sel-electrical-load-a');
  if (selElecLoadInput) {
    selElecLoadInput.addEventListener('change', () => {
      if (!app.selectedElectricalSymbol) return;
      app._pushHistory();
      app.selectedElectricalSymbol.amperageA = Math.max(0.1, parseFloat(selElecLoadInput.value) || CONFIG.DEFAULT_SYMBOL_AMPERAGE_A);
      selElecLoadInput.value = String(app.selectedElectricalSymbol.amperageA);
      app._syncSelection();
      app._render();
    });
  }
  const selElecCircuitSelect = app.$('sel-electrical-circuit-select');
  if (selElecCircuitSelect) {
    selElecCircuitSelect.addEventListener('change', () => {
      if (!app.selectedElectricalSymbol) return;
      app._pushHistory();
      app.selectedElectricalSymbol.circuitId = selElecCircuitSelect.value;
      app._syncSelection();
      app._render();
    });
  }

  // Selected pipe flow direction
  for (const btn of app.$$('#sel-pipe-flow-group .prop-btn')) {
    btn.addEventListener('click', () => {
      if (!app.selectedPipe) return;
      app._pushHistory(); app.selectedPipe.flowDir = parseInt(btn.dataset.value);
      app._syncSelection(); app._render();
    });
  }

  // Selected electrical symbol rotation
  for (const btn of app.$$('#sel-electrical-symbol-rotation-group .prop-btn')) {
    btn.addEventListener('click', () => {
      if (!app.selectedElectricalSymbol) return;
      app._pushHistory(); app.selectedElectricalSymbol.rotation = parseInt(btn.dataset.value);
      app._syncSelection(); app._render();
    });
  }

  // Selected plumbing symbol rotation
  for (const btn of app.$$('#sel-plumbing-symbol-rotation-group .prop-btn')) {
    btn.addEventListener('click', () => {
      if (!app.selectedPlumbingSymbol) return;
      app._pushHistory(); app.selectedPlumbingSymbol.rotation = parseInt(btn.dataset.value);
      app._syncSelection(); app._render();
    });
  }

  // Selected furniture rotation
  for (const btn of app.$$('#sel-furniture-rotation-group .prop-btn')) {
    btn.addEventListener('click', () => {
      if (!app.selectedFurniture) return;
      app._pushHistory(); app.selectedFurniture.rotation = parseInt(btn.dataset.value);
      app._syncSelection(); app._render();
    });
  }

  // Delete buttons
  for (const btn of app.$$('.btn-delete-selected')) {
    btn.addEventListener('click', () => app._deleteSelected());
  }

  // ── Snap & Grid ────────────────────────────

  app.$('grid-size').addEventListener('change', e => { app.gridSize = parseInt(e.target.value); app._render(); });
  app.$('snap-grid').addEventListener('change', e => { app.snapGrid = e.target.checked; });
  app.$('snap-angle').addEventListener('change', e => { app.snapAngle = e.target.checked; });
  app.$('snap-angle-deg').addEventListener('change', e => { app.snapAngleDeg = parseInt(e.target.value); });
  app.$('snap-endpoint').addEventListener('change', e => { app.snapEndpoint = e.target.checked; });

  // ── History ────────────────────────────────

  app.$('btn-undo').addEventListener('click', () => app._undo());
  app.$('btn-redo').addEventListener('click', () => app._redo());

  // ── 3D ─────────────────────────────────────

  app.$('btn-3d').addEventListener('click', () => app._toggle3D());
  app.$('btn-nav-mode').addEventListener('click', () => app._toggleNavMode());

  // ── Tab switching ──────────────────────────

  for (const btn of app.$$('.top-tab')) {
    btn.addEventListener('click', () => app._switchTab(btn.dataset.tab));
  }

  // ── Costs tab ──────────────────────────────

  app.$('costs-copy').addEventListener('click', () => app.costsView.copyClipboard());
  app.$('costs-csv').addEventListener('click', () => app.costsView.downloadCSV());

  // ── Stories ────────────────────────────────

  app.$('btn-add-story').addEventListener('click', () => app._addStory());
  app.$('btn-remove-story').addEventListener('click', () => app._removeStory());

  // ── Project tab ────────────────────────────

  // Terrain
  app.$('proj-terrain-width').addEventListener('change', e => {
    const nextWidth = Math.max(100, Number.isFinite(parseFloat(e.target.value))
      ? parseFloat(e.target.value) * 100
      : app.terrainWidth);
    app.terrainWidth = Number.isFinite(nextWidth) ? nextWidth : CONFIG.DEFAULT_TERRAIN_WIDTH;
    app._centerView(); app._render(); app._schedulePersist();
  });
  app.$('proj-terrain-height').addEventListener('change', e => {
    const nextHeight = Math.max(100, Number.isFinite(parseFloat(e.target.value))
      ? parseFloat(e.target.value) * 100
      : app.terrainHeight);
    app.terrainHeight = Number.isFinite(nextHeight) ? nextHeight : CONFIG.DEFAULT_TERRAIN_HEIGHT;
    app._centerView(); app._render(); app._schedulePersist();
  });
  app.$('proj-show-terrain').addEventListener('change', e => {
    app.showTerrain = e.target.checked; app._render(); app._schedulePersist();
  });

  // Axis origin
  bindBtnGroup(app, '#proj-axis-origin-group .prop-btn', btn => {
    app.axisOrigin = btn.dataset.value;
    app._centerView(); app._render(); app._schedulePersist();
  });

  // Name
  app.$('project-name').addEventListener('change', e => {
    app.projectName = e.target.value || 'Untitled Project';
    app._schedulePersist();
  });

  // Export/import
  app.$('proj-export-png').addEventListener('click', () => app._exportPNG());
  app.$('proj-export-json').addEventListener('click', () => app._exportJSON());
  app.$('proj-import-json').addEventListener('click', () => app.$('proj-import-file').click());
  app.$('proj-import-file').addEventListener('change', e => app._importJSON(e));

  app.$('btn-plan-review').addEventListener('click', () => app.runPlanReview());

  // Share
  app.$('share-encrypt').addEventListener('change', e => {
    app.$('share-password-row').style.display = e.target.checked ? '' : 'none';
  });
  app.$('btn-share').addEventListener('click', () => app._shareProject());
  app.$('share-url').addEventListener('click', () => {
    const input = app.$('share-url');
    input.select();
    navigator.clipboard.writeText(input.value);
    app._status('Share link copied');
  });

  app._refreshCircuitSelects();
}

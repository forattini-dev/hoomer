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

function bindSelectedOptionGroup(app, selector, getTarget, mutate, afterUpdate) {
  for (const btn of app.$$(selector)) {
    btn.addEventListener('click', () => {
      const target = getTarget();
      if (!target) return;
      app._pushHistory();
      mutate(target, btn);
      if (afterUpdate) afterUpdate(target, btn);
      app._syncSelection();
      app._render();
    });
  }
}

function bindIfExists(app, idOrSelector, event, handler, options) {
  const el = app.$(idOrSelector);
  if (!el) return;
  el.addEventListener(event, handler, options);
}

export function bindUI(app) {
  // Tool buttons
  for (const btn of app.$$('.tool-btn')) {
    btn.addEventListener('click', () => app._setTool(btn.dataset.tool));
  }
  bindIfExists(app, 'btn-open-mobile-tools', 'click', () => app._openMobilePanel('tools'));
  bindIfExists(app, 'btn-open-mobile-props', 'click', () => app._openMobilePanel('props'));
  bindIfExists(app, 'btn-mobile-close-tools', 'click', () => app._closeMobilePanel());
  bindIfExists(app, 'btn-mobile-close-props', 'click', () => app._closeMobilePanel());
  bindIfExists(app, 'mobile-panel-backdrop', 'click', () => app._closeMobilePanel());

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
  bindIfExists(app, 'panel-name-prefix', 'input', () => {
    const panelNamePrefixInput = app.$('panel-name-prefix');
    if (!panelNamePrefixInput) return;
    app.panelNamePrefix = panelNamePrefixInput.value || 'QD';
  });
  bindBtnGroup(app, '#panel-voltage-group .prop-btn', btn => { app.panelVoltage = parseInt(btn.dataset.value); });
  bindBtnGroup(app, '#panel-phases-group .prop-btn', btn => { app.panelPhases = parseInt(btn.dataset.value); });
  bindBtnGroup(app, '#panel-main-breaker-group .prop-btn', btn => { app.panelMainBreakerA = parseInt(btn.dataset.value); });
  // Electrical symbol type
  bindBtnGroup(app, '#elec-symbol-type-group .prop-btn', btn => { app.electricalSymbolType = btn.dataset.value; });
  // Electrical symbol rotation
  bindBtnGroup(app, '#elec-symbol-rotation-group .prop-btn', btn => { app.electricalSymbolRotation = parseInt(btn.dataset.value); });
  bindIfExists(app, 'elec-load-a', 'change', () => {
    const elecLoadInput = app.$('elec-load-a');
    if (!elecLoadInput) return;
    app.electricalLoadA = Math.max(0.1, parseFloat(elecLoadInput.value) || CONFIG.DEFAULT_SYMBOL_AMPERAGE_A);
    elecLoadInput.value = String(app.electricalLoadA);
  });
  bindIfExists(app, 'elec-circuit-select', 'change', () => {
    const elecCircuitSelect = app.$('elec-circuit-select');
    if (!elecCircuitSelect) return;
    app.electricalCircuitId = elecCircuitSelect.value;
  });

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
  bindSelectedOptionGroup(app, '#sel-thickness-group .prop-btn', () => app.selectedWall, (wall, btn) => {
    wall.thickness = parseInt(btn.dataset.value);
  });
  // Selected wall material
  bindSelectedOptionGroup(app, '#sel-material-group .material-btn', () => app.selectedWall, (wall, btn) => {
    wall.material = btn.dataset.material;
  });

  // Selected door controls
  bindSelectedOptionGroup(app, '#sel-door-type-group .prop-btn', () => app.selectedDoor, (door, btn) => {
    door.doorType = btn.dataset.value;
    app.$$('#sel-door-type-group .prop-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.value === btn.dataset.value));
  });
  bindSelectedOptionGroup(app, '#sel-door-width-group .prop-btn', () => app.selectedDoor, (door, btn) => {
    door.width = parseInt(btn.dataset.value);
  });
  bindIfExists(app, 'btn-flip-hinge', 'click', () => {
    if (!app.selectedDoor) return;
    app._pushHistory();
    app.selectedDoor.hingeSide = app.selectedDoor.hingeSide === 'left' ? 'right' : 'left';
    app._syncSelection(); app._render();
  });
  bindIfExists(app, 'btn-flip-open', 'click', () => {
    if (!app.selectedDoor) return;
    app._pushHistory();
    app.selectedDoor.openDir *= -1;
    app._syncSelection(); app._render();
  });

  // Selected window controls
  bindSelectedOptionGroup(app, '#sel-window-type-group .prop-btn', () => app.selectedWindow, (win, btn) => {
    win.windowType = btn.dataset.value;
    app.$$('#sel-window-type-group .prop-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.value === btn.dataset.value));
  });
  bindSelectedOptionGroup(app, '#sel-window-width-group .prop-btn', () => app.selectedWindow, (win, btn) => {
    win.width = parseInt(btn.dataset.value);
  });

  // Selected stair controls
  bindSelectedOptionGroup(app, '#sel-stair-rotation-group .prop-btn', () => app.selectedStair, (stair, btn) => {
    stair.rotation = parseInt(btn.dataset.value);
  });

  // Selected label controls
  bindIfExists(app, 'sel-label-text', 'input', () => {
    const selLabelText = app.$('sel-label-text');
    if (!selLabelText || !app.selectedLabel) return;
    if (!app._labelEditActive) {
      app._pushHistory();
      app._labelEditActive = true;
    }
    app.selectedLabel.text = selLabelText.value;
    app._render();
  });
  bindIfExists(app, 'sel-label-text', 'blur', () => {
    app._labelEditActive = false;
  });
  bindIfExists(app, 'sel-label-text', 'keydown', (e) => {
    const selLabelText = app.$('sel-label-text');
    if (!selLabelText) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      selLabelText.blur();
    }
  });
  bindSelectedOptionGroup(app, '#sel-label-fontsize-group .prop-btn', () => app.selectedLabel, (label, btn) => {
    label.fontSize = parseInt(btn.dataset.value);
  });

  // Selected wire gauge
  bindSelectedOptionGroup(app, '#sel-wire-gauge-group .prop-btn', () => app.selectedWire, (wire, btn) => {
    wire.gauge = parseFloat(btn.dataset.value);
  });

  // Selected panel controls
  bindIfExists(app, 'sel-panel-name', 'change', () => {
    const selPanelName = app.$('sel-panel-name');
    if (!selPanelName || !app.selectedPanel) return;
    app._pushHistory();
    app.selectedPanel.name = selPanelName.value || app.selectedPanel.name;
    app._syncSelection();
    app._render();
  });
  bindIfExists(app, 'sel-panel-main-breaker-input', 'change', () => {
    const selPanelMainBreakerInput = app.$('sel-panel-main-breaker-input');
    if (!selPanelMainBreakerInput || !app.selectedPanel) return;
    app._pushHistory();
    app.selectedPanel.mainBreakerA = Math.max(1, parseInt(selPanelMainBreakerInput.value) || app.selectedPanel.mainBreakerA);
    selPanelMainBreakerInput.value = String(app.selectedPanel.mainBreakerA);
    app._syncSelection();
    app._render();
  });
  bindIfExists(app, 'btn-panel-add-circuit', 'click', () => {
    if (!app.selectedPanel) return;
    app._addCircuitToPanel(app.selectedPanel);
  });

  // Selected electrical symbol load/circuit
  bindIfExists(app, 'sel-electrical-load-a', 'change', () => {
    const selElecLoadInput = app.$('sel-electrical-load-a');
    if (!selElecLoadInput || !app.selectedElectricalSymbol) return;
    app._pushHistory();
    app.selectedElectricalSymbol.amperageA = Math.max(0.1, parseFloat(selElecLoadInput.value) || CONFIG.DEFAULT_SYMBOL_AMPERAGE_A);
    selElecLoadInput.value = String(app.selectedElectricalSymbol.amperageA);
    app._syncSelection();
    app._render();
  });
  bindIfExists(app, 'sel-electrical-circuit-select', 'change', () => {
    const selElecCircuitSelect = app.$('sel-electrical-circuit-select');
    if (!selElecCircuitSelect || !app.selectedElectricalSymbol) return;
    app._pushHistory();
    app.selectedElectricalSymbol.circuitId = selElecCircuitSelect.value;
    app._syncSelection();
    app._render();
  });

  // Selected pipe flow direction
  bindSelectedOptionGroup(app, '#sel-pipe-flow-group .prop-btn', () => app.selectedPipe, (pipe, btn) => {
    pipe.flowDir = parseInt(btn.dataset.value);
  });

  // Selected electrical symbol rotation
  bindSelectedOptionGroup(app, '#sel-electrical-symbol-rotation-group .prop-btn', () => app.selectedElectricalSymbol, (symbol, btn) => {
    symbol.rotation = parseInt(btn.dataset.value);
  });

  // Selected plumbing symbol rotation
  bindSelectedOptionGroup(app, '#sel-plumbing-symbol-rotation-group .prop-btn', () => app.selectedPlumbingSymbol, (symbol, btn) => {
    symbol.rotation = parseInt(btn.dataset.value);
  });

  // Selected furniture rotation
  bindSelectedOptionGroup(app, '#sel-furniture-rotation-group .prop-btn', () => app.selectedFurniture, (furniture, btn) => {
    furniture.rotation = parseInt(btn.dataset.value);
  });

  // Delete buttons
  for (const btn of app.$$('.btn-delete-selected')) {
    btn.addEventListener('click', () => app._deleteSelected());
  }

  // ── Snap & Grid ────────────────────────────

  bindIfExists(app, 'grid-size', 'change', e => { app.gridSize = parseInt(e.target.value); app._render(); });
  bindIfExists(app, 'snap-grid', 'change', e => { app.snapGrid = e.target.checked; });
  bindIfExists(app, 'snap-angle', 'change', e => { app.snapAngle = e.target.checked; });
  bindIfExists(app, 'snap-angle-deg', 'change', e => { app.snapAngleDeg = parseInt(e.target.value); });
  bindIfExists(app, 'snap-endpoint', 'change', e => { app.snapEndpoint = e.target.checked; });

  // ── History ────────────────────────────────

  bindIfExists(app, 'btn-undo', 'click', () => app._undo());
  bindIfExists(app, 'btn-redo', 'click', () => app._redo());

  // ── 3D ─────────────────────────────────────

  bindIfExists(app, 'btn-3d', 'click', () => app._toggle3D());
  bindIfExists(app, 'btn-nav-mode', 'click', () => app._toggleNavMode());

  // ── Tab switching ──────────────────────────

  for (const btn of app.$$('.top-tab')) {
    btn.addEventListener('click', () => app._switchTab(btn.dataset.tab));
  }

  // ── Costs tab ──────────────────────────────

  bindIfExists(app, 'costs-copy', 'click', () => app.costsView.copyClipboard());
  bindIfExists(app, 'costs-csv', 'click', () => app.costsView.downloadCSV());

  // ── Stories ────────────────────────────────

  bindIfExists(app, 'btn-add-story', 'click', () => app._addStory());
  bindIfExists(app, 'btn-remove-story', 'click', () => app._removeStory());

  // ── Project tab ────────────────────────────

  // Terrain
  bindIfExists(app, 'proj-terrain-width', 'change', e => {
    const nextWidth = Math.max(100, Number.isFinite(parseFloat(e.target.value))
      ? parseFloat(e.target.value) * 100
      : app.terrainWidth);
    app.terrainWidth = Number.isFinite(nextWidth) ? nextWidth : CONFIG.DEFAULT_TERRAIN_WIDTH;
    app._centerView(); app._render(); app._schedulePersist();
  });
  bindIfExists(app, 'proj-terrain-height', 'change', e => {
    const nextHeight = Math.max(100, Number.isFinite(parseFloat(e.target.value))
      ? parseFloat(e.target.value) * 100
      : app.terrainHeight);
    app.terrainHeight = Number.isFinite(nextHeight) ? nextHeight : CONFIG.DEFAULT_TERRAIN_HEIGHT;
    app._centerView(); app._render(); app._schedulePersist();
  });
  bindIfExists(app, 'proj-show-terrain', 'change', e => {
    app.showTerrain = e.target.checked; app._render(); app._schedulePersist();
  });

  // Axis origin
  bindBtnGroup(app, '#proj-axis-origin-group .prop-btn', btn => {
    app.axisOrigin = btn.dataset.value;
    app._centerView(); app._render(); app._schedulePersist();
  });

  // Name
  bindIfExists(app, 'project-name', 'change', e => {
    app.projectName = e.target.value || 'Untitled Project';
    app._schedulePersist();
  });

  // Export/import
  bindIfExists(app, 'proj-export-png', 'click', () => app._exportPNG());
  bindIfExists(app, 'proj-export-json', 'click', () => app._exportJSON());
  bindIfExists(app, 'proj-import-json', 'click', () => {
    const importInput = app.$('proj-import-file');
    if (importInput) importInput.click();
  });
  bindIfExists(app, 'proj-import-file', 'change', e => app._importJSON(e));

  bindIfExists(app, 'btn-plan-review', 'click', () => app.runPlanReview());

  // Share
  bindIfExists(app, 'share-encrypt', 'change', e => {
    const row = app.$('share-password-row');
    if (!row) return;
    row.style.display = e.target.checked ? '' : 'none';
  });
  bindIfExists(app, 'btn-share', 'click', () => app._shareProject());
  bindIfExists(app, 'share-url', 'click', () => {
    const input = app.$('share-url');
    if (!input) return;
    input.select();
    navigator.clipboard.writeText(input.value);
    app._status('Share link copied');
  });

  app._refreshCircuitSelects();
}

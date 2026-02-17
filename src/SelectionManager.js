// ── SelectionManager.js ─────────────────────────
// Manages selection state, hit-test selection, erase, delete, and
// selection-panel UI synchronisation.

import {
  CONFIG,
  ALL_TOOL_PROP_PANEL_IDS,
  TOOL_PANEL_MAP,
} from './config.js';
import { Geom } from './geometry.js';
import { getCircuitsForPanel, getPanelElectricalStatus } from './ElectricalCalc.js';
import { SELECTION_ALIASES } from './SelectionState.js';

export class SelectionManager {
  constructor(app) {
    this.app = app;
  }

  // ── Clear ────────────────────────────────────
  clear() {
    const app = this.app;
    if (app.selectionState && typeof app.selectionState.clear === 'function') {
      app.selectionState.clear();
    } else {
      for (const alias of SELECTION_ALIASES) {
        app[alias] = null;
      }
    }
    app._labelEditActive = false;
  }

  // ── Select at world coords ───────────────────
  selectAt(wx, wy) {
    const app = this.app;
    this.clear();

    const specsByLayer = this._getSelectionSpecs();
    const layerSpecs = specsByLayer[app.activeLayer] || [];
    for (const spec of layerSpecs) {
      if (spec.when && !spec.when()) continue;
      const hit = this._hitTest(spec.getItems(), wx, wy);
      if (!hit) continue;
      spec.setSelected(hit);
      break;
    }

    this.syncUI();
    app._render();
  }

  // ── Erase at world coords ────────────────────
  eraseAt(wx, wy) {
    const app = this.app;
    const specsByLayer = this._getEraseSpecs();
    const layerSpecs = specsByLayer[app.activeLayer] || [];

    for (const spec of layerSpecs) {
      const items = spec.getItems();
      const index = this._hitIndex(items, wx, wy);
      if (index < 0) continue;

      const target = items[index];
      app._pushHistory();
      spec.erase(index, target);
      this.syncUI();
      app._status(spec.message);
      app._render();
      return;
    }
  }

  // ── Delete currently selected entity ─────────
  deleteSelected() {
    const app = this.app;
    const specs = this._getDeleteSpecs();
    for (const spec of specs) {
      const target = spec.getSelected();
      if (!target) continue;

      app._pushHistory();
      spec.remove(target);
      this.syncUI();
      app._status(spec.message);
      app._render();
      return;
    }
  }

  _hitTest(items, wx, wy) {
    for (let i = items.length - 1; i >= 0; i -= 1) {
      if (items[i].hitTest(wx, wy)) return items[i];
    }
    return null;
  }

  _hitIndex(items, wx, wy) {
    for (let i = items.length - 1; i >= 0; i -= 1) {
      if (items[i].hitTest(wx, wy)) return i;
    }
    return -1;
  }

  _getSelectionSpecs() {
    const app = this.app;
    return {
      structure: [
        { getItems: () => app.doors, setSelected: (item) => { app.selectedDoor = item; } },
        { getItems: () => app.windows, setSelected: (item) => { app.selectedWindow = item; } },
        { getItems: () => app.labels, setSelected: (item) => { app.selectedLabel = item; } },
        { getItems: () => app.stairs, setSelected: (item) => { app.selectedStair = item; } },
        { getItems: () => app.walls, setSelected: (item) => { app.selectedWall = item; } },
        {
          getItems: () => app.floors,
          when: () => !app.selectedWall,
          setSelected: (item) => { app.selectedFloor = item; },
        },
      ],
      electrical: [
        { getItems: () => app.panels, setSelected: (item) => { app.selectedPanel = item; } },
        { getItems: () => app.electricalSymbols, setSelected: (item) => { app.selectedElectricalSymbol = item; } },
        { getItems: () => app.wires, setSelected: (item) => { app.selectedWire = item; } },
      ],
      plumbing: [
        { getItems: () => app.plumbingSymbols, setSelected: (item) => { app.selectedPlumbingSymbol = item; } },
        { getItems: () => app.pipes, setSelected: (item) => { app.selectedPipe = item; } },
      ],
      furniture: [
        { getItems: () => app.furnitureItems, setSelected: (item) => { app.selectedFurniture = item; } },
      ],
    };
  }

  _cleanupPanel(target) {
    const app = this.app;
    const circuitIds = getCircuitsForPanel(app.circuits, target.id).map(c => c.id);
    app.circuits = app.circuits.filter(c => c.panelId !== target.id);
    app.electricalSymbols.forEach(sym => {
      if (circuitIds.includes(sym.circuitId)) sym.circuitId = '';
    });
    this.refreshCircuitSelects();
  }

  _getEraseSpecs() {
    const app = this.app;
    return {
      structure: [
        {
          getItems: () => app.doors,
          erase: (_index, target) => {
            app.doors.splice(_index, 1);
            if (app.selectedDoor === target) app.selectedDoor = null;
          },
          message: 'Door deleted',
        },
        {
          getItems: () => app.windows,
          erase: (_index, target) => {
            app.windows.splice(_index, 1);
            if (app.selectedWindow === target) app.selectedWindow = null;
          },
          message: 'Window deleted',
        },
        {
          getItems: () => app.labels,
          erase: (_index, target) => {
            app.labels.splice(_index, 1);
            if (app.selectedLabel === target) app.selectedLabel = null;
          },
          message: 'Label deleted',
        },
        {
          getItems: () => app.stairs,
          erase: (_index, target) => {
            app.stairs.splice(_index, 1);
            if (app.selectedStair === target) app.selectedStair = null;
          },
          message: 'Stair deleted',
        },
        {
          getItems: () => app.walls,
          erase: (_index, target) => {
            app.doors = app.doors.filter(d => d.wall !== target);
            app.windows = app.windows.filter(w => w.wall !== target);
            app.walls.splice(_index, 1);
            if (app.selectedWall === target) app.selectedWall = null;
            if (app.selectedDoor?.wall === target) app.selectedDoor = null;
            if (app.selectedWindow?.wall === target) app.selectedWindow = null;
          },
          message: 'Wall deleted',
        },
        {
          getItems: () => app.floors,
          erase: (_index, target) => {
            app.floors.splice(_index, 1);
            if (app.selectedFloor === target) app.selectedFloor = null;
          },
          message: 'Floor deleted',
        },
      ],
      electrical: [
        {
          getItems: () => app.panels,
          erase: (_index, target) => {
            this._cleanupPanel(target);
            app.panels.splice(_index, 1);
            if (app.selectedPanel === target) app.selectedPanel = null;
          },
          message: 'Panel deleted',
        },
        {
          getItems: () => app.electricalSymbols,
          erase: (_index, target) => {
            app.electricalSymbols = app.electricalSymbols.filter(sym => sym !== target);
            if (app.selectedElectricalSymbol === target) app.selectedElectricalSymbol = null;
          },
          message: 'Symbol deleted',
        },
        {
          getItems: () => app.wires,
          erase: (_index, target) => {
            app.wires = app.wires.filter(wire => wire !== target);
            if (app.selectedWire === target) app.selectedWire = null;
          },
          message: 'Wire deleted',
        },
      ],
      plumbing: [
        {
          getItems: () => app.plumbingSymbols,
          erase: (_index, target) => {
            app.plumbingSymbols = app.plumbingSymbols.filter(sym => sym !== target);
            if (app.selectedPlumbingSymbol === target) app.selectedPlumbingSymbol = null;
          },
          message: 'Symbol deleted',
        },
        {
          getItems: () => app.pipes,
          erase: (_index, target) => {
            app.pipes = app.pipes.filter(pipe => pipe !== target);
            if (app.selectedPipe === target) app.selectedPipe = null;
          },
          message: 'Pipe deleted',
        },
      ],
      furniture: [
        {
          getItems: () => app.furnitureItems,
          erase: (_index, target) => {
            app.furnitureItems = app.furnitureItems.filter(item => item !== target);
            if (app.selectedFurniture === target) app.selectedFurniture = null;
          },
          message: 'Furniture deleted',
        },
      ],
    };
  }

  _getDeleteSpecs() {
    const app = this.app;
    return [
      {
        getSelected: () => app.selectedDoor,
        remove: (target) => {
          app.doors = app.doors.filter(d => d !== target);
          app.selectedDoor = null;
        },
        message: 'Door deleted',
      },
      {
        getSelected: () => app.selectedWindow,
        remove: (target) => {
          app.windows = app.windows.filter(w => w !== target);
          app.selectedWindow = null;
        },
        message: 'Window deleted',
      },
      {
        getSelected: () => app.selectedLabel,
        remove: (target) => {
          app.labels = app.labels.filter(l => l !== target);
          app.selectedLabel = null;
        },
        message: 'Label deleted',
      },
      {
        getSelected: () => app.selectedStair,
        remove: (target) => {
          app.stairs = app.stairs.filter(s => s !== target);
          app.selectedStair = null;
        },
        message: 'Stair deleted',
      },
      {
        getSelected: () => app.selectedWall,
        remove: (target) => {
          app.doors = app.doors.filter(d => d.wall !== target);
          app.windows = app.windows.filter(w => w.wall !== target);
          app.walls = app.walls.filter(w => w !== target);
          if (app.selectedDoor?.wall === target) app.selectedDoor = null;
          if (app.selectedWindow?.wall === target) app.selectedWindow = null;
          app.selectedWall = null;
        },
        message: 'Wall deleted',
      },
      {
        getSelected: () => app.selectedFloor,
        remove: (target) => {
          app.floors = app.floors.filter(f => f !== target);
          app.selectedFloor = null;
        },
        message: 'Floor deleted',
      },
      {
        getSelected: () => app.selectedWire,
        remove: (target) => {
          app.wires = app.wires.filter(w => w !== target);
          app.selectedWire = null;
        },
        message: 'Wire deleted',
      },
      {
        getSelected: () => app.selectedPanel,
        remove: (target) => {
          this._cleanupPanel(target);
          app.panels = app.panels.filter(p => p !== target);
          app.selectedPanel = null;
        },
        message: 'Panel deleted',
      },
      {
        getSelected: () => app.selectedElectricalSymbol,
        remove: (target) => {
          app.electricalSymbols = app.electricalSymbols.filter(s => s !== target);
          app.selectedElectricalSymbol = null;
        },
        message: 'Symbol deleted',
      },
      {
        getSelected: () => app.selectedPipe,
        remove: (target) => {
          app.pipes = app.pipes.filter(p => p !== target);
          app.selectedPipe = null;
        },
        message: 'Pipe deleted',
      },
      {
        getSelected: () => app.selectedPlumbingSymbol,
        remove: (target) => {
          app.plumbingSymbols = app.plumbingSymbols.filter(s => s !== target);
          app.selectedPlumbingSymbol = null;
        },
        message: 'Symbol deleted',
      },
      {
        getSelected: () => app.selectedFurniture,
        remove: (target) => {
          app.furnitureItems = app.furnitureItems.filter(item => item !== target);
          app.selectedFurniture = null;
        },
        message: 'Furniture deleted',
      },
    ];
  }

  // ── Sync selection panel UI ──────────────────
  syncUI() {
    const app = this.app;
    const $ = id => app.$(id);
    const $$ = sel => app.$$(sel);

    for (const id of ALL_TOOL_PROP_PANEL_IDS) {
      const el = $(id);
      if (el) el.style.display = 'none';
    }

    if (app.selectedLabel) {
      const lp = $('sel-label-props');
      if (lp) {
        lp.style.display = '';
        const lb = app.selectedLabel;
        $('sel-label-text').value = lb.text;
        $$('#sel-label-fontsize-group .prop-btn').forEach(b =>
          b.classList.toggle('active', parseInt(b.dataset.value) === lb.fontSize));
      }
    } else if (app.selectedWall) {
      $('selection-props').style.display = '';
      const w = app.selectedWall;
      $('sel-length').textContent = Geom.formatLength(w.length);
      $('sel-thickness').textContent = w.thickness + 'cm';
      $('sel-material').textContent = w.material;
      $('sel-angle').textContent = Math.abs(w.angleDeg).toFixed(1) + '\u00B0';
      $$('#sel-thickness-group .prop-btn').forEach(b =>
        b.classList.toggle('active', parseInt(b.dataset.value) === w.thickness));
      $$('#sel-material-group .material-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.material === w.material));
    } else if (app.selectedDoor) {
      const dp = $('sel-door-props');
      if (dp) {
        dp.style.display = '';
        const door = app.selectedDoor;
        $('sel-door-width').textContent = door.width + 'cm';
        $('sel-door-type').textContent = door.doorType === 'single' ? 'Single' : door.doorType === 'double' ? 'Double' : 'Sliding';
        $('sel-door-hinge').textContent = door.hingeSide === 'left' ? 'Left' : 'Right';
        $$('#sel-door-type-group .prop-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.value === door.doorType));
        $$('#sel-door-width-group .prop-btn').forEach(b =>
          b.classList.toggle('active', parseInt(b.dataset.value) === door.width));
        const hingeWrap = $('sel-door-hinge-wrap');
        const openWrap = $('sel-door-opendir-wrap');
        if (hingeWrap) hingeWrap.style.display = door.doorType === 'single' ? '' : 'none';
        if (openWrap) openWrap.style.display = door.doorType === 'sliding' ? 'none' : '';
      }
    } else if (app.selectedWindow) {
      const wp = $('sel-window-props');
      if (wp) {
        wp.style.display = '';
        const win = app.selectedWindow;
        $('sel-window-width').textContent = win.width + 'cm';
        $('sel-window-type').textContent = win.windowType === 'fixed' ? 'Fixed' : win.windowType === 'sliding' ? 'Sliding' : 'Casement';
        $$('#sel-window-type-group .prop-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.value === win.windowType));
        $$('#sel-window-width-group .prop-btn').forEach(b =>
          b.classList.toggle('active', parseInt(b.dataset.value) === win.width));
      }
    } else if (app.selectedStair) {
      const sp = $('sel-stair-props');
      if (sp) {
        sp.style.display = '';
        $('sel-stair-size').textContent =
          `${app.selectedStair.width}x${app.selectedStair.length} cm`;
        $('sel-stair-rot').textContent = app.selectedStair.rotation + '\u00B0';
        $$('#sel-stair-rotation-group .prop-btn').forEach(b =>
          b.classList.toggle('active', parseInt(b.dataset.value) === app.selectedStair.rotation));
      }
    } else if (app.selectedPanel) {
      const pp = $('sel-panel-props');
      if (pp) {
        pp.style.display = '';
        const panel = app.selectedPanel;
        const status = getPanelElectricalStatus(app.panels, app.circuits, app.electricalSymbols,panel.id);
        $('sel-panel-name').value = panel.name;
        $('sel-panel-voltage').textContent = `${panel.voltage}V`;
        $('sel-panel-phases').textContent = `${panel.phases}\u03C6`;
        $('sel-panel-main-breaker').textContent = `${panel.mainBreakerA}A`;
        $('sel-panel-main-breaker-input').value = String(panel.mainBreakerA);
        const alert = $('sel-panel-alert');
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
        this._renderPanelCircuits(panel);
      }
    } else if (app.selectedWire) {
      const wp = $('sel-wire-props');
      if (wp) {
        wp.style.display = '';
        $('sel-wire-gauge').textContent = app.selectedWire.gauge + 'mm\u00B2';
        $('sel-wire-length').textContent = Geom.formatLength(app.selectedWire.totalLength);
        $('sel-wire-points').textContent = app.selectedWire.points.length;
        $$('#sel-wire-gauge-group .prop-btn').forEach(b =>
          b.classList.toggle('active', parseFloat(b.dataset.value) === app.selectedWire.gauge));
      }
    } else if (app.selectedElectricalSymbol) {
      const ep = $('sel-electrical-symbol-props');
      if (ep) {
        ep.style.display = '';
        $('sel-electrical-symbol-type').textContent = CONFIG.ELECTRICAL_SYMBOL_LABELS[app.selectedElectricalSymbol.symbolType] || app.selectedElectricalSymbol.symbolType;
        const circuit = app.circuits.find(c => c.id === app.selectedElectricalSymbol.circuitId);
        $('sel-electrical-symbol-circuit').textContent = circuit ? `${circuit.name}` : 'None';
        const load = Math.max(0.1, Number(app.selectedElectricalSymbol.amperageA) || CONFIG.DEFAULT_SYMBOL_AMPERAGE_A);
        $('sel-electrical-load-a').value = String(load);
        this.fillCircuitSelect('sel-electrical-circuit-select', app.selectedElectricalSymbol.circuitId);
        $$('#sel-electrical-symbol-rotation-group .prop-btn').forEach(b =>
          b.classList.toggle('active', parseInt(b.dataset.value) === app.selectedElectricalSymbol.rotation));
      }
    } else if (app.selectedPipe) {
      const pp = $('sel-pipe-props');
      if (pp) {
        pp.style.display = '';
        $('sel-pipe-type').textContent = CONFIG.PIPE_LABELS[app.selectedPipe.pipeType] || app.selectedPipe.pipeType;
        $('sel-pipe-diameter').textContent = '\u00D8' + app.selectedPipe.diameter + 'mm';
        $('sel-pipe-length').textContent = Geom.formatLength(app.selectedPipe.totalLength);
        $$('#sel-pipe-flow-group .prop-btn').forEach(b =>
          b.classList.toggle('active', parseInt(b.dataset.value) === (app.selectedPipe.flowDir || 1)));
      }
    } else if (app.selectedPlumbingSymbol) {
      const pp = $('sel-plumbing-symbol-props');
      if (pp) {
        pp.style.display = '';
        $('sel-plumbing-symbol-type').textContent = CONFIG.PLUMBING_SYMBOL_LABELS[app.selectedPlumbingSymbol.symbolType] || app.selectedPlumbingSymbol.symbolType;
        $$('#sel-plumbing-symbol-rotation-group .prop-btn').forEach(b =>
          b.classList.toggle('active', parseInt(b.dataset.value) === app.selectedPlumbingSymbol.rotation));
      }
    } else if (app.selectedFurniture) {
      const fp = $('sel-furniture-props');
      if (fp) {
        fp.style.display = '';
        const cat = CONFIG.FURNITURE_CATALOG[app.selectedFurniture.furnitureType];
        $('sel-furniture-type').textContent = cat ? cat.label : app.selectedFurniture.furnitureType;
        $('sel-furniture-size').textContent = cat ? `${cat.w}×${cat.d} cm` : '—';
        $$('#sel-furniture-rotation-group .prop-btn').forEach(b =>
          b.classList.toggle('active', parseInt(b.dataset.value) === app.selectedFurniture.rotation));
      }
    } else {
      const panelId = TOOL_PANEL_MAP[app.activeTool] || '';
      if (panelId) {
        const el = $(panelId);
        if (el) el.style.display = '';
      }
    }
  }

  // ── Circuit select helpers ───────────────────
  fillCircuitSelect(selectId, selectedId = '') {
    const app = this.app;
    const select = app.$(selectId);
    if (!select) return;
    const chosen = selectedId || '';
    select.innerHTML = '<option value="">No circuit</option>';
    for (const c of app.circuits) {
      const panel = app.panels.find(p => p.id === c.panelId);
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = panel ? `${panel.name} / ${c.name}` : c.name;
      select.appendChild(opt);
    }
    select.value = chosen;
    if (select.value !== chosen) select.value = '';
  }

  refreshCircuitSelects() {
    const app = this.app;
    this.fillCircuitSelect('elec-circuit-select', app.electricalCircuitId);
    if (!app.electricalCircuitId && app.circuits.length) {
      app.electricalCircuitId = app.circuits[0].id;
      this.fillCircuitSelect('elec-circuit-select', app.electricalCircuitId);
    }
    if (app.selectedElectricalSymbol) {
      this.fillCircuitSelect('sel-electrical-circuit-select', app.selectedElectricalSymbol.circuitId);
    }
  }

  // ── Render circuit list for selected panel ───
  _renderPanelCircuits(panel) {
    const app = this.app;
    const container = app.$('sel-panel-circuits-list');
    if (!container) return;
    const status = getPanelElectricalStatus(app.panels, app.circuits, app.electricalSymbols,panel.id);
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
        const circuit = app.circuits.find(c => c.id === id);
        if (!circuit) return;
        app._pushHistory();
        if (field === 'name') circuit.name = input.value || circuit.name;
        if (field === 'breakerA') circuit.breakerA = Math.max(1, parseInt(input.value) || circuit.breakerA);
        this.refreshCircuitSelects();
        this.syncUI();
        app._render();
      });
    });

    container.querySelectorAll('button[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.circuitId;
        app._pushHistory();
        app.circuits = app.circuits.filter(c => c.id !== id);
        app.electricalSymbols.forEach(sym => { if (sym.circuitId === id) sym.circuitId = ''; });
        this.refreshCircuitSelects();
        this.syncUI();
        app._render();
      });
    });
  }
}

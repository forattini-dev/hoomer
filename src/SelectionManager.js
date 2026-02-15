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

const SELECTABLE_FIELDS = [
  'selectedWall',
  'selectedFloor',
  'selectedDoor',
  'selectedWindow',
  'selectedStair',
  'selectedLabel',
  'selectedWire',
  'selectedPanel',
  'selectedElectricalSymbol',
  'selectedPipe',
  'selectedPlumbingSymbol',
  'selectedFurniture',
];

export class SelectionManager {
  constructor(app) {
    this.app = app;
  }

  // ── Clear ────────────────────────────────────
  clear() {
    const app = this.app;
    for (const f of SELECTABLE_FIELDS) app[f] = null;
    app._labelEditActive = false;
  }

  // ── Select at world coords ───────────────────
  selectAt(wx, wy) {
    const app = this.app;
    this.clear();

    if (app.activeLayer === 'structure') {
      for (let i = app.doors.length - 1; i >= 0; i--) {
        if (app.doors[i].hitTest(wx, wy)) { app.selectedDoor = app.doors[i]; this.syncUI(); app._render(); return; }
      }
      for (let i = app.windows.length - 1; i >= 0; i--) {
        if (app.windows[i].hitTest(wx, wy)) { app.selectedWindow = app.windows[i]; this.syncUI(); app._render(); return; }
      }
      for (let i = app.labels.length - 1; i >= 0; i--) {
        if (app.labels[i].hitTest(wx, wy)) { app.selectedLabel = app.labels[i]; this.syncUI(); app._render(); return; }
      }
      for (let i = app.stairs.length - 1; i >= 0; i--) {
        if (app.stairs[i].hitTest(wx, wy)) { app.selectedStair = app.stairs[i]; this.syncUI(); app._render(); return; }
      }
      for (let i = app.walls.length - 1; i >= 0; i--) {
        if (app.walls[i].hitTest(wx, wy)) { app.selectedWall = app.walls[i]; break; }
      }
      if (!app.selectedWall) {
        for (let i = app.floors.length - 1; i >= 0; i--) {
          if (app.floors[i].hitTest(wx, wy)) { app.selectedFloor = app.floors[i]; break; }
        }
      }
    } else if (app.activeLayer === 'electrical') {
      for (let i = app.panels.length - 1; i >= 0; i--) {
        if (app.panels[i].hitTest(wx, wy)) { app.selectedPanel = app.panels[i]; this.syncUI(); app._render(); return; }
      }
      for (let i = app.electricalSymbols.length - 1; i >= 0; i--) {
        if (app.electricalSymbols[i].hitTest(wx, wy)) { app.selectedElectricalSymbol = app.electricalSymbols[i]; this.syncUI(); app._render(); return; }
      }
      for (let i = app.wires.length - 1; i >= 0; i--) {
        if (app.wires[i].hitTest(wx, wy)) { app.selectedWire = app.wires[i]; break; }
      }
    } else if (app.activeLayer === 'plumbing') {
      for (let i = app.plumbingSymbols.length - 1; i >= 0; i--) {
        if (app.plumbingSymbols[i].hitTest(wx, wy)) { app.selectedPlumbingSymbol = app.plumbingSymbols[i]; this.syncUI(); app._render(); return; }
      }
      for (let i = app.pipes.length - 1; i >= 0; i--) {
        if (app.pipes[i].hitTest(wx, wy)) { app.selectedPipe = app.pipes[i]; break; }
      }
    } else if (app.activeLayer === 'furniture') {
      for (let i = app.furnitureItems.length - 1; i >= 0; i--) {
        if (app.furnitureItems[i].hitTest(wx, wy)) {
          app.selectedFurniture = app.furnitureItems[i];
          this.syncUI(); app._render(); return;
        }
      }
    }
    this.syncUI();
    app._render();
  }

  // ── Erase at world coords ────────────────────
  eraseAt(wx, wy) {
    const app = this.app;

    if (app.activeLayer === 'structure') {
      for (let i = app.doors.length - 1; i >= 0; i--) {
        if (app.doors[i].hitTest(wx, wy)) {
          app._pushHistory(); app.doors.splice(i, 1); app._status('Door removed'); app._render(); return;
        }
      }
      for (let i = app.windows.length - 1; i >= 0; i--) {
        if (app.windows[i].hitTest(wx, wy)) {
          app._pushHistory(); app.windows.splice(i, 1); app._status('Window removed'); app._render(); return;
        }
      }
      for (let i = app.labels.length - 1; i >= 0; i--) {
        if (app.labels[i].hitTest(wx, wy)) {
          app._pushHistory(); app.labels.splice(i, 1); app._status('Label removed'); app._render(); return;
        }
      }
      for (let i = app.stairs.length - 1; i >= 0; i--) {
        if (app.stairs[i].hitTest(wx, wy)) {
          app._pushHistory(); app.stairs.splice(i, 1); app._status('Stair removed'); app._render(); return;
        }
      }
      for (let i = app.walls.length - 1; i >= 0; i--) {
        if (app.walls[i].hitTest(wx, wy)) {
          app._pushHistory();
          const wall = app.walls[i];
          app.doors = app.doors.filter(d => d.wall !== wall);
          app.windows = app.windows.filter(w => w.wall !== wall);
          app.walls.splice(i, 1);
          app._status('Wall removed'); app._render(); return;
        }
      }
      for (let i = app.floors.length - 1; i >= 0; i--) {
        if (app.floors[i].hitTest(wx, wy)) {
          app._pushHistory(); app.floors.splice(i, 1); app._status('Floor removed'); app._render(); return;
        }
      }
    } else if (app.activeLayer === 'electrical') {
      for (let i = app.panels.length - 1; i >= 0; i--) {
        if (app.panels[i].hitTest(wx, wy)) {
          app._pushHistory();
          const panel = app.panels[i];
          const panelCircuits = getCircuitsForPanel(app.circuits,panel.id).map(c => c.id);
          app.circuits = app.circuits.filter(c => c.panelId !== panel.id);
          app.electricalSymbols.forEach(sym => {
            if (panelCircuits.includes(sym.circuitId)) sym.circuitId = '';
          });
          app.panels.splice(i, 1);
          this.refreshCircuitSelects();
          app._status('Panel removed');
          app._render();
          return;
        }
      }
      for (let i = app.electricalSymbols.length - 1; i >= 0; i--) {
        if (app.electricalSymbols[i].hitTest(wx, wy)) {
          app._pushHistory(); app.electricalSymbols.splice(i, 1); app._status('Symbol removed'); app._render(); return;
        }
      }
      for (let i = app.wires.length - 1; i >= 0; i--) {
        if (app.wires[i].hitTest(wx, wy)) {
          app._pushHistory(); app.wires.splice(i, 1); app._status('Wire removed'); app._render(); return;
        }
      }
    } else if (app.activeLayer === 'plumbing') {
      for (let i = app.plumbingSymbols.length - 1; i >= 0; i--) {
        if (app.plumbingSymbols[i].hitTest(wx, wy)) {
          app._pushHistory(); app.plumbingSymbols.splice(i, 1); app._status('Symbol removed'); app._render(); return;
        }
      }
      for (let i = app.pipes.length - 1; i >= 0; i--) {
        if (app.pipes[i].hitTest(wx, wy)) {
          app._pushHistory(); app.pipes.splice(i, 1); app._status('Pipe removed'); app._render(); return;
        }
      }
    } else if (app.activeLayer === 'furniture') {
      for (let i = app.furnitureItems.length - 1; i >= 0; i--) {
        if (app.furnitureItems[i].hitTest(wx, wy)) {
          app._pushHistory(); app.furnitureItems.splice(i, 1); app._status('Furniture removed'); app._render(); return;
        }
      }
    }
  }

  // ── Delete currently selected entity ─────────
  deleteSelected() {
    const app = this.app;

    if (app.selectedDoor) {
      app._pushHistory();
      app.doors = app.doors.filter(d => d !== app.selectedDoor);
      app.selectedDoor = null;
      this.syncUI(); app._status('Door deleted'); app._render();
    } else if (app.selectedWindow) {
      app._pushHistory();
      app.windows = app.windows.filter(w => w !== app.selectedWindow);
      app.selectedWindow = null;
      this.syncUI(); app._status('Window deleted'); app._render();
    } else if (app.selectedLabel) {
      app._pushHistory();
      app.labels = app.labels.filter(l => l !== app.selectedLabel);
      app.selectedLabel = null;
      this.syncUI(); app._status('Label deleted'); app._render();
    } else if (app.selectedStair) {
      app._pushHistory();
      app.stairs = app.stairs.filter(s => s !== app.selectedStair);
      app.selectedStair = null;
      this.syncUI(); app._status('Stair deleted'); app._render();
    } else if (app.selectedWall) {
      app._pushHistory();
      app.doors = app.doors.filter(d => d.wall !== app.selectedWall);
      app.windows = app.windows.filter(w => w.wall !== app.selectedWall);
      app.walls = app.walls.filter(w => w !== app.selectedWall);
      app.selectedWall = null;
      this.syncUI(); app._status('Wall deleted'); app._render();
    } else if (app.selectedFloor) {
      app._pushHistory();
      app.floors = app.floors.filter(f => f !== app.selectedFloor);
      app.selectedFloor = null;
      this.syncUI(); app._status('Floor deleted'); app._render();
    } else if (app.selectedWire) {
      app._pushHistory();
      app.wires = app.wires.filter(w => w !== app.selectedWire);
      app.selectedWire = null;
      this.syncUI(); app._status('Wire deleted'); app._render();
    } else if (app.selectedPanel) {
      app._pushHistory();
      const panelId = app.selectedPanel.id;
      const panelCircuits = getCircuitsForPanel(app.circuits,panelId).map(c => c.id);
      app.circuits = app.circuits.filter(c => c.panelId !== panelId);
      app.electricalSymbols.forEach(sym => {
        if (panelCircuits.includes(sym.circuitId)) sym.circuitId = '';
      });
      app.panels = app.panels.filter(p => p !== app.selectedPanel);
      app.selectedPanel = null;
      this.refreshCircuitSelects();
      this.syncUI(); app._status('Panel deleted'); app._render();
    } else if (app.selectedElectricalSymbol) {
      app._pushHistory();
      app.electricalSymbols = app.electricalSymbols.filter(s => s !== app.selectedElectricalSymbol);
      app.selectedElectricalSymbol = null;
      this.syncUI(); app._status('Symbol deleted'); app._render();
    } else if (app.selectedPipe) {
      app._pushHistory();
      app.pipes = app.pipes.filter(p => p !== app.selectedPipe);
      app.selectedPipe = null;
      this.syncUI(); app._status('Pipe deleted'); app._render();
    } else if (app.selectedPlumbingSymbol) {
      app._pushHistory();
      app.plumbingSymbols = app.plumbingSymbols.filter(s => s !== app.selectedPlumbingSymbol);
      app.selectedPlumbingSymbol = null;
      this.syncUI(); app._status('Symbol deleted'); app._render();
    } else if (app.selectedFurniture) {
      app._pushHistory();
      const idx = app.furnitureItems.indexOf(app.selectedFurniture);
      if (idx !== -1) app.furnitureItems.splice(idx, 1);
      app.selectedFurniture = null;
      this.syncUI(); app._status('Furniture deleted'); app._render();
    }
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
      const ep = $('sel-elec-symbol-props');
      if (ep) {
        ep.style.display = '';
        $('sel-elec-symbol-type').textContent = CONFIG.ELECTRICAL_SYMBOL_LABELS[app.selectedElectricalSymbol.symbolType] || app.selectedElectricalSymbol.symbolType;
        const circuit = app.circuits.find(c => c.id === app.selectedElectricalSymbol.circuitId);
        $('sel-elec-symbol-circuit').textContent = circuit ? `${circuit.name}` : 'None';
        const load = Math.max(0.1, Number(app.selectedElectricalSymbol.amperageA) || CONFIG.DEFAULT_SYMBOL_AMPERAGE_A);
        $('sel-elec-load-a').value = String(load);
        this.fillCircuitSelect('sel-elec-circuit-select', app.selectedElectricalSymbol.circuitId);
        $$('#sel-elec-symbol-rotation-group .prop-btn').forEach(b =>
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
      const pp = $('sel-plumb-symbol-props');
      if (pp) {
        pp.style.display = '';
        $('sel-plumb-symbol-type').textContent = CONFIG.PLUMBING_SYMBOL_LABELS[app.selectedPlumbingSymbol.symbolType] || app.selectedPlumbingSymbol.symbolType;
        $$('#sel-plumb-symbol-rotation-group .prop-btn').forEach(b =>
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
      this.fillCircuitSelect('sel-elec-circuit-select', app.selectedElectricalSymbol.circuitId);
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

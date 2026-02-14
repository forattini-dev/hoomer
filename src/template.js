export const template = `
  <nav id="tab-bar">
    <div class="tab-bar-left">
      <span class="logo">Hoomer</span>
    </div>
    <div class="tab-bar-tabs">
      <button class="top-tab active" data-tab="creative">Creative</button>
      <button class="top-tab" data-tab="costs">Costs</button>
      <button class="top-tab" data-tab="project">Project</button>
    </div>
    <div class="tab-bar-right"></div>
  </nav>

  <div id="tab-creative">
    <div id="creative-toolbar">
      <div class="toolbar-left">
        <button id="btn-undo" title="Undo (Ctrl+Z)" disabled>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10h13a4 4 0 0 1 0 8H7"/><path d="M3 10l5-5M3 10l5 5"/></svg>
        </button>
        <button id="btn-redo" title="Redo (Ctrl+Shift+Z)" disabled>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10H8a4 4 0 0 0 0 8h9"/><path d="M21 10l-5-5M21 10l-5 5"/></svg>
        </button>
        <span class="separator"></span>
        <label class="toolbar-label">Grid
          <select id="grid-size">
            <option value="10" selected>10 cm</option>
            <option value="20">20 cm</option>
            <option value="50">50 cm</option>
            <option value="100">1 m</option>
          </select>
        </label>
        <span class="separator"></span>
        <span id="zoom-display">100%</span>
      </div>
      <div class="toolbar-right">
        <button id="btn-3d" title="Toggle 3D View (0)">3D</button>
        <button id="btn-nav-mode" title="Orbit/Walk" style="display:none">Orbit</button>
      </div>
    </div>

    <!-- Story Tabs -->
    <div id="story-bar">
      <div id="story-tabs"></div>
      <button id="btn-add-story" title="Add Floor">+</button>
      <button id="btn-remove-story" title="Remove Floor" disabled>&minus;</button>
    </div>

    <!-- Layer Bar -->
    <div id="layer-bar">
      <div id="layer-tabs"></div>
    </div>

    <main>
      <aside id="tools-panel">
        <div class="panel-title">Tools</div>

        <!-- Structure tools -->
        <div class="tool-group" id="tools-structure">
          <button class="tool-btn active" data-tool="wall" title="Wall (W)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="8" width="18" height="8" rx="1"/>
              <line x1="8" y1="8" x2="8" y2="16"/><line x1="13" y1="8" x2="13" y2="16"/><line x1="18" y1="8" x2="18" y2="16"/>
            </svg>
            <span>Wall</span>
          </button>
          <button class="tool-btn" data-tool="door" title="Door (D)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="5" y="3" width="10" height="18" rx="1"/>
              <circle cx="13" cy="13" r="1.2" fill="currentColor"/>
            </svg>
            <span>Door</span>
          </button>
          <button class="tool-btn" data-tool="window" title="Window (N)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="5" width="18" height="14" rx="1"/>
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
            </svg>
            <span>Window</span>
          </button>
          <button class="tool-btn" data-tool="stair" title="Stair (S)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 20h4v-4h4v-4h4v-4h4"/>
              <path d="M4 20v-4h4v-4h4v-4h4v-4"/>
            </svg>
            <span>Stair</span>
          </button>
          <button class="tool-btn" data-tool="floor" title="Floor (F)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="1"/>
              <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
              <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
            </svg>
            <span>Floor</span>
          </button>
          <button class="tool-btn" data-tool="label" title="Label (L)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 20V4h2l4 10 4-10h2v16"/><path d="M6 12h12"/>
            </svg>
            <span>Label</span>
          </button>
          <button class="tool-btn" data-tool="select" title="Select (V)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4l7 17 2.5-6.5L20 12z"/>
            </svg>
            <span>Select</span>
          </button>
          <button class="tool-btn" data-tool="eraser" title="Eraser (E)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            <span>Eraser</span>
          </button>
        </div>

        <!-- Furniture tools -->
        <div class="tool-group" id="tools-furniture" style="display:none">
          <button class="tool-btn" data-tool="furniture_item" title="Place Furniture (F)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9b7bb5" stroke-width="2">
              <rect x="4" y="14" width="16" height="4" rx="1"/><path d="M6 14V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6"/><line x1="5" y1="18" x2="5" y2="21"/><line x1="19" y1="18" x2="19" y2="21"/>
            </svg>
            <span>Place</span>
          </button>
          <button class="tool-btn" data-tool="select" title="Select (V)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4l7 17 2.5-6.5L20 12z"/>
            </svg>
            <span>Select</span>
          </button>
          <button class="tool-btn" data-tool="eraser" title="Eraser (E)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            <span>Eraser</span>
          </button>
        </div>

        <!-- Electrical tools -->
        <div class="tool-group" id="tools-electrical" style="display:none">
          <button class="tool-btn" data-tool="panel" title="Panel (Q)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f5a623" stroke-width="2">
              <rect x="4" y="5" width="16" height="14" rx="1"/>
              <line x1="8" y1="9" x2="16" y2="9"/>
              <line x1="8" y1="13" x2="16" y2="13"/>
              <line x1="8" y1="17" x2="13" y2="17"/>
            </svg>
            <span>Panel</span>
          </button>
          <button class="tool-btn" data-tool="wire" title="Wire (W)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f5a623" stroke-width="2">
              <path d="M3 12h4l3-6 4 12 3-6h4"/>
            </svg>
            <span>Wire</span>
          </button>
          <button class="tool-btn" data-tool="electrical_symbol" title="Symbol (S)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f5a623" stroke-width="2">
              <circle cx="12" cy="12" r="6"/><line x1="12" y1="6" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="18"/>
            </svg>
            <span>Symbol</span>
          </button>
          <button class="tool-btn" data-tool="select" title="Select (V)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4l7 17 2.5-6.5L20 12z"/>
            </svg>
            <span>Select</span>
          </button>
          <button class="tool-btn" data-tool="eraser" title="Eraser (E)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            <span>Eraser</span>
          </button>
        </div>

        <!-- Plumbing tools -->
        <div class="tool-group" id="tools-plumbing" style="display:none">
          <button class="tool-btn" data-tool="pipe" title="Pipe (P)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4a90d9" stroke-width="2">
              <path d="M4 12h16"/><path d="M4 8v8"/><path d="M20 8v8"/>
            </svg>
            <span>Pipe</span>
          </button>
          <button class="tool-btn" data-tool="plumbing_symbol" title="Symbol (S)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4a90d9" stroke-width="2">
              <circle cx="12" cy="12" r="6"/><path d="M8 8l8 8M16 8l-8 8"/>
            </svg>
            <span>Symbol</span>
          </button>
          <button class="tool-btn" data-tool="select" title="Select (V)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4l7 17 2.5-6.5L20 12z"/>
            </svg>
            <span>Select</span>
          </button>
          <button class="tool-btn" data-tool="eraser" title="Eraser (E)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            <span>Eraser</span>
          </button>
        </div>

        <div class="panel-title" style="margin-top:16px">Snap</div>
        <div class="tool-group">
          <label class="checkbox-label"><input type="checkbox" id="snap-grid" checked> Grid</label>
          <label class="checkbox-label"><input type="checkbox" id="snap-angle" checked> Angle
            <select id="snap-angle-deg" style="margin-left:4px;padding:2px 4px;font-size:11px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-family:var(--font-mono)">
              <option value="15">15°</option>
              <option value="30">30°</option>
              <option value="45" selected>45°</option>
              <option value="60">60°</option>
              <option value="90">90°</option>
            </select>
          </label>
          <label class="checkbox-label"><input type="checkbox" id="snap-endpoint" checked> Endpoints</label>
        </div>
      </aside>

      <div id="canvas-container">
        <canvas id="main-canvas"></canvas>
      </div>

      <aside id="properties-panel">
        <!-- Wall properties -->
        <div id="wall-props">
          <div class="panel-title">Wall</div>
          <div class="prop-group">
            <label>Thickness</label>
            <div class="btn-group" id="wall-thickness-group">
              <button data-value="5" class="prop-btn">5cm</button>
              <button data-value="10" class="prop-btn">10cm</button>
              <button data-value="15" class="prop-btn active">15cm</button>
              <button data-value="20" class="prop-btn">20cm</button>
              <button data-value="25" class="prop-btn">25cm</button>
              <button data-value="30" class="prop-btn">30cm</button>
            </div>
          </div>
          <div class="prop-group">
            <label>Material</label>
            <div class="material-grid" id="wall-material-group">
              <button class="material-btn active" data-material="brick"><span class="material-swatch brick"></span><span>Brick</span></button>
              <button class="material-btn" data-material="concrete"><span class="material-swatch concrete"></span><span>Concrete</span></button>
              <button class="material-btn" data-material="wood"><span class="material-swatch wood"></span><span>Wood</span></button>
              <button class="material-btn" data-material="drywall"><span class="material-swatch drywall"></span><span>Drywall</span></button>
            </div>
          </div>
        </div>

        <!-- Door properties -->
        <div id="door-props" style="display:none">
          <div class="panel-title">Door</div>
          <div class="prop-group">
            <label>Type</label>
            <div class="btn-group" id="door-type-group">
              <button data-value="single" class="prop-btn active">Single</button>
              <button data-value="double" class="prop-btn">Double</button>
              <button data-value="sliding" class="prop-btn">Sliding</button>
            </div>
          </div>
          <div class="prop-group">
            <label>Width</label>
            <div class="btn-group" id="door-width-group">
              <button data-value="60" class="prop-btn">60</button>
              <button data-value="70" class="prop-btn">70</button>
              <button data-value="80" class="prop-btn active">80</button>
              <button data-value="90" class="prop-btn">90</button>
            </div>
          </div>
          <div class="prop-group" id="door-hinge-wrap">
            <label>Hinge</label>
            <div class="btn-group" id="door-hinge-group">
              <button data-value="left" class="prop-btn active">Left</button>
              <button data-value="right" class="prop-btn">Right</button>
            </div>
          </div>
          <div class="prop-group" id="door-opendir-wrap">
            <label>Opening Side</label>
            <div class="btn-group" id="door-opendir-group">
              <button data-value="1" class="prop-btn active">Side A</button>
              <button data-value="-1" class="prop-btn">Side B</button>
            </div>
          </div>
        </div>

        <!-- Window properties -->
        <div id="window-props" style="display:none">
          <div class="panel-title">Window</div>
          <div class="prop-group">
            <label>Type</label>
            <div class="btn-group" id="window-type-group">
              <button data-value="fixed" class="prop-btn active">Fixed</button>
              <button data-value="sliding" class="prop-btn">Sliding</button>
              <button data-value="casement" class="prop-btn">Casement</button>
            </div>
          </div>
          <div class="prop-group">
            <label>Width</label>
            <div class="btn-group" id="window-width-group">
              <button data-value="40" class="prop-btn">40</button>
              <button data-value="60" class="prop-btn active">60</button>
              <button data-value="80" class="prop-btn">80</button>
              <button data-value="100" class="prop-btn">100</button>
              <button data-value="120" class="prop-btn">120</button>
            </div>
          </div>
        </div>

        <!-- Stair properties -->
        <div id="stair-props" style="display:none">
          <div class="panel-title">Stair</div>
          <div class="prop-group">
            <label>Width</label>
            <div class="btn-group" id="stair-width-group">
              <button data-value="80" class="prop-btn">80</button>
              <button data-value="100" class="prop-btn active">100</button>
              <button data-value="120" class="prop-btn">120</button>
            </div>
          </div>
          <div class="prop-group">
            <label>Length</label>
            <div class="btn-group" id="stair-length-group">
              <button data-value="200" class="prop-btn">2m</button>
              <button data-value="280" class="prop-btn active">2.8m</button>
              <button data-value="350" class="prop-btn">3.5m</button>
              <button data-value="450" class="prop-btn">4.5m</button>
            </div>
          </div>
          <div class="prop-group">
            <label>Rotation</label>
            <div class="btn-group" id="stair-rotation-group">
              <button data-value="0" class="prop-btn active">0°</button>
              <button data-value="90" class="prop-btn">90°</button>
              <button data-value="180" class="prop-btn">180°</button>
              <button data-value="270" class="prop-btn">270°</button>
            </div>
          </div>
        </div>

        <!-- Label properties -->
        <div id="label-props" style="display:none">
          <div class="panel-title">Label</div>
          <div class="prop-group">
            <label>Font Size</label>
            <div class="btn-group" id="label-fontsize-group">
              <button data-value="12" class="prop-btn">12</button>
              <button data-value="14" class="prop-btn">14</button>
              <button data-value="16" class="prop-btn active">16</button>
              <button data-value="20" class="prop-btn">20</button>
              <button data-value="24" class="prop-btn">24</button>
            </div>
          </div>
        </div>

        <!-- Floor properties -->
        <div id="floor-props" style="display:none">
          <div class="panel-title">Floor</div>
          <div class="prop-group">
            <label>Material</label>
            <div class="material-grid" id="floor-material-group">
              <button class="material-btn active" data-material="ceramic"><span class="material-swatch ceramic"></span><span>Ceramic</span></button>
              <button class="material-btn" data-material="hardwood"><span class="material-swatch hardwood"></span><span>Hardwood</span></button>
              <button class="material-btn" data-material="marble"><span class="material-swatch marble"></span><span>Marble</span></button>
              <button class="material-btn" data-material="cimentoQueimado"><span class="material-swatch cimentoQueimado"></span><span>Concrete</span></button>
            </div>
          </div>
        </div>

        <!-- Wire properties -->
        <div id="panel-props" style="display:none">
          <div class="panel-title">Panel</div>
          <div class="prop-group">
            <label>Name Prefix</label>
            <input id="panel-name-prefix" type="text" value="QD"
              style="width:100%;padding:5px 8px;font-size:12px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-family:var(--font)">
          </div>
          <div class="prop-group">
            <label>Voltage (V)</label>
            <div class="btn-group" id="panel-voltage-group">
              <button data-value="127" class="prop-btn">127</button>
              <button data-value="220" class="prop-btn active">220</button>
              <button data-value="380" class="prop-btn">380</button>
            </div>
          </div>
          <div class="prop-group">
            <label>Phases</label>
            <div class="btn-group" id="panel-phases-group">
              <button data-value="1" class="prop-btn active">1φ</button>
              <button data-value="2" class="prop-btn">2φ</button>
              <button data-value="3" class="prop-btn">3φ</button>
            </div>
          </div>
          <div class="prop-group">
            <label>Main Breaker (A)</label>
            <div class="btn-group" id="panel-main-breaker-group">
              <button data-value="40" class="prop-btn">40</button>
              <button data-value="63" class="prop-btn active">63</button>
              <button data-value="80" class="prop-btn">80</button>
              <button data-value="100" class="prop-btn">100</button>
            </div>
          </div>
        </div>

        <div id="wire-props" style="display:none">
          <div class="panel-title">Wire</div>
          <div class="prop-group">
            <label>Gauge (mm²)</label>
            <div class="btn-group" id="wire-gauge-group">
              <button data-value="1.5" class="prop-btn">1.5</button>
              <button data-value="2.5" class="prop-btn active">2.5</button>
              <button data-value="4" class="prop-btn">4</button>
              <button data-value="6" class="prop-btn">6</button>
              <button data-value="10" class="prop-btn">10</button>
            </div>
          </div>
        </div>

        <!-- Electrical Symbol properties -->
        <div id="electrical-symbol-props" style="display:none">
          <div class="panel-title">Electrical Symbol</div>
          <div class="prop-group">
            <label>Type</label>
            <div class="btn-group symbol-type-group" id="elec-symbol-type-group">
              <button data-value="outlet_low" class="prop-btn active">Out Low</button>
              <button data-value="outlet_med" class="prop-btn">Out Med</button>
              <button data-value="outlet_high" class="prop-btn">Out High</button>
              <button data-value="switch_single" class="prop-btn">Sw 1x</button>
              <button data-value="switch_double" class="prop-btn">Sw 2x</button>
              <button data-value="switch_parallel" class="prop-btn">Sw Par</button>
              <button data-value="light_ceiling" class="prop-btn">Light C</button>
              <button data-value="light_wall" class="prop-btn">Light W</button>
              <button data-value="distribution_panel" class="prop-btn">QD</button>
            </div>
          </div>
          <div class="prop-group">
            <label>Rotation</label>
            <div class="btn-group" id="elec-symbol-rotation-group">
              <button data-value="0" class="prop-btn active">0°</button>
              <button data-value="90" class="prop-btn">90°</button>
              <button data-value="180" class="prop-btn">180°</button>
              <button data-value="270" class="prop-btn">270°</button>
            </div>
          </div>
          <div class="prop-group">
            <label>Load (A)</label>
            <input id="elec-load-a" type="number" min="0.1" step="0.1" value="10"
              style="width:100%;padding:5px 8px;font-size:12px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-family:var(--font-mono)">
          </div>
          <div class="prop-group">
            <label>Circuit</label>
            <select id="elec-circuit-select"
              style="width:100%;padding:5px 8px;font-size:12px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-family:var(--font)">
              <option value="">No circuit</option>
            </select>
          </div>
        </div>

        <!-- Pipe properties -->
        <div id="pipe-props" style="display:none">
          <div class="panel-title">Pipe</div>
          <div class="prop-group">
            <label>Type</label>
            <div class="btn-group" id="pipe-type-group">
              <button data-value="cold" class="prop-btn active" style="color:#4a90d9">Água fria</button>
              <button data-value="hot" class="prop-btn" style="color:#e74c3c">Água quente</button>
              <button data-value="drainage" class="prop-btn" style="color:#8B5E3C">Esgoto</button>
            </div>
          </div>
          <div class="prop-group">
            <label>Diameter (mm)</label>
            <div class="btn-group" id="pipe-diameter-group">
              <button data-value="20" class="prop-btn">20</button>
              <button data-value="25" class="prop-btn active">25</button>
              <button data-value="32" class="prop-btn">32</button>
              <button data-value="40" class="prop-btn">40</button>
              <button data-value="50" class="prop-btn">50</button>
              <button data-value="75" class="prop-btn">75</button>
              <button data-value="100" class="prop-btn">100</button>
            </div>
          </div>
          <div class="prop-group">
            <label>Flow Direction</label>
            <div class="btn-group" id="pipe-flow-group">
              <button data-value="1" class="prop-btn active">→</button>
              <button data-value="-1" class="prop-btn">←</button>
            </div>
          </div>
        </div>

        <!-- Plumbing Symbol properties -->
        <div id="plumbing-symbol-props" style="display:none">
          <div class="panel-title">Plumbing Symbol</div>
          <div class="prop-group">
            <label>Type</label>
            <div class="btn-group symbol-type-group" id="plumb-symbol-type-group">
              <button data-value="valve" class="prop-btn active">Valve</button>
              <button data-value="drain" class="prop-btn">Drain</button>
              <button data-value="water_tank" class="prop-btn">Tank</button>
              <button data-value="water_pump" class="prop-btn">Pump</button>
              <button data-value="pool" class="prop-btn">Pool</button>
              <button data-value="motor" class="prop-btn">Motor</button>
            </div>
          </div>
          <div class="prop-group">
            <label>Rotation</label>
            <div class="btn-group" id="plumb-symbol-rotation-group">
              <button data-value="0" class="prop-btn active">0°</button>
              <button data-value="90" class="prop-btn">90°</button>
              <button data-value="180" class="prop-btn">180°</button>
              <button data-value="270" class="prop-btn">270°</button>
            </div>
          </div>
        </div>

        <!-- Furniture properties -->
        <div id="furniture-props" style="display:none">
          <div class="panel-title">Furniture</div>
          <div class="prop-group">
            <label>Type</label>
            <div class="furn-categories" id="furniture-type-group">
              <div>
                <div class="furn-cat-label">Living Room</div>
                <div class="furn-cat-items">
                  <button data-value="sofa_2seat" class="prop-btn">Sofa 2p</button>
                  <button data-value="sofa_3seat" class="prop-btn">Sofa 3p</button>
                  <button data-value="armchair" class="prop-btn">Armchair</button>
                  <button data-value="coffee_table" class="prop-btn">Coffee Tbl</button>
                  <button data-value="tv_console" class="prop-btn">TV Console</button>
                </div>
              </div>
              <div>
                <div class="furn-cat-label">Dining</div>
                <div class="furn-cat-items">
                  <button data-value="dining_table" class="prop-btn">Dining Tbl</button>
                  <button data-value="round_table" class="prop-btn">Round Tbl</button>
                  <button data-value="chair" class="prop-btn active">Chair</button>
                </div>
              </div>
              <div>
                <div class="furn-cat-label">Bedroom</div>
                <div class="furn-cat-items">
                  <button data-value="bed_single" class="prop-btn">Bed 1p</button>
                  <button data-value="bed_double" class="prop-btn">Bed 2p</button>
                  <button data-value="bed_queen" class="prop-btn">Bed Queen</button>
                  <button data-value="wardrobe" class="prop-btn">Wardrobe</button>
                  <button data-value="nightstand" class="prop-btn">Nightstand</button>
                </div>
              </div>
              <div>
                <div class="furn-cat-label">Kitchen</div>
                <div class="furn-cat-items">
                  <button data-value="kitchen_sink" class="prop-btn">K. Sink</button>
                  <button data-value="stove" class="prop-btn">Stove</button>
                  <button data-value="fridge" class="prop-btn">Fridge</button>
                </div>
              </div>
              <div>
                <div class="furn-cat-label">Bathroom</div>
                <div class="furn-cat-items">
                  <button data-value="toilet" class="prop-btn">Toilet</button>
                  <button data-value="bath_sink" class="prop-btn">B. Sink</button>
                  <button data-value="bathtub" class="prop-btn">Bathtub</button>
                  <button data-value="shower" class="prop-btn">Shower</button>
                </div>
              </div>
              <div>
                <div class="furn-cat-label">Office</div>
                <div class="furn-cat-items">
                  <button data-value="desk" class="prop-btn">Desk</button>
                  <button data-value="office_chair" class="prop-btn">Off. Chair</button>
                </div>
              </div>
            </div>
          </div>
          <div class="prop-group">
            <label>Rotation</label>
            <div class="btn-group" id="furniture-rotation-group">
              <button data-value="0" class="prop-btn active">0°</button>
              <button data-value="90" class="prop-btn">90°</button>
              <button data-value="180" class="prop-btn">180°</button>
              <button data-value="270" class="prop-btn">270°</button>
            </div>
          </div>
        </div>

        <!-- Furniture selection -->
        <div id="sel-furniture-props" style="display:none">
          <div class="panel-title">Selected Furniture</div>
          <div class="prop-group">
            <div class="info-row"><span>Type:</span><span id="sel-furniture-type">—</span></div>
            <div class="info-row"><span>Size:</span><span id="sel-furniture-size">—</span></div>
          </div>
          <div class="prop-group">
            <label>Rotation</label>
            <div class="btn-group" id="sel-furniture-rotation-group">
              <button data-value="0" class="prop-btn">0°</button>
              <button data-value="90" class="prop-btn">90°</button>
              <button data-value="180" class="prop-btn">180°</button>
              <button data-value="270" class="prop-btn">270°</button>
            </div>
          </div>
          <div class="prop-group">
            <button class="btn-delete-selected danger-btn">Delete Furniture</button>
          </div>
        </div>

        <!-- Wall selection -->
        <div id="selection-props" style="display:none">
          <div class="panel-title">Selected Wall</div>
          <div class="prop-group">
            <div class="info-row"><span>Length:</span><span id="sel-length">—</span></div>
            <div class="info-row"><span>Thickness:</span><span id="sel-thickness">—</span></div>
            <div class="info-row"><span>Material:</span><span id="sel-material">—</span></div>
            <div class="info-row"><span>Angle:</span><span id="sel-angle">—</span></div>
          </div>
          <div class="prop-group">
            <label>Change Thickness</label>
            <div class="btn-group" id="sel-thickness-group">
              <button data-value="5" class="prop-btn">5</button>
              <button data-value="10" class="prop-btn">10</button>
              <button data-value="15" class="prop-btn">15</button>
              <button data-value="20" class="prop-btn">20</button>
              <button data-value="25" class="prop-btn">25</button>
              <button data-value="30" class="prop-btn">30</button>
            </div>
          </div>
          <div class="prop-group">
            <label>Change Material</label>
            <div class="material-grid" id="sel-material-group">
              <button class="material-btn" data-material="brick"><span class="material-swatch brick"></span><span>Brick</span></button>
              <button class="material-btn" data-material="concrete"><span class="material-swatch concrete"></span><span>Concrete</span></button>
              <button class="material-btn" data-material="wood"><span class="material-swatch wood"></span><span>Wood</span></button>
              <button class="material-btn" data-material="drywall"><span class="material-swatch drywall"></span><span>Drywall</span></button>
            </div>
          </div>
          <div class="prop-group">
            <button class="btn-delete-selected danger-btn">Delete Selected</button>
          </div>
        </div>

        <!-- Door selection -->
        <div id="sel-door-props" style="display:none">
          <div class="panel-title">Selected Door</div>
          <div class="prop-group">
            <div class="info-row"><span>Width:</span><span id="sel-door-width">—</span></div>
            <div class="info-row"><span>Type:</span><span id="sel-door-type">—</span></div>
            <div class="info-row"><span>Hinge:</span><span id="sel-door-hinge">—</span></div>
          </div>
          <div class="prop-group">
            <label>Change Type</label>
            <div class="btn-group" id="sel-door-type-group">
              <button data-value="single" class="prop-btn">Single</button>
              <button data-value="double" class="prop-btn">Double</button>
              <button data-value="sliding" class="prop-btn">Sliding</button>
            </div>
          </div>
          <div class="prop-group">
            <label>Change Width</label>
            <div class="btn-group" id="sel-door-width-group">
              <button data-value="60" class="prop-btn">60</button>
              <button data-value="70" class="prop-btn">70</button>
              <button data-value="80" class="prop-btn">80</button>
              <button data-value="90" class="prop-btn">90</button>
            </div>
          </div>
          <div class="prop-group" id="sel-door-hinge-wrap">
            <button id="btn-flip-hinge" class="prop-btn" style="width:100%">Flip Hinge</button>
          </div>
          <div class="prop-group" id="sel-door-opendir-wrap">
            <button id="btn-flip-open" class="prop-btn" style="width:100%">Flip Side</button>
          </div>
          <div class="prop-group">
            <button class="btn-delete-selected danger-btn">Delete Door</button>
          </div>
        </div>

        <!-- Window selection -->
        <div id="sel-window-props" style="display:none">
          <div class="panel-title">Selected Window</div>
          <div class="prop-group">
            <div class="info-row"><span>Width:</span><span id="sel-window-width">—</span></div>
            <div class="info-row"><span>Type:</span><span id="sel-window-type">—</span></div>
          </div>
          <div class="prop-group">
            <label>Change Type</label>
            <div class="btn-group" id="sel-window-type-group">
              <button data-value="fixed" class="prop-btn">Fixed</button>
              <button data-value="sliding" class="prop-btn">Sliding</button>
              <button data-value="casement" class="prop-btn">Casement</button>
            </div>
          </div>
          <div class="prop-group">
            <label>Change Width</label>
            <div class="btn-group" id="sel-window-width-group">
              <button data-value="40" class="prop-btn">40</button>
              <button data-value="60" class="prop-btn">60</button>
              <button data-value="80" class="prop-btn">80</button>
              <button data-value="100" class="prop-btn">100</button>
              <button data-value="120" class="prop-btn">120</button>
            </div>
          </div>
          <div class="prop-group">
            <button class="btn-delete-selected danger-btn">Delete Window</button>
          </div>
        </div>

        <!-- Label selection -->
        <div id="sel-label-props" style="display:none">
          <div class="panel-title">Selected Label</div>
          <div class="prop-group">
            <label>Text</label>
            <input type="text" id="sel-label-text" value=""
              style="width:100%;padding:4px 6px;font-size:12px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-family:var(--font-mono)">
          </div>
          <div class="prop-group">
            <label>Font Size</label>
            <div class="btn-group" id="sel-label-fontsize-group">
              <button data-value="12" class="prop-btn">12</button>
              <button data-value="14" class="prop-btn">14</button>
              <button data-value="16" class="prop-btn">16</button>
              <button data-value="20" class="prop-btn">20</button>
              <button data-value="24" class="prop-btn">24</button>
            </div>
          </div>
          <div class="prop-group">
            <button class="btn-delete-selected danger-btn">Delete Label</button>
          </div>
        </div>

        <!-- Stair selection -->
        <div id="sel-stair-props" style="display:none">
          <div class="panel-title">Selected Stair</div>
          <div class="prop-group">
            <div class="info-row"><span>Size:</span><span id="sel-stair-size">—</span></div>
            <div class="info-row"><span>Rotation:</span><span id="sel-stair-rot">—</span></div>
          </div>
          <div class="prop-group">
            <label>Rotation</label>
            <div class="btn-group" id="sel-stair-rotation-group">
              <button data-value="0" class="prop-btn">0°</button>
              <button data-value="90" class="prop-btn">90°</button>
              <button data-value="180" class="prop-btn">180°</button>
              <button data-value="270" class="prop-btn">270°</button>
            </div>
          </div>
          <div class="prop-group">
            <button class="btn-delete-selected danger-btn">Delete Stair</button>
          </div>
        </div>

        <!-- Wire selection -->
        <div id="sel-panel-props" style="display:none">
          <div class="panel-title">Selected Panel</div>
          <div class="prop-group">
            <label>Name</label>
            <input id="sel-panel-name" type="text"
              style="width:100%;padding:5px 8px;font-size:12px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-family:var(--font)">
          </div>
          <div class="prop-group">
            <div class="info-row"><span>Voltage:</span><span id="sel-panel-voltage">—</span></div>
            <div class="info-row"><span>Phases:</span><span id="sel-panel-phases">—</span></div>
            <div class="info-row"><span>Main Breaker:</span><span id="sel-panel-main-breaker">—</span></div>
          </div>
          <div class="prop-group">
            <label>Main Breaker (A)</label>
            <input id="sel-panel-main-breaker-input" type="number" min="1" step="1"
              style="width:100%;padding:5px 8px;font-size:12px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-family:var(--font-mono)">
          </div>
          <div class="prop-group">
            <div id="sel-panel-alert" class="panel-alert"></div>
          </div>
          <div class="prop-group">
            <label>Circuits / Breakers</label>
            <div id="sel-panel-circuits-list"></div>
          </div>
          <div class="prop-group">
            <button id="btn-panel-add-circuit" class="prop-btn" style="width:100%">+ Add Circuit</button>
          </div>
          <div class="prop-group">
            <button class="btn-delete-selected danger-btn">Delete Panel</button>
          </div>
        </div>

        <div id="sel-wire-props" style="display:none">
          <div class="panel-title">Selected Wire</div>
          <div class="prop-group">
            <div class="info-row"><span>Gauge:</span><span id="sel-wire-gauge">—</span></div>
            <div class="info-row"><span>Length:</span><span id="sel-wire-length">—</span></div>
            <div class="info-row"><span>Points:</span><span id="sel-wire-points">—</span></div>
          </div>
          <div class="prop-group">
            <label>Change Gauge</label>
            <div class="btn-group" id="sel-wire-gauge-group">
              <button data-value="1.5" class="prop-btn">1.5</button>
              <button data-value="2.5" class="prop-btn">2.5</button>
              <button data-value="4" class="prop-btn">4</button>
              <button data-value="6" class="prop-btn">6</button>
              <button data-value="10" class="prop-btn">10</button>
            </div>
          </div>
          <div class="prop-group">
            <button class="btn-delete-selected danger-btn">Delete Wire</button>
          </div>
        </div>

        <!-- Electrical Symbol selection -->
        <div id="sel-elec-symbol-props" style="display:none">
          <div class="panel-title">Selected Symbol</div>
          <div class="prop-group">
            <div class="info-row"><span>Type:</span><span id="sel-elec-symbol-type">—</span></div>
            <div class="info-row"><span>Circuit:</span><span id="sel-elec-symbol-circuit">—</span></div>
          </div>
          <div class="prop-group">
            <label>Load (A)</label>
            <input id="sel-elec-load-a" type="number" min="0.1" step="0.1"
              style="width:100%;padding:5px 8px;font-size:12px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-family:var(--font-mono)">
          </div>
          <div class="prop-group">
            <label>Circuit</label>
            <select id="sel-elec-circuit-select"
              style="width:100%;padding:5px 8px;font-size:12px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-family:var(--font)">
              <option value="">No circuit</option>
            </select>
          </div>
          <div class="prop-group">
            <label>Rotation</label>
            <div class="btn-group" id="sel-elec-symbol-rotation-group">
              <button data-value="0" class="prop-btn">0°</button>
              <button data-value="90" class="prop-btn">90°</button>
              <button data-value="180" class="prop-btn">180°</button>
              <button data-value="270" class="prop-btn">270°</button>
            </div>
          </div>
          <div class="prop-group">
            <button class="btn-delete-selected danger-btn">Delete Symbol</button>
          </div>
        </div>

        <!-- Pipe selection -->
      <div id="sel-pipe-props" style="display:none">
        <div class="panel-title">Selected Pipe</div>
        <div class="prop-group">
          <div class="info-row"><span>Type:</span><span id="sel-pipe-type">—</span></div>
          <div class="info-row"><span>Diameter:</span><span id="sel-pipe-diameter">—</span></div>
          <div class="info-row"><span>Length:</span><span id="sel-pipe-length">—</span></div>
        </div>
        <div class="prop-group">
          <label>Flow Direction</label>
          <div class="btn-group" id="sel-pipe-flow-group">
            <button data-value="1" class="prop-btn">→</button>
            <button data-value="-1" class="prop-btn">←</button>
          </div>
        </div>
        <div class="prop-group">
          <button class="btn-delete-selected danger-btn">Delete Pipe</button>
        </div>
      </div>

        <!-- Plumbing Symbol selection -->
        <div id="sel-plumb-symbol-props" style="display:none">
          <div class="panel-title">Selected Symbol</div>
          <div class="prop-group">
            <div class="info-row"><span>Type:</span><span id="sel-plumb-symbol-type">—</span></div>
          </div>
          <div class="prop-group">
            <label>Rotation</label>
            <div class="btn-group" id="sel-plumb-symbol-rotation-group">
              <button data-value="0" class="prop-btn">0°</button>
              <button data-value="90" class="prop-btn">90°</button>
              <button data-value="180" class="prop-btn">180°</button>
              <button data-value="270" class="prop-btn">270°</button>
            </div>
          </div>
          <div class="prop-group">
            <button class="btn-delete-selected danger-btn">Delete Symbol</button>
          </div>
        </div>
      </aside>
    </main>

    <footer id="statusbar">
      <span id="status-text">Ready</span>
      <span id="status-coords">X: 0  Y: 0</span>
    </footer>
  </div>

  <div id="tab-costs" style="display:none">
    <div id="costs-toolbar">
      <span class="costs-title">Cost Estimate</span>
      <div class="costs-actions">
        <button id="costs-copy" title="Copy to Clipboard">Copy</button>
        <button id="costs-csv" title="Download CSV">CSV</button>
      </div>
    </div>
    <div id="costs-content"></div>
  </div>

  <div id="tab-project" style="display:none">
    <div id="project-content">
      <div class="project-section">
        <div class="project-section-title">Project Info</div>
        <div class="prop-group">
          <label>Project Name</label>
          <input type="text" id="project-name" value="Untitled Project">
        </div>
      </div>

      <div class="project-section">
        <div class="project-section-title">Terrain / Lot</div>
        <div class="prop-group">
          <label>Lot Size (width × depth)</label>
          <div style="display:flex;gap:4px;align-items:center">
            <input type="number" id="proj-terrain-width" value="20" min="1" max="200" step="1"
              style="width:55px;padding:3px 4px;font-size:12px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-family:var(--font-mono);text-align:center">
            <span style="font-size:11px;color:var(--text-muted)">×</span>
            <input type="number" id="proj-terrain-height" value="25" min="1" max="200" step="1"
              style="width:55px;padding:3px 4px;font-size:12px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-family:var(--font-mono);text-align:center">
            <span style="font-size:11px;color:var(--text-muted)">m</span>
          </div>
        </div>
        <div class="prop-group">
          <label>Axis Origin</label>
          <div class="btn-group" id="proj-axis-origin-group">
            <button data-value="bottom-left" class="prop-btn active">↙ Corner</button>
            <button data-value="center" class="prop-btn">⊕ Center</button>
          </div>
        </div>
        <div class="prop-group">
          <label class="checkbox-label"><input type="checkbox" id="proj-show-terrain" checked> Show Lot</label>
        </div>
      </div>

      <div class="project-section">
        <div class="project-section-title">Stories</div>
        <div id="project-stories-list"></div>
      </div>

      <div class="project-section">
        <div class="project-section-title">Export / Import</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button id="proj-export-png" class="proj-btn">Export PNG</button>
          <button id="proj-export-json" class="proj-btn">Save JSON</button>
          <button id="proj-import-json" class="proj-btn">Load JSON</button>
        </div>
        <input type="file" id="proj-import-file" accept=".json" style="display:none">
      </div>

      <div class="project-section">
        <div class="project-section-title">Share</div>
        <div class="prop-group">
          <label class="checkbox-label">
            <input type="checkbox" id="share-encrypt"> Protect with password
          </label>
        </div>
        <div id="share-password-row" style="display:none">
          <div class="prop-group">
            <label>Password</label>
            <input type="password" id="share-password" placeholder="Enter password"
              style="width:100%;max-width:300px;padding:6px 10px;font-size:13px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-family:var(--font)">
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button id="btn-share" class="proj-btn">Copy Share Link</button>
        </div>
        <div id="share-result" style="display:none;margin-top:8px">
          <input type="text" id="share-url" readonly
            style="width:100%;max-width:500px;padding:6px 10px;font-size:12px;font-family:var(--font-mono);border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);cursor:pointer">
          <span id="share-size" style="display:block;margin-top:4px;font-size:11px;color:var(--text-muted)"></span>
        </div>
      </div>
    </div>
  </div>

  <div id="share-password-modal" style="display:none">
    <div class="share-modal-backdrop"></div>
    <div class="share-modal-dialog">
      <div class="share-modal-title">Password Required</div>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px">This shared project is encrypted. Enter the password to unlock it.</p>
      <input type="password" id="share-modal-password" class="share-modal-input" placeholder="Enter password" autofocus>
      <div id="share-modal-error" style="display:none;color:var(--danger);font-size:12px;margin-top:6px"></div>
      <div class="share-modal-actions">
        <button id="share-modal-cancel" class="proj-btn">Cancel</button>
        <button id="share-modal-ok" class="proj-btn share-modal-primary">Unlock</button>
      </div>
    </div>
  </div>
`;

// ── propsPanel.js ──────────────────────────────
// Properties panel: tool props + selection props for all entity types.

export const propsPanel = `
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
            <label>Mode</label>
            <div class="btn-group" id="floor-mode-group">
              <button data-value="auto" class="prop-btn active">Auto</button>
              <button data-value="draw" class="prop-btn">Draw</button>
            </div>
          </div>
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

        <!-- Panel properties -->
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
              <button data-value="1" class="prop-btn active">1\u03C6</button>
              <button data-value="2" class="prop-btn">2\u03C6</button>
              <button data-value="3" class="prop-btn">3\u03C6</button>
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
            <label>Gauge (mm\u00B2)</label>
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
              <button data-value="0" class="prop-btn active">0\u00B0</button>
              <button data-value="90" class="prop-btn">90\u00B0</button>
              <button data-value="180" class="prop-btn">180\u00B0</button>
              <button data-value="270" class="prop-btn">270\u00B0</button>
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
              <button data-value="cold" class="prop-btn active" style="color:#4a90d9">Cold Water</button>
              <button data-value="hot" class="prop-btn" style="color:#e74c3c">Hot Water</button>
              <button data-value="drainage" class="prop-btn" style="color:#8B5E3C">Waste Water</button>
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
              <button data-value="1" class="prop-btn active">\u2192</button>
              <button data-value="-1" class="prop-btn">\u2190</button>
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
              <button data-value="0" class="prop-btn active">0\u00B0</button>
              <button data-value="90" class="prop-btn">90\u00B0</button>
              <button data-value="180" class="prop-btn">180\u00B0</button>
              <button data-value="270" class="prop-btn">270\u00B0</button>
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
              <button data-value="0" class="prop-btn active">0\u00B0</button>
              <button data-value="90" class="prop-btn">90\u00B0</button>
              <button data-value="180" class="prop-btn">180\u00B0</button>
              <button data-value="270" class="prop-btn">270\u00B0</button>
            </div>
          </div>
        </div>

        <!-- Furniture selection -->
        <div id="sel-furniture-props" style="display:none">
          <div class="panel-title">Selected Furniture</div>
          <div class="prop-group">
            <div class="info-row"><span>Type:</span><span id="sel-furniture-type">\u2014</span></div>
            <div class="info-row"><span>Size:</span><span id="sel-furniture-size">\u2014</span></div>
          </div>
          <div class="prop-group">
            <label>Rotation</label>
            <div class="btn-group" id="sel-furniture-rotation-group">
              <button data-value="0" class="prop-btn">0\u00B0</button>
              <button data-value="90" class="prop-btn">90\u00B0</button>
              <button data-value="180" class="prop-btn">180\u00B0</button>
              <button data-value="270" class="prop-btn">270\u00B0</button>
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
            <div class="info-row"><span>Length:</span><span id="sel-length">\u2014</span></div>
            <div class="info-row"><span>Thickness:</span><span id="sel-thickness">\u2014</span></div>
            <div class="info-row"><span>Material:</span><span id="sel-material">\u2014</span></div>
            <div class="info-row"><span>Angle:</span><span id="sel-angle">\u2014</span></div>
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
            <div class="info-row"><span>Width:</span><span id="sel-door-width">\u2014</span></div>
            <div class="info-row"><span>Type:</span><span id="sel-door-type">\u2014</span></div>
            <div class="info-row"><span>Hinge:</span><span id="sel-door-hinge">\u2014</span></div>
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
            <div class="info-row"><span>Width:</span><span id="sel-window-width">\u2014</span></div>
            <div class="info-row"><span>Type:</span><span id="sel-window-type">\u2014</span></div>
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
            <div class="info-row"><span>Size:</span><span id="sel-stair-size">\u2014</span></div>
            <div class="info-row"><span>Rotation:</span><span id="sel-stair-rot">\u2014</span></div>
          </div>
          <div class="prop-group">
            <label>Rotation</label>
            <div class="btn-group" id="sel-stair-rotation-group">
              <button data-value="0" class="prop-btn">0\u00B0</button>
              <button data-value="90" class="prop-btn">90\u00B0</button>
              <button data-value="180" class="prop-btn">180\u00B0</button>
              <button data-value="270" class="prop-btn">270\u00B0</button>
            </div>
          </div>
          <div class="prop-group">
            <button class="btn-delete-selected danger-btn">Delete Stair</button>
          </div>
        </div>

        <!-- Panel selection -->
        <div id="sel-panel-props" style="display:none">
          <div class="panel-title">Selected Panel</div>
          <div class="prop-group">
            <label>Name</label>
            <input id="sel-panel-name" type="text"
              style="width:100%;padding:5px 8px;font-size:12px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-family:var(--font)">
          </div>
          <div class="prop-group">
            <div class="info-row"><span>Voltage:</span><span id="sel-panel-voltage">\u2014</span></div>
            <div class="info-row"><span>Phases:</span><span id="sel-panel-phases">\u2014</span></div>
            <div class="info-row"><span>Main Breaker:</span><span id="sel-panel-main-breaker">\u2014</span></div>
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
            <div class="info-row"><span>Gauge:</span><span id="sel-wire-gauge">\u2014</span></div>
            <div class="info-row"><span>Length:</span><span id="sel-wire-length">\u2014</span></div>
            <div class="info-row"><span>Points:</span><span id="sel-wire-points">\u2014</span></div>
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
        <div id="sel-electrical-symbol-props" style="display:none">
          <div class="panel-title">Selected Symbol</div>
          <div class="prop-group">
            <div class="info-row"><span>Type:</span><span id="sel-electrical-symbol-type">\u2014</span></div>
            <div class="info-row"><span>Circuit:</span><span id="sel-electrical-symbol-circuit">\u2014</span></div>
          </div>
          <div class="prop-group">
            <label>Load (A)</label>
            <input id="sel-electrical-load-a" type="number" min="0.1" step="0.1"
              style="width:100%;padding:5px 8px;font-size:12px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-family:var(--font-mono)">
          </div>
          <div class="prop-group">
            <label>Circuit</label>
            <select id="sel-electrical-circuit-select"
              style="width:100%;padding:5px 8px;font-size:12px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-family:var(--font)">
              <option value="">No circuit</option>
            </select>
          </div>
          <div class="prop-group">
            <label>Rotation</label>
            <div class="btn-group" id="sel-electrical-symbol-rotation-group">
              <button data-value="0" class="prop-btn">0\u00B0</button>
              <button data-value="90" class="prop-btn">90\u00B0</button>
              <button data-value="180" class="prop-btn">180\u00B0</button>
              <button data-value="270" class="prop-btn">270\u00B0</button>
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
          <div class="info-row"><span>Type:</span><span id="sel-pipe-type">\u2014</span></div>
          <div class="info-row"><span>Diameter:</span><span id="sel-pipe-diameter">\u2014</span></div>
          <div class="info-row"><span>Length:</span><span id="sel-pipe-length">\u2014</span></div>
        </div>
        <div class="prop-group">
          <label>Flow Direction</label>
          <div class="btn-group" id="sel-pipe-flow-group">
            <button data-value="1" class="prop-btn">\u2192</button>
            <button data-value="-1" class="prop-btn">\u2190</button>
          </div>
        </div>
        <div class="prop-group">
          <button class="btn-delete-selected danger-btn">Delete Pipe</button>
        </div>
      </div>

        <!-- Plumbing Symbol selection -->
        <div id="sel-plumbing-symbol-props" style="display:none">
          <div class="panel-title">Selected Symbol</div>
          <div class="prop-group">
            <div class="info-row"><span>Type:</span><span id="sel-plumbing-symbol-type">\u2014</span></div>
          </div>
          <div class="prop-group">
            <label>Rotation</label>
            <div class="btn-group" id="sel-plumbing-symbol-rotation-group">
              <button data-value="0" class="prop-btn">0\u00B0</button>
              <button data-value="90" class="prop-btn">90\u00B0</button>
              <button data-value="180" class="prop-btn">180\u00B0</button>
              <button data-value="270" class="prop-btn">270\u00B0</button>
            </div>
          </div>
          <div class="prop-group">
            <button class="btn-delete-selected danger-btn">Delete Symbol</button>
          </div>
        </div>
      </aside>`;

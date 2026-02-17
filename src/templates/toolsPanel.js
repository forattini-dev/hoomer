// ── toolsPanel.js ──────────────────────────────
// Tools aside: structure, furniture, electrical, plumbing tool buttons + snap.

export const toolsPanel = `
      <aside id="tools-panel">
        <div class="mobile-panel-header">
          <div class="panel-title">Tools</div>
          <button id="btn-mobile-close-tools" class="panel-mobile-close" type="button" aria-label="Fechar painel de ferramentas">×</button>
        </div>

        <!-- Structure tools -->
        <div class="tool-group" id="tools-structure">
          <div class="tool-group-header">Structure</div>
          <div class="tool-button-row">
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
        </div>

        <!-- Furniture tools -->
        <div class="tool-group" id="tools-furniture" style="display:none">
          <div class="tool-group-header">Furniture</div>
          <div class="tool-button-row">
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
        </div>

        <!-- Electrical tools -->
        <div class="tool-group" id="tools-electrical" style="display:none">
          <div class="tool-group-header">Electrical</div>
          <div class="tool-button-row">
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
        </div>

        <!-- Plumbing tools -->
        <div class="tool-group" id="tools-plumbing" style="display:none">
          <div class="tool-group-header">Plumbing</div>
          <div class="tool-button-row">
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
        </div>

        <div class="panel-title tools-snap-title" style="margin-top:16px">Snap</div>
        <div class="tool-group tools-snap-group">
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
      </aside>`;

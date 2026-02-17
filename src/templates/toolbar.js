// ── toolbar.js ─────────────────────────────────
// Tab bar, creative toolbar (undo/redo, grid, zoom, 3D), story/layer row.

export const tabBar = `
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
  </nav>`;

export const creativeToolbar = `
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
        <div class="mobile-panel-controls">
          <button id="btn-open-mobile-tools" class="mobile-panel-toggle" title="Abrir ferramentas">Tools</button>
          <button id="btn-open-mobile-props" class="mobile-panel-toggle" title="Abrir propriedades">Props</button>
        </div>
      </div>
    </div>`;

export const storyLayerRow = `
    <div id="story-layer-row">
      <div id="story-bar">
        <div id="story-tabs"></div>
        <button id="btn-add-story" title="Add Floor">+</button>
        <button id="btn-remove-story" title="Remove Floor" disabled>&minus;</button>
      </div>
    </div>`;

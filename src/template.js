// ── template.js ────────────────────────────────
// Composes the full HTML template from sub-modules.

import { tabBar, creativeToolbar, storyLayerRow } from './templates/toolbar.js';
import { toolsPanel } from './templates/toolsPanel.js';
import { propsPanel } from './templates/propsPanel.js';
import { costsTab } from './templates/costsTab.js';
import { projectTab } from './templates/projectTab.js';
import { statusBar } from './templates/statusBar.js';
import { modals } from './templates/modals.js';

export const template = `
${tabBar}

  <div id="tab-creative">
${creativeToolbar}

${storyLayerRow}

    <main>
${toolsPanel}

    <div id="canvas-container">
      <canvas id="main-canvas"></canvas>
      <div id="layer-fab"></div>
      <div id="mobile-nav-controls" aria-hidden="true">
        <div id="mobile-move-controls">
          <button id="walk-btn-up" class="walk-btn" data-dir="up" title="Move forward">\u2191</button>
          <button id="walk-btn-left" class="walk-btn" data-dir="left" title="Move left">\u2190</button>
          <button id="walk-btn-down" class="walk-btn" data-dir="down" title="Move backward">\u2193</button>
          <button id="walk-btn-right" class="walk-btn" data-dir="right" title="Move right">\u2192</button>
        </div>
        <div id="mobile-look-control" aria-label="Drag to look around"></div>
      </div>
      </div>

${propsPanel}
    </main>

${statusBar}
  </div>

${costsTab}

${projectTab}

${modals}
`;

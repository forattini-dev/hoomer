// ── projectTab.js ──────────────────────────────
// Project tab: info, terrain, stories, export/import, share.

export const projectTab = `
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
          <label>Lot Size (width \u00D7 depth)</label>
          <div style="display:flex;gap:4px;align-items:center">
            <input type="number" id="proj-terrain-width" value="20" min="1" max="200" step="1"
              style="width:55px;padding:3px 4px;font-size:12px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-family:var(--font-mono);text-align:center">
            <span style="font-size:11px;color:var(--text-muted)">\u00D7</span>
            <input type="number" id="proj-terrain-height" value="25" min="1" max="200" step="1"
              style="width:55px;padding:3px 4px;font-size:12px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-family:var(--font-mono);text-align:center">
            <span style="font-size:11px;color:var(--text-muted)">m</span>
          </div>
        </div>
        <div class="prop-group">
          <label>Axis Origin</label>
          <div class="btn-group" id="proj-axis-origin-group">
            <button data-value="bottom-left" class="prop-btn active">\u2199 Corner</button>
            <button data-value="center" class="prop-btn">\u2295 Center</button>
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
        <div class="project-section-title">AI Check (Offline)</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button id="btn-plan-review" class="proj-btn">Run Local Plan Review</button>
        </div>
        <div
          id="plan-review-result"
          style="white-space:pre-wrap;font-size:11px;line-height:1.35;color:var(--text-muted);margin-top:8px;min-height:76px;padding:8px;border:1px solid var(--border);background:var(--bg-panel);border-radius:4px;"
        >Execute a análise para gerar insights do projeto.</div>
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
  </div>`;

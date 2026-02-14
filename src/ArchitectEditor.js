import { template } from './template.js';
import { App } from './App.js';
import css from './style.css';

const ATTR_MAP = {
  'grid':             { prop: 'gridSize',       type: 'number' },
  'wall-thickness':   { prop: 'wallThickness',  type: 'number' },
  'wall-material':    { prop: 'wallMaterial',   type: 'string' },
  'floor-material':   { prop: 'floorMaterial',  type: 'string' },
  'door-width':       { prop: 'doorWidth',      type: 'number' },
  'stair-width':      { prop: 'stairWidth',     type: 'number' },
  'stair-length':     { prop: 'stairLength',    type: 'number' },
  'terrain-width':    { prop: 'terrainWidth',   type: 'number' },
  'terrain-height':   { prop: 'terrainHeight',  type: 'number' },
  'axis-origin':      { prop: 'axisOrigin',     type: 'string' },
};

export class ArchitectEditor extends HTMLElement {
  static get observedAttributes() {
    return Object.keys(ATTR_MAP);
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._app = null;
    this._ro = null;
  }

  connectedCallback() {
    const style = document.createElement('style');
    style.textContent = css;
    this.shadowRoot.appendChild(style);

    const tmpl = document.createElement('template');
    tmpl.innerHTML = template;
    this.shadowRoot.appendChild(tmpl.content);

    // Read attribute overrides
    const overrides = {};
    for (const [attr, { prop, type }] of Object.entries(ATTR_MAP)) {
      const val = this.getAttribute(attr);
      if (val != null) {
        overrides[prop] = type === 'number' ? Number(val) : val;
      }
    }

    this._app = new App(this.shadowRoot, this, overrides);

    // ResizeObserver instead of window.resize
    this._ro = new ResizeObserver(() => {
      if (this._app) {
        this._app.renderer.resize();
        this._app._render();
        if (this._app.viewer3D && this._app.is3DMode) {
          this._app.viewer3D.resize();
        }
      }
    });
    this._ro.observe(this);

    // Make focusable for keyboard events
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this._app || oldVal === newVal) return;
    const mapping = ATTR_MAP[name];
    if (!mapping) return;
    this._app[mapping.prop] = mapping.type === 'number' ? Number(newVal) : newVal;
    this._app._render();
  }

  disconnectedCallback() {
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
    if (this._app) {
      this._app.destroy();
      this._app = null;
    }
  }
}

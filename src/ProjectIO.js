// ── ProjectIO.js ─────────────────────────────────────
// Extracted from App.js — JSON export/import, PNG export, share, load from hash.

import { ShareManager } from './ShareManager.js';
import { exportPNG, exportJSON } from './ExportManager.js';

export class ProjectIO {
  constructor(app) {
    this.app = app;
  }

  exportJSONFile() {
    const app = this.app;
    const data = app._getPersistPayload();
    exportJSON(data, app.projectName);
    app._status('JSON exported');
  }

  importJSON(event) {
    const app = this.app;
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        app.applyProjectPayload(data);
        app._status('Project loaded');
      } catch (err) {
        app._status('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  exportPNG() {
    const app = this.app;
    if (!exportPNG(app.currentStory, app.renderer, app.currentStory.name)) {
      app._status('Nothing to export');
      return;
    }
    app._status('PNG exported!');
  }

  async shareProject() {
    const app = this.app;
    const data = app._getPersistPayload();

    const encrypt = app.$('share-encrypt').checked;
    const password = encrypt ? app.$('share-password').value : null;

    if (encrypt && !password) {
      app._status('Enter a password to encrypt the share link');
      return;
    }

    try {
      app._status('Generating share link...');
      const { hash, byteSize } = await ShareManager.createShareHash(data, password);
      const url = window.location.origin + window.location.pathname + hash;

      const resultDiv = app.$('share-result');
      const urlInput = app.$('share-url');
      const sizeSpan = app.$('share-size');

      urlInput.value = url;
      resultDiv.style.display = '';

      const kb = (byteSize / 1024).toFixed(1);
      let sizeText = `${kb} KB compressed`;
      if (url.length > 50000) {
        sizeText += ' — URL is very long, some browsers may not support it';
      }
      sizeSpan.textContent = sizeText;

      await navigator.clipboard.writeText(url);
      app._status('Share link copied to clipboard');
    } catch (err) {
      app._status('Failed to generate share link');
    }
  }

  async loadFromHash() {
    const app = this.app;
    const hash = window.location.hash;
    const { present, encrypted } = ShareManager.parseHashType(hash);
    if (!present) return;

    if (encrypted) {
      this.showPasswordModal(hash);
    } else {
      try {
        const { data } = await ShareManager.loadFromHash(hash, null);
        this.app.applyProjectPayload(data);
        app._status('Shared project loaded');
        history.replaceState(null, '', window.location.pathname);
      } catch (err) {
        app._status('Failed to load shared project');
      }
    }
  }

  showPasswordModal(hash) {
    const app = this.app;
    const modal = app.$('share-password-modal');
    const input = app.$('share-modal-password');
    const errorDiv = app.$('share-modal-error');
    const okBtn = app.$('share-modal-ok');
    const cancelBtn = app.$('share-modal-cancel');
    const backdrop = modal.querySelector('.share-modal-backdrop');

    modal.style.display = '';
    input.value = '';
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    requestAnimationFrame(() => input.focus());

    const cleanup = () => {
      modal.style.display = 'none';
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      backdrop.removeEventListener('click', onCancel);
      input.removeEventListener('keydown', onKeyDown);
    };

    const onOk = async () => {
      const password = input.value;
      if (!password) {
        errorDiv.textContent = 'Please enter a password';
        errorDiv.style.display = '';
        return;
      }
      try {
        okBtn.disabled = true;
        okBtn.textContent = 'Unlocking...';
        const { data } = await ShareManager.loadFromHash(hash, password);
        cleanup();
        this.app.applyProjectPayload(data);
        app._status('Encrypted project loaded');
        history.replaceState(null, '', window.location.pathname);
      } catch (err) {
        okBtn.disabled = false;
        okBtn.textContent = 'Unlock';
        errorDiv.textContent = 'Wrong password or corrupted data';
        errorDiv.style.display = '';
      }
    };

    const onCancel = () => {
      cleanup();
      history.replaceState(null, '', window.location.pathname);
      app._status('Share link cancelled');
    };

    const onKeyDown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); onOk(); }
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
    };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    backdrop.addEventListener('click', onCancel);
    input.addEventListener('keydown', onKeyDown);
  }
}

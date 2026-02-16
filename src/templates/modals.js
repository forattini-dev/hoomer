// ── modals.js ──────────────────────────────────
// Modal dialogs (share password).

export const modals = `
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
  </div>`;

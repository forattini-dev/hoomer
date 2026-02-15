// ── CostsView.js ─────────────────────────────────────────
// Handles the BOM / Costs tab rendering and interaction.

import { BomCalculator } from './BomCalculator.js';

export class CostsView {
  constructor($, statusFn) {
    this.$ = $;
    this._status = statusFn;
    this._bomData = null;
    this.unitPrices = {};
  }

  render(stories) {
    const bom = BomCalculator.calculate(stories);
    this._bomData = bom;
    const container = this.$('costs-content');
    if (!container) return;

    if (bom.totals.length === 0) {
      container.innerHTML = '<div class="costs-inner"><div class="cost-empty">No items in the project yet. Add walls, doors, windows and other elements in the Creative tab.</div></div>';
      return;
    }

    // Group by category
    const categories = {};
    for (const item of bom.totals) {
      if (!categories[item.category]) categories[item.category] = [];
      categories[item.category].push(item);
    }

    let html = '<div class="costs-inner">';
    for (const [cat, items] of Object.entries(categories)) {
      html += `<div class="cost-category">`;
      html += `<div class="cost-category-title">${cat}</div>`;
      html += '<table class="cost-table"><thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead><tbody>';
      for (const item of items) {
        const key = `${item.category}|${item.description}`;
        const price = this.unitPrices[key] || 0;
        const qty = parseFloat(item.quantity);
        const total = (qty * price).toFixed(2);
        html += `<tr>
          <td>${item.description}</td>
          <td style="font-family:var(--font-mono);text-align:right">${item.quantity}</td>
          <td>${item.unit}</td>
          <td style="text-align:right"><input type="number" class="cost-price-input" data-key="${key}" value="${price}" min="0" step="0.01"></td>
          <td class="cost-item-total" data-key="${key}">${total}</td>
        </tr>`;
      }
      html += '</tbody></table></div>';
    }

    html += '<div class="cost-grand-total"><span class="total-label">Grand Total</span><span class="total-value" id="cost-grand-total-value">0.00</span></div>';
    html += '<button class="cost-breakdown-toggle" id="cost-breakdown-btn">Show Story Breakdown</button>';
    html += '<div class="cost-story-breakdown" id="cost-story-breakdown" style="display:none"></div>';
    html += '</div>';
    container.innerHTML = html;

    // Bind price inputs
    for (const input of container.querySelectorAll('.cost-price-input')) {
      input.addEventListener('input', () => {
        this.unitPrices[input.dataset.key] = parseFloat(input.value) || 0;
        this._recalcCosts();
      });
    }

    // Breakdown toggle
    const breakdownBtn = this.$('cost-breakdown-btn');
    if (breakdownBtn) {
      breakdownBtn.addEventListener('click', () => {
        const bd = this.$('cost-story-breakdown');
        if (!bd) return;
        if (bd.style.display === 'none') {
          bd.style.display = '';
          breakdownBtn.textContent = 'Hide Story Breakdown';
          this._renderStoryBreakdown(bom);
        } else {
          bd.style.display = 'none';
          breakdownBtn.textContent = 'Show Story Breakdown';
        }
      });
    }

    this._recalcCosts();
  }

  _recalcCosts() {
    let grandTotal = 0;
    const container = this.$('costs-content');
    if (!container) return;

    const byKey = new Map();
    for (const item of this._bomData?.totals || []) {
      const key = `${item.category}|${item.description}`;
      byKey.set(key, parseFloat(item.quantity) || 0);
    }

    for (const td of container.querySelectorAll('.cost-item-total')) {
      const key = td.dataset.key;
      const price = this.unitPrices[key] || 0;
      const qty = byKey.get(key) || 0;
      const total = qty * price;
      td.textContent = total.toFixed(2);
      grandTotal += total;
    }
    const gtEl = this.$('cost-grand-total-value');
    if (gtEl) gtEl.textContent = grandTotal.toFixed(2);
  }

  _renderStoryBreakdown(bom) {
    const bd = this.$('cost-story-breakdown');
    if (!bd) return;
    let html = '';
    for (const s of bom.stories) {
      html += `<div class="cost-story-title">${s.name}</div>`;
      if (s.items.length === 0) {
        html += '<div class="cost-empty">No items</div>';
        continue;
      }
      html += '<table class="cost-table"><thead><tr><th>Category</th><th>Description</th><th>Qty</th><th>Unit</th></tr></thead><tbody>';
      for (const item of s.items) {
        html += `<tr><td>${item.category}</td><td>${item.description}</td><td style="font-family:var(--font-mono);text-align:right">${item.quantity}</td><td>${item.unit}</td></tr>`;
      }
      html += '</tbody></table>';
    }
    bd.innerHTML = html;
  }

  copyClipboard() {
    if (!this._bomData) return;
    const text = BomCalculator.toText(this._bomData);
    navigator.clipboard.writeText(text).then(() => this._status('BOM copied to clipboard'));
  }

  downloadCSV() {
    if (!this._bomData) return;
    const csv = BomCalculator.toCSVWithPrices(this._bomData, this.unitPrices);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bill-of-materials.csv';
    a.click();
    URL.revokeObjectURL(url);
    this._status('CSV downloaded');
  }
}

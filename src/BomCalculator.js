import { Geom } from './geometry.js';
import { CONFIG } from './config.js';

export class BomCalculator {
  static calculate(stories) {
    const result = { stories: [], totals: {} };

    for (const story of stories) {
      const storyBom = { name: story.name, items: [] };
      const struct = story.layers.structure;
      const elec = story.layers.electrical;
      const plumb = story.layers.plumbing;

      // Walls — linear meters by material × thickness
      const wallMap = {};
      for (const w of struct.walls) {
        const key = `${w.material}|${w.thickness}`;
        if (!wallMap[key]) wallMap[key] = { material: w.material, thickness: w.thickness, length: 0, count: 0 };
        wallMap[key].length += w.length;
        wallMap[key].count++;
      }
      for (const v of Object.values(wallMap)) {
        storyBom.items.push({
          category: 'Walls',
          description: `${v.material} ${v.thickness}cm`,
          quantity: (v.length / 100).toFixed(2),
          unit: 'm',
          count: v.count,
        });
      }

      // Floors — area by material
      const floorMap = {};
      for (const f of struct.floors) {
        const key = f.material;
        if (!floorMap[key]) floorMap[key] = { material: f.material, area: 0, count: 0 };
        // Shoelace formula for area
        let area = 0;
        const p = f.polygon;
        for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
          area += p[j].x * p[i].y - p[i].x * p[j].y;
        }
        floorMap[key].area += Math.abs(area / 2);
        floorMap[key].count++;
      }
      for (const v of Object.values(floorMap)) {
        storyBom.items.push({
          category: 'Floors',
          description: v.material,
          quantity: (v.area / 10000).toFixed(2),
          unit: 'm\u00B2',
          count: v.count,
        });
      }

      // Doors — count by type × width
      const doorMap = {};
      for (const d of struct.doors) {
        const key = `${d.doorType}|${d.width}`;
        if (!doorMap[key]) doorMap[key] = { type: d.doorType, width: d.width, count: 0 };
        doorMap[key].count++;
      }
      for (const v of Object.values(doorMap)) {
        storyBom.items.push({
          category: 'Doors',
          description: `${v.type} ${v.width}cm`,
          quantity: v.count,
          unit: 'pcs',
          count: v.count,
        });
      }

      // Windows — count by type × width
      const winMap = {};
      for (const w of struct.windows) {
        const key = `${w.windowType}|${w.width}`;
        if (!winMap[key]) winMap[key] = { type: w.windowType, width: w.width, count: 0 };
        winMap[key].count++;
      }
      for (const v of Object.values(winMap)) {
        storyBom.items.push({
          category: 'Windows',
          description: `${v.type} ${v.width}cm`,
          quantity: v.count,
          unit: 'pcs',
          count: v.count,
        });
      }

      // Stairs — count by dimension
      const stairMap = {};
      for (const s of struct.stairs) {
        const key = `${s.width}x${s.length}`;
        if (!stairMap[key]) stairMap[key] = { width: s.width, length: s.length, count: 0 };
        stairMap[key].count++;
      }
      for (const v of Object.values(stairMap)) {
        storyBom.items.push({
          category: 'Stairs',
          description: `${v.width}x${v.length}cm`,
          quantity: v.count,
          unit: 'pcs',
          count: v.count,
        });
      }

      // Wires — meters by gauge
      const wireMap = {};
      for (const w of elec.wires) {
        const key = `${w.gauge}`;
        if (!wireMap[key]) wireMap[key] = { gauge: w.gauge, length: 0, count: 0 };
        wireMap[key].length += w.totalLength;
        wireMap[key].count++;
      }
      for (const v of Object.values(wireMap)) {
        storyBom.items.push({
          category: 'Wires',
          description: `${v.gauge}mm\u00B2`,
          quantity: (v.length / 100).toFixed(2),
          unit: 'm',
          count: v.count,
        });
      }

      // Panels
      const panelMap = {};
      for (const p of (elec.panels || [])) {
        const key = `${p.voltage}|${p.phases}|${p.mainBreakerA}`;
        if (!panelMap[key]) panelMap[key] = { voltage: p.voltage, phases: p.phases, mainBreakerA: p.mainBreakerA, count: 0 };
        panelMap[key].count++;
      }
      for (const v of Object.values(panelMap)) {
        storyBom.items.push({
          category: 'Panels',
          description: `${v.voltage}V ${v.phases}\u03C6 MB ${v.mainBreakerA}A`,
          quantity: v.count,
          unit: 'pcs',
          count: v.count,
        });
      }

      // Breakers / circuits
      const breakerMap = {};
      for (const c of (elec.circuits || [])) {
        const key = `${c.breakerA}|${c.poles}|${c.curve}`;
        if (!breakerMap[key]) breakerMap[key] = { breakerA: c.breakerA, poles: c.poles, curve: c.curve, count: 0 };
        breakerMap[key].count++;
      }
      for (const v of Object.values(breakerMap)) {
        storyBom.items.push({
          category: 'Breakers',
          description: `${v.breakerA}A ${v.poles}P curve ${v.curve}`,
          quantity: v.count,
          unit: 'pcs',
          count: v.count,
        });
      }

      // Electrical symbols — count by type
      const esymMap = {};
      for (const s of elec.symbols) {
        const key = s.symbolType;
        if (!esymMap[key]) esymMap[key] = { type: s.symbolType, count: 0 };
        esymMap[key].count++;
      }
      for (const v of Object.values(esymMap)) {
        storyBom.items.push({
          category: 'Electrical',
          description: CONFIG.ELECTRICAL_SYMBOL_LABELS[v.type] || v.type,
          quantity: v.count,
          unit: 'pcs',
          count: v.count,
        });
      }

      // Pipes — meters by type × diameter
      const pipeMap = {};
      for (const p of plumb.pipes) {
        const key = `${p.pipeType}|${p.diameter}`;
        if (!pipeMap[key]) pipeMap[key] = { type: p.pipeType, diameter: p.diameter, length: 0, count: 0 };
        pipeMap[key].length += p.totalLength;
        pipeMap[key].count++;
      }
      for (const v of Object.values(pipeMap)) {
        const typeLabel = CONFIG.PIPE_LABELS[v.type] || v.type;
        storyBom.items.push({
          category: 'Pipes',
          description: `${typeLabel} \u00D8${v.diameter}mm`,
          quantity: (v.length / 100).toFixed(2),
          unit: 'm',
          count: v.count,
        });
      }

      // Plumbing symbols — count by type
      const psymMap = {};
      for (const s of plumb.symbols) {
        const key = s.symbolType;
        if (!psymMap[key]) psymMap[key] = { type: s.symbolType, count: 0 };
        psymMap[key].count++;
      }
      for (const v of Object.values(psymMap)) {
        storyBom.items.push({
          category: 'Plumbing',
          description: CONFIG.PLUMBING_SYMBOL_LABELS[v.type] || v.type,
          quantity: v.count,
          unit: 'pcs',
          count: v.count,
        });
      }

      result.stories.push(storyBom);
    }

    // Aggregate totals
    const totalMap = {};
    for (const sb of result.stories) {
      for (const item of sb.items) {
        const key = `${item.category}|${item.description}|${item.unit}`;
        if (!totalMap[key]) totalMap[key] = { category: item.category, description: item.description, quantity: 0, unit: item.unit, count: 0 };
        totalMap[key].quantity += parseFloat(item.quantity);
        totalMap[key].count += item.count;
      }
    }
    result.totals = Object.values(totalMap).map(t => ({
      ...t,
      quantity: t.unit === 'pcs' ? t.quantity : t.quantity.toFixed(2),
    }));

    return result;
  }

  static toCSVWithPrices(bomResult, unitPrices) {
    const rows = [['Category', 'Description', 'Quantity', 'Unit', 'Unit Price', 'Total']];
    for (const item of bomResult.totals) {
      const key = `${item.category}|${item.description}`;
      const price = unitPrices[key] || 0;
      const qty = parseFloat(item.quantity);
      rows.push([item.category, item.description, item.quantity, item.unit, price.toFixed(2), (qty * price).toFixed(2)]);
    }
    return rows.map(r => r.join(',')).join('\n');
  }

  static toCSV(bomResult) {
    const rows = [['Floor', 'Category', 'Description', 'Quantity', 'Unit']];
    for (const s of bomResult.stories) {
      for (const item of s.items) {
        rows.push([s.name, item.category, item.description, item.quantity, item.unit]);
      }
    }
    rows.push([]);
    rows.push(['TOTALS', '', '', '', '']);
    for (const item of bomResult.totals) {
      rows.push(['Total', item.category, item.description, item.quantity, item.unit]);
    }
    return rows.map(r => r.join(',')).join('\n');
  }

  static toText(bomResult) {
    const lines = [];
    for (const s of bomResult.stories) {
      lines.push(`=== ${s.name} ===`);
      if (s.items.length === 0) { lines.push('  (empty)'); continue; }
      let lastCat = '';
      for (const item of s.items) {
        if (item.category !== lastCat) { lines.push(`  ${item.category}:`); lastCat = item.category; }
        lines.push(`    ${item.description}: ${item.quantity} ${item.unit}`);
      }
      lines.push('');
    }
    lines.push('=== TOTALS ===');
    let lastCat = '';
    for (const item of bomResult.totals) {
      if (item.category !== lastCat) { lines.push(`  ${item.category}:`); lastCat = item.category; }
      lines.push(`    ${item.description}: ${item.quantity} ${item.unit}`);
    }
    return lines.join('\n');
  }
}

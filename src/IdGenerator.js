// ── IdGenerator.js ─────────────────────────────────────
// Centralized globally-unique ID generation for all entities.

let counter = 0;

/**
 * Extract numeric portion from an ID (plain number or "prefix_123").
 * @param {unknown} value
 * @returns {number|null}
 */
function extractNumericId(value) {
  if (Number.isFinite(value) && Number.isInteger(value)) {
    return value;
  }
  if (typeof value !== 'string') return null;

  const normalized = value.trim();
  const plainNumber = Number(normalized);
  if (Number.isFinite(plainNumber) && Number.isInteger(plainNumber)) {
    return plainNumber;
  }
  const prefixed = /^([^_]+)_(\d+)$/;
  const match = prefixed.exec(normalized);
  if (!match) return null;
  const parsed = Number(match[2]);
  return Number.isFinite(parsed) && Number.isInteger(parsed) ? parsed : null;
}

/**
 * Reset the global counter. Positive integers seed at that value.
 * @param {number} [seed=0]
 */
export function resetCounter(seed = 0) {
  counter = Number.isFinite(seed) && Number.isInteger(seed) && seed > 0 ? seed : 0;
}

/**
 * Scan serialized state for max existing ID and seed counter accordingly.
 * @param {object|null} state
 * @returns {number} The seed value set.
 */
export function seedFromSerializedState(state) {
  let maxId = 0;
  let missingIdCount = 0;

  const pushCount = (item) => {
    if (!item || typeof item !== 'object') return;
    const parsed = extractNumericId(item.id);
    if (parsed && parsed > 0) {
      if (parsed > maxId) maxId = parsed;
    } else {
      missingIdCount += 1;
    }
  };

  resetCounter(0);

  if (!state || typeof state !== 'object') {
    counter = maxId;
    return maxId;
  }

  const stories = Array.isArray(state.stories) ? state.stories : [];
  for (const story of stories) {
    const layers = story?.layers || {};
    const structure = layers.structure || {};
    const furniture = layers.furniture || {};
    const electrical = layers.electrical || {};
    const plumbing = layers.plumbing || {};

    for (const wall of structure.walls || []) pushCount(wall);
    for (const door of structure.doors || []) pushCount(door);
    for (const window of structure.windows || []) pushCount(window);
    for (const floor of structure.floors || []) pushCount(floor);
    for (const stair of structure.stairs || []) pushCount(stair);
    for (const label of structure.labels || []) pushCount(label);
    for (const item of furniture.items || []) pushCount(item);
    for (const panel of electrical.panels || []) pushCount(panel);
    for (const circuit of electrical.circuits || []) pushCount(circuit);
    for (const wire of electrical.wires || []) pushCount(wire);
    for (const symbol of electrical.symbols || []) pushCount(symbol);
    for (const pipe of plumbing.pipes || []) pushCount(pipe);
    for (const symbol of plumbing.symbols || []) pushCount(symbol);
  }

  counter = Math.max(maxId, missingIdCount);
  return counter;
}

/**
 * Get next sequential ID.
 * @returns {number}
 */
export function nextId() {
  return ++counter;
}

/**
 * Get next sequential ID with a string prefix (e.g. "wall_42").
 * @param {string} prefix
 * @returns {string}
 */
export function nextPrefixedId(prefix) {
  return `${prefix}_${++counter}`;
}

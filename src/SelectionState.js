export const SELECTION_KEYS = Object.freeze([
  'wall',
  'floor',
  'door',
  'window',
  'stair',
  'label',
  'wire',
  'panel',
  'electricalSymbol',
  'pipe',
  'plumbingSymbol',
  'furniture',
]);

export function toPascalCase(value) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

export const SELECTION_ALIASES = Object.freeze(
  SELECTION_KEYS.map((key) => `selected${toPascalCase(key)}`),
);

/**
 * Encapsulates the current selection — one slot per selectable entity type.
 * Use `bindTarget(obj)` to create `selectedWall`, `selectedDoor`, etc. getters/setters.
 */
export class SelectionState {
  constructor() {
    /** @type {Record<string, any>} */
    this._values = Object.fromEntries(SELECTION_KEYS.map((key) => [key, null]));
  }

  /** @returns {string[]} */
  get keys() {
    return [...SELECTION_KEYS];
  }

  clear() {
    for (const key of SELECTION_KEYS) {
      this._values[key] = null;
    }
  }

  /**
   * @param {string} key
   * @returns {any}
   */
  get(key) {
    return this._values[key] ?? null;
  }

  /**
   * @param {string} key @param {any} value
   */
  set(key, value) {
    if (Object.prototype.hasOwnProperty.call(this._values, key)) {
      this._values[key] = value;
    }
  }

  /**
   * Define `selectedWall`, `selectedDoor`, etc. getters/setters on target.
   * @param {object} target
   * @returns {this}
   */
  bindTarget(target) {
    for (const key of SELECTION_KEYS) {
      const alias = `selected${toPascalCase(key)}`;
      Object.defineProperty(target, alias, {
        get: () => this.get(key),
        set: (value) => this.set(key, value),
        configurable: true,
        enumerable: true,
      });
    }
    return this;
  }

}

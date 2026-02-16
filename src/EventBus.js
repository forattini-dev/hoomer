// ── EventBus.js ─────────────────────────────────────
// Simple pub/sub for decoupling modules.

/** @typedef {(...args: any[]) => void} EventHandler */

export class EventBus {
  constructor() {
    /** @type {Map<string, EventHandler[]>} */
    this._handlers = new Map();
  }

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   * @param {string} event @param {EventHandler} fn
   * @returns {() => void}
   */
  on(event, fn) {
    if (!this._handlers.has(event)) this._handlers.set(event, []);
    this._handlers.get(event).push(fn);
    return () => this.off(event, fn);
  }

  /**
   * Unsubscribe a handler from an event.
   * @param {string} event @param {EventHandler} fn
   */
  off(event, fn) {
    const list = this._handlers.get(event);
    if (list) {
      const i = list.indexOf(fn);
      if (i >= 0) list.splice(i, 1);
    }
  }

  /**
   * Emit an event with optional data.
   * @param {string} event @param {*} [data]
   */
  emit(event, data) {
    const list = this._handlers.get(event);
    if (list) for (const fn of list) fn(data);
  }

  /** Remove all handlers. */
  destroy() {
    this._handlers.clear();
  }
}

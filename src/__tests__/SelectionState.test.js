import { describe, it, expect } from 'vitest';
import { SelectionState, SELECTION_KEYS, SELECTION_ALIASES } from '../SelectionState.js';

describe('SelectionState', () => {
  it('constructor creates all keys as null', () => {
    const sel = new SelectionState();
    for (const key of SELECTION_KEYS) {
      expect(sel.get(key)).toBeNull();
    }
  });

  it('get/set works for known keys', () => {
    const sel = new SelectionState();
    const sentinel = { id: 42 };
    sel.set('wall', sentinel);
    expect(sel.get('wall')).toBe(sentinel);
  });

  it('set ignores unknown keys', () => {
    const sel = new SelectionState();
    sel.set('unknownKey', 'value');
    expect(sel.get('unknownKey')).toBeNull();
  });

  it('clear resets all values to null', () => {
    const sel = new SelectionState();
    sel.set('wall', { id: 1 });
    sel.set('floor', { id: 2 });
    sel.clear();
    for (const key of SELECTION_KEYS) {
      expect(sel.get(key)).toBeNull();
    }
  });

  it('bindTarget creates getters/setters on target object', () => {
    const sel = new SelectionState();
    const target = {};
    sel.bindTarget(target);

    // Verify all aliases exist as properties
    for (const alias of SELECTION_ALIASES) {
      expect(alias in target).toBe(true);
    }

    // Test getter/setter via alias
    const wall = { id: 99 };
    target.selectedWall = wall;
    expect(sel.get('wall')).toBe(wall);
    expect(target.selectedWall).toBe(wall);
  });
});

describe('SELECTION_KEYS and SELECTION_ALIASES exports', () => {
  it('SELECTION_KEYS contains expected keys', () => {
    expect(SELECTION_KEYS).toContain('wall');
    expect(SELECTION_KEYS).toContain('floor');
    expect(SELECTION_KEYS).toContain('door');
    expect(SELECTION_KEYS).toContain('furniture');
    expect(SELECTION_KEYS.length).toBeGreaterThanOrEqual(12);
  });

  it('SELECTION_ALIASES matches keys with selected prefix', () => {
    expect(SELECTION_ALIASES).toContain('selectedWall');
    expect(SELECTION_ALIASES).toContain('selectedFloor');
    expect(SELECTION_ALIASES).toContain('selectedDoor');
    expect(SELECTION_ALIASES.length).toBe(SELECTION_KEYS.length);
  });
});

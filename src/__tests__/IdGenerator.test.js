import { describe, it, expect, beforeEach } from 'vitest';
import { resetCounter, seedFromSerializedState, nextId, nextPrefixedId } from '../IdGenerator.js';

beforeEach(() => {
  resetCounter(0);
});

describe('resetCounter', () => {
  it('resets counter to 0 by default', () => {
    nextId(); // counter becomes 1
    resetCounter(0);
    expect(nextId()).toBe(1);
  });

  it('resets counter to a given seed', () => {
    resetCounter(100);
    expect(nextId()).toBe(101);
  });

  it('ignores negative seeds and resets to 0', () => {
    resetCounter(-5);
    expect(nextId()).toBe(1);
  });
});

describe('nextId', () => {
  it('returns incrementing integers', () => {
    expect(nextId()).toBe(1);
    expect(nextId()).toBe(2);
    expect(nextId()).toBe(3);
  });
});

describe('nextPrefixedId', () => {
  it('returns prefixed id with incrementing counter', () => {
    expect(nextPrefixedId('wall')).toBe('wall_1');
    expect(nextPrefixedId('wall')).toBe('wall_2');
  });

  it('works with different prefixes sharing the counter', () => {
    expect(nextPrefixedId('panel')).toBe('panel_1');
    expect(nextPrefixedId('circuit')).toBe('circuit_2');
  });
});

describe('seedFromSerializedState', () => {
  it('seeds counter from highest id in state', () => {
    const state = {
      stories: [{
        layers: {
          structure: { walls: [{ id: 5 }, { id: 10 }], doors: [], windows: [], floors: [], stairs: [], labels: [] },
          furniture: { items: [] },
          electrical: { panels: [], circuits: [], wires: [], symbols: [] },
          plumbing: { pipes: [], symbols: [] },
        },
      }],
    };
    const result = seedFromSerializedState(state);
    expect(result).toBe(10);
    expect(nextId()).toBe(11);
  });

  it('handles empty state gracefully', () => {
    const result = seedFromSerializedState(null);
    expect(result).toBe(0);
  });
});

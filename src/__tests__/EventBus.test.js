import { describe, it, expect } from 'vitest';
import { EventBus } from '../EventBus.js';

describe('EventBus', () => {
  it('on/emit fires handler', () => {
    const bus = new EventBus();
    let called = false;
    bus.on('test', () => { called = true; });
    bus.emit('test');
    expect(called).toBe(true);
  });

  it('off removes handler', () => {
    const bus = new EventBus();
    let count = 0;
    const handler = () => { count++; };
    bus.on('test', handler);
    bus.emit('test');
    bus.off('test', handler);
    bus.emit('test');
    expect(count).toBe(1);
  });

  it('on returns unsubscribe function', () => {
    const bus = new EventBus();
    let count = 0;
    const unsub = bus.on('test', () => { count++; });
    bus.emit('test');
    unsub();
    bus.emit('test');
    expect(count).toBe(1);
  });

  it('emit passes data to handler', () => {
    const bus = new EventBus();
    let received = null;
    bus.on('data', (d) => { received = d; });
    bus.emit('data', { value: 42 });
    expect(received).toEqual({ value: 42 });
  });

  it('supports multiple handlers for same event', () => {
    const bus = new EventBus();
    const calls = [];
    bus.on('multi', () => calls.push('a'));
    bus.on('multi', () => calls.push('b'));
    bus.emit('multi');
    expect(calls).toEqual(['a', 'b']);
  });

  it('destroy clears all handlers', () => {
    const bus = new EventBus();
    let count = 0;
    bus.on('e1', () => { count++; });
    bus.on('e2', () => { count++; });
    bus.destroy();
    bus.emit('e1');
    bus.emit('e2');
    expect(count).toBe(0);
  });
});

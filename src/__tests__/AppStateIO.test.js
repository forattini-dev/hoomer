import { describe, it, expect, beforeEach } from 'vitest';
import { storyName, createLayeredStory, serializeState, deserializeState } from '../AppStateIO.js';
import { Wall } from '../Wall.js';
import { Floor } from '../Floor.js';
import { Door } from '../Door.js';
import { Label } from '../Label.js';
import { ElectricalPanel } from '../ElectricalPanel.js';
import { ElectricalCircuit } from '../ElectricalCircuit.js';
import { resetCounter } from '../IdGenerator.js';

beforeEach(() => {
  resetCounter(0);
});

describe('storyName', () => {
  it('returns "Ground Floor" for index 0', () => {
    expect(storyName(0)).toBe('Ground Floor');
  });

  it('returns "Floor N" for index > 0', () => {
    expect(storyName(1)).toBe('Floor 1');
    expect(storyName(3)).toBe('Floor 3');
  });
});

describe('createLayeredStory', () => {
  it('creates story with correct structure', () => {
    const story = createLayeredStory('Test Floor');
    expect(story.name).toBe('Test Floor');
    expect(story.activeLayer).toBe('structure');
    expect(story.layers.structure).toBeDefined();
    expect(story.layers.furniture).toBeDefined();
    expect(story.layers.electrical).toBeDefined();
    expect(story.layers.plumbing).toBeDefined();
  });

  it('has empty arrays in all layers', () => {
    const story = createLayeredStory('Test');
    expect(story.layers.structure.walls).toEqual([]);
    expect(story.layers.structure.doors).toEqual([]);
    expect(story.layers.structure.floors).toEqual([]);
    expect(story.layers.furniture.items).toEqual([]);
    expect(story.layers.electrical.panels).toEqual([]);
    expect(story.layers.electrical.circuits).toEqual([]);
    expect(story.layers.electrical.wires).toEqual([]);
    expect(story.layers.plumbing.pipes).toEqual([]);
    expect(story.layers.plumbing.symbols).toEqual([]);
  });
});

describe('serializeState / deserializeState round-trip', () => {
  it('preserves walls through serialize then deserialize', () => {
    const wall = new Wall(0, 0, 200, 0, 15, 'brick');
    const story = createLayeredStory('Ground Floor');
    story.layers.structure.walls = [wall];

    const app = {
      stories: [story],
      activeStoryIndex: 0,
      activeTool: 'wall',
      projectName: 'My Project',
    };

    const serialized = serializeState(app);
    resetCounter(0);
    const deserialized = deserializeState(serialized);

    expect(deserialized.stories).toHaveLength(1);
    expect(deserialized.stories[0].layers.structure.walls).toHaveLength(1);
    const restoredWall = deserialized.stories[0].layers.structure.walls[0];
    expect(restoredWall.x1).toBe(0);
    expect(restoredWall.x2).toBe(200);
    expect(restoredWall.thickness).toBe(15);
    expect(restoredWall.material).toBe('brick');
  });

  it('preserves projectName and activeTool', () => {
    const app = {
      stories: [createLayeredStory('Ground Floor')],
      activeStoryIndex: 0,
      activeTool: 'select',
      projectName: 'Test Project',
    };
    const serialized = serializeState(app);
    const deserialized = deserializeState(serialized);
    expect(deserialized.projectName).toBe('Test Project');
    expect(deserialized.activeTool).toBe('select');
  });
});

describe('deserializeState edge cases', () => {
  it('handles null input gracefully', () => {
    const result = deserializeState(null);
    expect(result.stories).toHaveLength(1);
    expect(result.stories[0].name).toBe('Ground Floor');
    expect(result.activeStoryIndex).toBe(0);
    expect(result.activeTool).toBe('wall');
    expect(result.projectName).toBe('Untitled Project');
  });

  it('handles empty object input', () => {
    const result = deserializeState({});
    expect(result.stories).toHaveLength(1);
    expect(result.activeStoryIndex).toBe(0);
  });

  it('normalizes activeStoryIndex to valid bounds', () => {
    const app = {
      stories: [createLayeredStory('Ground Floor')],
      activeStoryIndex: 0,
      activeTool: 'wall',
      projectName: 'Test',
    };
    const serialized = serializeState(app);
    serialized.activeStoryIndex = 99;
    const deserialized = deserializeState(serialized);
    expect(deserialized.activeStoryIndex).toBe(0);
  });

  it('handles negative activeStoryIndex', () => {
    const serialized = { stories: [], activeStoryIndex: -5 };
    const result = deserializeState(serialized);
    expect(result.activeStoryIndex).toBe(0);
  });
});

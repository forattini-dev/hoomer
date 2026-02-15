import { CONFIG } from './config.js';
import { Wall } from './Wall.js';
import { Floor } from './Floor.js';
import { Door } from './Door.js';
import { Window } from './Window.js';
import { Stair } from './Stair.js';
import { Label } from './Label.js';
import { Wire } from './Wire.js';
import { ElectricalPanel } from './ElectricalPanel.js';
import { ElectricalCircuit } from './ElectricalCircuit.js';
import { ElectricalSymbol } from './ElectricalSymbol.js';
import { Pipe } from './Pipe.js';
import { PlumbingSymbol } from './PlumbingSymbol.js';
import { Furniture } from './Furniture.js';

export function storyName(index) {
  return index === 0 ? 'Ground Floor' : `Floor ${index}`;
}

export function createLayeredStory(name) {
  return {
    name,
    activeLayer: 'structure',
    storyHeight: CONFIG.DEFAULT_STORY_HEIGHT,
    slabThickness: CONFIG.DEFAULT_SLAB_THICKNESS,
    layers: {
      structure: { visible: true, walls: [], doors: [], windows: [], floors: [], stairs: [], labels: [] },
      furniture: { visible: true, items: [] },
      electrical: { visible: true, panels: [], circuits: [], wires: [], symbols: [] },
      plumbing: { visible: true, pipes: [], symbols: [] },
    },
  };
}

function asNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asIntegerOrMinusOne(value) {
  const num = Number(value);
  return Number.isInteger(num) ? num : -1;
}

function parseOrEmpty(value, mapFn) {
  if (!Array.isArray(value)) return [];

  const parsed = [];
  for (let i = 0; i < value.length; i++) {
    const item = mapFn(value[i]);
    if (item) parsed.push(item);
  }
  return parsed;
}

function parseOrEmptyLayerItems(layer, key, mapper) {
  return parseOrEmpty(layer && layer[key], mapper);
}

export function serializeState(app) {
  const stories = asArray(app?.stories).map((story) => serializeStory(story));

  return {
    activeStoryIndex: Math.max(0, Number.isInteger(app?.activeStoryIndex) ? app.activeStoryIndex : 0),
    activeTool: app?.activeTool || 'wall',
    projectName: app?.projectName || 'Untitled Project',
    unitPrices: app?.costsView?.unitPrices ? { ...app.costsView.unitPrices } : {},
    stories,
  };
}

function serializeStory(story) {
  const structure = story?.layers?.structure || {};
  const furniture = story?.layers?.furniture || {};
  const electrical = story?.layers?.electrical || {};
  const plumbing = story?.layers?.plumbing || {};

  const structureWalls = asArray(structure.walls);
  return {
    name: story?.name,
    activeLayer: story?.activeLayer || 'structure',
    storyHeight: story?.storyHeight,
    slabThickness: story?.slabThickness,
    layers: {
      structure: {
        visible: structure.visible !== false,
        walls: structureWalls.map((wall) => wall.serialize()),
        doors: asArray(structure.doors).map((door) => door.serialize(structureWalls.indexOf(door.wall))),
        windows: asArray(structure.windows).map((windowItem) => windowItem.serialize(structureWalls.indexOf(windowItem.wall))),
        floors: asArray(structure.floors).map((floor) => floor.serialize()),
        stairs: asArray(structure.stairs).map((stair) => stair.serialize()),
        labels: asArray(structure.labels).map((label) => label.serialize()),
      },
      furniture: {
        visible: furniture.visible !== false,
        items: asArray(furniture.items).map((item) => item.serialize()),
      },
      electrical: {
        visible: electrical.visible !== false,
        panels: asArray(electrical.panels).map((panel) => panel.serialize()),
        circuits: asArray(electrical.circuits).map((circuit) => circuit.serialize()),
        wires: asArray(electrical.wires).map((wire) => wire.serialize()),
        symbols: asArray(electrical.symbols).map((symbol) => symbol.serialize()),
      },
      plumbing: {
        visible: plumbing.visible !== false,
        pipes: asArray(plumbing.pipes).map((pipe) => pipe.serialize()),
        symbols: asArray(plumbing.symbols).map((symbol) => symbol.serialize()),
      },
    },
  };
}

export function deserializeState(rawState) {
  const safeState = rawState && typeof rawState === 'object' ? rawState : {};
  const stories = asArray(safeState.stories).map(deserializeStory).filter(Boolean);

  const normalizedStories = stories.length ? stories : [createLayeredStory(storyName(0))];
  const requestedStoryIndex = asIntegerOrMinusOne(safeState.activeStoryIndex);

  return {
    stories: normalizedStories,
    activeStoryIndex: requestedStoryIndex >= 0
      ? Math.min(normalizedStories.length - 1, requestedStoryIndex)
      : 0,
    activeTool: safeState.activeTool || 'wall',
    projectName: safeState.projectName || 'Untitled Project',
    unitPrices: normalizeUnitPrices(safeState.unitPrices),
  };
}

function normalizeUnitPrices(unitPrices) {
  if (unitPrices && typeof unitPrices === 'object' && !Array.isArray(unitPrices)) {
    return { ...unitPrices };
  }
  return {};
}

function deserializeStory(story) {
  if (!story || typeof story !== 'object') return createLayeredStory(storyName(0));
  if (!story.layers) return _migrateOldStory(story);

  const layers = story.layers || {};
  return {
    name: story.name,
    activeLayer: story.activeLayer || 'structure',
    storyHeight: asNumber(story.storyHeight, CONFIG.DEFAULT_STORY_HEIGHT),
    slabThickness: asNumber(story.slabThickness, CONFIG.DEFAULT_SLAB_THICKNESS),
    layers: {
      structure: deserializeStructureLayer(layers.structure || {}),
      furniture: deserializeFurnitureLayer(layers.furniture || {}),
      electrical: deserializeElectricalLayer(layers.electrical || {}),
      plumbing: deserializePlumbingLayer(layers.plumbing || {}),
    },
  };
}

function _migrateOldStory(story) {
  return {
    name: story.name,
    activeLayer: 'structure',
    storyHeight: CONFIG.DEFAULT_STORY_HEIGHT,
    slabThickness: CONFIG.DEFAULT_SLAB_THICKNESS,
    layers: {
      structure: deserializeStructureLayer({
        visible: true,
        walls: story.walls,
        doors: story.doors,
        windows: story.windows,
        floors: story.floors,
        stairs: story.stairs,
        labels: story.labels,
      }),
      furniture: { visible: true, items: [] },
      electrical: { visible: true, panels: [], circuits: [], wires: [], symbols: [] },
      plumbing: { visible: true, pipes: [], symbols: [] },
    },
  };
}

function deserializeStructureLayer(layer) {
  const walls = parseOrEmptyLayerItems(layer, 'walls', (wall) => Wall.fromData(wall));
  const doors = parseOrEmptyLayerItems(layer, 'doors', (d) => {
    const wallIndex = asIntegerOrMinusOne(d && d.wallIndex);
    if (wallIndex < 0 || wallIndex >= walls.length) return null;
    return Door.fromData(d, walls[wallIndex]);
  });
  const windows = parseOrEmptyLayerItems(layer, 'windows', (win) => {
    const wallIndex = asIntegerOrMinusOne(win && win.wallIndex);
    if (wallIndex < 0 || wallIndex >= walls.length) return null;
    return Window.fromData(win, walls[wallIndex]);
  });

  return {
    visible: layer.visible !== false,
    walls,
    doors,
    windows,
    floors: parseOrEmptyLayerItems(layer, 'floors', (floor) => Floor.fromData(floor)),
    stairs: parseOrEmptyLayerItems(layer, 'stairs', (stair) => Stair.fromData(stair)),
    labels: parseOrEmptyLayerItems(layer, 'labels', (label) => Label.fromData(label)),
  };
}

function deserializeElectricalLayer(layer) {
  return {
    visible: layer.visible !== false,
    panels: parseOrEmptyLayerItems(layer, 'panels', (panel) => ElectricalPanel.fromData(panel)),
    circuits: parseOrEmptyLayerItems(layer, 'circuits', (circuit) => ElectricalCircuit.fromData(circuit)),
    wires: parseOrEmptyLayerItems(layer, 'wires', (wire) => Wire.fromData(wire)),
    symbols: parseOrEmptyLayerItems(layer, 'symbols', (sym) => ElectricalSymbol.fromData(sym)),
  };
}

function deserializePlumbingLayer(layer) {
  return {
    visible: layer.visible !== false,
    pipes: parseOrEmptyLayerItems(layer, 'pipes', (pipe) => Pipe.fromData(pipe)),
    symbols: parseOrEmptyLayerItems(layer, 'symbols', (sym) => PlumbingSymbol.fromData(sym)),
  };
}

function deserializeFurnitureLayer(layer) {
  return {
    visible: layer.visible !== false,
    items: parseOrEmptyLayerItems(layer, 'items', (item) => Furniture.fromData(item)),
  };
}


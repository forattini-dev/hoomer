const TOOL_PANEL_MAP = Object.freeze({
  wall: 'wall-props',
  floor: 'floor-props',
  door: 'door-props',
  window: 'window-props',
  stair: 'stair-props',
  label: 'label-props',
  panel: 'panel-props',
  wire: 'wire-props',
  electrical_symbol: 'electrical-symbol-props',
  pipe: 'pipe-props',
  plumbing_symbol: 'plumbing-symbol-props',
  furniture_item: 'furniture-props',
});

const TOOL_SHORTCUTS_BY_LAYER = Object.freeze({
  structure: {
    w: 'wall',
    v: 'select',
    f: 'floor',
    e: 'eraser',
    d: 'door',
    n: 'window',
    s: 'stair',
    l: 'label',
  },
  electrical: {
    q: 'panel',
    w: 'wire',
    s: 'electrical_symbol',
    v: 'select',
    e: 'eraser',
  },
  plumbing: {
    p: 'pipe',
    s: 'plumbing_symbol',
    v: 'select',
    e: 'eraser',
  },
  furniture: {
    f: 'furniture_item',
    v: 'select',
    e: 'eraser',
  },
});

const ALL_TOOL_PROP_PANEL_IDS = Object.freeze([
  'wall-props',
  'floor-props',
  'door-props',
  'window-props',
  'stair-props',
  'label-props',
  'panel-props',
  'wire-props',
  'electrical-symbol-props',
  'pipe-props',
  'plumbing-symbol-props',
  'furniture-props',
  'selection-props',
  'sel-door-props',
  'sel-window-props',
  'sel-stair-props',
  'sel-label-props',
  'sel-panel-props',
  'sel-wire-props',
  'sel-elec-symbol-props',
  'sel-pipe-props',
  'sel-plumb-symbol-props',
  'sel-furniture-props',
]);

export { TOOL_PANEL_MAP, TOOL_SHORTCUTS_BY_LAYER, ALL_TOOL_PROP_PANEL_IDS };

export const CONFIG = {
  FONT_FAMILY: '"Segoe UI", system-ui, sans-serif',
  COLORS: {
    SELECTION: '#7b96aa',
    TEXT: '#5a5550',
    DIM_LINE: '#b0aca5',
    WIRE_LABEL: '#c87a10',
    ELEC_LABEL: '#b27b12',
    CANVAS_BG: '#fefefe',
    GRID_MINOR: '#eeece8',
    GRID_MAJOR: '#ddd9d3',
    GRID_AXIS: '#c0bdb6',
    GRID_LABEL: '#b0aca5',
    GHOST: '#c5c0b8',
    GHOST_STROKE: '#b0aaa0',
    WALL_HOVER: '#9ab3c5',
    WALL_FALLBACK: '#95a5a6',
    FLOOR_FALLBACK: '#f0e8d8',
    WINDOW_GLASS: '#5896b0',
    STAIR_FILL: '#f5f2ec',
    STAIR_STEP: '#c5c0b8',
    STAIR_TEXT: '#8a8580',
    PANEL_DANGER: '#cf4d3a',
    PANEL_DANGER_TEXT: '#b33221',
    PANEL_NORMAL_TEXT: '#9b6c10',
    FLOOR_PREVIEW: '#c8956c',
    FLOOR_PREVIEW_FILL: '#d4a574',
    SNAP_ENDPOINT: '#8bb89e',
    TERRAIN_BORDER: '#c5c0b8',
  },
  HIT_MARGIN: 5,
  HIT_MARGIN_LINE: 6,
  SCALE: 1,
  DEFAULT_GRID: 10,
  MAJOR_GRID_MULT: 5,
  DEFAULT_WALL_THICKNESS: 15,
  DEFAULT_WALL_MATERIAL: 'brick',
  DEFAULT_FLOOR_MATERIAL: 'ceramic',
  DEFAULT_DOOR_WIDTH: 80,
  DEFAULT_WINDOW_WIDTH: 60,
  DEFAULT_STAIR_WIDTH: 100,
  DEFAULT_STAIR_LENGTH: 280,
  DEFAULT_TERRAIN_WIDTH: 2000,   // 20m
  DEFAULT_TERRAIN_HEIGHT: 2500,  // 25m
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 5,
  ZOOM_STEP: 0.1,
  SNAP_RADIUS: 10,
  ANGLE_SNAP_DEG: 45,
  MIN_WALL_LENGTH: 5,
  DIMENSION_OFFSET: 20,
  DEFAULT_LABEL_FONT_SIZE: 16,

  // ── 3D Defaults ────────────────────────────────
  DEFAULT_STORY_HEIGHT: 280,           // 2.80m floor-to-floor (cm)
  DEFAULT_SLAB_THICKNESS: 15,          // 15cm slab (cm)
  DEFAULT_DOOR_HEIGHT: 210,            // 2.10m (cm)
  DEFAULT_WINDOW_HEIGHT: 120,          // 1.20m (cm)
  DEFAULT_WINDOW_SILL_HEIGHT: 90,      // 0.90m sill (cm)

  // ── Layers ──────────────────────────────────
  LAYERS: ['structure', 'furniture', 'electrical', 'plumbing'],
  LAYER_META: {
    structure: {
      label: 'Structure',
      shortLabel: 'Struct',
      icon: '▦',
    },
    furniture: {
      label: 'Furniture',
      shortLabel: 'Furniture',
      icon: '🪑',
    },
    electrical: {
      label: 'Electrical',
      shortLabel: 'Elec',
      icon: '⚡',
    },
    plumbing: {
      label: 'Plumbing',
      shortLabel: 'Plumb',
      icon: '🚰',
    },
  },
  LAYER_COLORS: {
    structure: '#7b96aa',
    furniture: '#9b7bb5',
    electrical: '#f5a623',
    plumbing: '#4a90d9',
  },
  INACTIVE_LAYER_OPACITY: 0.18,

  LAYER_TOOLS: {
    structure: ['wall', 'door', 'window', 'stair', 'floor', 'label', 'select', 'eraser'],
    furniture: ['furniture_item', 'select', 'eraser'],
    electrical: ['panel', 'wire', 'electrical_symbol', 'select', 'eraser'],
    plumbing: ['pipe', 'plumbing_symbol', 'select', 'eraser'],
  },

  TOOL_PANEL_MAP,

  TOOL_SHORTCUTS_BY_LAYER,

  ALL_TOOL_PROP_PANEL_IDS,

  // ── Electrical ──────────────────────────────
  WIRE_GAUGES: [1.5, 2.5, 4, 6, 10],
  WIRE_COLORS: '#f5a623',
  WIRE_THICKNESS: {
    1.5: 1.5,
    2.5: 2,
    4: 2.5,
    6: 3,
    10: 4,
  },

  ELECTRICAL_SYMBOL_TYPES: [
    'outlet_low', 'outlet_med', 'outlet_high',
    'switch_single', 'switch_double', 'switch_parallel',
    'light_ceiling', 'light_wall',
    'distribution_panel',
  ],

  ELECTRICAL_SYMBOL_LABELS: {
    outlet_low: 'Outlet Low',
    outlet_med: 'Outlet Med',
    outlet_high: 'Outlet High',
    switch_single: 'Switch',
    switch_double: 'Switch 2x',
    switch_parallel: 'Switch Par.',
    light_ceiling: 'Light Ceil.',
    light_wall: 'Light Wall',
    distribution_panel: 'QD Panel',
  },
  DEFAULT_PANEL_VOLTAGE: 220,
  DEFAULT_PANEL_PHASES: 1,
  DEFAULT_PANEL_MAIN_BREAKER_A: 63,
  DEFAULT_PANEL_BUS_CAPACITY_A: 100,
  DEFAULT_CIRCUIT_BREAKER_A: 20,
  DEFAULT_SYMBOL_AMPERAGE_A: 10,

  // ── Plumbing ────────────────────────────────
  PIPE_TYPES: ['cold', 'hot', 'drainage'],
  PIPE_COLORS: {
    cold: '#4a90d9',
    hot: '#e74c3c',
    drainage: '#8B5E3C',
  },
  PIPE_LABELS: {
    cold: 'Cold water',
    hot: 'Hot water',
    drainage: 'Waste water',
  },
  PIPE_DASH: {
    cold: [],
    hot: [8, 4],
    drainage: [],
  },
  PIPE_THICKNESS: 2.5,
  PIPE_DIAMETERS: [20, 25, 32, 40, 50, 75, 100],

  PLUMBING_SYMBOL_TYPES: [
    'valve', 'drain', 'water_tank', 'water_pump', 'pool', 'motor',
  ],

  PLUMBING_SYMBOL_LABELS: {
    valve: 'Valve',
    drain: 'Drain',
    water_tank: 'Water Tank',
    water_pump: 'Water Pump',
    pool: 'Pool',
    motor: 'Motor',
  },

  // ── Furniture ──────────────────────────────
  FURNITURE_CATALOG: {
    // Living Room
    sofa_2seat:   { label: 'Sofa 2p',     topLabel: 'S2', w: 160, d: 85,  h: 85,  color: '#8B6914', category: 'living' },
    sofa_3seat:   { label: 'Sofa 3p',     topLabel: 'S3', w: 220, d: 85,  h: 85,  color: '#8B6914', category: 'living' },
    armchair:     { label: 'Armchair',     topLabel: 'CA',  w: 85,  d: 85,  h: 85,  color: '#A0522D', category: 'living' },
    coffee_table: { label: 'Coffee Tbl',   topLabel: 'CT',  w: 120, d: 60,  h: 45,  color: '#DEB887', category: 'living' },
    tv_console:   { label: 'TV Console',   topLabel: 'TV',  w: 150, d: 40,  h: 50,  color: '#4a4a4a', category: 'living' },
    // Dining
    dining_table: { label: 'Dining Tbl',   topLabel: 'DT',  w: 160, d: 90,  h: 75,  color: '#DEB887', category: 'dining' },
    round_table:  { label: 'Round Tbl',    topLabel: 'RT',  w: 120, d: 120, h: 75,  color: '#DEB887', category: 'dining' },
    chair:        { label: 'Chair',        topLabel: 'C',   w: 45,  d: 45,  h: 85,  color: '#A0522D', category: 'dining' },
    // Bedroom
    bed_single:   { label: 'Bed 1p',      topLabel: 'B1',  w: 100, d: 200, h: 50,  color: '#E8D5B7', category: 'bedroom' },
    bed_double:   { label: 'Bed 2p',      topLabel: 'B2',  w: 140, d: 200, h: 50,  color: '#E8D5B7', category: 'bedroom' },
    bed_queen:    { label: 'Bed Queen',    topLabel: 'BQ',  w: 160, d: 200, h: 50,  color: '#E8D5B7', category: 'bedroom' },
    wardrobe:     { label: 'Wardrobe',     topLabel: 'Arm', w: 180, d: 60,  h: 220, color: '#8B5E3C', category: 'bedroom' },
    nightstand:   { label: 'Nightstand',   topLabel: 'NS',  w: 50,  d: 40,  h: 55,  color: '#DEB887', category: 'bedroom' },
    // Kitchen
    kitchen_sink: { label: 'K. Sink',      topLabel: 'Pia', w: 80,  d: 60,  h: 85,  color: '#C0C0C0', category: 'kitchen' },
    stove:        { label: 'Stove',        topLabel: 'Fog', w: 60,  d: 60,  h: 85,  color: '#2f2f2f', category: 'kitchen' },
    fridge:       { label: 'Fridge',       topLabel: 'Gel', w: 70,  d: 70,  h: 180, color: '#E0E0E0', category: 'kitchen' },
    // Bathroom
    toilet:       { label: 'Toilet',       topLabel: 'V',   w: 40,  d: 65,  h: 40,  color: '#F5F5F5', category: 'bathroom' },
    bath_sink:    { label: 'B. Sink',      topLabel: 'SB',  w: 50,  d: 40,  h: 85,  color: '#F5F5F5', category: 'bathroom' },
    bathtub:      { label: 'Bathtub',      topLabel: 'Ban', w: 170, d: 75,  h: 60,  color: '#F5F5F5', category: 'bathroom' },
    shower:       { label: 'Shower',       topLabel: 'Chu', w: 90,  d: 90,  h: 200, color: '#D0E8F0', category: 'bathroom' },
    // Office
    desk:         { label: 'Desk',         topLabel: 'Mesa', w: 140, d: 70,  h: 75,  color: '#DEB887', category: 'office' },
    office_chair: { label: 'Off. Chair',   topLabel: 'CO',  w: 55,  d: 55,  h: 110, color: '#333',    category: 'office' },
  },

  FURNITURE_CATEGORIES: {
    living:   'Living Room',
    dining:   'Dining',
    bedroom:  'Bedroom',
    kitchen:  'Kitchen',
    bathroom: 'Bathroom',
    office:   'Office',
  },
};

import { describe, it, expect } from 'vitest';
import { Geom } from '../geometry.js';

describe('Geom.dist', () => {
  it('returns 0 for same point', () => {
    expect(Geom.dist(0, 0, 0, 0)).toBe(0);
  });

  it('returns correct distance for horizontal segment', () => {
    expect(Geom.dist(0, 0, 3, 0)).toBe(3);
  });

  it('returns correct distance for vertical segment', () => {
    expect(Geom.dist(0, 0, 0, 4)).toBe(4);
  });

  it('returns correct distance for 3-4-5 triangle', () => {
    expect(Geom.dist(0, 0, 3, 4)).toBe(5);
  });
});

describe('Geom.angle', () => {
  it('returns 0 for point to the right', () => {
    expect(Geom.angle(0, 0, 10, 0)).toBe(0);
  });

  it('returns PI/2 for point directly below (screen coords)', () => {
    expect(Geom.angle(0, 0, 0, 10)).toBeCloseTo(Math.PI / 2);
  });

  it('returns PI for point to the left', () => {
    expect(Geom.angle(0, 0, -10, 0)).toBeCloseTo(Math.PI);
  });

  it('returns -PI/2 for point directly above', () => {
    expect(Geom.angle(0, 0, 0, -10)).toBeCloseTo(-Math.PI / 2);
  });
});

describe('Geom.angleDeg', () => {
  it('returns 0 for horizontal right', () => {
    expect(Geom.angleDeg(0, 0, 10, 0)).toBe(0);
  });

  it('returns 90 for straight down', () => {
    expect(Geom.angleDeg(0, 0, 0, 10)).toBeCloseTo(90);
  });

  it('returns 45 for diagonal', () => {
    expect(Geom.angleDeg(0, 0, 10, 10)).toBeCloseTo(45);
  });
});

describe('Geom.snapAngle', () => {
  it('snaps to 90 degree increments', () => {
    const result = Geom.snapAngle(0, 0, 10, 1, 90);
    expect(result.y).toBeCloseTo(0, 5);
  });

  it('snaps 44-degree direction to 45 with snapDeg=45', () => {
    const d = 10;
    const rad44 = (44 * Math.PI) / 180;
    const x2 = d * Math.cos(rad44);
    const y2 = d * Math.sin(rad44);
    const result = Geom.snapAngle(0, 0, x2, y2, 45);
    const snappedAngle = Math.atan2(result.y, result.x) * 180 / Math.PI;
    expect(snappedAngle).toBeCloseTo(45, 0);
  });

  it('preserves distance after snapping', () => {
    const result = Geom.snapAngle(0, 0, 7, 3, 45);
    const dist = Math.sqrt(result.x ** 2 + result.y ** 2);
    expect(dist).toBeCloseTo(Geom.dist(0, 0, 7, 3), 5);
  });
});

describe('Geom.snapToGrid', () => {
  it('snaps to nearest grid point', () => {
    expect(Geom.snapToGrid(12, 18, 10)).toEqual({ x: 10, y: 20 });
  });

  it('exact grid point stays the same', () => {
    expect(Geom.snapToGrid(20, 30, 10)).toEqual({ x: 20, y: 30 });
  });

  it('works with non-10 grid size', () => {
    expect(Geom.snapToGrid(7, 13, 5)).toEqual({ x: 5, y: 15 });
  });
});

describe('Geom.pointToSegmentDist', () => {
  it('returns perpendicular distance for point beside segment', () => {
    expect(Geom.pointToSegmentDist(5, 3, 0, 0, 10, 0)).toBeCloseTo(3);
  });

  it('returns distance to endpoint when projection falls outside segment', () => {
    expect(Geom.pointToSegmentDist(15, 0, 0, 0, 10, 0)).toBeCloseTo(5);
  });

  it('returns 0 when point is on the segment', () => {
    expect(Geom.pointToSegmentDist(5, 0, 0, 0, 10, 0)).toBeCloseTo(0);
  });

  it('returns distance to single point when segment is degenerate', () => {
    expect(Geom.pointToSegmentDist(3, 4, 0, 0, 0, 0)).toBeCloseTo(5);
  });
});

describe('Geom.wallRect', () => {
  it('returns 4 corner points', () => {
    const rect = Geom.wallRect(0, 0, 100, 0, 10);
    expect(rect).toHaveLength(4);
  });

  it('corners are perpendicular to wall direction', () => {
    const rect = Geom.wallRect(0, 0, 100, 0, 10);
    // For horizontal wall, perpendicular is vertical
    expect(rect[0].y).toBeCloseTo(5);
    expect(rect[3].y).toBeCloseTo(-5);
  });
});

describe('Geom.pointInPolygon', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];

  it('returns true for point inside polygon', () => {
    expect(Geom.pointInPolygon(5, 5, square)).toBe(true);
  });

  it('returns false for point outside polygon', () => {
    expect(Geom.pointInPolygon(15, 5, square)).toBe(false);
  });
});

describe('Geom.buildEndpointMap', () => {
  it('builds map from walls', () => {
    const walls = [
      { x1: 0, y1: 0, x2: 100, y2: 0 },
      { x1: 100, y1: 0, x2: 100, y2: 100 },
    ];
    const map = Geom.buildEndpointMap(walls);
    expect(map.size).toBeGreaterThanOrEqual(3);
  });

  it('groups shared endpoints together', () => {
    const walls = [
      { x1: 0, y1: 0, x2: 100, y2: 0 },
      { x1: 100, y1: 0, x2: 100, y2: 100 },
    ];
    const map = Geom.buildEndpointMap(walls);
    const sharedKey = '100,0';
    const joint = map.get(sharedKey);
    expect(joint).toBeDefined();
    expect(joint.connections).toHaveLength(2);
  });
});

describe('Geom.cornerFillPolygon', () => {
  it('returns null for fewer than 2 connections', () => {
    const joint = { x: 0, y: 0, connections: [{ wall: {}, end: 'start' }] };
    expect(Geom.cornerFillPolygon(joint)).toBeNull();
  });

  it('returns sorted corner array for 2+ connections', () => {
    const wall1 = {
      rect: [
        { x: 0, y: 5 }, { x: 100, y: 5 },
        { x: 100, y: -5 }, { x: 0, y: -5 },
      ],
    };
    const wall2 = {
      rect: [
        { x: 95, y: 0 }, { x: 95, y: 100 },
        { x: 105, y: 100 }, { x: 105, y: 0 },
      ],
    };
    const joint = {
      x: 100, y: 0,
      connections: [
        { wall: wall1, end: 'end' },
        { wall: wall2, end: 'start' },
      ],
    };
    const polygon = Geom.cornerFillPolygon(joint);
    expect(polygon).not.toBeNull();
    expect(polygon.length).toBe(4);
  });
});

describe('Geom.formatLength', () => {
  it('formats cm to meters string', () => {
    expect(Geom.formatLength(100)).toBe('1m');
  });

  it('formats fractional meters', () => {
    expect(Geom.formatLength(250)).toBe('2.5m');
  });

  it('rounds to 2 decimal places', () => {
    expect(Geom.formatLength(123)).toBe('1.23m');
  });

  it('handles zero', () => {
    expect(Geom.formatLength(0)).toBe('0m');
  });
});

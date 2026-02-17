/** @typedef {{ x: number, y: number }} Point */

/** @typedef {{ wall: import('./Wall.js').Wall, end: 'start'|'end' }} WallConnection */

/** @typedef {{ x: number, y: number, connections: WallConnection[] }} EndpointJoint */

export const Geom = {
  /**
   * Euclidean distance between two points.
   * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
   * @returns {number}
   */
  dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  },

  /**
   * Angle in radians from (x1,y1) to (x2,y2).
   * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
   * @returns {number}
   */
  angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  },

  /**
   * Angle in degrees from (x1,y1) to (x2,y2).
   * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
   * @returns {number}
   */
  angleDeg(x1, y1, x2, y2) {
    return (this.angle(x1, y1, x2, y2) * 180) / Math.PI;
  },

  /**
   * Snap angle to nearest multiple of snapDeg, preserving distance.
   * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
   * @param {number} snapDeg
   * @returns {Point}
   */
  snapAngle(x1, y1, x2, y2, snapDeg) {
    const a = this.angle(x1, y1, x2, y2);
    const d = this.dist(x1, y1, x2, y2);
    const snapRad = (snapDeg * Math.PI) / 180;
    const snapped = Math.round(a / snapRad) * snapRad;
    return {
      x: x1 + Math.cos(snapped) * d,
      y: y1 + Math.sin(snapped) * d,
    };
  },

  /**
   * Snap coordinates to nearest grid intersection.
   * @param {number} x @param {number} y @param {number} gridSize
   * @returns {Point}
   */
  snapToGrid(x, y, gridSize) {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  },

  /**
   * Shortest distance from point to line segment.
   * @param {number} px @param {number} py
   * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
   * @returns {number}
   */
  pointToSegmentDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return this.dist(px, py, x1, y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return this.dist(px, py, x1 + t * dx, y1 + t * dy);
  },

  /**
   * Four corner points of a wall rectangle.
   * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
   * @param {number} thickness
   * @returns {Point[]}
   */
  wallRect(x1, y1, x2, y2, thickness) {
    const angle = this.angle(x1, y1, x2, y2);
    const perpAngle = angle + Math.PI / 2;
    const half = thickness / 2;
    const dx = Math.cos(perpAngle) * half;
    const dy = Math.sin(perpAngle) * half;
    return [
      { x: x1 + dx, y: y1 + dy },
      { x: x2 + dx, y: y2 + dy },
      { x: x2 - dx, y: y2 - dy },
      { x: x1 - dx, y: y1 - dy },
    ];
  },

  /**
   * Ray-casting point-in-polygon test.
   * @param {number} px @param {number} py @param {Point[]} polygon
   * @returns {boolean}
   */
  pointInPolygon(px, py, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      if (((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  },

  /**
   * Group wall endpoints within tolerance into joints.
   * @param {Array<{x1:number, y1:number, x2:number, y2:number}>} walls
   * @param {number} [tolerance=0.5]
   * @returns {Map<string, EndpointJoint>}
   */
  buildEndpointMap(walls, tolerance = 0.5) {
    const map = new Map();
    const key = (x, y) => {
      const qx = Math.round(x / tolerance) * tolerance;
      const qy = Math.round(y / tolerance) * tolerance;
      return `${qx},${qy}`;
    };
    for (const wall of walls) {
      for (const end of ['start', 'end']) {
        const x = end === 'start' ? wall.x1 : wall.x2;
        const y = end === 'start' ? wall.y1 : wall.y2;
        const k = key(x, y);
        if (!map.has(k)) map.set(k, { x, y, connections: [] });
        map.get(k).connections.push({ wall, end });
      }
    }
    return map;
  },

  /**
   * Compute fill polygon for a wall corner joint.
   * @param {EndpointJoint} joint
   * @returns {Point[]|null}
   */
  cornerFillPolygon(joint) {
    if (joint.connections.length < 2) return null;
    const corners = [];
    for (const { wall, end } of joint.connections) {
      const rect = wall.rect;
      // rect: [0]=start+perp, [1]=end+perp, [2]=end-perp, [3]=start-perp
      if (end === 'start') {
        corners.push(rect[0], rect[3]);
      } else {
        corners.push(rect[1], rect[2]);
      }
    }
    const cx = joint.x, cy = joint.y;
    corners.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
    return corners;
  },

  /**
   * Format centimeter value as meters string (e.g. "1.5m").
   * @param {number} cm
   * @returns {string}
   */
  formatLength(cm) {
    const m = cm / 100;
    const rounded = Math.round(m * 100) / 100;
    return `${rounded}m`;
  },

  /**
   * Detect the outer perimeter of a set of walls.
   * Uses the same face-tracing algorithm as detectRoom but selects the
   * face with the LARGEST area (the outer boundary).
   * @param {Array<{x1:number, y1:number, x2:number, y2:number}>} walls
   * @returns {Point[]|null}
   */
  detectOuterPerimeter(walls) {
    if (!walls || walls.length === 0) return null;

    const eps = 5;
    const vertices = [];
    const addVertex = (x, y) => {
      for (const v of vertices) {
        if (Geom.dist(v.x, v.y, x, y) < eps) return v;
      }
      const v = { x, y, edges: [] };
      vertices.push(v);
      return v;
    };

    for (const wall of walls) {
      const v1 = addVertex(wall.x1, wall.y1);
      const v2 = addVertex(wall.x2, wall.y2);
      v1.edges.push(v2);
      v2.edges.push(v1);
    }

    for (const v of vertices) {
      v.edges.sort((a, b) =>
        Math.atan2(a.y - v.y, a.x - v.x) - Math.atan2(b.y - v.y, b.x - v.x)
      );
    }

    const faces = [];
    const visited = new Set();

    for (const start of vertices) {
      for (const next of start.edges) {
        const key = `${start.x},${start.y}->${next.x},${next.y}`;
        if (visited.has(key)) continue;
        const face = [];
        let cur = start, nxt = next, steps = 0;
        const maxSteps = vertices.length + 2;
        while (steps < maxSteps) {
          const ek = `${cur.x},${cur.y}->${nxt.x},${nxt.y}`;
          if (visited.has(ek)) break;
          visited.add(ek);
          face.push({ x: cur.x, y: cur.y });
          const inAng = Math.atan2(cur.y - nxt.y, cur.x - nxt.x);
          let best = null, bestDiff = Infinity;
          for (const nb of nxt.edges) {
            if (nb === cur && nxt.edges.length > 1) continue;
            const outAng = Math.atan2(nb.y - nxt.y, nb.x - nxt.x);
            let diff = outAng - inAng;
            if (diff <= 0) diff += Math.PI * 2;
            if (diff < bestDiff) { bestDiff = diff; best = nb; }
          }
          if (!best) break;
          cur = nxt;
          nxt = best;
          steps++;
          if (cur === start && nxt === next) break;
        }
        if (face.length >= 3 && cur === start) faces.push(face);
      }
    }

    // Select the face with the LARGEST area (outer perimeter)
    let bestFace = null, bestArea = 0;
    for (const face of faces) {
      let area = 0;
      for (let i = 0, j = face.length - 1; i < face.length; j = i++) {
        area += face[j].x * face[i].y - face[i].x * face[j].y;
      }
      area = Math.abs(area / 2);
      if (area > bestArea) {
        bestArea = area;
        bestFace = face;
      }
    }
    return bestFace;
  },

  /**
   * Offset a polygon outward by a given distance.
   * For each edge, compute the parallel line offset outward,
   * then intersect adjacent offset edges to get new vertices.
   * @param {Point[]} polygon
   * @param {number} distance - positive = outward
   * @returns {Point[]}
   */
  offsetPolygon(polygon, distance) {
    if (!polygon || polygon.length < 3) return polygon;
    const n = polygon.length;

    // Determine winding: positive signed area = CCW
    let signedArea = 0;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      signedArea += polygon[j].x * polygon[i].y - polygon[i].x * polygon[j].y;
    }
    // If CW (signedArea < 0), invert distance so "outward" works correctly
    const dir = signedArea < 0 ? -1 : 1;
    const d = distance * dir;

    // For each edge, compute the offset (shifted) line
    const offsetEdges = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const dx = polygon[j].x - polygon[i].x;
      const dy = polygon[j].y - polygon[i].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) {
        offsetEdges.push({ x1: polygon[i].x, y1: polygon[i].y, x2: polygon[j].x, y2: polygon[j].y });
        continue;
      }
      // Outward normal (perpendicular, left of direction)
      const nx = -dy / len * d;
      const ny = dx / len * d;
      offsetEdges.push({
        x1: polygon[i].x + nx,
        y1: polygon[i].y + ny,
        x2: polygon[j].x + nx,
        y2: polygon[j].y + ny,
      });
    }

    // Intersect adjacent offset edges
    const result = [];
    for (let i = 0; i < n; i++) {
      const e1 = offsetEdges[i];
      const e2 = offsetEdges[(i + 1) % n];
      const pt = _lineLineIntersect(e1.x1, e1.y1, e1.x2, e1.y2, e2.x1, e2.y1, e2.x2, e2.y2);
      if (pt) {
        result.push(pt);
      } else {
        // Parallel edges — use the endpoint
        result.push({ x: e1.x2, y: e1.y2 });
      }
    }
    return result;
  },
};

/**
 * Line-line intersection (infinite lines).
 * @returns {Point|null}
 */
function _lineLineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return null;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1),
  };
}

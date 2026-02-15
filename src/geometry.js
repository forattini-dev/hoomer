export const Geom = {
  dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  },

  angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  },

  angleDeg(x1, y1, x2, y2) {
    return (this.angle(x1, y1, x2, y2) * 180) / Math.PI;
  },

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

  snapToGrid(x, y, gridSize) {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  },

  pointToSegmentDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return this.dist(px, py, x1, y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return this.dist(px, py, x1 + t * dx, y1 + t * dy);
  },

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

  formatLength(cm) {
    const m = cm / 100;
    const rounded = Math.round(m * 100) / 100;
    return `${rounded}m`;
  },
};

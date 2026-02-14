import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Materials3D } from './Materials3D.js';

const CM = 1 / 100;

export class WallSegmenter {
  /**
   * Segment a wall into solid pieces with gaps for doors/windows.
   * Returns a THREE.Group.
   *
   * @param {Object} wall       - Wall entity (x1,y1,x2,y2,thickness,material)
   * @param {Array}  doors      - Doors on this wall
   * @param {Array}  windows    - Windows on this wall
   * @param {number} elevM      - Elevation in meters (bottom of wall)
   * @param {number} wallHeightM - Wall height in meters
   * @returns {THREE.Group}
   */
  static segment(wall, doors, windows, elevM, wallHeightM) {
    const group = new THREE.Group();

    const dx = (wall.x2 - wall.x1) * CM;
    const dz = (wall.y2 - wall.y1) * CM;
    const wallLenM = Math.sqrt(dx * dx + dz * dz);
    const wallLenCm = wall.length || Math.sqrt((wall.x2 - wall.x1) ** 2 + (wall.y2 - wall.y1) ** 2);
    const thickness = wall.thickness * CM;
    const angle = -Math.atan2(dz, dx);

    // Collect openings as intervals [startT, endT] with metadata
    const openings = [];

    for (const door of doors) {
      const halfW = (door.width / 2) / wallLenCm;
      const startT = Math.max(0, door.position - halfW);
      const endT = Math.min(1, door.position + halfW);
      const doorH = (door.height || CONFIG.DEFAULT_DOOR_HEIGHT) * CM;
      openings.push({ startT, endT, type: 'door', height: doorH, sillHeight: 0 });
    }

    for (const win of windows) {
      const halfW = (win.width / 2) / wallLenCm;
      const startT = Math.max(0, win.position - halfW);
      const endT = Math.min(1, win.position + halfW);
      const winH = (win.height || CONFIG.DEFAULT_WINDOW_HEIGHT) * CM;
      const sillH = (win.sillHeight || CONFIG.DEFAULT_WINDOW_SILL_HEIGHT) * CM;
      openings.push({ startT, endT, type: 'window', height: winH, sillHeight: sillH });
    }

    // Sort by startT
    openings.sort((a, b) => a.startT - b.startT);

    // Merge overlapping intervals (safety)
    const merged = [];
    for (const op of openings) {
      if (merged.length > 0 && op.startT <= merged[merged.length - 1].endT) {
        const last = merged[merged.length - 1];
        last.endT = Math.max(last.endT, op.endT);
        // Keep whichever is taller opening
        if (op.height > last.height) {
          last.height = op.height;
          last.type = op.type;
          last.sillHeight = op.sillHeight;
        }
      } else {
        merged.push({ ...op });
      }
    }

    const wallMat = Materials3D.get('wall', wall.material);

    // Helper: create a box segment in wall-local coordinates
    const addBox = (tStart, tEnd, yBottom, yTop) => {
      const segLen = (tEnd - tStart) * wallLenM;
      const segH = yTop - yBottom;
      if (segLen <= 0.001 || segH <= 0.001) return;

      const geo = new THREE.BoxGeometry(segLen, segH, thickness);
      const mesh = new THREE.Mesh(geo, wallMat);
      // Position in local wall space (centered)
      const tCenter = (tStart + tEnd) / 2;
      const xLocal = (tCenter - 0.5) * wallLenM;
      const yLocal = yBottom + segH / 2;
      mesh.position.set(xLocal, yLocal, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { type: 'wall', wall };
      group.add(mesh);
    };

    // Helper: add glass pane for window
    const addGlass = (tStart, tEnd, yBottom, yTop) => {
      const segLen = (tEnd - tStart) * wallLenM;
      const segH = yTop - yBottom;
      if (segLen <= 0.001 || segH <= 0.001) return;

      const geo = new THREE.BoxGeometry(segLen, segH, 0.006);
      const mat = Materials3D.get('glass', 'glass');
      const mesh = new THREE.Mesh(geo, mat);
      const tCenter = (tStart + tEnd) / 2;
      const xLocal = (tCenter - 0.5) * wallLenM;
      const yLocal = yBottom + segH / 2;
      mesh.position.set(xLocal, yLocal, 0);
      group.add(mesh);
    };

    // Build segments
    let cursor = 0;
    for (const op of merged) {
      // Solid segment before this opening
      if (op.startT > cursor) {
        addBox(cursor, op.startT, 0, wallHeightM);
      }

      if (op.type === 'door') {
        // Gap for door — add lintel above if door shorter than wall
        if (op.height < wallHeightM) {
          addBox(op.startT, op.endT, op.height, wallHeightM);
        }
      } else if (op.type === 'window') {
        // Below sill
        if (op.sillHeight > 0) {
          addBox(op.startT, op.endT, 0, op.sillHeight);
        }
        // Above window
        const winTop = op.sillHeight + op.height;
        if (winTop < wallHeightM) {
          addBox(op.startT, op.endT, winTop, wallHeightM);
        }
        // Glass pane
        addGlass(op.startT, op.endT, op.sillHeight, op.sillHeight + op.height);
      }

      cursor = op.endT;
    }

    // Solid segment after last opening
    if (cursor < 1) {
      addBox(cursor, 1, 0, wallHeightM);
    }

    // Transform group to world space
    const cx = ((wall.x1 + wall.x2) / 2) * CM;
    const cz = -((wall.y1 + wall.y2) / 2) * CM;
    group.position.set(cx, elevM, cz);
    group.rotation.y = angle;

    return group;
  }
}

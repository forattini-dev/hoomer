import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Geom } from './geometry.js';
import { Materials3D } from './Materials3D.js';
import { WallSegmenter } from './WallSegmenter.js';

const CM = 1 / 100; // convert cm → meters

export class SceneBuilder {
  /**
   * Build a THREE.Group from the stories array.
   * @param {Array} stories - array of story objects from App
   * @returns {THREE.Group}
   */
  static build(stories) {
    const root = new THREE.Group();

    let elevation = 0; // cm accumulator

    for (let si = 0; si < stories.length; si++) {
      const story = stories[si];
      const storyHeight = story.storyHeight || CONFIG.DEFAULT_STORY_HEIGHT;
      const slabThickness = story.slabThickness || CONFIG.DEFAULT_SLAB_THICKNESS;
      const wallHeight = storyHeight - slabThickness;
      const struct = story.layers.structure;
      const elevM = elevation * CM;
      const wallHeightM = wallHeight * CM;

      const storyGroup = new THREE.Group();
      storyGroup.name = `story-${si}`;

      // ── Walls ──
      for (const wall of struct.walls) {
        const wallDoors = struct.doors.filter(d => d.wall === wall);
        const wallWindows = struct.windows.filter(w => w.wall === wall);
        if (wallDoors.length === 0 && wallWindows.length === 0) {
          storyGroup.add(SceneBuilder._buildWallSimple(wall, elevM, wallHeightM));
        } else {
          storyGroup.add(WallSegmenter.segment(wall, wallDoors, wallWindows, elevM, wallHeightM));
        }
      }

      // ── Corner fills ──
      const cornerGroup = SceneBuilder._buildCornerJoins(struct.walls, elevM, wallHeightM);
      if (cornerGroup.children.length > 0) storyGroup.add(cornerGroup);

      // ── Floors ──
      for (const floor of struct.floors) {
        const mesh = SceneBuilder._buildFloor(floor, elevM, slabThickness * CM);
        if (mesh) storyGroup.add(mesh);
      }

      // ── Stairs ──
      for (const stair of struct.stairs) {
        const group = SceneBuilder._buildStair(stair, elevM, wallHeightM);
        storyGroup.add(group);
      }

      // ── Electrical Panels ──
      const elec = story.layers.electrical || {};
      for (const panel of (elec.panels || [])) {
        const mesh = SceneBuilder._buildElectricalPanel(panel, struct.walls, elevM);
        if (mesh) storyGroup.add(mesh);
      }

      // ── Furniture ──
      const furn = story.layers.furniture || {};
      for (const item of (furn.items || [])) {
        const mesh = SceneBuilder._buildFurnitureItem(item, elevM);
        if (mesh) storyGroup.add(mesh);
      }

      // ── Roof ──
      if (story.roofEnabled && si === stories.length - 1) {
        const roofMesh = SceneBuilder._buildRoof(struct.walls, story, elevM + wallHeightM);
        if (roofMesh) storyGroup.add(roofMesh);
      }

      root.add(storyGroup);
      elevation += storyHeight;
    }

    return root;
  }

  static _buildWallSimple(wall, elevM, wallHeightM) {
    const dx = (wall.x2 - wall.x1) * CM;
    const dz = (wall.y2 - wall.y1) * CM;
    const length = Math.sqrt(dx * dx + dz * dz);
    const thickness = wall.thickness * CM;

    const geo = new THREE.BoxGeometry(length, wallHeightM, thickness);
    const mat = Materials3D.get('wall', wall.material);
    const mesh = new THREE.Mesh(geo, mat);

    // Position at center of wall
    const cx = ((wall.x1 + wall.x2) / 2) * CM;
    const cz = -((wall.y1 + wall.y2) / 2) * CM; // negate Y for 3D Z
    mesh.position.set(cx, elevM + wallHeightM / 2, cz);

    // Rotate to align with wall direction
    mesh.rotation.y = -Math.atan2(dz, dx);

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type: 'wall', wall };

    return mesh;
  }

  static _buildFloor(floor, elevM, slabThicknessM) {
    if (!floor.polygon || floor.polygon.length < 3) return null;

    const shape = new THREE.Shape();
    shape.moveTo(floor.polygon[0].x * CM, floor.polygon[0].y * CM);
    for (let i = 1; i < floor.polygon.length; i++) {
      shape.lineTo(floor.polygon[i].x * CM, floor.polygon[i].y * CM);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: slabThicknessM,
      bevelEnabled: false,
    });

    // Rotate so extrusion goes downward (vertical)
    geo.rotateX(-Math.PI / 2);

    const mat = Materials3D.get('floor', floor.material);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = elevM;
    mesh.receiveShadow = true;
    mesh.userData = { type: 'floor' };

    return mesh;
  }

  static _buildStair(stair, elevM, wallHeightM) {
    const group = new THREE.Group();
    const stepCount = stair.stepCount;
    if (stepCount <= 0) return group;

    const risePerStep = wallHeightM / stepCount;
    const stepDepth = stair.stepDepth * CM;
    const stairWidth = stair.width * CM;
    const mat = Materials3D.get('stair', 'stair');

    for (let i = 0; i < stepCount; i++) {
      const geo = new THREE.BoxGeometry(stairWidth, risePerStep, stepDepth);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        stairWidth / 2,
        risePerStep / 2 + i * risePerStep,
        stepDepth / 2 + i * stepDepth,
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    // Transform the group to world position
    const rad = stair.rotation * Math.PI / 180;
    group.rotation.y = -rad;
    const ox = stair.x * CM;
    const oz = -stair.y * CM;
    group.position.set(ox, elevM, oz);
    group.userData = { type: 'stair' };

    return group;
  }

  static _buildFurnitureItem(item, elevM) {
    const catalog = CONFIG.FURNITURE_CATALOG[item.furnitureType];
    if (!catalog) return null;

    const w = catalog.w * CM;
    const d = catalog.d * CM;
    const h = catalog.h * CM;

    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color: catalog.color });
    const mesh = new THREE.Mesh(geo, mat);

    mesh.position.set(
      item.x * CM,
      elevM + h / 2,
      -item.y * CM,
    );
    mesh.rotation.y = -item.rotation * Math.PI / 180;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type: 'furniture' };

    return mesh;
  }

  static _buildElectricalPanel(panel, walls, elevM) {
    // Panel 3D dimensions (cm → m)
    const pw = 40 * CM;  // width along wall
    const ph = 50 * CM;  // height
    const pd = 8 * CM;   // depth (protrusion from wall)
    const mountCenter = 1.4;  // center height in meters

    // Find nearest wall
    let bestWall = null;
    let bestDist = Infinity;
    for (const wall of walls) {
      const d = Geom.pointToSegmentDist(panel.x, panel.y, wall.x1, wall.y1, wall.x2, wall.y2);
      if (d < bestDist) { bestDist = d; bestWall = wall; }
    }

    const px = panel.x * CM;
    const pz = -panel.y * CM;

    const geo = new THREE.BoxGeometry(pw, ph, pd);
    const mat = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.6 });
    const mesh = new THREE.Mesh(geo, mat);

    if (bestWall) {
      // Project panel onto wall centerline
      const wx = bestWall.x2 - bestWall.x1;
      const wy = bestWall.y2 - bestWall.y1;
      const lenSq = wx * wx + wy * wy;
      let t = ((panel.x - bestWall.x1) * wx + (panel.y - bestWall.y1) * wy) / lenSq;
      t = Math.max(0, Math.min(1, t));

      // Point on wall centerline
      const cx = (bestWall.x1 + t * wx) * CM;
      const cz = -(bestWall.y1 + t * wy) * CM;

      // Wall perpendicular — offset panel to wall surface
      const wallAngle = Math.atan2(wy, wx);
      const perpAngle = wallAngle + Math.PI / 2;
      const halfThick = (bestWall.thickness / 2) * CM;

      // Determine which side the panel is on
      const perpX = Math.cos(perpAngle);
      const perpY = Math.sin(perpAngle);
      const toPanelX = panel.x - (bestWall.x1 + t * wx);
      const toPanelY = panel.y - (bestWall.y1 + t * wy);
      const side = (toPanelX * perpX + toPanelY * perpY) >= 0 ? 1 : -1;

      const offsetX = Math.cos(perpAngle) * (halfThick + pd / 2) * side * CM;
      const offsetZ = -Math.sin(perpAngle) * (halfThick + pd / 2) * side * CM;

      mesh.position.set(cx + offsetX, elevM + mountCenter, cz + offsetZ);
      mesh.rotation.y = -wallAngle;
    } else {
      // No wall found — place free-standing
      mesh.position.set(px, elevM + mountCenter, pz);
    }

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type: 'panel' };
    return mesh;
  }

  static _buildRoof(walls, story, roofBaseM) {
    const outline = Geom.detectOuterPerimeter(walls);
    if (!outline || outline.length < 3) return null;

    const overhang = story.roofOverhang || 0;
    const eavesOutline = overhang > 0
      ? Geom.offsetPolygon(outline, overhang)
      : outline.map(p => ({ x: p.x, y: p.y }));

    const mat = Materials3D.get('roof', story.roofMaterial || 'tiles');
    const style = story.roofStyle || 'gable';

    if (style === 'flat') {
      return SceneBuilder._buildRoofFlat(eavesOutline, roofBaseM, mat);
    }

    // Compute bounding box and principal axis
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of eavesOutline) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const spanX = maxX - minX;
    const spanY = maxY - minY;
    const isXLonger = spanX >= spanY;

    const pitchRad = (story.roofPitch || 25) * Math.PI / 180;
    const shorterSpan = isXLonger ? spanY : spanX;
    const ridgeHeight = (shorterSpan / 2) * Math.tan(pitchRad);

    if (style === 'shed') {
      return SceneBuilder._buildRoofShed(eavesOutline, roofBaseM, ridgeHeight, isXLonger, minX, maxX, minY, maxY, mat);
    } else if (style === 'gable') {
      return SceneBuilder._buildRoofGable(eavesOutline, roofBaseM, ridgeHeight, isXLonger, minX, maxX, minY, maxY, mat);
    } else if (style === 'hip') {
      return SceneBuilder._buildRoofHip(eavesOutline, roofBaseM, ridgeHeight, isXLonger, minX, maxX, minY, maxY, shorterSpan, pitchRad, mat);
    }
    return null;
  }

  static _buildRoofFlat(outline, roofBaseM, mat) {
    const shape = new THREE.Shape();
    shape.moveTo(outline[0].x * CM, outline[0].y * CM);
    for (let i = 1; i < outline.length; i++) {
      shape.lineTo(outline[i].x * CM, outline[i].y * CM);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.10, // 10cm slab
      bevelEnabled: false,
    });
    geo.rotateX(-Math.PI / 2);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = roofBaseM;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type: 'roof' };
    return mesh;
  }

  static _buildRoofShed(outline, roofBaseM, ridgeHeight, isXLonger, minX, maxX, minY, maxY, mat) {
    // Shed: one side at base, opposite side raised
    // Use bounding box corners
    const c0 = [minX * CM, roofBaseM, -maxY * CM]; // top-left (2D)
    const c1 = [maxX * CM, roofBaseM, -maxY * CM]; // top-right
    const c2 = [maxX * CM, roofBaseM, -minY * CM]; // bottom-right
    const c3 = [minX * CM, roofBaseM, -minY * CM]; // bottom-left

    if (isXLonger) {
      // Ridge along X, slope from minY to maxY
      c0[1] += ridgeHeight; // raise top side
      c1[1] += ridgeHeight;
    } else {
      // Ridge along Y, slope from minX to maxX
      c1[1] += ridgeHeight; // raise right side
      c2[1] += ridgeHeight;
    }

    const positions = new Float32Array([
      // Triangle 1: c0, c1, c2
      ...c0, ...c1, ...c2,
      // Triangle 2: c0, c2, c3
      ...c0, ...c2, ...c3,
    ]);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type: 'roof' };
    return mesh;
  }

  static _buildRoofGable(outline, roofBaseM, ridgeHeight, isXLonger, minX, maxX, minY, maxY, mat) {
    const group = new THREE.Group();
    group.userData = { type: 'roof' };

    // Bounding box corners (3D coords)
    const c0 = [minX * CM, roofBaseM, -maxY * CM]; // top-left
    const c1 = [maxX * CM, roofBaseM, -maxY * CM]; // top-right
    const c2 = [maxX * CM, roofBaseM, -minY * CM]; // bottom-right
    const c3 = [minX * CM, roofBaseM, -minY * CM]; // bottom-left

    let r0, r1; // ridge endpoints
    if (isXLonger) {
      // Ridge along X axis, centered on Y
      const midZ = -((minY + maxY) / 2) * CM;
      r0 = [minX * CM, roofBaseM + ridgeHeight, midZ];
      r1 = [maxX * CM, roofBaseM + ridgeHeight, midZ];

      // Slope 1: c0 → c1 → r1 → r0 (top side)
      // Slope 2: c3 → c2 → r1 → r0 (bottom side) — but winding matters
      const slopeVerts = new Float32Array([
        // Slope 1 (top): c0, c1, r1, c0, r1, r0
        ...c0, ...c1, ...r1,
        ...c0, ...r1, ...r0,
        // Slope 2 (bottom): c2, c3, r0, c2, r0, r1
        ...c2, ...c3, ...r0,
        ...c2, ...r0, ...r1,
      ]);
      const slopeGeo = new THREE.BufferGeometry();
      slopeGeo.setAttribute('position', new THREE.BufferAttribute(slopeVerts, 3));
      slopeGeo.computeVertexNormals();
      const slopeMesh = new THREE.Mesh(slopeGeo, mat);
      slopeMesh.castShadow = true;
      slopeMesh.receiveShadow = true;
      group.add(slopeMesh);

      // Gable ends (triangles)
      const gableVerts = new Float32Array([
        // Left gable: c0, c3, r0
        ...c0, ...c3, ...r0,
        // Right gable: c1, c2, r1
        ...c1, ...c2, ...r1,
      ]);
      const gableGeo = new THREE.BufferGeometry();
      gableGeo.setAttribute('position', new THREE.BufferAttribute(gableVerts, 3));
      gableGeo.computeVertexNormals();
      const gableMesh = new THREE.Mesh(gableGeo, mat);
      gableMesh.castShadow = true;
      gableMesh.receiveShadow = true;
      group.add(gableMesh);
    } else {
      // Ridge along Y axis, centered on X
      const midX = ((minX + maxX) / 2) * CM;
      r0 = [midX, roofBaseM + ridgeHeight, -minY * CM];
      r1 = [midX, roofBaseM + ridgeHeight, -maxY * CM];

      const slopeVerts = new Float32Array([
        // Slope left: c0, c3, r0, c0, r0, r1
        ...c0, ...c3, ...r0,
        ...c0, ...r0, ...r1,
        // Slope right: c2, c1, r1, c2, r1, r0
        ...c2, ...c1, ...r1,
        ...c2, ...r1, ...r0,
      ]);
      const slopeGeo = new THREE.BufferGeometry();
      slopeGeo.setAttribute('position', new THREE.BufferAttribute(slopeVerts, 3));
      slopeGeo.computeVertexNormals();
      const slopeMesh = new THREE.Mesh(slopeGeo, mat);
      slopeMesh.castShadow = true;
      slopeMesh.receiveShadow = true;
      group.add(slopeMesh);

      // Gable ends
      const gableVerts = new Float32Array([
        // Bottom gable: c3, c2, r0
        ...c3, ...c2, ...r0,
        // Top gable: c0, c1, r1
        ...c0, ...c1, ...r1,
      ]);
      const gableGeo = new THREE.BufferGeometry();
      gableGeo.setAttribute('position', new THREE.BufferAttribute(gableVerts, 3));
      gableGeo.computeVertexNormals();
      const gableMesh = new THREE.Mesh(gableGeo, mat);
      gableMesh.castShadow = true;
      gableMesh.receiveShadow = true;
      group.add(gableMesh);
    }

    return group;
  }

  static _buildRoofHip(outline, roofBaseM, ridgeHeight, isXLonger, minX, maxX, minY, maxY, shorterSpan, pitchRad, mat) {
    const group = new THREE.Group();
    group.userData = { type: 'roof' };

    // Hip roof: ridge is shorter than the building, inset from each end
    const inset = (shorterSpan / 2);

    const c0 = [minX * CM, roofBaseM, -maxY * CM];
    const c1 = [maxX * CM, roofBaseM, -maxY * CM];
    const c2 = [maxX * CM, roofBaseM, -minY * CM];
    const c3 = [minX * CM, roofBaseM, -minY * CM];

    let r0, r1; // ridge endpoints
    if (isXLonger) {
      const midZ = -((minY + maxY) / 2) * CM;
      r0 = [(minX + inset) * CM, roofBaseM + ridgeHeight, midZ];
      r1 = [(maxX - inset) * CM, roofBaseM + ridgeHeight, midZ];

      // If ridge is degenerate (building is square-ish), make it a pyramid
      if ((minX + inset) >= (maxX - inset)) {
        const midX = ((minX + maxX) / 2) * CM;
        const apex = [midX, roofBaseM + ridgeHeight, midZ];
        const verts = new Float32Array([
          ...c0, ...c1, ...apex,
          ...c1, ...c2, ...apex,
          ...c2, ...c3, ...apex,
          ...c3, ...c0, ...apex,
        ]);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
        return group;
      }

      const verts = new Float32Array([
        // Top trapezoid: c0, c1, r1, r0
        ...c0, ...c1, ...r1,
        ...c0, ...r1, ...r0,
        // Bottom trapezoid: c2, c3, r0, r1
        ...c2, ...c3, ...r0,
        ...c2, ...r0, ...r1,
        // Left hip triangle: c3, c0, r0
        ...c3, ...c0, ...r0,
        // Right hip triangle: c1, c2, r1
        ...c1, ...c2, ...r1,
      ]);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    } else {
      const midX = ((minX + maxX) / 2) * CM;
      r0 = [midX, roofBaseM + ridgeHeight, -(minY + inset) * CM];
      r1 = [midX, roofBaseM + ridgeHeight, -(maxY - inset) * CM];

      if ((minY + inset) >= (maxY - inset)) {
        const midZ = -((minY + maxY) / 2) * CM;
        const apex = [midX, roofBaseM + ridgeHeight, midZ];
        const verts = new Float32Array([
          ...c0, ...c1, ...apex,
          ...c1, ...c2, ...apex,
          ...c2, ...c3, ...apex,
          ...c3, ...c0, ...apex,
        ]);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
        return group;
      }

      const verts = new Float32Array([
        // Left trapezoid: c0, c3, r0, r1
        ...c0, ...c3, ...r0,
        ...c0, ...r0, ...r1,
        // Right trapezoid: c2, c1, r1, r0
        ...c2, ...c1, ...r1,
        ...c2, ...r1, ...r0,
        // Bottom hip triangle: c3, c2, r0
        ...c3, ...c2, ...r0,
        // Top hip triangle: c0, c1, r1
        ...c0, ...c1, ...r1,
      ]);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    return group;
  }

  static _buildCornerJoins(walls, elevM, wallHeightM) {
    const group = new THREE.Group();
    const endpointMap = Geom.buildEndpointMap(walls);
    for (const [, joint] of endpointMap) {
      if (joint.connections.length < 2) continue;
      const poly = Geom.cornerFillPolygon(joint);
      if (!poly || poly.length < 3) continue;

      const shape = new THREE.Shape();
      shape.moveTo(poly[0].x * CM, poly[0].y * CM);
      for (let i = 1; i < poly.length; i++)
        shape.lineTo(poly[i].x * CM, poly[i].y * CM);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, { depth: wallHeightM, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);

      const mat = Materials3D.get('wall', joint.connections[0].wall.material);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = elevM;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { type: 'wall-corner' };
      group.add(mesh);
    }
    return group;
  }
}

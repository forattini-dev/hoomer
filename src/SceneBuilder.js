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

      // ── Furniture ──
      const furn = story.layers.furniture || {};
      for (const item of (furn.items || [])) {
        const mesh = SceneBuilder._buildFurnitureItem(item, elevM);
        if (mesh) storyGroup.add(mesh);
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
    shape.moveTo(floor.polygon[0].x * CM, -floor.polygon[0].y * CM);
    for (let i = 1; i < floor.polygon.length; i++) {
      shape.lineTo(floor.polygon[i].x * CM, -floor.polygon[i].y * CM);
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

  static _buildCornerJoins(walls, elevM, wallHeightM) {
    const group = new THREE.Group();
    const endpointMap = Geom.buildEndpointMap(walls);
    for (const [, joint] of endpointMap) {
      if (joint.connections.length < 2) continue;
      const poly = Geom.cornerFillPolygon(joint);
      if (!poly || poly.length < 3) continue;

      const shape = new THREE.Shape();
      shape.moveTo(poly[0].x * CM, -poly[0].y * CM);
      for (let i = 1; i < poly.length; i++)
        shape.lineTo(poly[i].x * CM, -poly[i].y * CM);
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

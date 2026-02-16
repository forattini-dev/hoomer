import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SceneBuilder } from './SceneBuilder.js';
import { Materials3D } from './Materials3D.js';
import { FPSControls } from './FPSControls.js';

export class Viewer3D {
  constructor(container, root) {
    this.container = container;
    this.root = root;
    this._running = false;
    this._rafId = null;
    this._navMode = 'orbit'; // 'orbit' | 'fps'
    this.fpsControls = null;
    this.onNavModeChange = null;

    // Three.js core
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.orbitControls = null;
    this.buildingGroup = null;
    this._canvas = null;
    this._ground = null;
    this._grid = null;
    this._dirLight = null;

    this._init();
  }

  _init() {
    // Canvas element
    this._canvas = document.createElement('canvas');
    this._canvas.id = 'three-canvas';
    this.container.appendChild(this._canvas);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this._canvas,
      antialias: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xe8e5df);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500);
    this.camera.position.set(10, 12, 10);
    this.camera.lookAt(0, 1.5, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xddeeff, 0x9a8a6a, 0.4);
    this.scene.add(hemi);

    this._dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this._dirLight.position.set(15, 20, 10);
    this._dirLight.castShadow = true;
    this._dirLight.shadow.mapSize.width = 2048;
    this._dirLight.shadow.mapSize.height = 2048;
    this._dirLight.shadow.camera.left = -30;
    this._dirLight.shadow.camera.right = 30;
    this._dirLight.shadow.camera.top = 30;
    this._dirLight.shadow.camera.bottom = -30;
    this._dirLight.shadow.camera.near = 0.5;
    this._dirLight.shadow.camera.far = 80;
    this.scene.add(this._dirLight);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xc8bfa9, roughness: 0.9 });
    this._ground = new THREE.Mesh(groundGeo, groundMat);
    this._ground.rotation.x = -Math.PI / 2;
    this._ground.position.y = -0.01;
    this._ground.receiveShadow = true;
    this.scene.add(this._ground);

    // Grid
    this._grid = new THREE.GridHelper(100, 100, 0xaaaaaa, 0xdddddd);
    this._grid.position.y = 0.001;
    this.scene.add(this._grid);

    // Orbit controls
    this.orbitControls = new OrbitControls(this.camera, this._canvas);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.08;
    this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.orbitControls.target.set(0, 1.5, 0);

    // FPS controls
    this.fpsControls = new FPSControls(this.camera, this._canvas, this);

    this.resize();
  }

  buildScene(stories, terrainWidthCm, terrainHeightCm, axisOrigin) {
    // Remove previous building
    if (this.buildingGroup) {
      this.scene.remove(this.buildingGroup);
      this._disposeObjectTree(this.buildingGroup);
    }

    this.buildingGroup = SceneBuilder.build(stories);
    this.scene.add(this.buildingGroup);

    // Update terrain ground plane if dimensions provided
    if (terrainWidthCm && terrainHeightCm) {
      const tw = terrainWidthCm / 100;
      const th = terrainHeightCm / 100;
      this._ground.geometry.dispose();
      this._ground.geometry = new THREE.PlaneGeometry(tw, th);

      // Match 2D coordinate system:
      //  bottom-left: terrain 2D rect (0, -h) → (w, 0)  →  3D X: 0..tw, Z: 0..th
      //  center:      terrain 2D rect (-w/2, -h/2) → (w/2, h/2)  →  3D centered at origin
      let cx, cz;
      if (axisOrigin === 'center') {
        cx = 0;
        cz = 0;
      } else {
        // bottom-left (default)
        cx = tw / 2;
        cz = th / 2;
      }
      this._ground.position.set(cx, -0.01, cz);

      this.scene.remove(this._grid);
      this._grid.geometry.dispose();
      const gridSize = Math.max(tw, th);
      this._grid = new THREE.GridHelper(gridSize, Math.round(gridSize), 0xaaaaaa, 0xdddddd);
      this._grid.position.set(cx, 0.001, cz);
      this.scene.add(this._grid);
    }

    // Adjust shadow camera to cover the building
    this._adjustShadowBounds();

    // Auto-position camera based on building bounds
    this._autoCameraPosition();
  }

  _disposeObjectTree(root) {
    root.traverse((child) => {
      if (child.geometry && typeof child.geometry.dispose === 'function') {
        child.geometry.dispose();
      }

      const materials = [];
      if (child.material) {
        if (Array.isArray(child.material)) {
          materials.push(...child.material);
        } else {
          materials.push(child.material);
        }
      }

      for (const material of materials) {
        if (!material || !material.dispose) continue;
        if (material.userData?.hoomerShared) continue;
        material.dispose();
      }
    });
  }

  _adjustShadowBounds() {
    if (!this.buildingGroup || !this._dirLight) return;
    const box = new THREE.Box3().setFromObject(this.buildingGroup);
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.z) / 2 + 5;

    this._dirLight.position.set(center.x + radius, size.y + 15, center.z + radius);
    this._dirLight.target.position.copy(center);
    this._dirLight.target.updateMatrixWorld();
    this.scene.add(this._dirLight.target);

    const cam = this._dirLight.shadow.camera;
    cam.left = -radius;
    cam.right = radius;
    cam.top = radius;
    cam.bottom = -radius;
    cam.far = size.y + 30;
    cam.updateProjectionMatrix();
  }

  _autoCameraPosition() {
    if (!this.buildingGroup) return;

    const box = new THREE.Box3().setFromObject(this.buildingGroup);
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist = maxDim * 1.8;

    this.camera.position.set(center.x + dist * 0.6, center.y + dist * 0.7, center.z + dist * 0.6);
    this.orbitControls.target.copy(center);
    this.orbitControls.update();
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._animate();
  }

  stop() {
    this._running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _animate() {
    if (!this._running) return;
    this._rafId = requestAnimationFrame(() => this._animate());

    if (this._navMode === 'fps' && this.fpsControls) {
      this.fpsControls.update();
    } else {
      this.orbitControls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  get navMode() { return this._navMode; }

  setNavigationMode(mode) {
    if (mode === this._navMode) return;

    if (mode === 'fps' && this.fpsControls) {
      this.orbitControls.enabled = false;
      this.fpsControls.enable();
      this._navMode = 'fps';
    } else {
      if (this.fpsControls) this.fpsControls.disable();
      this.orbitControls.enabled = true;
      this._navMode = 'orbit';
    }

    if (this.onNavModeChange) this.onNavModeChange(this._navMode);
  }

  getWallMeshes() {
    const meshes = [];
    if (this.buildingGroup) {
      this.buildingGroup.traverse(child => {
        if (child.isMesh && child.userData.type === 'wall') meshes.push(child);
      });
    }
    return meshes;
  }

  dispose() {
    this.stop();
    if (this.fpsControls) {
      this.fpsControls.dispose();
      this.fpsControls = null;
    }
    if (this.orbitControls) {
      this.orbitControls.dispose();
      this.orbitControls = null;
    }
    if (this.buildingGroup) {
      this._disposeObjectTree(this.buildingGroup);
      this.scene.remove(this.buildingGroup);
      this.buildingGroup = null;
    }

    if (this._ground) {
      this._disposeObjectTree(this._ground);
      this.scene.remove(this._ground);
      this._ground = null;
    }
    if (this._grid) {
      this._disposeObjectTree(this._grid);
      this.scene.remove(this._grid);
      this._grid = null;
    }

    Materials3D.dispose();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    if (this._canvas && this._canvas.parentNode) {
      this._canvas.parentNode.removeChild(this._canvas);
    }
  }
}

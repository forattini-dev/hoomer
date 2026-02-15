import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

export class FPSControls {
  constructor(camera, domElement, viewer) {
    this.camera = camera;
    this.domElement = domElement;
    this.viewer = viewer;

    this.eyeHeight = 1.6;     // meters
    this.moveSpeed = 5.0;     // m/s
    this.playerRadius = 0.3;  // meters

    this._enabled = false;
    this._keys = { forward: false, backward: false, left: false, right: false };
    this._velocity = new THREE.Vector3();
    this._direction = new THREE.Vector3();
    this._raycaster = new THREE.Raycaster();
    this._clock = new THREE.Clock();
    this._touchMoveX = 0;
    this._touchMoveZ = 0;
    this._touchLookYaw = 0;
    this._touchLookPitch = 0;

    this._lookSensitivity = 0.0025;

    // Pointer lock controls
    this.pointerLock = new PointerLockControls(this.camera, this.domElement);

    // Event handlers
    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onKeyUp = this._handleKeyUp.bind(this);
    this._onLockChange = this._handleLockChange.bind(this);

    this.domElement.addEventListener('click', () => {
      if (this._enabled && !this.pointerLock.isLocked) {
        this.pointerLock.lock();
      }
    });
  }

  enable() {
    this._enabled = true;
    this._clock.start();
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('pointerlockchange', this._onLockChange);
  }

  disable() {
    this._enabled = false;
    if (this.pointerLock.isLocked) this.pointerLock.unlock();
    this._keys.forward = false;
    this._keys.backward = false;
    this._keys.left = false;
    this._keys.right = false;
    this._touchMoveX = 0;
    this._touchMoveZ = 0;
    this._touchLookYaw = 0;
    this._touchLookPitch = 0;
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('pointerlockchange', this._onLockChange);
  }

  _handleKeyDown(e) {
    if (!this._enabled) return;
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    this._keys.forward = true; break;
      case 'KeyS': case 'ArrowDown':  this._keys.backward = true; break;
      case 'KeyA': case 'ArrowLeft':  this._keys.left = true; break;
      case 'KeyD': case 'ArrowRight': this._keys.right = true; break;
    }
  }

  _handleKeyUp(e) {
    if (!this._enabled) return;
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    this._keys.forward = false; break;
      case 'KeyS': case 'ArrowDown':  this._keys.backward = false; break;
      case 'KeyA': case 'ArrowLeft':  this._keys.left = false; break;
      case 'KeyD': case 'ArrowRight': this._keys.right = false; break;
    }
  }

  _handleLockChange() {
    if (!this._enabled) return;
    if (!this.pointerLock.isLocked) {
      // Lost pointer lock — switch back to orbit
      this.viewer.setNavigationMode('orbit');
    }
  }

  setTouchMove(x = 0, z = 0) {
    const clamp = (v) => Math.max(-1, Math.min(1, Number(v) || 0));
    this._touchMoveX = clamp(x);
    this._touchMoveZ = clamp(z);
  }

  addTouchLook(dx = 0, dy = 0) {
    this._touchLookYaw += (Number(dx) || 0) * this._lookSensitivity;
    this._touchLookPitch += (Number(dy) || 0) * this._lookSensitivity;
  }

  update() {
    if (!this._enabled) return;

    const hasTouchMove = this._touchMoveX !== 0 || this._touchMoveZ !== 0;
    const hasTouchLook = this._touchLookYaw !== 0 || this._touchLookPitch !== 0;
    if (!this.pointerLock.isLocked && !hasTouchMove && !hasTouchLook) return;

    const delta = this._clock.getDelta();
    const speed = this.moveSpeed * delta;

    // Calculate desired movement
    this._direction.set(0, 0, 0);
    if (this._keys.forward) this._direction.z -= 1;
    if (this._keys.backward) this._direction.z += 1;
    if (this._keys.left) this._direction.x -= 1;
    if (this._keys.right) this._direction.x += 1;
    if (this._touchMoveX) this._direction.x += this._touchMoveX;
    if (this._touchMoveZ) this._direction.z += this._touchMoveZ;

    if (this._direction.lengthSq() === 0 && !hasTouchLook) return;
    this._direction.normalize();

    // Transform direction by camera yaw (ignore pitch)
    const euler = new THREE.Euler(0, this.camera.rotation.y, 0, 'YXZ');
    // Get camera direction projected on XZ plane
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    camDir.y = 0;
    camDir.normalize();

    const camRight = new THREE.Vector3();
    camRight.crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();

    const move = new THREE.Vector3();
    move.addScaledVector(camDir, -this._direction.z);
    move.addScaledVector(camRight, this._direction.x);
    move.normalize().multiplyScalar(speed);

    if (this._touchLookYaw || this._touchLookPitch) {
      const euler = new THREE.Euler(0, this.camera.rotation.y, this.camera.rotation.x, 'YXZ');
      euler.y -= this._touchLookYaw;
      euler.x -= this._touchLookPitch;
      euler.x = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, euler.x));
      this.camera.rotation.set(euler.x, euler.y, 0, 'YXZ');
      this._touchLookYaw = 0;
      this._touchLookPitch = 0;
    }

    // Collision detection via raycasts
    const wallMeshes = this.viewer.getWallMeshes();
    const pos = this.camera.position.clone();
    pos.y = this.eyeHeight * 0.5; // cast from mid-body height

    // Diagonal movement guard (prevents cutting corners)
    const moveLen = move.length();
    if (moveLen > 0.0001) {
      const moveDir = move.clone().normalize();
      this._raycaster.set(pos, moveDir);
      this._raycaster.far = this.playerRadius + moveLen;
      const hits = this._raycaster.intersectObjects(wallMeshes);
      if (hits.length > 0 && hits[0].distance < this.playerRadius + moveLen) {
        return;
      }
    }

    // Check X movement
    if (Math.abs(move.x) > 0.0001) {
      this._raycaster.set(pos, new THREE.Vector3(Math.sign(move.x), 0, 0));
      this._raycaster.far = this.playerRadius + Math.abs(move.x);
      const hits = this._raycaster.intersectObjects(wallMeshes);
      if (hits.length > 0 && hits[0].distance < this.playerRadius + Math.abs(move.x)) {
        move.x = 0;
      }
    }

    // Check Z movement
    if (Math.abs(move.z) > 0.0001) {
      this._raycaster.set(pos, new THREE.Vector3(0, 0, Math.sign(move.z)));
      this._raycaster.far = this.playerRadius + Math.abs(move.z);
      const hits = this._raycaster.intersectObjects(wallMeshes);
      if (hits.length > 0 && hits[0].distance < this.playerRadius + Math.abs(move.z)) {
        move.z = 0;
      }
    }

    this.camera.position.x += move.x;
    this.camera.position.z += move.z;
    this.camera.position.y = this.eyeHeight; // Lock height
  }

  dispose() {
    this.disable();
    this.pointerLock.dispose();
  }
}

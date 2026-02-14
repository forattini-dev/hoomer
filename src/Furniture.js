import { CONFIG } from './config.js';

let nextId = 1;

export class Furniture {
  constructor(x, y, furnitureType = 'chair', rotation = 0) {
    this.x = x;
    this.y = y;
    this.furnitureType = furnitureType;
    this.rotation = rotation;
    this.id = nextId++;
  }

  hitTest(px, py) {
    const catalog = CONFIG.FURNITURE_CATALOG[this.furnitureType];
    if (!catalog) return false;

    const w = catalog.w;
    const d = catalog.d;
    const margin = 5;

    // Translate point to local coordinates
    const dx = px - this.x;
    const dy = py - this.y;

    // Inverse rotation
    const rad = -this.rotation * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;

    return Math.abs(lx) <= w / 2 + margin && Math.abs(ly) <= d / 2 + margin;
  }

  serialize() {
    return {
      x: this.x,
      y: this.y,
      furnitureType: this.furnitureType,
      rotation: this.rotation,
    };
  }

  static fromData(d) {
    return new Furniture(d.x, d.y, d.furnitureType, d.rotation);
  }
}

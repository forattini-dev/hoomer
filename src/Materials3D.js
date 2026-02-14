import * as THREE from 'three';

const MATERIAL_DEFS = {
  // Wall materials
  brick:    { color: 0xb5453a, roughness: 0.85 },
  concrete: { color: 0x95a5a6, roughness: 0.9 },
  wood:     { color: 0x8B5E3C, roughness: 0.7 },
  drywall:  { color: 0xdfe6e9, roughness: 0.95 },

  // Floor materials
  ceramic:        { color: 0xf5f0e1, roughness: 0.6 },
  hardwood:       { color: 0x8B5E3C, roughness: 0.55 },
  marble:         { color: 0xf0eded, roughness: 0.3 },
  cimentoQueimado: { color: 0x7f8c8d, roughness: 0.8 },

  // Stair default
  stair: { color: 0x999999, roughness: 0.7 },

  // Glass
  glass: { color: 0x88ccee, roughness: 0.05, transparent: true, opacity: 0.35 },
};

const _cache = new Map();

export class Materials3D {
  static get(key, materialName) {
    const cacheKey = `${key}_${materialName}`;
    if (_cache.has(cacheKey)) return _cache.get(cacheKey);

    const def = MATERIAL_DEFS[materialName] || MATERIAL_DEFS.concrete;
    const mat = new THREE.MeshStandardMaterial({
      color: def.color,
      roughness: def.roughness,
      metalness: 0.0,
      transparent: !!def.transparent,
      opacity: def.opacity !== undefined ? def.opacity : 1.0,
      side: def.transparent ? THREE.DoubleSide : THREE.FrontSide,
    });
    _cache.set(cacheKey, mat);
    return mat;
  }

  static dispose() {
    for (const mat of _cache.values()) mat.dispose();
    _cache.clear();
  }
}

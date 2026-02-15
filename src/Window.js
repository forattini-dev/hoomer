import { CONFIG } from './config.js';
import { WallOpening } from './WallOpening.js';

export class Window extends WallOpening {
  constructor(wall, position, width = 60, windowType = 'fixed', height = CONFIG.DEFAULT_WINDOW_HEIGHT, sillHeight = CONFIG.DEFAULT_WINDOW_SILL_HEIGHT) {
    super(wall, position, width);
    this.windowType = windowType; // 'fixed' | 'sliding' | 'casement'
    this.height = height;           // cm (3D)
    this.sillHeight = sillHeight;   // cm (3D)
  }

  serialize(wallIndex) {
    return {
      wallIndex,
      position: this.position,
      width: this.width,
      windowType: this.windowType,
      height: this.height,
      sillHeight: this.sillHeight,
      id: this.id,
    };
  }

  static fromData(d, wall) {
    const window = new Window(
      wall,
      d.position,
      d.width,
      d.windowType || 'fixed',
      d.height || CONFIG.DEFAULT_WINDOW_HEIGHT,
      d.sillHeight || CONFIG.DEFAULT_WINDOW_SILL_HEIGHT
    );
    if (d.id) window.id = d.id;
    return window;
  }
}

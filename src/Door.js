import { CONFIG } from './config.js';
import { WallOpening } from './WallOpening.js';

export class Door extends WallOpening {
  constructor(wall, position, width = 80, hingeSide = 'left', openDir = 1, doorType = 'single', height = CONFIG.DEFAULT_DOOR_HEIGHT) {
    super(wall, position, width);
    this.hingeSide = hingeSide; // 'left' | 'right'
    this.openDir = openDir;     // 1 | -1 (which side of wall the door swings to)
    this.doorType = doorType;   // 'single' | 'double' | 'sliding'
    this.height = height;       // cm (3D)
  }

  serialize(wallIndex) {
    return {
      wallIndex,
      position: this.position,
      width: this.width,
      hingeSide: this.hingeSide,
      openDir: this.openDir,
      doorType: this.doorType,
      height: this.height,
      id: this.id,
    };
  }

  static fromData(d, wall) {
    const door = new Door(wall, d.position, d.width, d.hingeSide, d.openDir, d.doorType || 'single', d.height || CONFIG.DEFAULT_DOOR_HEIGHT);
    if (d.id) door.id = d.id;
    return door;
  }
}

let nextId = 1;

export class Label {
  constructor(x, y, text = 'Room', fontSize = 16) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.fontSize = fontSize;
    this.id = nextId++;
  }

  hitTest(px, py) {
    // Estimate bounding box based on text length and font size
    const charWidth = this.fontSize * 0.6;
    const w = this.text.length * charWidth;
    const h = this.fontSize * 1.2;
    return px >= this.x - w / 2 && px <= this.x + w / 2 &&
           py >= this.y - h / 2 && py <= this.y + h / 2;
  }

  serialize() {
    return {
      x: this.x, y: this.y,
      text: this.text, fontSize: this.fontSize,
    };
  }

  static fromData(d) {
    return new Label(d.x, d.y, d.text, d.fontSize);
  }
}

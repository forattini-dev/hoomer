export class History {
  constructor(maxSize = 50) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxSize = maxSize;
  }

  push(state) {
    this.undoStack.push(state);
    if (this.undoStack.length > this.maxSize) this.undoStack.shift();
    this.redoStack = [];
  }

  undo(currentState) {
    if (!this.undoStack.length) return null;
    this.redoStack.push(currentState);
    return this.undoStack.pop();
  }

  redo(currentState) {
    if (!this.redoStack.length) return null;
    this.undoStack.push(currentState);
    return this.redoStack.pop();
  }

  get canUndo() { return this.undoStack.length > 0; }
  get canRedo() { return this.redoStack.length > 0; }
}

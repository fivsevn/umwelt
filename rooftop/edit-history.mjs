// JSON snapshots preserve the existing layout serialization and 80-step cap.
export function createEditHistory() {
  const past = [],
    future = [];
  return {
    get canUndo() {
      return past.length > 0;
    },
    get canRedo() {
      return future.length > 0;
    },
    checkpoint(snapshot) {
      past.push(snapshot);
      if (past.length > 80) past.shift();
      future.length = 0;
    },
    undo(layout) {
      if (!past.length) return null;
      future.push(JSON.stringify(layout));
      return JSON.parse(past.pop());
    },
    redo(layout) {
      if (!future.length) return null;
      past.push(JSON.stringify(layout));
      return JSON.parse(future.pop());
    },
  };
}

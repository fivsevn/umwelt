import { initialLayout, validateLayout } from "./scene.mjs";
import { ITEM_CATALOG_REVISION } from "./item-catalog.mjs";

// Keep the historical key and let callers retain their own failure feedback.
export const LAYOUT_KEY = "umwelt-rooftop-layout-v1";
export function readLayout(storage = localStorage) {
  const saved = storage.getItem(LAYOUT_KEY);
  if (!saved) return initialLayout();
  const data = JSON.parse(saved);
  // The user has retired the old arrangements and will place the native items
  // afresh. Mark the empty baseline once; future hand-made saves are retained.
  if (data.catalogRevision !== ITEM_CATALOG_REVISION) {
    const empty = initialLayout();
    writeLayout(empty, storage);
    return empty;
  }
  return validateLayout(data);
}
// Retain the saved room while discarding terrace items before validation or
// migration. Observation never writes this projection back to storage.
export function readObservationLayout(storage = localStorage) {
  const saved = storage.getItem(LAYOUT_KEY);
  const data = saved ? JSON.parse(saved) : initialLayout();
  if (data.catalogRevision !== ITEM_CATALOG_REVISION) return initialLayout();
  return validateLayout({
    ...data,
    scenes: data?.scenes && { ...data.scenes, north: [], south: [] },
  });
}
export function writeLayout(layout, storage = localStorage) {
  storage.setItem(LAYOUT_KEY, JSON.stringify({...layout, catalogRevision:ITEM_CATALOG_REVISION}));
}

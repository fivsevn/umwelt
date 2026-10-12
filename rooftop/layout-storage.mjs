import { initialLayout, validateLayout } from "./scene.mjs";
import { ITEM_CATALOG_REVISION } from "./item-catalog.mjs";

// Keep the historical key and let callers retain their own failure feedback.
export const LAYOUT_KEY = "umwelt-rooftop-layout-v1";
export function readLayout(storage = localStorage) {
  const saved = storage.getItem(LAYOUT_KEY);
  if (!saved) return initialLayout();
  const data = JSON.parse(saved);
  // Retired catalog saves adopt the current starting arrangement once;
  // future player-authored saves, including empty ones, are retained.
  if (data.catalogRevision !== ITEM_CATALOG_REVISION) {
    const initial = initialLayout();
    writeLayout(initial, storage);
    return initial;
  }
  return validateLayout(data);
}
// Observe the same arrangement as the editors without writing or migrating
// saved bytes. A new player or retired catalog uses the current default.
export function readObservationLayout(storage = localStorage) {
  const saved = storage.getItem(LAYOUT_KEY);
  const data = saved ? JSON.parse(saved) : initialLayout();
  if (data.catalogRevision !== ITEM_CATALOG_REVISION) return initialLayout();
  return validateLayout(data);
}
export function writeLayout(layout, storage = localStorage) {
  storage.setItem(LAYOUT_KEY, JSON.stringify({...layout, catalogRevision:ITEM_CATALOG_REVISION}));
}

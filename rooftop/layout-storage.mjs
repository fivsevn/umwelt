import { initialLayout, validateLayout } from "./scene.mjs";

// Keep the historical key and let callers retain their own failure feedback.
export const LAYOUT_KEY = "umwelt-rooftop-layout-v1";
export function readLayout(storage = localStorage) {
  const saved = storage.getItem(LAYOUT_KEY);
  return saved ? validateLayout(JSON.parse(saved)) : initialLayout();
}
// Retain the saved room while discarding terrace items before validation or
// migration. Observation never writes this projection back to storage.
export function readObservationLayout(storage = localStorage) {
  const saved = storage.getItem(LAYOUT_KEY);
  const data = saved ? JSON.parse(saved) : initialLayout();
  return validateLayout({
    ...data,
    scenes: data?.scenes && { ...data.scenes, north: [], south: [] },
  });
}
export function writeLayout(layout, storage = localStorage) {
  storage.setItem(LAYOUT_KEY, JSON.stringify(layout));
}

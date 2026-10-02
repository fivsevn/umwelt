import { initialLayout, validateLayout } from "./scene.mjs";

// Keep the historical key and let callers retain their own failure feedback.
export const LAYOUT_KEY = "umwelt-rooftop-layout-v1";
export function readLayout(storage = localStorage) {
  const saved = storage.getItem(LAYOUT_KEY);
  return saved ? validateLayout(JSON.parse(saved)) : initialLayout();
}
export function writeLayout(layout, storage = localStorage) {
  storage.setItem(LAYOUT_KEY, JSON.stringify(layout));
}

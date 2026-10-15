// Presentation grain only; authored materials retain their physical 16px/m.
export const PIXEL_GRID_TARGET_CSS = 1.7;
export const EDITOR_GRID_TARGET_CSS = 2;
export const SCOPE_DETAIL_TARGET_CSS = 1;

export function resolvePixelGrid(devicePixelRatio = 1, targetCssPixelStep = PIXEL_GRID_TARGET_CSS) {
  const pixelRatio = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1,
    target = Number.isFinite(targetCssPixelStep) && targetCssPixelStep > 0 ? targetCssPixelStep : PIXEL_GRID_TARGET_CSS,
    pixelStep = Math.max(1, Math.round(target * pixelRatio));
  return { pixelRatio, pixelStep, cssPixelStep: pixelStep / pixelRatio, targetCssPixelStep: target };
}

// Refine the entire scope frame as its actual field narrows. Other observers
// retain the authored presentation grain, including their near/far movement.
export function resolveObservationPixelGrid(devicePixelRatio, view, zoom = 1) {
  const detailZoom = view === "neighbor" && Number.isFinite(zoom) ? Math.max(1, zoom) : 1;
  const grid = resolvePixelGrid(devicePixelRatio, Math.max(SCOPE_DETAIL_TARGET_CSS, PIXEL_GRID_TARGET_CSS / detailZoom));
  // Keep a fine visible grain even at maximum magnification, rather than
  // reaching a native one-device-pixel rendering of the original model.
  grid.pixelStep = Math.min(resolvePixelGrid(devicePixelRatio).pixelStep, Math.max(2, grid.pixelStep));
  grid.cssPixelStep = grid.pixelStep / grid.pixelRatio;
  return grid;
}

// Native inspection stays in test pages. Arrangement pages keep their own
// grain, using the same integer-cell raster as the observation view.
export function resolveScenePixelGrid(devicePixelRatio, { sourceInspection = false, arrangement = false, view, zoom = 1 } = {}) {
  if (!sourceInspection) return arrangement
    ? resolvePixelGrid(devicePixelRatio, EDITOR_GRID_TARGET_CSS)
    : resolveObservationPixelGrid(devicePixelRatio, view, zoom);
  const grid = resolvePixelGrid(devicePixelRatio, 1 / (devicePixelRatio > 0 ? devicePixelRatio : 1));
  grid.pixelStep = 1;
  grid.cssPixelStep = 1 / grid.pixelRatio;
  return grid;
}

// Particle sizes and the optical mask use the same live grid as the scene.
export function resolveCanvasPixelGrid(dataset = {}, fallbackDpr = 1) {
  const ratio = Number(dataset.pixelRatio), target = Number(dataset.targetCssPixelStep), step = Number(dataset.physicalPixelStep),
    grid = resolvePixelGrid(ratio > 0 ? ratio : fallbackDpr, target);
  if (Number.isFinite(step) && step >= 1) {
    grid.pixelStep = Math.round(step);
    grid.cssPixelStep = grid.pixelStep / grid.pixelRatio;
  }
  return grid;
}

export function pixelGridBufferSize(width, height, grid = resolvePixelGrid()) {
  const output = [Math.max(1, Math.round(width)), Math.max(1, Math.round(height))],
    source = output.map(value => Math.ceil(value / grid.pixelStep)),
    padded = source.map(value => value * grid.pixelStep);
  return { output, source, padded, ...grid };
}

export function pixelGridSize(cssWidth, cssHeight, grid = resolvePixelGrid()) {
  return pixelGridBufferSize(cssWidth * grid.pixelRatio, cssHeight * grid.pixelRatio, grid);
}

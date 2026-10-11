// Presentation grain only; authored materials retain their physical 16px/m.
export const PIXEL_GRID_TARGET_CSS = 2.5;

export function resolvePixelGrid(devicePixelRatio = 1) {
  const pixelRatio = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1,
    pixelStep = Math.max(1, Math.round(PIXEL_GRID_TARGET_CSS * pixelRatio));
  return { pixelRatio, pixelStep, cssPixelStep: pixelStep / pixelRatio, targetCssPixelStep: PIXEL_GRID_TARGET_CSS };
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

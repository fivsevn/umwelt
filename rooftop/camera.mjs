// Bounds include parapets, railings and the entrance. Camera movement stays over the garden.
export const VIEW_BOUNDS = {
  north: { x: 128, y: 56, w: 368, h: 432 },
  south: { x: 192, y: 88, w: 176, h: 352 },
};
export function gardenCamera(
  scene,
  width,
  height,
  scale = 1,
  pan = { x: 0, y: 0 },
) {
  const b = VIEW_BOUNDS[scene],
    zoom = Math.max(1, Math.min(2.5, scale)),
    fit = Math.min(
      Math.max(1, width - 24) / b.w,
      Math.max(1, height - 48) / b.h,
    ),
    w = Math.ceil(width / (fit * zoom)),
    h = Math.ceil(height / (fit * zoom));
  const offset = (n, extent, view) =>
    view >= extent
      ? 0
      : Math.max(-(extent - view) / 2, Math.min((extent - view) / 2, n));
  const constrained = { x: offset(pan.x, b.w, w), y: offset(pan.y, b.h, h) };
  return {
    camera: {
      x: Math.floor(b.x + b.w / 2 + constrained.x - w / 2),
      y: Math.floor(b.y + b.h / 2 + constrained.y - h / 2),
      w,
      h,
    },
    pan: constrained,
    zoom,
  };
}

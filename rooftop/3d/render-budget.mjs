// Bound full-screen fill on large displays. MSAA smooths the geometric silhouette;
// authored texture texels retain nearest filtering independently of this budget.
export function drawingBufferSize(width, height, software = false) {
  const w = Math.max(1, width),
    h = Math.max(1, height);
  const factor = Math.min(
    1,
    (software ? 960 : 1600) / Math.max(w, h),
    Math.sqrt((software ? 520000 : 1600000) / (w * h)),
  );
  return [
    Math.max(1, Math.floor(w * factor)),
    Math.max(1, Math.floor(h * factor)),
  ];
}

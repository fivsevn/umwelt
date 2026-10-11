// Measurements use the anonymous house coordinates and the authored metre scale.
// A 40 degree unaided reference field defines the displayed magnification.
export function readScopeOptics({ eye, hit, metresPerUnit, verticalFovDegrees, zoom = 1, viewportHeight, measuredSurface = false }) {
  if (![eye, hit, metresPerUnit].every(value => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite))) return null;
  if (metresPerUnit.some(value => value <= 0) || ![verticalFovDegrees, zoom, viewportHeight].every(Number.isFinite) || !(verticalFovDegrees > 0 && verticalFovDegrees < 180 && zoom > 0 && viewportHeight > 0)) return null;
  const delta = hit.map((value, axis) => (value - eye[axis]) * metresPerUnit[axis]),
    distanceMetres = Math.hypot(...delta),
    tangent = Math.tan(verticalFovDegrees * Math.PI / 360) / zoom;
  return {
    distanceMetres,
    magnification: Math.tan(20 * Math.PI / 180) / tangent,
    inclinationDegrees: Math.atan2(delta[1], Math.hypot(delta[0], delta[2])) * 180 / Math.PI,
    mradPixels: viewportHeight * Math.tan(.001) / (2 * tangent),
    verticalFovDegrees: 2 * Math.atan(tangent) * 180 / Math.PI,
    measuredSurface: !!measuredSurface,
  };
}

export function createScopeSurfaceCache() {
  let sample = { key: null, time: -Infinity, value: null };
  return {
    read(key, now, measure, moving = false) {
      if (sample.key !== key || (moving && now - sample.time >= 250)) sample = { key, time: now, value: measure() };
      return sample.value;
    },
  };
}

import { ROOM_PART_BOUNDS } from '../assets/room/room-part-bounds.mjs';

/** Fit the authored room at its real orbit angle; span is camera vertical size. */
export function roomFrame(width, height, theta = -.18, phi = .9, {
  zoom = 1,
  margin = .05,
  targetY = .2,
  distance = null,
  parts = ROOM_PART_BOUNDS,
} = {}) {
  const aspect = Math.max(1, width) / Math.max(1, height);
  const c = Math.cos(theta), s = Math.sin(theta);
  const sp = Math.sin(phi), cp = Math.cos(phi);
  if (Math.abs(sp) < 1e-6)
    throw new RangeError('Room orbit elevation must permit a horizontal target');
  const corners = parts.flatMap(part => [part.min[0], part.max[0]].flatMap(x =>
    [part.min[1], part.max[1]].flatMap(y => [part.min[2], part.max[2]].map(z => [x, y, z])),
  ));
  const points = corners.map(([x, y, z]) => [c * x - s * z, sp * (s * x + c * z) - cp * y]);
  if (!points.length) throw new RangeError('Room framing requires authored part bounds');
  const xs = points.map(point => point[0]), ys = points.map(point => point[1]);
  let bounds = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  let u = (bounds[0] + bounds[2]) / 2, v = (bounds[1] + bounds[3]) / 2;
  if (distance !== null) {
    if (!(distance > 0)) throw new RangeError('Room perspective distance must be positive');
    // The gameplay camera remains perspective when entering the room. Project
    // each real corner onto the target plane and compensate its real depth.
    for (let step = 0; step < 24; step++) {
      const targetDepth = (v + cp * targetY) / sp;
      const projected = corners.map(([x, y, z], index) => {
        const towardEye = sp * (y - targetY) + cp * (s * x + c * z - targetDepth);
        const cameraDepth = distance - towardEye;
        if (cameraDepth <= .1) throw new RangeError('Room camera must stay outside the authored parts');
        const scale = distance / cameraDepth;
        return [(points[index][0] - u) * scale, (points[index][1] - v) * scale];
      });
      const px = projected.map(point => point[0]), py = projected.map(point => point[1]);
      bounds = [Math.min(...px), Math.min(...py), Math.max(...px), Math.max(...py)];
      const du = (bounds[0] + bounds[2]) / 2, dv = (bounds[1] + bounds[3]) / 2;
      if (Math.max(Math.abs(du), Math.abs(dv)) < 1e-10) break;
      if (step < 23) { u += du; v += dv; }
    }
  }
  const depth = (v + cp * targetY) / sp;
  const usable = 1 - 2 * Math.max(0, Math.min(.45, margin));
  const span = Math.max(
    distance === null ? bounds[3] - bounds[1] : 2 * Math.max(Math.abs(bounds[1]), Math.abs(bounds[3])),
    (distance === null ? bounds[2] - bounds[0] : 2 * Math.max(Math.abs(bounds[0]), Math.abs(bounds[2]))) / aspect,
  )
    * Math.max(.001, zoom) / usable;
  return {
    span, width: span * aspect, bounds, projection: distance === null ? 'orthographic' : 'perspective',
    target: { x: c * u + s * depth, y: targetY, z: -s * u + c * depth },
  };
}

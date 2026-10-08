import { SCENES } from "../scene.mjs";

export const TERRACE_ZOOM = { min: 1, max: 3.5 };
const centre = { north: [304, 272], south: [284, 264] };
export function terraceFrame(scene, width, height, theta, phi) {
  const [cx, cy] = centre[scene],
    c = Math.cos(theta),
    s = Math.sin(theta);
  const points = SCENES[scene].points.flatMap(([x, z]) =>
    [0, 4.2].map((y) => {
      const xx = (x - cx) / 16,
        zz = (z - cy) / 16;
      return [
        c * xx - s * zz,
        Math.sin(phi) * (s * xx + c * zz) - Math.cos(phi) * y,
      ];
    }),
  );
  const xs = points.map((p) => p[0]),
    ys = points.map((p) => p[1]);
  const bounds = [
    Math.min(...xs) - 0.7,
    Math.min(...ys) - 0.5,
    Math.max(...xs) + 0.7,
    Math.max(...ys) + 0.65,
  ];
  const aspect = width / Math.max(1, height);
  // At minimum zoom all of this terrace fits. Extra space on a tall viewport
  // is sky and nearby eaves, never another terrace or a distant city overview.
  const span = Math.max(
    (bounds[3] - bounds[1]) / 0.91,
    (bounds[2] - bounds[0]) / aspect / 0.91,
  );
  const u = (bounds[0] + bounds[2]) / 2;
  const v = (bounds[1] + bounds[3]) / 2;
  return {
    bounds,
    span,
    width: span * aspect,
    target: {
      x: c * u + (s * v) / Math.sin(phi),
      z: -s * u + (c * v) / Math.sin(phi),
    },
  };
}
export function constrainTerracePan(frame, target, zoom, theta, phi) {
  const c = Math.cos(theta),
    s = Math.sin(theta);
  const constrain = (value, lo, hi, span) =>
    hi - lo <= span
      ? (lo + hi) / 2
      : Math.max(lo + span / 2, Math.min(hi - span / 2, value));
  const u = constrain(
    c * target.x - s * target.z,
    frame.bounds[0],
    frame.bounds[2],
    frame.width / zoom,
  );
  const v = constrain(
    (s * target.x + c * target.z) * Math.sin(phi),
    frame.bounds[1],
    frame.bounds[3],
    frame.span / zoom,
  );
  return {
    x: c * u + (s * v) / Math.sin(phi),
    z: -s * u + (c * v) / Math.sin(phi),
  };
}

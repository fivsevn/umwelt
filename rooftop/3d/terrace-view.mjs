import { SCENES } from "../scene.mjs";

export const TERRACE_ZOOM = { min: 1.8, max: 4.5 };
export function terraceOrbit(scene, width) {
  const theta = scene === "south" && width >= 640 ? -Math.PI / 2 + 0.34 : -0.12;
  return {
    theta,
    fullRotation: true,
    minPhi: 0.45,
    maxPhi: 1.35,
    phi: 0.55,
  };
}
const centre = { north: [304, 272], south: [284, 264] };
export function terraceFrame(
  scene,
  width,
  height,
  theta,
  phi,
  minZoom = TERRACE_ZOOM.min,
) {
  const [cx, cy] = centre[scene],
    c = Math.cos(theta),
    s = Math.sin(theta);
  const points = SCENES[scene].points.flatMap(([x, z]) =>
    [0, 3.5].map((y) => {
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
    Math.min(...xs) - 0.25,
    Math.min(...ys) - 0.25,
    Math.max(...xs) + 0.25,
    Math.max(...ys) + 0.25,
  ];
  const aspect = width / Math.max(1, height);
  // The furthest view stays close to the current balcony. Portrait screens
  // intentionally crop its edges; panning can reach them without a city overview.
  const span =
    (width >= height ? minZoom : 1) *
    Math.max(
      (bounds[3] - bounds[1]) / 0.98,
      (bounds[2] - bounds[0]) / Math.max(0.46, aspect) / 0.98,
    );
  const u =
    (bounds[0] + bounds[2]) / 2 + (scene === "north" && width < height ? 3 : 0);
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
export function constrainTerracePan(
  frame,
  target,
  zoom,
  theta,
  phi,
  localTravel = true,
) {
  const c = Math.cos(theta),
    s = Math.sin(theta);
  // Allow movement even when the whole balcony fits. Requiring the viewport
  // itself to fit inside the floor used to pin vertical panning at minimum zoom.
  const constrain = (value, lo, hi, span) => {
    if (!localTravel)
      return hi - lo <= span
        ? (lo + hi) / 2
        : Math.max(lo + span / 2, Math.min(hi - span / 2, value));
    const centre = (lo + hi) / 2;
    const travel =
      Math.max(2.2, (hi - lo) * 0.18) + Math.max(0, (hi - lo - span) / 2);
    return Math.max(centre - travel, Math.min(centre + travel, value));
  };
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

// Saved arrangements stay in terrace-local coordinates. Both terraces belong
// to one continuous residential block; both terraces are rendered in public views.
export const HOUSE = Object.freeze({
  id: "dongdong-home",
  roof: { x: -106, z: 4, width: 120, depth: 52, eave: 0.15, ridge: 8.2 },
  base: -36.15,
  terraces: {
    north: { rotation: 0, origin: [0, 0] },
    south: { rotation: -Math.PI / 2, origin: [0, 60] },
  },
});
export function housePoint(scene, x, z) {
  return scene === "south" ? [-z, HOUSE.terraces.south.origin[1] + x] : [x, z];
}
export function terracePoint(scene, x, z) {
  return scene === "south" ? [z - HOUSE.terraces.south.origin[1], -x] : [x, z];
}

// Ray/solid intersection for diagnostics and spatial regression checks. The
// volume is the actual house body and pitched roof, never a camera mask.
export function houseOccludes(from, to) {
  const r = HOUSE.roof,
    x0 = r.x,
    x1 = r.x + r.width,
    z0 = r.z,
    z1 = r.z + r.depth,
    slope = (r.ridge - r.eave) / ((z1 - z0) / 2);
  let enter = 0,
    exit = 1;
  const planes = [
    (p) => x0 - p[0],
    (p) => p[0] - x1,
    (p) => z0 - p[2],
    (p) => p[2] - z1,
    (p) => HOUSE.base - p[1],
    (p) => p[1] - r.eave - slope * (p[2] - z0),
    (p) => p[1] - r.eave - slope * (z1 - p[2]),
  ];
  for (const plane of planes) {
    const a = plane(from),
      b = plane(to),
      d = b - a;
    if (Math.abs(d) < 1e-10) {
      if (a > 0) return false;
      continue;
    }
    const t = -a / d;
    if (d > 0) exit = Math.min(exit, t);
    else enter = Math.max(enter, t);
    if (enter > exit) return false;
  }
  return exit > 1e-6 && enter < 1 - 1e-6 && exit - enter > 1e-6;
}

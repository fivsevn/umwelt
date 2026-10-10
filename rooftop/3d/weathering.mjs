import { pointThreshold } from "./face-paintings.mjs";

export const WEATHER_KINDS = [
  "wood",
  "metal",
  "paint",
  "enamel",
  "cloth",
  "face-board",
  "face-cabinet",
  "face-door",
  "face-drawer",
  "round-metal",
];
export function outdoorPaintKind(group, kind, curved = false) {
  if (kind.startsWith("wrap-")) {
    curved = true;
    kind = kind.slice(5);
  }
  if (kind === "plain") kind = "paint";
  let owner = group;
  while (owner.parent && owner.userData.weathered === undefined)
    owner = owner.parent;
  if (owner.userData.weathered && WEATHER_KINDS.includes(kind))
    kind = "weather-" + kind;
  return curved &&
    ["wood", "metal", "paint", "enamel", "cloth"].includes(
      kind.replace(/^weather-/, ""),
    )
    ? "wrap-" + kind
    : kind;
}

// A few sprouts grow from a damp lower joint, below bearing surfaces. These
// sparse meshes keep real volume while the broad deposits remain painted.
export function attachOutdoorGrowth(api, g, type, w, d, h) {
  if (
    !g.userData?.weathered ||
    !/shelf|stand|plantcart|bench|table|storagechest|rainbarrel|sink|basin/.test(
      type,
    )
  )
    return;
  const seed =
    Math.floor((g.userData.paintSeed || 0) * 100000) +
    [...type].reduce((s, c) => s + c.charCodeAt(0), 0);
  if (pointThreshold(1, 2, seed) > 0.25) return;
  const { box, beam } = api,
    side = pointThreshold(4, 3, seed) > 0.5 ? 1 : -1,
    x = side * w * 0.43,
    z = -d * 0.4;
  const maxHeight = Math.min(0.26, h * 0.25),
    points = [[x, 0.025, z]];
  for (let j = 1; j <= 4; j++)
    points.push([
      x + (pointThreshold(j, 7, seed) - 0.5) * 0.06,
      0.025 + (j * maxHeight) / 4,
      z + (pointThreshold(j, 9, seed) - 0.5) * 0.045,
    ]);
  for (let j = 1; j < points.length; j++) {
    beam(g, points[j - 1], points[j], 0.012, "#59633b", 0.012, "leaf");
    const [px, py, pz] = points[j],
      s = j % 2 ? 1 : -1,
      span = 0.043 + pointThreshold(j, 2, seed) * 0.035;
    box(
      g,
      px + s * 0.035,
      py + 0.014,
      pz,
      span,
      0.008,
      span * 0.74,
      j % 3 ? "#71834a" : "#8a9254",
      "leaf",
      0.28,
      j * 0.71,
      s * 0.4,
    );
  }
}

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
const pigment = [
  "#725744",
  "#967653",
  "#b29a76",
  "#746750",
  "#485341",
  "#71805a",
  "#929b76",
];
const field = (x, y, cx, cy, rx, ry) =>
  Math.exp(-((x - cx) ** 2 / (rx * rx) + (y - cy) ** 2 / (ry * ry)));

// Contamination is independent of the underlying material drawing. Corrosion
// belongs to iron; moist wood/plastic collect mould, soil and small moss patches.
export function weatherDrawing(art, kind) {
  const cw = art.cellWidth || art.size,
    ch = art.cellHeight || art.size;
  const ramp = art.ramp.slice();
  while (ramp.length < 13) ramp.push("#697275");
  ramp.push(...pigment);
  const commands = art.commands.map(([xx, yy, w, h, original]) => {
    // Preserve authored lines and motifs. Individual painted texels can carry
    // deposits; structural bands are never converted into a sheet of rust.
    if (w !== 1 || h !== 1) return [xx, yy, w, h, original];
    const x = xx % cw,
      y = yy % ch,
      u = x / cw,
      v = y / ch;
    const component = Math.floor(xx / cw) + Math.floor(yy / ch) * 3,
      seed = component * 193 + kind.length * 71;
    const a = 0.12 + pointThreshold(1, 3, seed) * 0.73,
      b = 0.15 + pointThreshold(4, 2, seed) * 0.66;
    const age = pointThreshold(2, 3, seed),
      mode = pointThreshold(6, 8, seed);
    // One deposit has a coherent source area. A hard locality gate prevents
    // the Gaussian tails from sprinkling isolated specks across the furniture.
    const zone =
      mode < 0.55
        ? field(u, v, a, 0.95, 0.125, 0.09)
        : field(u, v, 0.03, b, 0.05, 0.13);
    const pick = pointThreshold(x, y, seed + 43),
      grain = pointThreshold(x, y, seed + 119);
    let ink = original;
    if (age > 0.32 && zone > 0.38 && pick < Math.min(0.9, zone * 0.95)) {
      if (kind === "metal" && mode < 0.78)
        ink = 13 + (grain < 0.2 ? 0 : grain > 0.82 ? 2 : 1);
      else if (mode > 0.74 && !["enamel", "round-metal"].includes(kind))
        ink = grain < 0.28 ? 17 : grain > 0.88 ? 19 : 18;
      else ink = 16;
    }
    return [xx, yy, 1, 1, ink];
  });
  return { ...art, ramp, commands };
}

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

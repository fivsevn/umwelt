// Original point-painted surfaces. Geometry folds these drawings into a model;
// texel placement, local dithering and construction detail live in this module.
export const PIGMENT_RAMP = Array.from(
  { length: 9 },
  (_, j) =>
    "#" +
    Math.round((j * 255) / 8)
      .toString(16)
      .padStart(2, "0")
      .repeat(3),
);
export const FACE_NAMES = ["正面", "右侧", "背面", "左侧", "顶面", "底面"];
export const FACE_PAINT_KINDS = [
  "wood",
  "metal",
  "paint",
  "enamel",
  "cloth",
  "wall",
  "face-board",
  "face-cabinet",
  "face-door",
  "face-drawer",
];
const drawings = new Map();
// A stable integer hash has no repeating checker or diagonal lattice.
export function pointThreshold(x, y, seed = 0) {
  let n =
    Math.imul(x | 0, 0x45d9f3b) ^
    Math.imul(y | 0, 0x119de1f3) ^
    Math.imul(seed | 0, 0x27d4eb2d);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const gaussian = (x, y, sx, sy) =>
  Math.exp(-((x * x) / (sx * sx) + (y * y) / (sy * sy)));
export const pointInk = (value, x, y, phase = 0, max = 4) => {
  const v = clamp(value, 0, max),
    a = Math.floor(v);
  return a + (v - a > pointThreshold(x, y, phase) ? 1 : 0);
};

// A knot has growth lines that bend around its core. The density of discrete
// points describes grain; no continuous decorative rectangle is pasted on wood.
function woodAt(x, y, w, h, f, vertical = false) {
  if (vertical) [x, y, w, h] = [y, x, h, w];
  const knots = [
    [0.24, 0.54],
    [0.73, 0.38],
    [0.48, 0.68],
    [0.36, 0.31],
    [0.81, 0.63],
    [0.58, 0.27],
  ];
  const [ax, ay] = knots[f % 6],
    variant = Math.floor(f / 6),
    kx = clamp(ax + (variant - 1.5) * 0.06, 0.15, 0.86),
    ky = clamp(ay + ((variant % 2) - 0.5) * 0.13, 0.18, 0.81),
    dx = x - w * kx,
    dy = y - h * ky;
  const warp = gaussian(dx, dy, w * 0.23, h * 0.36);
  const grain = Math.sin(
    y * 0.83 +
      Math.sin(y * 0.34 + f) * 1.2 +
      Math.sin(x * 0.15 + f) * 0.9 +
      warp * (dx < 0 ? -1 : 1) * 2.2 +
      f * 0.7,
  );
  let tone = 3.05 + 0.15 * Math.sin(x * 0.11 + y * 0.29 + f);
  if (grain > 0.28) tone -= (0.43 * (grain - 0.28)) / 0.72;
  if (grain < -0.55) tone += (0.28 * (-grain - 0.55)) / 0.45;
  const radius = Math.hypot(dx / (w * 0.08 + 0.5), dy / (h * 0.13 + 0.5));
  if (radius < 1.9) tone -= 0.3 + 0.37 * Math.max(0, Math.cos(radius * 5));
  if (radius < 0.48) tone = 0.95 + radius;
  return tone;
}

function woodFace(kind, x, y, w, h, f) {
  const face = f % 6;
  const vertical = ["face-cabinet", "face-door"].includes(kind) && face < 4;
  let tone = woodAt(x, y, w, h, f, vertical);
  // Baked bevel and underside shade are tied to the actual face edges.
  if (y === 0 || x === 0) tone += 0.48;
  if (y === h - 1 || x === w - 1) tone -= 0.65;
  if (kind === "wood" && face === 5) {
    const rr = Math.hypot((x - w * 0.38) * 0.62, y - h * 0.56);
    tone =
      2.9 -
      0.48 * Math.max(0, Math.sin(rr * 1.4 + f)) +
      0.15 * Math.cos(x * 0.23);
  }
  if (kind === "face-cabinet" && face < 4) {
    // The sides and back have real boards and joints, rather than a copy of
    // the doors painted onto every side of the cabinet.
    const seams =
      face === 2
        ? [Math.floor(w * 0.27), Math.floor(w * 0.6)]
        : [Math.floor(w * 0.34), Math.floor(w * 0.72)];
    for (const seam of seams) {
      if (x === seam) tone = 1.2;
      if (x === seam + 1) tone = 3.6;
    }
    if (y === 2) tone = 3.6;
    if (y === h - 3) tone = 1.7;
    if ((x === 2 || x === w - 4) && (y === 4 || y === h - 6)) tone = 0.6;
  }
  if ((kind === "face-door" || kind === "face-drawer") && face === 0) {
    const fields =
      kind === "face-door"
        ? [
            [3, 3, w - 6, Math.floor(h * 0.39)],
            [3, Math.floor(h * 0.54), w - 6, Math.floor(h * 0.39)],
          ]
        : [[3, 2, w - 6, h - 4]];
    for (const [l, t, ww, hh] of fields) {
      const r = l + ww - 1,
        b = t + hh - 1;
      if (x >= l && x <= r && y >= t && y <= b) {
        if (x === l || y === t) tone = 0.9;
        else if (x === l + 1 || y === t + 1) tone = 1.9;
        else if (x === r || y === b) tone = 3.8;
        else tone -= 0.2;
      }
    }
    // An understated brass escutcheon follows the existing 3D handle.
    if (
      kind === "face-drawer" &&
      x >= w / 2 - 2 &&
      x <= w / 2 + 2 &&
      Math.abs(y - h * 0.5) < 1.2
    )
      return { ink: x === w / 2 - 2 ? 1 : 5 };
  }
  // Use follows the material: dark bruises, pale exposed fibres, water marks
  // and worn corners occupy separate, off-centre areas on each face.
  const seed = f * 97 + kind.length * 13;
  const cx = w * (0.12 + pointThreshold(1, 2, seed) * 0.73),
    cy = h * (0.2 + pointThreshold(4, 9, seed) * 0.58);
  const stain = gaussian(x - cx, y - cy, w * 0.17, h * 0.2);
  tone -= stain * 0.52;
  const scratch = gaussian(
    x - w * (0.16 + pointThreshold(3, 4, seed) * 0.63),
    y - h * 0.68,
    w * 0.2,
    h * 0.075,
  );
  tone += scratch * 0.35;
  const margin = Math.min(x, w - 1 - x, y, h - 1 - y);
  const wornEnd = gaussian(
    x - w * (0.13 + pointThreshold(7, 2, seed) * 0.72),
    y - (f % 2 ? h - 1 : 0),
    w * 0.12,
    2.1,
  );
  const pick = pointThreshold(x, y, seed + 19);
  if (margin < 3 && wornEnd > 0.12 && pick < wornEnd * 0.75)
    tone = margin === 0 ? 1.2 : 3.9;
  if (stain > 0.35 && pick < 0.09) tone -= 0.8;
  return { tone };
}

function metalFace(kind, x, y, w, h, f) {
  const u = x / (w - 1),
    v = y / (h - 1);
  let tone = 3;
  if (kind === "metal") {
    // A slanted reflection breaks into points at either boundary. Its shape
    // follows the metal surface; it is not a painted panel or floating smudge.
    const centre = [0.22, 0.67, 0.44, 0.31, 0.73, 0.53][f % 6] + v * 0.16;
    const distance = Math.abs(u - centre);
    if (distance < 0.16) tone += 0.65 * (1 - distance / 0.16);
    if (u > centre + 0.17 && u < centre + 0.28) tone -= 0.37;
    if (pointThreshold(x, y, f + 53) < 0.055 && distance < 0.24) tone -= 0.18;
  } else {
    // Enamel and plastic retain their intrinsic base pigment. Fine chipped
    // points are confined to exposed edges, with each side painted differently.
    tone =
      2.85 +
      0.28 * Math.sin(u * 3.7 + f * 1.4) +
      0.19 * Math.cos(v * 4.1 - f * 0.8);
    tone += 0.18 * (1 - v);
    const wear = pointThreshold(x, y, f + 31) * 29;
    if ((x < 2 || y > h - 3) && wear < 6) tone -= 0.7;
    if (kind === "enamel" && (x === w - 1 || y === h - 1) && wear < 3)
      tone = 1.3;
  }
  const wearField = gaussian(
    x - w * (0.18 + pointThreshold(2, 5, f + 101) * 0.62),
    y - h * (0.34 + pointThreshold(7, 3, f + 37) * 0.48),
    w * 0.18,
    h * 0.23,
  );
  tone -= wearField * 0.45;
  const lower = gaussian(
    x - w * (0.2 + pointThreshold(9, 4, f + 41) * 0.57),
    y - h * 0.92,
    w * 0.11,
    h * 0.13,
  );
  if (pointThreshold(x, y, f + 163) < lower * 0.65) tone -= 0.85;
  if (y === 0 || x === 0) tone += 0.45;
  if (y === h - 1) tone -= 0.6;
  if (x === w - 1) tone -= 0.25;
  return { tone };
}

function clothFace(x, y, w, h, f) {
  const u = x / (w - 1),
    v = y / (h - 1),
    face = f % 6;
  // Intersecting small cloth fibres and local fold shading are point painted,
  // distinct from wood growth and metallic reflection.
  let tone = 3 + 0.09 * Math.sin(x * 0.6 + f) - 0.05 * Math.cos(y * 0.7);
  const fold = gaussian(u - 0.26 - face * 0.045, v - 0.36, 0.14, 0.22);
  const fold2 = gaussian(u - 0.73 + face * 0.022, v - 0.68, 0.13, 0.19);
  tone -= fold * 0.46;
  tone += fold2 * 0.28;
  if (x === 1 || y === 1) tone = 2.2;
  if (x === w - 2 || y === h - 2) tone = 2.6;
  if ((y === 2 && x % 3 === f % 3) || (x === 2 && y % 3 === f % 3)) tone = 3.9;
  if (pointThreshold(x, y, f + 89) < 0.1) tone += 0.12;
  if (y === h - 1 || x === w - 1) tone -= 0.55;
  return { tone };
}

function wallFace(x, y, w, h, f) {
  let tone = 3 + 0.06 * Math.sin(x * 0.29 + y * 0.17 + f);
  const patches = [
    [0.22, 0.31],
    [0.71, 0.43],
    [0.37, 0.72],
    [0.63, 0.25],
    [0.43, 0.59],
    [0.78, 0.68],
  ];
  const [px, py] = patches[f % 6],
    field = gaussian(x / w - px, y / h - py, 0.19, 0.13);
  tone -= field * 0.42;
  // Weather accumulates along the foot and joints. It does not blanket the
  // façade with uniform random noise or invent a panel outline.
  if (y > h - 7) tone -= (0.33 * (y - h + 7)) / 7;
  const chips = pointThreshold(x, y, f + 71) * 43;
  if (y > h - 4 && chips < 5) return { ink: 8 };
  if (x === 0 || y === 0) tone += 0.2;
  return { tone };
}

export function facePainting(kind) {
  if (!FACE_PAINT_KINDS.includes(kind)) return null;
  if (drawings.has(kind)) return drawings.get(kind);
  const cellWidth = kind === "wall" ? 64 : 32;
  const cellHeight =
    kind === "wood"
      ? 16
      : kind === "face-board"
        ? 8
        : kind === "face-door" || kind === "face-cabinet"
          ? 48
          : kind === "face-drawer"
            ? 16
            : cellWidth;
  const variants =
    kind === "wood" || kind === "face-board"
      ? 32
      : kind === "face-cabinet" ||
          kind === "face-door" ||
          kind === "face-drawer"
        ? 16
        : kind === "wall"
          ? 4
          : 8;
  const commands = [],
    ramp = [...PIGMENT_RAMP, "#b9a174", "#d4d0be", "#697275", "#697b51"];
  for (let variant = 0; variant < variants; variant++)
    for (let f = 0; f < 6; f++)
      for (let y = 0; y < cellHeight; y++)
        for (let x = 0; x < cellWidth; x++) {
          const sample =
            kind === "wood" || kind.startsWith("face-")
              ? woodFace(kind, x, y, cellWidth, cellHeight, f + variant * 6)
              : ["metal", "paint", "enamel"].includes(kind)
                ? metalFace(kind, x, y, cellWidth, cellHeight, f + variant * 6)
                : kind === "cloth"
                  ? clothFace(x, y, cellWidth, cellHeight, f + variant * 6)
                  : wallFace(x, y, cellWidth, cellHeight, f + variant * 6);
          const ink =
            sample.ink === undefined
              ? pointInk(sample.tone * 2, x, y, f + variant * 6, 8)
              : sample.ink + 4;
          commands.push([
            (f % 3) * cellWidth + x,
            (Math.floor(f / 3) + variant * 2) * cellHeight + y,
            1,
            1,
            ink,
          ]);
        }
  const maxInk = commands.reduce((max, c) => Math.max(max, c[4]), 0);
  const art = {
    size: cellWidth,
    width: cellWidth * 3,
    height: cellHeight * 2 * variants,
    cellWidth,
    cellHeight,
    variants,
    grayCount: 9,
    ramp: ramp.slice(0, maxInk + 1),
    commands,
  };
  drawings.set(kind, art);
  return art;
}

// Continuous profiles share the same point painting language, with one UV
// field instead of six box faces. No rectangular face sheet is stretched round
// a cylinder, a bowl or the edge of a circular table.
export function wrappedPainting(kind) {
  const base = kind.slice(5);
  if (!["wood", "metal", "paint", "enamel", "cloth"].includes(base))
    return null;
  const art = facePainting(base),
    commands = art.commands.filter(
      (c) => c[0] < art.cellWidth && c[1] < art.cellHeight,
    );
  return {
    size: art.cellWidth,
    width: art.cellWidth,
    height: art.cellHeight,
    grayCount: 9,
    ramp: art.ramp,
    commands,
  };
}

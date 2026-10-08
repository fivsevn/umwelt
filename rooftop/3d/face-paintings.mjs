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
  // A few broken fibres follow the board. Broad pigment fields and a single
  // knot read at terrace scale; no stochastic shading across the entire face.
  const seed = f * 97 + 31;
  let tone = 3;
  for (let j = 0; j < 3; j++) {
    const start = Math.floor(w * (.06 + pointThreshold(j, 2, seed) * .53));
    const length = Math.max(3, Math.floor(w * (.16 + pointThreshold(j, 7, seed) * .26)));
    const row = Math.floor(h * (.18 + pointThreshold(j, 9, seed) * .65));
    const bend = Math.floor(Math.sin((x - start) / Math.max(3, length) * 3 + j) * 1.2);
    if (x >= start && x < start + length && y === row + bend)
      tone = j === 1 ? 3.5 : 2.5;
    if (j === 0 && x >= start + 2 && x < start + length - 2 && y === row + bend + 1)
      tone = 2.5;
  }
  const cx = w * (.22 + pointThreshold(5, 3, seed) * .54);
  const cy = h * (.26 + pointThreshold(8, 1, seed) * .46);
  const radius = Math.hypot((x - cx) / Math.max(2, w * .065), (y - cy) / Math.max(1.2, h * .13));
  if (pointThreshold(4, 6, seed) > .48 && radius < 1.65) {
    tone = radius < .45 ? 1.5 : radius < .82 ? 2 : radius < 1.2 ? 3 : 2.5;
  }
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
  const pick = pointThreshold(Math.floor(x / 2), Math.floor(y / 2), seed + 19);
  if (margin < 3 && wornEnd > 0.12 && pick < wornEnd * 0.75)
    tone = margin === 0 ? 1.2 : 3.9;
  if (stain > 0.35 && pick < 0.09) tone -= 0.8;
  return { tone };
}

function metalFace(kind, x, y, w, h, f) {
  const seed = f * 113 + kind.length * 71;
  let tone = 3;
  const sx = Math.floor(w * (.14 + pointThreshold(2, 3, seed) * .47));
  const sy = Math.floor(h * (.15 + pointThreshold(6, 4, seed) * .54));
  const span = Math.max(3, Math.floor(w * .22));
  // Short, stepped highlights like painted steel and enamel in the reference
  // sheets. Hardware is modelled; the paint never invents extra panel seams.
  if (x >= sx && x < sx + span && y >= sy && y < sy + 2) tone = 3.5;
  if (x >= sx + 2 && x < sx + span - 2 && y === sy - 1) tone = 3.5;
  if (kind === "metal") {
    const band = Math.floor(w * (.38 + pointThreshold(4, 3, seed) * .23));
    if (x > band && x < band + Math.max(2, w * .13)) tone = 2.5;
  }
  const margin = Math.min(x, w - x - 1, y, h - y - 1);
  const chip = pointThreshold(Math.floor(x / 2), Math.floor(y / 2), seed + 17);
  if (margin < 2 && chip > .84) tone = kind === "enamel" ? 2 : 2.5;
  if (y === 0 || x === 0) tone = Math.max(tone, 3.5);
  if (y === h - 1) tone = 2;
  if (x === w - 1) tone = Math.min(tone, 2.5);
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
              ? Math.round(clamp(sample.tone * 2, 0, 8))
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
    ramp: ramp.slice(0, Math.max(9, maxInk + 1)),
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

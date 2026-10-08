import { pointInk, pointThreshold, PIGMENT_RAMP } from "./face-paintings.mjs";

const cache = new Map(),
  gaussian = (x, y, cx, cy, rx, ry) =>
    Math.exp(-((x - cx) ** 2 / (rx * rx) + (y - cy) ** 2 / (ry * ry)));
export const ENVIRONMENT_KINDS = [
  "wall",
  "facade-tile",
  "roof",
  "brick",
  "asphalt",
];
// Intrinsic material, separately painted faces and independently fired bricks.
// Deposits are applied once in whole-face coordinates by the material shader.
export function environmentPainting(kind) {
  if (kind === "window") return windowPainting();
  if (!ENVIRONMENT_KINDS.includes(kind)) return null;
  if (cache.has(kind)) return cache.get(kind);
  const cw = 48,
    ch = 48,
    variants = 8,
    commands = [];
  for (let v = 0; v < variants; v++)
    for (let face = 0; face < 6; face++) {
      const seed = 91 + v * 719 + face * 113;
      for (let y = 0; y < ch; y++)
        for (let x = 0; x < cw; x++) {
          let tone = 6.05 + 0.16 * Math.sin(x * 0.17 + y * 0.23 + seed);
          const field = gaussian(
            x,
            y,
            6 + pointThreshold(2, 3, seed) * 34,
            8 + pointThreshold(7, 2, seed) * 30,
            11,
            14,
          );
          tone -= field * 0.75;
          tone += gaussian(x, y, 34, 13, 10, 7) * 0.38;
          const n = pointThreshold(x, y, seed);
          if (kind === "wall") {
            // Plaster pores and a soft trowelled field; larger losses belong to a seam.
            if (n < 0.04) tone -= 0.75;
            else if (n > 0.95) tone += 0.45;
          } else if (kind === "facade-tile") {
            // Narrow ceramic wall tiles seen on Guoliyuan walk-ups; restrained grout.
            const lx = x % 3,
              ly = y % 7,
              fired = pointThreshold(
                Math.floor(x / 3),
                Math.floor(y / 7),
                seed,
              );
            tone = 5.9 + fired * 0.65 - field * 0.4;
            if (lx === 0 || ly === 0) tone -= 0.75;
            if (n < 0.032) tone -= 0.65;
          } else if (kind === "asphalt") {
            tone = 5.8 - field * 0.9;
            if (n < 0.12) tone -= 1.1;
            else if (n > 0.87) tone += 0.7;
          } else {
            const bw = kind === "roof" ? 8 : 16,
              bh = kind === "roof" ? 12 : 8;
            const row = Math.floor(y / bh),
              xx = x + (row % 2) * Math.floor(bw / 2),
              col = Math.floor(xx / bw),
              lx = xx % bw,
              ly = y % bh;
            const fired = pointThreshold(col, row, seed);
            tone = 5.35 + fired * 1.25 - field * 0.35;
            if (lx === 0 || ly === 0)
              tone = 3.6 + pointThreshold(col, row, seed + 29) * 0.6;
            else if (ly === 1) tone += 0.36;
            else if (ly === bh - 1) tone -= 0.35;
            const scar = gaussian(
              lx,
              ly,
              1 + pointThreshold(col, row, seed + 13) * (bw - 3),
              2 + fired * (bh - 4),
              2.4,
              1.7,
            );
            tone -= scar * 0.8;
            if (n < 0.065) tone -= 0.6;
            else if (n > 0.962) tone += 0.6;
          }
          const ink = pointInk(tone, x, y, seed, 8);
          commands.push([
            (face % 3) * cw + x,
            (Math.floor(face / 3) + v * 2) * ch + y,
            1,
            1,
            ink,
          ]);
        }
    }
  const art = {
    size: 64,
    width: cw * 3,
    height: ch * 2 * variants,
    cellWidth: cw,
    cellHeight: ch,
    variants,
    grayCount: 9,
    ramp: PIGMENT_RAMP,
    commands,
    environment: true,
  };
  cache.set(kind, art);
  return art;
}

// Small panes are composed as whole fields, rather than tiled plaster fields.
function windowPainting() {
  if (cache.has("window")) return cache.get("window");
  const size = 16,
    variants = 16,
    commands = [];
  for (let v = 0; v < variants; v++)
    for (let f = 0; f < 6; f++) {
      const seed = 1273 + v * 719 + f * 137,
        curtain = pointThreshold(1, 2, seed),
        edge = 2 + Math.floor(pointThreshold(7, 9, seed) * 5);
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          let tone = 2.6 + gaussian(x, y, 11, 12, 8, 6) * 0.7;
          const slant = x - y * 0.64 - (3 + pointThreshold(8, 5, seed) * 5);
          if (slant > 0 && slant < 3 && y > 2 && y < 14)
            tone = 5.5 + pointThreshold(x, y, seed) * 0.6;
          if (curtain < 0.38 && x < edge && y > 1)
            tone = 5.3 + 0.42 * Math.sin(x * 2.1 + v);
          else if (curtain > 0.71 && x > size - edge && y > 2)
            tone = 4.8 + 0.45 * Math.sin(x * 1.8 + v);
          if (x === 0 || y === 0 || x === 15 || y === 15) tone = 1.7;
          if (y === 14 && pointThreshold(x, y, seed) > 0.45) tone -= 0.55;
          commands.push([
            (f % 3) * size + x,
            (Math.floor(f / 3) + v * 2) * size + y,
            1,
            1,
            pointInk(tone, x, y, seed, 8),
          ]);
        }
    }
  const art = {
    size,
    width: 48,
    height: 512,
    cellWidth: size,
    cellHeight: size,
    variants,
    grayCount: 9,
    ramp: PIGMENT_RAMP,
    commands,
    environment: false,
  };
  cache.set("window", art);
  return art;
}

const tileRamp = [
  "#92978c",
  "#a2a79a",
  "#adb1a3",
  "#b7b9ab",
  "#bfc0b2",
  "#c7c7b9",
  "#cfcebf",
  "#d6d4c5",
  "#dcd9cb",
];
const secondCementRamp = [
  "#777976",
  "#858784",
  "#939590",
  "#a1a39d",
  "#afb1ab",
  "#bdbfb8",
  "#cccec7",
];
export const PAVING_PIGMENTS = [
  ...tileRamp,
  "#aaae9f",
  "#b8baad",
  "#c5c6b9",
  "#88745a",
  "#a08b6c",
  "#5d7051",
  "#7d885f",
  "#898985",
  "#979791",
  "#a5a59e",
  "#b3b3ac",
  "#c0c0b9",
  "#cecec7",
  "#dbdbd4",
  "#b1ae9b",
  "#929387",
  "#b0b0a0",
  ...secondCementRamp,
];

function mineralField(x, y, seed) {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    sx = x - ix,
    sy = y - iy;
  const u = sx * sx * (3 - 2 * sx),
    v = sy * sy * (3 - 2 * sy);
  const a = pointThreshold(ix, iy, seed),
    b = pointThreshold(ix + 1, iy, seed);
  const c = pointThreshold(ix, iy + 1, seed),
    d = pointThreshold(ix + 1, iy + 1, seed);
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}

function insidePolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i],
      b = points[j];
    if (
      a[1] > y !== b[1] > y &&
      x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}

// Authored repairs occur here and there, like the photographed sidewalk and
// tile-floor cuts. Both greys mix among surviving tiles instead of forming
// left/centre/right material zones. The approach to the door remains tiled.
function cementRepairs(width, height, density, points, scene) {
  const poly = points
    ? points.map(([x, y]) => [x * density, y * density])
    : [
        [0, 0],
        [width, 0],
        [width, height],
        [0, height],
      ];
  const blocks = (
    scene === "north"
      ? [
          [144, 152, 248, 244],
          [272, 80, 368, 176],
          [280, 208, 432, 312],
          [144, 264, 264, 336],
          [400, 144, 464, 198],
        ]
      : [
          [220, 104, 292, 184],
          [304, 104, 348, 232],
          [220, 200, 288, 304],
          [296, 248, 348, 336],
          [220, 312, 284, 336],
        ]
  ).map((r) => r.map((v) => v * density));
  const coatBlocks = (
    scene === "north"
      ? [
          [144, 152, 248, 244],
          [280, 208, 344, 312],
          [344, 208, 432, 276],
          [344, 276, 432, 312],
          [144, 288, 264, 336],
        ]
      : [
          [220, 104, 292, 184],
          [220, 200, 288, 244],
          [220, 244, 288, 304],
          [220, 312, 284, 336],
          [296, 248, 332, 304],
        ]
  ).map((r) => r.map((v) => v * density));
  const floorMask = new Uint8Array(width * height),
    mask = new Uint8Array(width * height),
    coatMask = new Uint8Array(width * height);
  const ids = new Uint8Array(width * height),
    coatIds = new Uint8Array(width * height);
  const contains = (r, x, y) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = y * width + x,
        px = x + 0.5,
        py = y + 0.5;
      if (!insidePolygon(px, py, poly)) continue;
      floorMask[i] = 1;
      const block = blocks.findIndex((r) => contains(r, px, py));
      if (block < 0) continue;
      mask[i] = 1;
      ids[i] = block + 1;
      const coat = coatBlocks.findIndex((r) => contains(r, px, py));
      if (coat >= 0) {
        coatMask[i] = 1;
        coatIds[i] = coat + 1;
      }
    }
  return { mask, floorMask, ids, blocks, coatMask, coatIds, coatBlocks };
}
// Coordinates share the layout's 16 units/world-unit; 12 square texels/world-
// unit match the furniture. This is a whole-scene painting, never a repeated tile.
export function pavingPainting(
  width,
  height,
  { scene = "north", texelsPerUnit = 12, points } = {},
) {
  // Larger slabs change the laying grid, independently of the material's square texels.
  const density = texelsPerUnit / 16,
    tile = texelsPerUnit * 2,
    seed = scene === "north" ? 15773 : 39127,
    commands = [];
  const deposits =
    scene === "north"
      ? [
          [282, 147, 25, 20, "damp"],
          [448, 441, 25, 19, "moss"],
          [178, 317, 22, 12, "soil"],
        ]
      : [
          [236, 407, 20, 24, "damp"],
          [338, 115, 12, 24, "moss"],
          [326, 344, 14, 23, "soil"],
        ];
  // Fine silt accumulates at selected wall feet. Shallow surface losses are
  // composed separately, with their own crushed aggregate and remaining skin.
  const silt =
    scene === "north"
      ? [
          [149, 295, 6, 37],
          [454, 330, 7, 20],
          [403, 384, 5, 18],
        ]
      : [
          [225, 329, 5, 49],
          [335, 109, 16, 5],
        ];
  const flakes =
    scene === "north"
      ? [
          [282, 264, 14, 9],
          [187, 212, 9, 13],
        ]
      : [
          [270, 236, 12, 9],
          [327, 324, 8, 7],
        ];
  const cement = cementRepairs(width, height, density, points, scene);
  const repairAt = (x, y) =>
    x >= 0 && x < width && y >= 0 && y < height
      ? cement.mask[y * width + x]
      : 0;
  const coatAt = (x, y) =>
    x >= 0 && x < width && y >= 0 && y < height
      ? cement.coatMask[y * width + x]
      : 0;
  const blockAt = (x, y, top) =>
    x >= 0 && x < width && y >= 0 && y < height
      ? (top ? cement.coatIds : cement.ids)[y * width + x]
      : 0;
  const floorAt = (x, y) =>
    x >= 0 && x < width && y >= 0 && y < height
      ? cement.floorMask[y * width + x]
      : 0;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const col = Math.floor(x / tile),
        row = Math.floor(y / tile),
        lx = x % tile,
        ly = y % tile;
      const entry =
        scene === "north"
          ? x >= 400 * density && y >= 320 * density
          : y >= 336 * density;
      const t = pointThreshold(col, row, seed),
        n = pointThreshold(x, y, seed + 17),
        r = pointThreshold(col, row, seed + 51);
      const mineral = mineralField(x / 5.7, y / 5.7, seed + 947);
      let tone = 4.9 + t * 0.9 + (mineral - 0.5) * 0.48;
      tone -=
        gaussian(
          lx,
          ly,
          tile * (0.17 + t * 0.58),
          tile * (0.33 + r * 0.42),
          tile * 0.275,
          tile * 0.325,
        ) * 0.63;
      tone +=
        gaussian(
          lx,
          ly,
          tile * (0.67 - r * 0.25),
          tile * (0.17 + t * 0.33),
          tile * 0.3,
          tile * 0.2,
        ) * 0.48;
      if (n < 0.09) tone -= 0.7;
      else if (n > 0.9) tone += 0.65;
      let ink = pointInk(tone, x, y, seed, 8);
      const grout = lx === 0 || ly === 0;
      if (grout) ink = n < 0.24 ? 10 : 9;
      // The worn edge and the missing corner differ on every tile.
      else if ((ly === 1 && n > 0.35) || (lx === 1 && n > 0.69))
        ink = pointInk(6.4, x, y, seed, 8);
      else if ((lx === tile - 1 || ly === tile - 1) && n < 0.53)
        ink = pointInk(3.8, x, y, seed, 8);
      if (t < 0.16 && !entry) {
        const corner = pointThreshold(col, row, seed + 79) > 0.5;
        const dx = corner ? lx : tile - 1 - lx,
          dy = pointThreshold(col, row, seed + 101) > 0.5 ? ly : tile - 1 - ly;
        if (dx + dy < 1.5 + r * 1.4) ink = dx + dy < 1.2 ? 9 : 10;
      }
      const repair = repairAt(x, y),
        overcoat = coatAt(x, y),
        cementInk = overcoat ? 26 : 16;
      const blockId = overcoat
          ? cement.coatIds[y * width + x]
          : cement.ids[y * width + x],
        paintPhase = (overcoat ? 1471 : 0) + blockId * 331;
      const grain = pointThreshold(x, y, seed + 733 + paintPhase);
      const neighbours = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];
      const boundary = neighbours.some(
        ([nx, ny]) => floorAt(nx, ny) && repairAt(nx, ny) !== repair,
      );
      if (repair) {
        // Each cut has its own broad trowelled field, with no old grout showing through.
        const field = (overcoat ? cement.coatBlocks : cement.blocks)[
          blockId - 1
        ];
        const u = (x - field[0]) / (field[2] - field[0]),
          v = (y - field[1]) / (field[3] - field[1]);
        let cementTone = overcoat
          ? 3.35 -
            gaussian(u, v, 0.72, 0.82, 0.22, 0.19) * 0.65 +
            gaussian(u, v, 0.32, 0.72, 0.27, 0.21) * 0.62
          : 3.15 -
            gaussian(u, v, 0.18, 0.79, 0.29, 0.23) * 0.65 +
            gaussian(u, v, 0.68, 0.63, 0.25, 0.19) * 0.68;
        cementTone -=
          gaussian(u, v, overcoat ? 0.15 : 0.82, 0.91, 0.16, 0.13) * 0.3;
        cementTone +=
          (pointThreshold(blockId, 3, seed + paintPhase) - 0.5) * 0.7;
        const cementMineral = overcoat
          ? mineralField(x / 6.9, y / 6.9, seed + 947 + paintPhase)
          : mineral;
        cementTone +=
          (cementMineral - 0.5) * 0.75 +
          (mineralField(x / 13.1, y / 13.1, seed + 971 + paintPhase) - 0.5) *
            0.38;
        if (grain < 0.023) cementTone -= 0.45;
        else if (grain > 0.978) cementTone += 0.45;
        // Exposed mineral grains are part of the cement, rather than coloured dirt
        // scattered over the terrace. They interrupt the grey field with square points.
        const aggregate = mineralField(
          x / 2.7,
          y / 2.7,
          seed + 997 + paintPhase,
        );
        if (aggregate > 0.72 && grain < 0.15) cementTone += 0.65;
        else if (aggregate < 0.22 && grain > 0.9) cementTone -= 0.6;
        ink =
          cementInk + pointInk(cementTone, x, y, seed + 719 + paintPhase, 6);
        for (const [cx, cy, rx, ry] of flakes) {
          const zone = gaussian(
            x,
            y,
            cx * density,
            cy * density,
            rx * density,
            ry * density,
          );
          const rough =
            zone *
            (0.63 +
              mineralField(x / 3.8, y / 3.8, seed + 1019 + paintPhase) * 0.75);
          if (rough > 0.43) {
            ink =
              cementInk +
              pointInk(
                2.65 + (1 - rough) * 0.45,
                x,
                y,
                seed + 1031 + paintPhase,
                6,
              );
            if (grain > 0.93)
              ink =
                cementInk + pointInk(4.2, x, y, seed + 1061 + paintPhase, 6);
            else if (grain < 0.045) ink = cementInk + 1;
          }
        }
        if (boundary) {
          // Chips belong to the actual broken tile boundary. No decorative zigzag
          // runs across an otherwise intact tile, and no dark line outlines the patch.
          if (grain < 0.16) ink = cementInk + 2;
          else if (grain > 0.89)
            ink = 4 + Math.floor(pointThreshold(x, y, seed + 810) * 3);
        }
        // The second pour has its own ragged lip, with occasional pale aggregate.
        if (
          overcoat &&
          neighbours.some(([nx, ny]) => repairAt(nx, ny) && !coatAt(nx, ny)) &&
          grain > 0.91
        )
          ink = 30;
        // Cold joints between separately worked rectangles stay fine and slightly
        // interrupted; the blocks are not copies of one repeated square stamp.
        const joint = neighbours.some(
          ([nx, ny]) =>
            coatAt(nx, ny) === overcoat &&
            blockAt(nx, ny, overcoat) > 0 &&
            blockAt(nx, ny, overcoat) !== blockId,
        );
        if (joint && grain < 0.78)
          ink =
            cementInk +
            pointInk(cementTone - 0.65, x, y, seed + 1501 + paintPhase, 6);
      } else if (!grout && boundary) {
        const crumb = pointThreshold(x, y, seed + 397);
        if (crumb < 0.21) ink = 23;
        else if (crumb > 0.9) ink = 7;
      }
      // A little pale dust gathers against the wall, interrupted by cleaner spots.
      // It does not form a uniform border around the entire floor.
      for (const [cx, cy, rx, ry] of silt) {
        const zone = gaussian(
          x,
          y,
          cx * density,
          cy * density,
          rx * density,
          ry * density,
        );
        if (zone > 0.3 && grain < zone * 0.43) {
          ink = grain < zone * 0.09 ? 24 : 25;
        }
      }
      for (const [cx, cy, rx, ry, kind] of deposits) {
        const zone = gaussian(
          x,
          y,
          cx * density,
          cy * density,
          rx * density,
          ry * density,
        );
        if (zone > 0.24) {
          if (kind === "damp" && n < zone * 0.82) {
            // An uneven mineral-water edge is legible around the real drain; its
            // drying fringe is a few pale points, never a perfect concentric ring.
            const dampTone = repair
              ? 1.7 + (1 - zone) * 1.2
              : 3.5 + (1 - zone) * 1.1;
            ink =
              (repair ? cementInk : 0) +
              pointInk(
                dampTone + (mineral - 0.5) * 0.6,
                x,
                y,
                seed + 223 + paintPhase,
                repair ? 6 : 8,
              );
            if (zone < 0.48 && zone > 0.28 && grain > 0.77)
              ink = repair ? cementInk + 5 : 7;
          } else if (kind === "soil" && zone > 0.42 && n < zone * 0.5)
            ink = n < zone * 0.22 ? 12 : 13;
          else if (
            kind === "moss" &&
            zone > 0.4 &&
            ((!repair && grout) || n < zone * 0.2)
          )
            ink = n < 0.32 ? 14 : 15;
        }
      }
      commands.push([x, y, 1, 1, ink]);
    }
  return {
    width,
    height,
    texelsPerUnit,
    tileTexels: tile,
    ramp: PAVING_PIGMENTS,
    commands,
    repairMask: cement.mask,
    coatMask: cement.coatMask,
    repairBlockIds: cement.ids,
    coatBlockIds: cement.coatIds,
  };
}

export function paintScenePaving(ctx, width, height, options) {
  const art = pavingPainting(width, height, options);
  ctx.imageSmoothingEnabled = false;
  for (const [x, y, w, h, i] of art.commands) {
    ctx.fillStyle = art.ramp[i];
    ctx.fillRect(x, y, w, h);
  }
  return art;
}

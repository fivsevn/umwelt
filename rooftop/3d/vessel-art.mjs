import { antiquePainting } from "./antique-paintings.mjs";
import { pointInk, pointThreshold, PIGMENT_RAMP } from "./face-paintings.mjs";
// Profiles and pigments drawn from the makers listed in docs/rooftop-art-sources.md.
// Height is relative to the mouth radius: shallow dishes, bowls and jars stay distinct.
export const VESSEL_ART = {
  tokoname: {
    height: 0.47,
    foot: 0.1,
    shape: "oval",
    body: "#a36343",
    rim: "#b8794e",
    profile: [
      [0.71, 0],
      [0.75, 0.09],
      [0.88, 0.55],
      [1, 1],
    ],
    sides: 24,
  },
  shigaraki: {
    height: 1.03,
    body: "#b59a78",
    rim: "#c8ad85",
    profile: [
      [0.45, 0],
      [0.61, 0.1],
      [0.85, 0.42],
      [0.97, 0.76],
      [1, 1],
    ],
    sides: 24,
  },
  bizen: {
    height: 1.24,
    body: "#925541",
    rim: "#9e694c",
    profile: [
      [0.56, 0],
      [0.74, 0.1],
      [1, 0.42],
      [0.97, 0.66],
      [0.83, 0.86],
      [0.79, 1],
    ],
    sides: 24,
  },
  mashiko: {
    height: 0.93,
    body: "#6a4f3c",
    rim: "#c0a78d",
    profile: [
      [0.48, 0],
      [0.6, 0.1],
      [0.81, 0.5],
      [1, 1],
    ],
    sides: 32,
    shape: "fluted",
  },
  kasama: {
    height: 1.13,
    body: "#679484",
    rim: "#9fb8a1",
    profile: [
      [0.83, 0],
      [0.89, 0.08],
      [0.95, 0.47],
      [0.94, 0.9],
      [0.96, 1],
    ],
    sides: 24,
  },
  mino: {
    height: 0.7,
    foot: 0.12,
    body: "#476958",
    rim: "#658774",
    shape: "square",
    sides: 24,
    profile: [
      [0.69, 0],
      [0.78, 0.15],
      [0.97, 0.87],
      [1, 1],
    ],
  },
  seto: {
    height: 0.69,
    foot: 0.09,
    body: "#ded8c5",
    rim: "#e9dfc8",
    profile: [
      [0.42, 0],
      [0.59, 0.11],
      [0.86, 0.45],
      [1, 1],
    ],
    sides: 24,
  },
  kutani: {
    height: 0.32,
    foot: 0.06,
    shape: "mokko",
    body: "#e1d5ae",
    rim: "#d9b561",
    profile: [
      [0.75, 0],
      [0.89, 0.18],
      [1, 1],
    ],
    sides: 32,
  },
  arita: {
    height: 0.64,
    foot: 0.08,
    shape: "scallop",
    body: "#e1e3d9",
    rim: "#f0ecda",
    profile: [
      [0.39, 0],
      [0.54, 0.1],
      [0.81, 0.45],
      [1, 1],
    ],
    sides: 40,
  },
  imari: {
    height: 0.77,
    foot: 0.16,
    body: "#e0dbcb",
    rim: "#4c7183",
    profile: [
      [0.47, 0],
      [0.6, 0.14],
      [0.91, 0.64],
      [1, 1],
    ],
    sides: 32,
  },
  hasami: {
    height: 1.0,
    foot: 0.04,
    body: "#e3ded0",
    rim: "#e5dfcd",
    profile: [
      [0.65, 0],
      [0.71, 0.12],
      [0.87, 0.62],
      [1, 1],
    ],
    sides: 32,
  },
  kyoto: {
    height: 0.49,
    foot: 0.35,
    shape: "scallop",
    body: "#d5b46a",
    rim: "#e7c987",
    profile: [
      [0.33, 0],
      [0.56, 0.12],
      [0.88, 0.55],
      [1, 1],
    ],
    sides: 40,
  },
  hagi: {
    height: 0.59,
    foot: 0.32,
    shape: "scallop",
    body: "#bdc6c0",
    rim: "#dbd6ca",
    profile: [
      [0.43, 0],
      [0.6, 0.11],
      [0.82, 0.44],
      [1, 1],
    ],
    sides: 40,
  },
  karatsu: {
    height: 0.64,
    foot: 0.12,
    body: "#c4b694",
    rim: "#d2c5a8",
    profile: [
      [0.4, 0],
      [0.6, 0.14],
      [0.88, 0.53],
      [1, 1],
    ],
    sides: 24,
  },
  tobe: {
    height: 0.83,
    foot: 0.09,
    body: "#e0dccb",
    rim: "#eae4d5",
    profile: [
      [0.41, 0],
      [0.61, 0.12],
      [0.87, 0.53],
      [0.98, 0.86],
      [1, 1],
    ],
    sides: 32,
    rolled: true,
  },
  koishiwara: {
    height: 0.81,
    foot: 0.07,
    body: "#c7b995",
    rim: "#b09b7a",
    profile: [
      [0.47, 0],
      [0.6, 0.13],
      [0.78, 0.52],
      [1, 1],
    ],
    sides: 32,
  },
  ontayaki: {
    height: 0.96,
    foot: 0.06,
    body: "#906d52",
    rim: "#b7a384",
    profile: [
      [0.62, 0],
      [0.83, 0.1],
      [1, 0.42],
      [0.98, 0.7],
      [0.83, 1],
    ],
    sides: 16,
  },
  iga: {
    height: 0.86,
    foot: 0.07,
    shape: "irregular",
    body: "#8c947b",
    rim: "#b4ad8a",
    profile: [
      [0.6, 0],
      [0.79, 0.15],
      [1, 0.49],
      [0.94, 0.85],
      [0.96, 1],
    ],
    sides: 24,
  },
  echizen: {
    height: 1.39,
    body: "#805747",
    rim: "#8e634d",
    profile: [
      [0.58, 0],
      [0.71, 0.08],
      [1, 0.38],
      [0.95, 0.68],
      [0.75, 0.85],
      [0.72, 1],
    ],
    sides: 24,
  },
  tsuboya: {
    height: 0.94,
    foot: 0.1,
    body: "#cfbd94",
    rim: "#e0cda6",
    profile: [
      [0.44, 0],
      [0.64, 0.12],
      [0.89, 0.56],
      [0.98, 0.88],
      [1, 1],
    ],
    sides: 32,
    rolled: true,
  },
  terra: {
    height: 1.02,
    body: "#b0714e",
    rim: "#c28b60",
    profile: [
      [0.65, 0],
      [0.7, 0.07],
      [0.93, 0.86],
      [1, 1],
    ],
    sides: 24,
  },
  plastic: {
    height: 1.04,
    body: "#485b54",
    rim: "#637a6a",
    profile: [
      [0.69, 0],
      [0.74, 0.08],
      [0.96, 0.9],
      [1, 1],
    ],
    sides: 24,
  },
  white: {
    height: 0.99,
    body: "#d7d7cb",
    rim: "#eeead8",
    profile: [
      [0.74, 0],
      [0.77, 0.06],
      [0.97, 0.92],
      [1, 1],
    ],
    sides: 24,
  },
  shallow: {
    height: 0.43,
    body: "#a17c52",
    rim: "#c49b69",
    profile: [
      [0.73, 0],
      [0.84, 0.14],
      [1, 1],
    ],
    sides: 24,
  },
  deep: {
    height: 1.55,
    body: "#976348",
    rim: "#b78a62",
    profile: [
      [0.65, 0],
      [0.7, 0.08],
      [0.97, 0.93],
      [1, 1],
    ],
    sides: 24,
  },
  basket: {
    height: 0.74,
    body: "#a18860",
    rim: "#c3a77b",
    profile: [
      [0.62, 0],
      [0.79, 0.22],
      [1, 1],
    ],
    sides: 24,
  },
};

Object.assign(VESSEL_ART, {
  "antique-shino": {
    height: 0.4,
    foot: 0.057,
    footRadius: 0.56,
    body: "#e0d8c6",
    rim: "#e8dfcc",
    shape: "irregular",
    sides: 32,
    profile: [
      [0.61, 0],
      [0.72, 0.11],
      [0.95, 0.62],
      [1, 1],
    ],
    interiorPaint: true,
  },
  "antique-nezumi": {
    height: 0.69,
    foot: 0.138,
    feet: 3,
    body: "#503d30",
    rim: "#654938",
    shape: "rounded-square",
    sides: 32,
    profile: [
      [0.43, 0],
      [0.53, 0.19],
      [0.67, 0.52],
      [1, 0.95],
      [0.98, 1],
    ],
    innerRound: true,
    innerProfile: [
      [0.39, 0.1, 1],
      [0.48, 0.23, 1],
      [0.54, 0.52, 1],
      [0.62, 0.72, 0.8],
      [0.9, 0.98, 0],
    ],
    interiorPaint: true,
  },
  "antique-shino-square": {
    radiusScale: 0.55,
    height: 2.0025,
    foot: 0.055,
    footRadius: 0.7,
    body: "#e3d9c9",
    rim: "#ded0b9",
    shape: "rounded-square",
    sides: 24,
    profile: [
      [0.75, 0],
      [0.83, 0.06],
      [0.88, 0.29],
      [0.92, 0.7],
      [1, 1],
    ],
    interiorPaint: true,
  },
  "antique-nabeshima": {
    height: 0.84,
    foot: 0.118,
    footRadius: 0.46,
    body: "#e0e5dc",
    rim: "#e8e9de",
    sides: 8,
    profile: [
      [0.44, 0],
      [0.59, 0.1],
      [0.84, 0.39],
      [0.95, 0.85],
      [1, 1],
    ],
    interiorPaint: true,
  },
  "antique-nabeshima-dish": {
    height: 0.405,
    foot: 0.09,
    footRadius: 0.57,
    body: "#e2e9e0",
    rim: "#d8e2db",
    sides: 32,
    profile: [
      [0.56, 0],
      [0.69, 0.1],
      [0.89, 0.54],
      [1, 1],
    ],
    interiorPaint: true,
  },
  "antique-kutani-red": {
    height: 0.46,
    foot: 0.085,
    footRadius: 0.47,
    body: "#e7d8b8",
    rim: "#c0a271",
    sides: 32,
    profile: [
      [0.46, 0],
      [0.62, 0.11],
      [0.88, 0.52],
      [1, 1],
    ],
    interiorPaint: true,
  },
  "antique-celadon": {
    height: 0.405,
    foot: 0.167,
    feet: 3,
    maskFeet: true,
    body: "#a5c3b7",
    rim: "#c3d4c5",
    shape: "scallop",
    sides: 40,
    profile: [
      [0.64, 0],
      [0.85, 0.19],
      [0.98, 0.8],
      [1, 1],
    ],
    interiorPaint: true,
  },
  "antique-oribe-jar": {
    height: 1.926,
    body: "#d4c8ad",
    rim: "#766653",
    shape: "irregular",
    sides: 16,
    profile: [
      [0.625, 0],
      [0.78, 0.06],
      [0.94, 0.23],
      [0.985, 0.32],
      [0.972, 0.325],
      [0.986, 0.33],
      [0.995, 0.355],
      [0.982, 0.36],
      [0.998, 0.365],
      [1, 0.43],
      [0.986, 0.435],
      [0.998, 0.44],
      [0.964, 0.51],
      [0.949, 0.515],
      [0.96, 0.52],
      [0.93, 0.54],
      [0.915, 0.545],
      [0.925, 0.55],
      [0.71, 0.69],
      [0.36, 0.76],
      [0.28, 0.82],
      [0.34, 0.92],
      [0.449, 1],
    ],
    interiorPaint: true,
  },
});

// Pixel marks run around the exterior. The top two and last four rows stay
// unpainted so the inner wall and rolled lip have their own quiet glaze.
export function vesselPainting(id) {
  if (id.startsWith("antique-")) return antiquePainting(id);
  const commands = [[0, 0, 64, 64, 6]],
    add = (x, y, w, h, ink) =>
      commands.push([x, y, w, h, ink < 5 ? ink * 2 : ink + 4]);
  const addTone = (x, y, tone, phase) =>
    commands.push([x, y, 1, 1, Math.round(Math.max(0, Math.min(8, tone * 2)))]);
  const ramp = [...PIGMENT_RAMP, "#3d617c", "#7a958c", "#aa5f45", "#527254"];
  // Uneven firing and glaze pooling follow curved fields, each described by
  // individual dots. No mirrored stamps, evenly spaced blemishes or long bars.
  const seed =
    [...id].reduce((n, c) => Math.imul(n, 31) + c.charCodeAt(0), 17) | 0;
  const unglazed = [
    "terra",
    "deep",
    "shallow",
    "tokoname",
    "bizen",
    "echizen",
    "shigaraki",
  ].includes(id);
  for (let y = 3; y < 60; y++)
    for (let x = 0; x < 64; x++) {
      let tone = 3;
      const cloud = (cx, cy, rx, ry) =>
        Math.exp(-((x - cx) ** 2 / (rx * rx) + (y - cy) ** 2 / (ry * ry)));
      if (unglazed) {
        tone -=
          0.63 * cloud(9 + (seed % 7), 37, 15, 12) +
          0.37 * cloud(44, 23, 9, 17);
        tone += 0.48 * cloud(32, 46, 11, 8) + 0.22 * cloud(53, 14, 7, 5);
        // Sparse interrupted wheel marks: subtle shifts, never repeated rectangles.
        tone -=
          0.12 * Math.max(0, Math.sin(y * 0.41 + Math.sin(x * 0.13) * 0.8));
        if (pointThreshold(Math.floor(x / 2), Math.floor(y / 2), seed + 7) < 0.017) tone -= 0.8;
      } else {
        tone -= 0.24 * cloud(13, 46, 11, 8);
        tone += 0.27 * cloud(42, 22, 12, 14);
        if (y > 48) tone -= 0.12;
      }
      if (y > 55) tone -= 0.35;
      addTone(x, y, tone, seed);
    }
  const path = (pts, ink, width = 1) => {
    for (let j = 1; j < pts.length; j++) {
      const [x, y] = pts[j - 1],
        [xx, yy] = pts[j],
        n = Math.max(Math.abs(xx - x), Math.abs(yy - y));
      for (let k = 0; k <= n; k++)
        add(
          Math.round(x + ((xx - x) * k) / Math.max(1, n)),
          Math.round(y + ((yy - y) * k) / Math.max(1, n)),
          width,
          width,
          ink,
        );
    }
  };
  const sprig = (x, y, ink) => {
    path(
      [
        [x, y + 19],
        [x + 2, y + 10],
        [x, y],
      ],
      ink,
    );
    for (let j = 0; j < 3; j++) {
      path(
        [
          [x + 1, y + 5 + j * 5],
          [x - 4, y + 2 + j * 5],
        ],
        ink,
      );
      path(
        [
          [x + 1, y + 9 + j * 4],
          [x + 6, y + 5 + j * 4],
        ],
        ink,
      );
    }
  };
  if (["seto", "tobe"].includes(id)) {
    for (let x = 1; x < 64; x += 16) {
      path(
        [
          [x + 1, 43],
          [x + 4, 37],
          [x + 3, 27],
          [x + 9, 22],
          [x + 14, 27],
          [x + 12, 32],
          [x + 8, 30],
        ],
        5,
        2,
      );
      for (const [dx, yy] of [
        [3, 31],
        [10, 37],
        [2, 45],
      ]) {
        path(
          [
            [x + dx, yy],
            [x + dx + 4, yy - 3],
            [x + dx + 6, yy],
            [x + dx + 3, yy + 2],
            [x + dx, yy],
          ],
          5,
        );
      }
    }
    add(0, 11, 64, 2, 5);
    add(0, 49, 64, 2, 5);
  } else if (id === "kutani") {
    for (let x = 0; x < 64; x += 16) {
      sprig(x + 8, 22, 8);
      add(x + 2, 36, 4, 3, 7);
      add(x + 2, 35, 4, 1, 5);
      add(x + 11, 31, 3, 3, 7);
      add(x + 10, 30, 5, 1, 5);
    }
    add(0, 13, 64, 1, 7);
    add(0, 47, 64, 1, 7);
  } else if (id === "imari") {
    for (let x = 0; x < 64; x += 16) {
      add(x + 1, 15, 2, 31, 5);
      add(x + 13, 15, 2, 31, 5);
      sprig(x + 7, 22, (x / 16) % 2 ? 7 : 5);
      path(
        [
          [x + 3, 17],
          [x + 8, 21],
          [x + 12, 17],
        ],
        7,
      );
    }
    add(0, 12, 64, 2, 5);
    add(0, 48, 64, 2, 5);
  } else if (id === "hasami") {
    for (let x = 1; x < 64; x += 4) {
      add(x, 14, 1, 35, 5);
      add(x + 1, 16, 1, 30, 6);
    }
    add(0, 11, 64, 1, 5);
  } else if (id === "karatsu") {
    ramp[9] = "#675444";
    for (let x = 4; x < 64; x += 21) {
      path(
        [
          [x, 45],
          [x + 6, 22],
          [x + 8, 18],
        ],
        5,
      );
      path(
        [
          [x + 2, 40],
          [x - 2, 29],
        ],
        5,
      );
      path(
        [
          [x + 3, 38],
          [x + 13, 29],
        ],
        5,
      );
      add(x + 6, 20, 3, 1, 5);
    }
  } else if (id === "koishiwara") {
    ramp[9] = "#725f4b";
    for (let y = 16; y < 50; y += 6)
      for (let x = 1; x < 64; x += 5)
        path(
          [
            [x, y + 2],
            [x + 2, y],
          ],
          5,
        );
  } else if (id === "mino") {
    ramp[12] = "#284f42";
    add(0, 9, 31, 38, 8);
    for (let x = 2; x < 29; x += 5) add(x, 43, 3, (x % 4) + 4, 8);
    for (let x = 34; x < 64; x += 15) {
      path(
        [
          [x, 20],
          [x + 9, 25],
          [x, 30],
          [x + 9, 35],
          [x, 40],
        ],
        5,
        2,
      );
    }
  } else if (["bizen", "echizen"].includes(id)) {
    for (let x = 3; x < 64; x += 17) {
      path(
        [
          [x, 13],
          [x + 6, 26],
          [x + 5, 40],
          [x + 9, 49],
        ],
        7,
        3,
      );
      path(
        [
          [x + 3, 18],
          [x + 6, 28],
          [x + 8, 45],
        ],
        4,
      );
    }
    if (id === "echizen") for (let y = 15; y < 45; y += 9) add(0, y, 64, 1, 2);
  } else if (["kasama", "ontayaki", "iga", "hagi", "mashiko"].includes(id)) {
    if (id === "hagi") {
      ramp[10] = "#afc2c2";
      ramp[11] = "#b0a2a9";
    }
    for (let y = 9; y < 48; y++)
      for (let x = 0; x < 64; x++) {
        const depth =
          17 +
          12 * Math.exp(-((x - 11) ** 2) / 38) +
          7 * Math.exp(-((x - 47) ** 2) / 81) +
          3 * Math.sin(x * 0.27 + 1.8);
        if (
          y < depth &&
          pointThreshold(x, y, seed + 11) < Math.min(1, (depth - y) * 0.28)
        )
          add(x, y, 1, 1, id === "mashiko" ? 4 : 6);
        else if (
          id === "hagi" &&
          Math.exp(-((x - 36) ** 2) / 61 - (y - 32) ** 2 / 40) > 0.24 &&
          pointThreshold(x, y, seed + 23) < 0.42
        )
          add(x, y, 1, 1, 7);
      }
  } else if (id === "kyoto") {
    for (let x = 0; x < 64; x += 6) {
      add(x, 10, 1, 38, 2);
      add(x + 1, 12, 1, 35, 4);
    }
  } else if (id === "arita") {
    for (let x = 0; x < 64; x += 6) {
      add(x, 9, 1, 40, 2);
      add(x + 1, 11, 1, 36, 4);
    }
  } else if (id === "tsuboya") {
    for (let x = 2; x < 64; x += 16) {
      sprig(x + 6, 21, 5);
      path(
        [
          [x + 1, 45],
          [x + 12, 36],
        ],
        8,
        3,
      );
    }
    add(0, 14, 64, 2, 5);
    add(0, 48, 64, 2, 5);
  } else if (id === "shigaraki") {
    for (let y = 12; y < 54; y++)
      for (let x = 0; x < 64; x++)
        if (pointThreshold(x, y, seed) < 0.045)
          add(x, y, 1, 1, pointThreshold(x, y, seed + 1) < 0.22 ? 0 : 2);
  } else if (id === "basket") {
    for (let y = 10; y < 53; y += 4)
      for (let x = 0; x < 64; x += 4) {
        add(x, y, 3, 1, 4);
        add(x + 3, y + 1, 1, 3, 1);
        add(x, y + 3, 3, 1, 2);
      }
  } else if (id === "plastic") {
    add(0, 10, 64, 3, 1);
    for (let x = 1; x < 64; x += 8) {
      add(x, 17, 1, 31, 2);
      add(x + 1, 17, 1, 31, 4);
    }
  }
  // The second field belongs only to the inner wall and floor. Water and
  // residual soil collect asymmetrically; the lip stays brighter where worn.
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      let tone = 2.95;
      const cloud = (cx, cy, rx, ry) =>
        Math.exp(-((x - cx) ** 2 / (rx * rx) + (y - cy) ** 2 / (ry * ry)));
      tone -=
        0.72 * cloud(12 + Math.abs(seed % 9), 19, 13, 15) +
        0.45 * cloud(49, 35, 10, 8);
      tone += 0.27 * cloud(38, 49, 17, 12);
      const waterline =
        22 + Math.sin(x * 0.16 + seed) * 2 + Math.sin(x * 0.41) * 0.8;
      tone -= 0.34 * Math.exp(-((y - waterline) ** 2) / 7);
      if (y < 12) tone -= (0.38 * (12 - y)) / 12;
      const n = pointThreshold(x, y, seed + 137);
      if (y < 31 && n < 0.055) tone -= 0.75;
      if (y > 48 && n > 0.94) tone += 0.35;
      addTone(x, y + 64, tone, seed + 191);
    }
  return { size: 64, width: 64, height: 128, grayCount: 9, ramp, commands };
}

import { PIGMENT_RAMP, pointInk, pointThreshold } from "./face-paintings.mjs";

// Original code paintings, informed by the museum views in antique-vessels.mjs.
// First field: upright exterior, reversed for lathe height. Second: top-down
// interior. The two compositions are never interchangeable or mirrored stamps.
const drawings = new Map();
export function antiquePainting(id) {
  if (drawings.has(id)) return drawings.get(id);
  const ramps = {
    "antique-shino": ["#574336", "#81614a", "#c59871", "#ece2cc"],
    "antique-nezumi": ["#e4d8bd", "#b9aa8f", "#352b26", "#92634b"],
    "antique-shino-square": ["#59483b", "#88705a", "#c49c7b", "#eee5d5"],
    "antique-oribe-jar": ["#504336", "#78654e", "#a28663", "#e3d8bd"],
    "antique-nabeshima": ["#375a6d", "#78918a", "#98745f", "#e9e7d9"],
    "antique-nabeshima-dish": ["#355b86", "#6588ab", "#a3bac7", "#edf0e6"],
    "antique-kutani-red": ["#994a39", "#be7860", "#b39752", "#eee3c9"],
    "antique-celadon": ["#71988a", "#a1beb0", "#ced9c9", "#8a765e"],
  };
  if (!ramps[id]) throw Error("Missing antique painting " + id);
  const ramp = [...PIGMENT_RAMP, ...ramps[id]],
    commands = [],
    seed = [...id].reduce((n, c) => Math.imul(n, 31) + c.charCodeAt(0), 73) | 0;
  let inside = false;
  const dot = (x, y, ink) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x > 63 || y < 0 || y > 63) return;
    commands.push([x, inside ? y + 64 : 63 - y, 1, 1, ink]);
  };
  const path = (p, ink = 9, width = 1) => {
    for (let j = 1; j < p.length; j++) {
      const [x, y] = p[j - 1],
        [xx, yy] = p[j],
        n = Math.max(Math.abs(xx - x), Math.abs(yy - y)) * 2;
      for (let k = 0; k <= n; k++) {
        const px = x + ((xx - x) * k) / Math.max(1, n),
          py = y + ((yy - y) * k) / Math.max(1, n);
        for (let dy = 0; dy < width; dy++)
          for (let dx = 0; dx < width; dx++) dot(px + dx, py + dy, ink);
      }
    }
  };
  const poly = (p, ink) => {
    for (
      let y = Math.floor(Math.min(...p.map((q) => q[1])));
      y <= Math.ceil(Math.max(...p.map((q) => q[1])));
      y++
    )
      for (
        let x = Math.floor(Math.min(...p.map((q) => q[0])));
        x <= Math.ceil(Math.max(...p.map((q) => q[0])));
        x++
      ) {
        let hit = false;
        for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
          const a = p[i],
            b = p[j];
          if (
            a[1] > y !== b[1] > y &&
            x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
          )
            hit = !hit;
        }
        if (hit) dot(x, y, ink);
      }
  };
  const ellipse = (
    cx,
    cy,
    rx,
    ry,
    ink,
    width = 1,
    start = 0,
    end = Math.PI * 2,
  ) => {
    const p = [];
    for (let a = start; a <= end + 0.02; a += 0.045)
      p.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    path(p, ink, width);
  };
  const flower = (cx, cy, r, ink, light = 10, petals = 5) => {
    for (let a = 0; a < petals; a++) {
      const t = (a * 6.283) / petals;
      ellipse(
        cx + Math.cos(t) * r * 0.48,
        cy + Math.sin(t) * r * 0.48,
        r * 0.46,
        r * 0.4,
        ink,
        2,
      );
    }
    ellipse(cx, cy, r * 0.28, r * 0.24, light, 2);
  };
  const leaf = (x, y, xx, yy, width, ink, edge) => {
    const dx = xx - x,
      dy = yy - y,
      l = Math.hypot(dx, dy),
      nx = (-dy / l) * width,
      ny = (dx / l) * width;
    const p = [
      [x, y],
      [x + dx * 0.4 + nx, y + dy * 0.4 + ny],
      [xx, yy],
      [x + dx * 0.6 - nx, y + dy * 0.6 - ny],
    ];
    poly(p, ink);
    if (edge !== undefined)
      path(
        [
          [x, y],
          [xx, yy],
        ],
        edge,
      );
  };
  const branch = (x, y, dx, dy, ink = 9) => {
    path(
      [
        [x, y],
        [x + dx * 0.45, y + dy * 0.6],
        [x + dx, y + dy],
      ],
      ink,
      2,
    );
    for (const [t, s, w] of [
      [0.22, -1, 2],
      [0.42, 1, 2.5],
      [0.63, -1, 3],
      [0.8, 1, 2],
    ]) {
      const xx = x + dx * t,
        yy = y + dy * t;
      leaf(xx, yy, xx + s * 7 + dx * 0.14, yy + dy * 0.22, w, ink, 10);
    }
  };
  const base = () => {
    for (let y = 0; y < 64; y++)
      for (let x = 0; x < 64; x++) {
        const cloud = (cx, cy, rx, ry) =>
          Math.exp(-((x - cx) ** 2 / (rx * rx) + (y - cy) ** 2 / (ry * ry)));
        const clay = /shino|nezumi|oribe/.test(id),
          cell = pointThreshold(x, y, seed + (inside ? 93 : 0));
        let tone =
          6.14 +
          0.33 * cloud(42, 18, 16, 13) -
          0.44 * cloud(13, 43, 14, 10) -
          0.23 * cloud(53, 51, 9, 12);
        if (inside) tone -= 0.25 * cloud(20, 34, 10, 14);
        if (clay) {
          tone += 0.18 * Math.sin(x * 0.3 + y * 0.19);
          if (cell < 0.038) tone -= 1.1;
          if (cell > 0.978) tone += 0.75;
        } else if (cell < 0.018 && cloud(11, 46, 11, 8) > 0.3) tone -= 0.8;
        dot(x, y, pointInk(tone, x, y, seed + (inside ? 51 : 0), 8));
      }
  };
  base();
  if (id === "antique-shino") {
    // The published view documents the reeds inside, not an all-around sprig.
    for (const p of [
      [
        [9, 13],
        [13, 20],
        [15, 31],
      ],
      [
        [40, 32],
        [44, 37],
        [43, 47],
      ],
      [
        [53, 7],
        [55, 12],
        [60, 16],
      ],
    ])
      path(p, 10);
    for (let j = 0; j < 18; j++) {
      const x = 4 + j * 3;
      if (pointThreshold(x, 57, seed) < 0.65) dot(x, 55, 11);
    }
  } else if (id === "antique-nezumi") {
    branch(9, 49, -4, -24);
    branch(29, 45, 8, -19);
    path(
      [
        [42, 38],
        [44, 21],
        [51, 17],
        [55, 22],
        [51, 31],
        [43, 36],
      ],
      9,
      2,
    );
    path(
      [
        [56, 48],
        [59, 36],
        [62, 28],
      ],
      9,
      2,
    );
    ellipse(19, 25, 4, 7, 9, 2, 2, 5.4);
  } else if (id === "antique-shino-square") {
    // Four different drawings: woven basket, hanging jewels, violets, iris.
    for (let y = 18; y < 53; y += 10)
      for (let x = 0; x < 15; x += 7) {
        path(
          [
            [x, y],
            [x + 7, y + 10],
            [x + 14, y],
          ],
          9,
        );
        path(
          [
            [x, y + 10],
            [x + 7, y],
            [x + 14, y + 10],
          ],
          10,
        );
      }
    path(
      [
        [17, 12],
        [30, 12],
      ],
      9,
      2,
    );
    for (const [x, b] of [
      [19, 47],
      [24, 40],
      [29, 52],
    ]) {
      path(
        [
          [x, 14],
          [x - 1, 26],
          [x, b],
        ],
        9,
      );
      for (let y = 20; y < b; y += 8) ellipse(x, y, 1.5, 2, 10);
    }
    path(
      [
        [37, 53],
        [38, 40],
        [36, 32],
        [39, 19],
      ],
      9,
      2,
    );
    leaf(38, 41, 33, 32, 2, 9);
    leaf(38, 43, 44, 35, 2, 10);
    flower(39, 22, 3, 9, 10);
    path(
      [
        [53, 52],
        [54, 36],
        [57, 20],
      ],
      9,
      2,
    );
    leaf(54, 46, 49, 28, 2, 9);
    leaf(54, 43, 61, 29, 2, 10);
    path(
      [
        [52, 22],
        [57, 18],
        [61, 23],
        [57, 25],
        [55, 21],
      ],
      9,
      2,
    );
  } else if (id === "antique-oribe-jar") {
    ellipse(9, 26, 6, 9, 9, 2);
    ellipse(19, 26, 6, 9, 10, 2);
    path(
      [
        [4, 33],
        [17, 37],
        [25, 29],
      ],
      9,
      2,
    );
    for (const [x, y, h] of [
      [36, 49, 17],
      [52, 53, 22],
    ]) {
      path(
        [
          [x, y],
          [x + 1, y - h],
        ],
        9,
        2,
      );
      for (const [t, w] of [
        [0.25, 6],
        [0.55, 5],
        [0.85, 3],
      ])
        path(
          [
            [x - w, y - h * t],
            [x, y - h * t - 3],
            [x + w, y - h * t + 1],
          ],
          9,
          2,
        );
    }
  } else if (id === "antique-nabeshima") {
    // One radish group crosses adjacent facets; it is not eight flower stamps.
    poly(
      [
        [18, 29],
        [22, 32],
        [25, 40],
        [24, 47],
        [20, 48],
        [17, 43],
        [16, 35],
      ],
      12,
    );
    path(
      [
        [18, 29],
        [16, 35],
        [17, 43],
        [20, 48],
        [24, 47],
        [25, 40],
        [22, 32],
      ],
      9,
    );
    path(
      [
        [20, 47],
        [18, 55],
        [22, 59],
      ],
      9,
    );
    for (const p of [
      [
        [19, 30],
        [11, 22],
        [5, 20],
      ],
      [
        [19, 30],
        [18, 19],
        [13, 12],
      ],
      [
        [20, 29],
        [27, 19],
        [31, 13],
      ],
      [
        [20, 31],
        [31, 27],
        [38, 30],
      ],
    ]) {
      path(p, 9, 2);
      for (let j = 1; j < p.length; j++) leaf(...p[j - 1], ...p[j], 3, 10, 9);
    }
    flower(29, 19, 4, 11, 9);
    path(
      [
        [46, 41],
        [49, 39],
        [51, 42],
      ],
      9,
    );
    dot(49, 38, 9);
  } else if (id === "antique-nabeshima-dish") {
    // Three exterior flower branches seen in the museum's underside photograph.
    for (const [x, y, dx, dy] of [
      [8, 45, 4, -23],
      [30, 49, -4, -25],
      [50, 44, 6, -20],
    ]) {
      branch(x, y, dx, dy);
      flower(x + dx, y + dy + 4, 4, 9, 10);
    }
  } else if (id === "antique-kutani-red") {
    // Exterior is a quiet adaptation: the published photo is of the interior.
    for (const [x, y, dx, dy] of [
      [8, 50, 8, -29],
      [34, 46, -6, -25],
      [52, 52, 7, -27],
    ]) {
      branch(x, y, dx, dy, 9);
      flower(x + dx, y + dy, 4, 9, 11);
    }
    path(
      [
        [0, 9],
        [63, 9],
      ],
      11,
    );
    path(
      [
        [0, 54],
        [63, 54],
      ],
      9,
    );
  } else if (id === "antique-celadon") {
    // No ink huts on the outside: the landscape is a subtle interior incision.
    for (const [x, y] of [
      [13, 22],
      [38, 39],
      [51, 17],
    ])
      path(
        [
          [x, y],
          [x + 1, y + 4],
          [x + 3, y + 6],
        ],
        10,
      );
  }
  inside = true;
  base();
  if (id === "antique-shino") {
    for (const p of [
      [
        [29, 54],
        [26, 35],
        [19, 13],
      ],
      [
        [30, 54],
        [31, 35],
        [37, 12],
      ],
      [
        [29, 53],
        [22, 37],
        [11, 26],
      ],
      [
        [30, 53],
        [36, 35],
        [49, 23],
      ],
      [
        [29, 53],
        [19, 46],
        [8, 44],
      ],
    ])
      path(p, 9, 2);
    for (const p of [
      [
        [27, 45],
        [17, 39],
        [12, 33],
      ],
      [
        [30, 42],
        [41, 39],
        [49, 31],
      ],
      [
        [27, 36],
        [21, 29],
        [14, 24],
      ],
    ])
      path(p, 10, 2);
    for (const [x, y] of [
      [19, 12],
      [37, 11],
      [49, 22],
    ])
      for (let j = 0; j < 5; j++)
        leaf(x, y + j * 2, x + 5 + (j % 2), y + j * 2 + 2, 1, 9);
    ellipse(31, 31, 28, 28, 10);
    for (let a = 0; a < 6.28; a += 0.27) {
      const x = 31 + 25 * Math.cos(a),
        y = 31 + 25 * Math.sin(a);
      path(
        [
          [x, y],
          [x + 1, y + 2],
        ],
        9,
        2,
      );
    }
  } else if (id === "antique-nezumi") {
    // Circular well with four distinct scratched decorations on the broad lip.
    ellipse(31, 32, 17, 17, 10);
    branch(26, 43, 12, -20, 9);
    branch(11, 29, -2, -16, 9);
    path(
      [
        [22, 8],
        [29, 5],
        [35, 9],
        [40, 6],
      ],
      9,
      2,
    );
    path(
      [
        [49, 19],
        [55, 24],
        [51, 30],
        [56, 35],
      ],
      9,
      2,
    );
    leaf(27, 57, 39, 52, 3, 9);
    leaf(34, 52, 44, 58, 2, 9);
  } else if (id === "antique-shino-square") {
    ellipse(31, 31, 15, 15, 10, 1, 0.6, 4.7);
    path(
      [
        [16, 43],
        [20, 41],
        [24, 42],
      ],
      10,
    );
    for (const [x, y] of [
      [8, 21],
      [47, 51],
      [40, 15],
      [23, 56],
    ]) {
      dot(x, y, 11);
      dot(x + 1, y + 1, 10);
    }
  } else if (id === "antique-nabeshima-dish") {
    // Negative white designs against cobalt: lotus, lattice, triangles, circles,
    // waves and folded-rim meanders belong to separate concentric bands.
    for (let y = 0; y < 64; y++)
      for (let x = 0; x < 64; x++) {
        const dx = x - 31.5,
          dy = y - 31.5,
          r = Math.hypot(dx, dy),
          a = Math.atan2(dy, dx) + Math.PI;
        if (r > 6 && r < 14) dot(x, y, 9);
        if (r > 16 && r < 20) dot(x, y, 10);
        if (r > 22 && r < 27) dot(x, y, 10);
        if (
          Math.abs(r - 7) < 0.8 ||
          Math.abs(r - 14) < 0.7 ||
          Math.abs(r - 16) < 0.6 ||
          Math.abs(r - 20) < 0.7 ||
          Math.abs(r - 27) < 0.7 ||
          Math.abs(r - 30) < 0.6
        )
          dot(x, y, 9);
        if (r > 7 && r < 14 && Math.abs(Math.sin(a * 8)) < 0.24) dot(x, y, 12);
        if (
          r > 16 &&
          r < 20 &&
          Math.abs(Math.sin(a * 12 + (r - 16) * 1.5)) < 0.33
        )
          dot(x, y, 12);
        if (
          r > 22 &&
          r < 27 &&
          Math.abs(Math.sin(a * 14 + Math.sin(r) * 0.5)) < 0.12
        )
          dot(x, y, 12);
        if (r > 28 && r < 31 && Math.abs(Math.sin(a * 24)) < 0.33) dot(x, y, 9);
      }
    flower(31.5, 31.5, 5, 9, 10, 7);
    for (let a = 0; a < 6.28; a += 6.28 / 20)
      ellipse(31.5 + 21 * Math.cos(a), 31.5 + 21 * Math.sin(a), 1, 1, 9);
  } else if (id === "antique-kutani-red") {
    for (const [r, ink, w] of [
      [11, 9, 1],
      [14, 11, 1],
      [17, 9, 2],
      [25, 9, 1],
      [30, 11, 2],
    ])
      ellipse(31, 31, r, r, ink, w);
    // Lion silhouette and curling mane occupy the central medallion.
    poly(
      [
        [25, 26],
        [31, 24],
        [36, 29],
        [36, 34],
        [31, 39],
        [26, 36],
        [23, 31],
      ],
      10,
    );
    path(
      [
        [25, 26],
        [21, 27],
        [20, 32],
        [25, 34],
        [27, 38],
        [32, 39],
        [36, 34],
        [37, 29],
      ],
      9,
      2,
    );
    ellipse(30, 26, 5, 4, 9);
    ellipse(34, 35, 4, 4, 9);
    path(
      [
        [22, 29],
        [20, 25],
        [25, 21],
        [30, 23],
      ],
      9,
      2,
    );
    path(
      [
        [33, 27],
        [38, 23],
        [40, 27],
        [38, 31],
      ],
      9,
      2,
    );
    for (const p of [
      [
        [26, 36],
        [22, 40],
        [18, 39],
      ],
      [
        [32, 38],
        [35, 42],
        [39, 40],
      ],
    ])
      path(p, 9, 2);
    dot(24, 28, 9);
    for (let j = 0; j < 9; j++) {
      const a = (j * 6.283) / 9 + 0.12,
        cx = 31 + 21 * Math.cos(a),
        cy = 31 + 21 * Math.sin(a);
      flower(cx, cy, 3, j % 3 ? 9 : 11, 10);
      leaf(
        cx,
        cy,
        cx + Math.cos(a + 0.8) * 5,
        cy + Math.sin(a + 0.8) * 5,
        2,
        10,
        9,
      );
    }
    for (let j = 0; j < 8; j++) {
      const a = (j * 6.283) / 8 + 0.3,
        cx = 31 + 28 * Math.cos(a),
        cy = 31 + 28 * Math.sin(a);
      ellipse(cx, cy, 2.5, 3, 9);
      path(
        [
          [cx - 2, cy],
          [cx + 2, cy],
        ],
        10,
      );
    }
  } else if (id === "antique-celadon") {
    // Incised pavilion, brushwood fence and tree, all in neighbouring glaze hues.
    path(
      [
        [23, 37],
        [33, 29],
        [44, 38],
        [23, 37],
        [24, 47],
        [42, 47],
        [43, 38],
      ],
      9,
    );
    path(
      [
        [27, 38],
        [27, 46],
        [33, 46],
        [33, 37],
      ],
      10,
    );
    path(
      [
        [37, 38],
        [37, 46],
      ],
      9,
    );
    path(
      [
        [8, 45],
        [21, 43],
        [21, 51],
        [8, 53],
      ],
      9,
    );
    for (const [x, y] of [
      [10, 44],
      [14, 44],
      [18, 43],
    ])
      path(
        [
          [x, y],
          [x + 1, y + 8],
        ],
        9,
      );
    path(
      [
        [48, 45],
        [47, 31],
        [51, 20],
      ],
      9,
    );
    for (const p of [
      [
        [47, 33],
        [43, 27],
        [42, 22],
      ],
      [
        [49, 28],
        [56, 24],
        [57, 19],
      ],
      [
        [48, 37],
        [56, 34],
        [59, 29],
      ],
    ])
      path(p, 9);
  } else if (id === "antique-oribe-jar") {
    // Dark narrow throat; the shoulder drawing stays exclusively outside.
    for (let y = 0; y < 64; y++)
      for (let x = 0; x < 64; x++) {
        const r = Math.hypot(x - 31, y - 31);
        if (r < 24) dot(x, y, pointInk(3.1 + r * 0.04, x, y, seed, 8));
      }
  }
  // Keep thin painted strokes present at the game's shared physical texel size.
  // Consolidate the interior composition onto 16 square cells across a mouth;
  // one deliberate mark wins only when it occupies part of that cell. No imported
  // raster, stretched strips or random sampling that breaks a grass stem apart.
  const innerPixels = new Uint8Array(64 * 64),
    outer = [];
  for (const c of commands) {
    if (c[1] < 64) outer.push(c);
    else innerPixels[(c[1] - 64) * 64 + c[0]] = c[4];
  }
  for (let by = 0; by < 64; by += 4)
    for (let bx = 0; bx < 64; bx += 4) {
      const counts = new Map();
      let tone = 0;
      for (let y = by; y < by + 4; y++)
        for (let x = bx; x < bx + 4; x++) {
          const ink = innerPixels[y * 64 + x];
          if (ink >= 9) counts.set(ink, (counts.get(ink) || 0) + 1);
          else tone += ink;
        }
      const accent = [...counts].sort((a, b) => b[1] - a[1])[0],
        total = [...counts.values()].reduce((a, b) => a + b, 0);
      const ink =
        accent && total >= 3
          ? accent[0]
          : Math.round(tone / Math.max(1, 16 - total));
      for (let y = by; y < by + 4; y++)
        for (let x = bx; x < bx + 4; x++) outer.push([x, y + 64, 1, 1, ink]);
    }
  commands.splice(0, commands.length, ...outer);
  const drawing = {
    size: 64,
    width: 64,
    height: 128,
    grayCount: 9,
    ramp,
    commands,
    interiorProjection: "planar",
    museumPainting: true,
  };
  drawings.set(id, drawing);
  return drawing;
}

export const VESSEL_SHAPES = new Set(
  "oval bowl jar flare cylinder square mokko scallop footed cup pedestal rolled faceted irregular round shallow box bag deep basket".split(
    " ",
  ),
);

// Layered polygonal rings produce stepped silhouettes, open mouths and actual wall thickness.
export function buildVessel(
  api,
  g,
  p,
  r = 0.46,
  height = 0.38,
  { empty = false } = {},
) {
  const { box, shade, beam } = api,
    s = p.shape;
  if (!VESSEL_SHAPES.has(s)) throw Error("未定义花盆器形：" + s);
  const h =
    height *
    (/oval|shallow|mokko/.test(s) ? 0.6 : /deep|jar|bag/.test(s) ? 1.45 : 1);
  const color = p.color,
    rim = p.rim,
    ink = p.ink || shade(color, 0.68),
    foot = /footed|pedestal|square|oval|mokko|scallop/.test(s);
  const by = foot ? h * 0.12 : 0;
  const rad = (t, a) => {
    let rr =
      r *
      (s === "cylinder"
        ? 0.94
        : s === "jar"
          ? 0.66 + 0.35 * Math.sin(Math.PI * t)
          : s === "bowl"
            ? 0.6 + 0.4 * Math.sin((t * Math.PI) / 2)
            : s === "deep"
              ? 0.69 + 0.28 * t
              : 0.68 + 0.32 * t);
    if (/scallop|pedestal/.test(s)) rr *= 1 + 0.07 * Math.cos(a * 10) * t ** 5;
    if (s === "mokko") rr *= 1 + 0.14 * Math.cos(a * 4);
    if (s === "irregular") rr *= 1 + 0.07 * Math.sin(a * 3 + 1.4);
    return rr;
  };
  if (api.profile && !/box|square|bag/.test(s)) {
    const top = by + h,
      sides = s === "faceted" ? 8 : /scallop|mokko/.test(s) ? 16 : 12;
    const shape = /oval|mokko|scallop|irregular/.test(s) ? s : "round";
    const rr = (t) => rad(t, 0),
      thick = 0.055;
    // A single closed pottery shell includes the inner wall, bottom and real drain hole.
    api.profile(
      g,
      [
        [rr(0), by + 0.025],
        [rr(0.25), by + h * 0.25],
        [rr(0.65), by + h * 0.65],
        [rr(1), top - 0.025],
        [rr(1) - thick, top - 0.025],
        [rr(0.65) - thick, by + h * 0.65],
        [rr(0) - thick, by + 0.09],
        [0.055, by + 0.09],
        [0.055, by + 0.025],
        [rr(0), by + 0.025],
      ],
      sides,
      color,
      p.pattern === "plain" ? "clay" : "pot-" + p.pattern,
      shape,
    );
    api.profile(
      g,
      [
        [rr(1) - 0.065, top - 0.035],
        [rr(1) + 0.035, top - 0.035],
        [rr(1) + 0.035, top + 0.035],
        [rr(1) - 0.065, top + 0.035],
        [rr(1) - 0.065, top - 0.035],
      ],
      sides,
      rim,
      "clay",
      shape,
    );
    if (foot) {
      if (/oval|mokko|scallop/.test(s)) {
        for (const x of [-r * 0.43, r * 0.43])
          for (const z of [-r * 0.32, r * 0.32])
            box(
              g,
              x,
              by * 0.42,
              z,
              0.16,
              Math.max(0.06, by * 0.84),
              0.14,
              ink,
              "clay",
            );
      } else
        api.profile(
          g,
          [
            [r * 0.48, 0],
            [r * 0.57, 0.02],
            [r * 0.55, by + 0.02],
            [r * 0.45, by + 0.02],
            [r * 0.45, 0],
            [r * 0.48, 0],
          ],
          sides,
          ink,
          "clay",
          shape,
        );
    }
    if (!empty)
      api.profile(
        g,
        [
          [0.001, top - 0.06],
          [rr(1) - 0.065, top - 0.06],
          [rr(1) - 0.065, top - 0.04],
          [0.001, top - 0.04],
          [0.001, top - 0.06],
        ],
        sides,
        "#57432c",
        "soil",
        shape,
      );
    if (s === "basket")
      for (const a of [0, 2.094, 4.189])
        beam(
          g,
          [Math.cos(a) * r, top, Math.sin(a) * r],
          [0, top + r * 1.45, 0],
          0.027,
          "#637268",
        );
    return top;
  }
  if (/box|square|bag/.test(s)) {
    const w = r * (p.id === "trough" ? 3.1 : 1.95),
      d = r * (p.id === "trough" ? 1.32 : 1.55),
      thick = s === "bag" ? 0.045 : 0.065;
    box(g, 0, by + 0.03, 0, w, 0.065, d, color, "clay");
    for (const x of [-w / 2, w / 2])
      box(
        g,
        x,
        h * 0.5 + by,
        0,
        thick,
        h,
        d,
        color,
        s === "bag" ? "cloth" : "clay",
      );
    for (const z of [-d / 2, d / 2])
      box(
        g,
        0,
        h * 0.5 + by,
        z,
        w,
        h,
        thick,
        color,
        s === "bag" ? "cloth" : "clay",
      );
    for (const x of [-w / 2, w / 2])
      box(g, x, h + by, 0, 0.08, 0.075, d + 0.08, rim);
    for (const z of [-d / 2, d / 2])
      box(g, 0, h + by, z, w + 0.08, 0.075, 0.08, rim);
    if (s === "bag")
      for (const x of [-w * 0.5, w * 0.5]) {
        beam(g, [x, h * 0.6, -d * 0.15], [x, h * 1.2, -d * 0.15], 0.035, rim);
        beam(g, [x, h * 1.2, -d * 0.15], [x, h * 1.2, d * 0.15], 0.035, rim);
        beam(g, [x, h * 1.2, d * 0.15], [x, h * 0.6, d * 0.15], 0.035, rim);
        for (let j = 0; j < 5; j++)
          box(
            g,
            x,
            h * (0.15 + j * 0.15),
            0,
            0.025,
            0.02,
            d * 0.85,
            shade(color, 0.88),
          );
      }
    if (!empty)
      box(g, 0, h + by - 0.04, 0, w - 0.12, 0.035, d - 0.12, "#5f5140", "soil");
    if (foot)
      for (const x of [-w * 0.35, w * 0.35])
        for (const z of [-d * 0.3, d * 0.3])
          box(g, x, 0.035, z, 0.15, 0.075, 0.13, ink);
  } else {
    const n = s === "faceted" ? 12 : 32,
      layers = Math.max(4, Math.ceil(h / 0.06));
    for (let j = 0; j < layers; j++) {
      const t = (j + 0.5) / layers,
        y = by + t * h;
      for (let k = 0; k < n; k++) {
        const a = (k * Math.PI * 2) / n,
          rr = rad(t, a),
          oval = s === "oval" ? 0.7 : 1;
        const col =
          j === layers - 1 ? rim : k % 6 === 0 ? shade(color, 0.88) : color;
        box(
          g,
          Math.cos(a) * rr,
          y,
          Math.sin(a) * rr * oval,
          ((2 * Math.PI * rr) / n) * 1.1,
          h / layers + 0.01,
          0.075,
          col,
          "clay",
          0,
          -a - Math.PI / 2,
        );
        const pattern = p.pattern;
        if (pattern !== "plain" && j > 0 && j < layers - 1) {
          const on =
            pattern === "stripe"
              ? k % 4 === 0
              : pattern === "dash"
                ? j % 2 === 0 && k % 3 === 0
                : /blue|scroll|grass|flower/.test(pattern)
                  ? (k + j * 2) % 9 < 2
                  : pattern === "imari"
                    ? k % 8 < 2
                    : pattern === "oribe"
                      ? k < n * 0.45
                      : pattern === "crackle"
                        ? (k * 7 + j * 13) % 19 === 0
                        : pattern === "fire"
                          ? (k + j) % 7 < 2
                          : (k * 5 + j * 3) % 13 < 2;
          if (on)
            box(
              g,
              Math.cos(a) * (rr + 0.023),
              y,
              Math.sin(a) * (rr + 0.023) * oval,
              0.04,
              0.04,
              0.04,
              /blue|scroll|stripe/.test(pattern)
                ? "#577687"
                : pattern === "imari" && k % 2
                  ? "#ac7256"
                  : ink,
            );
        }
      }
    }
    const oval = s === "oval" ? 0.7 : 1,
      top = h + by;
    if (foot)
      for (let k = 0; k < 12; k++) {
        const a = (k * Math.PI) / 6;
        box(
          g,
          Math.cos(a) * r * 0.53,
          0.04,
          Math.sin(a) * r * 0.53 * oval,
          0.3,
          0.085,
          0.08,
          ink,
          "plain",
          0,
          -a - Math.PI / 2,
        );
      }
    for (let x = -r * 0.64; x <= r * 0.64; x += 0.065)
      for (let z = -r * 0.64 * oval; z <= r * 0.64 * oval; z += 0.065)
        if ((x / r) ** 2 + (z / r / oval) ** 2 < 0.4 && Math.hypot(x, z) > 0.05)
          box(g, x, by + 0.03, z, 0.07, 0.04, 0.07, ink);
    if (!empty)
      for (let x = -r * 0.88; x <= r * 0.88; x += 0.08)
        for (let z = -r * 0.88 * oval; z <= r * 0.88 * oval; z += 0.08)
          if ((x / r) ** 2 + (z / r / oval) ** 2 < 0.72)
            box(
              g,
              x,
              top - 0.03,
              z,
              0.085,
              0.035,
              0.085,
              Math.round(x * 20 + z * 30) % 4 === 0 ? "#79664b" : "#5f5140",
            );
    if (s === "basket")
      for (const a of [0, 2.094, 4.189])
        beam(
          g,
          [Math.cos(a) * r, top, Math.sin(a) * r],
          [0, top + r * 1.45, 0],
          0.027,
          "#7b8374",
        );
    if (s === "rolled")
      for (let k = 0; k < n; k++) {
        const a = (k * 6.283) / n;
        box(g, Math.cos(a) * r, top, Math.sin(a) * r, 0.11, 0.075, 0.11, rim);
      }
  }
  return h + by;
}

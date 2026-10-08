import { VESSEL_ART } from "./vessel-art.mjs";
export const VESSEL_SHAPES = new Set(
  "oval bowl jar flare cylinder square mokko scallop footed cup pedestal rolled faceted irregular round shallow box bag deep basket".split(
    " ",
  ),
);
export function vesselDimensions(p, r = 0.46, height = 0.38) {
  const art = VESSEL_ART[p.id];
  r *= art?.radiusScale || 1;
  return art
    ? { r, h: r * art.height, foot: r * (art.foot || 0), art }
    : { r, h: height * (p.shape === "bag" ? 1.3 : 1), foot: 0, art: null };
}
// The clear interior is shared by placement and the hollow vessel construction.
export function vesselInterior(p, r = 0.46, height = 0.38) {
  const dimensions = vesselDimensions(p, r, height),
    { h, foot, art } = dimensions;
  r = dimensions.r;
  const floor = art ? foot + Math.min(0.055, h * 0.25) : 0.08;
  if (/box|bag/.test(p.shape))
    return {
      y: floor,
      w: r * (p.id === "trough" ? 3.1 : 1.95) - 0.18,
      d: r * (p.id === "trough" ? 1.32 : 1.55) - 0.18,
      rim: h,
      shape: "rect",
    };
  const thick = r * (art?.rolled ? 0.095 : p.id === "plastic" ? 0.045 : 0.065);
  const radius =
    (r *
      (art
        ? Math.min(...(art.innerProfile || art.profile).map((q) => q[0]))
        : 0.65) -
      thick) *
    (art?.shape === "rounded-square" && !art.innerRound ? 0.95 : 1);
  return {
    y: floor,
    w: radius * 2,
    d: radius * 2 * (art?.shape === "oval" ? 0.76 : 1),
    rim: h + foot,
    shape:
      !art?.innerRound && ["square", "rounded-square"].includes(art?.shape)
        ? "rect"
        : "ellipse",
  };
}
export function buildVessel(
  api,
  g,
  p,
  r = 0.46,
  height = 0.38,
  { empty = false } = {},
) {
  if (!VESSEL_SHAPES.has(p.shape)) throw Error("未定义花盆器形：" + p.shape);
  const { box, beam, shade } = api,
    dimensions = vesselDimensions(p, r, height),
    { h, foot, art } = dimensions;
  const inputRadius = r;
  r = dimensions.r;
  const color = art?.body || p.color,
    rim = art?.rim || p.rim,
    top = foot + h;
  const kind = art ? "vessel-" + p.id : p.shape === "bag" ? "cloth" : "enamel";
  if (art && api.profile) {
    const points = art.profile.map(([rr, y]) => [
      r * rr,
      foot + y * h,
      0.16 + y * 0.72,
    ]);
    const last = art.profile.at(-1)[0] * r,
      thick = r * (art.rolled ? 0.095 : p.id === "plastic" ? 0.045 : 0.065),
      floor = vesselInterior(p, inputRadius, height).y;
    // Values below .145 tag the independently painted interior, including the floor.
    const innerUV = (y) => 0.015 + y * 0.12;
    points.push([last - thick, top, innerUV(1)]);
    const inner = art.innerProfile || art.profile;
    for (let j = inner.length - 2; j > 0; j--) {
      const [rr, y, roundness] = inner[j];
      points.push([
        Math.max(0.08, rr * r - thick),
        Math.max(floor, foot + y * h),
        innerUV(y),
        roundness || 0,
      ]);
    }
    points.push(
      [
        Math.max(0.08, inner[0][0] * r - thick),
        floor,
        0.02,
        art.innerRound ? 1 : 0,
      ],
      [0.038, floor, 0.02, art.innerRound ? 1 : 0],
      [0.038, foot, 0.02],
      [art.profile[0][0] * r, foot, 0.16],
    );
    api.profile(g, points, art.sides, color, kind, art.shape || "round");
    const tr = thick * (art.rolled ? 1.35 : 0.7),
      ry = art.rolled ? tr * 0.52 : Math.max(0.012, r * 0.025);
    api.profile(
      g,
      [
        [last - thick, top - ry],
        [last + tr, top - ry],
        [last + tr, top],
        [last + tr * 0.7, top + ry],
        [last - thick * 0.6, top + ry],
        [last - thick, top - ry],
      ],
      art.sides,
      rim,
      "enamel",
      art.shape || "round",
    );
    if (foot) {
      if (art.feet)
        for (let j = 0; j < art.feet; j++) {
          const a = (j * Math.PI * 2) / art.feet,
            f = api.group
              ? api.group(g, Math.cos(a) * r * 0.52, 0, Math.sin(a) * r * 0.52)
              : g;
          if (art.maskFeet && api.group) {
            if (f.rotation) f.rotation.y = Math.PI / 2 - a;
            if (f.scale) f.scale.z = 0.65;
            api.profile(
              f,
              [
                [r * 0.035, 0],
                [r * 0.17, foot * 0.76],
                [r * 0.18, foot],
                [r * 0.11, foot],
                [r * 0.025, 0],
                [r * 0.035, 0],
              ],
              8,
              shade(color, 0.88),
              "enamel",
            );
            for (const x of [-r * 0.085, r * 0.085])
              box(
                f,
                x,
                foot * 0.71,
                r * 0.15,
                r * 0.055,
                foot * 0.1,
                r * 0.045,
                shade(color, 0.69),
                "enamel",
              );
            box(
              f,
              0,
              foot * 0.63,
              r * 0.18,
              r * 0.042,
              foot * 0.18,
              r * 0.05,
              shade(color, 0.98),
              "enamel",
            );
            box(
              f,
              0,
              foot * 0.4,
              r * 0.12,
              r * 0.1,
              foot * 0.085,
              r * 0.055,
              shade(color, 0.65),
              "enamel",
            );
          } else
            api.profile(
              f,
              [
                [r * 0.09, 0],
                [r * 0.14, foot * 0.15],
                [r * 0.13, foot],
                [r * 0.09, foot],
                [r * 0.07, 0],
                [r * 0.09, 0],
              ],
              8,
              shade(color, 0.85),
              "clay",
            );
        }
      else if (["tokoname", "kutani", "mino"].includes(p.id))
        for (const x of [-r * 0.48, r * 0.48])
          for (const z of [-r * 0.34, r * 0.34])
            box(
              g,
              x,
              foot * 0.5,
              z,
              r * 0.22,
              foot,
              r * 0.19,
              shade(color, 0.87),
              "clay",
            );
      else {
        const fr = art.footRadius || 0.43;
        api.profile(
          g,
          [
            [r * (fr - 0.05), 0],
            [r * fr, r * 0.04],
            [r * (fr - 0.08), foot],
            [r * (fr - 0.15), foot],
            [r * (fr - 0.12), r * 0.04],
            [r * (fr - 0.1), 0],
            [r * (fr - 0.05), 0],
          ],
          art.sides,
          rim,
          "enamel",
        );
      }
    }
    if (p.id === "antique-nabeshima-dish") {
      const fr = (art.footRadius - 0.015) * r;
      for (let j = 0; j < 32; j++)
        if (![2, 13, 29].includes(j)) {
          const a = (j * Math.PI) / 16;
          box(
            g,
            Math.cos(a) * fr,
            foot * 0.46,
            Math.sin(a) * fr,
            r * 0.014,
            foot * (j % 5 === 0 ? 0.38 : 0.62),
            r * 0.013,
            ["#41668d", "#537798", "#3a5d82"][j % 3],
            "enamel",
            0,
            -a - Math.PI / 2,
          );
        }
    }
    if (!empty) {
      if (api.soil)
        api.soil(
          g,
          0,
          top - 0.045,
          0,
          (last - thick - 0.014) * 2,
          (last - thick - 0.014) * 2 * (art.shape === "oval" ? 0.76 : 1),
          { shape: art.shape || "round", sides: art.sides, color: "#655342" },
        );
      else
        api.profile(
          g,
          [
            [0.001, top - 0.062],
            [last - thick - 0.014, top - 0.062],
            [last - thick - 0.014, top - 0.04],
            [0.001, top - 0.04],
            [0.001, top - 0.062],
          ],
          art.sides,
          "#655342",
          "soil",
          art.shape || "round",
        );
    }
    if (p.id === "basket")
      for (const a of [0, 2.094, 4.189])
        beam(
          g,
          [Math.cos(a) * r, top, Math.sin(a) * r],
          [0, top + r * 1.4, 0],
          0.023,
          "#6b7d70",
        );
    return top;
  }
  if (/box|bag/.test(p.shape)) {
    const w = r * (p.id === "trough" ? 3.1 : 1.95),
      d = r * (p.id === "trough" ? 1.32 : 1.55),
      t = p.shape === "bag" ? 0.045 : 0.08;
    box(g, 0, 0.04, 0, w, 0.08, d, color, kind);
    for (const x of [-w / 2, w / 2]) box(g, x, h / 2, 0, t, h, d, color, kind);
    for (const z of [-d / 2, d / 2]) box(g, 0, h / 2, z, w, h, t, color, kind);
    for (const x of [-w / 2, w / 2])
      box(g, x, h, 0, t * 1.5, 0.05, d + t, rim, kind);
    for (const z of [-d / 2, d / 2])
      box(g, 0, h, z, w + t, 0.05, t * 1.5, rim, kind);
    if (p.shape === "bag")
      for (const x of [-w / 2, w / 2]) {
        beam(g, [x, h * 0.65, -d * 0.15], [x, h + 0.15, -d * 0.15], 0.04, rim);
        beam(g, [x, h + 0.15, -d * 0.15], [x, h + 0.15, d * 0.15], 0.04, rim);
        beam(g, [x, h + 0.15, d * 0.15], [x, h * 0.65, d * 0.15], 0.04, rim);
      }
    if (p.id === "trough")
      for (let j = 1; j < 4; j++)
        for (const z of [-d * 0.52, d * 0.52])
          box(g, 0, (h * j) / 4, z, w, 0.015, 0.012, shade(color, 0.8), "wood");
    if (!empty) {
      if (api.soil)
        api.soil(g, 0, h - 0.05, 0, w - t * 2, d - t * 2, {
          shape: "rect",
          color: "#655342",
        });
      else
        box(g, 0, h - 0.05, 0, w - t * 2, 0.025, d - t * 2, "#655342", "soil");
    }
    return h;
  }
  // Recording/2D-compatible fallback uses the same distinct colors and proportions.
  const sides = art?.sides || 16,
    shape = art?.shape || p.shape;
  for (let j = 0; j < 8; j++)
    for (let k = 0; k < sides; k++) {
      const t = (j + 0.5) / 8,
        a = (k / sides) * Math.PI * 2,
        rr =
          r *
          (0.65 + 0.35 * t) *
          (shape === "mokko" ? 1 + 0.12 * Math.cos(a * 4) : 1);
      box(
        g,
        Math.cos(a) * rr,
        foot + t * h,
        Math.sin(a) * rr * (shape === "oval" ? 0.76 : 1),
        (Math.PI * 2 * rr) / sides,
        h / 8 + 0.001,
        0.04,
        j === 7 ? rim : color,
        kind,
        0,
        -a - Math.PI / 2,
      );
    }
  if (!empty)
    box(g, 0, top - 0.05, 0, r * 1.2, 0.025, r * 1.2, "#655342", "soil");
  return top;
}

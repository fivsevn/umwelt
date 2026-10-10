export function buildWaterBowl(api, g, r, h, type = "pond") {
    const { profile, group, cyl, box, shade, fishSchool, waterSurface, P } = api;
    const ceramic = type === "medakabowl",
      enamel = type === "goldfishbowl";
    const color = ceramic ? "#92795a" : enamel ? P.white : P.blue;
    const kind = ceramic ? "clay" : enamel ? "enamel" : "metal";
    profile(
      g,
      [
        [0.02, 0],
        [0.65, 0],
        [0.84, 0.18],
        [1, 0.8],
        [1.025, 1],
        [0.9, 1],
        [0.88, 0.83],
        [0.72, 0.19],
        [0.02, 0.19],
        [0.02, 0],
      ].map(([rr, y]) => [rr * r, y * h]),
      16,
      color,
      kind,
    );
    const lip = group(g, 0, h, 0);
    profile(
      lip,
      [
        [r * 0.9, -0.018],
        [r * 1.035, -0.018],
        [r * 1.035, 0.035],
        [r * 0.9, 0.035],
        [r * 0.9, -0.018],
      ],
      16,
      enamel ? P.blueDark : shade(color, 1.12),
      kind,
    );
    cyl(
      g,
      0,
      h * 0.18,
      0,
      r * 0.71,
      r * 0.71,
      0.02,
      ceramic ? "#766d52" : P.blueDark,
      16,
    );
    const level = h * 0.8;
    fishSchool(g, r * 1.65, r * 1.65, level, enamel);
    waterSurface(g, r * 1.75, r * 1.75, level, true);
    for (const [x, z, length] of [
      [-0.23, -0.32, 0.25],
      [0.22, 0.19, 0.16],
    ])
      box(
        g,
        r * x,
        level + 0.006,
        r * z,
        r * length,
        0.008,
        0.025,
        "#b3c0ae",
        "water",
      );
    if (ceramic)
      for (let j = 0; j < 3; j++) {
        const pad = group(g, r * 0.4, level + 0.012, (j - 1) * r * 0.18);
        cyl(pad, 0, 0, 0, 0.09, 0.09, 0.01, "#7b9470", 8);
      }
  }

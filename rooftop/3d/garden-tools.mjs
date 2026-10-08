// Construction sketches based on Haws cans, galvanised buckets and GARDENA
// pressure bottles. All curved bodies are closed faceted meshes.
export function buildGardenTool(api, g, type) {
  const { box, beam, cyl, group, profile, ellipsoid, P } = api;
  const ring = (parent, r, y, thickness, col) =>
    profile(
      parent,
      [
        [r - thickness, y - 0.015],
        [r + thickness, y - 0.015],
        [r + thickness, y + 0.015],
        [r - thickness, y + 0.015],
        [r - thickness, y - 0.015],
      ],
      24,
      col,
      "metal",
    );
  const path = (pts, t, col) => {
    for (let j = 1; j < pts.length; j++) beam(g, pts[j - 1], pts[j], t, col);
  };
  if (type === "watering") {
    const c = "#98a09c";
    const body = group(g, -0.15, 0, 0);
    body.scale.z = 0.76;
    profile(
      body,
      [
        [0.001, 0.025],
        [0.28, 0.025],
        [0.34, 0.09],
        [0.35, 0.43],
        [0.3, 0.5],
        [0.13, 0.53],
        [0.13, 0.48],
        [0.28, 0.43],
        [0.29, 0.09],
        [0.001, 0.08],
        [0.001, 0.025],
      ],
      24,
      c,
      "metal",
    );
    ring(body, 0.34, 0.085, 0.015, "#c5ccca");
    ring(body, 0.35, 0.42, 0.012, "#aeb6b4");
    ring(body, 0.14, 0.526, 0.015, "#cfd0c9");
    // Long neck connects low on the body, keeping the water path below the filler.
    path(
      [
        [0.15, 0.12, 0],
        [0.35, 0.22, 0],
        [0.78, 0.46, 0],
        [1.08, 0.62, 0],
      ],
      0.068,
      c,
    );
    const rose = group(g, 1.1, 0.64, 0);
    rose.rotation.z = -0.9;
    cyl(rose, 0, 0, 0, 0.095, 0.055, 0.07, "#a99a69", 16, "metal");
    cyl(rose, 0, 0.04, 0, 0.094, 0.094, 0.011, "#d4bd86", 16, "metal");
    for (let j = 0; j < 17; j++) {
      const a = j * 2.4,
        rr = Math.sqrt(j / 17) * 0.076;
      box(
        rose,
        Math.cos(a) * rr,
        0.048,
        Math.sin(a) * rr,
        0.012,
        0.003,
        0.012,
        "#6d7056",
      );
    }
    // Two open handles: a rear tipping grip and a carrying arch over the filler.
    path(
      [
        [-0.41, 0.14, 0],
        [-0.61, 0.18, 0],
        [-0.67, 0.31, 0],
        [-0.63, 0.48, 0],
        [-0.42, 0.48, 0],
      ],
      0.041,
      c,
    );
    path(
      [
        [-0.15, 0.46, -0.22],
        [-0.15, 0.71, -0.19],
        [-0.15, 0.78, -0.08],
        [-0.15, 0.78, 0.08],
        [-0.15, 0.71, 0.19],
        [-0.15, 0.46, 0.22],
      ],
      0.04,
      c,
    );
    for (const z of [-0.23, 0.23])
      box(g, -0.15, 0.46, z, 0.08, 0.06, 0.025, "#c5c9c7", "metal");
    return true;
  }
  if (type === "bucket") {
    profile(
      g,
      [
        [0.001, 0.025],
        [0.31, 0.025],
        [0.33, 0.06],
        [0.43, 0.65],
        [0.44, 0.69],
        [0.4, 0.69],
        [0.39, 0.64],
        [0.29, 0.095],
        [0.001, 0.095],
        [0.001, 0.025],
      ],
      24,
      "#acb3b4",
      "metal",
    );
    ring(g, 0.43, 0.68, 0.023, "#d2d5d3");
    ring(g, 0.33, 0.08, 0.017, "#798686");
    // Wire bail hinges on riveted ears, with an actual turned wood grip.
    for (const s of [-1, 1]) {
      box(g, s * 0.427, 0.59, 0, 0.048, 0.09, 0.075, "#929d9e", "metal");
      box(g, s * 0.457, 0.59, 0, 0.02, 0.03, 0.03, "#d4d6d0");
    }
    path(
      [
        [-0.45, 0.59, 0],
        [-0.44, 0.81, 0],
        [-0.31, 1.02, 0],
        [-0.14, 1.1, 0],
        [0.14, 1.1, 0],
        [0.31, 1.02, 0],
        [0.44, 0.81, 0],
        [0.45, 0.59, 0],
      ],
      0.027,
      "#cbd1d0",
    );
    const grip = group(g, 0, 1.1, 0);
    grip.rotation.z = Math.PI / 2;
    cyl(grip, 0, 0, 0, 0.042, 0.042, 0.28, P.woodLight, 12, "wood");
    return true;
  }
  if (type === "sprayer") {
    profile(
      g,
      [
        [0.001, 0],
        [0.24, 0],
        [0.32, 0.05],
        [0.34, 0.16],
        [0.34, 0.6],
        [0.31, 0.76],
        [0.2, 0.82],
        [0.001, 0.82],
        [0.001, 0],
      ],
      24,
      "#deddd4",
      "enamel",
    );
    ring(g, 0.33, 0.09, 0.009, "#93a99c");
    cyl(g, 0, 0.855, 0, 0.23, 0.23, 0.1, "#466b6d", 16, "metal");
    cyl(g, 0, 0.982, 0, 0.044, 0.044, 0.17, "#afb9af", 12, "metal");
    box(g, 0, 1.08, 0, 0.27, 0.055, 0.1, "#9d7852", "paint");
    // Pump grip, nozzle and trigger are separate and connected to the cap.
    path(
      [
        [-0.2, 0.89, 0],
        [-0.39, 0.89, 0],
        [-0.39, 0.67, 0],
        [-0.28, 0.6, 0],
      ],
      0.073,
      "#426669",
    );
    box(g, -0.31, 0.952, 0, 0.2, 0.047, 0.09, "#b8905e");
    beam(g, [0.16, 0.88, 0], [0.43, 0.91, 0], 0.065, "#739690");
    const nozzle = group(g, 0.46, 0.91, 0);
    nozzle.rotation.z = -Math.PI / 2;
    cyl(nozzle, 0, 0, 0, 0.043, 0.052, 0.09, "#c1a274", 12, "metal");
    box(g, 0, 0.43, 0.342, 0.055, 0.44, 0.012, "#8da698");
    for (let j = 0; j < 5; j++)
      box(
        g,
        0.045,
        0.24 + j * 0.075,
        0.342,
        j % 2 ? 0.045 : 0.075,
        0.012,
        0.012,
        "#566f6a",
      );
    return true;
  }
  return false;
}

// Original faceted street props. Large silhouette planes carry the construction;
// sparse pixel panels carry seams and fittings, sharing the garden's paint system.
export function carShell(T, rings) {
  const positions = [],
    uvs = [];
  const face = (
    points,
    uv = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
  ) => {
    for (const k of [0, 1, 2, 0, 2, 3]) {
      positions.push(...points[k]);
      uvs.push(...uv[k]);
    }
  };
  const corners = ([w, y, front, back]) => [
    [-w / 2, y, front],
    [w / 2, y, front],
    [w / 2, y, back],
    [-w / 2, y, back],
  ];
  const bottom = corners(rings[0]),
    top = corners(rings.at(-1));
  face([...bottom].reverse());
  face(top);
  for (let j = 1; j < rings.length; j++) {
    const a = corners(rings[j - 1]),
      b = corners(rings[j]);
    for (let k = 0; k < 4; k++)
      face([a[k], a[(k + 1) % 4], b[(k + 1) % 4], b[k]]);
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  g.userData.transient = true;
  return g;
}

const carGeometryCache = new WeakMap();
export function buildStreetCar(api, parent, color) {
  const { T, box, cyl, group, surface } = api;
  // One immutable source per shape. The normal scene compiler owns the GPU
  // attributes and instances every car's paint and transform from these sources.
  let cache = carGeometryCache.get(T);
  if (!cache) carGeometryCache.set(T, (cache = new Map()));
  const geometry = (key, create) => {
    if (!cache.has(key)) cache.set(key, create());
    return cache.get(key);
  };
  const mesh = (geometry, ink, kind) =>
    surface(parent, geometry, 0, 0, 0, 1, 1, 1, ink, kind);
  mesh(
    geometry("body", () =>
      carShell(T, [
        [1.61, 0.19, 1.69, -1.69],
        [1.76, 0.32, 1.74, -1.74],
        [1.73, 0.58, 1.67, -1.65],
        [1.55, 0.66, 1.4, -1.47],
      ]),
    ),
    color,
    "metal",
  );
  mesh(
    geometry("cabin", () =>
      carShell(T, [
        [1.55, 0.64, 0.77, -1.08],
        [1.3, 1.04, 0.37, -0.79],
        [1.27, 1.095, 0.34, -0.75],
      ]),
    ),
    color,
    "paint",
  );
  // Sloping glass follows the actual cabin rather than standing on a rectangular box.
  const pane = (points) => {
    const geo = geometry("glass:" + JSON.stringify(points), () => {
      const geometry = new T.BufferGeometry(),
        positions = [];
      for (const k of [0, 1, 2, 0, 2, 3]) positions.push(...points[k]);
      geometry.setAttribute(
        "position",
        new T.Float32BufferAttribute(positions, 3),
      );
      geometry.setAttribute(
        "uv",
        new T.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2),
      );
      geometry.computeVertexNormals();
      geometry.userData.transient = true;
      return geometry;
    });
    mesh(geo, "#ffffff", "panel-glass");
  };
  pane([
    [-0.7, 0.694, 0.746],
    [0.7, 0.694, 0.746],
    [0.59, 1.022, 0.42],
    [-0.59, 1.022, 0.42],
  ]);
  pane([
    [0.69, 0.687, -1.077],
    [-0.69, 0.687, -1.077],
    [-0.59, 1.023, -0.822],
    [0.59, 1.023, -0.822],
  ]);
  for (const side of [-1, 1]) {
    const x = side;
    const sidePane = (points) =>
      pane(side > 0 ? points : [...points].reverse());
    sidePane([
      [x * 0.777, 0.685, 0.682],
      [x * 0.777, 0.685, -0.035],
      [x * 0.651, 1.015, -0.035],
      [x * 0.651, 1.015, 0.323],
    ]);
    sidePane([
      [x * 0.777, 0.685, -0.091],
      [x * 0.777, 0.685, -1.026],
      [x * 0.651, 1.015, -0.738],
      [x * 0.651, 1.015, -0.091],
    ]);
    box(
      parent,
      x * 0.778,
      0.85,
      -0.063,
      0.035,
      0.37,
      0.056,
      "#253843",
      "metal",
      0,
      0,
      -side * 0.33,
    );
    box(
      parent,
      x * 0.801,
      0.653,
      -0.12,
      0.027,
      0.025,
      1.78,
      "#c3c9c6",
      "metal",
    );
    // Door seams, inset handle and restrained broad wear: painted at 64 texels.
    const doorGeo = geometry("doors", () => new T.PlaneGeometry(1.67, 0.35));
    const doors = group(parent, side * 0.879, 0.443, -0.11);
    doors.rotation.y = (side * Math.PI) / 2;
    surface(doors, doorGeo, 0, 0, 0, 1, 1, 1, color, "livery-car");
    box(parent, x * 0.884, 0.31, 0, 0.037, 0.07, 3.09, "#283541", "metal");
    box(parent, x * 0.839, 0.82, 0.46, 0.16, 0.11, 0.23, "#26333c", "metal");
    box(parent, x * 0.929, 0.835, 0.46, 0.016, 0.066, 0.16, "#a6c1c6", "metal");
    for (const z of [-1.09, 1.04]) {
      const wheel = group(parent, x * 0.856, 0.265, z);
      wheel.rotation.z = (-side * Math.PI) / 2;
      cyl(wheel, 0, 0, 0, 0.31, 0.31, 0.165, "#20272e", 12, "paint");
      cyl(wheel, 0, 0.089, 0, 0.219, 0.219, 0.019, "#8a98a3", 12, "metal");
      cyl(wheel, 0, 0.101, 0, 0.081, 0.081, 0.026, "#c8d2d1", 8, "metal");
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3;
        box(
          wheel,
          Math.cos(a) * 0.146,
          0.105,
          Math.sin(a) * 0.146,
          0.046,
          0.012,
          0.11,
          "#283642",
          "metal",
          0,
          -a,
          0,
        );
      }
    }
    box(parent, x * 0.62, 0.51, 1.717, 0.31, 0.14, 0.034, "#dbe6e5", "enamel");
    box(parent, x * 0.791, 0.51, 1.692, 0.07, 0.13, 0.043, "#c38339", "paint");
    box(parent, x * 0.6, 0.51, -1.703, 0.35, 0.13, 0.035, "#9b4038", "paint");
  }
  for (const sign of [-1, 1]) {
    box(parent, 0, 0.312, sign * 1.755, 1.65, 0.091, 0.068, "#25323c", "metal");
    box(parent, 0, 0.362, sign * 1.763, 1.58, 0.035, 0.027, "#bbc5c7", "metal");
  }
  box(parent, 0, 0.508, 1.725, 0.73, 0.135, 0.031, "#25333a", "metal");
  for (const y of [0.477, 0.512, 0.547])
    box(parent, 0, y, 1.748, 0.68, 0.013, 0.015, "#a3b5bd", "metal");
  box(parent, 0, 0.269, 1.794, 0.41, 0.131, 0.024, "#e4e5da", "enamel");
  for (const x of [-0.13, -0.06, 0.035, 0.12])
    box(parent, x, 0.267, 1.81, 0.024, 0.057, 0.009, "#303e49", "paint");
}

export function buildStreetLantern(api, parent) {
  const { box, cyl, beam, P } = api,
    ink = "#3b403f";
  cyl(parent, 0, 0.1, 0, 0.19, 0.24, 0.2, ink, 8, "metal");
  cyl(parent, 0, 1.78, 0, 0.052, 0.082, 3.37, ink, 8, "metal");
  cyl(parent, 0, 0.37, 0, 0.13, 0.18, 0.33, ink, 8, "metal");
  cyl(parent, 0, 1.28, 0, 0.12, 0.09, 0.26, "#4a5050", 8, "metal");
  cyl(parent, 0, 2.69, 0, 0.095, 0.145, 0.23, ink, 8, "metal");
  for (const y of [0.28, 0.58, 0.72, 1.09, 1.45, 2.13, 2.57, 2.83, 3.16])
    cyl(parent, 0, y, 0, 0.1, 0.12, 0.055, "#5b6261", 8, "metal");
  for (const x of [-0.067, 0.067])
    box(parent, x, 1.81, 0, 0.028, 0.55, 0.05, "#4b5452", "metal");
  box(parent, 0.15, 2.91, 0, 0.17, 0.08, 0.08, ink, "metal");
  cyl(parent, 0, 3.35, 0, 0.2, 0.15, 0.13, ink, 8, "metal");
  box(parent, 0, 3.63, 0, 0.3, 0.48, 0.3, "#d0c776", "light");
  for (const x of [-0.18, 0.18])
    for (const z of [-0.18, 0.18])
      beam(parent, [x, 3.36, z], [x * 1.25, 3.91, z * 1.25], 0.036, ink);
  cyl(parent, 0, 3.97, 0, 0.09, 0.32, 0.2, ink, 4, "metal");
  cyl(parent, 0, 4.08, 0, 0.06, 0.1, 0.09, "#656e6b", 8, "metal");
  box(parent, 0, 3.35, 0, 0.42, 0.055, 0.42, P.metalDark, "metal");
}

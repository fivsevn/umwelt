export function washstationSpec(w, d, h, type) {
  return {
    top: h * 0.94,
    bx: type === "sink" ? w * 0.19 : 0,
    bw: type === "sink" ? w * 0.48 : w * 0.72,
    bd: d * 0.68,
    depth: Math.min(0.45, h * 0.53),
  };
}

// A continuous counter with a real opening, a closed bowl and visible plumbing.
// All outlines and surface pixels are constructed here; no image/model assets.
export function roundedRectangle(w, d, radius, cx = 0, cz = 0) {
  const r = Math.min(radius, w / 2, d / 2),
    points = [];
  for (const [x, z, start] of [
    [w / 2 - r, d / 2 - r, 0],
    [-w / 2 + r, d / 2 - r, Math.PI / 2],
    [-w / 2 + r, -d / 2 + r, Math.PI],
    [w / 2 - r, -d / 2 + r, Math.PI * 1.5],
  ])
    for (let j = 0; j <= 3; j++) {
      const a = start + (j * Math.PI) / 6;
      points.push([cx + x + Math.cos(a) * r, cz + z + Math.sin(a) * r]);
    }
  return points;
}

export function recessedBowlGeometry(T, w, d, depth, cx = 0, oval = false) {
  const rings = [
    [w, d, 0],
    [w - 0.09, d - 0.09, -0.08],
    [w * 0.78, d * 0.74, -depth],
    [w * 0.78, d * 0.74, -depth - 0.055],
    [w + 0.025, d + 0.025, -0.05],
    [w, d, 0],
  ];
  const positions = [],
    uvs = [],
    indices = [],
    n = 16;
  rings.forEach(([ww, dd, y], k) => {
    const pts = oval
      ? Array.from({ length: 16 }, (_, j) => [
          cx + (Math.cos((j * Math.PI) / 8) * ww) / 2,
          (Math.sin((j * Math.PI) / 8) * dd) / 2,
        ])
      : roundedRectangle(ww, dd, Math.min(0.18, dd * 0.16), cx);
    pts.forEach(([x, z], j) => {
      positions.push(x, y, z);
      uvs.push(j / n, k / (rings.length - 1));
    });
  });
  for (let k = 0; k < rings.length - 1; k++)
    for (let j = 0; j < n; j++) {
      const a = k * n + j,
        b = k * n + ((j + 1) % n),
        c = a + n,
        e = b + n;
      indices.push(a, c, b, b, c, e);
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  const flat = geo.toNonIndexed();
  geo.dispose();
  flat.computeVertexNormals();
  return flat;
}

export function buildWashstation(api, g, w, d, h, type) {
  const { T, box, cyl, beam, group, mat, P } = api;
  const steel = type === "sink",
    { top, bx, bw, bd, depth } = washstationSpec(w, d, h, type),
    paint = steel ? "#bcbfc0" : "#e3e5dc",
    inner = steel ? "#919999" : "#4388a8";
  const shape = new T.Shape();
  shape.setFromPoints(
    roundedRectangle(w, d, 0.09).map(([x, z]) => new T.Vector2(x, z)),
  );
  const hole = new T.Path();
  hole.setFromPoints(
    (steel
      ? roundedRectangle(bw, bd, 0.18, bx)
      : Array.from({ length: 16 }, (_, j) => [
          bx + (Math.cos((j * Math.PI) / 8) * bw) / 2,
          (Math.sin((j * Math.PI) / 8) * bd) / 2,
        ])
    )
      .reverse()
      .map(([x, z]) => new T.Vector2(x, z)),
  );
  shape.holes.push(hole);
  const deckGeo = new T.ExtrudeGeometry(shape, {
    depth: 0.075,
    bevelEnabled: false,
    curveSegments: 1,
  });
  deckGeo.rotateX(-Math.PI / 2);
  const deck = new T.Mesh(deckGeo, mat(paint, steel ? "metal" : "enamel"));
  deck.position.y = top;
  deck.castShadow = deck.receiveShadow = true;
  g.add(deck);
  const bowl = new T.Mesh(
    recessedBowlGeometry(T, bw, bd, depth, bx, !steel),
    mat(inner, steel ? "metal" : "enamel"),
  );
  bowl.position.y = top;
  bowl.castShadow = bowl.receiveShadow = true;
  g.add(bowl);
  // Floor sits inside the sloping shell, with a drain at its lowest point.
  if (steel)
    box(
      g,
      bx,
      top - depth - 0.012,
      0,
      bw * 0.78,
      0.065,
      bd * 0.74,
      inner,
      "metal",
    );
  else {
    const floor = group(g, bx, top - depth - 0.012, 0);
    floor.scale.z = (bd * 0.74) / (bw * 0.78);
    cyl(floor, 0, 0, 0, bw * 0.39, bw * 0.39, 0.065, inner, 16, "enamel");
  }
  cyl(g, bx, top - depth + 0.031, 0, 0.1, 0.1, 0.018, "#b2b9b1", 12, "metal");
  cyl(g, bx, top - depth + 0.043, 0, 0.06, 0.06, 0.008, P.metalDark, 8);
  for (const x of [-0.035, 0.035])
    box(g, bx + x, top - depth + 0.05, 0, 0.017, 0.008, 0.1, "#c7c9b9");
  // Four folded apron strips close the underside of the worktop.
  for (const z of [-d * 0.48, d * 0.48])
    box(
      g,
      0,
      top - 0.13,
      z,
      w,
      0.25,
      0.065,
      steel ? "#828b8c" : P.blue,
      "metal",
    );
  for (const x of [-w * 0.48, w * 0.48])
    box(
      g,
      x,
      top - 0.13,
      0,
      0.065,
      0.25,
      d,
      steel ? "#828b8c" : P.blue,
      "metal",
    );
  for (const x of [-w * 0.43, w * 0.43]) {
    for (const z of [-d * 0.41, d * 0.41]) {
      box(g, x, top / 2 - 0.05, z, 0.085, top - 0.1, 0.085, P.metal, "metal");
      box(g, x, 0.045, z, 0.14, 0.09, 0.14, P.metalDark);
      box(g, x, top - 0.15, z, 0.025, 0.028, 0.095, P.metalLight);
    }
    box(g, x, top * 0.25, 0, 0.055, 0.055, d * 0.83, P.metalDark, "metal");
  }
  box(g, 0, top * 0.25, -d * 0.4, w * 0.85, 0.055, 0.055, P.metal, "metal");
  if (steel) {
    // Pressed drainboard flutes stop before the bowl and slope into it.
    const left = -w * 0.45,
      right = bx - bw / 2 - 0.09;
    for (let j = 0; j < 7; j++)
      box(
        g,
        (left + right) / 2,
        top + 0.088,
        -bd * 0.41 + j * bd * 0.136,
        right - left,
        0.024,
        0.035,
        "#cad0c4",
        "metal",
      );
  } else {
    box(g, 0, top - 0.265, d * 0.515, w * 0.84, 0.035, 0.025, "#3f636e");
    for (const x of [-w * 0.43, w * 0.43])
      box(g, x, top - 0.17, d * 0.518, 0.03, 0.06, 0.024, P.metalLight);
  }
  // Raised splashback, mounting flange and a faceted goose-neck tap.
  box(g, 0, top + 0.16, -d * 0.48, w, 0.23, 0.065, paint, "metal");
  const tz = -bd / 2 - 0.09,
    tap = group(g, bx, top + 0.075, tz);
  cyl(tap, 0, 0.018, 0, 0.13, 0.13, 0.035, "#b8c1b5", 12, "metal");
  const path = [
    [0, 0.04, 0],
    [0, 0.37, 0],
    [0, 0.5, 0.07],
    [0, 0.54, 0.17],
    [0, 0.5, 0.27],
    [0, 0.37, 0.29],
  ];
  for (let j = 1; j < path.length; j++)
    beam(tap, path[j - 1], path[j], 0.072, "#bac0c0");
  cyl(tap, 0, 0.357, 0.29, 0.057, 0.057, 0.07, P.metalDark, 8);
  beam(tap, [-0.2, 0.16, 0], [0.2, 0.16, 0], 0.045, "#d0d2d0");
  cyl(tap, 0, 0.17, 0, 0.095, 0.095, 0.07, "#989fa0", 8);
  for (const x of [-0.2, 0.2])
    box(tap, x, 0.16, 0, 0.055, 0.08, 0.055, "#c4c8c7");
  // Waste tube and trap are connected to the bowl, never floating below it.
  const py = top - depth - 0.06;
  const waste = [
    [bx, py, 0],
    [bx, Math.max(0.13, py - 0.2), 0],
    [bx, 0.12, -0.17],
    [bx, 0.12, -0.34],
    [bx, 0.35, -0.43],
    [bx, 0.35, -d * 0.46],
  ];
  for (let j = 1; j < waste.length; j++)
    beam(g, waste[j - 1], waste[j], 0.07, "#b9bcbd");
  for (const y of [py, py - 0.12])
    cyl(g, bx, y, 0, 0.064, 0.064, 0.04, P.metalLight, 8);
  g.userData.washstation = {
    opening: [bx, bw, bd],
    top,
    bottom: top - depth,
    continuousDeck: true,
  };
}

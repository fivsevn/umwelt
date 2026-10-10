function paintedGlass(api,color,opacity){
 const source=api.mat(color,"glass"),material=source.clone();
 material.onBeforeCompile=source.onBeforeCompile;material.customProgramCacheKey=source.customProgramCacheKey;
 material.defaultAttributeValues=source.defaultAttributeValues;
 material.transparent=true;material.opacity=opacity;material.depthWrite=false;material.side=api.T.DoubleSide;
 return material;
}
export function buildAquarium(api, g, w, d, h) {
  const { T, box } = api,
    edge = "#829795";
  const glass = paintedGlass(api,"#c3dedc",.13);
  const pane = (x, y, z, ww, hh, dd) => {
    const mesh = new T.Mesh(new T.BoxGeometry(ww, hh, dd), glass);
    mesh.position.set(x, y, z);
    g.add(mesh);
  };
  pane(0, 0.035, 0, w, 0.035, d);
  for (const x of [-w / 2, w / 2]) pane(x, h / 2, 0, 0.018, h, d);
  for (const z of [-d / 2, d / 2]) pane(0, h / 2, z, w, h, 0.018);
  box(g, 0, 0.022, 0, w, 0.035, d, "#74817a", "enamel");
  for (const x of [-w / 2, w / 2])
    for (const z of [-d / 2, d / 2])
      box(g, x, h / 2, z, 0.019, h, 0.019, edge, "enamel");
  for (const y of [0.045, h]) {
    for (const x of [-w / 2, w / 2])
      box(g, x, y, 0, 0.025, 0.026, d, edge, "enamel");
    for (const z of [-d / 2, d / 2])
      box(g, 0, y, z, w, 0.026, 0.025, edge, "enamel");
  }
  // A few small highlights indicate thickness without hiding the fish.
  for (const [x, y] of [
    [-w * 0.34, h * 0.65],
    [w * 0.28, h * 0.39],
  ])
    box(g, x, y, d / 2 + 0.011, 0.028, 0.028, 0.003, "#d7e8df", "enamel");
}

export function buildGlassCase(api, g, type, w, d, h) {
  const { T, box, beam, group, P } = api,
    wood = type === "wardcase",
    c = wood ? "#806544" : "#5c8588",
    kind = wood ? "wood" : "metal";
  const glass = paintedGlass(api,"#c3dedc",.16);
  const pane = (points) => {
    const geo = new T.BufferGeometry(),
      positions = [];
    for (let j = 1; j < points.length - 1; j++)
      positions.push(...points[0], ...points[j], ...points[j + 1]);
    geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    const mesh = new T.Mesh(geo, glass);
    mesh.receiveShadow = true;
    g.add(mesh);
  };
  box(g, 0, 0.065, 0, w, 0.13, d, wood ? P.woodDark : "#557778", kind);
  box(g, 0, 0.145, 0, w * 0.91, 0.025, d * 0.85, "#716450", "soil");
  for (const z of [-d * 0.48, d * 0.48])
    box(g, 0, 0.2, z, w, 0.14, 0.065, c, kind);
  for (const x of [-w * 0.48, w * 0.48])
    box(g, x, 0.2, 0, 0.065, 0.14, d, c, kind);
  const section = wood
    ? [
        [-d * 0.45, 0.22],
        [-d * 0.45, h * 0.73],
        [0, h],
        [d * 0.45, h * 0.73],
        [d * 0.45, 0.22],
      ]
    : [
        [-d * 0.45, 0.22],
        [-d * 0.45, h * 0.48],
        [-d * 0.37, h * 0.78],
        [-d * 0.21, h * 0.95],
        [0, h],
        [d * 0.21, h * 0.95],
        [d * 0.37, h * 0.78],
        [d * 0.45, h * 0.48],
        [d * 0.45, 0.22],
      ];
  for (const x of [-w * 0.47, w * 0.47]) {
    pane(section.map(([z, y]) => [x, y, z]));
    for (let j = 1; j < section.length; j++)
      beam(
        g,
        [x, section[j - 1][1], section[j - 1][0]],
        [x, section[j][1], section[j][0]],
        wood ? 0.055 : 0.039,
        c,
      );
  }
  for (let j = 1; j < section.length; j++) {
    const [z, y] = section[j],
      [zz, yy] = section[j - 1];
    pane([
      [-w * 0.47, y, z],
      [w * 0.47, y, z],
      [w * 0.47, yy, zz],
      [-w * 0.47, yy, zz],
    ]);
    if (
      wood ||
      j === 1 ||
      j === section.length - 1 ||
      j === Math.floor(section.length / 2)
    )
      box(g, 0, y, z, w, 0.043, 0.043, c, kind);
  }
  if (wood)
    for (const x of [-w * 0.25, 0, w * 0.25]) {
      beam(g, [x, h * 0.73, -d * 0.45], [x, h, 0], 0.045, c);
      beam(g, [x, h, 0], [x, h * 0.73, d * 0.45], 0.045, c);
    }
  else
    for (const x of [-w * 0.23, 0, w * 0.23]) {
      for (let j = 2; j < section.length - 1; j++)
        beam(
          g,
          [x, section[j - 1][1], section[j - 1][0]],
          [x, section[j][1], section[j][0]],
          0.026,
          "#8ba5a0",
        );
    }
  // Hinges and latch connect to the frames; small broken reflections lie on glass.
  for (const x of [-w * 0.3, w * 0.3])
    box(g, x, h * 0.73, -d * 0.47, 0.12, 0.065, 0.04, "#adb5a1", "metal");
  box(g, 0, h * 0.38, d * 0.48, 0.18, 0.055, 0.04, "#abb8aa", "metal");
  for (const x of [-w * 0.36, w * 0.33]) {
    box(g, x, h * 0.5, d * 0.451, 0.025, h * 0.19, 0.009, "#b1c6b7");
    box(g, x + 0.031, h * 0.57, d * 0.453, 0.025, h * 0.1, 0.008, "#d4dfc9");
  }
  g.userData.cavity = {
    bottom: 0.16,
    ceiling: h * 0.71,
    w: w * 0.87,
    d: d * 0.8,
  };
}

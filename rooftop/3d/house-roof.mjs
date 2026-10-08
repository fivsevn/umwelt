import { HOUSE, terracePoint } from "../house-structure.mjs";
// The same ridge, eaves and paint seed are viewed from opposite local frames.
export function buildHouseRoof(api, parent, scene) {
  const { T, group, box, beam, mat } = api;
  const g = group(parent);
  const r = HOUSE.roof;
  const vertices = [
    [r.x - 0.45, r.eave, r.z - 0.3],
    [r.x + r.width + 0.45, r.eave, r.z - 0.3],
    [r.x + r.width + 0.45, r.ridge, r.z + r.depth / 2],
    [r.x - 0.45, r.ridge, r.z + r.depth / 2],
    [r.x - 0.45, r.eave, r.z + r.depth + 0.3],
    [r.x + r.width + 0.45, r.eave, r.z + r.depth + 0.3],
  ];
  const faces = [
    [0, 2, 1],
    [0, 3, 2],
    [3, 5, 2],
    [3, 4, 5],
  ];
  const geometry = new T.BufferGeometry();
  geometry.setAttribute(
    "position",
    new T.Float32BufferAttribute(
      faces.flatMap((f) =>
        f.flatMap((i) => {
          const [x, y, z] = vertices[i],
            [lx, lz] = terracePoint(scene, x, z);
          return [lx, y, lz];
        }),
      ),
      3,
    ),
  );
  geometry.computeVertexNormals();
  const roof = new T.Mesh(geometry, mat("#716963", "roof"));
  roof.castShadow = roof.receiveShadow = true;
  g.add(roof);
  const local = (x, y, z) => {
    const [lx, lz] = terracePoint(scene, x, z);
    return [lx, y, lz];
  };
  for (const z of [r.z - 0.3, r.z + r.depth + 0.3]) {
    beam(
      g,
      local(r.x - 0.5, r.eave - 0.08, z),
      local(r.x + r.width + 0.5, r.eave - 0.08, z),
      0.22,
      "#b2afa4",
      0.22,
      "wall",
    );
    beam(
      g,
      local(r.x - 0.55, r.eave + 0.035, z),
      local(r.x + r.width + 0.55, r.eave + 0.035, z),
      0.13,
      "#818c8b",
      0.13,
      "metal",
    );
  }
  beam(
    g,
    local(r.x - 0.5, r.ridge + 0.07, r.z + r.depth / 2),
    local(r.x + r.width + 0.5, r.ridge + 0.07, r.z + r.depth / 2),
    0.19,
    "#99908a",
    0.19,
    "roof",
  );
  // Tile joints follow the slope, with scattered repairs rather than mirrored rows.
  for (let x = r.x; x < r.x + r.width; x += 0.58)
    for (const side of [-1, 1]) {
      const z = r.z + r.depth / 2 + side * (r.depth / 2 + 0.3);
      beam(
        g,
        local(x, r.eave + 0.012, z),
        local(x, r.ridge + 0.012, r.z + r.depth / 2),
        0.035,
        "#625d58",
        0.035,
        "roof",
      );
    }
  for (const [x, z] of [
    [-7, 7],
    [-2, 17],
    [3, 22],
  ]) {
    const y =
      r.ridge -
      (Math.abs(z - (r.z + r.depth / 2)) / (r.depth / 2 + 0.3)) *
        (r.ridge - r.eave);
    const patch = group(g, ...local(x, y + 0.018, z));
    patch.rotation.y = scene === "south" ? Math.PI / 2 : 0;
    patch.rotation.x =
      z < 14
        ? -Math.atan((r.ridge - r.eave) / 10.3)
        : Math.atan((r.ridge - r.eave) / 10.3);
    box(patch, 0, 0, 0, 0.5, 0.018, 0.95, "#85807a", "roof");
  }
  g.userData.house = HOUSE.id;
  return g;
}

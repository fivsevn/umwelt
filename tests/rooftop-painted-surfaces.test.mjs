import { SCENES, DOORS } from "../rooftop/scene.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  latheSurface,
  leafSurface,
  beveledBoxSurface,
} from "../rooftop/3d/model-surfaces.mjs";
import {
  surfaceSeed,
  soilParticles,
} from "../rooftop/3d/surface-variation.mjs";
import {
  carShell,
  buildStreetCar,
  buildStreetLantern,
} from "../rooftop/3d/street-models.mjs";
import { buildNeighborhood } from "../rooftop/3d/neighborhood.mjs";
import {
  recessedBowlGeometry,
  roundedRectangle,
} from "../rooftop/3d/washstation.mjs";
import { soilBagGeometry } from "../rooftop/3d/soft-goods.mjs";
import { soilSurface, soilPointHeight } from "../rooftop/3d/soil-surface.mjs";
import { buildAquarium } from "../rooftop/3d/glass-cases.mjs";
import { buildVessel } from "../rooftop/3d/vessel-models.mjs";
import { POTS } from "../rooftop/botany.mjs";
import { VESSEL_ART } from "../rooftop/3d/vessel-art.mjs";
import { buildResident, buildPig } from "../rooftop/3d/residents.mjs";
import { OUTFITS, DECORATIONS, wardrobe } from "../rooftop/wardrobe.mjs";
import { vesselDimensions } from "../rooftop/3d/vessel-models.mjs";
const context = { console: { warn() {} } };
vm.runInNewContext(
  readFileSync(
    new URL("../rooftop/3d/vendor/three.min.js", import.meta.url),
    "utf8",
  ),
  context,
);
const T = context.THREE;
test("every outfit and pig decoration builds finite geometry with valid material arguments", () => {
  const previous = { ...wardrobe };
  let count = 0;
  const part = (g, x, y, z, w, h, d, color, kind = "paint") => {
    assert.ok([x, y, z, w, h, d].every(Number.isFinite));
    assert.ok(w > 0 && h > 0 && d > 0);
    assert.equal(typeof color, "string");
    assert.equal(typeof kind, "string");
    count++;
  };
  const api = {
    P: {
      wood: "#987346",
      woodLight: "#b69769",
      metalLight: "#b7c0bd",
      blueDark: "#314c61",
      white: "#dfded4",
    },
    group(parent, x = 0, y = 0, z = 0) {
      const g = new T.Group();
      g.position.set(x, y, z);
      parent.add(g);
      return g;
    },
    box: part,
    ellipsoid: part,
    cyl(g, x, y, z, rt, rb, h, color, sides, kind = "paint") {
      part(g, x, y, z, rt, h, rb, color, kind);
    },
    beam(g, a, b, width, color, depth = width, kind = "paint") {
      assert.ok([...a, ...b, width, depth].every(Number.isFinite));
      assert.equal(typeof kind, "string");
      count++;
    },
    profile(g, points, sides, color, kind) {
      assert.ok(points.flat().every(Number.isFinite));
      assert.equal(typeof kind, "string");
      count++;
    },
  };
  api.modelApi = () => api;
  try {
    for (const outfit of Object.keys(OUTFITS)) {
      wardrobe.outfit = outfit;
      const model = buildResident(api, new T.Group());
      assert.ok(
        model.person.scale.x > 1 &&
          model.legs.length === 2 &&
          model.arms.length === 2,
      );
      assert.equal(Object.keys(model.tools).length, 8);
    }
    for (const decoration of Object.keys(DECORATIONS)) {
      wardrobe.pig = decoration;
      const model = buildPig(api, new T.Group());
      assert.equal(model.pigLegs.length, 4);
      assert.equal(model.pigEyes.length, 2);
      assert.equal(model.ears.length, 2);
    }
    assert.ok(count > 2000);
  } finally {
    Object.assign(wardrobe, previous);
  }
});
function closed(geometry, label) {
  const mesh = geometry.index ? geometry.toNonIndexed() : geometry;
  const data = mesh.attributes.position.array,
    edges = new Map();
  assert.ok([...data].every(Number.isFinite), label + " finite vertices");
  assert.ok(
    [...mesh.attributes.normal.array].every(Number.isFinite),
    label + " finite normals",
  );
  const vertex = (i) =>
    Array.from(data.slice(i * 3, i * 3 + 3), (n) => Math.round(n * 1e6)).join(
      ",",
    );
  for (let i = 0; i < data.length / 3; i += 3)
    for (const [a, b] of [
      [i, i + 1],
      [i + 1, i + 2],
      [i + 2, i],
    ]) {
      const key = [vertex(a), vertex(b)].sort().join("/");
      if (vertex(a) === vertex(b)) continue;
      edges.set(key, (edges.get(key) || 0) + 1);
    }
  assert.ok(
    [...edges.values()].every((n) => n === 2),
    label + " watertight shell",
  );
  assert.ok(data.length / 9 < 1600, label + " bounded triangle count");
}
test("every modern ceramic shell is closed, hollow and retains a drainage hole", () => {
  for (const pot of POTS.filter((p) => !/box|bag/.test(p.shape))) {
    const shells = [];
    buildVessel(
      {
        box() {},
        beam() {},
        shade: (c) => c,
        profile(g, points, sides, color, kind, shape) {
          shells.push({
            points,
            geometry: latheSurface(T, points, sides, shape),
          });
        },
      },
      {},
      pot,
      0.46,
      0.38,
      { empty: true },
    );
    assert.ok(shells.length >= 2, pot.id + " body and rim");
    for (const shell of shells) closed(shell.geometry, pot.id);
    const body = shells[0].points;
    assert.ok(Math.min(...body.map((p) => p[0])) > 0, pot.id + " open drain");
    assert.ok(
      body.some(
        (p, i) => i > 0 && p[1] === body[i - 1][1] && p[0] !== body[i - 1][0],
      ),
      pot.id + " wall thickness",
    );
  }
});
test("upright, horizontal and fleshy leaves have actual closed thickness", () => {
  for (const end of [
    [0, 1, 0],
    [0, 0, 1],
    [0.4, 0.7, 0.3],
  ])
    for (const fleshy of [false, true]) {
      const leaf = leafSurface(T, [0, 0, 0], end, 0.3, false, fleshy);
      closed(leaf, "leaf");
      leaf.computeBoundingBox();
      const size = leaf.boundingBox.getSize(new T.Vector3());
      assert.ok(
        Math.min(size.x, size.y, size.z) > 0.005,
        "nonzero thickness in every orientation",
      );
    }
});
test("sun-facing leaf panels have outward normals above their midrib", () => {
  for (const fleshy of [false, true]) {
    const g = leafSurface(T, [0, 0, 0], [0, 0, 1], 0.4, false, fleshy);
    const p = g.attributes.position,
      n = g.attributes.normal;
    for (let j = 0; j < p.count; j += 3) {
      const z = (p.getZ(j) + p.getZ(j + 1) + p.getZ(j + 2)) / 3;
      const upper = [j, j + 1, j + 2].every(
        (k) =>
          p.getY(k) >
          Math.sin(p.getZ(k) * Math.PI) * (fleshy ? 0.11 : 0.035) + 0.001,
      );
      if (upper && z > 0.15 && z < 0.85)
        assert.ok(n.getY(j) > 0, "upper faces receive light");
    }
  }
});

test("a recessed washstation retains a closed sloping shell and inward-facing cavity", () => {
  for (const [w, d] of [
    [1.55, 1.78],
    [2.8, 1.95],
  ]) {
    const geo = recessedBowlGeometry(T, w, d, 0.42, 0.6);
    closed(geo, "washstation bowl");
    geo.computeBoundingBox();
    assert.ok(geo.boundingBox.min.y < -0.42, "the bowl is recessed");
    const p = geo.attributes.position,
      n = geo.attributes.normal;
    const radial = p.getX(0) - 0.6;
    assert.ok(radial * n.getX(0) < 0, "cavity normal faces into the bowl");
    assert.equal(roundedRectangle(w, d, 0.18).length, 16);
  }
});

test("seeded soil stays inside the soil opening and varies without moving the pot", () => {
  for (const options of [
    { dry: true },
    { rectangular: true, trough: true },
    {},
  ]) {
    const a = soilParticles(0.6, 7182, options),
      b = soilParticles(0.6, 49113, options);
    assert.deepEqual(a, soilParticles(0.6, 7182, options));
    assert.notDeepEqual(a, b);
    assert.ok(a.length <= 34);
    assert.notEqual(surfaceSeed(7182), surfaceSeed(49113));
    for (const p of a) {
      assert.ok(p.height > 0 && p.height < 0.025);
      assert.ok(Math.abs(p.x) + p.size < 0.6 * (options.trough ? 1.5 : 1));
      assert.ok(Math.abs(p.z) + p.size < 0.6 * (options.trough ? 0.62 : 1));
    }
  }
});

test("soil has a closed curved mound, outward normals and stable asymmetric variants", () => {
  for (const shape of [
    "round",
    "rect",
    "square",
    "mokko",
    "scallop",
    "irregular",
  ]) {
    const a = soilSurface(T, shape, 12, 4),
      b = soilSurface(T, shape, 12, 21);
    closed(a, "soil " + shape);
    closed(b, "soil " + shape);
    const p = a.attributes.position,
      n = a.attributes.normal;
    assert.ok(
      p.count / 3 >= 48 && p.count / 3 <= 120,
      "a closed mound uses few folded faces rather than a smooth dense mesh",
    );
    assert.ok(
      new Set(
        Array.from(p.array)
          .filter((_, i) => i % 3 === 1)
          .map((v) => Math.round(v * 1000)),
      ).size >= 9,
      "soil is not a flat cap",
    );
    assert.notDeepEqual(
      Array.from(p.array),
      Array.from(b.attributes.position.array),
    );
    assert.deepEqual(
      Array.from(p.array),
      Array.from(soilSurface(T, shape, 12, 4).attributes.position.array),
    );
    for (let j = 0; j < p.count; j += 3)
      if ([j, j + 1, j + 2].every((k) => p.getY(k) >= 0))
        assert.ok(n.getY(j) > 0, "upper mound faces receive light");
    assert.ok(soilPointHeight(shape, 0, 0, 4) > 0);
    assert.notEqual(
      soilPointHeight(shape, 0.4, 0.2, 4),
      soilPointHeight(shape, -0.4, -0.2, 4),
    );
  }
});

test("aquarium side walls are transparent and do not write depth over the fish", () => {
  const g = new T.Group(),
    parts = [];
  buildAquarium({ T, mat:(color,kind)=>{const m=new T.MeshBasicMaterial({color});m.userData.nativeField=kind;return m;}, box: (...args) => parts.push(args) }, g, 2.25, 1.8, 1.56);
  assert.equal(g.children.length, 5);
  for (const mesh of g.children) {
    assert.ok(mesh.material.transparent && mesh.material.opacity < 0.2);
    assert.equal(mesh.material.depthWrite, false);
    assert.equal(mesh.material.userData.nativeField,"glass","transparent panes retain their native square reflection drawing");
  }
  assert.ok(parts.length > 8, "thin actual frame remains pickable");
});

test("soft soil packaging is a closed outward-facing bag with a pinched mouth", () => {
  const g = soilBagGeometry(T);
  closed(g, "soil bag");
  const p = g.attributes.position,
    n = g.attributes.normal;
  assert.ok(n.getX(0) * p.getX(0) + n.getZ(0) * p.getZ(0) > 0);
  g.computeBoundingBox();
  assert.ok(g.boundingBox.max.y > 0.98);
});

test("bevelled construction parts remain closed and keep their exact placement bounds", () => {
  const geometry = beveledBoxSurface(T);
  closed(geometry, "bevelled board");
  geometry.computeBoundingBox();
  const size = geometry.boundingBox.getSize(new T.Vector3());
  for (const n of [size.x, size.y, size.z]) assert.ok(Math.abs(n - 1) < 1e-6);
});

test("faceted car shells are closed, outward facing and bounded", () => {
  const rings = [
    [1.61, 0.19, 1.69, -1.69],
    [1.76, 0.32, 1.74, -1.74],
    [1.73, 0.58, 1.67, -1.65],
    [1.55, 0.66, 1.4, -1.47],
  ];
  const g = carShell(T, rings);
  closed(g, "street car");
  const p = g.attributes.position,
    n = g.attributes.normal;
  const middle = new T.Vector3(0, 0.43, 0);
  for (let j = 0; j < p.count; j += 3) {
    const center = new T.Vector3();
    for (let k = 0; k < 3; k++)
      center.add(new T.Vector3().fromBufferAttribute(p, j + k));
    center.divideScalar(3).sub(middle);
    assert.ok(
      center.dot(new T.Vector3().fromBufferAttribute(n, j)) > 0,
      "shell normal is outward",
    );
  }
});

test("street props have independent glass, fittings and bounded detail counts", () => {
  const parts = [],
    surfaces = [],
    kinds = new Set(),
    root = new T.Group();
  const api = {
    T,
    P: { metalDark: "#26323e" },
    surface: (parent, geometry, x, y, z, w, h, d, color, kind) => {
      kinds.add(kind);
      surfaces.push(geometry);
    },
    box: (...p) => parts.push(p),
    cyl: (...p) => parts.push(p),
    beam: (...p) => parts.push(p),
    group: (parent, x = 0, y = 0, z = 0) => {
      const g = new T.Group();
      g.position.set(x, y, z);
      parent.add(g);
      return g;
    },
  };
  buildStreetCar(api, root, "#b6a090");
  buildStreetLantern(api, root);
  assert.ok(kinds.has("panel-glass"));
  assert.ok(kinds.has("livery-car"));
  assert.ok(parts.length < 110, "fittings do not grow into a voxel shell");
  assert.equal(
    surfaces.length,
    10,
    "body, roof, six panes and two door panels",
  );
});

test("cars with different paint reuse the same immutable surfaces for city batching", () => {
  const records = [],
    root = new T.Group();
  const api = {
    T,
    P: { metalDark: "#26323e" },
    box() {},
    cyl() {},
    beam() {},
    surface: (parent, geometry, x, y, z, w, h, d, color, kind) =>
      records.push({ geometry, color, kind }),
    group: (parent, x = 0, y = 0, z = 0) => {
      const g = new T.Group();
      g.position.set(x, y, z);
      parent.add(g);
      return g;
    },
  };
  buildStreetCar(api, root, "#b6a090");
  buildStreetCar(api, root, "#48899d");
  assert.equal(records.length, 20);
  assert.equal(new Set(records.map((r) => r.geometry)).size, 9);
  for (let j = 0; j < 10; j++)
    assert.equal(records[j].geometry, records[j + 10].geometry);
  assert.notEqual(records[0].color, records[10].color);
});

test("the outdoor ground belongs to the city hidden by the indoor view", () => {
  const scene = new T.Scene(),
    city = new T.Group();
  scene.add(city);
  const api = {
    T,
    P: { metalDark: "#26323e", wood: "#b7834c" },
    box() {},
    cyl() {},
    beam() {},
    ellipsoid() {},
    surface() {},
    mat: (color) => new T.MeshBasicMaterial({ color }),
    group: (parent, x = 0, y = 0, z = 0) => {
      const g = new T.Group();
      g.position.set(x, y, z);
      parent.add(g);
      return g;
    },
  };
  buildNeighborhood(api, city, -18.15, () => {});
  const ground = city.getObjectByName("neighborhood-ground");
  assert.ok(ground);
  assert.equal(ground.parent, city);
  assert.equal(
    scene.children.length,
    1,
    "room does not retain a separate outdoor ground",
  );
});

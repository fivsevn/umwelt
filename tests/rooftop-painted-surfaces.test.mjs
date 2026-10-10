import {
  environmentPainting,
  pavingPainting,
} from "../rooftop/3d/environment-paintings.mjs";
import { SCENES, DOORS } from "../rooftop/scene.mjs";
import {
  facePainting,
  FACE_PAINT_KINDS,
} from "../rooftop/3d/face-paintings.mjs";
import { cubeContactPaint } from "../rooftop/3d/contact-paint.mjs";
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
  pixelPainting,
  paintPixels,
  TEXTURE_KINDS,
  pigmentPalette,
  createPixelMaterials,
} from "../rooftop/3d/pixel-materials.mjs";
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
import { weatherDrawing } from "../rooftop/3d/weathering.mjs";
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
test("terrace tiles retain independent faces and local deposits at a shared square scale", () => {
  const paints = ["north", "south"].map((scene) =>
    pavingPainting(480, 390, { scene, points: SCENES[scene].points }),
  );
  for (const art of paints) {
    assert.equal(art.texelsPerUnit, 12);
    const pixels = new Uint8Array(480 * 390),
      colors = new Set();
    for (const [x, y, w, h, i] of art.commands) {
      assert.equal(w, 1);
      assert.equal(h, 1);
      pixels[y * 480 + x] = i;
      colors.add(i);
    }
    assert.ok(
      colors.size >= 11,
      "tile body, grout and compact deposits have distinct pigments",
    );
    const span = art.tileTexels;
    const tile = (tx, ty) =>
      Array.from(
        { length: span * span },
        (_, j) =>
          pixels[
            (ty * span + Math.floor(j / span)) * 480 + tx * span + (j % span)
          ],
      );
    assert.notDeepEqual(
      tile(8, 7),
      tile(9, 7),
      "neighbouring tiles never use one repeated stamp",
    );
    const region = (x0, y0, x1, y1) => {
      let deposits = 0;
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++)
          if (pixels[y * 480 + x] >= 12 && pixels[y * 480 + x] <= 15)
            deposits++;
      return deposits;
    };
    assert.equal(
      region(0, 0, 90, 70),
      0,
      "deposits do not cover unrelated areas",
    );
    assert.ok(
      region(0, 0, 480, 390) < 900,
      "soil and moss stay sparse and localized",
    );
    let mirrored = 0;
    for (let y = 90; y < 260; y++)
      for (let x = 100; x < 330; x++)
        if (pixels[y * 480 + x] === pixels[y * 480 + 479 - x]) mirrored++;
    assert.ok(
      mirrored / (170 * 230) < 0.62,
      "there is no reflected terrace stamp",
    );
  }
  assert.notDeepEqual(
    paints[0].commands,
    paints[1].commands,
    "each terrace has its own painting",
  );
  for (const kind of ["wall", "roof", "brick", "asphalt", "window"]) {
    const art = environmentPainting(kind),
      cells = new Map();
    for (const [x, y, w, h, i] of art.commands) {
      assert.equal(w, 1);
      assert.equal(h, 1);
      const cell =
        Math.floor(x / art.cellWidth) + Math.floor(y / art.cellHeight) * 3;
      if (!cells.has(cell)) cells.set(cell, []);
      cells.get(cell).push(i);
    }
    assert.notDeepEqual(
      cells.get(0),
      cells.get(2),
      kind + " opposite faces differ",
    );
    assert.notDeepEqual(
      cells.get(0),
      cells.get(6),
      kind + " repeated parts differ",
    );
    assert.ok(
      new Set(cells.get(0)).size >= 3,
      kind + " has local light and dark",
    );
  }
});
test("terrace repairs are separate rectangular blocks with sixty and forty percent coverage and intact tiled entries", () => {
  for (const scene of ["north", "south"]) {
    const points = SCENES[scene].points,
      art = pavingPainting(480, 390, { scene, points }),
      mask = art.repairMask;
    const floorArea =
      (Math.abs(
        points.reduce((sum, a, j) => {
          const b = points[(j + 1) % points.length];
          return sum + a[0] * b[1] - b[0] * a[1];
        }, 0),
      ) /
        2) *
      0.75 ** 2;
    const count = mask.reduce((sum, n) => sum + n, 0);
    for (const [region, ratio, label] of [
      [mask, 0.6, "first pour"],
      [art.coatMask, 0.4, "second pour"],
    ]) {
      const area = region.reduce((sum, n) => sum + n, 0);
      assert.ok(
        Math.abs(area / floorArea - ratio) < 0.001,
        scene + " " + label + " covers its share of the usable floor",
      );
      const visited = new Uint8Array(region.length),
        components = [];
      for (let start = 0; start < region.length; start++)
        if (region[start] && !visited[start]) {
          const queue = [start];
          visited[start] = 1;
          let minX = 480,
            minY = 390,
            maxX = 0,
            maxY = 0;
          for (let head = 0; head < queue.length; head++) {
            const i = queue[head],
              x = i % 480,
              y = Math.floor(i / 480);
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            for (const next of [
              x > 0 ? i - 1 : -1,
              x < 479 ? i + 1 : -1,
              y > 0 ? i - 480 : -1,
              y < 389 ? i + 480 : -1,
            ])
              if (next >= 0 && region[next] && !visited[next]) {
                visited[next] = 1;
                queue.push(next);
              }
          }
          assert.equal(
            queue.length,
            (maxX - minX + 1) * (maxY - minY + 1),
            "each repair has straight cut edges rather than a spreading contour",
          );
          components.push(queue.length);
        }
      assert.equal(
        components.length,
        ratio === 0.6 ? 5 : scene === "north" ? 3 : 4,
        scene + " " + label + " occurs in separated repair areas",
      );
      if (ratio === 0.6)
        assert.ok(
          Math.max(...components) / floorArea > 0.15,
          "the repairs include a substantial block rather than scattered speckles",
        );
    }
    assert.ok(
      art.coatMask.every((n, i) => !n || mask[i]),
      "the second pour stays on the first one",
    );
    assert.ok(
      new Set(art.repairBlockIds).size >= 6 &&
        new Set(art.coatBlockIds).size >= 6,
      "large repairs are further divided into separately worked blocks",
    );
    const door = DOORS[scene],
      dx = door.x + door.w / 2,
      dy = door.y + door.h / 2;
    for (let yy = dy - 8; yy <= dy + 8; yy++)
      for (let xx = dx - 8; xx <= dx + 8; xx++) {
        const i = Math.floor(yy * 0.75) * 480 + Math.floor(xx * 0.75);
        assert.equal(mask[i], 0, "tiles around the entry remain in place");
      }
    const pigments = new Set(),
      secondPigments = new Set();
    let cementPaint = 0,
      secondPaint = 0;
    for (const [x, y, , , ink] of art.commands)
      if (mask[y * 480 + x]) {
        if (ink >= 16 && ink <= 22) {
          cementPaint++;
          pigments.add(ink);
        }
        if (ink >= 26 && ink <= 32) {
          cementPaint++;
          secondPaint++;
          secondPigments.add(ink);
        }
        assert.ok(
          ink < 9 || ink > 11,
          "no old grout survives under the cement",
        );
      }
    assert.ok(
      cementPaint / count > 0.97,
      "small local deposits leave the resurfaced area visibly cement",
    );
    assert.ok(
      pigments.size >= 4,
      "cement retains several adjacent light and dark tones",
    );
    assert.ok(
      secondPaint / floorArea > 0.38 && secondPaint / floorArea < 0.41,
      "the second grey is actually painted over forty percent",
    );
    assert.ok(
      secondPigments.size >= 4,
      "the second pour has its own adjacent grey range",
    );
  }
});
test("large environment faces keep physical texel scale while room plaster stays free of outdoor deposits", () => {
  const saved = globalThis.document;
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({ clearRect() {}, fillRect() {} }),
    }),
  };
  try {
    const mats = createPixelMaterials(T, { value: 0 }, { value: 0 });
    for (const kind of ["wall", "room-wall", "roof", "asphalt", "window"]) {
      const m = mats.mat("#c7c2b5", kind),
        shader = {
          vertexShader: T.ShaderLib.lambert.vertexShader,
          fragmentShader: T.ShaderLib.lambert.fragmentShader,
          uniforms: {},
        };
      m.onBeforeCompile(shader);
      assert.ok(
        !shader.fragmentShader.includes("${"),
        "all shader expressions are resolved",
      );
      assert.ok(
        !/surface\/\d+\)/.test(shader.fragmentShader),
        "metric GLSL divisors stay floats when the ratio is an integer",
      );
      if (kind !== "window")
        assert.ok(
          shader.fragmentShader.includes("faceUv*faceSpan*12.0/48.0"),
          "large planes do not stretch the texture",
        );
      if (kind === "room-wall")
        assert.ok(
          !shader.fragmentShader.includes("vec3 dirt="),
          "indoor plaster is not covered in outdoor soil",
        );
    }
  } finally {
    globalThis.document = saved;
  }
});

test("museum vessels preserve measured proportions and place interior paint on a planar field", () => {
  const ratios = {
    "antique-shino": 6.4 / 14,
    "antique-nezumi": 5.8 / 7,
    "antique-shino-square": 9.2 / 4.25,
    "antique-nabeshima": 10.2 / 10.65,
    "antique-nabeshima-dish": 5.1 / 10.3,
    "antique-celadon": 8.26 / 14.445,
    "antique-oribe-jar": 20.8 / 10.8,
  };
  for (const [id, ratio] of Object.entries(ratios)) {
    const pot = POTS.find((p) => p.id === id),
      d = vesselDimensions(pot, 1);
    // Rounded square's mouth is .95 of the radial profile along its two axes.
    const axis = id === "antique-shino-square" ? 0.95 : 1;
    assert.ok(
      Math.abs((d.h + d.foot) / (d.r * axis) - ratio) < 0.025,
      id + " museum H/radius",
    );
  }
  for (const p of POTS.filter((p) => p.antique)) {
    const art = pixelPainting("vessel-" + p.id),
      pixels = new Uint8Array(art.width * art.height);
    for (const [x, y, w, h, i] of art.commands) {
      assert.equal(w, 1);
      assert.equal(h, 1);
      pixels[y * 64 + x] = i;
    }
    assert.notDeepEqual(
      pixels.slice(0, 4096),
      pixels.slice(4096),
      p.id + " inside is not the exterior stamp",
    );
    const shells = [];
    buildVessel(
      {
        box() {},
        beam() {},
        shade: (c) => c,
        profile(g, points, sides, color, kind, shape) {
          if (kind === "vessel-" + p.id)
            shells.push(latheSurface(T, points, sides, shape));
        },
      },
      {},
      p,
      0.67,
      0.58,
      { empty: true },
    );
    const body = shells[0],
      uv = body.attributes.paintInteriorUv,
      pos = body.attributes.position;
    assert.equal(uv.count, pos.count);
    const radius = Math.max(
      ...Array.from({ length: pos.count }, (_, j) =>
        Math.hypot(pos.getX(j), pos.getZ(j)),
      ),
    );
    assert.ok(Array.from(uv.array).every(Number.isFinite));
    for (let j = 0; j < uv.count; j++)
      if (Math.hypot(pos.getX(j), pos.getZ(j)) < radius * 0.08)
        assert.ok(
          Math.abs(uv.getX(j) - 0.5) < 0.08 &&
            Math.abs(uv.getY(j) - 0.5) < 0.08,
          "inner floor shares its centre",
        );
  }
  assert.equal(VESSEL_ART["antique-celadon"].maskFeet, true);
  const square = pixelPainting("vessel-antique-shino-square");
  const sectors = Array.from({ length: 4 }, (_, j) =>
    square.commands
      .filter((c) => c[1] < 64 && Math.floor(c[0] / 16) === j)
      .map((c) => [c[0] % 16, c[1], c[4]]),
  );
  for (let j = 1; j < 4; j++)
    assert.notDeepEqual(
      sectors[0],
      sectors[j],
      "each side has its own iron drawing",
    );
});

test("antique interior programs retain compositions instead of shifting them by seed", () => {
  const saved = globalThis.document;
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({ clearRect() {}, fillRect() {} }),
    }),
  };
  try {
    const materials = createPixelMaterials(T, { value: 0 }, { value: 0 }),
      a = materials.mat("#e2e9e0", "vessel-antique-nabeshima-dish"),
      b = materials.mat("#b0714e", "vessel-terra");
    assert.notEqual(a.customProgramCacheKey(), b.customProgramCacheKey());
    assert.equal(a.map.flipY, false);
    const shader = {
      vertexShader: T.ShaderLib.lambert.vertexShader,
      fragmentShader: T.ShaderLib.lambert.fragmentShader,
      uniforms: {},
    };
    a.onBeforeCompile(shader);
    assert.ok(
      shader.fragmentShader.includes("squarePaintUv(vPaintInteriorUv)"),
    );
    assert.ok(!shader.fragmentShader.includes("innerUv.x+vPaintSeed"));
    assert.ok(
      !shader.fragmentShader.includes("${"),
      "all shader substitutions are resolved",
    );
  } finally {
    globalThis.document = saved;
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
test("all painted material tiles use deterministic integer texels and bounded palettes", () => {
  const kinds = [
    ...TEXTURE_KINDS,
    ...new Set(POTS.map((p) => "pot-" + p.pattern)),
    ...POTS.map((p) => "vessel-" + p.id),
  ];
  const signatures = new Set();
  for (const kind of kinds) {
    const tile = pixelPainting(kind);
    assert.deepEqual(tile, pixelPainting(kind), kind + " deterministic");
    assert.ok(
      [16, 32, 64].includes(tile.size),
      kind + " face grids include coarse small window panes",
    );
    assert.ok(tile.ramp.length <= 20, kind + " bounded palette");
    for (const [x, y, w, h, ink] of tile.commands) {
      assert.ok(
        [x, y, w, h, ink].every(Number.isInteger),
        kind + " whole pixels",
      );
      assert.ok(
        w > 0 && h > 0 && ink >= 0 && ink < tile.ramp.length,
        kind + " valid paint",
      );
    }
    signatures.add(JSON.stringify(tile));
  }
  assert.ok(signatures.size >= 18, "distinct material construction details");
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

test("paint uses the selected base pigment once and preserves ceramic motif colors", () => {
  const wood = pigmentPalette("wood", "#89663e");
  assert.equal(wood[6], "#89663e");
  assert.notEqual(wood[0], wood[4]);
  const pot = pigmentPalette("pot-blue", "#d6cdb7");
  assert.equal(pot[9], pixelPainting("pot-blue").ramp[9]);
});

test("living and manufactured surfaces use distinct shadow and highlight pigments", () => {
  const tint = "#71875a",
    leaf = pigmentPalette("leaf", tint),
    metal = pigmentPalette("metal", tint);
  assert.equal(leaf[6], tint);
  assert.equal(metal[6], tint);
  assert.notEqual(leaf[0], metal[0]);
  assert.notEqual(leaf[8], metal[8]);
  const green = (hex) => parseInt(hex.slice(3, 5), 16),
    blue = (hex) => parseInt(hex.slice(5, 7), 16);
  assert.ok(
    green(leaf[8]) - blue(leaf[8]) > green(metal[8]) - blue(metal[8]),
    "leaf highlights keep their yellow-green pigment",
  );
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

test("outdoor deposits occupy compact source areas instead of scattering across every face", () => {
  for (const kind of ["metal", "wood", "paint", "face-board"]) {
    const art = facePainting(kind),
      aged = weatherDrawing(art, kind),
      cw = art.cellWidth,
      ch = art.cellHeight,
      patches = new Map();
    for (const [x, y, w, h, ink] of aged.commands)
      if (ink >= 13) {
        const face = Math.floor(x / cw) + Math.floor(y / ch) * 3;
        if (!patches.has(face)) patches.set(face, []);
        patches.get(face).push([x % cw, y % ch]);
        assert.equal(w, 1);
        assert.equal(h, 1);
      }
    assert.ok(patches.size > 0, "some parts show actual deposits");
    assert.ok(patches.size < art.variants * 6, "clean faces remain");
    for (const points of patches.values()) {
      const xs = points.map((p) => p[0]),
        ys = points.map((p) => p[1]);
      assert.ok(Math.max(...xs) - Math.min(...xs) <= Math.ceil(cw * 0.26));
      assert.ok(Math.max(...ys) - Math.min(...ys) <= Math.ceil(ch * 0.28));
      assert.ok(
        points.length < cw * ch * 0.065,
        "small deposits leave the material drawing visible",
      );
    }
  }
});

test("aquarium side walls are transparent and do not write depth over the fish", () => {
  const g = new T.Group(),
    parts = [];
  buildAquarium({ T, box: (...args) => parts.push(args) }, g, 2.25, 1.8, 1.56);
  assert.equal(g.children.length, 5);
  for (const mesh of g.children) {
    assert.ok(mesh.material.transparent && mesh.material.opacity < 0.2);
    assert.equal(mesh.material.depthWrite, false);
  }
  assert.ok(parts.length > 8, "thin actual frame remains pickable");
});

test("the GPU selects paint after instance color exactly once and separates material programs", () => {
  const saved = globalThis.document;
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({ clearRect() {}, fillRect() {} }),
    }),
  };
  try {
    const materials = createPixelMaterials(T, { value: 0 }, { value: 0 });
    const clay = materials.mat("#b0714e", "vessel-terra"),
      leaf = materials.mat("#71875a", "leaf");
    assert.notEqual(
      materials.mat("#50402d", "soil").customProgramCacheKey(),
      materials.mat("#ae6c48", "clay").customProgramCacheKey(),
      "different wetness and pigment shader branches cannot share a program",
    );
    assert.notEqual(clay.customProgramCacheKey(), leaf.customProgramCacheKey());
    assert.notEqual(
      clay.customProgramCacheKey(),
      materials.mat("#ffffff", "enamel").customProgramCacheKey(),
    );
    const shader = {
      vertexShader: "#include <begin_vertex>",
      fragmentShader:
        "#include <map_fragment>\n#include <color_fragment>\n#include <dithering_fragment>",
      uniforms: {},
    };
    clay.onBeforeCompile(shader);
    assert.equal(
      shader.fragmentShader.match(/diffuseColor\.rgb \*= vColor/g).length,
      1,
    );
    assert.ok(
      shader.fragmentShader.indexOf("diffuseColor.rgb *= vColor") <
        shader.fragmentShader.indexOf("float gray"),
    );
    assert.ok(shader.vertexShader.includes("vPaintSeed=paintSeed"));
    assert.ok(shader.vertexShader.includes("vPaintVariant=paintVariant"));
  } finally {
    globalThis.document = saved;
  }
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

test("contact paint darkens an enclosed face and stays clear on exposed faces", () => {
  const cube = new T.BoxGeometry(1, 1, 1),
    m = { userData: { kind: "wood" } },
    part = { geo: cube, m, matrix: new T.Matrix4() },
    over = {
      geo: cube,
      m,
      matrix: new T.Matrix4().makeTranslation(0, 1.015, 0),
    };
  const masks = cubeContactPaint(T, [part, over], cube);
  assert.equal(masks.get(part).positive[1], 1);
  assert.equal(masks.get(part).negative[1], 0);
  assert.equal(masks.get(part).positive[0], 0);
  assert.equal(masks.get(over).negative[1], 1);
});

test("shaded blue paint retains its hue and white enamel stays neutral", () => {
  const channels = (hex) =>
    [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  for (const hex of pigmentPalette("metal", "#398db5")) {
    const [r, g, b] = channels(hex);
    assert.ok(b > g && g > r, "blue is not replaced by a shared gray shadow");
  }
  const [r, g, b] = channels(pigmentPalette("enamel", "#e8e8e8")[8]);
  assert.ok(
    Math.max(r, g, b) - Math.min(r, g, b) < 5,
    "white highlight does not become yellow",
  );
});

test("opposite box faces retain distinct bounded paintings", () => {
  for (const kind of FACE_PAINT_KINDS) {
    const art = facePainting(kind),
      cw = art.cellWidth,
      ch = art.cellHeight;
    const pixels = new Uint8Array(art.width * art.height);
    for (const [x, y, w, h, ink] of art.commands)
      for (let yy = Math.max(0, y); yy < Math.min(art.height, y + h); yy++)
        for (let xx = Math.max(0, x); xx < Math.min(art.width, x + w); xx++)
          pixels[yy * art.width + xx] = ink;
    const faces = Array.from({ length: 6 }, (_, f) =>
      Array.from(
        { length: cw * ch },
        (_, j) =>
          pixels[
            (Math.floor(f / 3) * ch + Math.floor(j / cw)) * art.width +
              (f % 3) * cw +
              (j % cw)
          ],
      ),
    );
    for (const [a, b] of [
      [0, 2],
      [1, 3],
      [4, 5],
    ])
      assert.notDeepEqual(
        faces[a],
        faces[b],
        kind + " opposite faces have separate detail",
      );
    for (const face of faces)
      assert.ok(
        new Set(face).size >= 3,
        kind + " retains authored value structure",
      );
  }
});

test("box, wrapped and round drawings compile distinct projection programs", () => {
  const saved = globalThis.document;
  globalThis.document = {
    createElement: () => ({
      width: 0,
      height: 0,
      getContext: () => ({ clearRect() {}, fillRect() {} }),
    }),
  };
  try {
    const art = createPixelMaterials(T, { value: 0 }, { value: 0 });
    const board = art.mat("#a58052", "face-board"),
      cabinet = art.mat("#a58052", "face-cabinet");
    assert.notEqual(
      board.customProgramCacheKey(),
      cabinet.customProgramCacheKey(),
    );
    assert.notEqual(
      art.mat("#929c9c", "round-metal").customProgramCacheKey(),
      art.mat("#929c9c", "wrap-metal").customProgramCacheKey(),
    );
    const shader = {
      vertexShader: T.ShaderLib.lambert.vertexShader,
      fragmentShader: T.ShaderLib.lambert.fragmentShader,
      uniforms: {},
    };
    art.mat("#929c9c", "round-metal").onBeforeCompile(shader);
    assert.ok(shader.fragmentShader.includes("float roundFace"));
    assert.ok(
      !shader.fragmentShader.includes("float cell;"),
      "round table never uses a box face projection",
    );
    assert.equal(art.texture("face-board").image.width, 96);
    assert.equal(art.texture("face-board").image.height, 512);
  } finally {
    globalThis.document = saved;
  }
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

test("all material programs resolve atlas dimensions before GLSL compilation", () => {
  const saved = globalThis.document;
  globalThis.document = {
    createElement: () => ({
      width: 0,
      height: 0,
      getContext: () => ({ clearRect() {}, fillRect() {} }),
    }),
  };
  try {
    const art = createPixelMaterials(T, { value: 0 }, { value: 0 });
    for (const kind of [
      ...TEXTURE_KINDS,
      ...POTS.map((p) => "vessel-" + p.id),
    ]) {
      const shader = {
        vertexShader: T.ShaderLib.lambert.vertexShader,
        fragmentShader: T.ShaderLib.lambert.fragmentShader,
        uniforms: {},
      };
      art.mat("#b0714e", kind).onBeforeCompile(shader);
      assert.ok(
        !shader.fragmentShader.includes("$" + "{"),
        kind + " resolved atlas dimensions",
      );
      assert.ok(
        !shader.vertexShader.includes("$" + "{"),
        kind + " resolved instance attributes",
      );
    }
  } finally {
    globalThis.document = saved;
  }
});

test("program sharing requires identical full shader source and preserves per-material uniforms", () => {
  const saved = globalThis.document;
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({ clearRect() {}, fillRect() {} }),
    }),
  };
  try {
    const style = createPixelMaterials(T, { value: 0 }, { value: 0 }),
      sources = new Map();
    for (const kind of [
      ...TEXTURE_KINDS,
      ...POTS.map((p) => "vessel-" + p.id),
    ]) {
      const m = style.mat("#b0714e", kind),
        probe = {
          vertexShader: T.ShaderLib.lambert.vertexShader,
          fragmentShader: T.ShaderLib.lambert.fragmentShader,
          uniforms: {},
        };
      m.onBeforeCompile(probe);
      const key = m.customProgramCacheKey(),
        source = probe.vertexShader + "\n" + probe.fragmentShader;
      if (sources.has(key))
        assert.equal(
          source,
          sources.get(key),
          kind + " never merges distinct shader branches",
        );
      sources.set(key, source);
    }
    assert.ok(
      sources.size < TEXTURE_KINDS.length,
      "many authored drawings reuse GPU code",
    );
    const a = style.mat("#a0aaa4", "metal"),
      b = style.mat("#816d55", "round-metal");
    assert.notEqual(a.customProgramCacheKey(), b.customProgramCacheKey());
    assert.equal(
      style.mat("#52432a", "vessel-tokoname").customProgramCacheKey(),
      style.mat("#ffffff", "vessel-arita").customProgramCacheKey(),
      "different pigments and authored ceramics share identical projection code",
    );
  } finally {
    globalThis.document = saved;
  }
});

test("bulk texture upload preserves the exact painted RGBA pixels", () => {
  for (const kind of [
    "wood",
    "wall",
    "wrap-metal",
    "weather-metal",
    "vessel-antique-shino",
    "panel-ac",
    "resident-face",
  ])
    for (const encode of [false, true]) {
      const art = pixelPainting(kind),
        width = art.width || art.size,
        height = art.height || art.size;
      const expected = new Uint8ClampedArray(width * height * 4);
      const slow = {
        clearRect() {
          expected.fill(0);
        },
        fillRect(x, y, w, h) {
          const value = parseInt(this.fillStyle.slice(1), 16);
          for (let yy = Math.max(0, y); yy < Math.min(height, y + h); yy++)
            for (let xx = Math.max(0, x); xx < Math.min(width, x + w); xx++)
              expected.set(
                [value >>> 16, (value >>> 8) & 255, value & 255, 255],
                (yy * width + xx) * 4,
              );
        },
      };
      paintPixels(slow, kind, undefined, encode);
      let actual;
      const fast = {
        clearRect() {},
        createImageData(w, h) {
          return { data: new Uint8ClampedArray(w * h * 4) };
        },
        putImageData(data) {
          actual = data.data;
        },
        fillRect() {
          assert.fail("opaque integer art must take the upload path");
        },
      };
      paintPixels(fast, kind, undefined, encode);
      assert.deepEqual(
        actual,
        expected,
        kind + (encode ? " encoded" : " coloured"),
      );
    }
});

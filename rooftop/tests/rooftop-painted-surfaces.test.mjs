import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { facePainting, FACE_PAINT_KINDS } from "../3d/face-paintings.mjs";
import { weatherDrawing } from "../3d/weathering.mjs";
import { buildResident, buildPig } from "../3d/residents.mjs";
import { OUTFITS, DECORATIONS, wardrobe } from "../wardrobe.mjs";
const context = { console: { warn() {} } };
vm.runInNewContext(
  readFileSync(new URL("../3d/vendor/three.min.js", import.meta.url), "utf8"),
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
    makeNativeItem(parent, type) {
      assert.equal(type, "watering-can", "resident hand prop uses the new native catalog");
      const model = new T.Group(); parent.add(model); count++; return model;
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

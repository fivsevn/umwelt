import test from "node:test";
import assert from "node:assert/strict";
import { ASSETS, initialLayout, validateLayout } from "../rooftop/scene.mjs";
import { PLANTS, POTS } from "../rooftop/botany.mjs";
import { MODEL_REFERENCES } from "../rooftop/object-references.mjs";
import { OBJECT_DIMENSIONS } from "../rooftop/3d/object-models.mjs";
import { PLANT_FORMS, buildFoliage } from "../rooftop/3d/plant-models.mjs";
import { VESSEL_SHAPES, buildVessel } from "../rooftop/3d/vessel-models.mjs";

function recording() {
  const parts = [];
  const api = {
    box(g, x, y, z, w, h, d, color) {
      assert.ok([x, y, z, w, h, d].every(Number.isFinite));
      assert.ok(w > 0 && h > 0 && d > 0);
      parts.push([x, y, z, w, h, d, color]);
    },
    group() {
      return { position: {}, rotation: {}, userData: {} };
    },
    shade(c) {
      return c;
    },
    rng(seed) {
      let s = seed;
      return () =>
        (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
    },
    beam(g, a, b, w, color) {
      api.box(
        g,
        ...a,
        w,
        Math.hypot(...b.map((v, i) => v - a[i])) || w,
        w,
        color,
      );
    },
    ellipsoid(g, x, y, z, rx, ry, rz, color) {
      api.box(g, x, y, z, rx * 2, ry * 2, rz * 2, color);
    },
  };
  return { api, parts };
}
test("removed cloche disappears without resetting old layouts or deleting its contents", () => {
  assert.ok(!ASSETS.some((a) => a.id === "browncover"));
  const layout = initialLayout(),
    original = structuredClone(layout);
  layout.scenes.north.push({
    id: "retired-cover",
    type: "browncover",
    x: 312,
    y: 240,
    rotation: 0,
    scale: 1,
  });
  assert.deepEqual(validateLayout(layout), original);
  const old = {
    version: 2,
    spaceVersion: 1,
    roomVersion: 2,
    scenes: {
      north: [
        {
          id: "cover",
          type: "browncover",
          x: 312,
          y: 240,
          rotation: 0,
          scale: 1,
        },
        {
          id: "kept-gloves",
          type: "gloves",
          x: 312,
          y: 240,
          rotation: 0,
          scale: 0.5,
          support: { id: "cover", surface: "inside" },
        },
      ],
      south: [],
      room: [],
    },
  };
  const migrated = validateLayout(old);
  assert.equal(migrated.scenes.north.length, 1);
  assert.equal(migrated.scenes.north[0].id, "kept-gloves");
  assert.equal(migrated.scenes.north[0].support, null);
  assert.deepEqual(validateLayout(migrated), migrated);
});
test("every catalog item retains references and has a defined 3D construction", () => {
  assert.equal(ASSETS.length, 304);
  for (const a of ASSETS) {
    assert.ok(a.sources?.length, a.id + " reference");
    if (a.plant) assert.ok(PLANT_FORMS.has(a.form), a.id);
    else if (a.vessel)
      assert.ok(
        VESSEL_SHAPES.has(POTS.find((p) => p.id === a.vessel).shape),
        a.id,
      );
    else if (!a.weapon) {
      assert.ok(OBJECT_DIMENSIONS[a.id], a.id);
      assert.ok(MODEL_REFERENCES[a.id], a.id);
    }
  }
});
test("all botanical forms generate finite, deterministic geometry and preserve species arrangement", () => {
  for (const p of PLANTS) {
    const a = recording(),
      b = recording();
    buildFoliage(a.api, {}, p, { seed: 1835 });
    buildFoliage(b.api, {}, p, { seed: 1835 });
    assert.ok(a.parts.length > 10, p.id);
    assert.deepEqual(a.parts, b.parts, p.id + " deterministic seed");
  }
  const fan = recording();
  buildFoliage(
    fan.api,
    {},
    PLANTS.find((p) => p.form === "exp-fan"),
    { seed: 1 },
  );
  const bodies = fan.parts.filter((p) => p[3] > 0.2 && p[4] > 0.2);
  assert.equal(bodies.length, 7, "seven leaves in two rows");
  assert.equal(new Set(bodies.map((p) => p[2])).size, 2, "opposed rows");
  const split = recording();
  buildFoliage(
    split.api,
    {},
    PLANTS.find((p) => p.form === "exp-stones"),
    { seed: 1 },
  );
  assert.equal(
    split.parts.filter((p) => p[3] > 0.4 && p[4] > 0.2).length,
    2,
    "paired lithops bodies",
  );
});
test("all vessels have hollow walls, finite surfaces and varied silhouettes", () => {
  const signatures = new Set();
  for (const p of POTS) {
    const model = recording();
    const h = buildVessel(model.api, {}, p, 0.46, 0.38, { empty: true });
    assert.ok(h > 0);
    assert.ok(model.parts.length >= 8, p.id);
    signatures.add(JSON.stringify(model.parts));
  }
  assert.equal(signatures.size, POTS.length);
});

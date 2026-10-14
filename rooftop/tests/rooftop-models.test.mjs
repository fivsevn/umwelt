import test from "node:test";
import assert from "node:assert/strict";
import { ASSETS, initialLayout, validateLayout } from "../scene.mjs";
import { PLANTS, POTS } from "../botany.mjs";

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
          id: "kept-towel",
          type: "towel",
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
  assert.equal(migrated.scenes.north[0].id, "kept-towel");
  assert.equal(migrated.scenes.north[0].support, null);
  assert.deepEqual(validateLayout(migrated), migrated);
});
test("every catalog item retains references and has a defined 3D construction", () => {
  assert.equal(ASSETS.length, 294);
  for (const a of ASSETS) {
    assert.ok(a.file.startsWith("assets/items/"),a.id);
    assert.ok(a.modelId&&a.modelSha256&&a.triangles>0,a.id);
    if(a.plant) assert.ok(PLANTS.find(p=>p.id===a.id),a.id);
    else if(a.vessel) assert.ok(POTS.find(p=>p.id===a.vessel),a.id);
    assert.ok(a.width>0&&a.depth>0&&a.height>0,a.id);
    assert.equal(a.source,"Blender + Pixelorama");
  }
});

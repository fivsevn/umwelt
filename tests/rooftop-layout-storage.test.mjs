import test from "node:test";
import assert from "node:assert/strict";
import { LAYOUT_KEY, readLayout, readObservationLayout } from "../rooftop/layout-storage.mjs";
import { initialLayout, validateLayout } from "../rooftop/scene.mjs";

function fixtureLayout() {
  const saved = validateLayout(initialLayout());
  for (const [scene, objects] of Object.entries(saved.scenes)) {
    const ids = new Map(objects.map((object, index) => [object.id, "saved-" + scene + "-" + index]));
    for (const object of objects) {
      object.id = ids.get(object.id);
      if (object.support) object.support.id = ids.get(object.support.id);
    }
  }
  return validateLayout(saved);
}

function readonlyStorage(raw) {
  return {
    getItem(key) {
      assert.equal(key, LAYOUT_KEY);
      return raw;
    },
    setItem() { assert.fail("observation must not rewrite saved storage"); },
  };
}

test("empty observation preserves saved room identities and metadata without altering stored bytes", () => {
  const saved = fixtureLayout(), raw = JSON.stringify(saved, null, 2), storage = readonlyStorage(raw);
  const shown = readObservationLayout(storage);
  assert.deepEqual(shown.scenes.north, []);
  assert.deepEqual(shown.scenes.south, []);
  assert.deepEqual(shown.scenes.room, saved.scenes.room);
  assert.equal(shown.version, saved.version);
  assert.equal(shown.roomVersion, saved.roomVersion);
  assert.equal(shown.spaceVersion, saved.spaceVersion);
  assert.equal(storage.getItem(LAYOUT_KEY), raw);
  assert.deepEqual(readLayout(storage), saved, "the garage still reads the original furnished layout");
});

test("saved terrace contents never enter observation validation or replace a valid saved room", () => {
  const saved = fixtureLayout();
  saved.scenes.north = [{ id: "invalid-north", type: "removed-asset" }];
  saved.scenes.south = "invalid terrace data";
  const raw = JSON.stringify(saved), storage = readonlyStorage(raw);
  const shown = readObservationLayout(storage);
  assert.deepEqual(shown.scenes.north, []);
  assert.deepEqual(shown.scenes.south, []);
  assert.deepEqual(shown.scenes.room, saved.scenes.room);
  assert.equal(storage.getItem(LAYOUT_KEY), raw);
});

test("a new player starts with empty observation terraces and the existing default room", () => {
  const shown = readObservationLayout(readonlyStorage(null));
  assert.deepEqual(shown.scenes.north, []);
  assert.deepEqual(shown.scenes.south, []);
  assert.deepEqual(shown.scenes.room, initialLayout().scenes.room);
  assert.equal(shown.roomVersion, 2);
  assert.equal(shown.spaceVersion, 1);
});

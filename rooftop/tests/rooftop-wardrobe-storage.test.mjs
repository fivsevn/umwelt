import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../wardrobe.mjs", import.meta.url), "utf8")
  .replace(/^export\s+/gm, "");
const gameKey = "umwelt-dongdong-wardrobe-v1";
const previewKey = "umwelt-dongdong-wardrobe-preview-v1";
const gameSave = JSON.stringify({ outfit: "sage", pig: "scarf" });
const previewSave = JSON.stringify({ outfit: "clay", pig: "ribbon" });

function load(pathname) {
  const storage = () => {
    const values = new Map([[gameKey, gameSave], [previewKey, previewSave]]);
    return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  };
  const localStorage = storage(), sessionStorage = storage();
  const api = runInNewContext(`${source}\n({ wardrobe, dress });`, {
    location: { pathname }, localStorage, sessionStorage,
    performance: { getEntriesByType: () => [{ type: "navigate" }] },
  });
  return { api, localStorage, sessionStorage };
}

test("the actor preview loads and changes only its own wardrobe save", () => {
  const { api, localStorage, sessionStorage } = load("/rooftop/art/rooftop-actors-02/preview/index.html");
  assert.equal(JSON.stringify(api.wardrobe), previewSave);
  api.dress("outfit", "blue");
  api.dress("pig", "flower");
  for (const storage of [localStorage, sessionStorage]) {
    assert.equal(storage.getItem(gameKey), gameSave);
    assert.deepEqual(JSON.parse(storage.getItem(previewKey)), { outfit: "blue", pig: "flower" });
  }
});

test("public rooftop, garage and room routes continue sharing the player wardrobe", () => {
  for (const path of ["/rooftop/", "/rooftop/arrange/", "/rooftop/room/"]) {
    const { api, localStorage, sessionStorage } = load(path);
    assert.equal(JSON.stringify(api.wardrobe), gameSave, path);
    api.dress("outfit", "blue");
    for (const storage of [localStorage, sessionStorage]) {
      assert.deepEqual(JSON.parse(storage.getItem(gameKey)), { outfit: "blue", pig: "scarf" }, path);
      assert.equal(storage.getItem(previewKey), previewSave, path);
    }
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

import {LOOKS,LOOK_BY_ID,DEFAULT_LOOK} from '../fashion/catalog.mjs';
const source = readFileSync(new URL("../wardrobe.mjs", import.meta.url), "utf8")
  .replace(/^import .*$/gm, "")
  .replace(/^export\s+/gm, "");
const gameKey = "umwelt-dongdong-wardrobe-v1";
const previewKey = "umwelt-dongdong-wardrobe-preview-v1";
const gameSave = JSON.stringify({ outfit: "smoking", pig: "smoking" });
const previewSave = JSON.stringify({ outfit: "tang", pig: "tang" });

function load(pathname, saved=gameSave, nav="navigate") {
  const storage = () => {
    const values = new Map([[gameKey, saved], [previewKey, previewSave]]);
    return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  };
  const localStorage = storage(), sessionStorage = storage();
  const api = runInNewContext(`${source}\n({ wardrobe, dress, normalizeWardrobe });`, {
    LOOKS,LOOK_BY_ID,DEFAULT_LOOK,location: { pathname }, localStorage, sessionStorage,
    performance: { getEntriesByType: () => [{ type: nav }] },
  });
  return { api, localStorage, sessionStorage };
}

test("the actor preview loads and changes only its own wardrobe save", () => {
  const { api, localStorage, sessionStorage } = load("/rooftop/art/rooftop-actors-02/preview/index.html");
  assert.equal(JSON.stringify(api.wardrobe), previewSave);
  api.dress("outfit", "denim");
  api.dress("pig", "bar");
  for (const storage of [localStorage, sessionStorage]) {
    assert.equal(storage.getItem(gameKey), gameSave);
    assert.deepEqual(JSON.parse(storage.getItem(previewKey)), { outfit: "denim", pig: "bar" });
  }
});

test("public rooftop, garage and room routes continue sharing the player wardrobe", () => {
  for (const path of ["/rooftop/", "/rooftop/arrange/", "/rooftop/room/"]) {
    const { api, localStorage, sessionStorage } = load(path);
    assert.equal(JSON.stringify(api.wardrobe), gameSave, path);
    api.dress("outfit", "denim");
    for (const storage of [localStorage, sessionStorage]) {
      assert.deepEqual(JSON.parse(storage.getItem(gameKey)), { outfit: "denim", pig: "denim" }, path);
      assert.equal(storage.getItem(previewKey), previewSave, path);
    }
  }
});

test('retired saves migrate, reloads choose a new matching pair, and unknown keys are rejected',()=>{
  const old=JSON.stringify({outfit:'sage',pig:'scarf'});
  const {api}=load('/rooftop/room/',old);
  assert.equal(JSON.stringify(api.wardrobe),JSON.stringify({outfit:'smoking',pig:'smoking'}));
  assert.equal(api.normalizeWardrobe({outfit:'toString',pig:'constructor'}),null);
  api.dress('outfit','denim');api.dress('pig','bar');assert.equal(api.wardrobe.pig,'bar');
  api.dress('outfit','toString');assert.equal(api.wardrobe.outfit,'denim');
  for(let i=0;i<20;i++){const {api:next}=load('/rooftop/',gameSave,'reload');assert.notEqual(next.wardrobe.outfit,'smoking');assert.equal(next.wardrobe.pig,next.wardrobe.outfit);}
});

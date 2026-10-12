import test from "node:test";
import assert from "node:assert/strict";
import { LAYOUT_KEY, readLayout, readObservationLayout, writeLayout } from "../rooftop/layout-storage.mjs";
import { initialLayout, validateLayout } from "../rooftop/scene.mjs";

function fixtureLayout() {
  const initial=initialLayout();
  initial.scenes.room=[{id:"room-plant",type:"mint",x:300,y:230,scale:1,rotation:90,pot:"foam",seed:123,support:null}];
  initial.scenes.north=[{id:"north-rack",type:"iron-3-black",x:312,y:240,scale:1,rotation:0,support:null},
    {id:"north-plant",type:"barrel",x:312,y:240,scale:1,rotation:0,seed:6,pot:"plastic",support:{id:"north-rack",surface:"shelf-3"}}];
  initial.scenes.south=[{id:"south-plant",type:"aloe",x:284,y:264,scale:1,rotation:0,seed:7,support:null}];
  const saved = validateLayout(initial);
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

test("observation preserves all saved scene identities, supports and metadata without altering stored bytes", () => {
  const saved = fixtureLayout(), raw = JSON.stringify(saved, null, 2), storage = readonlyStorage(raw);
  const shown = readObservationLayout(storage);
  assert.deepEqual(shown, saved);
  assert.equal(storage.getItem(LAYOUT_KEY), raw);
  assert.deepEqual(readLayout(storage), shown, "observation and the garage use the same personal arrangement");
});

test("observation validates terrace contents and leaves malformed saved bytes untouched", () => {
  const saved = fixtureLayout();
  saved.scenes.north = [{ id: "invalid-north", type: "removed-asset" }];
  saved.scenes.south = "invalid terrace data";
  const raw = JSON.stringify(saved), storage = readonlyStorage(raw);
  assert.throws(() => readObservationLayout(storage));
  assert.equal(storage.getItem(LAYOUT_KEY), raw);
});

test("a new player sees the same authored arrangement in observation and the editors", () => {
  const shown = readObservationLayout(readonlyStorage(null));
  assert.deepEqual(shown, initialLayout());
  assert.deepEqual(readLayout(readonlyStorage(null)), shown);
  assert.deepEqual(Object.fromEntries(Object.entries(shown.scenes).map(([scene,objects])=>[scene,objects.length])),
    {north:83,south:14,room:21});
  assert.equal(shown.roomVersion, 2);
  assert.equal(shown.spaceVersion, 2);
});

test('an intentionally empty current-catalog save stays empty in observation and the editors',()=>{
  const saved=initialLayout();saved.scenes={north:[],south:[],room:[]};
  const raw=JSON.stringify(saved,null,2),storage=readonlyStorage(raw);
  assert.deepEqual(readObservationLayout(storage),saved);
  assert.deepEqual(readLayout(storage),saved);
  assert.equal(storage.getItem(LAYOUT_KEY),raw);
});

test('an old catalog arrangement resets once to the authored default and later native arrangements remain saved',()=>{
  const old={version:2,scenes:{north:[{id:'old-stand',type:'shelf'}],south:[],room:[{id:'old-bed',type:'room-bed'}]}};
  let raw=JSON.stringify(old),writes=0;
  const storage={getItem:key=>{assert.equal(key,LAYOUT_KEY);return raw;},setItem:(key,value)=>{assert.equal(key,LAYOUT_KEY);writes++;raw=value;}};
  const baseline=readLayout(storage);assert.deepEqual(baseline,initialLayout());assert.equal(writes,1);
  assert.deepEqual(readLayout(storage),baseline);assert.equal(writes,1,'authored baseline does not reset again');
  const arranged=fixtureLayout();writeLayout(arranged,storage);assert.equal(writes,2);
  assert.deepEqual(readLayout(storage),arranged);assert.equal(writes,2,'hand-authored native save is preserved');
  assert.deepEqual(readObservationLayout(storage),arranged);
});

test('observation uses the authored default for retired layouts without writing storage',()=>{
  const raw=JSON.stringify({version:2,scenes:{north:[{id:'removed',type:'shelf'}],south:[],room:[]}});
  assert.deepEqual(readObservationLayout(readonlyStorage(raw)),initialLayout());
});

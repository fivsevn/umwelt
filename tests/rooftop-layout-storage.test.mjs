import test from "node:test";
import assert from "node:assert/strict";
import { LAYOUT_KEY, readLayout, readObservationLayout, writeLayout } from "../rooftop/layout-storage.mjs";
import { initialLayout, validateLayout } from "../rooftop/scene.mjs";

function fixtureLayout() {
  const initial=initialLayout();
  initial.scenes.room=[{id:"room-plant",type:"mint",x:300,y:230,scale:1,rotation:90,pot:"foam",seed:123,support:null}];
  initial.scenes.north=[{id:"north-plant",type:"barrel",x:312,y:240,scale:1,rotation:0,seed:6,support:null}];
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

test("a new player starts with empty observation terraces and an empty default room", () => {
  const shown = readObservationLayout(readonlyStorage(null));
  assert.deepEqual(shown.scenes.north, []);
  assert.deepEqual(shown.scenes.south, []);
  assert.deepEqual(shown.scenes.room, initialLayout().scenes.room);
  assert.equal(shown.roomVersion, 2);
  assert.equal(shown.spaceVersion, 2);
});

test('an old catalog arrangement is cleared once and later native arrangements remain saved',()=>{
  const old={version:2,scenes:{north:[{id:'old-stand',type:'shelf'}],south:[],room:[{id:'old-bed',type:'room-bed'}]}};
  let raw=JSON.stringify(old),writes=0;
  const storage={getItem:key=>{assert.equal(key,LAYOUT_KEY);return raw;},setItem:(key,value)=>{assert.equal(key,LAYOUT_KEY);writes++;raw=value;}};
  const empty=readLayout(storage);assert.deepEqual(empty,initialLayout());assert.equal(writes,1);
  assert.deepEqual(readLayout(storage),empty);assert.equal(writes,1,'empty baseline does not reset again');
  const arranged=fixtureLayout();writeLayout(arranged,storage);assert.equal(writes,2);
  assert.deepEqual(readLayout(storage),arranged);assert.equal(writes,2,'hand-authored native save is preserved');
  assert.deepEqual(readObservationLayout(storage).scenes.room,arranged.scenes.room);
});

test('observation projects old retired layouts to empty without writing storage',()=>{
  const raw=JSON.stringify({version:2,scenes:{north:[{id:'removed',type:'shelf'}],south:[],room:[]}});
  assert.deepEqual(readObservationLayout(readonlyStorage(raw)),initialLayout());
});

import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createVisibleAirField } from "../3d/visible-air.mjs";
import { narrativePreset, narrativeFrame, narrativePose } from "../3d/story-camera.mjs";

const T = createRequire(import.meta.url)("../3d/vendor/three.min.js");
function gameCamera(name, view, width = 406, height = 658, zoom = 1) {
  const preset = narrativePreset(name, view), frame = narrativeFrame(preset, width, height),
    pose = narrativePose(preset), camera = new T.PerspectiveCamera(
      T.MathUtils.radToDeg(2 * Math.atan(frame.span / (2 * pose.distance))), width / height, .1, 6000,
    );
  camera.position.fromArray(pose.eye); camera.lookAt(...pose.target); camera.zoom = zoom;
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  return { camera, distance: pose.distance };
}
const vec = position => new T.Vector3(...position);

test("all six game observers search bounded world air at their actual depth, including portrait scopes", () => {
  for (const name of ["north", "south"]) for (const view of ["bird", "drone", "neighbor"]) {
    for (const [width, height] of [[406, 658], [1280, 720]]) {
      const { camera, distance } = gameCamera(name, view, width, height),
        field = createVisibleAirField(T, { capacity: 16, seed: 83 }),
        entries = field.update(camera, 0, { maxDistance: distance + 32 });
      assert.ok(entries.length > 0 && entries.length <= 16, `${name}/${view}/${width} has a bounded world field`);
      assert.ok(entries.some(entry => {
        const p = vec(entry.position).project(camera); return Math.abs(p.x) < 1 && Math.abs(p.y) < 1;
      }), `${name}/${view} has visible candidates instead of a local-box void`);
      assert.ok(entries.every(entry => entry.depth > .5 && entry.depth < distance + 32));
      assert.ok(field.stats.cells <= 512 && field.stats.generated <= 8192);
      assert.ok(new Set(entries.map(entry => entry.depth.toFixed(1))).size > 1,
        "particles occupy multiple world depths instead of a screen plane");
    }
  }
});

test("camera motion keeps existing anchors, seeds and world positions instead of carrying the particles", () => {
  const { camera, distance } = gameCamera("north", "drone"),
    field = createVisibleAirField(T, { capacity: 12, seed: 1409 }),
    first = field.update(camera, 0, { maxDistance: distance + 32 }).map(entry => ({
      id: entry.id, seed: entry.seed, anchor: [...entry.anchor], position: [...entry.position], index: entry.index,
    }));
  assert.equal(first.length, 12);
  camera.position.x += .02; camera.updateMatrixWorld();
  const moved = field.update(camera, .016, { maxDistance: distance + 32 });
  for (const old of first) {
    const now = moved.find(entry => entry.id === old.id);
    assert.ok(now); assert.equal(now.index, old.index); assert.equal(now.seed, old.seed);
    assert.deepEqual(now.anchor, old.anchor); assert.deepEqual(now.position, old.position);
  }
  assert.equal(field.stats.scans, 1, "a full live pool does not rescan candidate cells as the camera moves");
  assert.equal(field.stats.updated, 12);
});

test("sampled gravity remains world Y and the same particles exhibit depth-dependent parallax", () => {
  const { camera, distance } = gameCamera("south", "drone"),
    field = createVisibleAirField(T, { capacity: 16, seed: 291 }),
    sample = (entry, time) => ({ position: [entry.anchor[0] + time * .02, entry.anchor[1] - time * .07, entry.anchor[2]], age: time }),
    before = field.update(camera, 0, { sample, maxDistance: distance + 32 }).map(entry => ({
      id: entry.id, position: [...entry.position], projected: vec(entry.position).project(camera), depth: entry.depth,
    }));
  camera.position.x += .05; camera.updateMatrixWorld();
  const after = field.update(camera, .1, { sample, maxDistance: distance + 32 });
  const parallax = [];
  for (const old of before) {
    const current = after.find(entry => entry.id === old.id); assert.ok(current);
    assert.ok(Math.abs(current.position[0] - old.position[0] - .002) < 1e-10);
    assert.ok(Math.abs(current.position[1] - old.position[1] + .007) < 1e-10);
    assert.equal(current.position[2], old.position[2]);
    assert.equal(current.sample.age, .1);
    const now = vec(old.position).project(camera);
    parallax.push({ depth: old.depth, movement: Math.abs(now.x - old.projected.x) });
  }
  parallax.sort((a, b) => a.depth - b.depth);
  assert.ok(parallax[0].movement > parallax.at(-1).movement * 2,
    "near air responds more to observer movement than distant air");
});

test("orthographic and perspective safety edges fade outside the image without hard clipping inside it", () => {
  const cameras = [new T.PerspectiveCamera(45, 16 / 9, .1, 6000), new T.OrthographicCamera(-12, 12, 8, -8, .1, 6000)];
  for (const camera of cameras) {
    camera.position.set(0, 0, 20); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
    const field = createVisibleAirField(T, { capacity: 8, safety: 1.18 }); field.update(camera, 0, { maxDistance: 60 });
    const point = x => {
      const near = new T.Vector3(x, 0, 0).unproject(camera), local = near.applyMatrix4(camera.matrixWorldInverse);
      if (camera.isPerspectiveCamera) local.multiplyScalar(-20 / local.z);
      else local.z = -20;
      return local.applyMatrix4(camera.matrixWorld).toArray();
    };
    assert.equal(field.visibility(point(.99)), 1);
    const edge = field.visibility(point(1.09)); assert.ok(edge > .4 && edge < .6);
    assert.equal(field.visibility(point(1.19)), 0);
    assert.equal(field.visibility([0, 0, 21]), 0, "air behind the observer is excluded");
  }
});

test("empty domains back off their bounded birth search and dynamic roof bounds are honored", () => {
  const { camera, distance } = gameCamera("north", "neighbor"),
    field = createVisibleAirField(T, { capacity: 20, seed: 1060 }), empty = () => null;
  assert.equal(field.update(camera, 0, { sample: empty, maxDistance: distance + 32 }).length, 0);
  const scans = field.stats.scans;
  for (let i = 1; i < 20; i++) field.update(camera, i / 120, { sample: empty, maxDistance: distance + 32 });
  assert.equal(field.stats.scans, scans, "zero candidates do not trigger a full scan every rendered frame");
  field.update(camera, .3, { sample: empty, maxDistance: distance + 32 });
  assert.equal(field.stats.scans, scans + 1);
  const bounds = [-12, -1, -12, 12, 3, 12],
    roof = field.update(camera, .31, { maxDistance: distance + 32, bounds });
  assert.ok(roof.length > 0, "dynamic roof bounds can immediately populate an otherwise empty pool");
  assert.ok(roof.every(entry => entry.anchor.every((v, axis) => v >= bounds[axis] && v <= bounds[axis + 3])));
});

test("active budgets shrink the work and draw pool without allocating an unbounded city population", () => {
  const { camera, distance } = gameCamera("north", "drone"),
    field = createVisibleAirField(T, { capacity: 840, seed: 559 });
  let entries = field.update(camera, 0, { maxDistance: distance + 32, budget: 80 });
  assert.ok(entries.length > 20 && entries.length <= 80); assert.equal(field.stats.capacity, 840);
  for (let time = .05; time <= 1; time += .05) entries = field.update(camera, time, { maxDistance: distance + 32, budget: 20 });
  assert.equal(entries.length, 20); assert.equal(field.stats.updated, 20); assert.equal(field.stats.budget, 20);
  assert.equal(field.stats.sampleCalls, 20, "ordinary frames sample only the actual live budget");
  assert.ok(field.stats.generated <= 8192 && field.stats.cells <= 512);
  const scans = field.stats.scans;
  for (let time = 1.05; time <= 5; time += .05) field.update(camera, time, { maxDistance: distance + 32, budget: 20 });
  assert.equal(field.stats.scans, scans, "stable populated weather has no periodic full birth scan");
});

test("the circular scope searches only its visible world cone and fades the safety ring before the opaque corners", () => {
  const camera = new T.PerspectiveCamera(45, 1, .1, 6000);
  camera.position.set(0, 0, 20); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  const field = createVisibleAirField(T, { capacity: 16, seed: 771, safety: 1.18 }),
    ndcEllipse = [.4, .6], point = (x, y) => {
      const local = new T.Vector3(x, y, 0).unproject(camera).applyMatrix4(camera.matrixWorldInverse);
      return local.multiplyScalar(-20 / local.z).applyMatrix4(camera.matrixWorld).toArray();
    };
  const entries = field.update(camera, 0, { maxDistance: 60, ndcEllipse });
  assert.ok(entries.length > 0);
  assert.equal(field.visibility(point(.396, 0)), 1);
  assert.ok(Math.abs(field.visibility(point(.436, 0)) - .5) < 1e-10);
  assert.equal(field.visibility(point(.4, .6)), 0, "the rectangle corner is hidden by the actual circular eyepiece");
  assert.equal(field.visibility(point(.477, 0)), 0);
  for (const entry of entries) {
    const p = vec(entry.position).project(camera);
    assert.ok(Math.hypot(p.x / ndcEllipse[0], p.y / ndcEllipse[1]) < 1.18);
  }
  const old = entries.map(entry => ({ id: entry.id, anchor: [...entry.anchor], position: [...entry.position] }));
  camera.position.x += .01; camera.updateMatrixWorld();
  const moved = field.update(camera, .016, { maxDistance: 60, ndcEllipse });
  for (const entry of old) {
    const now = moved.find(candidate => candidate.id === entry.id); assert.ok(now);
    assert.deepEqual(now.anchor, entry.anchor); assert.deepEqual(now.position, entry.position);
  }
  assert.deepEqual(field.stats.ndcEllipse, ndcEllipse);
});

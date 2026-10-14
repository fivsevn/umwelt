import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createAtmosphere } from "../3d/atmosphere.mjs";
import { weatherProfile } from "../weather.mjs";
import { weatherMotion } from "../atmosphere.mjs";
import { rainShape } from "../precipitation.mjs";

const T = createRequire(import.meta.url)("../3d/vendor/three.min.js");
function fixture() {
  const scene = new T.Scene(), sun = new T.DirectionalLight(), hemi = new T.HemisphereLight();
  scene.fog = new T.Fog("#ffffff", 1, 100);
  const renderer = { domElement: { dataset: { pixelRatio: "2", physicalPixelStep: "5" } },
    shadowMap: { needsUpdate: false }, setClearColor() {},
    getDrawingBufferSize(out) { return out.set(812, 1316); } };
  return { scene, effect: createAtmosphere(T, scene, renderer,
    { coords: (_name, x, z) => [x, z], hemi, sun, materialCache: new Map(), windowMats: [] }) };
}
function view(yaw = 0) {
  const camera = new T.PerspectiveCamera(40, 406 / 658, .1, 6000);
  camera.position.set(5.7, 10.2, -16.9);
  camera.lookAt(Math.sin(yaw) * 3, .8, -3);
  camera.updateMatrixWorld();
  return camera;
}

test("game rain keeps world gravity and depth when the observer turns, with a screen-sized bounded pool", () => {
  const state = weatherProfile("heavy", "day", "summer"),
    at = 3, motion = weatherMotion(state, at), shape = rainShape(state);
  for (const yaw of [0, .1]) {
    const { scene, effect } = fixture(), camera = view(yaw);
    for (let tick = 0; tick <= 20; tick++)
      effect.update("north", state, at - 1 + tick / 20, false, camera, { targetDistance: 20 });
    const stats = effect.stats.airCoverage;
    assert.ok(stats.submitted > 0 && stats.submitted <= stats.budget);
    assert.ok(stats.viewCapacity <= 225 && stats.viewCapacity < 840,
      "a narrow source image does not update a desktop-sized rain pool");
    assert.equal(stats.worldAnchored, true);
    const rain = scene.children.find(child => child.geometry?.attributes.dropAlpha),
      positions = rain.geometry.attributes.position.array,
      alphas = rain.geometry.attributes.dropAlpha.array;
    assert.equal(rain.material.depthTest, true);
    assert.equal(rain.material.depthWrite, false);
    assert.equal(rain.geometry.drawRange.count, stats.submitted * 2);
    for (let i = 0; i < stats.submitted; i++) {
      const j = i * 6;
      assert.ok(Math.abs(positions[j + 4] - positions[j + 1] + shape.streak) < 1e-5,
        "all streaks fall on the world Y axis, independent of camera direction");
      assert.ok(Math.abs(positions[j + 3] - positions[j] + motion.x * .19) < 1e-5);
      assert.ok(Math.abs(positions[j + 5] - positions[j + 2] + motion.z * .19) < 1e-5);
      assert.ok(alphas[i * 2] > 0 && alphas[i * 2] <= 1);
    }
  }
});

test("the game sky follows its physical observer while local inspection and room keep their existing scope", () => {
  const { scene, effect } = fixture(), camera = view(), state = weatherProfile("clear", "day", "spring"),
    sky = scene.children.find(child => child.geometry?.type === "SphereGeometry");
  camera.position.set(-130, 42, -100); camera.lookAt(0, .8, -2); camera.updateMatrixWorld();
  effect.update("north", state, 0, false, camera, { targetDistance: 169 });
  assert.deepEqual(sky.position.toArray(), camera.position.toArray());
  assert.equal(effect.stats.seasonal.spatial, true);
  effect.update("north", state, 1);
  assert.deepEqual(sky.position.toArray(), [0, 0, 0]);
  assert.equal(effect.stats.airCoverage, null);
  assert.equal(effect.stats.seasonal.spatial, false);
  effect.update("room", state, 2, false, camera);
  assert.equal(sky.visible, false);
  assert.equal(effect.stats.rain, 0);
  assert.equal(effect.stats.seasonal.count, 0);
  assert.equal(effect.stats.airCoverage, null);
});

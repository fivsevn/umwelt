import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createSeasonalAir, seasonalWorldSample, springCatkin, SPRING_CATKIN_COUNT } from "../rooftop/3d/seasonal-air.mjs";
import { SEASONS, seasonalParticle } from "../rooftop/seasons.mjs";
import { BACKGROUND } from "../rooftop/assets/background/empty-rooftop.mjs";
import { narrativePreset, narrativeFrame, narrativePose } from "../rooftop/3d/story-camera.mjs";

const T = createRequire(import.meta.url)("../rooftop/3d/vendor/three.min.js");
const makeAir = () => createSeasonalAir(T, new T.Scene(), {
  domElement: { dataset: { pixelRatio: "2" } },
  getDrawingBufferSize(size) { return size.set(812, 1316); },
});
function viewCamera(scene, view, width = 406, height = 658) {
  const preset = narrativePreset(scene, view), frame = narrativeFrame(preset, width, height), pose = narrativePose(preset),
    fov = T.MathUtils.radToDeg(2 * Math.atan(frame.span / (2 * pose.distance))),
    camera = new T.PerspectiveCamera(fov, width / height, .1, 6000);
  camera.position.fromArray(pose.eye); camera.lookAt(...pose.target);
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  return { camera, targetDistance: pose.distance };
}
function settle(air, scene, season, camera, targetDistance, time = 0, reduced = false, cameraOptions = {}) {
  for (let frame = 0; frame < 6; frame++) air.update(scene, { season, wind: .32, ambient: .8, direct: 1.1 }, time + frame * .1,
    reduced, {}, camera, { targetDistance, ...cameraOptions });
}

test("world seasonal identities retain their existing pigment, physical sizes and wind paths", () => {
  for (const season of SEASONS) for (const reduced of [false, true]) for (const scene of ["north", "south"]) {
    const seed = 13719, anchor = [17, 6, -24], at = 47.2,
      expected = season.id === "spring" ? springCatkin(seed, at, .67, reduced) : seasonalParticle(season.id, seed, at, .67, reduced),
      p = seasonalWorldSample(season.id, seed, anchor, at, .67, reduced, scene),
      shifted = seasonalWorldSample(season.id, seed, [anchor[0] + 12, anchor[1] - 4, anchor[2] + 9], at, .67, reduced, scene);
    for (const key of ["size", "kind", "color", "angle"]) assert.equal(p[key], expected[key]);
    assert.ok(p.position.every(Number.isFinite));
    for (const [axis, delta] of [12, -4, 9].entries()) assert.ok(Math.abs(shifted.position[axis] - p.position[axis] - delta) < 1e-12);
    assert.ok(p.cycleOpacity >= 0 && p.cycleOpacity <= 1);
    assert.notDeepEqual(seasonalWorldSample(season.id, seed, anchor, at + .1, .67, reduced, scene).position, p.position);
  }
});

test("falling flowers, leaves and snow fade at every visible floor-to-sky reset", () => {
  for (const season of ["autumn", "winter"]) for (const seed of [3, 7, 17, 191]) {
    let resets = 0;
    for (let at = 0; at < 100; at += .05) {
      const before = seasonalWorldSample(season, seed, [0, 0, 0], at), after = seasonalWorldSample(season, seed, [0, 0, 0], at + .05);
      if (after.position[1] - before.position[1] > 10) {
        resets++;
        assert.ok(before.cycleOpacity < .05 && after.cycleOpacity < .05,
          "the falling particle is transparent at the wrap instead of visibly teleporting upward");
      }
    }
    assert.ok(resets > 0);
  }
});

test("every game camera uses bounded 3D seasonal buffers, with only the active season uploaded", () => {
  for (const [width, height] of [[406, 658], [1280, 720]]) for (const scene of ["north", "south"]) {
    for (const view of ["bird", "drone", "neighbor"]) for (const season of SEASONS) {
      const air = makeAir(), { camera, targetDistance } = viewCamera(scene, view, width, height),
        inactiveBefore = air.points.filter((_point, index) => index !== SEASONS.indexOf(season)).map(point => point.geometry.attributes.position.version);
      settle(air, scene, season.id, camera, targetDistance);
      const points = air.points[SEASONS.indexOf(season)], budget = season.id === "spring" ? SPRING_CATKIN_COUNT : season.count;
      assert.equal(air.stats.spatial, true);
      assert.ok(air.stats.count > 0 && air.stats.count <= budget, `${scene} ${view} ${width} ${season.id} has visible world particles`);
      assert.equal(points.geometry.drawRange.count, air.stats.count);
      assert.equal(points.material.uniforms.viewportHeight.value, 329);
      assert.ok(points.material.depthTest && !points.material.depthWrite);
      assert.match(points.material.vertexShader, /modelViewMatrix\*vec4\(position,1\.0\)/);
      assert.ok(Array.from(points.geometry.attributes.position.array.slice(0, air.stats.count * 3)).every(Number.isFinite));
      const upload = points.geometry.attributes.position.updateRanges;
      assert.deepEqual(upload, [{ start: 0, count: air.stats.count * 3 }], "only the compact live positions are submitted");
      assert.deepEqual(air.points.filter((_point, index) => index !== SEASONS.indexOf(season)).map(point => point.geometry.attributes.position.version), inactiveBefore);
      for (const point of air.points.filter(point => point !== points)) assert.equal(point.geometry.drawRange.count, 0);
      if (season.id === "spring") for (const size of points.geometry.attributes.diameter.array.slice(0, air.stats.count))
        assert.equal(size * BACKGROUND.texelsPerMetre, 1);
      if (season.id === "summer") for (let i = 0; i < air.stats.count; i++) {
        const [x, y, z] = points.geometry.attributes.position.array.slice(i * 3, i * 3 + 3);
        assert.ok(Math.abs(x) <= (scene === "south" ? 6 : 13.5) && Math.abs(z) <= (scene === "south" ? 12 : 12.5) && y >= .18 && y <= 3,
          "insects stay near the actual roof instead of filling the telescope's sky");
      }
    }
  }
});

test("small camera translation keeps world identities still and produces depth-dependent parallax", () => {
  const air = makeAir(), { camera, targetDistance } = viewCamera("north", "drone"), season = "winter";
  settle(air, "north", season, camera, targetDistance, 4);
  const first = air.stats.effects[0].sample.map(entry => ({ ...entry, projected: new T.Vector3(...entry.position).project(camera) })),
    right = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  camera.position.addScaledVector(right, .04); camera.updateMatrixWorld();
  air.update("north", { season, wind: .32, ambient: .8, direct: 1.1 }, 4.5, false, {}, camera, { targetDistance });
  const retained = air.stats.effects[0].sample.filter(entry => first.some(previous => previous.id === entry.id));
  assert.ok(retained.length >= 2, "moving the eye does not regenerate camera-facing particles");
  const ratios = [];
  for (const entry of retained) {
    const previous = first.find(previous => previous.id === entry.id);
    assert.deepEqual(entry.anchor, previous.anchor);
    assert.deepEqual(entry.position, previous.position, "the same world point stays still at the same clock time");
    const shifted = new T.Vector3(...entry.position).project(camera), depth = -new T.Vector3(...entry.position).applyMatrix4(camera.matrixWorldInverse).z,
      difference = Math.abs(shifted.x - previous.projected.x);
    assert.ok(difference > 0);
    ratios.push(difference * depth);
  }
  assert.ok(Math.max(...ratios) - Math.min(...ratios) < 1e-9, "perspective camera travel has exactly inverse-depth parallax");
});

test("neighbour optics draw only world particles inside the circular window and its safety edge", () => {
  for (const [width, height] of [[406, 658], [1280, 720]]) for (const scene of ["north", "south"]) for (const season of SEASONS) {
    const air = makeAir(), { camera, targetDistance } = viewCamera(scene, "neighbor", width, height), diameter = Math.min(width, height) * .97,
      ndcEllipse = [diameter / width, diameter / height];
    settle(air, scene, season.id, camera, targetDistance, 7, false, { ndcEllipse });
    assert.ok(air.stats.count > 0, `${scene} ${width} ${season.id} still has particles in the real circular view`);
    const points = air.points[SEASONS.indexOf(season)], positions = points.geometry.attributes.position.array;
    assert.deepEqual(air.stats.effects[0].field.ndcEllipse, ndcEllipse);
    for (let index = 0; index < air.stats.count; index++) {
      const p = new T.Vector3(...positions.slice(index * 3, index * 3 + 3)).project(camera);
      assert.ok(Math.hypot(p.x / ndcEllipse[0], p.y / ndcEllipse[1]) < 1.181,
        "the opaque corners of the telescope do not receive a separate population");
    }
  }
});

test("retained world identities animate without repeatedly uploading static pigment and silhouettes", () => {
  const air = makeAir(), { camera, targetDistance } = viewCamera("north", "drone");
  settle(air, "north", "winter", camera, targetDistance, 4);
  const attributes = air.points[SEASONS.findIndex(season => season.id === "winter")].geometry.attributes,
    staticVersions = ["pigment", "diameter", "kind"].map(key => attributes[key].version),
    movingVersions = ["position", "angle", "veil"].map(key => attributes[key].version), before = air.stats.sample;
  air.update("north", { season: "winter", wind: .32, ambient: .8, direct: 1.1 }, 4.501, false, {}, camera, { targetDistance });
  assert.notDeepEqual(air.stats.sample, before, "the particles continue moving in world space");
  assert.deepEqual(["pigment", "diameter", "kind"].map(key => attributes[key].version), staticVersions);
  assert.deepEqual(["position", "angle", "veil"].map(key => attributes[key].version), movingVersions.map(version => version + 1));
});

test("season blending keeps separate 3D identities while room rendering draws no air", () => {
  const air = makeAir(), { camera, targetDistance } = viewCamera("south", "bird"), state = {
    season: "spring", seasonspring: .45, seasonwinter: .55, wind: .32, ambient: .8, direct: 1.1,
  };
  for (let frame = 0; frame < 6; frame++) air.update("south", state, frame * .1, true, {}, camera, { targetDistance });
  assert.equal(air.stats.effects.length, 2);
  assert.ok(air.stats.count > 0 && air.stats.count <= SPRING_CATKIN_COUNT + SEASONS.find(season => season.id === "winter").count);
  assert.deepEqual(air.stats.effects.map(effect => effect.strength), [.45, .55]);
  const before = air.stats.sample;
  air.update("south", state, .6, true, {}, camera, { targetDistance });
  assert.notDeepEqual(air.stats.sample, before, "reduced motion continues through real world paths");
  const versions = air.points.map(point => point.geometry.attributes.position.version);
  air.update("room", state, .7, true, {}, camera, { targetDistance });
  assert.equal(air.stats.count, 0);
  assert.ok(air.points.every(point => !point.visible && point.geometry.drawRange.count === 0));
  assert.deepEqual(air.points.map(point => point.geometry.attributes.position.version), versions);
});

test("returning from game cameras to a local test restores each legacy slot's pigment and shape", () => {
  const air = makeAir(), { camera, targetDistance } = viewCamera("north", "bird");
  settle(air, "north", "autumn", camera, targetDistance, 10);
  air.update("north", { season: "autumn", wind: .47 }, 17.3, false);
  const point = air.points[SEASONS.findIndex(season => season.id === "autumn")], attributes = point.geometry.attributes;
  assert.equal(air.stats.spatial, false);
  for (let index = 0; index < SEASONS.find(season => season.id === "autumn").count; index++) {
    const p = seasonalParticle("autumn", index, 17.3, .47);
    assert.deepEqual(Array.from(attributes.pigment.array.slice(index * 3, index * 3 + 3)), new T.Color(p.color).toArray().map(Math.fround));
    assert.equal(attributes.kind.array[index], p.kind);
    assert.equal(attributes.diameter.array[index], Math.fround(p.size));
    assert.equal(attributes.veil.array[index], 1);
  }
});

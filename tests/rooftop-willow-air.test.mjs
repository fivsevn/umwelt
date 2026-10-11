import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { BACKGROUND } from "../rooftop/assets/background/empty-rooftop.mjs";
import { SEASONS, seasonalParticle, seasonalStrength } from "../rooftop/seasons.mjs";
import { createSeasonalAir, springCatkin, SPRING_CATKIN_COUNT } from "../rooftop/3d/seasonal-air.mjs";

const T = createRequire(import.meta.url)("../rooftop/3d/vendor/three.min.js");
const wrappedDelta = (a, b) => ((b - a + 1.5) % 1) - .5;
const makeAir = () => createSeasonalAir(T, new T.Scene(), {
  getDrawingBufferSize(v) { return v.set(800, 600); },
});
function travel(wind, reduced = false) {
  let horizontal = 0, vertical = 0, rising = 0, falling = 0;
  const metric = BACKGROUND.texelMetresPerUnit;
  for (let t = 0; t < 180; t++) for (let i = 0; i < SPRING_CATKIN_COUNT; i++) {
    const p = springCatkin(i, t, wind, reduced), q = springCatkin(i, t + 1, wind, reduced);
    horizontal += Math.hypot(wrappedDelta(p.x, q.x) * 27 * metric[0], wrappedDelta(p.z, q.z) * 25 * metric[2]);
    vertical += Math.abs(q.y - p.y) * 5.5 * metric[1];
    if (q.y > p.y) rising++;
    else if (q.y < p.y) falling++;
  }
  const samples = 180 * SPRING_CATKIN_COUNT;
  return { horizontal: horizontal / samples, vertical: vertical / samples, rising, falling };
}

test("sparse single-texel spring seeds remain loose, warm, and bounded over long wind paths", () => {
  assert.equal(SPRING_CATKIN_COUNT, 16);
  assert.ok(SPRING_CATKIN_COUNT < SEASONS.find(s => s.id === "winter").count / 4);
  for (const reduced of [false, true]) for (let t = 0; t <= 600; t += 5) {
    for (let i = 0; i < SPRING_CATKIN_COUNT; i++) {
      const p = springCatkin(i, t, 2.8, reduced);
      assert.deepEqual(p, springCatkin(i, t, 2.8, reduced));
      assert.ok([p.x, p.y, p.z, p.angle, p.size, p.opacity].every(Number.isFinite));
      assert.ok(p.x >= 0 && p.x < 1 && p.z >= 0 && p.z < 1 && p.y > .15 && p.y < .65);
      assert.equal(p.size, 1 / BACKGROUND.texelsPerMetre);
      assert.ok(p.opacity > .57 && p.opacity < .87);
      const rgb = p.color.slice(1).match(/../g).map(value => Number.parseInt(value, 16));
      assert.ok(rgb[0] >= rgb[1] && rgb[1] > rgb[2], "catkins use warm white pigment");
    }
  }
  for (let i = 0; i < SPRING_CATKIN_COUNT; i++) for (let j = i + 1; j < SPRING_CATKIN_COUNT; j++) {
    const p = springCatkin(i, 0), q = springCatkin(j, 0);
    assert.ok(Math.hypot(wrappedDelta(p.x, q.x), p.y - q.y, wrappedDelta(p.z, q.z)) > .1,
      "seeds start independently rather than in tight four-particle clusters");
  }
  assert.deepEqual(springCatkin(0, NaN, Infinity), springCatkin(0, 0));
});

test("catkins move mainly sideways and rise as often as they fall in both motion preferences", () => {
  const normal = travel(.32), reduced = travel(.32, true);
  for (const movement of [normal, reduced]) {
    assert.ok(movement.horizontal > movement.vertical * 8);
    assert.ok(movement.horizontal > .015 && movement.horizontal < .05);
    assert.ok(movement.rising > 1100 && movement.falling > 1100,
      "spring has continuous floating instead of winter's falling reset path");
  }
  assert.ok(reduced.horizontal < normal.horizontal * .7 && reduced.horizontal > normal.horizontal * .55);
  assert.ok(travel(2).horizontal > travel(.2).horizontal * 2, "wind carries seeds across the roof");
  for (let i = 0; i < SPRING_CATKIN_COUNT; i++) for (let t = 0; t < 180; t++) {
    assert.ok(Math.abs(springCatkin(i, t + .05).y - springCatkin(i, t).y) < .001,
      "height has no teleport from floor to sky");
  }
});

test("individual breezes slow into gentle pauses with different rates and phases", () => {
  const rates = new Set();
  for (let i = 0; i < SPRING_CATKIN_COUNT; i++) {
    let min = Infinity, max = 0;
    for (let t = 0; t < 120; t++) {
      const p = springCatkin(i, t), q = springCatkin(i, t + 1), speed = Math.abs(wrappedDelta(p.x, q.x));
      min = Math.min(min, speed); max = Math.max(max, speed);
      if (t === 7) rates.add(speed.toFixed(6));
    }
    assert.ok(max > min * 8, "each seed has slow lulls instead of a constant-speed circular loop");
  }
  assert.ok(rates.size >= 14, "the breeze does not move every seed at the same instantaneous rate");
});

test("spring uses native physical texels on both terraces and stays visible under reduced motion", () => {
  const air = makeAir(), spring = air.points[0], metric = BACKGROUND.texelMetresPerUnit;
  for (const diameter of spring.geometry.attributes.diameter.array) {
    assert.equal(diameter * BACKGROUND.texelsPerMetre, 1);
  }
  const state = { season: "spring", wind: .32, ambient: .8, direct: 1.1 };
  for (const name of ["north", "south"]) {
    air.update(name, state, 10, true);
    assert.equal(air.stats.count, 16);
    assert.ok(spring.visible && spring.material.uniforms.strength.value > 0);
    assert.deepEqual(spring.material.uniforms.physicalScale.value.toArray(),
      name === "north" ? metric : [metric[2], metric[1], metric[0]]);
    const first = air.stats.sample;
    air.update(name, state, 11, true);
    assert.notDeepEqual(air.stats.sample, first);
    const veils = spring.geometry.attributes.veil.array;
    assert.ok(Array.from(veils).some(value => value > .5));
    assert.ok(Array.from(veils).every(value => value >= 0 && value < .87));
    const alpha = spring.material.uniforms.catkinAlpha.value;
    assert.ok(Array.from(veils).some(value => value * alpha > .13));
    assert.ok(Array.from(veils).every(value => value * alpha < .21));
  }
  air.update("room", state, 12, true);
  assert.equal(air.stats.count, 0);
  assert.ok(air.points.every(points => !points.visible));
});

test("one physical texel projects with the viewport half-scale in both camera modes", () => {
  const air = makeAir(), spring = air.points[0], viewportHeight = 720,
    diameter = spring.geometry.attributes.diameter.array[0];
  for (const name of ["north", "south"]) for (const perspective of [false, true]) {
    air.update(name, { season: "spring" }, 0, false);
    const uniforms = spring.material.uniforms, metric = uniforms.physicalScale.value;
    for (const zoom of [1, 2.4]) for (const position of [[24, 32, 46], [-6, 8, 10]]) {
      const camera = perspective ? new T.PerspectiveCamera(40, 16 / 9, .1, 6000) : new T.OrthographicCamera(-16, 16, 9, -9, .1, 6000);
      camera.position.fromArray(position); camera.lookAt(0, 1, 0); camera.zoom = zoom;
      camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      const center = new T.Vector3(1, .8, -2), cameraUp = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 1),
        gameDiameter = diameter / cameraUp.clone().multiply(metric).length(),
        top = center.clone().addScaledVector(cameraUp, gameDiameter / 2).project(camera),
        bottom = center.clone().addScaledVector(cameraUp, -gameDiameter / 2).project(camera),
        measuredPixels = Math.abs(top.y - bottom.y) * viewportHeight / 2,
        depth = -center.clone().applyMatrix4(camera.matrixWorldInverse).z,
        pointPixels = gameDiameter * viewportHeight * camera.projectionMatrix.elements[5] * uniforms.catkinProjectionFactor.value / (perspective ? depth : 1);
      assert.ok(Math.abs(pointPixels - measuredPixels) < 1e-9,
        `${name} ${perspective ? "perspective" : "orthographic"} diameter equals a projected physical texel`);
    }
  }
});

test("summer insects, autumn flowers/leaves, and winter snow retain their existing trajectories and pigment", () => {
  const air = makeAir();
  for (const name of ["north", "south"]) for (const reduced of [false, true]) {
    for (const season of SEASONS.filter(s => s.id !== "spring")) {
      const state = { season: season.id, wind: .47, ambient: .8, direct: 1.1 },
        points = air.points[SEASONS.indexOf(season)], attrs = points.geometry.attributes;
      air.update(name, state, 17.3, reduced);
      assert.equal(air.stats.count, season.count);
      assert.equal(points.material.uniforms.strength.value, seasonalStrength(state, season.id));
      for (let i = 0; i < season.count; i++) {
        const p = seasonalParticle(season.id, i, 17.3, .47, reduced), j = i * 3,
          expectedColor = new T.Color(p.color).toArray().map(Math.fround);
        assert.deepEqual(Array.from(attrs.position.array.slice(j, j + 3)), [
          (p.x - .5) * (name === "south" ? 12 : 27),
          .18 + p.y * (season.id === "summer" ? 10 : 12),
          (p.z - .5) * (name === "south" ? 24 : 25),
        ].map(Math.fround));
        assert.deepEqual(Array.from(attrs.pigment.array.slice(j, j + 3)), expectedColor);
        assert.equal(attrs.angle.array[i], Math.fround(p.angle));
        assert.equal(attrs.diameter.array[i], Math.fround(p.size));
        assert.equal(attrs.kind.array[i], p.kind);
        assert.equal(attrs.veil.array[i], 1);
      }
    }
  }
});

test("spring and winter keep independent identities while the existing season transition blends them", () => {
  const air = makeAir();
  air.update("north", { season: "spring", seasonspring: .45, seasonwinter: .55, wind: .32 }, 7, true);
  assert.equal(air.stats.count, 16 + 112);
  assert.deepEqual(air.stats.effects.map(effect => [effect.season, effect.count, effect.strength]),
    [["spring", 16, .45], ["winter", 112, .55]]);
});

import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { WEATHER, TIMES, weatherProfile, makeWeather } from "../rooftop/weather.mjs";
import { SEASONS } from "../rooftop/seasons.mjs";
import { BACKGROUND } from "../rooftop/assets/background/empty-rooftop.mjs";
import { createAtmosphere, terraceAtmosphereMood, WEATHER_PIXEL_METRIC, ATMOSPHERE_LIGHT_ENERGY, terraceLightPosition } from "../rooftop/3d/atmosphere.mjs";

test("all season/time/weather skies have bounded light and ordered distance fog", () => {
  for (const season of SEASONS) for (const time of TIMES) for (const weather of WEATHER) {
    const state = weatherProfile(weather.id, time.id, season.id), mood = terraceAtmosphereMood(state);
    assert.ok(state.ambient > 0 && state.ambient <= .95);
    assert.ok(state.direct >= 0 && state.direct <= 1.5);
    assert.ok(mood.fogNear >= 24 && mood.fogFar >= mood.fogNear + 90);
    assert.ok(Object.values(mood).filter(v => typeof v === "number").every(Number.isFinite));
    for (const field of ["fogColor", "cloudColor", "rainColor", "snowColor", "waterColor"])
      assert.match(mood[field], /^#[\da-f]{6}$/i);
  }
  const far = condition => terraceAtmosphereMood(weatherProfile(condition, "day", "summer")).fogFar;
  assert.equal(far("clear"), 6000, "clear weather preserves the authored distant neighborhood");
  assert.ok(far("rain") > far("heavy") && far("heavy") > far("typhoon"));
  assert.ok(far("mist") < 350, "fog must reach the neighborhood rather than only the far clip plane");
});

test("seasons change ambient palette and solar elevation without changing map orientation", () => {
  const states = SEASONS.map(s => weatherProfile("clear", "afternoon", s.id));
  assert.equal(new Set(states.map(s => s.zenith)).size, 4);
  assert.equal(new Set(states.map(s => s.bounceColor)).size, 4);
  const summer = states.find(s => s.season === "summer"), winter = states.find(s => s.season === "winter");
  assert.ok(winter.sunY < summer.sunY * .65);
  assert.equal(winter.sunX, summer.sunX);
  assert.ok(winter.sunZ > summer.sunZ, "winter sun comes from further south");
  assert.ok(terraceAtmosphereMood(weatherProfile("clear", "dusk", "autumn")).sunset > .5);
  assert.equal(terraceAtmosphereMood(weatherProfile("clear", "day", "autumn")).sunset, 0);
});

test("interrupted season/weather changes continue from the current sky and residual water", () => {
  const clock = makeWeather({ condition: "heavy", phase: "dusk", season: "autumn", manualTransition: .65 });
  const before = terraceAtmosphereMood(clock.update(0));
  clock.set("condition", "clear");
  assert.deepEqual(terraceAtmosphereMood(clock.update(0)), before);
  clock.update(.3);
  const partial = terraceAtmosphereMood(clock.state);
  clock.set("season", "winter");
  assert.deepEqual(terraceAtmosphereMood(clock.update(0)), partial);
  clock.update(.65);
  const dry = terraceAtmosphereMood(clock.state);
  assert.equal(clock.state.rain, 0);
  assert.ok(dry.afterRain > .5, "wet pools remain after the rain ends");
  assert.ok(dry.fogFar > 3000);
});

test("wet and snow cells use the same physical square as the native floor texture", () => {
  const scale = BACKGROUND.texelMetresPerUnit;
  assert.equal(WEATHER_PIXEL_METRIC[0] / scale[0], BACKGROUND.texelsPerMetre);
  assert.equal(WEATHER_PIXEL_METRIC[1] / scale[2], BACKGROUND.texelsPerMetre);
});

test("cached atmosphere changes every supported mood without rebuilding and keeps reduced seasonal motion", () => {
  const T = createRequire(import.meta.url)("../rooftop/3d/vendor/three.min.js"), scene = new T.Scene(),
    sun = new T.DirectionalLight(), hemi = new T.HemisphereLight();
  scene.fog = new T.Fog("#ffffff", 1, 100);
  const renderer = { shadowMap: { needsUpdate: false }, setClearColor() {}, getDrawingBufferSize(v) { return v.set(800, 600); } };
  const effect = createAtmosphere(T, scene, renderer, { coords: (_name, x, z) => [x, z], hemi, sun, materialCache: new Map(), windowMats: [] });
  const count = scene.children.length;
  for (const season of SEASONS) for (const time of TIMES) for (const weather of WEATHER) {
    const state = weatherProfile(weather.id, time.id, season.id);
    effect.update("north", state, 4, true);
    assert.equal(scene.children.length, count);
    assert.equal(scene.fog.near, effect.stats.mood.fogNear);
    assert.equal(scene.fog.far, effect.stats.mood.fogFar);
    assert.equal(sun.intensity, state.direct * ATMOSPHERE_LIGHT_ENERGY);
    assert.ok(effect.stats.rain <= 840 && effect.stats.seasonal.count <= 184);
  }
  for (const season of SEASONS) {
    const state = weatherProfile("clear", "day", season.id);
    effect.update("south", state, 7, false);
    const full = effect.stats.seasonal.sample;
    effect.update("south", state, 8, true);
    assert.notDeepEqual(effect.stats.seasonal.sample, full);
    const reduced = effect.stats.seasonal.sample;
    effect.update("south", state, 9, true);
    assert.notDeepEqual(effect.stats.seasonal.sample, reduced);
    effect.update("room", state, 10, true);
    assert.equal(effect.stats.seasonal.count, 0);
    assert.equal(effect.stats.rain, 0);
  }
});


test("physical sun direction survives model metre scale and both terrace viewpoints", () => {
  const metric = BACKGROUND.texelMetresPerUnit;
  for (const season of SEASONS) for (const time of TIMES) {
    const state = weatherProfile("clear", time.id, season.id), north = terraceLightPosition(state), south = terraceLightPosition(state, "south"),
      physical = north.map((value, axis) => value * metric[axis]), original = [state.sunX, state.sunY, state.sunZ],
      length = Math.hypot(...physical), sourceLength = Math.hypot(...original);
    assert.deepEqual(south, [north[2], north[1], -north[0]]);
    assert.ok(Math.abs(Math.hypot(...north) - 62) < 1e-9, "source light remains inside the existing shadow range");
    physical.forEach((value, axis) => assert.ok(Math.abs(value / length - original[axis] / sourceLength) < 1e-12));
    if (time.id === "day") {
      assert.equal(state.sunX, 0);
      assert.ok(state.sunZ > 0, "noon light is south of the seasonal roof");
    }
  }
  for (const time of ["dawn", "dusk"]) {
    assert.ok(weatherProfile("clear", time, "summer").sunZ < 0, "summer rising/setting sun is northward");
    assert.ok(weatherProfile("clear", time, "winter").sunZ > 0, "winter rising/setting sun is southward");
    assert.ok(weatherProfile("clear", time, "autumn").sunZ > 0);
  }
});

test("rainwater keeps separate stable local basins on both terraces", () => {
  const T = createRequire(import.meta.url)("../rooftop/3d/vendor/three.min.js"), scene = new T.Scene(), sun = new T.DirectionalLight(), hemi = new T.HemisphereLight();
  scene.fog = new T.Fog("#ffffff", 1, 100);
  const renderer = { shadowMap: { needsUpdate: false }, setClearColor() {}, getDrawingBufferSize(v) { return v.set(800, 600); } },
    effect = createAtmosphere(T, scene, renderer, { coords: (_name, x, z) => [x, z], hemi, sun, materialCache: new Map(), windowMats: [] }),
    state = weatherProfile("heavy", "day", "summer");
  effect.update("north", state, 7);
  const north = effect.stats.surfaceField;
  effect.update("north", state, 8);
  assert.deepEqual(effect.stats.surfaceField, north, "rain strikes move but the floor depressions stay put");
  effect.update("south", state, 9);
  assert.notDeepEqual(effect.stats.surfaceField.basinSeed, north.basinSeed);
  assert.equal(effect.stats.surfaceField.pixelMetres, 1 / BACKGROUND.texelsPerMetre);
  assert.deepEqual(effect.stats.surfaceField.pixelMetric, [...north.pixelMetric].reverse(), "south view rotates the same physical pigment grid");
  effect.update("room", state, 10);
  assert.equal(effect.stats.surfaceField, null);
});

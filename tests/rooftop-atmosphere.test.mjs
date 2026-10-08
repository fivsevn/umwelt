import test from "node:test";
import assert from "node:assert/strict";
import { WEATHER, TIMES, weatherProfile } from "../rooftop/weather.mjs";
import {
  lightPosition,
  lightningPulse,
  weatherMotion,
} from "../rooftop/atmosphere.mjs";
import { rainShape, rainStrike } from "../rooftop/precipitation.mjs";
import { weatherAction } from "../rooftop/resident-weather.mjs";
import { initialLayout, makeWalker, actorFits } from "../rooftop/scene.mjs";

test("all nine weather conditions distinguish seven lighting stages and respect the solar direction", () => {
  for (const w of WEATHER) {
    const states = TIMES.map((t) => weatherProfile(w.id, t.id));
    assert.equal(
      new Set(states.map((s) => [s.sky, s.ambient, s.direct, s.moon].join(":")))
        .size,
      7,
    );
    for (const s of states) {
      for (const k of ["ambient", "direct", "moon", "sunX", "sunY", "sunZ"])
        assert.ok(Number.isFinite(s[k]));
      const n = lightPosition(s),
        south = lightPosition(s, "south");
      assert.deepEqual(south, [n[2], n[1], -n[0]]);
      if (
        ["overcast", "rain", "heavy", "thunderstorm", "typhoon"].includes(w.id)
      )
        assert.equal(s.direct, 0);
      if (["evening", "late"].includes(s.phase)) assert.equal(s.direct, 0);
    }
  }
  const length = (phase) => {
    const [x, y, z] = lightPosition(weatherProfile("clear", phase));
    return Math.hypot(x, z) / y;
  };
  assert.ok(length("day") < length("morning") / 3);
  assert.ok(length("dusk") > length("afternoon") * 3);
  assert.ok(lightPosition(weatherProfile("clear", "dawn"))[0] > 0);
  assert.ok(lightPosition(weatherProfile("clear", "dusk"))[0] < 0);
});

test("rain types change density, footprints, strike locations and lifetime rather than repeating fixed ripples", () => {
  const bounds = [144, 144, 464, 464],
    types = ["rain", "heavy", "thunderstorm", "typhoon"];
  const shapes = types.map((condition) => rainShape({ condition }));
  assert.equal(new Set(shapes.map((s) => s.seed)).size, 4);
  const first = shapes.map((shape) => rainStrike(shape, 4, 10, bounds));
  assert.equal(new Set(first.map((p) => p.x + ":" + p.y)).size, 4);
  shapes.forEach((shape) => {
    assert.notDeepEqual(
      rainStrike(shape, 4, 10, bounds),
      rainStrike(shape, 4, 10 + shape.lifetime, bounds),
    );
    for (let i = 0; i < 100; i++) {
      const p = rainStrike(shape, i, 12, bounds);
      assert.ok(
        p.x >= 144 &&
          p.x <= 464 &&
          p.y >= 144 &&
          p.y <= 464 &&
          p.age >= 0 &&
          p.age < 1,
      );
    }
  });
  assert.ok(shapes[1].impacts > shapes[0].impacts * 3);
  assert.ok(shapes[3].splash > shapes[1].splash);
});

test("storm gusts and lightning remain visible with reduced motion", () => {
  const storm = weatherProfile("thunderstorm", "day"),
    gale = weatherProfile("typhoon", "day");
  const values = Array.from({ length: 2100 }, (_, i) =>
    lightningPulse(storm, i * 0.01),
  );
  assert.ok(Math.max(...values) > 0.9);
  assert.equal(lightningPulse(weatherProfile("rain", "day"), 4), 0);
  const index = values.indexOf(Math.max(...values));
  assert.ok(
    lightningPulse(storm, index * 0.01, true) > 0 &&
      lightningPulse(storm, index * 0.01, true) < values[index],
  );
  assert.ok(weatherMotion(gale, 10).wind > weatherMotion(storm, 10).wind * 1.5);
});

test("rain cancels watering immediately, residents shelter, and ordinary care resumes after rain", () => {
  const objects = initialLayout().scenes.north;
  let state = {};
  const walker = makeWalker("north", () => objects, {
    environment: () => state,
  });
  for (let i = 0; i < 20000 && walker.person.state !== "water"; i++)
    walker.update(0.1);
  assert.equal(walker.person.state, "water");
  state = weatherProfile("heavy", "day");
  walker.update(0.1);
  assert.notEqual(walker.person.state, "water");
  for (let i = 0; i < 5000 && !walker.person.sheltered; i++) {
    walker.update(0.1);
    assert.ok(actorFits("north", objects, walker.person.x, walker.person.y));
    assert.ok(
      !["water", "prune", "sweep", "wash"].includes(walker.person.state),
    );
  }
  assert.ok(walker.person.sheltered);
  walker.update(0.1);
  assert.ok(walker.person.insideShelter);
  state = weatherProfile("clear", "morning");
  walker.update(0.1);
  assert.equal(walker.person.sheltered, false);
  assert.ok(!walker.person.insideShelter);
});

test("both residents reach separate rain shelter spots across dense north and south layouts", () => {
  const originalRandom = Math.random;
  try {
    for (const scene of ["north", "south"])
      for (let seed = 1; seed <= 16; seed++) {
        let n = seed;
        Math.random = () => {
          n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
          return n / 2 ** 32;
        };
        const objects = initialLayout().scenes[scene];
        let weather = weatherProfile("clear", "afternoon"),
          pig;
        const person = makeWalker(scene, () => objects, {
          environment: () => weather,
          company: () => [pig?.person],
        });
        pig = makeWalker(scene, () => objects, {
          visits: 7,
          actor: "pig",
          body: { radius: 0.76, height: 1 },
          environment: () => weather,
          company: () => [person.person],
        });
        person.randomize();
        pig.randomize();
        weather = weatherProfile("rain", "afternoon");
        for (
          let i = 0;
          i < 1800 && (!person.person.sheltered || !pig.person.sheltered);
          i++
        ) {
          person.update(0.1);
          pig.update(0.08);
          assert.ok(
            Math.hypot(
              person.person.x - pig.person.x,
              person.person.y - pig.person.y,
            ) >=
              (0.48 + 0.76) * 16 - 0.001,
          );
          assert.ok(!["water", "prune", "wash"].includes(person.person.state));
        }
        assert.ok(
          person.person.sheltered && pig.person.sheltered,
          `${scene}, seed ${seed}: both residents must reach shelter`,
        );
      }
  } finally {
    Math.random = originalRandom;
  }
});

test("the two residents keep separate body clearance and pig actions across a dense arrangement", () => {
  const objects = initialLayout().scenes.north;
  let pig;
  const person = makeWalker("north", () => objects, {
    environment: () => weatherProfile("wind", "day"),
    company: () => [pig?.person],
  });
  pig = makeWalker("north", () => objects, {
    visits: 7,
    actor: "pig",
    body: { radius: 0.76, height: 1.0 },
    environment: () => weatherProfile("wind", "day"),
    company: () => [person.person],
  });
  person.randomize();
  pig.randomize();
  const beforeVisits = [person.person.visits, pig.person.visits];
  for (let i = 0; i < 15000; i++) {
    person.update(0.1);
    pig.update(0.08);
    assert.ok(
      Math.hypot(
        person.person.x - pig.person.x,
        person.person.y - pig.person.y,
      ) >=
        (0.48 + 0.76) * 16 - 0.001,
    );
    assert.ok(actorFits("north", objects, person.person.x, person.person.y));
    assert.ok(
      actorFits("north", objects, pig.person.x, pig.person.y, {
        radius: 0.76,
        height: 1,
      }),
    );
    assert.ok(
      !["water", "prune", "wash", "wipe", "sweep"].includes(pig.person.state),
    );
  }
  assert.ok(
    person.person.visits - beforeVisits[0] > 10 &&
      pig.person.visits - beforeVisits[1] > 10,
  );
  for (const condition of [
    "clear",
    "wind",
    "rain",
    "thunderstorm",
    "typhoon",
  ]) {
    const s = weatherProfile(condition, "day");
    const actions = new Set(
      Array.from(
        { length: 3 },
        (_, i) => weatherAction(s, "pig", i, { sheltered: true }).state,
      ),
    );
    assert.equal(actions.size, 3);
  }
});

test('shadow maps reuse fixed lighting and invalidate on edits, motion and scene changes', async () => {
  const { createRequire } = await import('node:module');
  const T = createRequire(import.meta.url)('../rooftop/3d/vendor/three.min.js');
  const { createAtmosphere } = await import('../rooftop/3d/atmosphere.mjs');
  const scene = new T.Scene(), sun = new T.DirectionalLight(), hemi = new T.HemisphereLight();
  scene.fog = new T.Fog("#ffffff", 1, 100);
  const renderer = { shadowMap: { needsUpdate: true }, setClearColor() {}, getDrawingBufferSize(v) { return v.set(800, 600); } };
  const atmosphere = createAtmosphere(T, scene, renderer, { coords: (_scene,x,z) => [x,z], sun, hemi, materialCache: new Map(), windowMats: [] });
  const state = weatherProfile('clear', 'day', 'spring');
  atmosphere.update('north', state, 0);
  const refresh = (name, time, moving = false) => {
    const result = atmosphere.refreshShadows(name, time, moving);
    renderer.shadowMap.needsUpdate = false; // what a completed renderer pass does
    return result;
  };
  assert.equal(refresh('north', 0), true);
  assert.equal(refresh('north', 2), false, 'colour/intensity changes alone do not rebuild depth');
  sun.position.x += 4;
  assert.equal(refresh('north', 2.01), true, 'sun direction changes refresh the depth map');
  assert.equal(refresh('north', 2.1, true), false, 'moving shadows have a bounded refresh rate');
  assert.equal(refresh('north', 2.5, true), true);
  renderer.shadowMap.needsUpdate = true;
  assert.equal(refresh('north', 2.51), true, 'an edit refreshes immediately');
  assert.equal(refresh('room', 2.52), true, 'entering a room refreshes its lamp shadow');
});

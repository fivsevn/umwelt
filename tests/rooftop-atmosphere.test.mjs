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

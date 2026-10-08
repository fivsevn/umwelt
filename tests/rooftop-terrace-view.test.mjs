import test from "node:test";
import assert from "node:assert/strict";
import {
  HOUSE,
  housePoint,
  terracePoint,
} from "../rooftop/house-structure.mjs";
import { SCENES, ASSETS } from "../rooftop/scene.mjs";
import {
  TERRACE_ZOOM,
  terraceFrame,
  constrainTerracePan,
} from "../rooftop/3d/terrace-view.mjs";
import { notebookEntry } from "../rooftop/notebook.mjs";
import { makeWeather, weatherProfile } from "../rooftop/weather.mjs";
import { rainShape } from "../rooftop/precipitation.mjs";
import { actionCaption } from "../rooftop/resident-weather.mjs";

test("north and south touch opposite eaves of the same house without moving saved layouts", () => {
  assert.equal(SCENES.north.house, SCENES.south.house);
  assert.equal(SCENES.north.house, HOUSE.id);
  assert.deepEqual(housePoint("north", 0, 4), [0, 4]);
  assert.deepEqual(housePoint("south", -4, 0), [-0, 24]);
  for (const scene of ["north", "south"])
    for (const p of [
      [3, 4],
      [-7, 8],
      [0, -12],
    ])
      assert.deepEqual(terracePoint(scene, ...housePoint(scene, ...p)), p);
});
test("current terrace fits at the minimum zoom and panning stays within its projected bounds", () => {
  assert.equal(TERRACE_ZOOM.min, 1);
  assert.ok(TERRACE_ZOOM.max >= 3);
  for (const scene of ["north", "south"])
    for (const [w, h] of [
      [320, 568],
      [390, 844],
      [1440, 900],
      [844, 390],
    ])
      for (const theta of [-1.23, -0.34, 0.5]) {
        const phi = 0.87,
          f = terraceFrame(scene, w, h, theta, phi);
        assert.ok(f.width >= f.bounds[2] - f.bounds[0]);
        assert.ok(f.span >= f.bounds[3] - f.bounds[1]);
        assert.deepEqual(
          constrainTerracePan(f, { x: 1e6, z: -1e6 }, 1, theta, phi),
          f.target,
        );
        for (const zoom of [2, 3.5])
          for (const sign of [-1, 1]) {
            const p = constrainTerracePan(
              f,
              { x: sign * 1e6, z: -sign * 1e6 },
              zoom,
              theta,
              phi,
            );
            const u = Math.cos(theta) * p.x - Math.sin(theta) * p.z,
              v =
                (Math.sin(theta) * p.x + Math.cos(theta) * p.z) * Math.sin(phi);
            for (const [n, lo, hi, span] of [
              [u, f.bounds[0], f.bounds[2], f.width / zoom],
              [v, f.bounds[1], f.bounds[3], f.span / zoom],
            ])
              if (span <= hi - lo) {
                assert.ok(n - span / 2 >= lo - 1e-8);
                assert.ok(n + span / 2 <= hi + 1e-8);
              }
          }
      }
});
test("every item has objective text, an individual one-sentence observation and usable references", () => {
  const comments = new Set();
  for (const a of ASSETS) {
    const e = notebookEntry({ type: a.id });
    assert.ok(e.description && e.comment && e.sources.length, a.id);
    assert.equal((e.comment.match(/[。！？]/g) || []).length, 1, a.id);
    assert.ok(!comments.has(e.comment), a.id);
    comments.add(e.comment);
    assert.doesNotMatch(
      e.description,
      /像素|生成|绘制|转译|图里|参考真实器物结构/,
    );
    assert.doesNotMatch(e.comment, /东东的评论/);
    for (const s of e.sources) assert.match(s.url, /^https?:\/\//);
  }
});
test("weather progress is time-based, interruptible, and keeps rainfall speed independent of page age", () => {
  const a = makeWeather({ condition: "clear", phase: "day" }),
    b = makeWeather({ condition: "clear", phase: "day" });
  for (const c of [a, b]) c.set("condition", "typhoon");
  for (let i = 0; i < 60; i++) a.update(1 / 60);
  for (let i = 0; i < 10; i++) b.update(0.1);
  assert.ok(Math.abs(a.state.rain - b.state.rain) < 1e-9);
  assert.ok(a.state.rain < 0.1);
  assert.equal(a.state.rainIntent, 1);
  for (let i = 0; i < 80; i++) a.update(0.1);
  assert.equal(a.state.rain, 1);
  a.set("condition", "clear");
  a.update(0.05);
  assert.equal(a.state.activityCondition, "typhoon");
  assert.equal(a.state.visualCondition, "typhoon");
  a.set("condition", "typhoon");
  a.update(8);
  const before = a.state,
    shape = rainShape(before);
  a.set("condition", "rain");
  a.update(0);
  assert.equal(a.state.rain, before.rain);
  assert.deepEqual(rainShape(a.state), shape);
  a.update(0.1);
  assert.ok(a.state.rainClock - before.rainClock < 0.21);
  assert.equal(a.state.roomSunY, weatherProfile("rain", "day").roomSunY);
});
test("the action card describes actual residents independently of the weather caption", () => {
  const text = actionCaption(
    { state: "comfort", sheltered: true },
    { state: "curl", sheltered: true },
    { weather: { rain: 1 } },
  );
  assert.match(text, /东东陪小猪等雷雨过去/);
  assert.match(text, /小猪蜷起来休息/);
  assert.match(text, /门边/);
  assert.doesNotMatch(
    actionCaption(
      { state: "walk", task: "去门边避雨" },
      { state: "walk", task: "去门边避雨" },
      { weather: { rain: 1 } },
    ),
    /两人在门边/,
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  HOUSE,
  housePoint,
  terracePoint,
  houseOccludes,
} from "../rooftop/house-structure.mjs";
import { SCENES, ASSETS, inside } from "../rooftop/scene.mjs";
import {
  TERRACE_ZOOM,
  TERRACE_VIEW_DISTANCE,
  terraceOrbit,
  terraceFrame,
  constrainTerracePan,
} from "../rooftop/3d/terrace-view.mjs";
import { NEIGHBORHOOD_BUILDINGS } from "../rooftop/3d/neighborhood.mjs";
import { notebookEntry } from "../rooftop/notebook.mjs";
import { makeWeather, weatherProfile } from "../rooftop/weather.mjs";
import { rainShape } from "../rooftop/precipitation.mjs";
import {
  actionCaption,
  createActionCard,
} from "../rooftop/resident-weather.mjs";

test("north and south touch opposite eaves of the same house without moving saved layouts", () => {
  assert.equal(SCENES.north.house, SCENES.south.house);
  assert.equal(SCENES.north.house, HOUSE.id);
  assert.deepEqual(housePoint("north", 0, 4), [0, 4]);
  assert.deepEqual(housePoint("south", -4, 0), [
    -0,
    HOUSE.roof.z + HOUSE.roof.depth,
  ]);
  for (const scene of ["north", "south"])
    for (const p of [
      [3, 4],
      [-7, 8],
      [0, -12],
    ])
      assert.deepEqual(terracePoint(scene, ...housePoint(scene, ...p)), p);
});
test("terrace close-view limits retain local panning without a distant overview", () => {
  assert.equal(TERRACE_ZOOM.min, 1.8);
  assert.ok(TERRACE_ZOOM.max >= 3);
  for (const scene of ["north", "south"])
    for (const [w, h] of [
      [320, 568],
      [390, 844],
      [1440, 900],
      [844, 390],
    ])
      for (const theta of [-1.23, -0.34, 0.5]) {
        const phi = 0.55,
          f = terraceFrame(scene, w, h, theta, phi);
        assert.ok(f.width >= f.bounds[2] - f.bounds[0]);
        assert.ok(f.span >= f.bounds[3] - f.bounds[1]);
        const centred = constrainTerracePan(
          f,
          f.target,
          TERRACE_ZOOM.min,
          theta,
          phi,
        );
        assert.ok(
          Math.hypot(centred.x - f.target.x, centred.z - f.target.z) < 1e-8,
        );
        for (const zoom of [TERRACE_ZOOM.min, 2, 4.5])
          for (const sign of [-1, 1]) {
            const p = constrainTerracePan(
              f,
              { x: sign * 1e6, z: -sign * 1e6 },
              zoom,
              theta,
              phi,
            );
            assert.ok(Number.isFinite(p.x) && Number.isFinite(p.z));
            const moved = Math.hypot(p.x - centred.x, p.z - centred.z);
            assert.ok(
              moved > 1,
              "panning remains available at the furthest view",
            );
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
    assert.doesNotMatch(
      e.comment,
      /东东的评论|[我你他她它谁]|规矩|规定|难道|凭什么/,
    );
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

test("full rotation and local panning never reveal the opposite balcony through the real house", () => {
  for (const scene of ["north", "south"])
    for (const [w, h] of [
      [390, 844],
      [320, 568],
      [320, 900],
      [1440, 900],
      [844, 390],
    ]) {
      const limits = terraceOrbit(scene, w),
        other = scene === "north" ? "south" : "north";
      assert.equal(limits.fullRotation, true);
      assert.ok(
        0.2 + Math.sin(limits.minPhi) * TERRACE_VIEW_DISTANCE >
          HOUSE.roof.ridge,
        "the lowest view stays above the real roof, with no camera penetration",
      );
      const [cx, cz] = other === "north" ? [304, 272] : [284, 264];
      const points = [];
      for (let x = 140; x <= 464; x += 16)
        for (let z = 80; z <= 464; z += 16)
          if (inside(other, x, z))
            for (const y of [0, 2, 4.2])
              points.push([
                ...housePoint(other, (x - cx) / 16, (z - cz) / 16),
                y,
              ]);
      for (const theta of Array.from(
        { length: 64 },
        (_, i) => (i * Math.PI) / 32,
      ))
        for (const phi of [limits.minPhi, 0.75, 1.05, limits.maxPhi]) {
          const frame = terraceFrame(scene, w, h, theta, phi);
          for (const zoom of [TERRACE_ZOOM.min, TERRACE_ZOOM.max])
            for (const sx of [-1, 1])
              for (const sz of [-1, 1]) {
                const target = constrainTerracePan(
                  frame,
                  { x: sx * 1e6, z: sz * 1e6 },
                  zoom,
                  theta,
                  phi,
                );
                const c = Math.cos(theta),
                  s = Math.sin(theta),
                  sp = Math.sin(phi),
                  cp = Math.cos(phi);
                const u = c * target.x - s * target.z,
                  v = sp * (s * target.x + c * target.z);
                const eyeXZ = housePoint(
                  scene,
                  target.x + s * cp * TERRACE_VIEW_DISTANCE,
                  target.z + c * cp * TERRACE_VIEW_DISTANCE,
                );
                const eye = [
                  eyeXZ[0],
                  0.2 + sp * TERRACE_VIEW_DISTANCE,
                  eyeXZ[1],
                ];
                for (const [hx, hz, y] of points) {
                  const [x, z] = terracePoint(scene, hx, hz),
                    pu = c * x - s * z,
                    pv = sp * (s * x + c * z) - cp * (y - 0.2);
                  const depth =
                    (target.x + s * cp * TERRACE_VIEW_DISTANCE - x) * s * cp +
                    (0.2 + sp * TERRACE_VIEW_DISTANCE - y) * sp +
                    (target.z + c * cp * TERRACE_VIEW_DISTANCE - z) * c * cp;
                  const inFrame =
                    depth >= 0.1 &&
                    depth <= 500 &&
                    Math.abs(((pu - u) * TERRACE_VIEW_DISTANCE) / depth) <=
                      frame.width / zoom / 2 &&
                    Math.abs(((pv - v) * TERRACE_VIEW_DISTANCE) / depth) <=
                      frame.span / zoom / 2;
                  assert.ok(
                    !inFrame || houseOccludes(eye, [hx, y, hz]),
                    `${scene} ${w}x${h} theta=${theta} phi=${phi} zoom=${zoom}: ${other} point ${hx},${y},${hz}`,
                  );
                }
              }
        }
    }
});
test("action cards hold through pose changes and update only for meaningful episodes", () => {
  const card = createActionCard(),
    person = { state: "tea", sheltered: true },
    pig = { state: "curl", sheltered: true };
  const context = {
    scene: "north",
    present: true,
    weather: { condition: "rain", phase: "afternoon", rain: 1 },
  };
  const first = card.update(person, pig, context);
  for (let i = 0; i < 600; i++)
    assert.equal(
      card.update(
        { ...person, state: "dry-hands" },
        { ...pig, state: "shake" },
        context,
      ),
      first,
    );
  assert.notEqual(
    card.update(person, pig, { ...context, present: false }),
    first,
  );
  const dry = {
    ...context,
    weather: { condition: "clear", phase: "afternoon", rain: 0 },
  };
  const dryText = card.update(
    { ...person, state: "inspect" },
    { ...pig, state: "bask" },
    dry,
  );
  assert.equal(
    card.update({ ...person, state: "walk" }, { ...pig, state: "walk" }, dry),
    dryText,
  );
});

test("the balcony is a small part of a long house with clear space to neighbouring blocks", () => {
  const r = HOUSE.roof;
  assert.ok(r.width > 100 && r.width > r.depth * 2);
  assert.ok(r.ridge > r.eave + 7);
  for (const [x, z, w, d, floors, angle = 0] of NEIGHBORHOOD_BUILDINGS) {
    // Neighbour groups use a uniform scale of two, including their windows.
    const halfX = Math.abs(Math.cos(angle)) * w + Math.abs(Math.sin(angle)) * d,
      halfZ = Math.abs(Math.sin(angle)) * w + Math.abs(Math.cos(angle)) * d,
      dx = Math.max(r.x - (x + halfX), x - halfX - (r.x + r.width), 0),
      dz = Math.max(r.z - (z + halfZ), z - halfZ - (r.z + r.depth), 0);
    assert.equal(floors, 6);
    assert.ok(
      Math.hypot(dx, dz) >= 25,
      "roads and courtyards stay between full-size buildings",
    );
  }
});

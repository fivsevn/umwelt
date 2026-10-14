import test from "node:test";
import assert from "node:assert/strict";
import {
  HOUSE,
  housePoint,
  terracePoint,
  houseOccludes,
} from "../house-structure.mjs";
import { SCENES, ASSETS, inside } from "../scene.mjs";
import {
  TERRACE_ZOOM,
  TERRACE_VIEW_DISTANCE,
  terraceOrbit,
  terraceFrame,
  constrainTerracePan,
} from "../3d/terrace-view.mjs";
import { BACKGROUND } from "../assets/background/empty-rooftop.mjs";
import { notebookEntry } from "../notebook.mjs";
import { makeWeather, weatherProfile } from "../weather.mjs";
import { rainShape } from "../precipitation.mjs";
import {
  actionCaption,
  createActionCard,
} from "../resident-weather.mjs";

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
    assert.ok(e.description && e.comment, a.id);
    if (a.plant || a.weapon || a.category === "收藏") assert.ok(e.sources.length, a.id);
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

test("the legacy editor and reference orbit starts on its open side outside the intact house", () => {
  for (const scene of ["north", "south"])
    for (const width of [320, 390, 844, 1440]) {
      const limits=terraceOrbit(scene,width);
      assert.equal(limits.fullRotation,true);
      const outward=scene === "north" ? Math.PI : Math.PI/2;
      assert.ok(Math.abs(limits.theta-(outward-.34))<1e-9);
      assert.ok(.2+Math.sin(limits.minPhi)*TERRACE_VIEW_DISTANCE>HOUSE.roof.ridge);
      for(const theta of [0,Math.PI/2,Math.PI,3*Math.PI/2,limits.theta]) {
        const frame=terraceFrame(scene,width,844,theta,limits.minPhi);
        const point=housePoint(scene,frame.target.x+Math.sin(theta)*Math.cos(limits.minPhi)*TERRACE_VIEW_DISTANCE,frame.target.z+Math.cos(theta)*Math.cos(limits.minPhi)*TERRACE_VIEW_DISTANCE);
        const eye=[point[0],.2+Math.sin(limits.minPhi)*TERRACE_VIEW_DISTANCE,point[1]];
        assert.equal(houseOccludes(eye,eye),false);
        const garden=scene==="north"?[[-5,-5],[0,-5],[5,-5]]:[[1,-5],[1,0],[1,5]];
        if(theta===limits.theta)assert.ok(garden.some(([x,z])=>{const p=housePoint(scene,x,z);return !houseOccludes(eye,[p[0],0,p[1]]);}),"the initial camera sees the garden without cutting away its house");
      }
    }
  // A compact real building permits views of the opposite balcony from outside
  // that facade. Only rays through the actual solid house must be occluded.
  assert.equal(houseOccludes([-2,2,-5],[-2,2,16]),true);
  assert.equal(houseOccludes([-2,2,34],[-2,2,16]),true);
  assert.equal(houseOccludes([-2,20,-5],[-2,0,32]),true);
  assert.equal(houseOccludes([-2,80,-5],[-2,0,32]),false);
  assert.equal(houseOccludes([8,2,-4],[8,1,10]),false,"open north entry lane stays pickable");
  assert.equal(houseOccludes([16,2,-4],[16,1,10]),true,"solid inter-pair bay occludes its actual volume");
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
  if (BACKGROUND.format === 'blender-environment-v2') {
    assert.ok(BACKGROUND.parts.some(p => p.layer === 'near'));
    assert.ok(BACKGROUND.parts.some(p => p.layer === 'far' && p.style === 'baked'));
  }
  for (const {x,z,width,depth,storeys,angle} of BACKGROUND.neighbourhood.oldBlocks || []) {
    const halfX = (Math.abs(Math.cos(angle)) * width + Math.abs(Math.sin(angle)) * depth)/2,
      halfZ = (Math.abs(Math.sin(angle)) * width + Math.abs(Math.cos(angle)) * depth)/2,
      dx = Math.max(r.x - (x + halfX), x - halfX - (r.x + r.width), 0),
      dz = Math.max(r.z - (z + halfZ), z - halfZ - (r.z + r.depth), 0);
    assert.equal(storeys, 6);
    assert.ok(
      Math.hypot(dx, dz) >= 12,
      "roads and courtyards stay between full-size buildings",
    );
  }
});


test("game terrace travel cannot pan out to the architectural district", () => {
  for (const scene of ["north", "south"])
    for (const [width, height] of [[320, 568], [390, 844], [844, 390], [1440, 900]])
      for (let step = 0; step < 16; step++) {
        const theta = step * Math.PI / 8,
          limits = terraceOrbit(scene, width);
        for (const phi of [limits.minPhi, limits.phi, limits.maxPhi])
          for (const zoom of [TERRACE_ZOOM.min, TERRACE_ZOOM.max]) {
            const frame = terraceFrame(scene, width, height, theta, phi);
            for (const sign of [-1, 1]) {
              const clamped = constrainTerracePan(frame, {
                x: sign * 1000000,
                z: -sign * 1000000,
              }, zoom, theta, phi);
              assert.ok(Math.hypot(clamped.x - frame.target.x, clamped.z - frame.target.z) < 25,
                "dragging stays within one terrace and its immediate neighbours");
            }
          }
      }
});

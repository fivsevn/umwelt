import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";
import {
  NARRATIVE_VIEWS,
  narrativePreset,
  narrativeFrame,
  narrativePose,
  constrainNarrativeHead,
  constrainNarrativeTarget,
  constrainNarrativeStation,
  nudgeNarrativeStation,
  narrativeDrag,
  birdHeadAtStation,
} from "../rooftop/3d/story-camera.mjs";
import { housePoint, HOUSE, houseOccludes } from "../rooftop/house-structure.mjs";
import { inside } from "../rooftop/scene.mjs";
import { BACKGROUND } from "../rooftop/assets/background/empty-rooftop.mjs";
import { lensUnwarpNdc } from "../rooftop/3d/lens-pass.mjs";
import { nativeArchitectureRays } from "./helpers/rooftop-native-rays.mjs";

test("each terrace has three distinct fixed stations on the roof and opposite open side", () => {
  assert.deepEqual(NARRATIVE_VIEWS.map(p => p.id), ["bird", "drone", "neighbor"]);
  for (const scene of ["north", "south"]) {
    const bird = narrativePreset(scene, "bird"), drone = narrativePreset(scene, "drone"), neighbor = narrativePreset(scene, "neighbor");
    const positions = [bird, drone, neighbor].map(p => {
      const [x, z] = housePoint(scene, p.eye[0], p.eye[2]);
      assert.equal(houseOccludes([x, p.eye[1], z], [x, p.eye[1], z]), false, "station stays outside an intact building volume");
      return [x, z];
    });
    if (scene === "north") {
      assert.equal(positions[0][0], 0, "bird sits at the centre of its own eave");
      assert.ok(Math.abs(positions[0][1] - HOUSE.roof.z) < 1);
      assert.ok(positions[1][0] > 0 && positions[2][0] < 0, "drone and neighbor see complementary sides");
      assert.ok(positions[1][1] < -12 && positions[2][1] < positions[1][1]);
    } else {
      assert.ok(Math.abs(positions[0][0]) < 1e-9);
      assert.ok(Math.abs(positions[0][1] - 28) < 1);
      assert.ok(positions[1][1] > 36 && positions[2][1] > positions[1][1]);
    }
    assert.ok(narrativePose(bird).distance < narrativePose(drone).distance);
    assert.ok(narrativePose(drone).distance < narrativePose(neighbor).distance);
    assert.equal(bird.eye[1], 6.1);
    if (scene === "south") assert.ok(drone.eye[2] > 0 && neighbor.eye[2] < 0);
  }
  const fresh = narrativePreset("north", "bird");
  fresh.eye[0] = 999;
  assert.equal(narrativePreset("north", "bird").eye[0], 0, "scene reset obtains a fresh immutable station");
  assert.equal(narrativePreset("south", "neighbor").id, "neighbor", "changing terrace preserves the chosen kind of view");
});

test("head movement and local aim remain bounded while neighbor zoom can isolate close details", () => {
  for (const scene of ["north", "south"])
    for (const { id } of NARRATIVE_VIEWS) {
      const preset = narrativePreset(scene, id);
      for (const sign of [-1, 1]) {
        const state = constrainNarrativeHead(preset, sign * 10000, sign * 10000);
        assert.equal(state.theta, sign * preset.yaw);
        assert.equal(state.phi, sign * preset.pitch);
        const point = constrainNarrativeTarget(preset, { x: sign * 10000, y: 10000, z: -sign * 10000 });
        assert.ok(Math.abs(point.x - preset.target[0]) <= preset.travel);
        assert.ok(Math.abs(point.z - preset.target[2]) <= preset.travel);
        const pose = narrativePose(preset, state, [point.x, point.y, point.z]);
        assert.deepEqual(pose.eye, preset.eye, "turning the head never orbits the observer around the district");
        assert.ok(pose.pitch < -.03, "every supported direction still looks down toward the balcony");
      }
      for (const [w, h] of [[320, 568], [407, 662], [1440, 900]]) {
        const frame = narrativeFrame(preset, w, h);
        assert.ok(frame.zoom.min <= 1 && frame.zoom.max >= 1);
        if (id === "neighbor") {
          assert.ok(Math.abs(frame.span / frame.zoom.max - preset.minSpan) < 1e-9);
          assert.ok(Math.abs(frame.span / frame.zoom.min - preset.maxSpan) < 1e-9);
          assert.ok(frame.zoom.max / frame.zoom.min > 8);
          assert.ok(preset.minSpan <= 3 && preset.span <= 14);
        } else {
          assert.deepEqual(frame.zoom, { min: 1, max: 1 }, "bird and drone retain a fixed optical lens");
          if (id === "drone") assert.ok(frame.width <= preset.maxWidth + 1e-9 && frame.span <= 14);
        }
      }
    }
});

test("direct view gestures keep bird head coupled to walking and drone head coupled only to lateral dragging", () => {
  for (const scene of ["north", "south"]) {
    const bird = narrativePreset(scene, "bird"), drone = narrativePreset(scene, "drone");
    for (const sign of [-1, 1]) {
      const b = narrativeDrag(bird, {}, sign * 1e5, sign * 1e5);
      assert.equal(b.station.walk, -sign * bird.station.walk);
      assert.equal(b.theta, -sign * bird.yaw);
      assert.equal(b.phi, sign * bird.pitch);
      assert.deepEqual({ theta: b.theta, phi: b.phi }, birdHeadAtStation(bird, b.station, b.phi));
      const d = narrativeDrag(drone, {}, sign * 1e5, sign * 1e5);
      assert.equal(d.station.height, sign * drone.station.height);
      assert.equal(d.theta, -sign * drone.yaw);
      assert.equal(d.phi, 0);
      assert.equal(d.station.dolly, 0, "dragging does not implicitly change drone range");
    }
    const source = readFileSync(new URL("../rooftop/3d/scene3d.mjs", import.meta.url), "utf8");
    assert.match(source, /else if \(narrativeActive\(\) \|\|/);
    assert.match(source, /nudgeNarrativeOptics\(action\)/);
    assert.match(source, /narrativeView === "bird"\) return/);
  }
});

test("every preset keeps perspective ground picking in the existing terrace coordinate system", () => {
  const context = { console: { warn() {} } };
  vm.runInNewContext(readFileSync(new URL("../rooftop/3d/vendor/three.min.js", import.meta.url), "utf8"), context);
  const T = context.THREE;
  for (const scene of ["north", "south"])
    for (const { id } of NARRATIVE_VIEWS) {
      const preset = narrativePreset(scene, id), frame = narrativeFrame(preset, 407, 662), pose = narrativePose(preset),
        camera = new T.PerspectiveCamera(2 * Math.atan(frame.span / (2 * pose.distance)) * 180 / Math.PI, 407 / 662, .1, 6000);
      camera.position.set(...pose.eye); camera.lookAt(...pose.target);
      const centre = scene === "north" ? [304, 272] : [284, 264];
      for (const zoom of [frame.zoom.min, 1, frame.zoom.max]) {
        camera.zoom = zoom; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
        const point = new T.Vector3(scene === "north" ? 0 : 1, 0, scene === "north" ? -3 : 0),
          projected = point.clone().project(camera), ray = new T.Raycaster();
        ray.setFromCamera(new T.Vector2(projected.x, projected.y), camera);
        const recovered = ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), 0), new T.Vector3());
        assert.ok(recovered && recovered.distanceTo(point) < 1e-8, "screen projection and game floor picking are inverse operations");
        assert.ok(inside(scene, recovered.x * 16 + centre[0], recovered.z * 16 + centre[1]));
      }
    }
});

test("bird eave walking and drone height and dolly stay inside their physical travel limits", () => {
  for (const scene of ["north", "south"]) for (const { id } of NARRATIVE_VIEWS) {
    const preset = narrativePreset(scene, id), base = narrativePose(preset);
    for (const action of ["left", "right", "up", "down", "near", "far"]) {
      let station = { walk: 0, height: 0, dolly: 0 };
      for (let i = 0; i < 40; i++) station = nudgeNarrativeStation(preset, station, action);
      assert.deepEqual(station, constrainNarrativeStation(preset, station));
      const pose = narrativePose(preset, { station }), [x, z] = housePoint(scene, pose.eye[0], pose.eye[2]);
      assert.equal(houseOccludes([x, pose.eye[1], z], [x, pose.eye[1], z]), false);
      if (id === "neighbor") assert.deepEqual(pose.eye, base.eye);
      if (id === "bird") {
        assert.equal(pose.eye[1], base.eye[1]);
        const axis = scene === "north" ? 0 : 2;
        assert.equal(pose.eye[axis] - base.eye[axis], station.walk);
        assert.equal(pose.eye[2 - axis], base.eye[2 - axis]);
      }
      if (id === "drone" && ["near", "far"].includes(action)) {
        assert.ok(Math.abs(pose.distance - base.distance + station.dolly) < 1e-9, "dolly changes actual observer distance rather than optical zoom");
      }
    }
  }
});

function reachableInputStates(preset) {
  if (preset.id === "bird") return [-1, -.5, 0, .5, 1].flatMap(walk => [-1, 0, 1].map(pitch => {
    const state = narrativeDrag(preset, {}, -walk * preset.station.walk / .018, pitch * preset.pitch / .0008);
    return { ...state, target: preset.target };
  }));
  if (preset.id === "drone") return [-1, 0, 1].flatMap(height => [-1, 0, 1].flatMap(dolly => [-1, 0, 1].map(yaw => {
    const state = narrativeDrag(preset, {}, -yaw * preset.yaw / .002, height * preset.station.height / .015);
    state.station.dolly = dolly * preset.station.dolly;
    return { ...state, target: preset.target };
  })));
  return [-1, -2/3, -1/3, 0, 1/3, 2/3, 1].flatMap(x => [-1, -2/3, -1/3, 0, 1/3, 2/3, 1].map(z => ({
    target: [preset.target[0] + x * preset.travel, preset.target[1], preset.target[2] + z * preset.travel],
    station: {}, theta: 0, phi: 0,
  })));
}

const droneFramingReports = [];

function cameraRayInHouse(T, camera, scene, x, y) {
  const raycaster = new T.Raycaster(); raycaster.setFromCamera(new T.Vector2(x, y), camera);
  const r = raycaster.ray, [ex, ez] = housePoint(scene, r.origin.x, r.origin.z),
    [px, pz] = housePoint(scene, r.origin.x + r.direction.x, r.origin.z + r.direction.z);
  return new T.Ray(new T.Vector3(ex, r.origin.y, ez), new T.Vector3(px - ex, r.direction.y, pz - ez).normalize());
}

test("all reachable drone limits keep the frame bottom on the upper floors instead of the street", () => {
  const context = { console: { warn() {} } };
  vm.runInNewContext(readFileSync(new URL("../rooftop/3d/vendor/three.min.js", import.meta.url), "utf8"), context);
  const T = context.THREE, native = nativeArchitectureRays(T, {
    envelope: new T.Box3(new T.Vector3(-180, -40, -170), new T.Vector3(180, 30, 170)),
  });
  // Authored fifth-floor window centres are -3.2; lower storeys repeat every
  // 5.6 units. Include a small modelling tolerance below its lower edge.
  const fifthFloorLowerEdge = -6;
  for (const scene of ["north", "south"]) for (const [width, height] of [[320, 568], [407, 662], [1440, 900], [1920, 1080], [844, 390]]) {
    const preset = narrativePreset(scene, "drone"), frame = narrativeFrame(preset, width, height), base = narrativePose(preset),
      camera = new T.PerspectiveCamera(2 * Math.atan(frame.span / (2 * base.distance)) * 180 / Math.PI, width / height, .1, 6000),
      results = { scene, width, height, span: frame.span, horizontalSpan: frame.width, states: 0, samples: 0, minHeight: Infinity, groundHits: 0, misses: 0, worst: null };
    for (const state of reachableInputStates(preset)) {
      const pose = narrativePose(preset, state, state.target);
      camera.position.set(...pose.eye); camera.lookAt(...pose.target); camera.zoom = 1;
      camera.updateProjectionMatrix(); camera.updateMatrixWorld(); results.states++;
      for (const y of [-1, -.98, -.9]) for (const x of [-1, -.5, 0, .5, 1]) {
        const hit = native.hit(cameraRayInHouse(T, camera, scene, x, y)); results.samples++;
        if (!hit) { results.misses++; continue; }
        if (hit.layer === "ground") results.groundHits++;
        if (hit.point.y < results.minHeight) {
          results.minHeight = hit.point.y;
          results.worst = { station: state.station, theta: state.theta, screen: [x, y], point: hit.point.toArray(), field: hit.field };
        }
      }
    }
    assert.equal(results.misses, 0, "frame-bottom rays are checked against complete exported nearby architecture and road geometry");
    assert.equal(results.groundHits, 0, "every allowed station/head extreme avoids the actual road and ground meshes");
    assert.ok(results.minHeight >= fifthFloorLowerEdge, scene + " frame bottom stays around fifth-floor height or above: " + results.minHeight);
    results.minHeight = Number(results.minHeight.toFixed(4));
    results.nativeTriangles = native.triangles;
    droneFramingReports.push(results);
  }
});

test("reachable direct gestures permit complementary actual terrace floor coverage without any cutaway", t => {
  const context = { console: { warn() {} } };
  vm.runInNewContext(readFileSync(new URL("../rooftop/3d/vendor/three.min.js", import.meta.url), "utf8"), context);
  const T = context.THREE, house = nativeArchitectureRays(T, {
    layers: ["near"], excludeFloor: true,
    envelope: new T.Box3(new T.Vector3(-84, .1, -14), new T.Vector3(68, 16, 39)),
  }), reports = [];
  assert.ok(house.bounds.max.y >= HOUSE.roof.ridge - .001, "the complete roof ridge participates in ray intersections");
  const grid = (xs, zs, field) => xs.flatMap(x => zs.map(z => ({ point: [x, .06, z], field })));
  for (const scene of ["north", "south"]) {
    const cells = scene === "north" ? [
      ...grid([-9, -7, -5, -3, -1, 1, 3, 5, 7, 9], [-7, -5, -3, -1, 1, 3], "main"),
      ...grid([-1, 1, 3, 5], [-11, -9], "bay"),
      ...grid([7, 9], [5, 7, 9, 11], "passage"),
    ] : grid([-3, -1, 1, 3], [-9, -7, -5, -3, -1, 1, 3, 5, 7, 9], "main");
    for (const [width, height] of [[407, 662], [390, 844], [320, 700], [1440, 900]]) {
      const union = new Set(), defaultOccluders = {};
      for (const { id } of NARRATIVE_VIEWS) {
        const preset = narrativePreset(scene, id), frame = narrativeFrame(preset, width, height), base = narrativePose(preset),
          camera = new T.PerspectiveCamera(2 * Math.atan(frame.span / (2 * base.distance)) * 180 / Math.PI, width / height, .1, 6000),
          defaults = new Set(), reachable = new Set(), defaultClear = new Set(), stationChecks = [];
        const include = (state, zoom, found, clearSet) => {
          const pose = narrativePose(preset, state, state.target || preset.target), [ex, ez] = housePoint(scene, pose.eye[0], pose.eye[2]),
            eye = new T.Vector3(ex, pose.eye[1], ez), occluders = [];
          assert.equal(houseOccludes([ex, pose.eye[1], ez], [ex, pose.eye[1], ez]), false, "physical camera extrema stay outside the complete house");
          camera.position.set(...pose.eye); camera.lookAt(...pose.target); camera.zoom = zoom;
          camera.updateProjectionMatrix(); camera.updateMatrixWorld();
          cells.forEach(({ point }, i) => {
            const [x, z] = housePoint(scene, point[0], point[2]), target = new T.Vector3(x, point[1], z), direction = target.clone().sub(eye),
              hit = house.hit(new T.Ray(eye, direction.clone().normalize()), direction.length() - .04);
            occluders.push(hit ? { field: hit.field, point: hit.point.toArray().map(v => Number(v.toFixed(4))) } : null);
            if (hit) return;
            clearSet?.add(i);
            const p = new T.Vector3(...point).project(camera);
            if (id === "neighbor") { const screen = lensUnwarpNdc([p.x, p.y], width / height); p.x = screen[0]; p.y = screen[1]; }
            const inLens = id !== "neighbor" || Math.hypot(p.x * width / 2, p.y * height / 2) <= Math.min(.88 * width, .82 * height) / 2;
            if (Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1 && Math.abs(p.z) <= 1 && inLens) found.add(i);
          });
          return occluders;
        };
        defaultOccluders[id] = include({}, 1, defaults, defaultClear);
        const states = reachableInputStates(preset);
        for (const state of states) {
          const current = new Set(), clear = new Set();
          include(state, frame.zoom.min, current, clear);
          for (const i of current) reachable.add(i);
          if (id !== "neighbor") stationChecks.push({ station: state.station, theta: state.theta, phi: state.phi, eye: narrativePose(preset, state).eye, clear: clear.size, visible: current.size,
            passageClear: cells.filter((c, i) => c.field === "passage" && clear.has(i)).length });
        }
        for (const i of reachable) union.add(i);
        const fields = {};
        for (const field of new Set(cells.map(p => p.field))) {
          const indices = cells.map((p, i) => p.field === field ? i : -1).filter(i => i >= 0);
          fields[field] = { cells: indices.length, clear: indices.filter(i => defaultClear.has(i)).length, default: indices.filter(i => defaults.has(i)).length, reachable: indices.filter(i => reachable.has(i)).length };
        }
        const defaultFov = 2 * Math.atan(frame.span / (2 * base.distance)) * 180 / Math.PI;
        reports.push({ scene, width, height, view: id, eye: preset.eye, target: preset.target, span: frame.span, horizontalSpan: frame.width, zoom: frame.zoom, defaultFov, fields,
          inputStates: states.length, stationLimits: preset.station, stationChecks });
        if (id === "bird") assert.ok(defaultFov < 95, "the fixed wide bird lens avoids excessive foreground");
        assert.ok(defaults.size > 0, scene + " " + id + " sees actual unhidden terrace floor");
        if (scene === "north" && id === "drone") assert.equal(fields.passage.default, 8, "positive-side drone sees every sampled recessed entry cell by default");
      }
      assert.ok(union.size >= cells.length * .9, scene + " three actual input ranges retain at least ninety percent of the sampled terrace floor at the tested viewport");
      const missed = cells.flatMap((cell, i) => union.has(i) ? [] : [{
        point: [cell.point[0], cell.point[2]], field: cell.field,
        reason: NARRATIVE_VIEWS.every(({ id }) => defaultOccluders[id][i]) ? "opaque-native-envelope-at-default-stations" : "outside-bounded-input-view",
        occluders: Object.fromEntries(NARRATIVE_VIEWS.map(({ id }) => [id, defaultOccluders[id][i]])),
      }]);
      reports.push({ scene, width, height, union: union.size, total: cells.length, percentage: Number((100 * union.size / cells.length).toFixed(2)), missed });
    }
  }
  const report = {
    format: "relative-narrative-camera-coverage-v2", assetHash: BACKGROUND.sha256,
    coordinates: "local game units; no geographic origin", nativeTriangles: house.triangles,
    method: "exact exported opaque triangles and perspective frustum; terrace floor grid at Y=.06; reachable direct gestures: bird coupled eave walk/head/pitch, drone bounded height/dolly/yaw, fixed neighbor station with local aim and optical zoom",
    caveat: "coverage is sampled empty terrace floor, not future furniture or all world surfaces",
    neighborLens: "circle of radius min(.88*width,.82*height)/2 with measured radial lens warp",
    droneFraming: { fifthFloorWindowCentre: -3.2, storeySpacing: 5.6, minimumAllowedHeight: -6, views: droneFramingReports },
    coverage: reports,
  };
  if (process.env.ROOFTOP_CAMERA_COVERAGE_OUTPUT) writeFileSync(process.env.ROOFTOP_CAMERA_COVERAGE_OUTPUT, JSON.stringify(report, null, 2) + "\n");
  t.diagnostic(reports.filter(r => r.union !== undefined).map(r => `${r.scene} ${r.width}×${r.height}: ${r.union}/${r.total} sampled terrace floor cells`).join("; "));
});

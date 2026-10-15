import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";
import {
  NARRATIVE_VIEWS,
  DEFAULT_NARRATIVE_VIEW,
  initialNarrativeStation,
  narrativePreset,
  narrativeFrame,
  applyNarrativeFrameOffset,
  narrativePose,
  constrainNarrativeHead,
  constrainNarrativeTarget,
  constrainNarrativeStation,
  nudgeNarrativeStation,
  narrativeDrag,
  birdHeadAtStation,
} from "../3d/story-camera.mjs";
import { housePoint, HOUSE, houseOccludes } from "../house-structure.mjs";
import { inside } from "../scene.mjs";
import { BACKGROUND } from "../assets/background/empty-rooftop.mjs";
import { lensUnwarpNdc } from "../3d/lens-pass.mjs";
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
      assert.ok(Math.abs(positions[0][1] - HOUSE.roof.z) < 1.5);
      assert.ok(positions[1][0] > 0 && positions[2][0] < 0, "drone and neighbor see complementary sides");
      assert.ok(positions[1][1] < -12 && positions[2][1] < positions[1][1]);
    } else {
      assert.ok(Math.abs(positions[0][0]) < 1e-9);
      assert.ok(Math.abs(positions[0][1] - 28) < 1.5);
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
        assert.equal(state.phi, sign < 0 ? -preset.pitch : preset.pitchMax ?? preset.pitch);
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
          if (id === "drone") {
            assert.ok(frame.width >= preset.overviewWidth - 1e-9 && frame.span >= preset.span);
            assert.equal(frame.shiftY, 0, "the terrace overview remains centered rather than shifted into the screen edge");
          }
        }
      }
    }
});

test("direct view gestures keep bird head coupled to walking and drone yaw and pitch bounded independently of travel", () => {
  for (const scene of ["north", "south"]) {
    const bird = narrativePreset(scene, "bird"), drone = narrativePreset(scene, "drone");
    for (const sign of [-1, 1]) {
      const b = narrativeDrag(bird, {}, sign * 1e5, sign * 1e5);
      assert.equal(b.station.walk, -sign * bird.station.walk);
      assert.equal(b.theta, -sign * bird.yaw);
      assert.ok(b.phi >= -bird.pitch && b.phi <= (bird.pitchMax ?? bird.pitch));
      assert.deepEqual({ theta: b.theta, phi: b.phi }, birdHeadAtStation(bird, b.station, b.phi));
      const d = narrativeDrag(drone, {}, sign * 1e5, sign * 1e5);
      assert.equal(d.station.height, 0, "dragging turns the lens without changing physical hover height");
      assert.equal(d.theta, -sign * drone.yaw);
      assert.equal(d.phi, sign < 0 ? -drone.pitch : drone.pitchMax ?? drone.pitch);
      assert.equal(d.station.dolly, 0, "dragging does not implicitly change drone range");
    }
    const smallDrag = narrativeDrag(drone, { station: { height: drone.station.heightMin, dolly: drone.station.dolly / 2 } }, 10, -10);
    assert.equal(smallDrag.theta, -10 * .0015, "actual horizontal gesture uses the current yaw sensitivity");
    assert.equal(smallDrag.phi, Math.max(-drone.pitch, -10 * .001), "actual vertical gesture uses the current pitch sensitivity");
    assert.equal(smallDrag.station.height, drone.station.heightMin);
    assert.equal(smallDrag.station.dolly, drone.station.dolly / 2);
    const source = readFileSync(new URL("../3d/scene3d.mjs", import.meta.url), "utf8");
    assert.match(source, /else if \(narrativeActive\(\) \|\|/);
    assert.match(source, /nudgeNarrativeOptics\(action\)/);
    assert.match(source, /narrativeView === "bird"\) return/);
  }
});

test("every preset keeps perspective ground picking in the existing terrace coordinate system", () => {
  const context = { console: { warn() {} } };
  vm.runInNewContext(readFileSync(new URL("../3d/vendor/three.min.js", import.meta.url), "utf8"), context);
  const T = context.THREE;
  for (const scene of ["north", "south"])
    for (const { id } of NARRATIVE_VIEWS) {
      const preset = narrativePreset(scene, id), frame = narrativeFrame(preset, 407, 662), pose = narrativePose(preset),
        camera = new T.PerspectiveCamera(2 * Math.atan(frame.span / (2 * pose.distance)) * 180 / Math.PI, 407 / 662, .1, 6000);
      camera.position.set(...pose.eye); camera.lookAt(...pose.target);
      applyNarrativeFrameOffset(camera, frame, 407, 662);
      camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      if (id === "drone") {
        const axis = new T.Vector3(...pose.target).project(camera);
        assert.ok(Math.abs(axis.x) < 1e-10 && Math.abs(axis.y) < 1e-10,
          "the real camera's optical axis keeps the overview target at the screen centre");
      }
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
    if (id === "drone" && preset.nearEye) {
      const midpoint = narrativePose(preset, { station: { dolly: preset.station.dolly / 2 } });
      midpoint.eye.forEach((value, axis) => assert.ok(Math.abs(value - (preset.eye[axis] + preset.nearEye[axis]) / 2) < 1e-9,
        "the midpoint retains the approved far/near physical-eye interpolation"));
      midpoint.target.forEach((value, axis) => assert.ok(Math.abs(value - (preset.target[axis] + preset.nearTarget[axis]) / 2) < 1e-9,
        "the midpoint retains the approved far/near aim interpolation"));
    }
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
        if (station.dolly < 0) {
          assert.equal(pose.eye[1], base.eye[1], "retreat keeps the drone at its existing altitude");
          assert.ok(Math.abs(Math.hypot(pose.eye[0] - base.eye[0], pose.eye[2] - base.eye[2]) + station.dolly) < 1e-9);
          pose.target.forEach((value, axis) => assert.ok(Math.abs(value - base.target[axis]) < 1e-9));
          assert.ok(pose.distance > base.distance);
        } else if (preset.nearEye) {
          const expectedEye = action === "near" ? preset.nearEye : preset.eye,
            expectedTarget = action === "near" ? preset.nearTarget : preset.target;
          pose.eye.forEach((value, axis) => assert.ok(Math.abs(value - expectedEye[axis]) < 1e-9,
            "the approved physical dolly reaches its exact saved far/near eye"));
          pose.target.forEach((value, axis) => assert.ok(Math.abs(value - expectedTarget[axis]) < 1e-9,
            "the approved physical dolly reaches its exact saved far/near aim"));
        } else assert.ok(Math.abs(pose.distance - base.distance + station.dolly) < 1e-9,
          "a single-anchor dolly changes actual observer distance rather than optical zoom");
      }
      if (id === "drone" && action === "up") {
        assert.equal(station.height, preset.station.height, "repeated upward input reaches and respects the higher limit");
        assert.equal(pose.eye[1], base.eye[1] + preset.station.height, "rising moves the actual camera above its default view");
        assert.ok(pose.eye[1] > base.eye[1]);
      }
      if (id === "drone" && action === "down") {
        assert.equal(station.height, preset.station.heightMin ?? -preset.station.height);
        assert.equal(pose.eye[1], base.eye[1] + station.height, "the lower limit is real physical descent");
      }
    }
  }
});

test("expanded controls add six drone ascent steps and retain the bird's existing walking response", () => {
  for (const scene of ["north", "south"]) {
    const drone = narrativePreset(scene, "drone"), oldCeiling = scene === "north" ? 2.25 : 0;
    let station = { height: oldCeiling };
    for (let i = 0; i < 6; i++) {
      const previous = narrativePose(drone, { station });
      station = nudgeNarrativeStation(drone, station, "up");
      assert.equal(narrativePose(drone, { station }).eye[1], previous.eye[1] + .75);
    }
    assert.deepEqual(nudgeNarrativeStation(drone, station, "up"), station);
    const bird = narrativePreset(scene, "bird");
    for (const sign of [-1, 1]) {
      const oldReach = narrativeDrag(bird, {}, -sign * 4 / .018, 0);
      assert.ok(Math.abs(oldReach.theta - sign * .28) < 1e-10, "old walking positions keep their original yaw");
      const expanded = narrativeDrag(bird, oldReach, -sign * 1 / .018, -25);
      assert.equal(expanded.station.walk, sign * 5);
      assert.equal(narrativePose(bird, expanded).eye[1], 6.1, "the bird still walks on the eave");
    }
  }
});

test("opening hover leaves exactly two upward steps on both terraces", () => {
  assert.equal(DEFAULT_NARRATIVE_VIEW, "drone");
  for (const scene of ["north", "south"]) {
    const preset = narrativePreset(scene), start = initialNarrativeStation(preset);
    assert.equal(start.height, scene === "north" ? 5.25 : 3);
    const oldStart = { ...start, dolly: 0 }, oldPose = narrativePose(preset, {station: oldStart}), pose = narrativePose(preset, {station: start});
    assert.equal(start.dolly, -2);
    assert.equal(pose.eye[1], oldPose.eye[1], "the wider default preserves the published hover height");
    assert.ok(Math.abs(Math.hypot(pose.eye[0] - oldPose.eye[0], pose.eye[2] - oldPose.eye[2]) - 2) < 1e-9);
    assert.ok(pose.distance > oldPose.distance, "retreat increases physical viewing distance");
    assert.deepEqual(nudgeNarrativeStation(preset, nudgeNarrativeStation(preset, start, "near"), "near"), oldStart,
      "two approach steps rejoin the previously approved opening position");
    const once = nudgeNarrativeStation(preset, start, "up"), twice = nudgeNarrativeStation(preset, once, "up");
    assert.ok(once.height < preset.station.height);
    assert.equal(twice.height, preset.station.height);
    assert.deepEqual(nudgeNarrativeStation(preset, twice, "up"), twice);
    assert.equal(narrativePose(preset, {station: twice}).eye[1] - narrativePose(preset, {station: start}).eye[1], 1.5);
    for (const id of ["bird", "neighbor"]) assert.deepEqual(initialNarrativeStation(narrativePreset(scene, id)), {walk: 0, height: 0, dolly: 0});
  }
});

function reachableInputStates(preset) {
  if (preset.id === "bird") return [-1, -.5, 0, .5, 1].flatMap(walk => [-1, 0, 1].map(pitch => {
    const pitchLimit = pitch > 0 ? preset.pitchMax ?? preset.pitch : preset.pitch;
    const state = narrativeDrag(preset, {}, -walk * preset.station.walk / .018, pitch * pitchLimit / .0008);
    return { ...state, target: preset.target };
  }));
  if (preset.id === "drone") {
    const initial = initialNarrativeStation(preset),
      minimumHeight = preset.station.heightMin ?? -preset.station.height,
      minimumDolly = preset.station.dollyMin ?? -preset.station.dolly,
      heights = [...new Set([minimumHeight, (minimumHeight + preset.station.height) / 2, 0, initial.height, preset.station.height])],
      dollies = [...new Set([minimumDolly, (minimumDolly + preset.station.dolly) / 2, 0, initial.dolly, preset.station.dolly])];
    return heights.flatMap(height => dollies.flatMap(dolly => [-1, 0, 1].flatMap(yaw => [-1, 0, 1].map(pitch => {
      const pitchLimit = pitch > 0 ? preset.pitchMax ?? preset.pitch : preset.pitch,
        state = narrativeDrag(preset, { station: { height, dolly } }, -yaw * preset.yaw / .0015, pitch * pitchLimit / .001);
      return { ...state, target: preset.target };
    }))));
  }
  return [-1, -2/3, -1/3, 0, 1/3, 2/3, 1].flatMap(x => [-1, -2/3, -1/3, 0, 1/3, 2/3, 1].map(z => ({
    target: [preset.target[0] + x * preset.travel, preset.target[1], preset.target[2] + z * preset.travel],
    station: {}, theta: 0, phi: 0,
  })));
}

const birdFramingReports = [], droneFramingReports = [];

test("bird upward limits keep the actual wide-lens top ray below the skyline at every eave walking station", () => {
  const context = { console: { warn() {} } };
  vm.runInNewContext(readFileSync(new URL("../3d/vendor/three.min.js", import.meta.url), "utf8"), context);
  const T = context.THREE;
  for (const scene of ["north", "south"]) for (const [width, height] of [[410, 658], [390, 844], [320, 700], [1280, 720], [1440, 900], [844, 390]]) {
    const preset = narrativePreset(scene, "bird"), frame = narrativeFrame(preset, width, height), base = narrativePose(preset),
      camera = new T.PerspectiveCamera(2 * Math.atan(frame.span / (2 * base.distance)) * 180 / Math.PI, width / height, .1, 6000),
      report = { scene, width, height, span: frame.span, maximumTopRayElevationDegrees: -90, stations: [] };
    applyNarrativeFrameOffset(camera, frame, width, height);
    for (const fraction of [-1, -.5, 0, .5, 1]) {
      const station = { walk: fraction * preset.station.walk }, head = birdHeadAtStation(preset, station, 1e4),
        pose = narrativePose(preset, { ...head, station });
      camera.position.set(...pose.eye); camera.lookAt(...pose.target);
      camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      let maximum = -90;
      for (const x of [-1, 0, 1]) {
        const ray = new T.Raycaster(); ray.setFromCamera(new T.Vector2(x, 1), camera);
        const elevation = Math.asin(ray.ray.direction.y) * 180 / Math.PI;
        maximum = Math.max(maximum, elevation);
        assert.ok(ray.ray.direction.y <= 1e-10,
          scene + " actual camera/lens at walk " + station.walk + " keeps its upper edge below the horizon: " + elevation);
      }
      report.maximumTopRayElevationDegrees = Math.max(report.maximumTopRayElevationDegrees, maximum);
      report.stations.push({ walk: station.walk, requestedPitch: 1e4, actualHeadPitch: head.phi,
        directionPitch: pose.pitch, topRayElevationDegrees: Number(maximum.toFixed(4)) });
    }
    report.maximumTopRayElevationDegrees = Number(report.maximumTopRayElevationDegrees.toFixed(4));
    birdFramingReports.push(report);
  }
});

function cameraRayInHouse(T, camera, scene, x, y) {
  const raycaster = new T.Raycaster(); raycaster.setFromCamera(new T.Vector2(x, y), camera);
  const r = raycaster.ray, [ex, ez] = housePoint(scene, r.origin.x, r.origin.z),
    [px, pz] = housePoint(scene, r.origin.x + r.direction.x, r.origin.z + r.direction.z);
  return new T.Ray(new T.Vector3(ex, r.origin.y, ez), new T.Vector3(px - ex, r.direction.y, pz - ez).normalize());
}

test("drone overview records actual street exposure across approved physical and head limits", () => {
  const context = { console: { warn() {} } };
  vm.runInNewContext(readFileSync(new URL("../3d/vendor/three.min.js", import.meta.url), "utf8"), context);
  const T = context.THREE, native = nativeArchitectureRays(T, {
    envelope: new T.Box3(new T.Vector3(-180, -40, -170), new T.Vector3(180, 30, 170)),
  });
  for (const scene of ["north", "south"]) for (const [width, height] of [[410, 658], [320, 700], [1280, 720], [1440, 900], [844, 390]]) {
    const preset = narrativePreset(scene, "drone"), frame = narrativeFrame(preset, width, height), base = narrativePose(preset),
      camera = new T.PerspectiveCamera(2 * Math.atan(frame.span / (2 * base.distance)) * 180 / Math.PI, width / height, .1, 6000),
      results = { scene, width, height, span: frame.span, horizontalSpan: frame.width, shiftY: frame.shiftY,
        states: 0, samples: 0, minHeight: Infinity, groundHits: 0, misses: 0, worst: null,
        defaultFullFrame: null, maximumFullFrameGroundPercent: 0, maximumFullFrameState: null };
    applyNarrativeFrameOffset(camera, frame, width, height);
    assert.equal(preset.pitch, .08, "both drones share the approved head pitch limits");
    for (const state of reachableInputStates(preset)) {
      const pose = narrativePose(preset, state, state.target);
      assert.ok(state.phi >= -preset.pitch && state.phi <= (preset.pitchMax ?? preset.pitch));
      camera.position.set(...pose.eye); camera.lookAt(...pose.target); camera.zoom = 1;
      camera.updateProjectionMatrix(); camera.updateMatrixWorld(); results.states++;
      const fullFrame = { samples: 0, groundHits: 0, misses: 0, ownFacadeGroundHits: 0 };
      for (let iy = 0; iy <= 10; iy++) for (let ix = 0; ix <= 10; ix++) {
        const hit = native.hit(cameraRayInHouse(T, camera, scene, ix / 5 - 1, iy / 5 - 1));
        fullFrame.samples++;
        if (!hit) { fullFrame.misses++; continue; }
        if (hit.layer === "ground") {
          fullFrame.groundHits++;
          if (Math.abs(hit.point.x) <= 10.05 && hit.point.z >= -14 && hit.point.z <= 39) fullFrame.ownFacadeGroundHits++;
        }
      }
      fullFrame.groundPercent = Number((100 * fullFrame.groundHits / fullFrame.samples).toFixed(2));
      if (fullFrame.groundPercent > results.maximumFullFrameGroundPercent) {
        results.maximumFullFrameGroundPercent = fullFrame.groundPercent;
        results.maximumFullFrameState = { station: state.station, theta: state.theta, phi: state.phi };
      }
      const initial = initialNarrativeStation(preset);
      if (state.station.height === initial.height && state.station.dolly === initial.dolly && !state.theta && !state.phi)
        results.defaultFullFrame = fullFrame;
      for (const y of [-1, -.98, -.9]) for (const x of [-1, -.5, 0, .5, 1]) {
        const hit = native.hit(cameraRayInHouse(T, camera, scene, x, y)); results.samples++;
        if (!hit) { results.misses++; continue; }
        if (hit.layer === "ground") results.groundHits++;
        if (hit.point.y < results.minHeight) {
          results.minHeight = hit.point.y;
          results.worst = { station: state.station, theta: state.theta, phi: state.phi, screen: [x, y], point: hit.point.toArray(), field: hit.field };
        }
      }
    }
    assert.ok(results.defaultFullFrame, "the reachable-input probe includes the actual default station");
    results.minHeight = Number(results.minHeight.toFixed(4));
    results.bottomGroundPercent = Number((100 * results.groundHits / results.samples).toFixed(2));
    results.nativeTriangles = native.triangles;
    droneFramingReports.push(results);
  }
});

test("reachable direct gestures permit complementary actual terrace floor coverage without any cutaway", t => {
  const context = { console: { warn() {} } };
  vm.runInNewContext(readFileSync(new URL("../3d/vendor/three.min.js", import.meta.url), "utf8"), context);
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
    for (const [width, height] of [[410, 658], [407, 662], [390, 844], [320, 700], [1280, 720], [1440, 900]]) {
      const union = new Set(), defaultOccluders = {};
      for (const { id } of NARRATIVE_VIEWS) {
        const preset = narrativePreset(scene, id), frame = narrativeFrame(preset, width, height), base = narrativePose(preset),
          camera = new T.PerspectiveCamera(2 * Math.atan(frame.span / (2 * base.distance)) * 180 / Math.PI, width / height, .1, 6000),
          defaults = new Set(), reachable = new Set(), defaultClear = new Set(), stationChecks = [];
        applyNarrativeFrameOffset(camera, frame, width, height);
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
        let overview = null;
        if (id === "drone") {
          const outline = scene === "north" ? [
            [-10, -8], [-2, -8], [-2, -12], [6, -12], [6, -8],
            [10, -8], [10, 12], [6, 12], [6, 4], [-10, 4],
          ] : [[-4, -10], [4, -10], [4, 10], [-4, 10]];
          const contour = outline.flatMap(([x, z]) => [0, 3.5].map(y => [x, y, z]));
          const clipped = contour.filter(point => {
            const p = new T.Vector3(...point).project(camera);
            return Math.abs(p.x) > 1.005 || Math.abs(p.y) > 1.005 || Math.abs(p.z) > 1;
          });
          overview = { contourSamples: contour.length, contourInside: contour.length - clipped.length,
            clippedContour: clipped, clearFloorSamples: defaultClear.size, visibleFloorSamples: defaults.size };
          const clippedVisibleContour = clipped.filter(point => {
            const [ex, ez] = housePoint(scene, preset.eye[0], preset.eye[2]), [x, z] = housePoint(scene, point[0], point[2]),
              eye = new T.Vector3(ex, preset.eye[1], ez), target = new T.Vector3(x, point[1], z), direction = target.clone().sub(eye);
            return !house.hit(new T.Ray(eye, direction.clone().normalize()), direction.length() - .04);
          });
          overview.visibleContourClipped = clippedVisibleContour;
          assert.ok(defaults.size <= defaultClear.size,
            "default framed floor is measured within the geometrically unobstructed floor, with the approved crop reported separately");
        }
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
        reports.push({ scene, width, height, view: id, eye: preset.eye, target: preset.target, span: frame.span, horizontalSpan: frame.width, shiftY: frame.shiftY ?? 0, zoom: frame.zoom, defaultFov, fields, overview,
          inputStates: states.length, stationLimits: preset.station, stationChecks });
        if (id === "bird") assert.ok(defaultFov < 95, "the fixed wide bird lens avoids excessive foreground");
        assert.ok(defaults.size > 0, scene + " " + id + " sees actual unhidden terrace floor");
        if (scene === "north" && id === "drone") {
          assert.ok(fields.passage.default > 0, "the approved default frame includes recessed entry floor");
          assert.equal(fields.passage.reachable, fields.passage.cells,
            "approved positive-side drone controls can reveal every sampled recessed entry cell through the intact geometry");
        }
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
    format: "relative-narrative-camera-coverage-v4", assetHash: BACKGROUND.sha256,
    coordinates: "local game units; no geographic origin", nativeTriangles: house.triangles,
    method: "exact exported opaque triangles and actual runtime perspective frustum; centered drone overview with zero image offset and approved default crop recorded; terrace floor grid at Y=.06; reachable direct gestures: bird coupled eave walk/asymmetric head pitch, drone bounded physical height/dolly plus scene-specific yaw/pitch, fixed scope station with local aim and optical zoom",
    caveat: "coverage is sampled empty terrace floor, not future furniture or all world surfaces",
    neighborLens: "circle of radius min(.88*width,.82*height)/2 with measured radial lens warp",
    birdFraming: { method: "actual PerspectiveCamera top-centre and top-corner ray directions at maximum permitted upward head angle and five coupled eave walking stations", views: birdFramingReports },
    droneFraming: { headPitchLimits: Object.fromEntries(["north", "south"].map(scene => {
        const preset = narrativePreset(scene, "drone");
        return [scene, { min: -preset.pitch, max: preset.pitchMax ?? preset.pitch }];
      })),
      method: "reported default floor/parapet crop and geometrically visible floor samples; 11x11 full-screen native rays per reachable height/dolly/yaw/pitch state plus separately reported bottom-edge rays",
      caveat: "street percentages include distant gaps between neighboring buildings and are recorded without changing the user's centered overview; minimum hit height is not a fixed floor-number gate",
      views: droneFramingReports },
    coverage: reports,
  };
  if (process.env.ROOFTOP_CAMERA_COVERAGE_OUTPUT) writeFileSync(process.env.ROOFTOP_CAMERA_COVERAGE_OUTPUT, JSON.stringify(report, null, 2) + "\n");
  t.diagnostic(reports.filter(r => r.union !== undefined).map(r => `${r.scene} ${r.width}×${r.height}: ${r.union}/${r.total} sampled terrace floor cells`).join("; "));
});

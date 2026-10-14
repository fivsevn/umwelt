import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { projectVisibleDoor } from "../3d/door-projection.mjs";
import { narrativePreset, narrativeFrame, narrativePose } from "../3d/story-camera.mjs";
import { lensUnwarpNdc } from "../3d/lens-pass.mjs";
import { nativeArchitectureRays } from "./helpers/rooftop-native-rays.mjs";
import { housePoint } from "../house-structure.mjs";

function three() {
  const context = { console: { warn() {} } };
  vm.runInNewContext(readFileSync(new URL("../3d/vendor/three.min.js", import.meta.url), "utf8"), context);
  return context.THREE;
}
const T = three(), doorHeight = 2.1 * 5.6 / 3;
function frameFor(scene) {
  const frame = new T.Group();
  frame.position.set(...(scene === "north" ? [6, .02, 8.375] : [-3.83, .02, 8.1]));
  frame.rotation.y = scene === "north" ? Math.PI / 2 : -Math.PI / 2;
  return frame;
}

test("the real default bird poses never create a door hit box over the garden", () => {
  for (const scene of ["north", "south"]) for (const [width, height] of [[1280, 720], [390, 844]]) {
    const preset = narrativePreset(scene, "bird"), view = narrativeFrame(preset, width, height), pose = narrativePose(preset),
      camera = new T.PerspectiveCamera(2 * Math.atan(view.span / (2 * pose.distance)) * 180 / Math.PI, width / height, .1, 6000);
    camera.position.set(...pose.eye); camera.lookAt(...pose.target); camera.updateMatrixWorld();
    assert.equal(projectVisibleDoor(T, { camera, frame: frameFor(scene), width, height, doorHeight }), null,
      "doors behind or outside the bird's genuine view cannot intercept canvas dragging");
  }
});

test("a visible door remains clickable, bounded, and clipped, while near-plane and occluded doors are disabled", () => {
  const frame = frameFor("north"), width = 1280, height = 720,
    camera = new T.PerspectiveCamera(48, width / height, .1, 6000);
  camera.position.set(8, 3, 6); camera.lookAt(6, 2, 8.375); camera.updateMatrixWorld();
  const box = projectVisibleDoor(T, { camera, frame, width, height, doorHeight });
  assert.ok(box, "a visible door keeps the existing click interaction");
  assert.ok(box.left >= 0 && box.top >= 0 && box.left + box.width <= width && box.top + box.height <= height);
  assert.ok(box.width * box.height <= width * height * .1, "a DOM door never masks most of the drawing surface");
  assert.equal(projectVisibleDoor(T, { camera, frame, width, height, doorHeight, isOccluded: () => true }), null);
  camera.position.set(6.01, 2, 8.375); camera.lookAt(6, 2, 8.375); camera.updateMatrixWorld();
  assert.equal(projectVisibleDoor(T, { camera, frame, width, height, doorHeight }), null, "a door crossing the near plane has no giant perspective button");
});

test("native roof and walls occlude door targets and the round lens never exposes an outer hit region", () => {
  const native = nativeArchitectureRays(T, {
    layers: ["near"], excludeFloor: true,
    envelope: new T.Box3(new T.Vector3(-84, .1, -14), new T.Vector3(68, 16, 39)),
  });
  const roofCamera = new T.PerspectiveCamera(45, 1280 / 720, .1, 6000), northFrame = frameFor("north");
  northFrame.updateMatrixWorld();
  const doorCentre = northFrame.localToWorld(new T.Vector3(0, doorHeight / 2, 0));
  roofCamera.position.set(0, 25, 18); roofCamera.lookAt(doorCentre); roofCamera.updateMatrixWorld();
  const delta = doorCentre.clone().sub(roofCamera.position), roofHit = native.hit(new T.Ray(roofCamera.position, delta.clone().normalize()), delta.length() - .2);
  assert.ok(roofHit, "the exact intact native roof obstructs the centred door from the rear roof station");
  assert.ok(projectVisibleDoor(T, { camera: roofCamera, frame: northFrame, width: 1280, height: 720, doorHeight }), "the occluded door would otherwise project inside the screen");
  assert.equal(projectVisibleDoor(T, { camera: roofCamera, frame: northFrame, width: 1280, height: 720, doorHeight, isOccluded: () => !!roofHit }), null);
  for (const scene of ["north", "south"]) for (const id of ["drone", "neighbor"]) {
    const width = 1280, height = 720, preset = narrativePreset(scene, id), view = narrativeFrame(preset, width, height), pose = narrativePose(preset),
      camera = new T.PerspectiveCamera(2 * Math.atan(view.span / (2 * pose.distance)) * 180 / Math.PI, width / height, .1, 6000),
      lens = id === "neighbor" ? { radius: Math.min(.88 * width, .82 * height) / 2, unwarp: lensUnwarpNdc } : null;
    camera.position.set(...pose.eye); camera.lookAt(...pose.target); camera.updateMatrixWorld();
    const isOccluded = point => {
      const [ex, ez] = housePoint(scene, camera.position.x, camera.position.z), [px, pz] = housePoint(scene, point.x, point.z),
        eye = new T.Vector3(ex, camera.position.y, ez), target = new T.Vector3(px, point.y, pz), delta = target.clone().sub(eye);
      return !!native.hit(new T.Ray(eye, delta.clone().normalize()), delta.length() - .2);
    };
    const box = projectVisibleDoor(T, { camera, frame: frameFor(scene), width, height, doorHeight, lens, isOccluded });
    if (box && lens) for (const x of [box.left, box.left + box.width]) for (const y of [box.top, box.top + box.height])
      assert.ok(Math.hypot(x - width / 2, y - height / 2) <= lens.radius + 1e-6);
  }
  const camera = new T.PerspectiveCamera(45, 1, .1, 6000), frame = new T.Group();
  frame.position.set(5, 0, -10); camera.lookAt(0, 0, -10); camera.updateMatrixWorld();
  assert.equal(projectVisibleDoor(T, { camera, frame, width: 600, height: 600, lens: { radius: 80 } }), null,
    "an off-centre door outside the circular view cannot intercept its black surround");
});

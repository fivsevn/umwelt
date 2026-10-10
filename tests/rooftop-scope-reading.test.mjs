import test from "node:test";
import assert from "node:assert/strict";
import { readScopeOptics, createScopeSurfaceCache } from "../rooftop/3d/scope-reading.mjs";
import { housePoint, terracePoint } from "../rooftop/house-structure.mjs";

const sample = { eye: [-130, 42, -100], hit: [0, .8, -2], metresPerUnit: [.27, .5357, .46], verticalFovDegrees: 5, viewportHeight: 662, measuredSurface: true };
test("scope range and slope use three-axis physical calibration and survive local frame changes", () => {
  const reading = readScopeOptics(sample), delta = sample.hit.map((value, axis) => (value - sample.eye[axis]) * sample.metresPerUnit[axis]);
  assert.ok(Math.abs(reading.distanceMetres - Math.hypot(...delta)) < 1e-10);
  assert.ok(reading.inclinationDegrees < 0 && reading.inclinationDegrees > -90);
  const shifted = readScopeOptics({ ...sample, eye: sample.eye.map((v, i) => v + [400, 20, -300][i]), hit: sample.hit.map((v, i) => v + [400, 20, -300][i]) });
  assert.ok(Math.abs(shifted.distanceMetres - reading.distanceMetres) < 1e-10);
  const fromSouth = point => {
    const local = terracePoint("south", point[0], point[2]), world = housePoint("south", ...local);
    return [world[0], point[1], world[1]];
  };
  assert.equal(readScopeOptics({ ...sample, eye: fromSouth(sample.eye), hit: fromSouth(sample.hit) }).distanceMetres, reading.distanceMetres);
  assert.doesNotMatch(JSON.stringify(reading), /address|latitude|longitude|origin|map/i);
});

test("optical zoom changes magnification and angular reticle scale without inventing a new range", () => {
  const wide = readScopeOptics({ ...sample, zoom: 1 }), close = readScopeOptics({ ...sample, zoom: 4 });
  assert.equal(close.distanceMetres, wide.distanceMetres);
  assert.equal(close.inclinationDegrees, wide.inclinationDegrees);
  assert.ok(Math.abs(close.magnification / wide.magnification - 4) < 1e-12);
  assert.ok(Math.abs(close.mradPixels / wide.mradPixels - 4) < 1e-12);
  const expectedPixel = sample.viewportHeight * Math.tan(.001) / (2 * Math.tan(sample.verticalFovDegrees * Math.PI / 360));
  assert.ok(Math.abs(wide.mradPixels - expectedPixel) < 1e-12);
  assert.ok(close.verticalFovDegrees < wide.verticalFovDegrees);
  assert.equal(readScopeOptics({ ...sample, measuredSurface: false }).measuredSurface, false);
  for (const patch of [{zoom:Infinity},{viewportHeight:0},{metresPerUnit:[0,.5,.5]},{hit:[NaN,0,0]}]) assert.equal(readScopeOptics({...sample,...patch}),null);
});

test("unchanged center rays reuse their actual surface and moving scenes refresh at most four times a second", () => {
  let calls = 0;
  const cache = createScopeSurfaceCache(), measure = () => ({ distance: ++calls });
  assert.equal(cache.read("pose-a", 0, measure).distance, 1);
  assert.equal(cache.read("pose-a", 5000, measure).distance, 1, "a stationary empty preview needs no repeated geometry raycast");
  assert.equal(cache.read("pose-b", 5001, measure).distance, 2, "turning the head measures its newly visible actual surface");
  assert.equal(cache.read("pose-b", 5200, measure, true).distance, 2);
  assert.equal(cache.read("pose-b", 5251, measure, true).distance, 3);
  assert.equal(cache.read("pose-b", 5252, measure, true).distance, 3);
});

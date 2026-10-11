import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { outdoorRasterSize, outdoorSampleNdc, rasterCellCentre, paddedRasterProjection, createOutdoorRasterPass } from "../rooftop/3d/outdoor-raster.mjs";
import { lensWarpNdc } from "../rooftop/3d/lens-pass.mjs";
import { createSeasonalAir } from "../rooftop/3d/seasonal-air.mjs";
import { PIXEL_GRID_TARGET_CSS, resolvePixelGrid, pixelGridSize } from "../rooftop/3d/pixel-grid.mjs";

const T = createRequire(import.meta.url)("../rooftop/3d/vendor/three.min.js");
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test("slightly finer shared presentation resolves to integer device squares at every DPR", () => {
  assert.equal(PIXEL_GRID_TARGET_CSS, 2.5);
  for (const [dpr, step] of [[1, 3], [1.25, 3], [1.5, 4], [2, 5], [3, 8]]) {
    const grid = resolvePixelGrid(dpr), size = pixelGridSize(406, 658, grid);
    assert.equal(grid.pixelRatio, dpr); assert.equal(grid.pixelStep, step);
    assert.equal(grid.cssPixelStep * dpr, step);
    assert.deepEqual(size.output, [Math.round(406 * dpr), Math.round(658 * dpr)]);
    assert.deepEqual(size.source, size.output.map(v => Math.ceil(v / step)));
    assert.deepEqual(size.padded, size.source.map(v => v * step));
    for (let axis = 0; axis < 2; axis++) assert.ok(size.padded[axis] - size.output[axis] >= 0 && size.padded[axis] - size.output[axis] < step);
    // All physical pixels in a cell resolve to the identical scene ray, even
    // at fractional DPR. NDC uses the final native buffer's rounded extent.
    for (const lens of [false, true]) {
      const origin = [11 * step, 20 * step], cssAt = (dx, dy) => [
        (origin[0] + dx) / size.output[0] * 406, (origin[1] + dy) / size.output[1] * 658],
        reference = outdoorSampleNdc(cssAt(.5, .5), 406, 658, lens, grid);
      for (let dx = .5; dx < step; dx++) for (let dy = .5; dy < step; dy++)
        assert.deepEqual(outdoorSampleNdc(cssAt(dx, dy), 406, 658, lens, grid), reference);
    }
    const projected = rasterCellCentre([137.2, 321.7], grid, 406, 658),
      sample = outdoorSampleNdc([137.2, 321.7], 406, 658, false, grid);
    close(projected[0] / 406 * 2 - 1, sample[0]); close(1 - projected[1] / 658 * 2, sample[1]);
  }
  assert.deepEqual(pixelGridSize(406, 658, resolvePixelGrid(2)).source, [163, 264]);
  for (const invalid of [0, -1, NaN, Infinity]) assert.deepEqual(resolvePixelGrid(invalid), resolvePixelGrid(1));
});
function mockRenderer() {
  const events = new Map(), draws = [], initialTarget = {}, renderer = {
    target: initialTarget, domElement: {
      addEventListener(name, fn) { events.set(name, fn); }, removeEventListener(name, fn) { if (events.get(name) === fn) events.delete(name); },
    }, shadowMap: { needsUpdate: false }, info: { autoReset: true, calls: 0, reset() { this.calls = 0; } },
    getRenderTarget() { return this.target; }, setRenderTarget(value) { this.target = value; },
    render(scene, camera) { draws.push({ scene, camera, target: this.target, projection: camera.projectionMatrix.clone() }); this.info.calls++; },
  };
  return { renderer, events, draws, initialTarget };
}

test("outdoor presentation has fixed square 3px cells and clips only incomplete right/bottom cells", () => {
  assert.equal(resolvePixelGrid(1).cssPixelStep, 3);
  for (const [w, h] of [[407, 662], [390, 844], [844, 390], [1920, 1080], [1, 2]]) {
    const size = outdoorRasterSize(w, h);
    assert.deepEqual(size.source, [Math.ceil(w / 3), Math.ceil(h / 3)]);
    for (let axis = 0; axis < 2; axis++) {
      assert.equal(size.padded[axis], size.source[axis] * 3);
      assert.ok(size.padded[axis] >= size.output[axis] && size.padded[axis] - size.output[axis] < 3);
    }
    for (const lens of [false, true]) for (const origin of [[0, 0], [6, 12], [w - w % 3 - 3, h - h % 3 - 3]]) {
      const reference = outdoorSampleNdc(origin.map(value => value + .5), w, h, lens);
      for (const dx of [.5, 1.5, 2.5]) for (const dy of [.5, 1.5, 2.5])
        assert.deepEqual(outdoorSampleNdc([origin[0] + dx, origin[1] + dy], w, h, lens), reference);
    }
  }
});

test("padding preserves every projected CSS coordinate, camera pose and true projection aspect", () => {
  for (const [w, h] of [[407, 662], [844, 390]]) for (const perspective of [false, true]) {
    const camera = perspective ? new T.PerspectiveCamera(40, w / h, .1, 6000) : new T.OrthographicCamera(-12 * w / h, 12 * w / h, 12, -12, .1, 6000);
    camera.position.set(24, 32, 46); camera.lookAt(0, 1, 0); camera.zoom = 1.7;
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    const size = outdoorRasterSize(w, h), original = camera.projectionMatrix.clone(), padded = paddedRasterProjection(T, original, size);
    for (const position of [[1, .8, -2], [8, 5, 9], [-4, 7, 3]]) {
      const eye = new T.Vector3(...position).applyMatrix4(camera.matrixWorldInverse), a = eye.clone().applyMatrix4(original), b = eye.clone().applyMatrix4(padded);
      close((a.x + 1) * w / 2, (b.x + 1) * size.padded[0] / 2);
      close((1 - a.y) * h / 2, (1 - b.y) * size.padded[1] / 2);
    }
    assert.deepEqual(camera.projectionMatrix.elements, original.elements);
  }
});

test("scope picking samples the same nearest source cell, including clamped wide-screen rims", () => {
  for (const [w, h] of [[1920, 1080], [844, 390], [407, 662]]) for (const point of [[0, 0], [w / 2, h / 2], [w - .5, h - .5]]) {
    const size = outdoorRasterSize(w, h), displayed = outdoorSampleNdc(point, w, h), warped = lensWarpNdc(displayed, w / h).map(v => Math.max(-1, Math.min(1, v))),
      expected = [(warped[0] + 1) * w / 2, (1 - warped[1]) * h / 2].map((v, axis) => Math.min(size.source[axis] - 1, Math.max(0, Math.floor(v / 3)))),
      sampled = outdoorSampleNdc(point, w, h, true), actual = [(sampled[0] + 1) * w / 2, (1 - sampled[1]) * h / 2];
    for (let axis = 0; axis < 2; axis++) close(actual[axis], (expected[axis] + .5) * 3);
  }
  // Captured garage drags can extend outside the canvas; ordinary picking must
  // preserve those coordinates instead of pinning them to the last display cell.
  assert.ok(outdoorSampleNdc([2000, 1200], 1920, 1080)[0] > 1);
});

test("world and lens share one nearest low target, with renderer/camera restoration and resize", () => {
  const { renderer, draws, initialTarget } = mockRenderer(), pass = createOutdoorRasterPass(T, renderer), world = new T.Scene(), camera = new T.PerspectiveCamera(40, 407 / 662, .1, 6000),
    projection = camera.projectionMatrix.clone(), inverse = camera.projectionMatrixInverse.clone();
  assert.equal(pass.stats.sourceBuffer, null);
  pass.render(world, camera, 407, 662);
  assert.equal(draws.length, 2); assert.equal(draws[0].scene, world);
  assert.equal(draws[0].camera, camera); assert.equal(draws[1].target, initialTarget);
  assert.deepEqual(pass.stats.sourceBuffer, [136, 221]); assert.deepEqual(pass.stats.outputBuffer, [407, 662]);
  assert.equal(draws[0].target.texture.magFilter, T.NearestFilter); assert.equal(draws[0].target.texture.minFilter, T.NearestFilter);
  assert.equal(draws[0].target.texture.generateMipmaps, false); assert.equal(draws[0].target.texture.colorSpace, T.LinearSRGBColorSpace);
  assert.deepEqual(draws[0].projection.elements, paddedRasterProjection(T, projection, outdoorRasterSize(407, 662)).elements);
  assert.deepEqual(camera.projectionMatrix.elements, projection.elements); assert.deepEqual(camera.projectionMatrixInverse.elements, inverse.elements);
  assert.equal(renderer.info.calls, 2); assert.equal(renderer.info.autoReset, true); assert.equal(renderer.target, initialTarget);
  const target = draws[0].target;
  pass.render(world, camera, 844, 390, true);
  assert.equal(draws[2].target, target); assert.deepEqual(pass.stats.sourceBuffer, [282, 130]);
  const material = draws[3].scene.children[0].material;
  assert.equal(material.toneMapped, false); assert.ok(material.uniforms.rasterLens.value > 0);
  assert.deepEqual(material.uniforms.rasterOutput.value.toArray(), [844, 390]);
  assert.deepEqual(material.uniforms.rasterPadded.value.toArray(), [846, 390]);
  assert.equal(pass.lensStats.passes, 1);
  renderer.render = () => { throw new Error("render interrupted"); };
  assert.throws(() => pass.render(world, camera, 407, 662), /render interrupted/);
  assert.deepEqual(camera.projectionMatrix.elements, projection.elements); assert.deepEqual(camera.projectionMatrixInverse.elements, inverse.elements);
  assert.equal(renderer.target, initialTarget); assert.equal(renderer.info.autoReset, true);
});

test("context loss recreates the target and disposal removes listeners and releases GPU objects", () => {
  const { renderer, draws, events } = mockRenderer(), pass = createOutdoorRasterPass(T, renderer), world = new T.Scene(), camera = new T.PerspectiveCamera();
  pass.render(world, camera, 390, 844);
  let released = 0; const target = draws[0].target;
  target.addEventListener("dispose", () => released++);
  draws[1].scene.children[0].geometry.addEventListener("dispose", () => released++);
  draws[1].scene.children[0].material.addEventListener("dispose", () => released++);
  events.get("webglcontextlost")(); assert.equal(released, 3); assert.equal(pass.stats.sourceBuffer, null);
  events.get("webglcontextrestored")(); assert.equal(renderer.shadowMap.needsUpdate, true);
  pass.render(world, camera, 390, 844); assert.notEqual(draws[2].target, target);
  pass.dispose(); assert.equal(events.size, 0); assert.equal(pass.stats.sourceBuffer, null);
});

test("DPR changes replace native presentation metrics while reusing the world target and true camera", () => {
  const { renderer, draws } = mockRenderer(), pass = createOutdoorRasterPass(T, renderer), world = new T.Scene(), camera = new T.PerspectiveCamera(40, 406 / 658, .1, 6000), original = camera.projectionMatrix.clone();
  let target;
  for (const dpr of [1, 2, 3, 1.25]) {
    const grid = resolvePixelGrid(dpr), size = pixelGridSize(406, 658, grid);
    pass.render(world, camera, ...size.output, true, grid);
    const draw = draws.at(-2), quad = draws.at(-1).scene.children[0];
    if (target) assert.equal(draw.target, target); target = draw.target;
    assert.deepEqual(pass.stats.sourceBuffer, size.source); assert.deepEqual(pass.stats.outputBuffer, size.output);
    assert.equal(pass.stats.pixelRatio, dpr); assert.equal(pass.stats.pixelStep, grid.pixelStep); assert.equal(pass.stats.cssPixelStep, grid.cssPixelStep);
    assert.equal(quad.material.uniforms.rasterStep.value, grid.pixelStep);
    assert.deepEqual(draw.projection.elements, paddedRasterProjection(T, original, size).elements);
    assert.deepEqual(camera.projectionMatrix.elements, original.elements); assert.equal(camera.aspect, 406 / 658);
  }
});

test("seasonal point diameters use the actual low target height rather than the full output", () => {
  const scene = new T.Scene(), air = createSeasonalAir(T, scene, { getDrawingBufferSize(v) { v.set(407, 662); } });
  for (const season of ["spring", "summer", "autumn", "winter"]) {
    air.update("north", { season }, 0, false);
    for (const points of air.points.filter(p => p.visible)) assert.equal(points.material.uniforms.viewportHeight.value, 221);
  }
  air.update("room", { season: "spring" }, 0, false);
  assert.ok(air.points.every(p => !p.visible));
  const retina = createSeasonalAir(T, new T.Scene(), { domElement: { dataset: { pixelRatio: "2" } }, getDrawingBufferSize(v) { v.set(812, 1316); } });
  retina.update("north", { season: "spring" }, 0, false);
  assert.equal(retina.points[0].material.uniforms.viewportHeight.value, 264);
});

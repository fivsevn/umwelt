import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { lensWarpNdc, lensUnwarpNdc, createScopeLensPass } from "../rooftop/3d/lens-pass.mjs";

test("tiny lens distortion keeps the crosshair fixed and screen picking uses its exact inverse", () => {
  assert.deepEqual(lensWarpNdc([0, 0], 1.6), [0, 0]);
  assert.deepEqual(lensUnwarpNdc([0, 0], .6), [0, 0]);
  for (const aspect of [.5, 1, 1.6, 2.5]) for (const x of [-.9, -.4, 0, .4, .9]) for (const y of [-.9, -.4, 0, .4, .9]) {
    const distorted = lensUnwarpNdc([x, y], aspect), recovered = lensWarpNdc(distorted, aspect);
    assert.ok(Math.hypot(recovered[0] - x, recovered[1] - y) < 1e-12);
  }
  const point = lensUnwarpNdc([.5, .5]);
  assert.ok(point[0] < .5 && point[0] > .497, "the rim bends slightly while preserving the existing composition");
});

test("the lazy lens pass uses the existing pixel buffer, one extra draw and restores renderer state", () => {
  const context = { console: { warn() {} } };
  vm.runInNewContext(readFileSync(new URL("../rooftop/3d/vendor/three.min.js", import.meta.url), "utf8"), context);
  const T = context.THREE, draws = [], targets = [], renderer = {
    target: null, info: { autoReset: true, calls: 0, reset() { this.calls = 0; } },
    getRenderTarget() { return this.target; }, setRenderTarget(target) { this.target = target; targets.push(target); },
    render(scene, camera) { draws.push({ scene, camera, target: this.target }); this.info.calls++; },
  }, lens = createScopeLensPass(T, renderer), world = new T.Scene(), camera = new T.PerspectiveCamera();
  assert.deepEqual(lens.stats.buffer, null);
  lens.render(world, camera, 407, 662);
  assert.deepEqual(lens.stats.buffer, [407, 662]);
  assert.equal(draws.length, 2); assert.equal(draws[0].scene, world);
  assert.equal(draws[0].target.texture.magFilter, T.NearestFilter);
  assert.equal(draws[0].target.texture.colorSpace, T.LinearSRGBColorSpace);
  assert.ok(T.ShaderChunk.colorspace_fragment);
  assert.equal(renderer.target, null); assert.equal(renderer.info.autoReset, true); assert.equal(renderer.info.calls, 2);
  const original = draws[0].target;
  lens.render(world, camera, 844, 390);
  assert.equal(draws[2].target, original); assert.deepEqual(lens.stats.buffer, [844, 390]);
  assert.equal(draws[3].scene.children[0].material.uniforms.lensAspect.value, 844 / 390);
});

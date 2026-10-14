import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bakedFaceBounds, physicalSurfaceChart, bakedPixelUv } from "../3d/baked-pixel-grid.mjs";
import { BACKGROUND } from "../assets/background/empty-rooftop.mjs";

const close = (actual, expected) => actual.forEach((value, i) => assert.ok(Math.abs(value - expected[i]) < 1e-9, `${value} matches ${expected[i]}`));

test("actual baked rectangles derive safe atlas bounds while preserving every exported byte", () => {
  const bytes = readFileSync(new URL("../assets/background/empty-rooftop.bin", import.meta.url)), original = Buffer.from(bytes);
  for (const part of BACKGROUND.parts.filter(p => p.style === "baked")) {
    const data = new Float32Array(bytes.buffer, bytes.byteOffset + part.offset, part.vertices * 8),
      texture = BACKGROUND.textures.find(t => t.file === part.texture),
      result = bakedFaceBounds(data, [texture.width, texture.height]);
    assert.equal(result.unsupportedTriangles, 0, "every actual baked face supports safe rectangular sampling");
    assert.equal(result.faces * 6, part.vertices);
    for (let i = 0; i < part.vertices; i++) {
      const b = result.bounds.subarray(i * 4, i * 4 + 4), uv = data.subarray(i * 8 + 6, i * 8 + 8);
      assert.ok(b[0] <= uv[0] && b[2] >= uv[0] && b[1] <= uv[1] && b[3] >= uv[1]);
      assert.ok((b[2] - b[0]) * texture.width >= 1 && (b[3] - b[1]) * texture.height >= 1);
    }
  }
  assert.deepEqual(bytes, original, "derived attributes never edit positions, normals, transforms or original UVs");
});

test("physical face grids remain square on slopes despite unequal exported world axes", () => {
  const metres = [.27, .5357, .4638], h = Math.SQRT1_2,
    normal = [0, h * metres[1], h * metres[2]],
    game = physical => physical.map((value, i) => value / metres[i]),
    origin = physicalSurfaceChart(game([0, 0, 0]), normal, metres),
    u = physicalSurfaceChart(game([1 / 16, 0, 0]), normal, metres),
    v = physicalSurfaceChart(game([0, h / 16, -h / 16]), normal, metres);
  close(origin, [0, 0]); close(u, [1, 0]); close(v, [0, 1]);
  const nearHorizontalNormal = [0, Math.cos(.08) * metres[1], Math.sin(.08) * metres[2]];
  close(physicalSurfaceChart(game([-1 / 16, 0, 0]), nearHorizontalNormal, metres), [1, 0]);
  close(physicalSurfaceChart(game([0, -Math.sin(.08) / 16, Math.cos(.08) / 16]), nearHorizontalNormal, metres), [0, 1]);
});

test("different instances share the metre grid rather than inheriting local pixel sizes", () => {
  const metres = [.27, .5357, .4638],
    identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    scaled = [3, 0, 0, 0, 0, .5, 0, 0, 0, 0, 2, 0, 4, 0, 7, 1];
  const a = physicalSurfaceChart([0, 0, 0], [0, 1, 0], metres, 16, identity),
    b = physicalSurfaceChart([0, 0, 0], [0, 1, 0], metres, 16, scaled),
    aStep = physicalSurfaceChart([1 / (16 * metres[0]), 0, 0], [0, 1, 0], metres, 16, identity),
    bStep = physicalSurfaceChart([1 / (16 * metres[0] * 3), 0, 0], [0, 1, 0], metres, 16, scaled);
  close(aStep.map((value, i) => value - a[i]), [-1, 0]);
  close(bStep.map((value, i) => value - b[i]), [-1, 0]);
});

test("inverse derivatives sample one physical cell despite stretched UVs and a changed camera", () => {
  const atlas = [2048, 1024], bounds = [0, 0, 1, 1],
    map = c => [.2 + c[0] * 2 / atlas[0], .3 + c[1] * 3 / atlas[1]],
    mappedDerivative = d => [d[0] * 2 / atlas[0], d[1] * 3 / atlas[1]],
    expected = map([2.5, -1.5]);
  for (const [chart, dx, dy] of [
    [[2.13, -1.72], [.2, .1], [-.05, .3]],
    [[2.91, -1.12], [3, -.5], [.15, .6]],
  ]) {
    const result = bakedPixelUv(chart, map(chart), dx, dy, mappedDerivative(dx), mappedDerivative(dy), bounds, atlas);
    assert.equal(result.fallback, false); close(result.uv, expected);
  }
});

test("atlas edges stay within their own face and grazing determinants fall back finitely", () => {
  const chart = [2.49, .49], uv = [.10001, .20001], bounds = [.1, .2, .3, .4], atlas = [2048, 2048],
    clipped = bakedPixelUv(chart, uv, [1, 0], [0, 1], [-.3, 0], [0, -.3], bounds, atlas);
  assert.equal(clipped.fallback, false); close(clipped.uv, [.1 + .5 / 2048, .2 + .5 / 2048]);
  for (const [dx, dy, face] of [[[1, 0], [2, 0], bounds], [[0, 0], [0, 0], bounds], [[1, 0], [0, 1], [0, 0, 0, 0]]]) {
    const result = bakedPixelUv(chart, uv, dx, dy, [.01, 0], [0, .01], face, atlas);
    assert.equal(result.fallback, true); close(result.uv, uv); assert.ok(result.uv.every(Number.isFinite));
  }
});

test("unsupported and nonaffine face patterns keep original sampling with visible diagnostics", () => {
  const vertex = (x, y, u, v) => [x, y, 0, 0, 0, 1, u, v],
    valid = [...vertex(0, 0, .1, .2), ...vertex(1, 0, .3, .2), ...vertex(1, 1, .3, .4), ...vertex(0, 0, .1, .2), ...vertex(1, 1, .3, .4), ...vertex(0, 1, .1, .4)],
    affine = Float32Array.from(valid), warped = Float32Array.from(valid);
  assert.equal(bakedFaceBounds(affine, [2048, 2048]).faces, 1);
  warped[4 * 8] = 1.2;
  const result = bakedFaceBounds(warped, [2048, 2048]);
  assert.equal(result.faces, 0); assert.equal(result.unsupportedTriangles, 2); assert.ok(result.bounds.every(value => value === 0));
});

import test from "node:test";
import assert from "node:assert/strict";
import { drawingBufferSize } from "../rooftop/3d/render-budget.mjs";

test("software graphics bound full-screen fill while preserving small displays", () => {
  assert.deepEqual(drawingBufferSize(390, 844, true), [390, 844]);
  const [w, h] = drawingBufferSize(1440, 900, true);
  assert.ok(w * h <= 520000);
  assert.ok(w <= 960 && h <= 960);
  assert.ok(Math.abs(w / h - 1440 / 900) < 0.01);
});

test("mobile and ordinary editing canvases retain their native pixel grid", () => {
  for (const size of [
    [390, 844],
    [355, 266],
    [760, 570],
    [1280, 720],
  ])
    assert.deepEqual(drawingBufferSize(...size), size);
});
test("large viewports bound fill work while retaining aspect ratio and integer pixels", () => {
  for (const [w, h] of [
    [1920, 1080],
    [3840, 2160],
    [2078, 1418],
    [844, 4000],
    [4000, 300],
  ]) {
    const [bw, bh] = drawingBufferSize(w, h);
    assert.ok(bw * bh <= 1600000 && Math.max(bw, bh) <= 1600);
    assert.ok(Number.isInteger(bw) && Number.isInteger(bh) && bw > 0 && bh > 0);
    assert.ok(Math.abs(bw / bh - w / h) < 0.02);
  }
  assert.deepEqual(drawingBufferSize(0, 0), [1, 1]);
});

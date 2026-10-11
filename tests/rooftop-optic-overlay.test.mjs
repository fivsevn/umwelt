import test from "node:test";
import assert from "node:assert/strict";
import { updateOpticOverlay } from "../rooftop/3d/optic-overlay.mjs";
import { resolvePixelGrid, pixelGridSize } from "../rooftop/3d/pixel-grid.mjs";

function fixture(width, height, diameter, dpr = 1) {
  const bounds = { left: 0, top: 0, width, height },
    scope = { left: (width - diameter) / 2, top: (height - diameter) / 2, width: diameter, height: diameter };
  function canvas() {
    const draws = [], ctx = {
      fillStyle: null, image: null, paints: 0,
      createImageData(w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; },
      putImageData(image) { this.image = image; this.paints++; },
      fillRect(x, y, w, h) { draws.push({ x, y, w, h, color: this.fillStyle }); },
    };
    return { style: {}, dataset: {}, getContext() { return ctx; }, ctx, draws };
  }
  const mask = canvas(), engraving = canvas(), labels = new Map(), element = {
    ownerDocument: { defaultView: { devicePixelRatio: dpr }, querySelector(selector) { assert.equal(selector, "#garden"); return { dataset: { pixelRatio: String(dpr) }, getBoundingClientRect() { return bounds; } }; } },
    getBoundingClientRect() { return scope; },
    querySelector(selector) {
      if (selector === ".scope-mask") return mask;
      if (selector === ".scope-engraving") return engraving;
      if (!labels.has(selector)) labels.set(selector, { textContent: "" });
      return labels.get(selector);
    },
  };
  return { element, mask, engraving, scope, bounds, labels };
}
const reading = { magnification: 3.2, inclinationDegrees: -4.1, measuredSurface: true, distanceMetres: 81.8, mradPixels: 21 };

test("eyecup and engraving share resolved square cells and the actual world canvas origin at every viewport/DPR", () => {
  for (const dpr of [1, 1.25, 2, 3]) for (const [w, h, d] of [[407, 662, 358.16], [390, 640, 343.2], [844, 390, 319.8]]) {
    const grid = resolvePixelGrid(dpr), frame = pixelGridSize(w, h, grid), pixel = grid.cssPixelStep,
      f = fixture(w, h, d, dpr); updateOpticOverlay(f.element, reading);
    for (const canvas of [f.mask, f.engraving]) {
      assert.equal(canvas.width, frame.source[0]); assert.equal(canvas.height, frame.source[1]);
      assert.ok(Math.abs(parseFloat(canvas.style.width) / canvas.width - pixel) < 1e-12);
      assert.ok(Math.abs(parseFloat(canvas.style.height) / canvas.height - pixel) < 1e-12);
      assert.equal(parseFloat(canvas.style.left) + f.scope.left, 0); assert.equal(parseFloat(canvas.style.top) + f.scope.top, 0);
      assert.equal(canvas.dataset.pixelStep, String(pixel)); assert.equal(canvas.dataset.physicalPixelStep, String(grid.pixelStep)); assert.equal(canvas.dataset.origin, "0,0");
    }
    const image = f.mask.ctx.image, cx = Math.floor(frame.output[0] / (2 * grid.pixelStep)), cy = Math.floor(frame.output[1] / (2 * grid.pixelStep)),
      opening = horizontal => {
        const marks = [];
        for (let i = 0; i < (horizontal ? image.width : image.height); i++) {
          const x = horizontal ? i : cx, y = horizontal ? cy : i;
          if (image.data[(y * image.width + x) * 4 + 3] < 230) marks.push(i);
        }
        return (marks.at(-1) - marks[0] + 1) * pixel;
      };
    assert.equal(opening(true), opening(false), "pixel opening remains circular with a rectangular full viewport canvas");
    assert.ok(Math.abs(opening(true) - (d - 8)) <= pixel);
    const center = f.engraving.draws.find(mark => mark.color === "#a45738");
    assert.deepEqual([center.x, center.y, center.w, center.h], [cx, cy, 1, 1]);
    assert.ok(f.engraving.draws.every(mark => Number.isInteger(mark.x) && Number.isInteger(mark.y) && mark.w === 1 && mark.h === 1));
    assert.ok(f.engraving.draws.every(mark => Math.hypot(mark.x - cx, mark.y - cy) < d / (2 * pixel)), "circle clipping happens on native cells");
    assert.ok(f.engraving.draws.some(mark => mark.x === cx + Math.round(21 / pixel) && mark.y === cy - 1), "1 MRAD preserves its CSS angular scale to the nearest native cell");
  }
});

test("viewport remeasure restores integer display size, updates cached pixel contents, and leaves DOM readings clear", () => {
  const f = fixture(390, 640, 343.2); updateOpticOverlay(f.element, reading);
  assert.equal(f.labels.get("[data-scope-zoom]").textContent, "3.2×");
  assert.equal(f.labels.get("[data-scope-range]").textContent, "82 m");
  const paints = f.mask.ctx.paints, drawings = f.engraving.draws.length;
  f.mask.style.height = "820px"; updateOpticOverlay(f.element, reading);
  assert.equal(f.mask.style.height, "642px", "stale Safari viewport CSS cannot stretch native cells");
  assert.equal(f.mask.ctx.paints, paints); assert.equal(f.engraving.draws.length, drawings);
  f.bounds.width = 844; f.bounds.height = 390; f.scope.left = 262.1; f.scope.top = 35.1; f.scope.width = f.scope.height = 319.8;
  updateOpticOverlay(f.element, { ...reading, mradPixels: 12 });
  assert.equal(f.mask.width, 282); assert.equal(f.mask.height, 130); assert.equal(f.mask.style.width, "846px");
  assert.equal(parseFloat(f.mask.style.left) + f.scope.left, 0); assert.equal(f.mask.ctx.paints, paints + 1);
});

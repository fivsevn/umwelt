import test from "node:test";
import assert from "node:assert/strict";
import { updateOpticOverlay } from "../rooftop/3d/optic-overlay.mjs";
import { resolvePixelGrid, resolveObservationPixelGrid, pixelGridSize } from "../rooftop/3d/pixel-grid.mjs";

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
  const world = { dataset: { pixelRatio: String(dpr) }, getBoundingClientRect() { return bounds; } },
    mask = canvas(), engraving = canvas(), labels = new Map(), element = {
    ownerDocument: { defaultView: { devicePixelRatio: dpr }, querySelector(selector) { assert.equal(selector, "#garden"); return world; } },
    getBoundingClientRect() { return scope; },
    querySelector(selector) {
      if (selector === ".scope-mask") return mask;
      if (selector === ".scope-engraving") return engraving;
      if (!labels.has(selector)) labels.set(selector, { textContent: "" });
      return labels.get(selector);
    },
  };
  return { element, world, mask, engraving, scope, bounds, labels };
}
const reading = { magnification: 3.2, inclinationDegrees: -4.1, measuredSurface: true, distanceMetres: 81.8, mradPixels: 21 };

test("local review lens uses its active source canvas without requiring the game DOM id", () => {
  const f = fixture(407, 662, 358.16, 3);
  f.element.ownerDocument.querySelector = () => { throw new Error('No #garden in the local review'); };
  Object.assign(f.world.dataset, { physicalPixelStep: '1', targetCssPixelStep: String(1 / 3) });
  f.bounds.left = 16; f.bounds.top = 72;
  updateOpticOverlay(f.element, reading, f.world);
  assert.equal(f.mask.width, 1221);
  assert.equal(f.mask.height, 1986);
  for (const canvas of [f.mask, f.engraving]) {
    assert.equal(canvas.dataset.physicalPixelStep, '1');
    assert.equal(canvas.dataset.origin, '16,72');
    close(parseFloat(canvas.style.left) + f.scope.left, 16);
    close(parseFloat(canvas.style.top) + f.scope.top, 72);
  }
});

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
  assert.equal(f.mask.style.height, "640px", "stale Safari viewport CSS cannot stretch native cells");
  assert.equal(f.mask.ctx.paints, paints); assert.equal(f.engraving.draws.length, drawings);
  f.bounds.width = 844; f.bounds.height = 390; f.scope.left = 262.1; f.scope.top = 35.1; f.scope.width = f.scope.height = 319.8;
  updateOpticOverlay(f.element, { ...reading, mradPixels: 12 });
  assert.equal(f.mask.width, 422); assert.equal(f.mask.height, 195); assert.equal(f.mask.style.width, "844px");
  assert.equal(parseFloat(f.mask.style.left) + f.scope.left, 0); assert.equal(f.mask.ctx.paints, paints + 1);
});

test("scope mask and angular engraving follow live detail cells and recover their coarse bitmap on zoom out", () => {
  for (const dpr of [1, 1.25, 2, 3]) {
    const f = fixture(407, 662, 358.16, dpr), stages = [["neighbor", 1], ["neighbor", 2], ["neighbor", 8], ["neighbor", 1], ["bird", 8], ["drone", 8]];
    let previousStep;
    for (const [view, zoom] of stages) {
      const grid = resolveObservationPixelGrid(dpr, view, zoom), frame = pixelGridSize(407, 662, grid), pixel = grid.cssPixelStep,
        paintsBefore = f.mask.ctx.paints, marksBefore = f.engraving.draws.length;
      Object.assign(f.world.dataset, { pixelRatio: String(dpr), physicalPixelStep: String(grid.pixelStep), targetCssPixelStep: String(grid.targetCssPixelStep) });
      updateOpticOverlay(f.element, reading);
      for (const canvas of [f.mask, f.engraving]) {
        assert.equal(canvas.width, frame.source[0]); assert.equal(canvas.height, frame.source[1]);
        assert.equal(canvas.dataset.physicalPixelStep, String(grid.pixelStep)); assert.equal(canvas.dataset.pixelStep, String(pixel));
        close(parseFloat(canvas.style.width) / canvas.width, pixel); close(parseFloat(canvas.style.height) / canvas.height, pixel);
        assert.equal(parseFloat(canvas.style.left) + f.scope.left, 0); assert.equal(parseFloat(canvas.style.top) + f.scope.top, 0);
      }
      const image = f.mask.ctx.image, opening = horizontal => {
        const length = horizontal ? image.width : image.height, middle = Math.floor(frame.output[horizontal ? 1 : 0] / (2 * grid.pixelStep));
        let first = length, last = -1;
        for (let i = 0; i < length; i++) {
          const x = horizontal ? i : middle, y = horizontal ? middle : i;
          if (image.data[(y * image.width + x) * 4 + 3] < 230) { first = Math.min(first, i); last = i; }
        }
        return (last - first + 1) * pixel;
      };
      close(opening(true), opening(false));
      assert.ok(Math.abs(opening(true) - (f.scope.width - 8)) <= pixel, "refining cells preserves the physical lens opening");
      if (previousStep !== grid.pixelStep) {
        assert.equal(f.mask.ctx.paints, paintsBefore + 1, "changing the live sample grid invalidates the bitmap cache");
        const marks = f.engraving.draws.slice(marksBefore), cx = Math.floor(frame.output[0] / (2 * grid.pixelStep)), cy = Math.floor(frame.output[1] / (2 * grid.pixelStep)),
          center = marks.find(mark => mark.color === "#a45738");
        assert.deepEqual([center.x, center.y, center.w, center.h], [cx, cy, 1, 1]);
        assert.ok(marks.every(mark => Number.isInteger(mark.x) && Number.isInteger(mark.y) && mark.w === 1 && mark.h === 1));
        assert.ok(marks.some(mark => mark.x === cx + Math.round(reading.mradPixels / pixel) && mark.y === cy - 1), "one MRAD keeps its angular CSS distance at the live cell scale");
        assert.ok(marks.every(mark => Math.hypot(mark.x - cx, mark.y - cy) < f.scope.width / (2 * pixel)), "detail engraving stays inside the real lens circle");
      } else {
        assert.equal(f.mask.ctx.paints, paintsBefore); assert.equal(f.engraving.draws.length, marksBefore, "unchanged integer cells reuse their bitmap");
      }
      assert.equal(f.labels.get("[data-scope-range]").textContent, "82 m", "sampling alone cannot alter a measured range");
      previousStep = grid.pixelStep;
    }
    assert.equal(f.mask.dataset.physicalPixelStep, String(resolvePixelGrid(dpr).pixelStep));
  }
});

function close(a, b) { assert.ok(Math.abs(a - b) < 1e-12, `${a} != ${b}`); }

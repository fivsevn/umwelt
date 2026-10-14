import { resolveCanvasPixelGrid, pixelGridSize } from "./pixel-grid.mjs";

// Engraving and eyecup occupy the same globally aligned cells as the world.
const glyphs = {
  0: ['111','101','101','101','111'], 1: ['010','110','010','010','111'],
  2: ['111','001','111','100','111'], 3: ['111','001','111','001','111'],
  4: ['101','101','111','001','001'], 5: ['111','100','111','001','111'],
  6: ['111','100','111','101','111'], 7: ['111','001','010','010','010'],
  8: ['111','101','111','101','111'], 9: ['111','101','111','001','111'],
};
const cache = new WeakMap();
export function opticOverlayMarkup() {
  return `<canvas class="scope-mask"></canvas><canvas class="scope-engraving"></canvas>
    <div class="scope-optics-top"><span data-scope-zoom>—×</span><span class="scope-level">∠<span data-scope-angle>—°</span></span></div>
    <div class="scope-optics-range"><small>LRF <span data-scope-status>SCAN</span></small><strong data-scope-range>— m</strong></div>
    <small class="scope-unit-label">MRAD</small>`;
}
function canvasFrame(canvas, frame, bounds, scope) {
  canvas.style.left = `${bounds.left - scope.left}px`;
  canvas.style.top = `${bounds.top - scope.top}px`;
  canvas.style.width = `${frame.padded[0] / frame.pixelRatio}px`; canvas.style.height = `${frame.padded[1] / frame.pixelRatio}px`;
  canvas.dataset.pixelStep = String(frame.cssPixelStep);
  canvas.dataset.physicalPixelStep = String(frame.pixelStep);
  canvas.dataset.pixelRatio = String(frame.pixelRatio);
  canvas.dataset.origin = `${bounds.left},${bounds.top}`;
}
function paintMask(canvas, diameter, frame) {
  const pixel = frame.cssPixelStep, [w, h] = frame.source,
    centre = frame.output.map(value => Math.floor(value / (2 * frame.pixelStep)) + .5);
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d'), image = ctx.createImageData(w, h), r = diameter / (2 * pixel);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x + .5 - centre[0], dy = y + .5 - centre[1], d = Math.hypot(dx, dy), n = d / r;
    let color = [9, 14, 11], alpha = 0;
    if (d >= r) alpha = 248;
    else if (d >= r - 4 / pixel) { color = [26, 32, 27]; alpha = 240; }
    else if (d >= r - 6 / pixel) { color = [85, 90, 73]; alpha = 164; }
    else if (n > .73) {
      alpha = Math.floor(Math.pow((n - .73) / .27, 2) * 108 / 9) * 9;
      if (dx < 0 && dy < -r * .3) color = [35, 54, 48];
    }
    const i = (y * w + x) * 4;
    image.data[i] = color[0]; image.data[i+1] = color[1]; image.data[i+2] = color[2]; image.data[i+3] = alpha;
  }
  ctx.putImageData(image, 0, 0);
}
function pixelText(ctx, text, x, y) {
  for (const char of String(text)) {
    const glyph = glyphs[char];
    if (glyph) glyph.forEach((row, dy) => [...row].forEach((v, dx) => { if (v === '1') ctx.fillRect(x + dx, y + dy, 1, 1); }));
    x += 4;
  }
}
function paintEngraving(canvas, diameter, mradPixels, frame) {
  const pixel = frame.cssPixelStep, [w, h] = frame.source,
    [cx, cy] = frame.output.map(value => Math.floor(value / (2 * frame.pixelStep))),
    step = mradPixels / pixel, radius = diameter / (2 * pixel);
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d'), rawFill = ctx.fillRect.bind(ctx);
  // Rasterize the circular boundary on the native grid. A CSS circular clip
  // would cut through displayed cells and create smaller antialiased fragments.
  const ink = { fillRect(x, y, width, height) {
    for (let j = Math.max(0, y); j < Math.min(h, y + height); j++)
      for (let i = Math.max(0, x); i < Math.min(w, x + width); i++)
        if (Math.hypot(i - cx, j - cy) < radius) rawFill(i, j, 1, 1);
  } };
  ctx.fillStyle = '#18221bce';
  ink.fillRect(0, cy, cx - 1, 1); ink.fillRect(cx + 2, cy, w, 1);
  ink.fillRect(cx, 0, 1, cy - 1); ink.fillRect(cx, cy + 2, 1, h);
  for (let n = -16; n <= 16; n++) {
    if (!n) continue;
    const atX = Math.round(cx + n * step), atY = Math.round(cy + n * step), tick = n % 2 === 0 ? 3 : 1;
    ink.fillRect(atX, cy - tick, 1, tick * 2 + 1);
    ink.fillRect(cx - tick, atY, tick * 2 + 1, 1);
    if (n % 2 === 0 && Math.abs(n) <= 12 && step >= 3.5) {
      pixelText(ink, Math.abs(n), atX + 2, cy + 5);
      if (n > 0) pixelText(ink, n, cx + 5, atY - 2);
    }
  }
  ctx.fillStyle = '#a45738'; ink.fillRect(cx, cy, 1, 1);
}
export function updateOpticOverlay(element, reading, worldCanvas) {
  if (!reading) return;
  const set = (key, value) => {
    const node = element.querySelector(`[data-scope-${key}]`);
    if (node && node.textContent !== value) node.textContent = value;
  };
  set('zoom', `${reading.magnification.toFixed(1)}×`);
  set('angle', `${reading.inclinationDegrees > 0 ? '+' : ''}${reading.inclinationDegrees.toFixed(1)}°`);
  set('range', reading.measuredSurface ? `${Math.round(reading.distanceMetres)} m` : '— m');
  set('status', reading.measuredSurface ? 'SCAN' : 'SEARCH');
  const world = worldCanvas || element.ownerDocument.querySelector('#garden');
  if (!world) return;
  const scope = element.getBoundingClientRect(), diameter = scope.width,
    mask = element.querySelector('.scope-mask'), engraving = element.querySelector('.scope-engraving'),
    bounds = world.getBoundingClientRect(),
    grid = resolveCanvasPixelGrid(world.dataset, element.ownerDocument.defaultView?.devicePixelRatio || 1),
    frame = pixelGridSize(bounds.width, bounds.height, grid), previous = cache.get(element) || {};
  const dimensions = `${frame.output},${frame.pixelStep},${frame.pixelRatio},${diameter}`, step = reading.mradPixels.toFixed(2);
  // Use the actual game canvas, including Safari's visible-viewport resize.
  // Integer device-pixel cells pad only the bottom/right, where the world clips.
  canvasFrame(mask, frame, bounds, scope); canvasFrame(engraving, frame, bounds, scope);
  if (diameter > 0 && bounds.width > 0 && bounds.height > 0 && dimensions !== previous.dimensions) paintMask(mask, diameter, frame);
  if (diameter > 0 && (dimensions !== previous.dimensions || step !== previous.step)) paintEngraving(engraving, diameter, reading.mradPixels, frame);
  cache.set(element, { dimensions, step });
}

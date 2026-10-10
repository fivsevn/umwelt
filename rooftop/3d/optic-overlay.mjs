// Original pixel engraving and eyecup. Device references are in the handoff.
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
function paintMask(canvas, diameter) {
  const pixel = 2, w = Math.ceil(innerWidth / pixel), h = Math.ceil(innerHeight / pixel);
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d'), image = ctx.createImageData(w, h), r = diameter / (2 * pixel);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x + .5 - w / 2, dy = y + .5 - h / 2, d = Math.hypot(dx, dy), n = d / r;
    let color = [9, 14, 11], alpha = 0;
    if (d >= r) alpha = 248;
    else if (d >= r - 2) { color = [26, 32, 27]; alpha = 240; }
    else if (d >= r - 3) { color = [85, 90, 73]; alpha = 164; }
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
function paintEngraving(canvas, diameter, mradPixels) {
  const size = Math.ceil(diameter / 2), center = Math.floor(size / 2), step = mradPixels / 2;
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#18221bce';
  ctx.fillRect(0, center, center - 1, 1); ctx.fillRect(center + 2, center, size, 1);
  ctx.fillRect(center, 0, 1, center - 1); ctx.fillRect(center, center + 2, 1, size);
  for (let n = -16; n <= 16; n++) {
    if (!n) continue;
    const at = Math.round(center + n * step), tick = n % 2 === 0 ? 3 : 1;
    ctx.fillRect(at, center - tick, 1, tick * 2 + 1);
    ctx.fillRect(center - tick, at, tick * 2 + 1, 1);
    if (n % 2 === 0 && Math.abs(n) <= 12 && step >= 3.5) {
      pixelText(ctx, Math.abs(n), at + 2, center + 5);
      if (n > 0) pixelText(ctx, n, center + 5, at - 2);
    }
  }
  ctx.fillStyle = '#a45738'; ctx.fillRect(center, center, 1, 1);
}
export function updateOpticOverlay(element, reading) {
  if (!reading) return;
  const set = (key, value) => {
    const node = element.querySelector(`[data-scope-${key}]`);
    if (node && node.textContent !== value) node.textContent = value;
  };
  set('zoom', `${reading.magnification.toFixed(1)}×`);
  set('angle', `${reading.inclinationDegrees > 0 ? '+' : ''}${reading.inclinationDegrees.toFixed(1)}°`);
  set('range', reading.measuredSurface ? `${Math.round(reading.distanceMetres)} m` : '— m');
  set('status', reading.measuredSurface ? 'SCAN' : 'SEARCH');
  const diameter = element.getBoundingClientRect().width, previous = cache.get(element) || {};
  const dimensions = `${innerWidth},${innerHeight},${diameter}`, step = reading.mradPixels.toFixed(2);
  if (diameter > 0 && dimensions !== previous.dimensions) paintMask(element.querySelector('.scope-mask'), diameter);
  if (diameter > 0 && (dimensions !== previous.dimensions || step !== previous.step)) paintEngraving(element.querySelector('.scope-engraving'), diameter, reading.mradPixels);
  cache.set(element, { dimensions, step });
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { ITEM_METRES_TO_UNITS } from '../rooftop/item-catalog.mjs';

const T = createRequire(import.meta.url)('../rooftop/3d/vendor/three.min.js');
const source = readFileSync(new URL('../rooftop/3d/scene3d.mjs', import.meta.url), 'utf8');
// Execute the actual portrait function with controlled transfer/readback timing.
const portrait = source.slice(source.indexOf('  function thumbnail('), source.indexOf('\n  reset(options.scene'));
const key = (type, seed = 1835, pot) => JSON.stringify([type, pot, seed, 32, 32]);
function fixture() {
  const loaded = new Set(), loads = new Map(), timers = [], deleted = [], paints = [], targets = [], cached = new Map();
  let copies = 0;
  const canvas = label => ({ label, dataset: {}, width: 32, height: 32, getContext() { return {
    createImageData(w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; },
    putImageData() {}, drawImage(image) { paints.push(image.label); },
  }; } });
  const renderer = { target: null, shadowMap: { needsUpdate: false },
    getClearColor(color) { return color.set('#000000'); }, getClearAlpha() { return 0; },
    getRenderTarget() { return this.target; }, setRenderTarget(target) {
      this.target = target;
      if (target && !targets.includes(target)) { targets.push(target); target.addEventListener('dispose', () => deleted.push('target')); }
    }, setClearColor() {}, render() {},
  };
  const gl = { TIMEOUT_EXPIRED: 1, WAIT_FAILED: 2,
    fenceSync() { return {}; }, createBuffer() { return {}; }, bindBuffer() {}, bufferData() {}, readPixels() {}, flush() {},
    clientWaitSync() { return 0; }, isContextLost() { return false; }, getBufferSubData(_target, _offset, pixels) { pixels.fill(255); },
    deleteSync() { deleted.push('fence'); }, deleteBuffer() { deleted.push('buffer'); },
  };
  const context = { T, renderer, gl, ITEM_METRES_TO_UNITS, document: { createElement() { return canvas('render-' + ++copies); } },
    waitingPortraits: new WeakMap(), spriteCache: cached, catalogInfo: new Map(), batches: [], software: false, previewReadbacks: 0,
    nativeItems: { isReady(o) { return loaded.has(o.type); }, preload(o) {
      return new Promise(resolve => loads.set(o.type, () => { loaded.add(o.type); resolve(); }));
    } },
    asset: () => ({}), getItemDefinition: type => ({ modelId: type, family: 'native' }),
    group(parent) { const g = new T.Group(); parent.add(g); return g; },
    makeObject(parent) { parent.add(new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshLambertMaterial())); },
    compileInstances() {}, release(root) { root.removeFromParent(); },
    style: { tone: { value: new T.Color('#ffffff') }, updateAtmosphere() {} },
    windTime: { value: 1 }, windPower: { value: 1 }, surfaceWeather: { wet: { value: .5 }, rain: { value: .5 } },
    setTimeout(fn) { timers.push(fn); },
  };
  vm.runInNewContext(portrait + '\nglobalThis.thumbnail = thumbnail;', context);
  return { ...context, canvas, loaded, loads, paints, timers, deleted, cached, context };
}

test('selecting a ready portrait invalidates an earlier native model transfer for the same canvas', async () => {
  const f = fixture(), output = f.canvas('output');
  f.loaded.add('ready'); f.cached.set(key('ready'), f.canvas('cached-ready'));
  const old = f.thumbnail({ type: 'loading' }, output);
  f.thumbnail({ type: 'ready' }, output);
  f.loads.get('loading')(); await old;
  assert.deepEqual(f.paints, ['cached-ready']);
  assert.equal(f.cached.has(key('loading')), false, 'obsolete model transfers never render an empty or stale portrait');
});

test('out-of-order native loads paint only the newest selection and retain its input snapshot', async () => {
  const f = fixture(), output = f.canvas('output'), newer = { type: 'new', seed: 12, pot: 'white' };
  f.cached.set(key('old'), f.canvas('cached-old')); f.cached.set(key('new', 12, 'white'), f.canvas('cached-new'));
  const first = f.thumbnail({ type: 'old' }, output), second = f.thumbnail(newer, output);
  newer.seed = 99; newer.pot = 'plastic';
  f.loads.get('new')(); await second;
  f.loads.get('old')(); await first;
  assert.deepEqual(f.paints, ['cached-new']);
});

test('an obsolete GPU portrait readback warms its own cache without replacing the current image or leaking resources', async () => {
  const f = fixture(), output = f.canvas('output');
  f.loaded.add('old'); f.loaded.add('ready'); f.cached.set(key('ready'), f.canvas('cached-ready'));
  const old = f.thumbnail({ type: 'old' }, output, true);
  assert.equal(f.context.previewReadbacks, 1);
  f.thumbnail({ type: 'ready' }, output);
  f.timers.shift()(); await old;
  assert.deepEqual(f.paints, ['cached-ready']);
  assert.ok(f.cached.has(key('old')), 'the completed source portrait remains reusable under its own identity');
  assert.equal(f.context.previewReadbacks, 0);
  assert.deepEqual(f.deleted.sort(), ['buffer', 'fence', 'target']);
  f.thumbnail({ type: 'old' }, output);
  assert.deepEqual(f.paints, ['cached-ready', 'render-1']);
});

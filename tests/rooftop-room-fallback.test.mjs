import test from 'node:test';
import assert from 'node:assert/strict';

test('the room fallback loads only when painted and invalidates its cached floor after the image arrives', async () => {
  const previousImage = globalThis.Image;
  const images = [];
  globalThis.Image = class {
    complete = false;
    naturalWidth = 0;
    constructor() { images.push(this); }
    addEventListener(name, callback) { this[name] = callback; }
  };
  try {
    const { paintRoomBase, onRoomBackgroundReady } = await import('../rooftop/room-scene.mjs?fallback-check');
    assert.equal(images.length, 0, 'native room startup does not download the fallback image');
    let draws = 0;
    const c = { fillRect() {}, drawImage() { draws++; } };
    const dispose = onRoomBackgroundReady(() => paintRoomBase(c));
    paintRoomBase(c);
    assert.equal(images.length, 1);
    assert.equal(draws, 0);
    images[0].complete = true;
    images[0].naturalWidth = 640;
    images[0].load();
    assert.equal(draws, 1, 'the single-paint cache receives the native background after its asynchronous load');
    dispose();
  } finally { globalThis.Image = previousImage; }
});

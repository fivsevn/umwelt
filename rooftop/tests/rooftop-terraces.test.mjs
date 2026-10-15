import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { canonicalAtlasPlugin } from '../3d/native-model-loader.mjs';
import { publicFile } from '../../.github/scripts/prepare-site.mjs';

const context = { console: { warn() {} } };
vm.runInNewContext(readFileSync(new URL('../3d/vendor/three.min.js', import.meta.url), 'utf8'), context);
const T = globalThis.THREE = context.THREE;
const { GLTFLoader } = await import('../3d/vendor/gltf/GLTFLoader.js');
const bytes = readFileSync(new URL('../assets/terraces/terraces.glb', import.meta.url));
const { scene } = await new GLTFLoader().register(canonicalAtlasPlugin(new T.Texture())).parseAsync(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
scene.updateMatrixWorld(true);
const parts = [];
scene.traverse(mesh => { if (mesh.isMesh) parts.push(mesh); });

test('published terrace GLB is the exact approved export with the native atlas', () => {
  assert.ok(bytes.equals(readFileSync(new URL('../art/rooftop-terraces-03/preview/assets/terraces.glb', import.meta.url))));
  const length = bytes.readUInt32LE(12), gltf = JSON.parse(bytes.subarray(20, 20 + length));
  assert.equal(gltf.images.length, 1);
  const view = gltf.bufferViews[gltf.images[0].bufferView], start = 28 + length + (view.byteOffset || 0);
  assert.ok(bytes.subarray(start, start + view.byteLength).equals(readFileSync(new URL('../art/rooftop-terraces-03/terraces/atlas.png', import.meta.url))));
  assert.ok(publicFile('rooftop/assets/terraces/terraces.glb'));
  assert.ok(publicFile('rooftop/3d/terrace-finishes.mjs'));
  assert.ok(!publicFile('rooftop/art/rooftop-terraces-03/terraces/terraces.blend'));
});

test('all added geometry stays on the two protagonist terraces, with distinct finishes', () => {
  const counts = { north: { parts: 0, repairs: 0, fractures: 0 }, south: { parts: 0, repairs: 0, fractures: 0 } };
  for (const mesh of parts) {
    const side = mesh.name.includes('north-') ? 'north' : 'south';
    const position = mesh.geometry.attributes.position, p = new T.Vector3();
    for (let i = 0; i < position.count; i++) {
      p.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
      assert.ok(p.x > -10.4 && p.x < 10.4 && p.y > 0 && p.y < 5.64, mesh.name);
      assert.ok(side === 'north' ? p.z > -12.4 && p.z < 12.4 : p.z > 27.8 && p.z < 36.4, mesh.name);
    }
    counts[side].parts++;
    if (mesh.userData.part_role === 'floor-repair') counts[side].repairs++;
    if (mesh.userData.part_role === 'fracture-bevel') counts[side].fractures++;
    assert.ok(!['drain-interior', 'drain-rim', 'drain-bar', 'drain-surround', 'channel-bottom', 'channel-lip'].includes(mesh.userData.part_role));
  }
  assert.deepEqual(counts, { north: { parts: 108, repairs: 2, fractures: 3 }, south: { parts: 65, repairs: 0, fractures: 0 } });
});

test('the two drains retain their approved centres and equal horizontal diameters', () => {
  const rings = parts.filter(mesh => mesh.userData.part_role === 'round-drain-rim');
  assert.equal(rings.length, 2);
  for (const mesh of rings) {
    const bounds = new T.Box3().setFromObject(mesh), size = bounds.getSize(new T.Vector3()), centre = bounds.getCenter(new T.Vector3());
    const expected = mesh.name.includes('north-') ? [-.72, -8.9] : [-8.9, 35.15];
    assert.ok(Math.abs(size.x - .9) < .00001 && Math.abs(size.z - .9) < .00001);
    assert.ok(Math.abs(centre.x - expected[0]) < .00001 && Math.abs(centre.z - expected[1]) < .00001);
    assert.ok(Math.abs(bounds.max.y - (.038 + .0045 / .5357142857142857)) < .00001);
  }
});

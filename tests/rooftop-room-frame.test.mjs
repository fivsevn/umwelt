import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { roomFrame } from '../rooftop/3d/room-frame.mjs';
import { ITEM_METRES_TO_UNITS } from '../rooftop/item-catalog.mjs';

const T = createRequire(import.meta.url)('../rooftop/3d/vendor/three.min.js');
const glb = readFileSync(new URL('../rooftop/assets/room/room-background.glb', import.meta.url));
const jsonLength = glb.readUInt32LE(12), doc = JSON.parse(glb.toString('utf8', 20, 20 + jsonLength));
const binary = glb.subarray(28 + jsonLength);
const actualVertices = doc.nodes.filter(node => node.mesh !== undefined).flatMap(node =>
  doc.meshes[node.mesh].primitives.flatMap(primitive => {
    assert.ok(!node.matrix && !node.translation && !node.rotation && !node.scale);
    const accessor = doc.accessors[primitive.attributes.POSITION], buffer = doc.bufferViews[accessor.bufferView];
    const offset = (buffer.byteOffset || 0) + (accessor.byteOffset || 0), stride = buffer.byteStride || 12;
    return Array.from({ length: accessor.count }, (_, index) => new T.Vector3(
      ...[0, 4, 8].map(component => binary.readFloatLE(offset + index * stride + component) * ITEM_METRES_TO_UNITS),
    ));
  }),
);

test('default room framing includes actual authored walls, panes and door in landscape and portrait', () => {
  for (const [width, height, theta, phi, zoom] of [
    [856, 642, -.18, .9, 1], [360, 720, -.18, .9, 1],
    [642, 856, -.18, .9, 1.07], [856, 642, -.6, .6, 1],
  ]) {
    const frame = roomFrame(width, height, theta, phi, { zoom });
    const camera = new T.OrthographicCamera(-frame.width / 2, frame.width / 2, frame.span / 2, -frame.span / 2, .1, 6000);
    const target = new T.Vector3(frame.target.x, frame.target.y, frame.target.z);
    camera.position.set(target.x + Math.sin(theta) * Math.cos(phi) * 58,
      target.y + Math.sin(phi) * 58, target.z + Math.cos(theta) * Math.cos(phi) * 58);
    camera.lookAt(target); camera.zoom = zoom; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    for (const point of actualVertices) {
      const ndc = point.clone().project(camera);
      assert.ok(Math.abs(ndc.x) <= .900001 && Math.abs(ndc.y) <= .900001,
        `Authored vertex must fit inside 5% margins at ${width}x${height}: ${ndc.toArray()}`);
      assert.ok(ndc.z > -1 && ndc.z < 1);
    }
  }
});

test('the gameplay perspective room camera fits all real parts at both screen shapes', () => {
  for (const [width, height] of [[856, 642], [360, 720]]) {
    const distance = 46, theta = -.18, phi = .9, zoom = 1.07;
    const frame = roomFrame(width, height, theta, phi, { zoom, distance });
    const camera = new T.PerspectiveCamera(2 * Math.atan(frame.span / (2 * distance)) * 180 / Math.PI, width / height, .1, 6000);
    const target = new T.Vector3(frame.target.x, frame.target.y, frame.target.z);
    camera.position.set(target.x + Math.sin(theta) * Math.cos(phi) * distance,
      target.y + Math.sin(phi) * distance, target.z + Math.cos(theta) * Math.cos(phi) * distance);
    camera.lookAt(target); camera.zoom = zoom; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    for (const point of actualVertices) {
      const ndc = point.clone().project(camera);
      assert.ok(Math.abs(ndc.x) <= .900001 && Math.abs(ndc.y) <= .900001,
        `Perspective authored vertex must fit at ${width}x${height}: ${ndc.toArray()}`);
      assert.ok(ndc.z > -1 && ndc.z < 1);
    }
  }
});

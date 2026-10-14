import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createRoomDoor, mountRoomDoorLeaves } from "../3d/room-door.mjs";

const T = createRequire(import.meta.url)("../3d/vendor/three.min.js");

test("the complete authored door mounts at the real hinge without moving its resting components", () => {
  const scene = new T.Scene(), room = new T.Group(), native = new T.Group();
  scene.add(room); room.add(native);
  native.scale.setScalar(5.6 / 3);
  const width = .8 * 5.6 / 3;
  const door = createRoomDoor(T, room, { centre: [-4.9, .02, 4], width, height: 2.1 * 5.6 / 3 });
  const parts = [new T.Mesh(new T.BoxGeometry(.04, 2.1, .8)), new T.Mesh(new T.BoxGeometry(.025, .09, .025))];
  for (const [i, part] of parts.entries()) {
    part.position.set(-4.9 / (5.6 / 3), (1 + i * .2) / (5.6 / 3), (4 + i * .5) / (5.6 / 3));
    native.add(part);
  }
  scene.updateMatrixWorld(true);
  const resting = parts.map(part => part.matrixWorld.clone());
  mountRoomDoorLeaves(door, parts);
  parts.forEach((part, i) => assert.ok(part.matrixWorld.elements.every((v, j) => Math.abs(v - resting[i].elements[j]) < 1e-9)));
  const pivot = door.hinge.getWorldPosition(new T.Vector3());
  assert.ok(pivot.distanceTo(new T.Vector3(-4.9, .02, 4 - width / 2)) < 1e-9);
  door.hinge.rotation.y = -.58;
  scene.updateMatrixWorld(true);
  assert.ok(parts[1].getWorldPosition(new T.Vector3()).distanceTo(new T.Vector3().setFromMatrixPosition(resting[1])) > .2);
  assert.ok(door.hinge.getWorldPosition(new T.Vector3()).distanceTo(pivot) < 1e-9);
});

test("a delayed native export mounts correctly while the door is already opening", () => {
  const parent = new T.Group(), native = new T.Group(); parent.add(native);
  const door = createRoomDoor(T, parent, { centre: [-4.9, .02, 4], width: 1.4933333333333332, height: 3.92 });
  door.hinge.rotation.y = -.3;
  const leaf = new T.Mesh(new T.BoxGeometry(.08, 3.92, 1.4933333333333332));
  leaf.position.set(-4.9, 1.98, 4); native.add(leaf); parent.updateMatrixWorld(true);
  mountRoomDoorLeaves(door, [leaf]);
  assert.equal(door.hinge.rotation.y, -.3);
  door.hinge.rotation.y = 0; parent.updateMatrixWorld(true);
  assert.ok(leaf.getWorldPosition(new T.Vector3()).distanceTo(new T.Vector3(-4.9, 1.98, 4)) < 1e-9);
});

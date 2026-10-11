// Keep the authored leaf's resting world transform when moving its separate
// solid components from the Blender shell into the live door hinge.
export function createRoomDoor(T, parent, { centre, width, height }) {
  const frame = new T.Group(), hinge = new T.Group();
  frame.position.set(...centre);
  frame.rotation.y = -Math.PI / 2;
  parent.add(frame);
  hinge.position.x = -width / 2;
  hinge.userData.animated = true;
  frame.add(hinge);
  return { frame, hinge, width, height };
}

export function mountRoomDoorLeaves(door, leaves) {
  const opening = door.hinge.rotation.y;
  door.hinge.rotation.y = 0;
  door.frame.updateWorldMatrix(true, true);
  for (const leaf of leaves) door.hinge.attach(leaf);
  door.hinge.rotation.y = opening;
  door.frame.updateWorldMatrix(true, true);
}

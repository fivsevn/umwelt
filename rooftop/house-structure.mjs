// Saved arrangements stay in terrace-local coordinates. Both terraces belong
// to this house; only the current terrace is mounted in the visible scene.
export const HOUSE = Object.freeze({
  id: "dongdong-home",
  roof: { x: -10, z: 4, width: 16, depth: 20, eave: 0.15, ridge: 2.65 },
  terraces: {
    north: { rotation: 0, origin: [0, 0] },
    south: { rotation: -Math.PI / 2, origin: [0, 28] },
  },
});
export function housePoint(scene, x, z) {
  return scene === "south" ? [-z, 28 + x] : [x, z];
}
export function terracePoint(scene, x, z) {
  return scene === "south" ? [z - 28, -x] : [x, z];
}

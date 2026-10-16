// A DOM hit target must belong to a genuinely visible door. Perspective
// projection alone also produces finite coordinates for doors behind the eye.
export function projectVisibleDoor(T, { camera, frame, width, height, doorHeight = 2.7, lens, displayUnwarp, isOccluded }) {
  if (!(width > 0 && height > 0)) return null;
  frame.updateWorldMatrix(true, false);
  camera.updateMatrixWorld();
  const project = (x, y) => {
    const world = frame.localToWorld(new T.Vector3(x, y, 0)),
      cameraPoint = world.clone().applyMatrix4(camera.matrixWorldInverse);
    if (cameraPoint.z >= -camera.near || cameraPoint.z <= -camera.far) return null;
    const ndc = world.clone().project(camera);
    if (![ndc.x, ndc.y, ndc.z].every(Number.isFinite) || ndc.z < -1 || ndc.z > 1) return null;
    if (lens?.unwarp) {
      const xy = lens.unwarp([ndc.x, ndc.y], width / height);
      ndc.x = xy[0]; ndc.y = xy[1];
    }
    if (displayUnwarp) {
      const xy = displayUnwarp([ndc.x, ndc.y]);
      ndc.x = xy[0]; ndc.y = xy[1];
    }
    return { world, ndc, x: (ndc.x + 1) * width / 2, y: (1 - ndc.y) * height / 2 };
  };
  const centre = project(0, doorHeight / 2);
  if (!centre || Math.abs(centre.ndc.x) > 1 || Math.abs(centre.ndc.y) > 1) return null;
  if (lens && Math.hypot(centre.x - width / 2, centre.y - height / 2) > lens.radius) return null;
  if (isOccluded?.(centre.world)) return null;
  const corners = [-.65, .65].flatMap(x => [.05, doorHeight].map(y => project(x, y)));
  // Never construct a giant hit box from a rectangle crossing the near plane.
  if (corners.some(point => !point)) return null;
  const xs = corners.map(p => p.x), ys = corners.map(p => p.y),
    projectedWidth = Math.max(...xs) - Math.min(...xs), projectedHeight = Math.max(...ys) - Math.min(...ys),
    boxWidth = Math.min(width * .24, 160, Math.max(44, projectedWidth)),
    boxHeight = Math.min(height * .38, 240, Math.max(44, projectedHeight));
  let left = Math.max(0, centre.x - boxWidth / 2), right = Math.min(width, centre.x + boxWidth / 2),
    top = Math.max(0, centre.y - boxHeight / 2), bottom = Math.min(height, centre.y + boxHeight / 2);
  // An axis-aligned button fits entirely inside the round optical window.
  if (lens) {
    const cx = centre.x - width / 2, cy = centre.y - height / 2,
      halfWidth = Math.min(boxWidth / 2, Math.max(0, Math.sqrt(Math.max(0, lens.radius ** 2 - (Math.abs(cy) + boxHeight / 2) ** 2)) - Math.abs(cx)));
    if (halfWidth < 4) return null;
    left = Math.max(left, centre.x - halfWidth); right = Math.min(right, centre.x + halfWidth);
  }
  if (right - left < 8 || bottom - top < 8) return null;
  return { left, top, width: right - left, height: bottom - top };
}

import { RAINCOAT_MESHES } from './raincoat-meshes.mjs';
// Independent garment layers follow existing joints; the saved wardrobe is untouched.
export function attachRaincoat(api, actor, kind, lookId) {
  const joints = kind === 'person'
    ? {body: actor.body, head: actor.head, arm0: actor.arms[0], arm1: actor.arms[1]}
    : {pig: actor.pig, pigFace: actor.pigFace};
  const groups = new Map();
  for (const part of RAINCOAT_MESHES.filter(part => part.actor === kind)) {
    if (!groups.has(part.joint)) {
      const group = api.group(joints[part.joint]);
      group.name = `${kind}-raincoat-${part.joint}`;
      group.userData.animated = true;
      group.userData.weathered = false;
      group.visible = false;
      // The authored kosode sleeve hangs below the hand; the outer sleeve
      // needs its full width and length while retaining the same shoulder.
      if (kind === 'person' && lookId === 'kosode' && part.joint.startsWith('arm'))
        group.scale.set(1.25, 1.25, 1);
      groups.set(part.joint, group);
    }
    api.solid(groups.get(part.joint), part.vertices, part.faces, '#d5edf0', 'raincoat-' + part.kind);
  }
  return [...groups.values()];
}

import { GLTFLoader } from "./vendor/GLTFLoader.js";

const authored = new Map();
let loading;

export function loadRetroAssets() {
  if (!loading) loading = new GLTFLoader().loadAsync(
    new URL("../assets/retro/terrace-furniture.glb", import.meta.url).href,
  ).then(({ scene }) => {
    for (const root of scene.children) {
      root.position.set(0, 0, 0);
      root.updateMatrix();
      authored.set(root.name, root);
    }
    return authored.size;
  });
  return loading;
}

// Cloned geometry belongs to the placed instance. Removing a catalogue portrait
// or a supporter cannot dispose buffers belonging to another live object.
export function attachRetroAsset(parent, type, mat) {
  const source = authored.get(type);
  if (!source) return false;
  const instance = source.clone(true);
  instance.traverse((node) => {
    if (!node.isMesh) return;
    const kind = node.material.name;
    node.geometry = node.geometry.clone();
    node.material = mat("#ffffff", kind);
    node.castShadow = node.receiveShadow = true;
  });
  parent.add(instance);
  parent.userData.authoredAsset = type;
  return true;
}

export function retroAssetCount() { return authored.size; }

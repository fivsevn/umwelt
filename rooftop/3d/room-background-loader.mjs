import { GLTFLoader } from "./vendor/gltf/GLTFLoader.js";
import { ITEM_METRES_TO_UNITS } from "../item-catalog.mjs";
import { canonicalAtlasPlugin } from "./native-model-loader.mjs";

const resource = path => {
  const url = new URL(path, import.meta.url), version = new URL(import.meta.url).searchParams.get("v");
  if (version) url.searchParams.set("v", version);
  return url.href;
};

// The complete room is exported from its editable Blender source. Its atlas
// is the independently reopened Pixelorama source, with 16 texels per metre.
export function loadRoomBackground(T, parent, { onReady, onError } = {}) {
  const root = new T.Group();
  root.name = "Blender room background";
  root.scale.setScalar(ITEM_METRES_TO_UNITS);
  parent.add(root);
  const lamps = [];
  const state = { loaded: false, source: "Blender", textureAuthor: "Pixelorama", texelsPerMetre: 16, error: null };
  const atlasReady = new T.TextureLoader().loadAsync(resource("../assets/room/room-background-atlas.png")).then(atlas => {
    atlas.colorSpace = T.SRGBColorSpace; atlas.flipY = false;
    atlas.minFilter = atlas.magFilter = T.NearestFilter; atlas.generateMipmaps = false;
    return atlas;
  });
  const ready = Promise.all([
    new GLTFLoader().register(canonicalAtlasPlugin(atlasReady)).loadAsync(resource("../assets/room/room-background.glb")),
    atlasReady,
  ]).then(([gltf, atlas]) => {
    const replacements = new Map(), oldMaterials = new Set(), oldTextures = new Set(), leaves = [];
    let meshes = 0, triangles = 0;
    gltf.scene.traverse(node => {
      if (!node.isMesh) return;
      meshes++;
      triangles += (node.geometry.index?.count || node.geometry.attributes.position.count) / 3;
      const role = String(node.userData.part_role || "");
      if (role.startsWith("room-door-leaf")) leaves.push(node);
      node.castShadow = true;
      node.receiveShadow = true;
      const material = old => {
        if (replacements.has(old)) return replacements.get(old);
        const next = new T.MeshLambertMaterial({
          map: old.transparent ? null : atlas, color: old.transparent ? old.color : 0xffffff, flatShading: true, side: old.side,
          transparent: old.transparent, opacity: old.opacity, alphaTest: old.alphaTest,
          depthWrite: !old.transparent,
        });
        if (old.emissive) next.emissive.copy(old.emissive);
        if (old.transparent) next.side = T.DoubleSide;
        if (node.userData.finish === "room-lamp-glow") {
          next.emissive.copy(old.color); lamps.push(next);
        }
        if (old.map && old.map !== atlas) oldTextures.add(old.map);
        oldMaterials.add(old); replacements.set(old, next);
        return next;
      };
      node.material = Array.isArray(node.material) ? node.material.map(material) : material(node.material);
      node.castShadow = !(Array.isArray(node.material) ? node.material.some(m => m.transparent) : node.material.transparent);
    });
    for (const old of oldTextures) { old.dispose(); old.image?.close?.(); }
    for (const old of oldMaterials) old.dispose();
    root.add(gltf.scene);
    root.updateWorldMatrix(true, true);
    if (!leaves.length) throw new Error("Room export is missing its movable door leaf");
    onReady?.({ root, leaves });
    Object.assign(state, { loaded: true, meshes, triangles, doorParts: leaves.length });
    return root;
  }).catch(error => {
    state.error = String(error.message || error);
    onError?.(error);
    console.error("Room background could not load", error);
    return null;
  });
  return {
    root, ready,
    update(atmosphere) { for (const material of lamps) material.emissiveIntensity = .08 + Math.max(0, atmosphere.night || 0) * .8; },
    get stats() { return { ...state }; },
  };
}

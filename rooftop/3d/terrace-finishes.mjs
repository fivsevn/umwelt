import { GLTFLoader } from './vendor/gltf/GLTFLoader.js';
import { mergeGeometries } from './vendor/gltf/BufferGeometryUtils.js';

// Independent native finish model confined to the two protagonist terraces.
// Keep the original street and all neighboring buildings in architectural-shell.
export function loadTerraceFinishes(T, parent, enabled = true) {
  const root = new T.Group(); root.name = 'Two protagonist terrace finishes';
  root.visible = enabled; parent.add(root);
  const wet = { value: 0 };
  let state = { loaded: false, enabled, source: 'Blender + Pixelorama', error: null };
  const ready = new GLTFLoader().loadAsync(new URL('../assets/terraces/terraces.glb', import.meta.url).href).then(gltf => {
    const geometries = [], oldMaterials = new Set(); let map;
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse(mesh => {
      if (!mesh.isMesh) return;
      map ||= mesh.material.map; oldMaterials.add(mesh.material);
      const geometry = mesh.geometry.clone(); geometry.applyMatrix4(mesh.matrixWorld);
      if (geometry.index) { geometries.push(geometry.toNonIndexed()); geometry.dispose(); }
      else geometries.push(geometry);
      mesh.geometry.dispose();
    });
    map.magFilter = map.minFilter = T.NearestFilter; map.generateMipmaps = false;
    map.colorSpace = T.SRGBColorSpace;
    const material = new T.MeshLambertMaterial({ map, flatShading: true });
    material.onBeforeCompile = shader => {
      shader.uniforms.detailWet = wet;
      shader.vertexShader = 'varying vec3 detailNormal;\n' + shader.vertexShader;
      shader.fragmentShader = 'varying vec3 detailNormal; uniform float detailWet;\n' + shader.fragmentShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ndetailNormal = normalize(normal / vec3(.2707537402, .5357142857, .4638375015));');
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb *= 1. - detailWet * .10;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        vec3 n = normalize(detailNormal);
        reflectedLight.indirectDiffuse *= n.y > .7 ? 1. : n.y < -.7 ? .52 : abs(n.x) > abs(n.z) ? .66 : .82;`);
    };
    material.customProgramCacheKey = () => 'terrace-finishes-v1';
    const geometry = mergeGeometries(geometries, false);
    const mesh = new T.Mesh(geometry, material); mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh); geometries.forEach(g => g.dispose()); oldMaterials.forEach(m => m.dispose());
    state = { ...state, loaded: true, triangles: geometry.getAttribute('position').count / 3, drawCalls: 1,
      scope: ['protagonist north terrace', 'protagonist south balcony'], texelsPerMetre: 16 };
    return root;
  }).catch(error => { state.error = error.message; console.error(error); throw error; });
  return { ready, setVisible(value) { root.visible = Boolean(value); state.enabled = root.visible; },
    update(a) { wet.value = a?.wetness ?? a?.rain ?? 0; }, get stats() { return { ...state }; } };
}

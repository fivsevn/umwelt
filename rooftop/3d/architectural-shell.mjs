import { BACKGROUND } from "../assets/background/empty-rooftop.mjs";
import { bakedFaceBounds, BAKED_GRID_FRAGMENT } from "./baked-pixel-grid.mjs";

// Geometry is exported from the editable Blender source. Nearby surfaces use
// the Pixelorama book; distant facades use an atlas baked from that same model.
export function loadArchitecturalShell(T, parent) {
  const tone = { value: new T.Color("#ffffff") },
    wet = { value: 0 },
    lamps = { value: 0 };
  let state = { loaded: false, source: "Blender", error: null };
  const measurable = [];
  const root = new T.Group();
  root.name = "Blender terrace environment";
  parent.add(root);
  const base = new URL("../assets/background/", import.meta.url),
    manifest = BACKGROUND,
    textureDefinitions = new Map();
  for (const entry of manifest.textures || []) {
    const definition = typeof entry === "string" ? { file: entry } : entry;
    textureDefinitions.set(definition.file, definition);
  }
  if (!textureDefinitions.has(manifest.texture))
    textureDefinitions.set(manifest.texture, { file: manifest.texture, sha256: manifest.textureSha256, width: 512, height: 512 });
  const requiredTextures = new Set([manifest.texture]);
  for (const part of manifest.parts) {
    if (part.texture) requiredTextures.add(part.texture);
    if (part.lampMask) requiredTextures.add(part.lampMask);
  }
  const binaryUrl = new URL(manifest.binary, base);
  binaryUrl.searchParams.set("v", manifest.sha256);
  let textureBytes = 0;
  const ready = Promise.all([
    fetch(binaryUrl).then(response => {
      if (!response.ok) throw Error("Environment mesh unavailable");
      return response.arrayBuffer();
    }),
    Promise.all([...requiredTextures].map(file => {
      const definition = textureDefinitions.get(file) || { file },
        url = new URL(file, base);
      if (definition.sha256) url.searchParams.set("v", definition.sha256);
      return new Promise((resolve, reject) => new T.TextureLoader().load(url.href, texture => {
        texture.minFilter = texture.magFilter = T.NearestFilter;
        texture.generateMipmaps = false;
        texture.flipY = false;
        // Masks carry values, while the authored book and baked facades carry
        // visible colour. Keep mask values out of the sRGB colour conversion.
        texture.colorSpace = [...manifest.parts].some(part => part.lampMask === file)
          ? T.NoColorSpace : T.SRGBColorSpace;
        textureBytes += definition.bytes || 0;
        resolve([file, texture]);
      }, undefined, reject));
    })),
  ]).then(([buffer, entries]) => {
    const textures = new Map(entries),
      metreScale = manifest.texelMetresPerUnit || [1, 1, 1],
      layers = {},
      layerSections = new Map(),
      bakedSampling = [];
    function geometry(offset, vertices) {
      const data = new Float32Array(buffer, offset, vertices * 8),
        geo = new T.BufferGeometry(),
        interleaved = new T.InterleavedBuffer(data, 8);
      geo.setAttribute("position", new T.InterleavedBufferAttribute(interleaved, 3, 0));
      geo.setAttribute("normal", new T.InterleavedBufferAttribute(interleaved, 3, 3));
      geo.setAttribute("uv", new T.InterleavedBufferAttribute(interleaved, 2, 6));
      geo.computeBoundingSphere();
      return geo;
    }
    const cube = geometry(manifest.cube.offset, manifest.cube.vertices);
    for (const part of manifest.parts) {
      const file = part.texture || manifest.texture,
        definition = textureDefinitions.get(file) || {},
        baked = part.style === "baked",
        // The nearby native albedo receives the actual moving sun and shadow
        // map. Distant paintings keep the illumination baked in Blender.
        material = baked
          ? new T.MeshBasicMaterial({ map: textures.get(file), color: "#ffffff" })
          : new T.MeshLambertMaterial({ map: textures.get(file), color: "#ffffff", flatShading: true }),
        layer = part.layer || (baked ? "far" : "near");
      if (baked) {
        material.onBeforeCompile = shader => {
          Object.assign(shader.uniforms, {
            shellTone: tone, shellWet: wet, shellLamps: lamps,
            shellMetres: { value: new T.Vector3(...metreScale) },
            shellTexelsPerMetre: { value: manifest.texelsPerMetre || 16 },
            shellBakedAtlas: { value: new T.Vector2(definition.width || 512, definition.height || 512) },
          });
          shader.vertexShader = "uniform vec3 shellMetres; uniform float shellTexelsPerMetre; attribute vec4 shellUvBounds; varying vec4 shellBakedBounds; varying vec2 shellBakedChart; varying vec3 shellBakedNormal;\n" + shader.vertexShader;
          shader.fragmentShader = "uniform vec3 shellTone; uniform float shellWet; uniform float shellLamps; uniform vec2 shellBakedAtlas; varying vec4 shellBakedBounds; varying vec2 shellBakedChart; varying vec3 shellBakedNormal;\n" + BAKED_GRID_FRAGMENT + shader.fragmentShader;
          shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
            #include <begin_vertex>
            vec3 shellPhysicalPosition = position * shellMetres;
            shellBakedNormal = normalize(normal / shellMetres);
            #ifdef USE_INSTANCING
            shellPhysicalPosition = (instanceMatrix * vec4(position, 1.)).xyz * shellMetres;
            mat3 axes = mat3(instanceMatrix);
            vec3 c0 = cross(axes[1], axes[2]), c1 = cross(axes[2], axes[0]), c2 = cross(axes[0], axes[1]);
            shellBakedNormal = normalize((mat3(c0, c1, c2) * normal / dot(axes[0], c0)) / shellMetres);
            #endif
            vec3 chartU = normalize(cross(abs(shellBakedNormal.y) > .98 ? vec3(0., 0., 1.) : vec3(0., 1., 0.), shellBakedNormal));
            vec3 chartV = normalize(cross(shellBakedNormal, chartU));
            shellBakedChart = vec2(dot(shellPhysicalPosition, chartU), dot(shellPhysicalPosition, chartV)) * shellTexelsPerMetre;
            shellBakedBounds = shellUvBounds;`);
          let orientation = "";
          if (part.shading === "orientation") {
            orientation = `
              vec3 n = normalize(shellBakedNormal);
              float faceShade = n.y > .7 ? 1. : n.y < -.7 ? .52 : abs(n.x) > abs(n.z) ? .66 : .82;
              diffuseColor.rgb *= faceShade;`;
          }
          let lights = "";
          if (part.lampMask) {
            shader.uniforms.shellLampMask = { value: textures.get(part.lampMask) };
            shader.fragmentShader = "uniform sampler2D shellLampMask;\n" + shader.fragmentShader;
            lights = `
              float windowMask = texture2D(shellLampMask, shellSampleUv).r;
              diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.61, .40, .19), windowMask * shellLamps * .66);`;
          }
          shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `
            vec2 shellSampleUv = shellBakedPixelUv(vMapUv);
            vec4 shellPigment = texture2D(map, shellSampleUv);
            // A snapped cell touching a transparent painted boundary may have
            // its centre outside the pigment. Keep this half-cell edge fringe
            // at the original UV; colour and lamp mask still share one sample.
            if (shellPigment.a < .99) {
              vec2 shellOriginalUv = vMapUv;
              if (shellBakedBounds.z > shellBakedBounds.x && shellBakedBounds.w > shellBakedBounds.y)
                shellOriginalUv = clamp(vMapUv, shellBakedBounds.xy + .5 / shellBakedAtlas, shellBakedBounds.zw - .5 / shellBakedAtlas);
              vec4 shellOriginalPigment = texture2D(map, shellOriginalUv);
              if (shellOriginalPigment.a >= .99) { shellSampleUv = shellOriginalUv; shellPigment = shellOriginalPigment; }
            }
            diffuseColor *= shellPigment;
            diffuseColor.rgb *= shellTone * (1. - shellWet * .10);
            ${orientation}
            ${lights}`);
        };
      } else {
        const [x, y, w, h] = part.rect;
        material.onBeforeCompile = shader => {
          Object.assign(shader.uniforms, {
            shellRect: { value: new T.Vector4(x, y, w, h) },
            shellTone: tone,
            shellWet: wet,
            shellLamps: lamps,
            shellMetres: { value: new T.Vector3(...metreScale) },
            shellTexelsPerMetre: { value: manifest.texelsPerMetre || 8 },
            shellAtlas: { value: new T.Vector2(definition.width || 512, definition.height || 512) },
            shellGlass: { value: part.field.includes("glass") ? 1 : 0 },
          });
          shader.vertexShader = "uniform vec3 shellMetres; uniform float shellTexelsPerMetre; varying vec2 shellChart; varying vec3 shellNormal; varying float shellLamp;\n" + shader.vertexShader;
          shader.fragmentShader = "uniform vec4 shellRect; uniform vec2 shellAtlas; uniform vec3 shellTone; uniform float shellWet; uniform float shellLamps; uniform float shellGlass; varying vec2 shellChart; varying vec3 shellNormal; varying float shellLamp;\n" + shader.fragmentShader;
          shader.fragmentShader = `
            float shellFaceLight(vec3 physicalNormal) {
              vec3 n = normalize(physicalNormal);
              return n.y > .7 ? 1. : n.y < -.7 ? .52 : abs(n.x) > abs(n.z) ? .66 : .82;
            }
          ` + shader.fragmentShader;
          // Shared box charts repeat in physical metres, after undoing the
          // established non-uniform game-unit transform. General collection
          // meshes retain their authored UV charts through every instance.
          const cubeChart = part.mode === "instances" ? `
            vec3 p = (instanceMatrix * vec4(position, 1.)).xyz * shellMetres;
            vec3 n = shellNormal;
            vec3 u = abs(n.y) > .98 ? vec3(1., 0., 0.) : normalize(cross(vec3(0., 1., 0.), n));
            vec3 v = abs(n.y) > .98 ? vec3(0., 0., 1.) : normalize(cross(n, u));
            shellChart = vec2(dot(p, u), dot(p, v)) * shellTexelsPerMetre;` : "";
          shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
            #include <begin_vertex>
            shellChart = uv; shellNormal = normalize(normal / shellMetres); shellLamp = .5;
            #ifdef USE_INSTANCING
            mat3 axes = mat3(instanceMatrix);
            vec3 c0 = cross(axes[1], axes[2]), c1 = cross(axes[2], axes[0]), c2 = cross(axes[0], axes[1]);
            shellNormal = normalize((mat3(c0, c1, c2) * normal / dot(axes[0], c0)) / shellMetres);
            ${cubeChart}
            shellLamp = fract(sin(instanceMatrix[3].x * 13.13 + instanceMatrix[3].y * 7.17 + instanceMatrix[3].z * .19) * 43758.5453);
            #endif`);
          shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `
            vec2 pixel = mod(floor(shellChart), shellRect.zw);
            vec2 sampleUv = (shellRect.xy + pixel + .5) / shellAtlas;
            diffuseColor *= texture2D(map, sampleUv);
            diffuseColor.rgb *= 1. - shellWet * .10;
            if (shellGlass > .5 && shellLamp < shellLamps * .72)
              diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.74, .52, .27), shellLamps * .8);`);
          shader.fragmentShader = shader.fragmentShader.replace("#include <emissivemap_fragment>", `
            #include <emissivemap_fragment>
            // Occupied windows stay warm in moonlight and rain shadow.
            if (shellGlass > .5 && shellLamp < shellLamps * .72)
              totalEmissiveRadiance += vec3(.36, .18, .055) * shellLamps;`);
          shader.fragmentShader = shader.fragmentShader.replace("#include <lights_fragment_end>", `
            #include <lights_fragment_end>
            // Four physical face directions tighten the ambient light only.
            // Sun shadows, painted colour and occupied window emission keep
            // their full weather/time range, including very dim night light.
            reflectedLight.indirectDiffuse *= shellFaceLight(shellNormal);`);
        };
      }
      material.customProgramCacheKey = () => `blender-environment-v6-physical-grid-${baked ? "baked" : part.mode}-${part.field}-${file}-${part.lampMask || ""}-${part.shading || ""}`;
      let mesh;
      if (part.mode === "instances") {
        mesh = new T.InstancedMesh(cube, material, part.count);
        const matrices = mesh.instanceMatrix.array;
        let next = part.directCount ?? part.count;
        matrices.set(new Float32Array(buffer, part.offset, next * 16));
        const world = new T.Matrix4(), local = new T.Matrix4(), combined = new T.Matrix4();
        for (const assembly of part.assemblies || []) {
          const parents = new Float32Array(buffer, assembly.worldOffset, assembly.worldCount * 16),
            sources = new Float32Array(buffer, assembly.sourceOffset, assembly.sourceCount * 16);
          for (let p = 0; p < assembly.worldCount; p++) {
            world.fromArray(parents, p * 16);
            for (let s = 0; s < assembly.sourceCount; s++) {
              local.fromArray(sources, s * 16);
              combined.multiplyMatrices(world, local).toArray(matrices, next++ * 16);
            }
          }
        }
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
      } else if (part.mode === "meshInstances") {
        mesh = new T.InstancedMesh(geometry(part.offset, part.vertices), material, part.count);
        mesh.instanceMatrix.array.set(new Float32Array(buffer, part.matricesOffset, part.count * 16));
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
      } else {
        mesh = new T.Mesh(geometry(part.offset, part.vertices), material);
      }
      if (baked) {
        if (mesh.geometry === cube) mesh.geometry = cube.clone();
        const data = mesh.geometry.getAttribute("position").data.array,
          atlasSize = [definition.width || 512, definition.height || 512],
          sampling = bakedFaceBounds(data, atlasSize);
        mesh.geometry.setAttribute("shellUvBounds", new T.BufferAttribute(sampling.bounds, 4));
        bakedSampling.push({
          field: part.field, renderTexelsPerMetre: manifest.texelsPerMetre || 16,
          originalUvDensity: "variable baked atlas charts; source UV unchanged",
          rectangularFaces: sampling.faces, unsupportedTriangles: sampling.unsupportedTriangles,
          derivedBoundsBytes: sampling.bounds.byteLength,
          paddingEdgeFallback: "original UV only when a snapped half-cell centre leaves opaque pigment",
          derivativeFallback: "original UV for grazing/degenerate chart derivatives",
        });
        if (sampling.unsupportedTriangles)
          console.warn("Baked pixel grid: unsupported atlas faces retain original UV sampling:", part.field, sampling.unsupportedTriangles);
      }
      mesh.name = part.field;
      mesh.castShadow = mesh.receiveShadow = !baked;
      root.add(mesh);
      if (layer !== "far") measurable.push(mesh);
      const layerStats = layers[layer] ||= { parts: 0, triangles: 0, objects: 0, bytes: 0 };
      if (!layerSections.has(layer)) layerSections.set(layer, new Set());
      const sections = layerSections.get(layer),
        account = (offset, size) => {
          const key = offset + ":" + size;
          if (!sections.has(key)) { sections.add(key); layerStats.bytes += size; }
        };
      if (part.mode === "instances") {
        account(manifest.cube.offset, manifest.cube.vertices * 32);
        account(part.offset, (part.directCount ?? part.count) * 64);
        for (const assembly of part.assemblies || []) {
          account(assembly.sourceOffset, assembly.sourceCount * 64);
          account(assembly.worldOffset, assembly.worldCount * 64);
        }
      } else {
        account(part.offset, part.vertices * 32);
        if (part.mode === "meshInstances") account(part.matricesOffset, part.count * 64);
      }
      layerStats.parts++;
      layerStats.triangles += part.mode === "instances" ? manifest.cube.vertices / 3 * part.count
        : part.vertices / 3 * (part.mode === "meshInstances" ? part.count : 1);
      layerStats.objects += part.count || 1;
    }
    state = {
      loaded: true,
      source: "Blender",
      textureAuthor: "Pixelorama",
      bytes: buffer.byteLength,
      textureBytes,
      payloadBytes: buffer.byteLength + textureBytes,
      triangles: manifest.triangles,
      objects: manifest.objects,
      row: manifest.row,
      sixthFloor: manifest.sixthFloor,
      drawCalls: manifest.parts.length,
      layers,
      texelMetresPerUnit: [...metreScale],
      texelsPerMetre: manifest.texelsPerMetre || 8,
      bakedSampling,
      atlases: [...requiredTextures].map(file => {
        const item = textureDefinitions.get(file) || {};
        return { file, width: item.width || 512, height: item.height || 512, bytes: item.bytes || null };
      }),
    };
  }).catch(error => {
    state.error = error.message;
    console.error("Blender environment:", error);
    throw error;
  });
  ready.catch(() => {});
  return {
    ready,
    measure(raycaster) {
      if (!state.loaded) return null;
      root.updateWorldMatrix(true, true);
      const hit = raycaster.intersectObjects(measurable, false)[0];
      return hit ? { point: hit.point, distance: hit.distance } : null;
    },
    update(a) {
      const night = Math.max(0, Math.min(1, a.night || 0));
      tone.value.set("#ffffff").lerp(new T.Color("#8ca0b6"), night * .58).multiplyScalar(1 - night * .33);
      wet.value = a.wetness || 0;
      lamps.value = a.lamps || 0;
    },
    get stats() { return { ...state }; },
  };
}

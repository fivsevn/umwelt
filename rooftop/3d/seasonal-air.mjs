import { SEASONS, seasonalParticle, seasonalStrength } from "../seasons.mjs";
import { BACKGROUND } from "../assets/background/empty-rooftop.mjs";
import { resolvePixelGrid, pixelGridBufferSize } from "./pixel-grid.mjs";
import { createVisibleAirField } from "./visible-air.mjs";

export const SPRING_CATKIN_COUNT = 16;
const wrap = value => ((value % 1) + 1) % 1;
const seedHash = seed => {
  let n = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};

// Loose, individual seeds share a prevailing breeze, not a common orbit. Each
// path integrates its own slow gust, so occasional pauses stay continuous.
export function springCatkin(i, time, wind = .32, reduced = false) {
  const seed = i * 137 + 83, a = seedHash(seed), b = seedHash(seed + 31),
    c = seedHash(seed + 71), d = seedHash(seed + 113), phase = c * Math.PI * 2,
    secondPhase = d * Math.PI * 2,
    t = Math.max(0, Number.isFinite(time) ? time : 0) * (reduced ? .62 : 1),
    breeze = Math.max(0, Math.min(3.8, Number.isFinite(wind) ? wind : .32)),
    frequency = .11 + d * .11,
    speed = .005 + a * .004 + breeze * (.006 + b * .005),
    drift = speed * (.52 * t + .48 * (Math.cos(phase) - Math.cos(t * frequency + phase)) / frequency),
    xStart = .06 + ((i * 7 % SPRING_CATKIN_COUNT) + .15 + a * .7) / SPRING_CATKIN_COUNT * .88,
    zStart = .06 + ((i * 11 % SPRING_CATKIN_COUNT) + .15 + c * .7) / SPRING_CATKIN_COUNT * .88,
    texels = BACKGROUND.texelsPerMetre || 16;
  return {
    x: wrap(xStart + drift + Math.sin(t * .073 + secondPhase) * .002),
    y: .18 + b * .43 + Math.sin(t * (.1 + a * .08) + phase) * (.009 + c * .006) + Math.sin(t * .21 + secondPhase) * .003,
    z: wrap(zStart + drift * (.05 + (d - .5) * .3) + Math.sin(t * (.065 + c * .04) + secondPhase) * (.003 + d * .002)),
    angle: phase + Math.sin(t * (.08 + d * .05) + secondPhase) * .3,
    // Every seed occupies exactly one native physical texel, with no larger tuft.
    size: 1 / texels,
    kind: 0,
    color: ["#eee9d6", "#e5e0cb", "#f1ecda"][i % 3],
    opacity: (.68 + seedHash(i * 71 + 43) * .19) * (.92 + Math.sin(t * .09 + secondPhase) * .08),
  };
}

// The trajectory lives in world axes around a stable world-cell identity. Camera
// movement chooses which identities need drawing; it never carries a seed along.
export function seasonalWorldSample(season, seed, anchor, time, wind = .32, reduced = false, name = "north") {
  const p = season === "spring" ? springCatkin(seed, time, wind, reduced) : seasonalParticle(season, seed, time, wind, reduced),
    spanX = name === "south" ? 12 : 27, spanZ = name === "south" ? 24 : 25,
    height = season === "spring" ? 5.5 : season === "summer" ? 10 : 12,
    edge = (value, width) => Math.max(0, Math.min(1, value / width, (1 - value) / width)),
    // Falling paths fade before the floor-to-sky reset. Catkins wrap only
    // horizontally; insects orbit continuously without any reset.
    cycleOpacity = season === "summer" ? 1 : edge(p.x, .07) * edge(p.z, .05) * (season === "spring" ? 1 : edge(p.y, .07));
  return {
    ...p,
    position: [anchor[0] + (p.x - .5) * spanX,
      anchor[1] + (p.y - (season === "spring" ? .4 : season === "summer" ? .16 : .5)) * height,
      anchor[2] + (p.z - .5) * spanZ],
    cycleOpacity,
  };
}

function uploadActive(geometry, count, keys) {
  for (const key of keys) {
    const attribute = geometry.attributes[key];
    attribute.clearUpdateRanges();
    attribute.addUpdateRange(0, count * attribute.itemSize);
    attribute.needsUpdate = true;
  }
}

// Four cached, tiny point buffers. Pixel silhouettes are shader code, never
// image textures. The existing scene depth hides particles behind walls/objects.
export function createSeasonalAir(T, scene, renderer) {
  const viewport = new T.Vector2(), color = new T.Color();
  const groups = SEASONS.map(s => {
    const count = s.id === "spring" ? SPRING_CATKIN_COUNT : s.count,
      positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count), kinds = new Float32Array(count), angles = new Float32Array(count), veils = new Float32Array(count);
    const geometry = new T.BufferGeometry();
    for (const [key, data, size] of [["position",positions,3],["pigment",colors,3],["diameter",sizes,1],["kind",kinds,1],["angle",angles,1],["veil",veils,1]]) {
      geometry.setAttribute(key, new T.BufferAttribute(data, size).setUsage(T.DynamicDrawUsage));
    }
    for (let i = 0; i < count; i++) {
      const p = s.id === "spring" ? springCatkin(i, 0) : seasonalParticle(s.id, i, 0);
      color.set(p.color); color.toArray(colors, i * 3);
      sizes[i] = p.size; kinds[i] = p.kind;
      veils[i] = p.opacity ?? 1;
    }
    const uniforms = {
      strength: { value: 0 }, viewportHeight: { value: 800 },
      skyInk: { value: new T.Color("#ffffff") },
      sunInk: { value: new T.Color("#ffffff") },
      sunlight: { value: 0 }, brightness: { value: 1 },
      physicalScale: { value: new T.Vector3(...(BACKGROUND.texelMetresPerUnit || [1, 1, 1])) },
      texelsPerMetre: { value: BACKGROUND.texelsPerMetre || 16 },
      catkinProjectionFactor: { value: .5 },
      catkinAlpha: { value: .24 },
    };
    const material = new T.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false,
      vertexShader: `attribute vec3 pigment; attribute float diameter; attribute float kind; attribute float angle; attribute float veil;
        uniform float viewportHeight; uniform vec3 physicalScale; uniform float texelsPerMetre; uniform float catkinProjectionFactor;
        varying vec3 ink; varying float shape; varying float turn; varying float translucency; varying float grid;
        void main(){ vec4 eye=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*eye;
        float scale=projectionMatrix[3][3]>.5?.5:1.0/max(1.0,-eye.z);
        vec3 cameraUp=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);
        float worldDiameter=kind<.5?diameter/max(.001,length(cameraUp*physicalScale)):diameter;
        if(kind<.5){
          // NDC covers two units across the viewport in both camera modes.
          float projectionScale=projectionMatrix[3][3]>.5?catkinProjectionFactor:catkinProjectionFactor/max(.001,-eye.z);
          gl_PointSize=max(1.0,worldDiameter*viewportHeight*projectionMatrix[1][1]*projectionScale);
        }else gl_PointSize=clamp(worldDiameter*viewportHeight*projectionMatrix[1][1]*scale,1.0,16.0);
        ink=pigment;shape=kind;turn=angle;translucency=veil;grid=kind<.5?diameter*texelsPerMetre:7.0; }`,
      fragmentShader: `uniform float strength; uniform vec3 skyInk; uniform vec3 sunInk; uniform float sunlight; uniform float brightness; uniform float catkinAlpha;
        varying vec3 ink; varying float shape; varying float turn; varying float translucency; varying float grid;
        void main(){ vec2 q=gl_PointCoord-.5; float c=cos(turn),s=sin(turn);
        if(shape>=.5)q=mat2(c,-s,s,c)*q;
        vec2 p=floor((q+.5)*grid)-floor(grid*.5); vec2 a=abs(p); bool mark;
        if(shape<.5) mark=true;
        else if(shape<1.5) mark=(a.x<1.0&&a.y<=1.0)||(a.x<=2.0&&a.y<1.0);
        else if(shape<2.5) mark=a.x+a.y*.62<2.6;
        else if(shape<3.5) mark=(a.x<=1.0&&a.y<=2.0)||(a.y<=1.0&&a.x<=2.0);
        else mark=a.x+a.y<3.3;
        if(!mark)discard;
        // The same flower or leaf can turn into and away from the sun. Its
        // local pigment remains readable under cool shade and warm low light.
        float exposure=(.5+.5*cos(turn+1.3))*sunlight;
        vec3 col=ink*mix(skyInk,sunInk,exposure)*brightness;
        if(shape>1.5&&shape<2.5&&a.x<1.0)col*=.72;
        gl_FragColor=vec4(col,strength*(shape<.5?catkinAlpha:shape<1.5?.8:.84)*translucency);
        #include <colorspace_fragment>
        }`,
    });
    const points = new T.Points(geometry, material);
    points.frustumCulled = false; points.visible = false; scene.add(points);
    const field = createVisibleAirField(T, {
      capacity: count, seed: SEASONS.indexOf(s) * 977 + 83,
      cellSize: s.id === "spring" ? 10 : s.id === "summer" ? 4 : 8,
      nearDistance: 2,
      // Small insects belong beside roofs and plants, rather than being
      // duplicated high in the open sky of a distant camera.
      ...(s.id === "summer" ? { boundsY: [-2, 3] } : {}),
    });
    return {...s, count, points, geometry, uniforms, positions, colors, sizes, kinds, angles, veils, field,
      identities: Array(count).fill(null)};
  });
  let stats = {};
  return {
    points: groups.map(g => g.points),
    update(name, state, time, reduced, mood = {}, camera, cameraOptions = {}) {
      renderer.getDrawingBufferSize(viewport);
      const grid = resolvePixelGrid(Number(renderer.domElement?.dataset?.pixelRatio) || 1),
        sourceHeight = pixelGridBufferSize(viewport.x, viewport.y, grid).source[1];
      let count = 0; const effects = [];
      for (const g of groups) {
        const strength = name === "room" ? 0 : seasonalStrength(state, g.id);
        g.points.visible = strength > .01;
        if (!g.points.visible) {
          g.geometry.setDrawRange(0, 0);
          continue;
        }
        g.uniforms.strength.value = strength;
        g.uniforms.viewportHeight.value = sourceHeight;
        g.uniforms.skyInk.value.set(state.ambientColor || "#d3e3ec").lerp(color.set("#ffffff"), .35);
        g.uniforms.sunInk.value.set(state.sunColor || "#fff5df").lerp(color.set("#ffffff"), .2);
        g.uniforms.sunlight.value = Math.min(1, (state.direct || 0) / 1.42);
        g.uniforms.brightness.value = .65 + Math.min(.35, (state.ambient || .5) * .35) - (state.night || 0) * .23;
        const metres = BACKGROUND.texelMetresPerUnit || [1, 1, 1];
        g.uniforms.physicalScale.value.set(name === "south" ? metres[2] : metres[0], metres[1], name === "south" ? metres[0] : metres[2]);
        if (camera) {
          const distance = cameraOptions.targetDistance ?? Math.hypot(camera.position.x, camera.position.y - 1, camera.position.z),
            maxDistance = Math.min(320, Math.max(32, distance + 24)),
            halfX = name === "south" ? 6 : 13.5, halfZ = name === "south" ? 12 : 12.5;
          const entries = g.field.update(camera, time, {
            maxDistance,
            ndcEllipse: cameraOptions.ndcEllipse,
            ...(g.id === "summer" ? { bounds: [-halfX - halfX, -2, -halfZ - halfZ, halfX + halfX, 3, halfZ + halfZ] } : {}),
            sample(entry, at) {
              const p = seasonalWorldSample(g.id, entry.seed, entry.anchor, at, state.wind, reduced, name);
              if (g.id === "summer") {
                const [x, y, z] = p.position, halfX = name === "south" ? 6 : 13.5, halfZ = name === "south" ? 12 : 12.5;
                if (Math.abs(x) > halfX || Math.abs(z) > halfZ || y < .18 || y > 3)
                  return null;
                p.cycleOpacity *= Math.max(0, Math.min(1, (halfX - Math.abs(x)) / 1.5, (halfZ - Math.abs(z)) / 1.5, (y - .18) / .25, (3 - y) / .25));
              }
              return p;
            },
          });
          let active = 0, pigmentChanged = false;
          for (const entry of entries) {
            const p = entry.sample, j = active * 3;
            if (!p || !entry.position || entry.opacity <= 0) continue;
            g.positions.set(entry.position, j);
            if (g.identities[active] !== entry.id) {
              color.set(p.color).toArray(g.colors, j);
              g.sizes[active] = p.size;
              g.kinds[active] = p.kind;
              g.identities[active] = entry.id;
              pigmentChanged = true;
            }
            g.angles[active] = p.angle;
            g.veils[active] = (p.opacity ?? 1) * p.cycleOpacity * entry.opacity;
            active++;
          }
          g.geometry.setDrawRange(0, active);
          g.points.visible = active > 0;
          if (active) uploadActive(g.geometry, active, ["position", "angle", "veil", ...(pigmentChanged ? ["pigment", "diameter", "kind"] : [])]);
          count += active;
          effects.push({season: g.id, effect: g.effect, count: active, budget: g.count,
            strength, brightness: g.uniforms.brightness.value, field: g.field.stats,
            sample: entries.filter(entry => entry.opacity > 0).slice(0, 3).map(entry => ({
              id: entry.id, seed: entry.seed, anchor: [...entry.anchor], position: [...entry.position], fade: entry.fade, opacity: entry.opacity,
            }))});
          continue;
        }
        // Compatibility for the non-camera test/fallback caller. The actual 3D
        // renderer supplies its current camera and uses the world field above.
        // South balcony is narrower; particles remain close to its actual roof.
        const spanX = name === "south" ? 12 : 27, spanZ = name === "south" ? 24 : 25;
        g.identities.fill(null);
        for (let i = 0; i < g.count; i++) {
          const p = g.id === "spring" ? springCatkin(i, time, state.wind, reduced) : seasonalParticle(g.id, i, time, state.wind, reduced), j = i * 3;
          g.positions[j] = (p.x - .5) * spanX;
          g.positions[j + 1] = .18 + p.y * (g.id === "spring" ? 5.5 : g.id === "summer" ? 10 : 12);
          g.positions[j + 2] = (p.z - .5) * spanZ;
          color.set(p.color).toArray(g.colors, j);
          g.sizes[i] = p.size;
          g.kinds[i] = p.kind;
          g.angles[i] = p.angle;
          g.veils[i] = g.id === "spring" ? p.opacity * Math.min(1, p.x / .07, (1 - p.x) / .07, p.z / .05, (1 - p.z) / .05) : 1;
        }
        uploadActive(g.geometry, g.count, ["position", "pigment", "diameter", "kind", "angle", "veil"]);
        g.geometry.setDrawRange(0, g.count);
        count += g.count; effects.push({season:g.id, effect:g.effect, count:g.count, strength, brightness:g.uniforms.brightness.value});
      }
      stats = { season: state.season, count, effects, spatial: Boolean(camera), afterRain:mood.afterRain || 0,
        sample: groups.filter(g=>g.points.visible).map(g=>Array.from(g.positions.slice(0, Math.min(2, g.geometry.drawRange.count) * 3))) };
    },
    get stats() { return stats; },
  };
}

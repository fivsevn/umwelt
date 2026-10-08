import { createSeasonalAir } from "./seasonal-air.mjs";
import {
  lightPosition,
  weatherMotion,
  lightningPulse,
} from "../atmosphere.mjs";
import { rainShape, rainStrike, rainHash } from "../precipitation.mjs";
import { SCENES, inside } from "../scene.mjs";

// One cached weather system per renderer. Changing a sky never rebuilds models.
export function createAtmosphere(
  T,
  scene,
  renderer,
  { coords, hemi, sun, materialCache, windowMats, software = false },
) {
  const moon = new T.DirectionalLight("#adc4e7", 0);
  moon.position.set(-16, 36, 14);
  scene.add(moon);
  const bounce = new T.DirectionalLight("#bdcddd", 0.2);
  bounce.position.set(16, 10, 24);
  scene.add(bounce);
  const porch = new T.PointLight("#ffc991", 0, 8, 2);
  const roomLamp = new T.SpotLight("#ffd5a6", 0, 14, 1.05, 0.5, 2);
  roomLamp.target.position.set(-1.2, 0.2, 0.8);
  roomLamp.castShadow = true;
  sun.castShadow = true;
  sun.shadow.autoUpdate = false;
  roomLamp.shadow.autoUpdate = false;
  roomLamp.shadow.mapSize.set(software ? 256 : 512, software ? 256 : 512);
  roomLamp.shadow.bias = -0.001;
  scene.add(porch, roomLamp, roomLamp.target);
  const skyUniforms = {
    zenith: { value: new T.Color() },
    horizon: { value: new T.Color() },
    flash: { value: 0 },
  };
  const sky = new T.Mesh(
    new T.SphereGeometry(210, 24, 12),
    new T.ShaderMaterial({
      uniforms: skyUniforms,
      side: T.BackSide,
      depthWrite: false,
      vertexShader:
        "varying vec3 direction; void main(){direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader:
        "varying vec3 direction; uniform vec3 zenith; uniform vec3 horizon; uniform float flash; void main(){float height=clamp(normalize(direction).y*.9+.12,0.0,1.0); height=floor(height*32.0)/32.0; vec3 col=mix(horizon,zenith,smoothstep(0.0,.82,height)); gl_FragColor=vec4(mix(col,vec3(.79,.85,.94),flash*.38),1.0);\n#include <colorspace_fragment>\n }",
    }),
  );
  sky.renderOrder = -10;
  scene.add(sky);
  const boltMaterial = new T.LineBasicMaterial({
    color: "#d9e6fa",
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const bolt = new T.Line(
    new T.BufferGeometry().setFromPoints([
      new T.Vector3(-24, 42, -58),
      new T.Vector3(-21, 35, -58),
      new T.Vector3(-25, 32, -58),
      new T.Vector3(-18, 25, -58),
      new T.Vector3(-20, 23, -58),
      new T.Vector3(-14, 17, -58),
    ]),
    boltMaterial,
  );
  scene.add(bolt);
  const capacity = 840,
    positions = new Float32Array(capacity * 6);
  const rainGeometry = new T.BufferGeometry().setAttribute(
    "position",
    new T.BufferAttribute(positions, 3),
  );
  const rainMaterial = new T.LineBasicMaterial({
    color: "#c0d0dd",
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const rain = new T.LineSegments(rainGeometry, rainMaterial);
  rain.frustumCulled = false;
  scene.add(rain);
  const floors = {};
  function floorShape(name) {
    const shape = new T.Shape();
    SCENES[name].points.forEach(([x, y], i) => {
      const [xx, zz] = coords(name, x, y);
      i ? shape.lineTo(xx, -zz) : shape.moveTo(xx, -zz);
    });
    shape.closePath();
    return new T.ShapeGeometry(shape);
  }
  for (const name of ["north", "south"]) {
    const root = new T.Group();
    scene.add(root);
    const wetUniforms = {
      snow: { value: 0 },
      wet: { value: 0 },
      rain: { value: 0 },
      time: { value: 0 },
      tint: { value: new T.Color("#a6b5be") },
    };
    const wet = new T.Mesh(
      floorShape(name),
      new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: wetUniforms,
        vertexShader:
          "varying vec2 point; void main(){point=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
        fragmentShader: `varying vec2 point; uniform float snow; uniform float wet; uniform float rain; uniform float time; uniform vec3 tint;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        void main(){vec2 cell=floor(point*12.0); vec2 p=(cell+.5)/12.0; float fine=hash(cell);
        // Fixed shallow depressions fill outwards; rain strikes are a separate layer.
        float basin=.48+.23*sin(p.x*.83+p.y*.29)+.19*cos(p.y*1.21-p.x*.36)+.08*sin(p.x*2.9+p.y*1.8);
        float poolField=smoothstep(.91-wet*.44,.97-wet*.44,basin);
        float reflection=.18+.16*sin(p.y*2.3+p.x*.4);
        float alpha=wet*(.06+fine*.025)+poolField*wet*.30;
        vec3 water=mix(vec3(.12,.16,.19),tint,reflection+poolField*.25);
        // Shallow, broken snow dusting on exposed floor only. Existing depth
        // keeps pots, furniture and residents in front; no model is rebuilt.
        float drift=hash(floor(p*.7));
        float cover=snow*smoothstep(.32,.73,drift)*(.52+fine*.12);
        vec3 col=mix(water,vec3(.78,.85,.87),cover/max(.001,alpha+cover));
        gl_FragColor=vec4(col,min(.55,alpha+cover)); }`,
      }),
    );
    wet.rotation.x = -Math.PI / 2;
    wet.position.y = 0.024;
    root.add(wet);
    const cloudUniforms = { time: { value: 0 }, strength: { value: 0 } };
    const cloud = new T.Mesh(
      floorShape(name),
      new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: cloudUniforms,
        vertexShader:
          "varying vec2 point; void main(){point=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
        fragmentShader:
          "varying vec2 point; uniform float time; uniform float strength; void main(){float field=sin(point.x*.35+time*.08)*cos(point.y*.31+time*.043)+.22*sin(point.x*.8+point.y*.25+time*.04); gl_FragColor=vec4(.22,.29,.40,smoothstep(-.15,.65,field)*strength);}",
      }),
    );
    cloud.rotation.x = -Math.PI / 2;
    cloud.position.y = 0.028;
    root.add(cloud);
    const impactCapacity = 144,
      segments = 12;
    const impactPositions = new Float32Array(impactCapacity * segments * 6);
    const impactAlpha = new Float32Array(impactCapacity * segments * 2);
    const impactGeometry = new T.BufferGeometry()
      .setAttribute("position", new T.BufferAttribute(impactPositions, 3))
      .setAttribute("impactAlpha", new T.BufferAttribute(impactAlpha, 1));
    const impactMaterial = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { tint: { value: new T.Color("#c3d1d8") } },
      vertexShader:
        "attribute float impactAlpha; varying float alpha; void main(){alpha=impactAlpha;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader:
        "varying float alpha; uniform vec3 tint; void main(){gl_FragColor=vec4(tint,alpha);}",
    });
    const impacts = new T.LineSegments(impactGeometry, impactMaterial);
    impacts.frustumCulled = false;
    root.add(impacts);
    const pts = SCENES[name].points,
      bounds = [
        Math.min(...pts.map((p) => p[0])),
        Math.min(...pts.map((p) => p[1])),
        Math.max(...pts.map((p) => p[0])),
        Math.max(...pts.map((p) => p[1])),
      ];
    floors[name] = {
      root,
      wetUniforms,
      cloudUniforms,
      impacts,
      impactGeometry,
      impactMaterial,
      impactPositions,
      impactAlpha,
      bounds,
      segments,
      impactSample: [],
    };
  }
  const seasonalAir = createSeasonalAir(T, scene, renderer);
  const compiledEffects = new T.Group();
  for (const effect of [sky, bolt, rain, ...Object.values(floors).flatMap(f => f.root.children), ...seasonalAir.points])
    compiledEffects.add(effect.clone(false));
  let shadowScene = "", shadowAt = -Infinity, shadowPosition = null, shadowActive = false,
    shadowUpdates = 0, stats = {};

  return {
    // Compile every tiny weather program before its first appearance, using the
    // real scene's lights. Hidden effects stay hidden and no textures are added.
    warm(camera) {
      return renderer.compileAsync(compiledEffects, camera, scene);
    },
    refreshShadows(name, time, moving) {
      const position = sun.position.toArray(), active = sun.intensity > .08,
        force = renderer.shadowMap.needsUpdate || shadowScene !== name || active !== shadowActive,
        changed = !shadowPosition || position.some((n, i) => Math.abs(n - shadowPosition[i]) > .25),
        due = time - shadowAt >= (software ? .9 : .35);
      const refresh = force || (due && (moving || (active && changed)));
      renderer.shadowMap.needsUpdate = refresh;
      sun.shadow.needsUpdate = refresh && active;
      roomLamp.shadow.needsUpdate = refresh && name === "room";
      if (refresh) {
        shadowAt = time; shadowScene = name; shadowPosition = position;
        shadowActive = active; shadowUpdates++;
      }
      return refresh;
    },
    update(name, a, time, reduced = false) {
      seasonalAir.update(name, a, time, reduced);
      const indoor = name === "room",
        motion = weatherMotion(a, time),
        flash = lightningPulse(a, time, reduced),
        precipitation = rainShape(a);
      sky.visible = !indoor;
      skyUniforms.zenith.value.set(a.zenith);
      skyUniforms.horizon.value.set(a.horizon);
      skyUniforms.flash.value = flash;
      renderer.setClearColor(a.sky);
      scene.fog.color.set(a.sky);
      scene.fog.near = indoor ? 100 : 62 - a.fog * 38;
      scene.fog.far = indoor ? 230 : 180 - a.fog * 270;
      hemi.color.set(a.ambientColor);
      hemi.groundColor.set(a.bounceColor);
      hemi.intensity =
        (indoor ? 0.55 + a.ambient * 0.6 : a.ambient) + flash * 1.3;
      sun.color.set(a.sunColor);
      sun.intensity = indoor ? a.direct * 0.62 : a.direct;
      const position = indoor
        ? [a.sunX * 0.32, a.roomSunY ?? 24, -28]
        : lightPosition(a, name);
      sun.position.set(...position);

      moon.intensity = indoor ? a.moon * 0.35 : a.moon;
      bounce.color.set(a.ambientColor);
      bounce.intensity = indoor ? 0.12 : 0.12 + (1 - a.sun) * 0.12;
      const door = name === "south" ? [284, 104] : [440, 424],
        [doorX, doorZ] = coords(name, door[0], door[1]);
      porch.position.set(doorX, 1.7, doorZ);
      porch.intensity = indoor ? 0 : a.lamps * 2.4;
      roomLamp.position.set(-4.45, 2.15, -0.8);
      roomLamp.intensity = indoor ? 0.25 + a.night * 5.2 : 0;

      for (const m of materialCache.values())
        if (m.userData.kind === "light") {
          m.emissive.set("#ffcd88");
          m.emissiveIntensity = 0.05 + a.lamps * 1.3;
        }
      windowMats.forEach((m, i) => {
        const lit = (i % 7) / 7 < a.lamps;
        m.emissive.set(lit ? "#ffc481" : "#000000");
        m.emissiveIntensity = lit ? 0.85 : 0;
      });
      for (const [key, f] of Object.entries(floors)) {
        f.root.visible = name === key;
        f.wetUniforms.wet.value = a.wetness;
        f.wetUniforms.snow.value = (a.seasonwinter || 0) * .48;
        f.wetUniforms.rain.value = a.rain;
        f.wetUniforms.time.value = time;
        f.wetUniforms.tint.value.set(a.sky);
        f.cloudUniforms.time.value = time;
        f.cloudUniforms.strength.value = a.sun * a.cloud * 0.2;
        const shape = precipitation,
          count = Math.ceil(shape.impacts * a.rain * (reduced ? 0.78 : 1));
        f.impacts.visible = name === key && a.rain > 0.01;
        if (f.impacts.visible) {
          const stride = f.segments * 6,
            alphaStride = f.segments * 2,
            sample = [];
          for (let i = 0; i < count; i++) {
            const strike = rainStrike(
              shape,
              i,
              a.rainClock === undefined ? time : a.rainClock * shape.lifetime,
              f.bounds,
              key === "south" ? 431 : 0,
            );
            const valid = inside(key, strike.x, strike.y, 3);
            const [x, z] = coords(key, strike.x, strike.y),
              age = strike.age;
            const radius = 0.025 + age * strike.size,
              opacity = valid ? (1 - age) * a.rain * 0.52 : 0;
            if (i < 3) sample.push([strike.x, strike.y, age]);
            for (let j = 0; j < f.segments; j++) {
              const a0 = (j * Math.PI * 2) / f.segments,
                a1 = ((j + 1) * Math.PI * 2) / f.segments;
              const splash =
                age < 0.3 && j % 3 === i % 3
                  ? Math.sin((age * Math.PI) / 0.3) * shape.splash
                  : 0;
              const n = i * stride + j * 6,
                k = i * alphaStride + j * 2;
              f.impactPositions[n] = x + Math.cos(a0) * radius;
              f.impactPositions[n + 1] = 0.036 + splash;
              f.impactPositions[n + 2] = z + Math.sin(a0) * radius;
              f.impactPositions[n + 3] =
                x + Math.cos(a1) * radius - motion.x * splash * 0.12;
              f.impactPositions[n + 4] = 0.036;
              f.impactPositions[n + 5] =
                z + Math.sin(a1) * radius - motion.z * splash * 0.12;
              f.impactAlpha[k] = f.impactAlpha[k + 1] = opacity;
            }
          }
          f.impactGeometry.setDrawRange(0, count * f.segments * 2);
          f.impactGeometry.attributes.position.needsUpdate = true;
          f.impactGeometry.attributes.impactAlpha.needsUpdate = true;
          f.impactMaterial.uniforms.tint.value.set(
            a.night > 0.5 ? "#7d9cb9" : "#b3c6d0",
          );
          f.impactSample = sample;
        }
      }
      rain.visible = !indoor && a.rain > 0.01;
      rainMaterial.opacity =
        (0.2 + a.rain * 0.24) * (1 - a.night * 0.23) + flash * 0.16;
      rainMaterial.color.set(a.night > 0.5 ? "#99b3cb" : "#c0d0dd");
      const count = Math.floor(
        capacity * Math.min(1, a.rain) * (reduced ? 0.78 : 1),
      );
      rainGeometry.setDrawRange(0, count * 2);
      if (rain.visible) {
        for (let i = 0; i < count; i++) {
          const seed = rainHash(i + precipitation.seed * 131),
            age =
              ((a.streakClock ?? time * (0.75 + a.rain * 0.55)) + seed * 11) %
              1;
          const y = 15 - age * 17,
            drift = age * motion.wind * 1.4;
          const x = ((seed * 397.1) % 1) * 38 - 19 - drift,
            z = ((seed * 723.3) % 1) * 34 - 17 - age * motion.z * 0.65,
            idx = i * 6;
          positions[idx] = x;
          positions[idx + 1] = y;
          positions[idx + 2] = z;
          positions[idx + 3] = x - motion.x * 0.19;
          positions[idx + 4] = y - precipitation.streak;
          positions[idx + 5] = z - motion.z * 0.19;
        }
        rainGeometry.attributes.position.needsUpdate = true;
      }
      bolt.visible = !indoor && flash > 0.03;
      boltMaterial.opacity = flash * 0.62;
      stats = {
        seasonal: seasonalAir.stats,
        phase: a.phase,
        condition: a.condition,
        light: position,
        ambient: hemi.intensity,
        direct: sun.intensity,
        moon: moon.intensity,
        shadow: sun.intensity > 0.08,
        rain: rain.visible ? count : 0,
        wind: indoor ? 0 : motion.wind,
        flash,
        wetness: a.wetness,
        impacts: indoor ? [] : floors[name].impactSample,
        impactCount: indoor ? 0 : Math.ceil(precipitation.impacts * a.rain),
        surfaceState: a.wetness > 0.1 ? "wet" : "dry",
      };
      return { wind: indoor ? 0 : motion.wind };
    },
    get stats() {
      return { ...stats, shadowUpdates, light: stats.light?.slice() };
    },
  };
}

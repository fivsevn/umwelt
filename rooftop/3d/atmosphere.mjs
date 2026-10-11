import { createSeasonalAir } from "./seasonal-air.mjs";
import { setSurfaceEmission } from "./surface-emission.mjs";
import {
  weatherMotion,
  lightningPulse,
} from "../atmosphere.mjs";
import { rainShape, rainStrike, rainHash } from "../precipitation.mjs";
import { SCENES, inside } from "../scene.mjs";
import { BACKGROUND } from "../assets/background/empty-rooftop.mjs";

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const mixColor = (a, b, amount) => "#" + [1, 3, 5].map(i =>
  Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - amount) + parseInt(b.slice(i, i + 2), 16) * amount).toString(16).padStart(2, "0")
).join("");

// Three's linear Lambert BRDF divides incoming light by PI. A mood energy of
// one should still show the Pixelorama pigment at its authored brightness.
export const ATMOSPHERE_LIGHT_ENERGY = Math.PI;
export const WEATHER_PIXEL_METRIC = Object.freeze([
  (BACKGROUND.texelMetresPerUnit?.[0] || 1) * (BACKGROUND.texelsPerMetre || 16),
  (BACKGROUND.texelMetresPerUnit?.[2] || 1) * (BACKGROUND.texelsPerMetre || 16),
]);

export function terraceWeatherPixelMetric(name = "north") {
  return name === "south" ? [WEATHER_PIXEL_METRIC[1], WEATHER_PIXEL_METRIC[0]] : [...WEATHER_PIXEL_METRIC];
}

// Directional light is a physical ray. Convert the ray once using the
// Blender source's metre calibration, then rotate the entire house viewpoint.
// Keep the light inside its existing 100-unit shadow camera; only direction
// determines the illumination and shadow bearing.
export function terraceLightPosition(a, name = "north") {
  const metric = BACKGROUND.texelMetresPerUnit || [1, 1, 1],
    ray = [a.sunX / metric[0], a.sunY / metric[1], a.sunZ / metric[2]],
    distance = Math.hypot(...ray), scale = 62 / Math.max(.001, distance),
    position = ray.map(value => value * scale);
  return name === "south" ? [position[2], position[1], -position[0]] : position;
}

// Use the continuously blended numbers, never the immediately selected weather
// name. Interrupted weather and season changes therefore keep a continuous sky.
export function terraceAtmosphereMood(a) {
  const fog = clamp(a.fog || 0, 0, 0.32) / 0.32,
    rain = clamp(a.rain || 0), gale = clamp(a.gale || 0),
    winter = clamp(a.seasonwinter ?? +(a.season === "winter")),
    night = clamp(a.night || 0),
    altitude = (a.sunY || 1) / Math.max(1, Math.hypot(a.sunX || 0, a.sunZ || 0)),
    sunset = clamp((0.62 - altitude) * 2.2) * clamp(1 - night * 1.4),
    direct = clamp((a.direct || 0) / 1.42),
    afterRain = clamp((a.wetness || 0) - rain);
  const near = Math.max(24, 180 - fog * 145 - rain * 50 - gale * 20),
    extinction = 1 / 6000 + Math.pow(fog, 1.4) * .0033 + rain * .0014 + gale * .0016 + winter * .000045,
    far = Math.max(near + 90, 1 / extinction);
  return {
    fogNear: near,
    fogFar: far,
    fogColor: mixColor(a.sky || "#bacfdd", a.horizon || "#dbe4dc", .58),
    cloudColor: mixColor(a.ambientColor || "#d3e3ec", a.horizon || "#dbe4dc", .42 + sunset * .22),
    rainColor: mixColor(a.ambientColor || "#d3e3ec", a.horizon || "#dbe4dc", .3),
    snowColor: mixColor(a.ambientColor || "#d3e3ec", "#f1f0e7", .72),
    sunset,
    skySun: direct,
    cloudCover: clamp(a.cloud || 0),
    stars: clamp((night - .42) * 1.9) * (1 - clamp(a.cloud || 0)) * (1 - fog),
    afterRain,
    // Local pools catch the horizon's warm light even after the rain stops.
    waterColor: mixColor(a.sky || "#bacfdd", a.horizon || "#dbe4dc", .3 + sunset * .4),
    cloudShadow: direct * clamp((a.cloud || 0) - .12) * .19,
    snowCover: winter * (.32 + clamp(a.cloud || 0) * .2) * (1 - rain * .84),
    lightEnergy: ATMOSPHERE_LIGHT_ENERGY,
  };
}

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
    sunDirection: { value: new T.Vector3() },
    sunColor: { value: new T.Color() },
    cloudColor: { value: new T.Color() },
    cloudCover: { value: 0 },
    sunlight: { value: 0 },
    sunset: { value: 0 },
    stars: { value: 0 },
    time: { value: 0 },
  };
  const sky = new T.Mesh(
    new T.SphereGeometry(210, 24, 12),
    new T.ShaderMaterial({
      uniforms: skyUniforms,
      side: T.BackSide,
      depthWrite: false,
      vertexShader:
        "varying vec3 direction; void main(){direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader: `varying vec3 direction;
        uniform vec3 zenith; uniform vec3 horizon; uniform float flash;
        uniform vec3 sunDirection; uniform vec3 sunColor; uniform vec3 cloudColor;
        uniform float cloudCover; uniform float sunlight; uniform float sunset; uniform float stars; uniform float time;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        void main(){
          vec3 ray=normalize(direction);
          float height=floor(clamp(ray.y*.9+.12,0.0,1.0)*48.0)/48.0;
          vec3 col=mix(horizon,zenith,smoothstep(0.0,.82,height));
          float facing=max(0.0,dot(ray,sunDirection));
          float glow=pow(facing,8.0)*sunset*sunlight*(1.0-smoothstep(.22,.67,ray.y));
          col=mix(col,sunColor,glow*.38);
          // Broad, stepped cloud banks. Their shaded base and warmer lower rim
          // follow the same sky palette as the building's ambient light.
          vec2 cp=floor((ray.xz/max(.3,ray.y+.45)+vec2(time*.002,time*.0007))*80.0)/80.0;
          float field=.52*sin(cp.x*2.7+cp.y*.9)+.3*cos(cp.y*3.4-cp.x*.8)+.18*sin(cp.x*6.1+cp.y*4.3);
          float cloud=smoothstep(1.08-cloudCover*1.52,1.36-cloudCover*1.52,field);
          cloud*=smoothstep(-.08,.17,ray.y)*(1.0-smoothstep(.65,.94,ray.y));
          vec3 cloudInk=mix(cloudColor,zenith,.16+max(0.0,field)*.13);
          cloudInk=mix(cloudInk,sunColor,glow*.22);
          col=mix(col,cloudInk,cloud*(.37+cloudCover*.35));
          // Stars occupy single angular cells and remain behind the clouds.
          vec2 starCell=floor(ray.xz/max(.18,ray.y)*160.0);
          float star=step(.9987,hash(starCell))*smoothstep(.16,.42,ray.y)*stars*(1.0-cloud);
          col=mix(col,vec3(.76,.83,.92),star*.65);
          gl_FragColor=vec4(mix(col,vec3(.79,.85,.94),flash*.38),1.0);
          #include <colorspace_fragment>
        }`,
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
      snowTint: { value: new T.Color("#e5eef1") },
      pixelMetric: { value: new T.Vector2(...terraceWeatherPixelMetric(name)) },
      basinSeed: { value: name === "north" ? new T.Vector2(7.13, 19.71) : new T.Vector2(41.83, -13.27) },
    };
    const wet = new T.Mesh(
      floorShape(name),
      new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: wetUniforms,
        vertexShader:
          "varying vec2 point; void main(){point=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
        fragmentShader: `varying vec2 point; uniform float snow; uniform float wet; uniform float rain; uniform float time; uniform vec3 tint; uniform vec3 snowTint; uniform vec2 pixelMetric; uniform vec2 basinSeed;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float driftNoise(vec2 p){
          vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),
                     mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);
        }
        void main(){vec2 cell=floor(point*pixelMetric); vec2 p=(cell+.5)/pixelMetric; float fine=hash(cell);
        // Non-repeating local depressions in metres. Domain warping joins
        // pockets into irregular damp contours without sinusoidal bands or
        // repeating UV tiles. The two terraces have separate terrain fields.
        vec2 metres=p*pixelMetric/${Number(BACKGROUND.texelsPerMetre || 16).toFixed(1)};
        vec2 q=metres+basinSeed;
        vec2 warp=vec2(driftNoise(q*.53),driftNoise(q*.61+vec2(29.7,-8.3)))-.5;
        vec2 warped=q+warp*1.7;
        float basin=.57*driftNoise(warped*.84)
                   +.28*driftNoise(warped*1.83+vec2(-11.4,26.8))
                   +.15*driftNoise(q*4.1+vec2(17.3,5.9));
        float poolField=smoothstep(.79-wet*.23,.86-wet*.23,basin);
        float dampEdge=smoothstep(.65-wet*.16,.79-wet*.23,basin)*(1.0-poolField);
        float reflection=.24+.13*driftNoise(warped*.37+vec2(-21.7,7.9));
        float alpha=wet*(.019+fine*.008)+dampEdge*wet*.08+poolField*wet*.28;
        vec3 water=mix(vec3(.1,.135,.15),tint,reflection+poolField*.27);
        // Shallow, broken snow dusting on exposed floor only. Existing depth
        // keeps pots, furniture and residents in front; no model is rebuilt.
        // Interpolate the snow field before sampling it on the native pigment
        // grid: independent coarse hashes would expose a large checkerboard.
        // Elongated pockets and fine erosion break the bank into soft, ragged
        // contours while leaving the old cement visible between the drifts.
        vec2 lane=vec2(metres.x+metres.y*.34,metres.y*.78);
        float drift=.62*driftNoise(lane*.72+vec2(3.4,8.1))
                   +.26*driftNoise(metres*1.65+vec2(19.2,-7.3))
                   +.12*driftNoise(metres*4.2+vec2(8.7,16.3));
        float cover=snow*smoothstep(.49,.71,drift)*(.46+fine*.08);
        vec3 col=mix(water,snowTint,cover/max(.001,alpha+cover));
        gl_FragColor=vec4(col,min(.55,alpha+cover));
        #include <colorspace_fragment>
        }`,
      }),
    );
    wet.rotation.x = -Math.PI / 2;
    wet.position.y = 0.024;
    root.add(wet);
    const cloudUniforms = { time: { value: 0 }, strength: { value: 0 }, tint: { value: new T.Color("#627792") }, pixelMetric: { value: new T.Vector2(...terraceWeatherPixelMetric(name)) } };
    const cloud = new T.Mesh(
      floorShape(name),
      new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: cloudUniforms,
        vertexShader:
          "varying vec2 point; void main(){point=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
        fragmentShader:
          "varying vec2 point; uniform float time; uniform float strength; uniform vec3 tint; uniform vec2 pixelMetric; void main(){vec2 p=(floor(point*pixelMetric)+.5)/pixelMetric;float field=sin(p.x*.35+time*.08)*cos(p.y*.31+time*.043)+.22*sin(p.x*.8+p.y*.25+time*.04); gl_FragColor=vec4(tint,smoothstep(-.15,.65,field)*strength);\n#include <colorspace_fragment>\n}",
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
        "varying float alpha; uniform vec3 tint; void main(){gl_FragColor=vec4(tint,alpha);\n#include <colorspace_fragment>\n}",
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
    shadowUpdates = 0, stats = {}, mood = {};

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
      mood = terraceAtmosphereMood(a);
      seasonalAir.update(name, a, time, reduced, mood);
      const indoor = name === "room",
        motion = weatherMotion(a, time),
        flash = lightningPulse(a, time, reduced),
        precipitation = rainShape(a);
      sky.visible = !indoor;
      skyUniforms.zenith.value.set(a.zenith);
      skyUniforms.horizon.value.set(a.horizon);
      skyUniforms.flash.value = flash;
      skyUniforms.sunColor.value.set(a.sunColor);
      skyUniforms.cloudColor.value.set(mood.cloudColor);
      skyUniforms.cloudCover.value = mood.cloudCover;
      skyUniforms.sunlight.value = mood.skySun;
      skyUniforms.sunset.value = mood.sunset;
      skyUniforms.stars.value = mood.stars;
      skyUniforms.time.value = time * (reduced ? .65 : 1);
      renderer.setClearColor(a.sky);
      scene.fog.color.set(mood.fogColor);
      scene.fog.near = indoor ? 100 : mood.fogNear;
      scene.fog.far = indoor ? 230 : mood.fogFar;
      hemi.color.set(a.ambientColor);
      hemi.groundColor.set(a.bounceColor);
      hemi.intensity =
        ((indoor ? 0.55 + a.ambient * 0.6 : a.ambient) + flash * 1.3) * ATMOSPHERE_LIGHT_ENERGY;
      sun.color.set(a.sunColor);
      sun.intensity = (indoor ? a.direct * 0.62 : a.direct) * ATMOSPHERE_LIGHT_ENERGY;
      const position = indoor
        ? [a.roomSunX ?? a.sunX * 0.32, a.roomSunY ?? 24, -28]
        : terraceLightPosition(a, name);
      sun.position.set(...position);
      skyUniforms.sunDirection.value.copy(sun.position).normalize();

      moon.intensity = (indoor ? a.moon * 0.35 : a.moon) * ATMOSPHERE_LIGHT_ENERGY;
      if (!indoor) moon.position.set(...position);
      bounce.color.set(a.ambientColor);
      bounce.position.set(...(name === "south" ? [24, 10, -16] : [16, 10, 24]));
      bounce.intensity = (indoor ? 0.12 : 0.035 + (1 - a.sun) * 0.04) * ATMOSPHERE_LIGHT_ENERGY;
      const door = name === "south" ? [284, 104] : [440, 424],
        [doorX, doorZ] = coords(name, door[0], door[1]);
      porch.position.set(doorX, 1.7, doorZ);
      porch.intensity = indoor ? 0 : a.lamps * 2.4;
      roomLamp.position.set(-4.45, 2.15, -0.8);
      roomLamp.intensity = indoor ? 0.25 + a.night * 5.2 : 0;

      for (const m of materialCache.values())
        if (m.userData.kind === "light") {
          setSurfaceEmission(m,"#ffcd88",0.05+a.lamps*1.3);
        }
      windowMats.forEach((m, i) => {
        const lit = (i % 7) / 7 < a.lamps;
        setSurfaceEmission(m,lit?"#ffc481":"#000000",lit?.85:0);
      });
      for (const [key, f] of Object.entries(floors)) {
        f.root.visible = name === key;
        f.wetUniforms.wet.value = a.wetness;
        f.wetUniforms.snow.value = mood.snowCover;
        f.wetUniforms.rain.value = a.rain;
        f.wetUniforms.time.value = time;
        f.wetUniforms.tint.value.set(mood.waterColor);
        f.wetUniforms.snowTint.value.set(mood.snowColor);
        f.cloudUniforms.time.value = time;
        f.cloudUniforms.strength.value = mood.cloudShadow;
        f.cloudUniforms.tint.value.set(a.ambientColor).multiplyScalar(.32);
        const shape = precipitation,
          count = Math.ceil(shape.impacts * a.rain * (reduced ? 0.78 : 1));
        f.impacts.visible = name === key && a.rain > 0.01;
        if (f.impacts.visible) {
          const stride = f.segments * 6,
            alphaStride = f.segments * 2,
            sample = [],
            texelsX = f.wetUniforms.pixelMetric.value.x,
            texelsZ = f.wetUniforms.pixelMetric.value.y,
            metricX = texelsX / (BACKGROUND.texelsPerMetre || 16),
            metricZ = texelsZ / (BACKGROUND.texelsPerMetre || 16),
            snapX = value => Math.round(value * texelsX) / texelsX,
            snapZ = value => Math.round(value * texelsZ) / texelsZ;
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
            const radius = 0.01 + age * strike.size * .38,
              opacity = valid ? (1 - age) * a.rain * 0.32 : 0,
              ellipse = .76 + rainHash(strike.x * .37 + strike.y * .91) * .29,
              phase = rainHash(strike.x * .73 + strike.y * .41) * Math.PI * 2;
            if (i < 3) sample.push([strike.x, strike.y, age]);
            for (let j = 0; j < f.segments; j++) {
              const a0 = (j * Math.PI * 2) / f.segments + phase,
                a1 = ((j + 1) * Math.PI * 2) / f.segments + phase,
                arc = rainHash(strike.x * 1.31 + strike.y * .19 + j * 17.3);
              const splash =
                age < 0.3 && j % 3 === i % 3
                  ? Math.sin((age * Math.PI) / 0.3) * shape.splash
                  : 0;
              const n = i * stride + j * 6,
                k = i * alphaStride + j * 2;
              f.impactPositions[n] = snapX(x + Math.cos(a0) * radius / metricX);
              f.impactPositions[n + 1] = 0.036 + splash;
              f.impactPositions[n + 2] = snapZ(z + Math.sin(a0) * radius * ellipse / metricZ);
              f.impactPositions[n + 3] =
                snapX(x + Math.cos(a1) * radius / metricX - motion.x * splash * 0.12);
              f.impactPositions[n + 4] = 0.036;
              f.impactPositions[n + 5] =
                snapZ(z + Math.sin(a1) * radius * ellipse / metricZ - motion.z * splash * 0.12);
              f.impactAlpha[k] = f.impactAlpha[k + 1] = arc < .24 ? 0 : opacity * (.45 + arc * .55);
            }
          }
          f.impactGeometry.setDrawRange(0, count * f.segments * 2);
          f.impactGeometry.attributes.position.needsUpdate = true;
          f.impactGeometry.attributes.impactAlpha.needsUpdate = true;
          f.impactMaterial.uniforms.tint.value.set(mood.rainColor);
          f.impactSample = sample;
        }
      }
      rain.visible = !indoor && a.rain > 0.01;
      rainMaterial.opacity =
        (0.2 + a.rain * 0.24) * (1 - a.night * 0.23) + flash * 0.16;
      rainMaterial.color.set(mood.rainColor);
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
        mood: { ...mood, ambientEnergy: a.ambient, directEnergy: a.direct },
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
        surfaceField: indoor ? null : { pixelMetres: 1 / (BACKGROUND.texelsPerMetre || 16), pixelMetric: terraceWeatherPixelMetric(name), basinSeed: floors[name].wetUniforms.basinSeed.value.toArray(), pattern: "warped-local-basins" },
        surfaceState: a.wetness > 0.1 ? "wet" : "dry",
      };
      return { wind: indoor ? 0 : motion.wind };
    },
    get stats() {
      return { ...stats, shadowUpdates, light: stats.light?.slice() };
    },
    get mood() { return { ...mood }; },
  };
}

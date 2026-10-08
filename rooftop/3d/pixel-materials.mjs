import { environmentPainting } from "./environment-paintings.mjs";
import {
  residentPainting,
  RESIDENT_PAINT_KINDS,
} from "./resident-paintings.mjs";
import { WEATHER_KINDS, weatherDrawing } from "./weathering.mjs";
import {
  facePainting,
  wrappedPainting,
  pointInk,
  PIGMENT_RAMP,
} from "./face-paintings.mjs";
import { vesselPainting } from "./vessel-art.mjs";
import { referencePainting, paintTargets } from "./paint-recipes.mjs";
// Original pixel painting recipes, informed by the user's low-poly reference sheets.
// Material information lives in integer texels, never screen-space noise or copied art.
export const PIXEL_STYLE = {
  id: "painted-materials-v6",
  textureSize: 64,
  texelsPerUnit: 12,
  renderScale: 1,
  palette: {
    metal: "#929c9c",
    metalLight: "#c9cdcc",
    metalDark: "#353b3d",
    wood: "#a58052",
    woodLight: "#cba578",
    woodDark: "#624e39",
    white: "#e5e4dc",
    blue: "#537f97",
    blueDark: "#274866",
    soil: "#50402d",
    tile: "#c1c2b4",
    wall: "#cfcec2",
    cap: "#e0ddd0",
  },
};

export const PAINT_STEPS = [
  -0.92, -0.81, -0.68, -0.51, -0.36, -0.18, 0, 0.32, 0.62,
];

export const TEXTURE_KINDS = [
  "wood",
  "wall",
  "facade-tile",
  "room-wall",
  "window",
  "brick",
  "roof",
  "clay",
  "metal",
  "cloth",
  "soil",
  "glass",
  "leaf",
  "leafRigid",
  "cactus",
  "canopy",
  "asphalt",
  "paint",
  "light",
  "panel-ac",
  "panel-door",
  "panel-glass",
  "panel-label",
  "panel-sign",
  "livery-car",
  "water",
  "enamel",
  "wicker",
  "bag",
  "petal",
  ...RESIDENT_PAINT_KINDS,
  "face-board",
  "face-cabinet",
  "face-door",
  "face-drawer",
  ...WEATHER_KINDS.map((k) => "weather-" + k),
  ...["wood", "metal", "paint", "enamel", "cloth"].map(
    (k) => "wrap-weather-" + k,
  ),
  "round-metal",
  "wrap-wood",
  "wrap-metal",
  "wrap-paint",
  "wrap-enamel",
  "wrap-cloth",
];

// [x, y, width, height, palette index]. Clusters are intentional shapes and seams.
const paintingCache = new Map();
export function pixelPainting(kind) {
  if (!paintingCache.has(kind)) {
    let art = drawPainting(kind);
    if (
      !art.grayCount &&
      !kind.startsWith("panel-") &&
      kind !== "glass" &&
      kind !== "light"
    )
      art = {
        ...art,
        grayCount: 9,
        ramp: [...PIGMENT_RAMP, ...art.ramp.slice(5)],
        commands: art.commands.map(([x, y, w, h, ink]) => [
          x,
          y,
          w,
          h,
          ink < 5 ? Math.round(ink * 2) : ink + 4,
        ]),
      };
    paintingCache.set(kind, art);
  }
  return paintingCache.get(kind);
}
function drawPainting(kind) {
  if (kind.startsWith("weather-"))
    return weatherDrawing(pixelPainting(kind.slice(8)), kind.slice(8));
  if (kind.startsWith("wrap-weather-"))
    return weatherDrawing(
      pixelPainting("wrap-" + kind.slice(13)),
      kind.slice(13),
    );
  if (kind.startsWith("vessel-")) return vesselPainting(kind.slice(7));
  if (kind.startsWith("wrap-")) return wrappedPainting(kind);
  const faces =
    residentPainting(kind) ||
    environmentPainting(kind.replace(/^room-/, "")) ||
    facePainting(kind);
  if (faces) return faces;
  if (kind === "round-metal") {
    const commands = [],
      ramp = ["#000000", "#404040", "#808080", "#bfbfbf", "#ffffff"];
    const add = (cell, x, y, w, h, ink) =>
      commands.push([cell * 32 + x, y, w, h, ink]);
    for (const cell of [0, 2]) {
      add(cell, 0, 0, 32, 32, 2);
      for (let y = 0; y < 32; y++)
        for (let x = 0; x < 32; x++) {
          const dx = x - 15.5,
            dy = y - 15.5,
            r = Math.hypot(dx, dy),
            top = cell === 0;
          let ink = top ? 3 : 2;
          if (r > 14.5) ink = dy < 0 && top ? 4 : 1;
          else if (r > 13.5) ink = dy < 0 && top ? 2 : 4;
          else if (top) {
            // Broad steel sheen drawn across the circular surface. All strokes
            // are clipped to the disk; the real rim is separately modelled.
            const reflected = x + y * 0.35 - 17;
            const tone =
              3 +
              0.58 * Math.exp((-reflected * reflected) / 13) -
              0.26 * Math.exp(-((reflected - 5) ** 2) / 8);
            ink = pointInk(tone * 2, x, y, 0, 8) / 2;
          } else if (x > 21 && y > 8 && y < 25) ink = 1;
          add(cell, x, y, 1, 1, ink);
        }
    }
    add(1, 0, 0, 32, 32, 2);
    add(1, 0, 0, 32, 3, 4);
    add(1, 0, 27, 32, 5, 1);
    add(1, 7, 3, 7, 24, 3);
    add(1, 7, 4, 2, 21, 4);
    add(1, 21, 4, 5, 23, 1);
    return { size: 32, width: 96, height: 32, ramp, commands };
  }
  const recipe = referencePainting(
    kind.startsWith("wrap-") ? kind.slice(5) : kind,
  );
  if (recipe) return recipe;
  const commands = [],
    add = (x, y, w, h, ink) => commands.push([x, y, w, h, ink]);
  let ramp = ["#51555c", "#747880", "#999b9c", "#bec0bb", "#e6e4d5"];
  const size = 64;
  add(0, 0, size, size, 3);
  if (kind === "livery-car") {
    ramp = [
      "#000000",
      "#404040",
      "#808080",
      "#bfbfbf",
      "#ffffff",
      "#b6c7cc",
      "#283440",
    ];
    add(0, 0, 64, 64, 3);
    add(0, 0, 64, 2, 4);
    add(0, 57, 64, 4, 1);
    add(0, 60, 64, 2, 5);
    add(0, 63, 64, 1, 6);
    add(32, 2, 1, 55, 1);
    add(33, 3, 1, 52, 4);
    for (const x of [6, 39]) {
      add(x, 13, 10, 3, 1);
      add(x, 12, 10, 1, 5);
    }
    add(8, 29, 18, 7, 2);
    add(11, 36, 11, 2, 2);
    add(39, 36, 17, 4, 2);
  } else if (kind.startsWith("pot-")) {
    ramp = [
      "#665247",
      "#938575",
      "#c2b49f",
      "#e4d8bf",
      "#f7edd0",
      "#536f89",
      "#94a6ab",
      "#a75d41",
      "#47624a",
    ];
    add(0, 6, 64, 2, 2);
    add(0, 8, 64, 1, 4);
    add(0, 52, 64, 2, 1);
    const pattern = kind.slice(4);
    for (let x = 0; x < 64; x += 16) {
      if (pattern === "stripe") add(x + 6, 12, 2, 36, 5);
      else if (pattern === "oribe") {
        add(x, 15, 9, 34, 8);
        add(x + 9, 20, 3, 6, 8);
      } else if (/blue|scroll|grass|flower|imari/.test(pattern)) {
        const ink = pattern === "imari" && (x / 16) % 2 ? 7 : 5;
        add(x + 5, 23, 6, 2, ink);
        add(x + 4, 25, 2, 5, ink);
        add(x + 10, 25, 2, 5, ink);
        add(x + 6, 29, 4, 2, ink);
        add(x + 8, 32, 2, 9, ink);
        add(x + 3, 38, 6, 2, ink);
      } else {
        add(x + 3, 19, 5, 2, 1);
        add(x + 5, 21, 2, 9, 2);
        add(x + 6, 30, 4, 2, 1);
      }
    }
  } else if (kind === "bag") {
    ramp = [
      "#000000",
      "#404040",
      "#808080",
      "#bfbfbf",
      "#ffffff",
      "#627959",
      "#cdd0ad",
    ];
    add(0, 0, 64, 64, 3);
    add(5, 8, 2, 49, 2);
    add(56, 11, 2, 46, 2);
    add(9, 22, 44, 27, 5);
    add(12, 26, 37, 2, 6);
    for (let y = 33; y < 44; y += 4) {
      add(14, y, 31, 1, 6);
      add(13, y + 1, 17, 1, 6);
    }
    for (let j = 0; j < 8; j++) {
      add(9 + j * 6, 4, 3, 1, 2);
      add(9 + j * 6, 57, 3, 1, 2);
    }
    add(0, 52, 64, 1, 4);
    add(0, 54, 64, 2, 2);
  } else if (kind.includes("glass")) {
    ramp = ["#17292c", "#253b3f", "#476467", "#82a2a5", "#cad8d8"];
    add(0, 0, 64, 64, 0);
    add(2, 2, 60, 60, 1);
    add(2, 2, 60, 2, 2);
    for (let y = 7; y < 54; y++) {
      const x = 54 - y;
      add(x, y, 7, 1, 2);
      if (y > 19 && y < 42) add(x + 2, y, 2, 1, 3);
      add(x + 14, y, 2, 1, 2);
    }
    add(4, 57, 56, 2, 0);
  } else if (kind === "panel-ac") {
    ramp = ["#4b5051", "#858a89", "#b0b6b4", "#d9dcd6", "#f1f0e7", "#a5654e"];
    add(0, 0, 64, 64, 1);
    add(2, 2, 60, 58, 3);
    add(3, 3, 57, 2, 4);
    add(5, 9, 38, 38, 0);
    add(7, 11, 34, 34, 2);
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 32; x++) {
        const dx = x - 15.5,
          dy = y - 15.5,
          r = Math.hypot(dx, dy);
        if (r > 13 && r < 15) add(x + 8, y + 12, 1, 1, 1);
        else if (
          r < 12 &&
          r > 3 &&
          Math.sin(Math.atan2(dy, dx) * 5 + r * 0.22) > 0
        )
          add(x + 8, y + 12, 1, 1, 1);
        else if (r < 3) add(x + 8, y + 12, 1, 1, 4);
      }
    add(46, 10, 10, 3, 4);
    add(47, 18, 4, 3, 5);
    add(53, 18, 3, 3, 1);
    for (let y = 31; y < 45; y += 3) add(47, y, 10, 1, 1);
    add(7, 51, 48, 2, 2);
    add(7, 55, 48, 1, 1);
    add(8, 60, 8, 4, 0);
    add(48, 60, 8, 4, 0);
  } else if (kind === "panel-door") {
    ramp = ["#293034", "#555e61", "#88908f", "#b6bdb9", "#d8dcd6"];
    add(0, 0, 64, 64, 1);
    add(2, 2, 60, 60, 2);
    add(5, 4, 54, 56, 1);
    add(8, 6, 48, 22, 0);
    add(10, 8, 44, 18, 1);
    add(12, 9, 40, 2, 3);
    for (let y = 12; y < 24; y++) add(40 - y, y, 10, 1, 2);
    add(8, 34, 27, 14, 2);
    add(10, 35, 22, 2, 3);
    for (let y = 38; y < 46; y += 3) add(10, y, 20, 1, 0);
    add(49, 33, 4, 8, 3);
    add(48, 34, 2, 5, 4);
    add(7, 52, 50, 8, 0);
    for (let y = 53; y < 60; y += 2) add(10, y, 44, 1, 2);
  } else if (kind === "panel-label" || kind === "panel-sign") {
    ramp = ["#424d4e", "#737b70", "#a8a895", "#d3cdb1", "#e6dcc0"];
    add(0, 0, 64, 64, 0);
    add(2, 2, 60, 60, 2);
    add(4, 4, 56, 56, 3);
    for (let y = 15; y < 50; y += 11)
      for (let x = 9; x < 54; x += 7) if ((x + y) % 3) add(x, y, 4, 2, 0);
    add(6, 6, 52, 1, 4);
    add(6, 56, 52, 1, 1);
  } else if (kind === "light") {
    ramp = ["#b5a172", "#d5c08c", "#e8d6a1", "#f4e5b9", "#fff1cc"];
    add(0, 0, 64, 64, 2);
    add(7, 0, 4, 64, 3);
    add(12, 0, 1, 64, 4);
  }
  return { size, ramp, commands };
}

// The pigment is selected once, before lighting. Multiplying a brown mesh by a
// brown sRGB texture used to turn wood, soil and nighttime plants almost black.
export function pigmentPalette(kind, tint, ramp = pixelPainting(kind).ramp) {
  if (
    !tint ||
    kind.startsWith("panel-") ||
    kind === "glass" ||
    kind === "light"
  )
    return ramp;
  const rgb = [1, 3, 5].map((i) => parseInt(tint.slice(i, i + 2), 16));
  const linear = (n) =>
    n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  const srgb = (n) =>
    n <= 0.0031308 ? n * 12.92 : 1.055 * Math.max(0, n) ** (1 / 2.4) - 0.055;
  const base = rgb.map((n) => linear(n / 255));
  const [shadow, highlight] = paintTargets(kind).map((hex) =>
    [1, 3, 5].map((i) => linear(parseInt(hex.slice(i, i + 2), 16) / 255)),
  );
  const low = base.map((n, k) => n * 0.12 + shadow[k] * 0.09);
  const high = base.map((n, k) => n * 0.68 + highlight[k] * 0.32);
  return ramp.map((hex, i) => {
    if (i >= (pixelPainting(kind).grayCount || 5)) return hex;
    const amount = PAINT_STEPS[i],
      target = amount < 0 ? low : high;
    return (
      "#" +
      base
        .map((n, k) =>
          Math.round(
            Math.min(
              1,
              Math.max(0, srgb(n + (target[k] - n) * Math.abs(amount))),
            ) * 255,
          )
            .toString(16)
            .padStart(2, "0"),
        )
        .join("")
    );
  });
}

export function paintPixels(ctx, kind, tint, encode = false) {
  const drawing = pixelPainting(kind),
    { size, ramp, commands } = drawing;
  const palette = encode
    ? ramp.map((hex, i) =>
        i < (drawing.grayCount || 5)
          ? "#" +
            Math.round((i * 255) / ((drawing.grayCount || 5) - 1))
              .toString(16)
              .padStart(2, "0")
              .repeat(3)
          : hex,
      )
    : pigmentPalette(kind, tint, ramp);
  ctx.clearRect(0, 0, drawing.width || size, drawing.height || size);
  ctx.imageSmoothingEnabled = false;
  for (const [x, y, w, h, ink] of commands) {
    ctx.fillStyle = palette[ink];
    ctx.fillRect(x, y, w, h);
  }
}

export function createPixelMaterials(
  T,
  windTime,
  windPower,
  surfaceWeather = { wet: { value: 0 }, rain: { value: 0 } },
) {
  const cache = new Map(),
    textures = new Map();
  function texture(kind) {
    if (textures.has(kind)) return textures.get(kind);
    const c = document.createElement("canvas");
    const drawing = pixelPainting(kind);
    c.width = drawing.width || drawing.size;
    c.height = drawing.height || drawing.size;
    const dedicated =
      kind.startsWith("panel-") || kind === "glass" || kind === "light";
    paintPixels(c.getContext("2d"), kind, undefined, !dedicated);
    const t = new T.CanvasTexture(c);
    t.magFilter = t.minFilter = T.NearestFilter;
    t.generateMipmaps = false;
    // These authored fields explicitly use canvas coordinates for both panels.
    if (kind.startsWith("vessel-antique-")) t.flipY = false;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.colorSpace = T.SRGBColorSpace;
    textures.set(kind, t);
    return t;
  }
  function mat(color, kind = "paint") {
    if (kind === "plain") kind = "paint";
    const key = color + ":" + kind;
    if (cache.has(key)) return cache.get(key);
    const materialBase = kind.replace(/^(weather-|room-)/, ""),
      environmentArt = environmentPainting(materialBase),
      environment = environmentArt?.environment,
      faces =
        residentPainting(materialBase) ||
        environmentArt ||
        facePainting(materialBase);
    const wind = kind.startsWith("leaf") || kind === "cactus",
      panel =
        kind.startsWith("livery-") ||
        kind.startsWith("panel-") ||
        kind.startsWith("pot-") ||
        kind.startsWith("vessel-") ||
        kind.startsWith("leaf") ||
        kind === "cactus" ||
        kind === "enamel" ||
        kind === "bag" ||
        kind.startsWith("wrap-") ||
        materialBase === "round-metal";
    const dedicated =
      kind.startsWith("panel-") || kind === "glass" || kind === "light";
    const m = new T.MeshLambertMaterial({
      color,
      map: texture(kind),
      flatShading: true,
    });
    m.extensions = { ...(m.extensions || {}), derivatives: true };
    m.userData.kind = kind;
    m.defaultAttributeValues = {
      ...m.defaultAttributeValues,
      paintBox: [0],
      paintSeed: [0],
      paintVariant: [0],
      paintInteriorUv: [0.5, 0.5],
      paintShadePositive: [0, 0, 0],
      paintShadeNegative: [0, 0, 0],
    };
    m.customProgramCacheKey = () =>
      "pixel-metric-v6-" +
      kind +
      "-" +
      (wind ? "wind-" + kind : "static") +
      (faces
        ? "-faces-" + kind
        : materialBase === "round-metal"
          ? "-round"
          : panel
            ? "-panel"
            : "-surface") +
      (dedicated ? "-illustrated" : "-pigment") +
      (kind === "wood" ? "-grain" : "") +
      (/leaf|canopy|cactus|petal/.test(kind) ? "-organic" : "") +
      (kind.startsWith("vessel-antique-")
        ? "-museum-planar-interior-" + kind
        : kind.startsWith("vessel-")
          ? "-wrapped-vessel"
          : "") +
      (/vessel|clay|soil/.test(kind) ? "-patina" : "");
    m.onBeforeCompile = (shader) => {
      shader.vertexShader =
        "attribute vec2 paintInteriorUv; varying vec2 vPaintInteriorUv; attribute float paintBox; attribute float paintSeed; attribute float paintVariant; attribute vec3 paintShadePositive; attribute vec3 paintShadeNegative; varying float vPaintIsBox; varying vec3 vPaintUnit; varying vec3 vPaintScale; varying vec3 vContactPositive; varying vec3 vContactNegative; varying vec3 vPaintPosition; varying vec3 vPaintNormal; varying vec2 vPaintPhase; varying float vPaintSeed; varying float vPaintVariant;\n" +
        shader.vertexShader;
      shader.fragmentShader =
        "varying vec2 vPaintInteriorUv; uniform vec3 paintShadow; uniform vec3 paintHighlight; uniform float surfaceWet; uniform float surfaceRain; varying float vPaintIsBox; varying vec3 vPaintUnit; varying vec3 vPaintScale; varying vec3 vContactPositive; varying vec3 vContactNegative; varying vec3 vPaintPosition; varying vec3 vPaintNormal; varying vec2 vPaintPhase; varying float vPaintSeed; varying float vPaintVariant;\n" +
        shader.fragmentShader;
      const metricFunction = `
float environmentHash(vec2 p,float seed) { return fract(sin(dot(p,vec2(127.1,311.7))+seed*83.17)*43758.5453); }
vec2 squarePaintUv(vec2 uv) {
  vec3 n=normalize(vPaintNormal/vPaintScale);
  vec3 tangent=normalize(abs(n.y)>.98?vec3(1.0,0.0,0.0):cross(vec3(0.0,1.0,0.0),n));
  vec3 vertical=normalize(cross(n,tangent));
  vec2 plane=vec2(dot(vPaintPosition,tangent),dot(vPaintPosition,vertical));
  vec2 dx=dFdx(plane),dy=dFdy(plane);
  float det=dx.x*dy.y-dx.y*dy.x;
  if(abs(det)<.00000001)return uv;
  vec2 delta=(floor(plane*${PIXEL_STYLE.texelsPerUnit}.0)+.5)/${PIXEL_STYLE.texelsPerUnit}.0-plane;
  vec2 screen=vec2(delta.x*dy.y-delta.y*dy.x,dx.x*delta.y-dx.y*delta.x)/det;
  return uv+dFdx(uv)*screen.x+dFdy(uv)*screen.y;
}
`;
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        metricFunction + "\nvoid main() {",
      );
      // Both intrinsic material pigments and authored motifs share this metric.
      const targets = paintTargets(kind);
      shader.uniforms.surfaceWet = surfaceWeather.wet;
      shader.uniforms.surfaceRain = surfaceWeather.rain;
      shader.uniforms.paintShadow = { value: new T.Color(targets[0]) };
      shader.uniforms.paintHighlight = { value: new T.Color(targets[1]) };
      let position = `#include <begin_vertex>\nvec3 paintScale = vec3(1.0);\n#ifdef USE_INSTANCING\npaintScale = vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));\n#endif\nvPaintInteriorUv=paintInteriorUv; vPaintSeed=paintSeed; vPaintVariant=paintVariant; vPaintPhase=vec2(0.0);\n#ifdef USE_INSTANCING\nvPaintPhase=vec2(fract(instanceMatrix[3].x*.173+instanceMatrix[3].z*.317),floor(mod(abs(instanceMatrix[3].y*7.0+instanceMatrix[3].x*3.0+instanceMatrix[3].z*5.0),4.0)))*vec2(4.0,1.0);\n#endif\nvPaintPosition=position*paintScale; vPaintNormal=normal; vPaintUnit=position; vPaintIsBox=paintBox; vPaintScale=paintScale; vContactPositive=paintShadePositive; vContactNegative=paintShadeNegative;`;
      if (wind) {
        shader.uniforms.leafTime = windTime;
        shader.uniforms.leafWind = windPower;
        shader.vertexShader =
          "uniform float leafTime; uniform float leafWind;\n" +
          shader.vertexShader;
        position += `\n#ifdef USE_INSTANCING\ntransformed.x += sin(leafTime*1.8+instanceMatrix[3].x*1.5+instanceMatrix[3].z)*leafWind*${kind === "leafRigid" || kind === "cactus" ? ".012" : ".07"}*max(0.0,instanceMatrix[3].y+position.y-.3);\n#endif`;
      }
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        position,
      );
      const pigment = dedicated
        ? "diffuseColor.rgb *= painted.rgb; diffuseColor.a *= painted.a;"
        : `
float gray = painted.r;
float ink = gray < .007 ? -.92 : gray < .032 ? -.81 : gray < .083 ? -.68 : gray < .166 ? -.51 : gray < .284 ? -.36 : gray < .436 ? -.18 : gray < .632 ? 0.0 : gray < .871 ? .32 : .62;
float chroma = max(max(painted.r,painted.g),painted.b)-min(min(painted.r,painted.g),painted.b);
vec3 lowPigment=diffuseColor.rgb*.12+paintShadow*.09;
vec3 highPigment=mix(diffuseColor.rgb,paintHighlight,.32);
diffuseColor.rgb = chroma > .025 ? painted.rgb : mix(diffuseColor.rgb, ink < 0.0 ? lowPigment : highPigment, abs(ink));`;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        T.ShaderChunk.color_fragment +
          "\n" +
          (panel && !faces
            ? `#ifdef USE_MAP\nvec2 paintedUv=squarePaintUv(vMapUv); ${materialBase === "round-metal" ? "float roundFace=vPaintNormal.y>.7?0.0:vPaintNormal.y<-.7?2.0:1.0; paintedUv=vec2((roundFace+clamp(paintedUv.x,.5/32.0,31.5/32.0))/3.0,clamp(paintedUv.y,.5/32.0,31.5/32.0));" : ""} ${
                kind.startsWith("vessel-")
                  ? `
${
  kind.startsWith("vessel-antique-")
    ? `
 if(vMapUv.y<.145) {
   vec2 innerUv=clamp(squarePaintUv(vPaintInteriorUv),vec2(.5/64.0),vec2(63.5/64.0));
   paintedUv=vec2(innerUv.x,.5+innerUv.y*.5);
 } else {paintedUv=vec2(fract(paintedUv.x+${/shino-square|nezumi/.test(kind) ? ".125" : "0.0"}),clamp(paintedUv.y,.5/64.0,63.5/64.0)*.5);}
`
    : ` if(vMapUv.y<.145) {
   vec2 innerUv=abs(vPaintNormal.y)>.7?vPaintPosition.xz*.9+.5:vec2(atan(vPaintPosition.z,vPaintPosition.x)/6.2831853+.5,vPaintPosition.y*.9+.10);
   innerUv=squarePaintUv(innerUv);innerUv.x=fract(innerUv.x+vPaintSeed);
   paintedUv=vec2(innerUv.x,.5+clamp(innerUv.y,.5/64.0,63.5/64.0)*.5);
 } else {paintedUv=vec2(fract(paintedUv.x+vPaintSeed),clamp(paintedUv.y,.5/64.0,63.5/64.0)*.5);}
`
}
`
                  : kind.startsWith("wrap-")
                    ? "paintedUv+=vec2(vPaintSeed+fract(vPaintPhase.x*.317+vPaintVariant*.171),fract(vPaintPhase.y*.231+vPaintVariant*.379));"
                    : ""
              } vec4 painted = texture2D(map,paintedUv); ${pigment}\n#endif`
            : `#ifdef USE_MAP\nvec3 axis=abs(vPaintNormal);\nvec2 surface=axis.x>axis.y&&axis.x>axis.z?vPaintPosition.zy:axis.y>axis.z?vPaintPosition.xz:vPaintPosition.xy;\n\nsurface+=vec2(vPaintSeed*4.0,${kind === "wood" ? "floor(vPaintSeed*4.0)" : "fract(vPaintSeed*17.0)*4.0"}); vec2 sampleUv=squarePaintUv(surface/4.0);
${
  environment
    ? `vec2 envFaceUv=vec2(0.0),envSpan=vec2(1.0); float envCell=0.0;
vec2 metricUv=squarePaintUv(surface/${((faces?.cellWidth || 64) / PIXEL_STYLE.texelsPerUnit).toFixed(8)});
float envVariant=floor(environmentHash(floor(metricUv),vPaintSeed+vPaintVariant)*${faces.variants}.0);
sampleUv=(vec2(0.0,envVariant*2.0)+fract(metricUv))/vec2(3.0,${2 * faces.variants}.0);`
    : faces
      ? `sampleUv=fract(squarePaintUv(vMapUv))/vec2(3.0,${2 * faces.variants}.0);`
      : ""
}
${
  faces
    ? `if(vPaintIsBox>.5) {
 vec2 faceUv; vec2 faceSpan; float cell;
 if(axis.z>=axis.x&&axis.z>=axis.y){faceUv=vec2(vPaintNormal.z>0.0?vPaintUnit.x:-vPaintUnit.x,vPaintUnit.y)+.5; faceSpan=vPaintScale.xy; cell=vPaintNormal.z>0.0?0.0:2.0;}
 else if(axis.x>=axis.y){faceUv=vec2(vPaintNormal.x>0.0?-vPaintUnit.z:vPaintUnit.z,vPaintUnit.y)+.5; faceSpan=vPaintScale.zy; cell=vPaintNormal.x>0.0?1.0:3.0;}
 else{faceUv=vec2(vPaintUnit.x,vPaintNormal.y>0.0?-vPaintUnit.z:vPaintUnit.z)+.5; faceSpan=vPaintScale.xz; cell=vPaintNormal.y>0.0?4.0:5.0;}
 ${/^(wood|face-board)$/.test(materialBase) ? "if(faceSpan.y>faceSpan.x)faceUv=faceUv.yx;" : ""}
 // Snap in metric surface coordinates before the atlas lookup; never stretch texels to fit.
 faceUv=squarePaintUv(faceUv);
 ${
   environment
     ? `envFaceUv=faceUv; envSpan=faceSpan; envCell=cell;
 vec2 metricUv=faceUv*faceSpan*${PIXEL_STYLE.texelsPerUnit}.0/${faces?.cellWidth || 64}.0;
 vec2 fieldCell=floor(metricUv); faceUv=fract(metricUv);`
     : ""
 }
 // Clamp to cell centres: nearest sampling never bleeds into a neighbouring face.
 faceUv=clamp(faceUv,vec2(${0.5 / (faces?.cellWidth || 64)},${0.5 / (faces?.cellHeight || 64)}),vec2(${1 - 0.5 / (faces?.cellWidth || 64)},${1 - 0.5 / (faces?.cellHeight || 64)}));
 float variant=${environment ? `floor(environmentHash(fieldCell,vPaintSeed+cell*.173+vPaintVariant)*${faces.variants}.0)` : faces?.variants > 1 ? `mod(vPaintVariant+floor(vPaintSeed*${faces.variants}.0),${faces.variants}.0)` : "0.0"};
 sampleUv=(vec2(mod(cell,3.0),floor(cell/3.0)+variant*2.0)+faceUv)/vec2(3.0,${2 * (faces?.variants || 1)}.0);
}`
    : ""
}
vec4 painted=texture2D(map,sampleUv); ${pigment}
${
  environment && kind !== "room-wall" && materialBase !== "asphalt"
    ? `
 if(vPaintIsBox>.5) {
   float ageSeed=vPaintSeed+envCell*.219+vPaintVariant*.117;
   float age=environmentHash(vec2(2.0,3.0),ageSeed);
   vec2 facePoint=envFaceUv*envSpan;
   vec2 spot=vec2(envSpan.x*(.12+.76*environmentHash(vec2(6.0,8.0),ageSeed)),0.08);
   vec2 spread=vec2(.24+.32*age,.14+.18*age);
   ${materialBase === "roof" ? "spot.y=envSpan.y-.12; spread=vec2(.28,.23);" : ""}
   float deposit=exp(-dot((facePoint-spot)/spread,(facePoint-spot)/spread));
   float point=environmentHash(floor(facePoint*${PIXEL_STYLE.texelsPerUnit}.0),ageSeed+2.37);
   if(age>.28 && deposit>.34 && point<deposit*.64) {
     vec3 dirt=vec3(.22,.18,.12),moss=vec3(.12,.17,.085);
     diffuseColor.rgb=mix(diffuseColor.rgb,point<deposit*.16?moss:dirt,.20+deposit*.20);
   }
   ${
     materialBase === "wall"
       ? `
   vec2 chipSpot=vec2(envSpan.x*(.08+.84*environmentHash(vec2(9.0,5.0),ageSeed)),.18);
   float loss=exp(-dot((facePoint-chipSpot)/vec2(.19,.22),(facePoint-chipSpot)/vec2(.19,.22)));
   if(age>.58 && loss>.44 && point<loss*.50)diffuseColor.rgb*=.78;
   `
       : ""
   }
 }
`
    : ""
}
\n#endif`),
      );
      // Geometry-led edge paint and contact shadow. Broad planes stay legible;
      // selected texels interrupt the edge highlight like the painted references.
      // Lambert samples its map before the stock instance-color chunk. Selecting
      // pigment from white and multiplying the instance afterward tinted ceramic
      // drawings and turned terracotta olive. Apply the instance exactly once first.
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        `
// Stable firing/soil variation shares textures and does not rebuild when moving.
${/vessel|clay|soil/.test(kind) ? "float patina=(vPaintSeed-.5)*.20; diffuseColor.rgb*=vec3(1.0+patina,1.0+patina*.5,1.0-patina*.22);" : ""}
${
  !/^(skin|hair|actor-cloth|room-|light)/.test(kind)
    ? `
float damp=surfaceWet;
float bead=step(.87,environmentHash(floor(vPaintPosition.xz*12.0)+floor(vPaintPosition.y*12.0),vPaintSeed+5.17));
float wetTop=max(0.0,vPaintNormal.y);
diffuseColor.rgb*=1.0-damp*${/soil/.test(kind) ? ".28" : /wood|clay|vessel|wicker/.test(kind) ? ".17" : ".10"};
${/water/.test(kind) ? "diffuseColor.rgb=mix(diffuseColor.rgb,paintHighlight,bead*surfaceRain*.18);" : "diffuseColor.rgb=mix(diffuseColor.rgb,paintHighlight,bead*damp*wetTop*.12);"}
`
    : ""
}
// Baked plane separation complements the real sun; turning the object keeps its paint.
float facePaint = vPaintNormal.y > .7 ? 1.04 : vPaintNormal.y < -.7 ? .50 : abs(vPaintNormal.x)>abs(vPaintNormal.z) ? (vPaintNormal.x>0.0?.72:.84) : (vPaintNormal.z>0.0?.92:.70);
diffuseColor.rgb *= ${/leaf|canopy|cactus|petal/.test(kind) ? "mix(.93,1.04,max(0.0,vPaintNormal.y))" : "facePaint"};
if(vPaintIsBox>.5) {
 vec3 face=abs(vPaintNormal), distance=(vec3(.5)-abs(vPaintUnit))*vPaintScale;
 float edge=face.x>face.y&&face.x>face.z?min(distance.y,distance.z):face.y>face.z?min(distance.x,distance.z):min(distance.x,distance.y);
 float lip=(1.0-smoothstep(.005,.018,edge));
 float faceSpan=face.x>face.y&&face.x>face.z?min(vPaintScale.y,vPaintScale.z):face.y>face.z?min(vPaintScale.x,vPaintScale.z):min(vPaintScale.x,vPaintScale.y);
 lip*=faceSpan<.075?.30:1.0;
 float interrupted=mod(floor(vPaintPosition.x*19.0)+floor(vPaintPosition.y*23.0)+floor(vPaintPosition.z*17.0),7.0)>1.0?1.0:.42;
 ${faces ? "" : "diffuseColor.rgb=mix(diffuseColor.rgb,mix(diffuseColor.rgb,paintHighlight,.28),lip*.35);"}
 float contact=dot(max(vPaintNormal,vec3(0.0)),vContactPositive)+dot(max(-vPaintNormal,vec3(0.0)),vContactNegative);
 diffuseColor.rgb*=1.0-contact*.32;
}`,
      );
      // Keep the painted pigment steps, but do not round the final framebuffer.
      // sRGB thumbnail targets encode after the shader; rounding linear RGB there
      // clipped weak green/blue channels and made shaded clay red or leaves black.
    };
    cache.set(key, m);
    return m;
  }
  return { mat, cache, textures, texture };
}

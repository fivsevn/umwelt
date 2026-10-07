import { vesselPainting } from "./vessel-art.mjs";
import { referencePainting, paintTargets } from "./paint-recipes.mjs";
// Original pixel painting recipes, informed by the user's low-poly reference sheets.
// Material information lives in integer texels, never screen-space noise or copied art.
export const PIXEL_STYLE = {
  id: "painted-lowpoly-v3",
  textureSize: 64,
  texelsPerUnit: 16,
  renderScale: 1,
  palette: {
    metal: "#607c88",
    metalLight: "#c2cfd0",
    metalDark: "#26323e",
    wood: "#b7834c",
    woodLight: "#d5a66c",
    woodDark: "#5c392a",
    white: "#e5e4dc",
    blue: "#3f88b1",
    blueDark: "#274866",
    soil: "#50402d",
    tile: "#c1c2b4",
    wall: "#cfcec2",
    cap: "#e0ddd0",
  },
};

export const PAINT_STEPS = [-.85,-.55,-.28,0,.48];

export const TEXTURE_KINDS = [
  "wood",
  "wall",
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
];

// [x, y, width, height, palette index]. Clusters are intentional shapes and seams.
export function pixelPainting(kind) {
  if (kind.startsWith("vessel-")) return vesselPainting(kind.slice(7));
  const recipe = referencePainting(kind);
  if (recipe) return recipe;
  const commands = [], add = (x,y,w,h,ink) => commands.push([x,y,w,h,ink]);
  let ramp = ["#51555c", "#747880", "#999b9c", "#bec0bb", "#e6e4d5"];
  const size = 64;
  add(0,0,size,size,3);
  if (kind === "livery-car") {
    ramp=["#000000","#404040","#808080","#bfbfbf","#ffffff","#b6c7cc","#283440"];
    add(0,0,64,64,3);add(0,0,64,2,4);add(0,57,64,4,1);
    add(0,60,64,2,5);add(0,63,64,1,6);
    add(32,2,1,55,1);add(33,3,1,52,4);
    for(const x of[6,39]) {add(x,13,10,3,1);add(x,12,10,1,5);}
    add(8,29,18,7,2);add(11,36,11,2,2);add(39,36,17,4,2);
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
    ramp=["#000000","#404040","#808080","#bfbfbf","#ffffff","#627959","#cdd0ad"];
    add(0,0,64,64,3);add(5,8,2,49,2);add(56,11,2,46,2);
    add(9,22,44,27,5);add(12,26,37,2,6);
    for(let y=33;y<44;y+=4){add(14,y,31,1,6);add(13,y+1,17,1,6)}
    for(let j=0;j<8;j++){add(9+j*6,4,3,1,2);add(9+j*6,57,3,1,2)}
    add(0,52,64,1,4);add(0,54,64,2,2);
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
    ramp = ["#5d5556", "#8f8281", "#b4a7a5", "#d1c8c4", "#eeebe6", "#9b564d"];
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
    ramp = ["#17222d", "#2b3e52", "#4b657c", "#8a9ca9", "#c8d1d2"];
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
  return {size,ramp,commands};
}

// The pigment is selected once, before lighting. Multiplying a brown mesh by a
// brown sRGB texture used to turn wood, soil and nighttime plants almost black.
export function pigmentPalette(kind, tint, ramp = pixelPainting(kind).ramp) {
  if (!tint || kind.startsWith("panel-") || kind === "glass" || kind === "light")
    return ramp;
  const rgb = [1, 3, 5].map((i) => parseInt(tint.slice(i, i + 2), 16));
  const linear = n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4;
  const srgb = n => n <= .0031308 ? n * 12.92 : 1.055 * Math.max(0,n) ** (1 / 2.4) - .055;
  const base = rgb.map(n=>linear(n/255));
  const [shadow, highlight] = paintTargets(kind).map(hex=>[1,3,5].map(i=>linear(parseInt(hex.slice(i,i+2),16)/255)));
  const low=base.map((n,k)=>n*.12+shadow[k]*.03);
  const high=base.map((n,k)=>n*.68+highlight[k]*.32);
  return ramp.map((hex, i) => {
    if (i >= 5) return hex;
    const amount=PAINT_STEPS[i],target=amount<0?low:high;
    return '#' + base.map((n,k)=>Math.round(Math.min(1,Math.max(0,srgb(n+(target[k]-n)*Math.abs(amount))))*255).toString(16).padStart(2,'0')).join('');
  });
}

export function paintPixels(ctx, kind, tint, encode = false) {
  const { size, ramp, commands } = pixelPainting(kind);
  const palette = encode ? ramp.map((hex, i) => i < 5
    ? ["#000000", "#404040", "#808080", "#bfbfbf", "#ffffff"][i] : hex)
    : pigmentPalette(kind, tint, ramp);
  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = false;
  for (const [x, y, w, h, ink] of commands) {
    ctx.fillStyle = palette[ink];
    ctx.fillRect(x, y, w, h);
  }
}

export function createPixelMaterials(T, windTime, windPower) {
  const cache = new Map(),
    textures = new Map();
  function texture(kind) {
    if (textures.has(kind)) return textures.get(kind);
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const dedicated = kind.startsWith("panel-") || kind === "glass" || kind === "light";
    paintPixels(c.getContext("2d"), kind, undefined, !dedicated);
    const t = new T.CanvasTexture(c);
    t.magFilter = t.minFilter = T.NearestFilter;
    t.generateMipmaps = false;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.colorSpace = T.SRGBColorSpace;
    textures.set(kind, t);
    return t;
  }
  function mat(color, kind = "paint") {
    if (kind === "plain") kind = "paint";
    const key = color + ":" + kind;
    if (cache.has(key)) return cache.get(key);
    const wind = kind.startsWith("leaf") || kind === "cactus",
      panel = kind.startsWith("livery-") || kind.startsWith("panel-") || kind.startsWith("pot-") || kind.startsWith("vessel-") ||
        kind.startsWith("leaf") || kind === "cactus" || kind === "enamel" || kind === "bag";
    const dedicated = kind.startsWith("panel-") || kind === "glass" || kind === "light";
    const m = new T.MeshLambertMaterial({
      color,
      map: texture(kind),
      flatShading: true,
    });
    m.userData.kind = kind;
    m.defaultAttributeValues={...m.defaultAttributeValues,paintBox:[0],paintSeed:[0],paintShadePositive:[0,0,0],paintShadeNegative:[0,0,0]};
    m.customProgramCacheKey = () =>
      "pixel-v3-" +
      (wind ? "wind-" + kind : "static") +
      (panel ? "-panel" : "-surface") + (dedicated ? "-illustrated" : "-pigment") + (kind === "wood" ? "-grain" : "") + (/leaf|canopy|cactus|petal/.test(kind) ? "-organic" : "") + (kind.startsWith("vessel-") ? "-wrapped-vessel" : "") + (/vessel|clay|soil/.test(kind) ? "-patina" : "");
    m.onBeforeCompile = (shader) => {
      shader.vertexShader =
        "attribute float paintBox; attribute float paintSeed; attribute vec3 paintShadePositive; attribute vec3 paintShadeNegative; varying float vPaintIsBox; varying vec3 vPaintUnit; varying vec3 vPaintScale; varying vec3 vContactPositive; varying vec3 vContactNegative; varying vec3 vPaintPosition; varying vec3 vPaintNormal; varying vec2 vPaintPhase; varying float vPaintSeed;\n" +
        shader.vertexShader;
      shader.fragmentShader =
        "uniform vec3 paintShadow; uniform vec3 paintHighlight; varying float vPaintIsBox; varying vec3 vPaintUnit; varying vec3 vPaintScale; varying vec3 vContactPositive; varying vec3 vContactNegative; varying vec3 vPaintPosition; varying vec3 vPaintNormal; varying vec2 vPaintPhase; varying float vPaintSeed;\n" +
        shader.fragmentShader;
      const targets=paintTargets(kind);
      shader.uniforms.paintShadow={value:new T.Color(targets[0])};
      shader.uniforms.paintHighlight={value:new T.Color(targets[1])};
      let position = `#include <begin_vertex>\nvec3 paintScale = vec3(1.0);\n#ifdef USE_INSTANCING\npaintScale = vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));\n#endif\nvPaintSeed=paintSeed; vPaintPhase=vec2(0.0);\n#ifdef USE_INSTANCING\nvPaintPhase=vec2(fract(instanceMatrix[3].x*.173+instanceMatrix[3].z*.317),floor(mod(abs(instanceMatrix[3].y*7.0+instanceMatrix[3].x*3.0+instanceMatrix[3].z*5.0),4.0)))*vec2(4.0,1.0);\n#endif\nvPaintPosition=position*paintScale; vPaintNormal=normal; vPaintUnit=position; vPaintIsBox=paintBox; vPaintScale=paintScale; vContactPositive=paintShadePositive; vContactNegative=paintShadeNegative;`;
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
      const pigment = dedicated ? "diffuseColor.rgb *= painted.rgb; diffuseColor.a *= painted.a;" : `
float gray = painted.r;
float ink = gray < .025 ? ${PAINT_STEPS[0].toFixed(2)} : gray < .13 ? ${PAINT_STEPS[1].toFixed(2)} : gray < .36 ? ${PAINT_STEPS[2].toFixed(2)} : gray < .75 ? 0.0 : ${PAINT_STEPS[4].toFixed(2)};
float chroma = max(max(painted.r,painted.g),painted.b)-min(min(painted.r,painted.g),painted.b);
vec3 lowPigment=diffuseColor.rgb*.12+paintShadow*.03;
vec3 highPigment=mix(diffuseColor.rgb,paintHighlight,.32);
diffuseColor.rgb = chroma > .025 ? painted.rgb : mix(diffuseColor.rgb, ink < 0.0 ? lowPigment : highPigment, abs(ink));`;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        T.ShaderChunk.color_fragment + "\n" + (panel
          ? `#ifdef USE_MAP\nvec2 paintedUv=vMapUv; ${kind.startsWith("vessel-") ? "paintedUv.x+=vPaintSeed;" : ""} vec4 painted = texture2D(map,paintedUv); ${pigment}\n#endif`
          : `#ifdef USE_MAP\nvec3 axis=abs(vPaintNormal);\nvec2 surface=axis.x>axis.y&&axis.x>axis.z?vPaintPosition.zy:axis.y>axis.z?vPaintPosition.xz:vPaintPosition.xy;\n${kind === "wood" ? "vec2 span=axis.x>axis.y&&axis.x>axis.z?vPaintScale.zy:axis.y>axis.z?vPaintScale.xz:vPaintScale.xy; if(vPaintScale.y>max(vPaintScale.x,vPaintScale.z)||vPaintScale.z>max(vPaintScale.x,vPaintScale.y)){surface=surface.yx;span=span.yx;} surface.y=surface.y/max(span.y,.02)*.68+.5+vPaintPhase.y; surface.x+=vPaintPhase.x;" : ""}\nsurface+=vec2(vPaintSeed*4.0,${kind === "wood" ? "floor(vPaintSeed*4.0)" : "fract(vPaintSeed*17.0)*4.0"}); vec4 painted=texture2D(map,surface/4.0); ${pigment}\n#endif`),
      );
      // Geometry-led edge paint and contact shadow. Broad planes stay legible;
      // selected texels interrupt the edge highlight like the painted references.
      // Lambert samples its map before the stock instance-color chunk. Selecting
      // pigment from white and multiplying the instance afterward tinted ceramic
      // drawings and turned terracotta olive. Apply the instance exactly once first.
      shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `
// Stable firing/soil variation shares textures and does not rebuild when moving.
${/vessel|clay|soil/.test(kind) ? "float patina=(vPaintSeed-.5)*.20; diffuseColor.rgb*=vec3(1.0+patina,1.0+patina*.5,1.0-patina*.22);" : ""}
// Baked plane separation complements the real sun; turning the object keeps its paint.
float facePaint = vPaintNormal.y > .7 ? 1.0 : vPaintNormal.y < -.7 ? .55 : .86 + vPaintNormal.x*.09 + vPaintNormal.z*.035;
diffuseColor.rgb *= ${/leaf|canopy|cactus|petal/.test(kind) ? "mix(.93,1.04,max(0.0,vPaintNormal.y))" : "facePaint"};
if(vPaintIsBox>.5) {
 vec3 face=abs(vPaintNormal), distance=(vec3(.5)-abs(vPaintUnit))*vPaintScale;
 float edge=face.x>face.y&&face.x>face.z?min(distance.y,distance.z):face.y>face.z?min(distance.x,distance.z):min(distance.x,distance.y);
 float lip=(1.0-smoothstep(.005,.018,edge));
 float faceSpan=face.x>face.y&&face.x>face.z?min(vPaintScale.y,vPaintScale.z):face.y>face.z?min(vPaintScale.x,vPaintScale.z):min(vPaintScale.x,vPaintScale.y);
 lip*=faceSpan<.075?.30:1.0;
 float interrupted=mod(floor(vPaintPosition.x*19.0)+floor(vPaintPosition.y*23.0)+floor(vPaintPosition.z*17.0),7.0)>1.0?1.0:.42;
 diffuseColor.rgb=mix(diffuseColor.rgb,mix(diffuseColor.rgb,paintHighlight,.28),lip*interrupted*.48);
 float contact=dot(max(vPaintNormal,vec3(0.0)),vContactPositive)+dot(max(-vPaintNormal,vec3(0.0)),vContactNegative);
 diffuseColor.rgb*=1.0-contact*.32;
}`);
      // Keep the five painted pigments, but do not round the final framebuffer.
      // sRGB thumbnail targets encode after the shader; rounding linear RGB there
      // clipped weak green/blue channels and made shaded clay red or leaves black.
    };
    cache.set(key, m);
    return m;
  }
  return { mat, cache, textures, texture };
}

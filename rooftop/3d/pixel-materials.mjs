// Original pixel painting recipes, informed by the user's low-poly reference sheets.
// Material information lives in integer texels, never screen-space noise or copied art.
export const PIXEL_STYLE = {
  id: "painted-lowpoly-v1",
  textureSize: 64,
  texelsPerUnit: 16,
  renderScale: 1.2,
  palette: {
    metal: "#596472",
    metalLight: "#a1aaa5",
    metalDark: "#303c43",
    wood: "#956737",
    woodLight: "#bf9258",
    woodDark: "#5d432b",
    white: "#d4cebb",
    blue: "#57838a",
    blueDark: "#324f5a",
    soil: "#50402d",
    tile: "#b3aca0",
    wall: "#c9c5b3",
    cap: "#ded8c5",
  },
};

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
];

// [x, y, width, height, palette index]. Clusters are intentional shapes and seams.
export function pixelPainting(kind) {
  const commands = [],
    add = (x, y, w, h, ink) => commands.push([x, y, w, h, ink]);
  let ramp = ["#51555c", "#747880", "#999b9c", "#bec0bb", "#e6e4d5"],
    size = 64;
  add(0, 0, size, size, 3);
  if (kind === "wood") {
    ramp = ["#4d4337", "#77684e", "#a49372", "#d1bf94", "#f0dbac"];
    for (let y = 0; y < 64; y += 16) {
      add(0, y, 64, 1, 0);
      add(0, y + 1, 64, 1, 4);
      add(0, y + 14, 64, 2, 1);
      for (let j = 0; j < 7; j++) {
        const x = (j * 19 + y * 3) % 64,
          yy = y + 3 + ((j * 5) % 9);
        add(x, yy, 7 + ((j * 3) % 14), 1, j % 3 === 0 ? 4 : 2);
        if (j % 2) add(x + 2, yy + 1, 5, 1, 1);
      }
    }
    for (const [x, y] of [
      [18, 8],
      [47, 39],
    ]) {
      add(x, y, 7, 1, 1);
      add(x - 2, y + 1, 11, 1, 2);
      add(x + 1, y + 2, 4, 1, 0);
      add(x - 3, y + 3, 13, 1, 4);
      add(x, y + 4, 7, 1, 2);
    }
    add(7, 16, 1, 16, 1);
    add(42, 32, 1, 16, 1);
    add(56, 48, 1, 16, 1);
  } else if (kind === "brick" || kind === "roof") {
    ramp =
      kind === "brick"
        ? ["#675952", "#948578", "#b3a090", "#d3b9a2", "#eed3b3"]
        : ["#3a4b51", "#637f80", "#8ca7a1", "#b4c5b4", "#d4dfc8"];
    const bw = kind === "brick" ? 16 : 8,
      bh = kind === "brick" ? 8 : 12;
    for (let row = 0, y = 0; y < 64; row++, y += bh) {
      add(0, y, 64, 1, 0);
      for (let x = (-(row % 2) * bw) / 2, k = 0; x < 64; x += bw, k++) {
        add(x + 1, y + 1, bw - 2, bh - 2, 2 + ((k + row) % 2));
        add(x + 1, y + 1, bw - 2, 1, 4);
        add(x + bw - 1, y + 1, 1, bh - 1, 0);
        add(x + 2, y + bh - 2, bw - 3, 1, 1);
        if ((row + k) % 3 === 0) add(x + 4, y + 3, 4, 2, 1);
      }
    }
  } else if (kind === "wall") {
    ramp = ["#70776c", "#989c8b", "#b9bbaa", "#dddfce", "#f6f1da"];
    for (const [x, y, w, h] of [
      [4, 13, 11, 3],
      [8, 16, 5, 2],
      [45, 8, 8, 2],
      [51, 10, 5, 3],
      [33, 44, 14, 3],
      [30, 47, 5, 3],
      [52, 52, 12, 2],
      [0, 52, 3, 2],
      [18, 32, 6, 2],
      [21, 34, 3, 4],
    ]) {
      add(x, y, w, h, 2);
      add(x + 2, y + 1, Math.max(2, w - 5), 1, 1);
    }
    add(35, 2, 1, 8, 2);
    add(36, 9, 2, 1, 2);
    add(38, 10, 1, 5, 2);
    add(10, 55, 1, 3, 1);
    add(11, 58, 3, 1, 1);
    add(13, 59, 1, 5, 1);
    for (const [x, y] of [
      [24, 7],
      [4, 37],
      [56, 25],
      [42, 61],
    ])
      add(x, y, 4, 1, 4);
  } else if (kind === "metal" || kind === "paint") {
    for (const [x, y, w, h] of [
      [3, 5, 10, 2],
      [5, 7, 4, 2],
      [39, 14, 16, 1],
      [45, 15, 4, 2],
      [15, 36, 9, 2],
      [17, 38, 3, 2],
      [48, 52, 12, 2],
    ]) {
      add(x, y, w, h, 2);
      add(x + 1, y + 1, Math.max(1, w - 4), 1, 4);
    }
    add(29, 0, 1, 64, 2);
    add(30, 0, 1, 64, 4);
    add(8, 26, 2, 2, 1);
    add(9, 27, 2, 1, 4);
    add(55, 45, 2, 2, 1);
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
  } else if (kind === "clay") {
    ramp = ["#77635b", "#9d8877", "#c3ae94", "#e4d2b6", "#fff0d1"];
    add(0, 6, 64, 2, 2);
    add(0, 8, 64, 1, 4);
    add(0, 52, 64, 2, 1);
    add(0, 54, 64, 1, 4);
    for (const [x, y] of [
      [9, 24],
      [36, 37],
      [51, 18],
    ]) {
      add(x, y, 5, 2, 2);
      add(x + 1, y + 2, 2, 1, 1);
      add(x + 5, y - 1, 3, 1, 4);
    }
  } else if (kind === "soil" || kind === "asphalt") {
    ramp = ["#626360", "#848680", "#a5a89d", "#c6c8bb", "#e1dfcc"];
    for (let j = 0; j < 34; j++) {
      const x = (j * 23 + 3) % 64,
        y = (j * 17 + 11) % 64;
      add(x, y, 2 + (j % 3), 1 + (j % 2), j % 5);
      if (j % 4 === 0) add(x + 1, y + 1, 2, 1, 2);
    }
    if (kind === "asphalt") {
      add(4, 45, 20, 1, 1);
      add(23, 43, 1, 3, 1);
      add(24, 42, 8, 1, 1);
    }
  } else if (kind === "cloth") {
    for (let x = 0; x < 64; x += 16) {
      add(x, 0, 1, 64, 2);
      add(x + 1, 0, 1, 64, 4);
    }
    for (let y = 0; y < 64; y += 16) add(0, y, 64, 1, 2);
    add(7, 7, 1, 10, 4);
    add(55, 39, 1, 14, 1);
  } else if (
    kind.startsWith("leaf") ||
    kind === "canopy" ||
    kind === "cactus"
  ) {
    ramp = ["#72767a", "#999c9e", "#bec0b8", "#dddccc", "#f3ebd6"];
    add(0, 0, 64, 64, 2);
    if (kind === "cactus") {
      for (let x = 0; x < 64; x += 12) {
        add(x, 0, 2, 64, 0);
        add(x + 2, 0, 2, 64, 3);
        for (let y = 4; y < 64; y += 10) {
          add(x + 3, y, 2, 2, 4);
          add(x + 4, y + 1, 1, 3, 3);
        }
      }
    } else {
      for (let j = 0; j < 18; j++) {
        const x = (j * 19 + 7) % 64,
          y = (j * 13 + 3) % 64;
        add(x, y, 4 + (j % 4), 3, j % 3 === 0 ? 0 : 3);
        add(x + 2, y + 3, 3, 2, 1);
        add(x + 1, y, 3, 1, 4);
      }
      if (kind === "leaf") {
        add(30, 0, 2, 64, 1);
        add(32, 0, 1, 64, 3);
      }
    }
  } else if (kind.includes("glass")) {
    ramp = ["#202b30", "#334749", "#557074", "#8baba6", "#c0cbc0"];
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
    ramp = ["#565a59", "#848982", "#afafa0", "#d1d0be", "#eee8d2"];
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
    add(47, 18, 4, 3, 1);
    add(53, 18, 3, 3, 1);
    for (let y = 31; y < 45; y += 3) add(47, y, 10, 1, 1);
    add(7, 51, 48, 2, 2);
    add(7, 55, 48, 1, 1);
    add(8, 60, 8, 4, 0);
    add(48, 60, 8, 4, 0);
  } else if (kind === "panel-door") {
    ramp = ["#252e34", "#454f55", "#737e80", "#a6aba1", "#d5d0b8"];
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

export function paintPixels(ctx, kind, tint) {
  const { size, ramp, commands } = pixelPainting(kind);
  let palette = ramp;
  if (tint) {
    const rgb = [1, 3, 5].map((i) => parseInt(tint.slice(i, i + 2), 16));
    palette = ramp.map(
      (hex) =>
        "#" +
        [1, 3, 5]
          .map((i, k) =>
            Math.min(
              255,
              Math.round((parseInt(hex.slice(i, i + 2), 16) * rgb[k]) / 210),
            )
              .toString(16)
              .padStart(2, "0"),
          )
          .join(""),
    );
  }
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
    paintPixels(c.getContext("2d"), kind);
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
      panel = kind.startsWith("panel-");
    const m = new T.MeshLambertMaterial({
      color,
      map: texture(kind),
      flatShading: true,
    });
    m.userData.kind = kind;
    m.customProgramCacheKey = () =>
      "pixel-" +
      (wind ? "wind-" + kind : "static") +
      (panel ? "-panel" : "-surface");
    m.onBeforeCompile = (shader) => {
      shader.vertexShader =
        "varying vec3 vPaintPosition; varying vec3 vPaintNormal;\n" +
        shader.vertexShader;
      shader.fragmentShader =
        "varying vec3 vPaintPosition; varying vec3 vPaintNormal;\n" +
        shader.fragmentShader;
      let position = `#include <begin_vertex>\nvec3 paintScale = vec3(1.0);\n#ifdef USE_INSTANCING\npaintScale = vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));\n#endif\nvPaintPosition=position*paintScale; vPaintNormal=normal;`;
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
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        panel
          ? `#ifdef USE_MAP\nvec4 painted = texture2D(map,vMapUv); diffuseColor *= painted;\n#endif`
          : `#ifdef USE_MAP\nvec3 axis=abs(vPaintNormal);\nvec2 surface=axis.x>axis.y&&axis.x>axis.z?vPaintPosition.zy:axis.y>axis.z?vPaintPosition.xz:vPaintPosition.xy;\nvec4 painted=texture2D(map,surface/4.0); diffuseColor*=painted;\n#endif`,
      );
      // Fine output pixels; all texture detail remains attached to the model when rotated.
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <dithering_fragment>",
        "gl_FragColor.rgb = floor(gl_FragColor.rgb * 63.0 + 0.5) / 63.0;",
      );
    };
    cache.set(key, m);
    return m;
  }
  return { mat, cache, textures, texture };
}

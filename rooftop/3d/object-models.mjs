import { buildBalconyExtra } from "./balcony-models.mjs";
import { supportSurfaces } from "./placement-profiles.mjs";
import { paintWeapon } from "../weapons.mjs";
import { buildSoilBag } from "./soft-goods.mjs";
import { buildGlassCase } from "./glass-cases.mjs";
import { buildGardenTool } from "./garden-tools.mjs";
import { finishObject } from "./object-finish.mjs";

import { OBJECT_DIMENSIONS } from "./object-dimensions.mjs";
export { OBJECT_DIMENSIONS } from "./object-dimensions.mjs";

export function buildObject(api, g, a, o) {
  const {
    T,
    box,
    cyl,
    beam,
    group,
    ellipsoid,
    shade,
    P,
    stand,
    basin,
    terrarium,
    waterBowl,
    fishSchool,
    waterSurface,
    makePot,
  } = api;
  if (a.weapon) {
    buildCollectionModel(api, g, a);
    return;
  }
  if (a.vessel) {
    makePot(g, a.vessel, 0.67, 0.58, true);
    return;
  }
  const dd = OBJECT_DIMENSIONS[a.id];
  if (!dd) throw Error("物件尚无结构模型：" + a.id);
  const [w, d, h] = dd.map((n) => n / 16),
    type = a.id;
  if (buildBalconyExtra(api,g,type,w,d,h)) return;
  if (buildGardenTool(api,g,type)) return;
  if (["terrarium","wardcase"].includes(type)) {buildGlassCase(api,g,type,w,d,h);return;}
  const slats = (y, width = w, depth = d, col = P.wood) => {
    for (let j = 0; j < 6; j++)
      box(
        g,
        0,
        y,
        -depth * 0.42 + j * depth * 0.168,
        width,
        0.1,
        depth * 0.145,
        shade(col,[1,.94,1.07,.98,1.03,.91][j]),
        "wood",
      );
  };
  const legs = (height = h) => {
    for (const x of [-w * 0.43, w * 0.43])
      for (const z of [-d * 0.4, d * 0.4])
        box(g, x, height * 0.5, z, 0.12, height, 0.12, P.woodDark, "wood");
  };
  const ring = (rad, y, col, thick = 0.055) => {
    for (let j = 0; j < 32; j++) {
      const a = (j * Math.PI) / 16;
      box(
        g,
        Math.cos(a) * rad,
        y,
        Math.sin(a) * rad,
        ((2 * Math.PI * rad) / 32) * 1.12,
        0.065,
        thick,
        col,
        "plain",
        0,
        -a - Math.PI / 2,
      );
    }
  };
  const tray = (ww, dep, height, col, soil = false, kind = "metal") => {
    box(g, 0, 0.035, 0, ww, 0.07, dep, col, kind);
    for (const x of [-ww * 0.5, ww * 0.5])
      box(g, x, height * 0.5, 0, 0.075, height, dep, col,kind);
    for (const z of [-dep * 0.5, dep * 0.5])
      box(g, 0, height * 0.5, z, ww, height, 0.075, col,kind);
    if (soil)
      box(g, 0, height * 0.8, 0, ww - 0.15, 0.035, dep - 0.15, P.soil, "soil");
  };
  const hollowBowl = (rad, height, col, kind = "metal") => {
    if (api.profile) {
      api.profile(
        g,
        [
          [0.01, 0],
          [0.66, 0],
          [0.99, 0.88],
          [1.03, 1],
          [0.89, 1],
          [0.86, 0.85],
          [0.58, 0.16],
          [0.01, 0.16],
          [0.01, 0],
        ].map(([r, y]) => [r * rad, y * height]),
        12,
        col,
        kind,
      );
      return;
    }
    const layers = Math.ceil(height / 0.06);
    for (let k = 0; k < layers; k++) {
      const t = (k + 0.5) / layers,
        rr = rad * (0.66 + 0.34 * t);
      ring(rr, t * height, col, 0.08);
    }
    cyl(g, 0, 0.035, 0, rad * 0.66, rad * 0.66, 0.06, shade(col, 0.7), 16);
    ring(rad, height, shade(col, 1.18), 0.085);
  };
  if (
    [
      "shelf",
      "woodshelf",
      "tierstand",
      "ladderstand",
      "wallrack",
      "basketstand",
      "wirestand",
      "coveredstand",
      "foamstand",
      "lowplatform",
      "bench",
      "stool",
      "pottingbench",
    ].includes(type)
  ) {
    stand(g, w, d, h, type);
    if (type === "basketstand")
      for (const surface of supportSurfaces({type})) {
        const y = surface.y - surface.thickness/2;
        for (const z of [-d * 0.46, d * 0.46]) {
          box(g, 0, y + 0.2, z, w, 0.04, 0.04, P.white);
          for (let j = 0; j < 8; j++)
            box(
              g,
              -w * 0.43 + j * w * 0.12,
              y + 0.1,
              z,
              0.027,
              0.22,
              0.027,
              P.white,
            );
        }
        for (const x of [-w * 0.48, w * 0.48])
          box(g, x, y + 0.2, 0, 0.04, 0.04, d, P.white);
      }
    if (type === "wallrack")
      for (const x of [-w * 0.45, w * 0.45])
        beam(g, [x, 0.1, -d * 0.4], [x, h, -d * 0.4], 0.07, P.metalDark);
  } else if (type === "table") {
    legs();
    slats(h);
    box(g, 0, h * 0.7, -d * 0.41, w, 0.12, 0.11, P.woodDark, "wood");
  } else if (type === "plantcart") {
    for (const x of [-w * 0.43, w * 0.43])
      for (const z of [-d * 0.4, d * 0.4])
        box(g, x, h * 0.5, z, 0.065, h, 0.065, P.metalDark);
    for (const surface of supportSurfaces({type})) {
      const y = surface.y - surface.thickness/2;
      box(g, 0, y, 0, w, 0.06, d, P.metal, "metal");
      for (const x of [-w * 0.5, w * 0.5])
        box(g, x, y + 0.07, 0, 0.045, 0.14, d, P.metal);
      for (const z of [-d * 0.5, d * 0.5])
        box(g, 0, y + 0.07, z, w, 0.14, 0.045, P.metal);
    }
    for (const x of [-w * 0.42, w * 0.42])
      for (const z of [-d * 0.37, d * 0.37]) {
        const wheel=group(g,x,.14,z);wheel.rotation.z=Math.PI/2;
        cyl(wheel,0,0,0,.12,.12,.08,"#455c57",16,"metal");
        cyl(wheel,0,.045,0,.038,.038,.012,P.metalLight,8,"metal");
        box(g, x, 0.31, z, 0.06, 0.18, 0.07, P.metalLight);
      }
    for (const z of [-d * 0.42, d * 0.42])
      box(g, w * 0.5, h + 0.05, z, 0.06, 0.28, 0.06, P.metal);
    box(g, w * 0.5, h + 0.19, 0, 0.06, 0.06, d * 0.85, P.metal);
  } else if (type === "sink" || type === "basin") basin(g, w, d, h, type);
  else if (type === "terrarium") terrarium(g, w, d, h);
  else if (type === "gardenbench") {
    legs(h * 0.48);
    slats(h * 0.5, w, d);
    for (const x of [-w * 0.46, w * 0.46])
      box(g, x, h * 0.7, -d * 0.44, 0.12, h * 0.62, 0.11, P.woodDark, "wood");
    for (let j = 0; j < 4; j++)
      box(
        g,
        0,
        h * (0.65 + j * 0.095),
        -d * 0.43,
        w,
        0.1,
        0.12,
        P.wood,
        "wood",
      );
    for (const x of [-w * 0.46, w * 0.46])
      box(g, x, h * 0.66, 0, 0.12, 0.09, d * 0.82, P.woodDark, "wood");
  } else if (type === "foldingchair") {
    for (const x of [-w * 0.42, w * 0.42]) {
      beam(g, [x, 0.04, -d * 0.44], [x, h * 0.59, d * 0.31], 0.09, P.woodDark);
      beam(g, [x, 0.04, d * 0.44], [x, h, -d * 0.35], 0.09, P.woodDark);
      box(g, x, h * 0.35, 0, 0.14, 0.1, 0.13, P.metal);
    }
    slats(h * 0.52, w * 0.88, d * 0.74);
    for (let j = 0; j < 4; j++)
      box(
        g,
        0,
        h * (0.69 + j * 0.085),
        -d * 0.34,
        w * 0.85,
        0.11,
        0.095,
        P.wood,
        "wood",
      );
  } else if (type === "bistrotable") {
    cyl(g, 0, h, 0, w * 0.5, w * 0.5, 0.1, P.metal, 24);
    ring(w * 0.5, h, P.metalLight, 0.04);
    for (const s of [-1, 1]) {
      beam(
        g,
        [-w * 0.3, 0.05, s * d * 0.2],
        [w * 0.15, h, s * d * 0.2],
        0.06,
        P.metalDark,
      );
      beam(
        g,
        [w * 0.3, 0.05, s * d * 0.2],
        [-w * 0.15, h, s * d * 0.2],
        0.06,
        P.metalDark,
      );
    }
  } else if (type === "trellis") {
    for (const x of [-w * 0.45, w * 0.45])
      box(g, x, h * 0.5, 0, 0.1, h, 0.1, P.woodDark, "wood");
    for (let j = 0; j < 6; j++)
      box(
        g,
        -w * 0.4 + j * w * 0.16,
        h * 0.57,
        0,
        0.06,
        h * 0.83,
        0.075,
        P.wood,
        "wood",
      );
    for (let j = 0; j < 8; j++)
      box(g, 0, h * (0.18 + j * 0.1), 0.025, w, 0.055, 0.075, P.wood, "wood");
    for (const x of [-w * 0.45, w * 0.45])
      beam(g, [x, 0, d * 0.4], [x, h * 0.22, 0], 0.1, P.woodDark);
  } else if (type === "storagechest") {
    tray(w, d, h, P.wood, false, "wood");
    slats(h + 0.03, w * 1.03, d * 1.03);
    for (let j = 0; j < 6; j++)
      for (const z of [-d * 0.51, d * 0.51])
        box(g, 0, h * (0.1 + j * 0.15), z, w, 0.055, 0.025, P.woodDark);
    box(g, 0, h * 0.7, d * 0.53, 0.4, 0.06, 0.075, P.metalDark);
  } else if (type.startsWith("room-")) {
    if (type === "room-bed") {
      legs(h * 0.45);
      box(g, 0, h * 0.39, 0, w, 0.16, d, P.wood, "wood");
      for (const z of [-d * 0.47, d * 0.47])
        box(
          g,
          0,
          h * (z < 0 ? 0.67 : 0.33),
          z,
          w,
          h * (z < 0 ? 0.66 : 0.28),
          0.14,
          P.wood,
          "wood",
        );
      box(g, 0, h * 0.53, 0, w * 0.92, 0.24, d * 0.92, "#c7bfa5", "cloth");
      box(
        g,
        0,
        h * 0.64,
        d * 0.18,
        w * 0.95,
        0.12,
        d * 0.54,
        "#7e8b79",
        "cloth",
      );
      for (let j = 0; j < 5; j++)
        box(
          g,
          0,
          h * 0.71,
          d * (-0.02 + j * 0.095),
          w * 0.91,
          0.018,
          0.035,
          "#b3bba1",
        );
      box(
        g,
        0,
        h * 0.7,
        -d * 0.31,
        w * 0.69,
        0.16,
        d * 0.18,
        "#d8cfb5",
        "cloth",
      );
    } else if (type === "room-wardrobe" || type === "room-dresser") {
      legs(0.19);
      box(g, 0, h * 0.53, 0, w, h * 0.9, d, P.wood, "wood");
      box(g, 0, h, 0, w * 1.03, 0.12, d * 1.04, P.woodLight, "wood");
      const drawer = type === "room-dresser";
      for (let j = 0; j < (drawer ? 3 : 2); j++) {
        const x = drawer ? 0 : (j - 0.5) * w * 0.49,
          y = drawer ? h * (0.25 + j * 0.29) : h * 0.54;
        box(
          g,
          x,
          y,
          d * 0.52,
          drawer ? w * 0.94 : w * 0.47,
          drawer ? h * 0.265 : h * 0.84,
          0.065,
          P.woodLight,
          "wood",
        );
        for (const xx of drawer
          ? [-w * 0.25, w * 0.25]
          : [x + (j ? -0.12 : 0.12)])
          box(g, xx, y, d * 0.57, 0.075, 0.075, 0.07, P.woodDark);
      }
    } else {
      legs(h * 0.3);
      box(g, 0, h * 0.41, 0, w * 0.92, h * 0.18, d * 0.84, "#788879", "cloth");
      box(
        g,
        0,
        h * 0.76,
        -d * 0.37,
        w * 0.84,
        h * 0.53,
        d * 0.18,
        "#788879",
        "cloth",
      );
      for (const x of [-w * 0.44, w * 0.44]) {
        box(g, x, h * 0.58, 0, w * 0.16, h * 0.4, d * 0.88, "#677766", "cloth");
        box(
          g,
          x * 0.85,
          h * 0.84,
          -d * 0.28,
          0.13,
          h * 0.28,
          d * 0.22,
          "#84927f",
          "cloth",
        );
      }
      for (const x of [-w * 0.2, w * 0.2])
        for (const y of [h * 0.76, h * 0.88])
          box(g, x, y, -d * 0.25, 0.035, 0.035, 0.035, "#5a6d5d");
    }
  } else if (type === "ceramicseat") {
    api.profile(g, [[.001,0],[w*.31,0],[w*.38,h*.07],[w*.46,h*.28],
      [w*.48,h*.61],[w*.39,h*.92],[w*.34,h],[.001,h],[.001,0]],
      16, "#d3cebb", "pot-blue");
    cyl(g,0,h+.025,0,w*.355,w*.355,.065,P.white,16,"enamel");
    for (const y of [h*.10,h*.86])
      ring(w*(y<h*.5?.38:.40),y,"#577887",.040);
  } else if (
    [
      "pond",
      "medakabowl",
      "goldfishbowl",
      "enamelbowl",
      "pigbowl",
      "strainer",
    ].includes(type)
  ) {
    const col =
      type === "goldfishbowl" || type === "enamelbowl"
        ? P.white
        : type === "medakabowl"
          ? "#8c7454"
          : type === "pigbowl"
            ? "#b9ad8a"
            : P.blue;
    if (["pond", "medakabowl", "goldfishbowl"].includes(type)) {
      waterBowl(g, w * .47, h * .8, type);
    } else {
      hollowBowl(w * .47, h * .8, col, "enamel");
      ring(w * .47, h * .8, type === "enamelbowl" ? P.blueDark : P.metalLight, .055);
      if (type === "strainer") {
        for (let x = -w*.32; x < w*.33; x += .10)
          for (let z = -d*.32; z < d*.33; z += .10)
            if (Math.hypot(x,z) < w*.32)
              box(g, x, .074, z, .03, .016, .03, P.metalDark);
      } else if (type === "pigbowl") {
        cyl(g, 0, h*.42, 0, w*.32, w*.32, .035, "#8b7f5f", 16, "soil");
        for (let j=0;j<9;j++)
          ellipsoid(g, Math.sin(j*2.4)*w*.22, h*.45, Math.cos(j*2.4)*d*.19, .035,.025,.035,"#b19a6a");
      } else if (type === "enamelbowl") {
        cyl(g, 0, .1, 0, w*.24, w*.30, .16, P.white, 12, "enamel");
      }
    }
  } else if (
    [
      "crate",
      "redbox",
      "seedtray",
      "foambox",
      "fishbox",
      "fish",
      "mossbox",
    ].includes(type)
  ) {
    const col = /foam|mossbox/.test(type)
      ? P.white
      : type === "redbox"
        ? "#93685d"
        : P.blue;
    tray(w, d, h, col, ["seedtray", "foambox", "mossbox"].includes(type));
    if (/crate|fish/.test(type)) {
      for (const z of [-d * 0.54, d * 0.54]) {
        for (let j = 0; j < 4; j++)
          box(
            g,
            0,
            h * (0.2 + j * 0.19),
            z,
            w * 0.94,
            0.027,
            0.024,
            P.blueDark,
          );
        box(g, 0, h * 0.78, z, w * 0.33, 0.075, 0.034, P.blueDark);
      }
    }
    if (/fish/.test(type)) {
      waterSurface(g, w*.87, d*.82, h*.83);
      fishSchool(g, w*.8, d*.76, h*.83);
      for (const z of [-d*.47, d*.47])
        box(g, 0, h, z, w, .035, .08, P.blueDark, "metal");
    }
    if (type === "seedtray")
      for (let x = -2; x < 3; x++)
        for (let z = -1; z <= 1; z++) {
          box(
            g,
            x * w * 0.16,
            h + 0.02,
            z * d * 0.28,
            w * 0.14,
            0.025,
            d * 0.25,
            P.soil,
          );
          box(
            g,
            x * w * 0.16,
            h + 0.035,
            z * d * 0.28,
            0.025,
            0.024,
            0.025,
            "#bdad79",
          );
        }
    if (type === "mossbox")
      for (let k = 0; k < 30; k++)
        ellipsoid(
          g,
          Math.sin(k * 2.4) * w * 0.4,
          h + 0.045,
          Math.cos(k * 1.3) * d * 0.39,
          0.11,
          0.08,
          0.10,
          k % 3 ? "#6b815d" : "#8b9b72",
          "canopy",
        );
  } else if (type === "moss") {
    hollowBowl(w * 0.45, 0.16, "#8d7454");
    for (let k = 0; k < 45; k++)
      ellipsoid(
        g,
        Math.sin(k * 2.4) * w * 0.4,
        0.2,
        Math.cos(k * 1.3) * d * 0.39,
        0.14,
        0.09,
        0.12,
        k % 3 ? "#6b815d" : "#8b9b72",
        "canopy",
      );
  } else if (type === "pot") makePot(g, "terra", w * 0.45, h, true);
  else if (type === "wirebasket") {
    for (let x = -w * 0.5; x <= w * 0.5; x += 0.12) {
      box(g, x, 0.04, 0, 0.025, 0.035, d, P.white);
      for (const z of [-d * 0.5, d * 0.5])
        box(g, x, h * 0.5, z, 0.025, h, 0.025, P.white);
    }
    for (let y = 0.1; y < h; y += 0.12) {
      for (const z of [-d * 0.5, d * 0.5])
        box(g, 0, y, z, w, 0.025, 0.025, P.white);
      for (const x of [-w * 0.5, w * 0.5])
        box(g, x, y, 0, 0.025, 0.025, d, P.white);
    }
    for (const x of [-w * 0.46, w * 0.46])
      beam(g, [x, h, -d * 0.3], [x, h + 0.24, 0], 0.045, P.woodLight);
    box(g, 0, h + 0.24, 0, w * 0.9, 0.045, 0.06, P.woodLight, "wood");
  } else if (type === "browncover") {
    makePot(g, "terra", w * 0.41, 0.23, true);
    const glass = new T.Mesh(
      new T.SphereGeometry(w * 0.44, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new T.MeshLambertMaterial({
        color: "#a8b8a6",
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      }),
    );
    glass.position.y = 0.18;
    g.add(glass);
    ring(w * 0.44, 0.18, P.woodLight, 0.055);
    box(g, 0, w * 0.44 + 0.18, 0, 0.11, 0.09, 0.11, P.wood);
  } else if (type === "drying") {
    for (const x of [-w * 0.43, w * 0.43]) {
      beam(g, [x, 0, -d * 0.45], [x, h * 0.72, d * 0.45], 0.055, P.metalLight);
      beam(g, [x, 0, d * 0.45], [x, h * 0.72, -d * 0.45], 0.055, P.metalLight);
    }
    for (let j = 0; j < 10; j++)
      box(
        g,
        0,
        h * 0.72,
        -d * 0.44 + j * d * 0.098,
        w,
        0.035,
        0.035,
        P.metalLight,
      );
    for (let j = 0; j < 5; j++)
      box(
        g,
        -w * 0.38 + j * w * 0.19,
        h * 0.43,
        0,
        w * 0.15,
        h * 0.5,
        0.02,
        "#aeb8ab",
        "cloth",
      );
  } else if (type === "hose") {
    for (let k = 0; k < 4; k++)
      ring(w * (0.45 - k * 0.085), 0.055, "#47655b", 0.085);
    beam(g, [w * 0.45, 0.055, 0], [w * 0.52, 0.055, 0.28], 0.09, "#47655b");
    box(g, w * 0.52, 0.055, 0.3, 0.13, 0.13, 0.13, "#a99573");
  } else if (type === "tools" || type === "brush") {
    box(g, 0, 0.06, 0, 0.095, 0.1, w * 0.74, P.wood, "wood");
    if (type === "brush") {
      box(g, 0, 0.1, w * 0.32, 0.31, 0.1, 0.25, P.woodLight);
      for (let j = 0; j < 7; j++)
        box(g, -0.13 + j * 0.042, 0.05, w * 0.42, 0.03, 0.08, 0.2, "#a99b78");
    } else {
      box(g, 0, 0.07, w * 0.34, 0.27, 0.065, 0.34, P.metalLight);
      box(g, 0, 0.08, w * 0.49, 0.17, 0.03, 0.12, P.metal);
      box(g, 0.32, 0.05, 0, 0.08, 0.07, w * 0.61, P.wood);
      for (let j = 0; j < 3; j++)
        box(
          g,
          0.24 + j * 0.075,
          0.065,
          w * 0.33,
          0.035,
          0.05,
          0.24,
          P.metalLight,
        );
    }
  } else if (type === "teaset") {
    tray(w, d, 0.075, P.woodLight, false, "wood");
    ellipsoid(g, -0.1, 0.24, 0, 0.25, 0.18, 0.24, P.white, 0.05, 12);
    cyl(g, -0.1, 0.39, 0, 0.2, 0.2, 0.025, P.white, 12);
    box(g, -0.1, 0.44, 0, 0.075, 0.07, 0.075, P.woodDark);
    beam(g, [0.1, 0.25, 0], [0.39, 0.32, 0], 0.09, P.white);
    for (const s of [-1, 1])
      beam(g, [-0.32, 0.2, s * 0.1], [-0.4, 0.35, s * 0.1], 0.035, P.wood);
    beam(g, [-0.4, 0.35, -0.1], [-0.4, 0.35, 0.1], 0.035, P.wood);
    for (const x of [-0.52, 0.48]) {
      hollowCup(x, 0.15, 0.24);
    }
  } else if (type === "soilbag") {
    buildSoilBag(api,g,w,d,h);
  } else if (type === "towel") {
    box(g, 0, 0.04, 0, w, 0.075, d, "#b7bba7", "cloth");
    for (let j = 0; j < 6; j++)
      box(
        g,
        -w * 0.44 + j * w * 0.17,
        0.088,
        0,
        0.025,
        0.021,
        d * 0.98,
        "#9ca89d",
      );
    for (let j = 0; j < 10; j++)
      box(
        g,
        -w * 0.44 + j * w * 0.096,
        0.045,
        d * 0.53,
        0.023,
        0.035,
        0.11,
        "#b7bba7",
      );
  } else if (type === "gloves") {
    for (const x of [-0.22, 0.22]) {
      box(g, x, 0.08, -0.02, 0.24, 0.12, 0.32, "#b8b698", "cloth");
      box(g, x, 0.075, -0.23, 0.25, 0.09, 0.1, "#7a8d7b", "cloth");
      for (let j = 0; j < 4; j++)
        box(
          g,
          x - 0.09 + j * 0.06,
          0.07,
          0.22,
          0.045,
          0.09,
          0.22 - (j % 2) * 0.04,
          "#b8b698",
        );
      box(
        g,
        x + (x < 0 ? -0.15 : 0.15),
        0.08,
        0.04,
        0.095,
        0.1,
        0.15,
        "#b8b698",
      );
    }
  } else if (type === "labels") {
    for (let j = 0; j < 4; j++) {
      box(g, (j - 1.5) * 0.2, 0.25, 0, 0.025, 0.5, 0.035, "#b2b094");
      box(g, (j - 1.5) * 0.2, 0.47, 0, 0.16, 0.13, 0.04, P.white);
      box(g, (j - 1.5) * 0.2, 0.48, 0.025, 0.1, 0.015, 0.015, "#73806c");
    }
  } else if (type === "lid") {
    cyl(g, 0, 0.065, 0, w * 0.47, w * 0.47, 0.09, P.blue, 24);
    ring(w * 0.47, 0.1, P.blueDark);
    box(g, 0, 0.14, 0, 0.23, 0.055, 0.08, P.blueDark);
  } else if (type === "thermometer") {
    const dial = group(g, 0, h * 0.63, 0);
    dial.rotation.x = Math.PI / 2;
    cyl(dial, 0, 0, 0, w * 0.42, w * 0.42, 0.12, P.white, 16);
    cyl(dial, 0, 0.074, 0, w * 0.35, w * 0.35, 0.025, "#c8c5a6", 16);
    for (let j = 0; j < 12; j++) {
      const a = (j * Math.PI) / 6;
      box(
        g,
        Math.cos(a) * w * 0.3,
        h * 0.63 + Math.sin(a) * w * 0.3,
        0.082,
        0.025,
        0.035,
        0.024,
        "#71806b",
      );
    }
    beam(
      g,
      [0, h * 0.63, 0.096],
      [w * 0.23, h * 0.73, 0.096],
      0.027,
      "#8e725e",
    );
    box(g, 0, h * 0.25, 0, 0.1, h * 0.5, 0.08, P.woodDark);
  } else if (
    ["solarlamp", "tasklamp", "tinlantern", "stringlights"].includes(type)
  ) {
    if (type === "solarlamp") {
      box(g, 0, h * 0.37, 0, 0.06, h * 0.74, 0.065, P.metalDark);
      box(g, 0, h * 0.75, 0, 0.4, 0.32, 0.4, "#b5c0a3", "light");
      box(g, 0, h * 0.87, 0, 0.51, 0.09, 0.51, P.metalDark);
      box(g, 0, h * 0.925, 0, 0.28, 0.018, 0.28, P.blueDark);
    } else if (type === "tasklamp") {
      cyl(g, 0, 0.06, 0, 0.34, 0.34, 0.09, P.metalDark, 16);
      beam(g, [0, 0.11, 0], [-0.22, h * 0.47, 0], 0.075, P.metal);
      beam(g, [-0.22, h * 0.47, 0], [0.22, h * 0.76, 0], 0.075, P.metal);
      for (const q of [
        [0, 0.11, 0],
        [-0.22, h * 0.47, 0],
        [0.22, h * 0.76, 0],
      ])
        box(g, ...q, 0.13, 0.13, 0.13, P.metalDark);
      cyl(g, 0.22, h * 0.78, 0, 0.15, 0.37, 0.3, P.white, 12);
      cyl(g, 0.22, h * 0.625, 0, 0.31, 0.31, 0.025, "#d8c79a", 12, "light");
    } else if (type === "tinlantern") {
      cyl(g, 0, h * 0.45, 0, w * 0.34, w * 0.34, h * 0.67, "#92917a", 16);
      cyl(g, 0, h * 0.82, 0, 0.03, w * 0.39, h * 0.21, "#777d6a", 12);
      for (let j = 0; j < 10; j++)
        for (let k = 0; k < 5; k++) {
          const a = (j * Math.PI) / 5;
          box(
            g,
            Math.cos(a) * w * 0.345,
            h * (0.18 + k * 0.12),
            Math.sin(a) * w * 0.345,
            0.03,
            0.04,
            0.035,
            "#d1bc86",
            "light",
          );
        }
      beam(g, [-0.14, h * 0.91, 0], [-0.1, h * 1.08, 0], 0.033, P.metal);
      beam(g, [-0.1, h * 1.08, 0], [0.1, h * 1.08, 0], 0.033, P.metal);
      beam(g, [0.1, h * 1.08, 0], [0.14, h * 0.91, 0], 0.033, P.metal);
    } else {
      for (const x of [-w * 0.47, w * 0.47])
        box(g, x, h * 0.5, 0, 0.04, h, 0.05, P.metalDark);
      let previous = null;
      for (let j = 0; j < 20; j++) {
        const t = j / 19,
          q = [(t - 0.5) * w, h * (0.94 - 0.25 * Math.sin(t * Math.PI)), 0];
        if (previous) beam(g, previous, q, 0.025, P.metalDark);
        if (j % 3 === 0) {
          box(g, q[0], q[1] - 0.085, 0, 0.03, 0.14, 0.03, P.metal);
          box(g, q[0], q[1] - 0.17, 0, 0.085, 0.11, 0.085, "#d2c296", "light");
        }
        previous = q;
      }
    }
  } else throw Error("物件缺少构造：" + type);
  finishObject(api, g, type, w, d, h);
  function hollowCup(x, y, z) {
    cyl(g, x, y, z, 0.12, 0.095, 0.18, P.white, 12);
    cyl(g, x, y + 0.095, z, 0.09, 0.09, 0.018, "#756956", 12);
  }
}

// Collection pieces retain the museum/official side profile, then get a rounded,
// material-dependent thickness. They are inert decorative objects, resting flat.
export function buildCollectionModel(api, g, a) {
  const { box } = api,
    canvas = document.createElement("canvas");
  canvas.width = 112;
  canvas.height = 72;
  const c = canvas.getContext("2d");
  c.translate(56, 36);
  paintWeapon(c, a);
  const pixels = c.getImageData(0, 0, 112, 72).data;
  const size = 0.043;
  for (let y = 0; y < 72; y++)
    for (let x = 0; x < 112; x++) {
      const i = (y * 112 + x) * 4;
      if (pixels[i + 3] < 100) continue;
      const color =
        "#" +
        [pixels[i], pixels[i + 1], pixels[i + 2]]
          .map((n) => n.toString(16).padStart(2, "0"))
          .join("");
      const warm = pixels[i] > pixels[i + 1] * 1.09,
        half = warm ? 0.12 : a.firearmArt?.slim ? 0.075 : 0.095;
      // Contiguous equal-colour runs preserve the sourced silhouette while removing
      // the old raised checkerboard of individual voxel caps.
      let end = x + 1;
      while (end < 112) {
        const next = (y * 112 + end) * 4;
        if (
          pixels[next + 3] < 100 ||
          pixels[next] !== pixels[i] ||
          pixels[next + 1] !== pixels[i + 1] ||
          pixels[next + 2] !== pixels[i + 2]
        )
          break;
        end++;
      }
      box(
        g,
        ((x + end - 1) / 2 - 56) * size,
        half + 0.04,
        (y - 36) * size,
        (end - x) * size,
        half * 2,
        size,
        color,
        warm ? "wood" : "metal",
      );
      x = end - 1;
    }
}

import { paintWeapon } from "../weapons.mjs";

// Width/depth/height in legacy layout units. Real references determine construction;
// scene scale remains compatible with existing saves, rather than claiming exact replicas.
export const OBJECT_DIMENSIONS = {
  moss: [28, 23, 7],
  mossbox: [36, 24, 12],
  fish: [36, 25, 16],
  pond: [31, 31, 12],
  terrarium: [66, 32, 25],
  shelf: [64, 32, 32],
  woodshelf: [52, 29, 34],
  bench: [40, 24, 10],
  sink: [52, 42, 17],
  basin: [64, 46, 13],
  table: [58, 32, 24],
  drying: [28, 23, 54],
  watering: [20, 13, 18],
  bucket: [18, 18, 20],
  crate: [30, 22, 14],
  redbox: [28, 24, 14],
  pot: [20, 20, 15],
  tools: [25, 17, 4],
  hose: [25, 25, 3],
  teaset: [30, 20, 10],
  pigbowl: [18, 18, 5],
  stool: [20, 18, 12],
  "room-bed": [46, 62, 24],
  "room-wardrobe": [44, 24, 52],
  "room-dresser": [42, 23, 28],
  "room-armchair": [32, 30, 34],
  tierstand: [48, 28, 38],
  ladderstand: [38, 26, 38],
  wallrack: [30, 22, 54],
  plantcart: [46, 28, 32],
  pottingbench: [60, 32, 28],
  gardenbench: [58, 25, 32],
  bistrotable: [36, 36, 22],
  foldingchair: [25, 26, 33],
  storagechest: [48, 29, 22],
  trellis: [38, 14, 52],
  wirestand: [58, 32, 40],
  foamstand: [46, 28, 20],
  basketstand: [28, 22, 32],
  coveredstand: [52, 32, 40],
  lowplatform: [48, 28, 12],
  ceramicseat: [28, 28, 29],
  wardcase: [44, 27, 35],
  enamelbowl: [29, 29, 17],
  browncover: [32, 32, 23],
  seedtray: [34, 22, 5],
  foambox: [38, 25, 16],
  thermometer: [15, 6, 24],
  strainer: [23, 23, 8],
  wirebasket: [30, 23, 13],
  towel: [24, 17, 2],
  soilbag: [23, 16, 23],
  labels: [18, 12, 17],
  gloves: [21, 19, 3],
  brush: [26, 10, 5],
  lid: [27, 27, 3],
  sprayer: [18, 15, 24],
  medakabowl: [35, 35, 19],
  goldfishbowl: [38, 38, 14],
  fishbox: [39, 29, 19],
  solarlamp: [16, 16, 30],
  tasklamp: [23, 17, 30],
  tinlantern: [21, 21, 31],
  stringlights: [48, 12, 27],
};

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
        col,
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
  const tray = (ww, dep, height, col, soil = false) => {
    box(g, 0, 0.035, 0, ww, 0.07, dep, col, "metal");
    for (const x of [-ww * 0.5, ww * 0.5])
      box(g, x, height * 0.5, 0, 0.075, height, dep, col);
    for (const z of [-dep * 0.5, dep * 0.5])
      box(g, 0, height * 0.5, z, ww, height, 0.075, col);
    if (soil)
      box(g, 0, height * 0.8, 0, ww - 0.15, 0.035, dep - 0.15, P.soil, "soil");
  };
  const hollowBowl = (rad, height, col) => {
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
      for (const y of [0.18, h * 0.52, h * 0.92]) {
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
    for (const y of [h * 0.13, h * 0.51, h * 0.9]) {
      box(g, 0, y, 0, w, 0.06, d, P.metal, "metal");
      for (const x of [-w * 0.5, w * 0.5])
        box(g, x, y + 0.07, 0, 0.045, 0.14, d, P.metal);
      for (const z of [-d * 0.5, d * 0.5])
        box(g, 0, y + 0.07, z, w, 0.14, 0.045, P.metal);
    }
    for (const x of [-w * 0.42, w * 0.42])
      for (const z of [-d * 0.37, d * 0.37]) {
        box(g, x, 0.12, z, 0.15, 0.22, 0.21, "#46574f");
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
    tray(w, d, h, P.wood);
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
  } else if (type === "wardcase") {
    tray(w, d, 0.17, P.wood);
    const glass = new T.Mesh(
      new T.BoxGeometry(w * 0.9, h * 0.61, d * 0.88),
      new T.MeshLambertMaterial({
        color: "#a4b8ab",
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      }),
    );
    glass.position.y = h * 0.41;
    g.add(glass);
    for (const x of [-w * 0.47, w * 0.47])
      for (const z of [-d * 0.46, d * 0.46])
        box(g, x, h * 0.4, z, 0.065, h * 0.7, 0.065, P.woodDark);
    for (const z of [-d * 0.46, d * 0.46])
      box(g, 0, h * 0.75, z, w, 0.06, 0.06, P.woodDark);
    for (const x of [-w * 0.47, 0, w * 0.47]) {
      beam(g, [x, h * 0.75, -d * 0.46], [x, h, 0], 0.06, P.woodDark);
      beam(g, [x, h, 0], [x, h * 0.75, d * 0.46], 0.06, P.woodDark);
    }
    box(g, 0, h, 0, w, 0.06, 0.06, P.woodDark);
    box(g, 0, h * 0.39, d * 0.48, 0.17, 0.07, 0.06, P.metal);
  } else if (type === "ceramicseat") {
    for (let j = 0; j < 12; j++) {
      const t = (j + 0.5) / 12,
        rad = w * (0.34 + 0.14 * Math.sin(Math.PI * t));
      ring(rad, t * h, "#c5c6b3", 0.085);
      if (j % 3 === 0)
        for (let k = 0; k < 16; k++) {
          const a = (k * Math.PI) / 8;
          box(
            g,
            Math.cos(a) * (rad + 0.02),
            t * h,
            Math.sin(a) * (rad + 0.02),
            0.05,
            0.07,
            0.05,
            "#577687",
          );
        }
    }
    cyl(g, 0, h, 0, w * 0.35, w * 0.35, 0.07, P.white, 20);
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
    hollowBowl(w * 0.47, h * 0.8, col);
    if (type === "strainer")
      for (let x = -w * 0.32; x < w * 0.33; x += 0.1)
        for (let z = -d * 0.32; z < d * 0.33; z += 0.1)
          if (Math.hypot(x, z) < w * 0.32)
            box(g, x, 0.074, z, 0.023, 0.016, 0.023, "#b9c2ad");
          else if (type === "pigbowl")
            cyl(g, 0, h * 0.42, 0, w * 0.32, w * 0.32, 0.035, "#8b7f5f", 16);
          else if (type === "enamelbowl") {
            cyl(g, 0, 0.1, 0, w * 0.24, w * 0.3, 0.16, P.white, 16);
          } else {
            cyl(g, 0, h * 0.73, 0, w * 0.41, w * 0.41, 0.025, "#789d93", 20);
            // Keep fish animation in its own group and correct water level.
            const fishes = group(g, 0, h * 0.74, 0);
            fishes.scale.set(0.58, 0.09, 0.58);
            waterBowl(fishes, w * 0.59, 0.2);
            for (let k = 0; k < (type === "goldfishbowl" ? 3 : 5); k++)
              box(
                g,
                (k - 2) * w * 0.105,
                h * 0.755,
                ((k % 2) - 0.5) * d * 0.2,
                0.12,
                0.024,
                0.045,
                type === "goldfishbowl" ? "#bf8d69" : "#c8b99b",
              );
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
      box(g, 0, h * 0.83, 0, w * 0.87, 0.022, d * 0.82, "#86a69c");
      for (let k = 0; k < 5; k++)
        box(
          g,
          (k - 2) * w * 0.13,
          h * 0.85,
          ((k % 2) - 0.5) * 0.25,
          0.13,
          0.03,
          0.045,
          "#cab698",
        );
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
        box(
          g,
          Math.sin(k * 2.4) * w * 0.4,
          h + 0.045,
          Math.cos(k * 1.3) * d * 0.39,
          0.08,
          0.08,
          0.08,
          k % 3 ? "#6b815d" : "#8b9b72",
        );
  } else if (type === "moss") {
    hollowBowl(w * 0.45, 0.16, "#8d7454");
    for (let k = 0; k < 45; k++)
      box(
        g,
        Math.sin(k * 2.4) * w * 0.4,
        0.2,
        Math.cos(k * 1.3) * d * 0.39,
        0.07,
        0.08,
        0.07,
        k % 3 ? "#6b815d" : "#8b9b72",
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
  } else if (type === "watering") {
    hollowBowl(0.34, 0.5, "#a18a70");
    cyl(g, 0, 0.45, 0, 0.32, 0.32, 0.08, "#a18a70", 16);
    beam(g, [0.25, 0.17, 0], [0.65, 0.42, 0], 0.09, "#a18a70");
    beam(g, [0.65, 0.42, 0], [0.81, 0.63, 0], 0.065, "#b09b7e");
    box(g, 0.82, 0.63, 0, 0.1, 0.055, 0.12, P.metalLight);
    for (const [aa, bb] of [
      [
        [-0.25, 0.4, 0],
        [-0.48, 0.53, 0],
      ],
      [
        [-0.48, 0.53, 0],
        [-0.4, 0.72, 0],
      ],
      [
        [-0.4, 0.72, 0],
        [0, 0.72, 0],
      ],
      [
        [0, 0.72, 0],
        [0.18, 0.5, 0],
      ],
    ])
      beam(g, aa, bb, 0.055, "#9b8066");
    box(g, 0, 0.5, 0, 0.13, 0.022, 0.14, "#534f41");
  } else if (type === "bucket") {
    hollowBowl(0.43, 0.68, "#88998b");
    for (let j = 0; j < 8; j++) {
      const a = (j * Math.PI) / 4;
      box(
        g,
        Math.cos(a) * 0.39,
        0.34,
        Math.sin(a) * 0.39,
        0.025,
        0.47,
        0.025,
        "#a6b5a2",
      );
    }
    for (const s of [-1, 1])
      beam(g, [s * 0.43, 0.56, 0], [s * 0.32, 0.96, 0], 0.036, P.metalLight);
    beam(g, [-0.32, 0.96, 0], [0.32, 0.96, 0], 0.036, P.metalLight);
    box(g, 0, 0.96, 0, 0.23, 0.06, 0.075, P.wood);
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
    tray(w, d, 0.075, P.woodLight);
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
    box(g, 0, h * 0.47, 0, w * 0.85, h * 0.86, d * 0.88, "#b1b59b", "cloth");
    box(g, 0, h * 0.95, 0, w * 0.72, 0.085, d * 0.76, "#c9c7ac");
    box(g, 0, h * 0.5, d * 0.46, w * 0.64, h * 0.32, 0.025, "#748366");
    for (let j = 0; j < 4; j++)
      box(
        g,
        0,
        h * (0.39 + j * 0.06),
        d * 0.485,
        w * 0.42,
        0.017,
        0.014,
        "#c9c7ac",
      );
    box(g, -w * 0.38, h * 0.5, 0, 0.035, h * 0.8, d * 0.9, "#969c81");
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
  } else if (type === "sprayer") {
    hollowBowl(0.32, 0.77, "#9ba995");
    cyl(g, 0, 0.82, 0, 0.2, 0.26, 0.17, P.blueDark, 12);
    box(g, 0, 1.06, 0, 0.28, 0.055, 0.12, P.blueDark);
    beam(g, [0, 0.9, 0], [0, 1.07, 0], 0.045, P.metalLight);
    beam(g, [0.18, 0.87, 0], [0.44, 0.92, 0], 0.055, P.metalLight);
    box(g, -0.26, 0.85, 0, 0.11, 0.25, 0.09, P.blueDark);
    box(g, -0.14, 0.97, 0, 0.24, 0.055, 0.09, P.blueDark);
    box(g, 0, 0.45, 0.322, 0.045, 0.38, 0.018, "#bbc3ad");
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
  function hollowCup(x, y, z) {
    cyl(g, x, y, z, 0.12, 0.095, 0.18, P.white, 12);
    cyl(g, x, y + 0.095, z, 0.09, 0.09, 0.018, "#756956", 12);
  }
}

// Collection pieces retain the museum/official side profile, then get a rounded,
// material-dependent thickness. They are inert decorative objects, resting flat.
export function buildCollectionModel(api, g, a) {
  const { box, shade } = api,
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
      box(
        g,
        (x - 56) * size,
        half + 0.04,
        (y - 36) * size,
        size,
        half * 2,
        size,
        color,
        warm ? "wood" : "metal",
      );
      if (x % 3 === 0)
        box(
          g,
          (x - 56) * size,
          half * 2 + 0.045,
          (y - 36) * size,
          size * 0.8,
          0.025,
          size * 0.8,
          shade(color, 1.08),
        );
    }
}

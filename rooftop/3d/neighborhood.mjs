import { surfaceSeed } from "./surface-variation.mjs";
import { buildStreetCar, buildStreetLantern } from "./street-models.mjs";
// Guoliyuan's published street photographs inform the architectural vocabulary.
// Placement is a composed neighbourhood, not a surveyed reconstruction of block 92.
export const NEIGHBORHOOD_BUILDINGS = [
  [-5, -56, 48, 11, 6],
  [2, 96, 52, 11, 6],
  [69, 27, 48, 11, 6, Math.PI / 2],
];
export const NEIGHBORHOOD_SOURCES = [
  [
    "Google Maps 郭里园新村卫星图（2026-10-08 查看）",
    "https://www.google.com/maps/place/Guoliyuanxincun/@32.0279345,120.871857,704m/data=!3m1!1e3!4m6!3m5!1s0x35b17821ee9434db:0x54a513abdbb2347b!8m2!3d32.027935!4d120.871857!16s%2Fg%2F1tl9kkd7",
  ],
  [
    "郭里园新村街巷实拍（濠滨通城里，2022）",
    "https://www.sohu.com/a/551257906_121123899",
  ],
  [
    "崇川郭里园老旧小区改造（2022）",
    "https://js.people.com.cn/n2/2022/1101/c360302-40177396.html",
  ],
  [
    "崇川老旧小区环境改造内容（南通市住建局，2025）",
    "https://zj.nantong.gov.cn/ntsfgj/xmdt/content/ead8ba9e-f1c1-408b-ae27-4dbfa8e2689b.html",
  ],
];

export function buildNeighborhood(api, city, groundY, window) {
  const { T, box, beam, cyl, ellipsoid, group, mat, P } = api;
  const colors = ["#c7b7b3", "#d0c8b9", "#bcb8b3", "#c8c8c0"];
  const ac = (parent, x, y, z, angle = 0) => {
    const g = group(parent, x, y, z);
    g.rotation.y = angle;
    box(g, 0, 0, 0, 0.78, 0.56, 0.38, "#ded9d6", "enamel");
    box(g, 0, 0, 0.205, 0.74, 0.52, 0.015, "#ffffff", "panel-ac");
    for (const x of [-0.25, 0.25]) {
      box(g, x, -0.34, 0.04, 0.06, 0.18, 0.34, "#4e5c64", "metal");
      box(g, x, -0.25, -0.24, 0.06, 0.08, 0.54, "#5b666c", "metal");
    }
    beam(g, [0.36, 0.13, -0.12], [0.53, 0.13, -0.12], 0.06, "#d3d1b8");
    beam(g, [0.53, 0.13, -0.12], [0.53, 0.62, -0.12], 0.06, "#c4c4af");
  };
  function gable(parent, x, y, d, pitch, angle, color) {
    const shape = new T.Shape();
    shape.moveTo(-d / 2, 0);
    shape.lineTo(d / 2, 0);
    shape.lineTo(0, pitch);
    shape.closePath();
    const geo = new T.ShapeGeometry(shape);
    geo.setAttribute(
      "paintSeed",
      new T.Float32BufferAttribute(
        new Array(geo.attributes.position.count).fill(
          surfaceSeed(Math.round((x + 30) * 173 + y * 137 + angle * 97)),
        ),
        1,
      ),
    );
    const m = new T.Mesh(geo, mat(color, "wall"));
    m.position.set(x, y, 0);
    m.rotation.y = angle;
    parent.add(m);
  }
  function building(x, z, w, d, floors, index, angle = 0) {
    const g = group(city, x, groundY, z),
      h = floors * 3,
      color = colors[index % 4];
    g.scale.setScalar(2);
    g.rotation.y = angle;
    g.userData.paintSeed = surfaceSeed(9173 + index * 719);
    g.userData.weathered = true;
    // Beige plaster, a darker plinth and real pitched roofs distinguish old walk-ups.
    box(
      g,
      0,
      h / 2,
      0,
      w,
      h,
      d,
      color,
      index === 3 || index === 7 ? "facade-tile" : "wall",
    );
    box(g, 0, 0.47, 0, w + 0.06, 0.94, d + 0.06, "#888779", "brick");
    const pitch = 1.6,
      half = Math.hypot(d / 2 + 0.22, pitch),
      a = Math.atan2(pitch, d / 2 + 0.22);
    for (const s of [-1, 1])
      box(
        g,
        0,
        h + pitch / 2,
        s * (d / 4 + 0.11),
        w + 0.56,
        0.16,
        half,
        ["#a06548", "#94664f", "#966b54"][index % 3],
        "roof",
        s * a,
      );
    box(
      g,
      0,
      h + pitch + 0.06,
      0,
      w + 0.64,
      0.16,
      0.27,
      ["#ba8162", "#ad7b60", "#9b8274"][index % 3],
      "roof",
    );
    gable(g, -w / 2 - 0.015, h, d, pitch, -Math.PI / 2, color);
    gable(g, w / 2 + 0.015, h, d, pitch, Math.PI / 2, color);
    for (const side of [-1, 1])
      box(
        g,
        0,
        h - 0.1,
        side * (d / 2 + 0.15),
        w + 0.48,
        0.22,
        0.17,
        "#e1dac6",
        "wall",
      );
    for (const side of [-1, 1]) {
      // Folded metal eaves, stepped ridge ends and visible chimney flashing.
      box(
        g,
        0,
        h - 0.2,
        side * (d / 2 + 0.22),
        w + 0.66,
        0.12,
        0.16,
        "#525956",
        "metal",
      );
      for (const x of [-w * 0.47, w * 0.47]) {
        box(g, x, h + pitch + 0.08, 0, 0.23, 0.2, 0.32, "#8c9b8b", "roof");
        box(
          g,
          x,
          h * 0.06,
          side * d * 0.503,
          0.13,
          h * 0.12,
          0.06,
          "#a1a693",
          "wall",
        );
      }
    }
    const chimney = group(g, -w * 0.27, h + pitch * 0.72, -0.74);
    box(chimney, 0, 0.44, 0, 0.55, 1.0, 0.62, "#9e8c75", "brick");
    box(chimney, 0, 0.98, 0, 0.71, 0.12, 0.78, "#c1baa3", "wall");
    box(chimney, 0, 1.045, 0, 0.37, 0.015, 0.43, "#4a5755");
    // Facades alternate normal windows and projecting enclosed balconies.
    const bays = Math.max(2, Math.floor(w / 3.7));
    for (let floor = 0; floor < floors; floor++) {
      const yy = 1.62 + floor * 3;
      for (let b = 0; b < bays; b++) {
        const xx = ((b - (bays - 1) / 2) * (w - 2)) / bays;
        for (const side of [-1, 1]) {
          const householdSeed =
            9211 + index * 1009 + floor * 719 + b * 137 + side * 319;
          const household = surfaceSeed(householdSeed),
            variant = Math.floor(household * 7);
          const front = group(g, xx, yy, (side * d) / 2);
          front.userData.paintSeed = household;
          if (side < 0) front.rotation.y = Math.PI;
          if (surfaceSeed(householdSeed + 17) < 0.43 && floor > 0) {
            box(front, 0, -0.76, 0.34, 2.35, 0.24, 0.94, "#c9c8b4", "wall");
            box(front, 0, 1, 0.34, 2.42, 0.14, 1.0, "#d9d6c1", "wall");
            window(front, 0, 0.12, 0.73, 0, 2.14, 1.5, variant);
            box(
              front,
              0,
              -0.54,
              0.8,
              2.23,
              0.36,
              0.07,
              index % 3 === 0 ? "#c6948a" : "#b7b7aa",
              "wall",
            );
            for (const s of [-1, 1]) {
              box(
                front,
                s * 1.13,
                0.1,
                0.31,
                0.07,
                1.8,
                0.88,
                "#c1c8bc",
                "metal",
              );
              box(
                front,
                s * 1.13,
                0.1,
                0.35,
                0.05,
                1.55,
                0.64,
                "#6e8585",
                "glass",
              );
            }
          } else {
            window(front, 0, 0, 0.035, 0, b % 2 ? 1.75 : 1.55, 1.6, variant);
            if (surfaceSeed(householdSeed + 53) < 0.23) {
              for (let k = -2; k <= 2; k++)
                box(
                  front,
                  k * 0.29,
                  0,
                  0.24,
                  0.032,
                  1.7,
                  0.035,
                  "#8e9e9b",
                  "metal",
                );
              for (const v of [-0.73, 0.62])
                box(front, 0, v, 0.24, 1.62, 0.035, 0.035, "#97a7a0", "metal");
            }
          }
          if (surfaceSeed(householdSeed + 97) < 0.32)
            ac(
              front,
              surfaceSeed(householdSeed + 71) > 0.5 ? 1.14 : -1.14,
              -0.44,
              0.19,
            );
          if (surfaceSeed(householdSeed + 277) < 0.18 && floor > 2) {
            box(
              front,
              0,
              1.0,
              0.38,
              2.12,
              0.06,
              0.84,
              "#778b83",
              "metal",
              -0.16,
            );
            for (const x of [-0.93, 0.93])
              beam(front, [x, 0.86, 0.03], [x, 0.94, 0.74], 0.022, "#8a9790");
          }
          if (surfaceSeed(householdSeed + 191) < 0.14 && floor > 1) {
            beam(
              front,
              [-0.6, -0.58, 0.5],
              [0.6, -0.58, 0.5],
              0.035,
              P.metalDark,
            );
            for (let k = 0; k < 3; k++)
              box(
                front,
                -0.37 + k * 0.36,
                -0.78,
                0.5,
                0.29,
                0.37,
                0.025,
                ["#b7bcaa", "#617e8b", "#aa7668"][
                  Math.floor(surfaceSeed(householdSeed + k * 137) * 3)
                ],
                "cloth",
              );
          }
        }
      }
      for (const side of [-1, 1])
        box(
          g,
          0,
          floor * 3 + 0.04,
          side * (d / 2 + 0.025),
          w,
          0.055,
          0.07,
          "#b3b4a5",
          "wall",
        );
    }
    // Narrow end-wall windows are irregular rather than a uniform office grid.
    for (let floor = 0; floor < floors; floor++)
      for (const side of [-1, 1]) {
        window(
          g,
          side * (w / 2 + 0.04),
          floor * 3 + 1.5,
          -d * 0.22,
          (side * Math.PI) / 2,
          0.95,
          1.45,
          Math.floor(
            surfaceSeed(337 + floor * 719 + index * 137 + side * 391) * 7,
          ),
        );
        if (d > 14)
          window(
            g,
            side * (w / 2 + 0.04),
            floor * 3 + 1.5,
            d * 0.24,
            (side * Math.PI) / 2,
            1.45,
            1.6,
            Math.floor(
              surfaceSeed(911 + floor * 719 + index * 137 + side * 391) * 7,
            ),
          );
      }
    for (const xx of [-w / 2 + 0.12, w / 2 - 0.12]) {
      box(g, xx, h / 2, d / 2 + 0.18, 0.08, h, 0.09, "#798b86", "metal");
      box(g, xx, 0.25, d / 2 + 0.29, 0.09, 0.5, 0.31, "#637c77", "metal");
      for (let j = 2; j < h; j += 3)
        box(g, xx, j, d / 2 + 0.2, 0.16, 0.045, 0.15, "#a5b1a3", "metal");
    }
    // Shared stair entrance and meters are distinct from household windows.
    const entry = group(g, index % 2 ? -w * 0.27 : 0, 0, d / 2 + 0.11);
    box(entry, 0, 1.15, 0.02, 1.25, 2.3, 0.08, "#43555e", "metal");
    box(entry, 0, 1.18, 0.075, 1.08, 2.08, 0.018, "#c6cbc0", "panel-door");
    box(entry, 0, 2.45, 0.43, 2.1, 0.15, 1.04, "#c5c7b3", "wall");
    box(entry, 0, 0.06, 0.5, 1.6, 0.12, 0.92, "#a9ac9e", "wall");
    box(entry, 1.07, 1.55, 0.09, 0.38, 0.49, 0.15, "#abaea0", "metal");
    box(entry, 1.07, 1.56, 0.175, 0.28, 0.34, 0.017, "#7d9290", "panel-label");
    if (index === 0 || index === 6) {
      const shop = group(g, w * 0.22, 0, d / 2 + 0.12);
      box(shop, 0, 1.05, 0, 3.5, 2.1, 0.09, "#334849", "glass");
      box(shop, 0, 2.25, 0.13, 3.6, 0.34, 0.11, "#9a7460", "wood");
      box(shop, 0, 2.25, 0.2, 2.9, 0.27, 0.014, "#dbd0b2", "panel-sign");
      box(
        shop,
        0,
        2.34,
        0.69,
        3.82,
        0.11,
        1.42,
        index === 0 ? "#476c73" : "#8e4f42",
        "cloth",
        0.13,
      );
      for (const s of [-1, 1])
        box(shop, s * 1.84, 1.02, 1.27, 0.065, 2.06, 0.065, "#5c6f72", "metal");
    }
  }
  NEIGHBORHOOD_BUILDINGS.forEach((b, i) =>
    building(...b.slice(0, 5), i, b[5] || 0),
  );
  const ground = new T.Mesh(
    new T.PlaneGeometry(360, 300),
    mat("#aaa697", "asphalt"),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = groundY - 0.06;
  ground.receiveShadow = true;
  ground.name = "neighborhood-ground";
  city.add(ground);
  const street = group(city, 0, groundY + 0.015, 0);
  street.userData.paintSeed = surfaceSeed(43179);
  street.userData.weathered = true;
  for (const x of [21.5]) {
    box(street, x, 0, 18, 3.6, 0.06, 114, "#777d7d", "asphalt");
    for (const side of [-1, 1]) {
      box(
        street,
        x + side * 1.95,
        0.07,
        18,
        0.25,
        0.15,
        114,
        "#c3c2b0",
        "wall",
      );
      box(street, x + side * 2.9, 0.04, 18, 1.55, 0.07, 114, "#a3a898", "wall");
    }
  }
  for (const z of [-30, 70]) {
    box(street, -43, 0.045, z, 130, 0.08, 6.2, "#767c7d", "asphalt");
    for (const s of [-1, 1])
      box(street, -43, 0.08, z + s * 3.25, 130, 0.16, 0.25, "#c0c1b0", "wall");
  }
  // Mature planting is clustered between buildings, leaving the lanes readable.
  const treeSites = [
    [-80, -24],
    [-61, -25],
    [-44, -23],
    [-21, -25],
    [-6, -24],
    [-76, 64],
    [-54, 65],
    [-31, 64],
    [-9, 65],
    [26.9, -34],
    [26.3, -19],
    [25.3, -6],
    [27.2, 7],
    [26.3, 16],
    [25.2, 30],
    [26.7, 39],
    [27.2, 62],
    [25.7, 78],
  ];
  for (let i = 0; i < treeSites.length; i++) {
    const x = treeSites[i][0] + (surfaceSeed(719 * i + 37) - 0.5) * 0.5,
      z = treeSites[i][1] + (surfaceSeed(719 * i + 91) - 0.5) * 1.2,
      phase = surfaceSeed(i * 137 + 81) * 6.283,
      spread = 0.88 + surfaceSeed(i * 719 + 15) * 0.24;
    box(street, x, 0.15, z, 2.4, 0.31, 2.6, "#aba996", "wall");
    box(street, x, 0.315, z, 2.18, 0.035, 2.38, "#5c6350", "soil");
    beam(street, [x, 0, z], [x - 0.09, 3.4, z + 0.07], 0.15, "#69573f");
    // Intersecting thin clusters leave small holes between branches, like the
    // reference foliage. Reusing boxes avoids transparent sorting and extra shaders.
    for (let j = 0; j < 28; j++) {
      const a = j * 2.399 + phase,
        rr = Math.sqrt((j + 0.5) / 28) * 1.35 * spread;
      if (j < 5)
        beam(
          street,
          [x, 2.9, z],
          [x + Math.cos(a) * rr, 3.55, z + Math.sin(a) * rr],
          0.065,
          "#63533e",
        );
      box(
        street,
        x + Math.cos(a) * rr,
        3.35 + 0.65 * (1 - rr / 1.5) + Math.sin(j * 1.7 + phase) * 0.19,
        z + Math.sin(a) * rr,
        0.69 + (j % 3) * 0.11,
        0.055,
        0.65 + (j % 4) * 0.085,
        ["#3f6e35", "#659541", "#8db64f", "#538737"][
          Math.floor(surfaceSeed(i * 719 + j * 137 + 3) * 4)
        ],
        "canopy",
        Math.sin(a) * 0.35,
        a,
        Math.cos(a) * 0.3,
      );
    }
    for (let j = 0; j < 12; j++) {
      const a = j * 2.399 + phase * 0.79,
        rr = (0.4 + (j % 3) * 0.12) * spread;
      box(
        street,
        x + Math.cos(a) * rr,
        0.6 + Math.sin(j) * 0.12,
        z + 0.8 + Math.sin(a) * rr,
        0.52,
        0.055,
        0.43,
        ["#5f9637", "#88b845", "#477a32"][j % 3],
        "canopy",
        Math.sin(a) * 0.24,
        a,
        Math.cos(a) * 0.28,
      );
    }
    if (i === 3 || i === 9)
      for (let j = 0; j < 9; j++) {
        const a = j * 2.399 + phase;
        ellipsoid(
          street,
          x + Math.cos(a) * 0.65,
          3.35 + Math.sin(j * 1.3) * 0.2,
          z + Math.sin(a) * 0.73,
          0.065,
          0.08,
          0.065,
          "#c89443",
          "petal",
        );
      }
  }
  function car(x, z, angle, index) {
    const g = group(street, x, 0.14, z);
    g.rotation.y = angle;
    const color = ["#d4d4c5", "#628290", "#a06b5b", "#bcb49c", "#4b626c"][
      index % 5
    ];
    buildStreetCar(api, g, color);
  }
  for (let i = 0; i < 7; i++) {
    const x = i % 2 ? 20.1 : 22.6,
      z = -12 + Math.floor(i / 2) * 7.7;
    car(x, z, Math.PI, i);
    for (const dx of [-1, 1])
      box(street, x + dx * 1.03, 0.05, z, 0.055, 0.02, 4.1, "#d6cfb2");
  }
  function bicycle(parent, x, z, index, scooter = false) {
    const g = group(parent, x, 0.19, z);
    g.rotation.y = index % 2 ? 0.08 : -0.1;
    for (const zz of [-0.57, 0.59]) {
      const wheel = group(g, 0, 0.14, zz);
      wheel.rotation.z = Math.PI / 2;
      cyl(wheel, 0, 0, 0, 0.29, 0.29, 0.075, "#3c4648", 10, "metal");
      cyl(wheel, 0, 0.044, 0, 0.23, 0.23, 0.012, "#b7bbaa", 10, "metal");
      cyl(wheel, 0, 0.058, 0, 0.18, 0.18, 0.013, "#606d6c", 8, "metal");
    }
    if (scooter) {
      ellipsoid(
        g,
        0,
        0.44,
        -0.17,
        0.27,
        0.25,
        0.42,
        ["#626f75", "#ac675b", "#59858a"][index % 3],
      );
      box(g, 0, 0.68, -0.17, 0.4, 0.12, 0.66, "#3d494c", "cloth");
      box(g, 0, 0.51, 0.43, 0.41, 0.58, 0.15, "#70898b", "metal", -0.12);
      box(g, 0, 0.93, 0.53, 0.49, 0.08, 0.09, "#425458", "metal");
      box(g, 0, 0.84, 0.6, 0.18, 0.17, 0.03, "#d5d1b5", "light");
    } else {
      beam(g, [0, 0.15, -0.57], [0, 0.56, -0.22], 0.035, "#487178");
      beam(g, [0, 0.15, -0.57], [0, 0.15, 0.07], 0.035, "#487178");
      beam(g, [0, 0.15, 0.07], [0, 0.56, -0.22], 0.035, "#487178");
      beam(g, [0, 0.56, -0.22], [0, 0.66, 0.37], 0.035, "#487178");
      beam(g, [0, 0.15, 0.07], [0, 0.66, 0.37], 0.035, "#487178");
      beam(g, [0, 0.66, 0.37], [0, 0.15, 0.59], 0.045, "#4d696a");
      box(g, 0, 0.65, -0.22, 0.2, 0.06, 0.23, "#3c4545", "cloth");
      box(g, 0, 0.86, 0.38, 0.45, 0.035, 0.07, "#677d7d", "metal");
    }
    beam(g, [0, 0.15, -0.1], [0.22, -0.19, -0.23], 0.025, "#4c5d5f");
  }
  // Blue charging shelter, bicycles and scooters recall the small community lanes.
  const shelter = group(street, -18, 0, 64);
  box(shelter, 0, 0.08, 0, 7.4, 0.16, 2.7, "#b9bbab", "wall");
  for (const x of [-3.55, 3.55])
    for (const z of [-1.15, 1.15])
      box(shelter, x, 1.26, z, 0.08, 2.52, 0.08, "#59767a", "metal");
  box(shelter, 0, 2.64, 0, 7.75, 0.15, 2.9, "#517580", "roof", -0.1);
  for (let i = 0; i < 7; i++)
    bicycle(shelter, -2.9 + i * 0.87, 0.05, i, i % 3 === 0);
  for (let i = 0; i < 4; i++) bicycle(street, 18.7, 10 + i * 0.85, i, true);
  for (const x of [18, 24.3])
    for (const z of [-11, 10]) {
      const lamp = group(street, x, 0, z);
      buildStreetLantern(api, lamp);
    }
  for (let i = 0; i < 4; i++) {
    const g = group(street, 10 + i * 0.65, 0, 64);
    box(
      g,
      0,
      0.5,
      0,
      0.54,
      1,
      0.6,
      ["#68837d", "#5c7e90", "#8b7564", "#6e7b73"][i],
      "metal",
    );
    box(g, 0, 1.04, 0, 0.59, 0.11, 0.67, "#535e5c", "metal", -0.1);
    box(g, 0, 0.63, 0.308, 0.33, 0.31, 0.016, "#c3c7b8", "panel-label");
  }
  const bench = group(street, 9.5, 0.02, -24);
  for (let j = 0; j < 4; j++)
    box(bench, 0, 0.72, -0.35 + j * 0.22, 2.8, 0.095, 0.18, "#267f82", "wood");
  for (let j = 0; j < 3; j++)
    box(bench, 0, 1.08 + j * 0.15, -0.47, 2.8, 0.12, 0.08, "#267f82", "wood");
  for (const x of [-1.08, 1.08]) {
    box(bench, x, 0.35, 0, 0.12, 0.7, 0.82, P.metalDark, "metal");
    box(bench, x, 1, -0.48, 0.08, 1.35, 0.08, P.metalDark, "metal");
  }
  // Drain covers and faded curb marks keep the ground from being a generic flat sheet.
  for (const [x, z] of [
    [20.2, -8],
    [21.2, -8],
    [19.2, 16],
    [21.2, 16],
  ]) {
    box(street, x, 0.066, z, 0.75, 0.025, 0.42, "#455756", "metal");
    for (let i = 0; i < 6; i++)
      box(
        street,
        x - 0.29 + i * 0.11,
        0.083,
        z,
        0.04,
        0.015,
        0.34,
        "#9ba89f",
        "metal",
      );
  }
  return {
    buildings: NEIGHBORHOOD_BUILDINGS.length,
    storeys: [...new Set(NEIGHBORHOOD_BUILDINGS.map((b) => b[4]))],
    trees: 18,
    cars: 7,
    bicycles: 4,
    scooters: 7,
    shelters: 1,
  };
}

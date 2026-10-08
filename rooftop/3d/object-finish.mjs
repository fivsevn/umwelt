import { attachOutdoorGrowth } from "./weathering.mjs";
// Construction details are placed on the actual parts rather than overlaid noise.
export function finishObject(api, g, type, w, d, h) {
  const { box, beam, cyl, P, shade } = api;
  attachOutdoorGrowth(api, g, type, w, d, h);
  if (/shelf|stand|plantcart|pottingbench|lowplatform/.test(type)) {
    const wood = /wood|ladder|foam|lowplatform|potting/.test(type);
    const color = wood ? "#9e8051" : "#909f9d";
    if (!["woodshelf", "ladderstand"].includes(type))
      for (const x of [-w * 0.45, w * 0.45])
        for (const z of [-d * 0.43, d * 0.43]) {
          box(
            g,
            x,
            h + 0.015,
            z,
            wood ? 0.13 : 0.1,
            0.04,
            wood ? 0.13 : 0.1,
            color,
            wood ? "wood" : "metal",
          );
          for (const y of [h * 0.48, h * 0.9])
            box(g, x, y, z + 0.047, 0.038, 0.04, 0.025, color, "metal");
        }
    if (type === "shelf" || type === "wirestand") {
      for (const y of [0.18, h * 0.52, h * 0.92])
        for (const x of [-w * 0.48, w * 0.48])
          box(g, x, y - 0.07, 0, 0.045, 0.09, d * 0.9, P.metalDark, "metal");
    }
    if (type === "pottingbench") {
      for (const x of [-w * 0.36, -w * 0.22, w * 0.3]) {
        box(g, x, h + 0.55, -d * 0.38, 0.035, 0.075, 0.025, P.metalLight);
        beam(
          g,
          [x, h + 0.45, -d * 0.36],
          [x, h + 0.31, -d * 0.3],
          0.025,
          P.metalDark,
        );
      }
    }
  }
  if (
    ["table", "bench", "stool", "gardenbench", "foldingchair"].includes(type)
  ) {
    const y =
      type === "gardenbench" ? h * 0.5 : type === "foldingchair" ? h * 0.52 : h;
    for (const z of [-d * 0.43, d * 0.43])
      box(
        g,
        0,
        y - 0.15,
        z,
        w * 0.93,
        0.16,
        0.075,
        type === "gardenbench" ? "#39483f" : P.woodDark,
        type === "gardenbench" ? "metal" : "wood",
      );
    for (const x of [-w * 0.43, w * 0.43])
      for (const z of [-d * 0.4, d * 0.4])
        box(g, x, y + 0.058, z, 0.036, 0.014, 0.036, "#c2ad80", "metal");
    if (type === "table") {
      for (const x of [-w * 0.43, w * 0.43])
        box(g, x, h * 0.27, 0, 0.1, 0.09, d * 0.85, P.woodDark, "wood");
    }
  }
  if (
    ["crate", "redbox", "fishbox", "foambox", "mossbox", "seedtray"].includes(
      type,
    )
  ) {
    const foam = /foam|mossbox/.test(type),
      color = foam ? P.white : type === "redbox" ? "#a17966" : P.blue;
    for (const z of [-d * 0.5, d * 0.5])
      box(
        g,
        0,
        h + 0.025,
        z,
        w + 0.1,
        0.065,
        0.1,
        shade(color, 1.12),
        foam ? "enamel" : "paint",
      );
    for (const x of [-w * 0.5, w * 0.5]) {
      box(
        g,
        x,
        h + 0.025,
        0,
        0.1,
        0.065,
        d + 0.1,
        shade(color, 1.12),
        foam ? "enamel" : "paint",
      );
      if (!foam) {
        box(g, x * 1.045, h * 0.74, 0, 0.019, 0.09, d * 0.32, P.blueDark);
        box(g, x * 1.05, h * 0.82, 0, 0.025, 0.025, d * 0.36, "#779494");
      }
    }
    for (const x of [-w * 0.43, w * 0.43])
      for (const z of [-d * 0.43, d * 0.43])
        box(g, x, 0.027, z, 0.1, 0.055, 0.1, shade(color, 0.8), "paint");
    if (foam)
      for (const z of [-d * 0.53, d * 0.53]) {
        box(
          g,
          -w * 0.21,
          h * 0.5,
          z,
          w * 0.23,
          0.045,
          0.013,
          "#b2b5a0",
          "enamel",
        );
        box(
          g,
          w * 0.29,
          h * 0.31,
          z,
          w * 0.14,
          0.028,
          0.013,
          "#a4aa96",
          "enamel",
        );
      }
  }
  if (["storagechest", "room-wardrobe", "room-dresser"].includes(type)) {
    const front = d * 0.558;
    if (type === "room-wardrobe")
      for (const x of [-w * 0.245, w * 0.245]) {
        // Raised rails around two recessed fields, with a dark inner rebate.
        for (const y of [h * 0.34, h * 0.72]) {
          const height = h * 0.28,
            width = w * 0.365;
          box(g, x, y, front - 0.005, width, height, 0.016, "#57432c", "wood");
          box(
            g,
            x,
            y,
            front + 0.009,
            width * 0.89,
            height * 0.83,
            0.018,
            y > h * 0.5 ? "#a77c48" : "#8e663d",
            "wood",
          );
          for (const xx of [x - width * 0.52, x + width * 0.52]) {
            box(
              g,
              xx,
              y,
              front + 0.034,
              0.066,
              height + 0.07,
              0.072,
              "#ad8850",
              "wood",
            );
            box(
              g,
              xx + 0.023,
              y,
              front + 0.074,
              0.018,
              height + 0.04,
              0.012,
              "#c4a06a",
              "wood",
            );
          }
          for (const yy of [y - height * 0.53, y + height * 0.53]) {
            box(
              g,
              x,
              yy,
              front + 0.032,
              width + 0.08,
              0.065,
              0.07,
              "#987444",
              "wood",
            );
            box(
              g,
              x,
              yy + 0.021,
              front + 0.07,
              width + 0.04,
              0.016,
              0.012,
              "#c4a06a",
              "wood",
            );
          }
        }
        for (const y of [h * 0.23, h * 0.83])
          box(
            g,
            x + (x < 0 ? -w * 0.21 : w * 0.21),
            y,
            front + 0.018,
            0.031,
            0.12,
            0.025,
            "#777364",
            "metal",
          );
        box(
          g,
          x + (x < 0 ? 0.16 : -0.16),
          h * 0.55,
          front + 0.075,
          0.045,
          0.11,
          0.04,
          "#b7a676",
          "metal",
        );
      }
    if (type === "room-dresser")
      for (let j = 0; j < 3; j++) {
        const y = h * (0.25 + j * 0.29),
          width = w * 0.81,
          height = h * 0.185;
        box(g, 0, y, front - 0.012, width, height, 0.014, "#5c462e", "wood");
        box(
          g,
          0,
          y,
          front + 0.015,
          width * 0.94,
          height * 0.79,
          0.024,
          j === 2 ? "#b08a50" : "#9a713f",
          "wood",
        );
        box(
          g,
          0,
          y + height * 0.46,
          front + 0.037,
          width,
          0.025,
          0.022,
          "#c2a06a",
          "wood",
        );
        box(
          g,
          0,
          y - height * 0.47,
          front + 0.023,
          width,
          0.03,
          0.02,
          "#70522e",
          "wood",
        );
        for (const x of [-w * 0.25, w * 0.25]) {
          box(g, x, y, front + 0.038, 0.14, 0.065, 0.021, "#786a48", "metal");
          beam(
            g,
            [x - 0.05, y, front + 0.057],
            [x - 0.05, y - 0.055, front + 0.08],
            0.018,
            "#b5a171",
          );
          beam(
            g,
            [x + 0.05, y, front + 0.057],
            [x + 0.05, y - 0.055, front + 0.08],
            0.018,
            "#b5a171",
          );
          beam(
            g,
            [x - 0.05, y - 0.055, front + 0.08],
            [x + 0.05, y - 0.055, front + 0.08],
            0.021,
            "#b5a171",
          );
        }
      }
    if (type === "storagechest") {
      for (const x of [-w * 0.3, w * 0.3]) {
        box(
          g,
          x,
          h + 0.095,
          -d * 0.45,
          0.24,
          0.035,
          0.12,
          P.metalDark,
          "metal",
        );
        box(g, x, h * 0.4, d * 0.52, 0.08, h * 0.72, 0.024, "#9c865e", "metal");
      }
      box(g, 0, h * 0.8, d * 0.53, 0.18, 0.17, 0.035, P.metal, "metal");
      box(g, 0, h * 0.78, d * 0.56, 0.035, 0.05, 0.015, P.metalDark);
    }
  }
  if (type === "solarlamp") {
    const y = h * 0.75;
    for (const x of [-0.19, 0.19])
      for (const z of [-0.19, 0.19])
        box(g, x, y, z, 0.035, 0.34, 0.035, P.metalDark, "metal");
    box(g, 0, y - 0.18, 0, 0.45, 0.05, 0.45, P.metalDark, "metal");
    cyl(g, 0, h * 0.17, 0, 0.11, 0.16, 0.13, P.metalDark, 8, "metal");
    cyl(g, 0, h * 0.65, 0, 0.1, 0.07, 0.09, P.metalLight, 8, "metal");
    for (let j = 0; j < 3; j++)
      box(g, -0.083 + j * 0.083, h * 0.942, 0, 0.018, 0.009, 0.23, "#758b8c");
  }
  if (type === "tasklamp") {
    cyl(g, 0.22, h * 0.63, 0, 0.375, 0.375, 0.036, P.blueDark, 12, "metal");
    box(g, -0.22, h * 0.47, 0.076, 0.057, 0.045, 0.025, P.metalLight);
    box(g, 0, 0.12, 0.2, 0.09, 0.025, 0.06, "#a6a996");
  }
  if (type === "tinlantern") {
    cyl(g, 0, h * 0.12, 0, w * 0.38, w * 0.38, 0.045, "#656f68", 12, "metal");
    cyl(g, 0, h * 0.8, 0, w * 0.37, w * 0.37, 0.045, "#b2ad90", 12, "metal");
  }
}

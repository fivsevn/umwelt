export function buildCactusBody(api, g, x, z, radius, height, ribs, tall, color, form = "") {
    const { group, profile } = api;
    const plant = group(g, x, 0, z),
      rr = radius;
    const shell = group(plant);
    shell.scale.set(radius, height, radius);
    const points = tall
      ? [
          [0, 0],
          [0.78, 0.025],
          [1, 0.16],
          [1, 0.66],
          [0.87, 0.89],
          [0.24, 1],
          [0, 1],
        ]
      : [
          [0, 0],
          [0.57, 0.06],
          [0.94, 0.28],
          [1, 0.53],
          [0.85, 0.81],
          [0.25, 1],
          [0, 1],
        ];
    profile(
      shell,
      points,
      Math.max(6, ribs * 2),
      color,
      "cactus",
      "round",
      ribs,
    );
    // Rib silhouette is retained; the native cactus field carries areoles.
  }

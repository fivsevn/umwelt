// Small, faceted fish belong below the water surface. Their paths stay inside it.
export function populateWater(api, g, { width, depth, level, count = 4, goldfish = false }) {
  const { group, ellipsoid, box, registerWater } = api;
  for (let j = 0; j < count; j++) {
    const angle = j * 2.4, x = Math.cos(angle) * width * .24,
      z = Math.sin(angle) * depth * .22;
    const fish = group(g, x, level - .035, z);
    fish.userData.animated = true;
    const paint = goldfish ? (j % 2 ? "#bb7048" : "#d69b67") : (j % 2 ? "#bbb797" : "#d3cbb0");
    ellipsoid(fish, 0, 0, 0, goldfish ? .14 : .105, .025, .044, paint);
    box(fish, -.13, 0, 0, .07, .025, .086, paint, "plain", 0, .4);
    box(fish, -.13, .009, 0, .05, .02, .07, goldfish ? "#d5a27b" : "#ded4bb", "plain", 0, -.4);
    box(fish, .066, .019, .027, .016, .012, .012, "#384747");
    box(fish, -.02, .008, -.055, .035, .015, .035, paint, "plain", 0, .6);
    registerWater({ g: fish, baseX: x, baseZ: z, phase: angle, r: Math.min(width, depth) * .15 });
  }
}

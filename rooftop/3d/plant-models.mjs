// Geometry rules follow each species' morphology record in botany.mjs.
// Seed variation changes growth, never the identifying leaf/stem arrangement.
export const PLANT_FORMS = new Set(
  `barrel column pads cluster tails swords rosette beads jade herb needles fern split ivy trumpet onion tiny parsley spikes strawberry berries tomato pepper lettuce radish round marigold daisy cosmos pansy hydrangea rose camellia gardenia hibiscus bougainvillea jasmine fuchsia portulaca kalanchoe zebra agave snake spider oxalis coleus hosta exp-star exp-flatstar exp-ribbed exp-fingers exp-woolball exp-thimbles exp-redcolumn exp-chin exp-chinflower exp-smooth exp-peanuts exp-bluebarrel exp-goldcolumn exp-offsets exp-hooked exp-wavy exp-haircolumn exp-segments exp-fishbone exp-threads exp-stones exp-windows exp-splitrock exp-jaws exp-bubble exp-fan exp-triangle exp-ridged exp-pointed exp-powder exp-velvet exp-stacked exp-scales exp-felt exp-paddles exp-paws exp-crinkle exp-beadtail exp-tree exp-cushion exp-swept exp-feather exp-fern-moss exp-stars exp-redstars exp-silver exp-hairpoints exp-bent exp-broad-moss exp-two-row exp-sphagnum`.split(
    /\s+/,
  ),
);

export function buildFoliage(api, g, p, o) {
  const { box, beam, ellipsoid, group, shade, rng } = api;
  const r = rng(o.seed || 1835),
    f = p.form,
    c = p.leaf || "#72815a",
    flower = p.flower || "#c6b89b";
  if (!PLANT_FORMS.has(f)) throw Error("未定义植物结构：" + f);
  const v = (a, rad, y) => [Math.cos(a) * rad, y, Math.sin(a) * rad];
  const leaf = (start, end, width, col = c, teeth = false) => {
    if (api.blade) {
      api.blade(
        g,
        start,
        end,
        width,
        col,
        teeth,
        /rosette|jade|kalanchoe|exp-(triangle|ridged|pointed|powder|velvet|paws|crinkle|paddles|jaws|tree)/.test(
          f,
        ),
      );
      return;
    }
    const n = Math.max(
      4,
      Math.ceil(Math.hypot(...end.map((q, i) => q - start[i])) / 0.055),
    );
    for (let j = 0; j < n; j++) {
      const t = j / n,
        q = start.map((q, i) => q + (end[i] - q) * t),
        w = Math.max(0.035, width * Math.sin(Math.PI * (0.08 + 0.92 * t)));
      box(g, ...q, w, 0.047, w * 0.52, j % 5 === 0 ? shade(col, 1.12) : col);
      if (teeth && j % 3 === 0)
        for (const s of [-1, 1])
          box(
            g,
            q[0] + s * w * 0.47,
            q[1] + 0.016,
            q[2],
            0.038,
            0.038,
            0.04,
            shade(col, 1.13),
          );
      if (j % 2 === 0) box(g, ...q, 0.022, 0.055, 0.026, shade(col, 0.82));
    }
  };
  const blossom = (
    x,
    y,
    z,
    col = flower,
    petals = 5,
    rad = 0.15,
    layers = 1,
  ) => {
    for (let layer = 0; layer < layers; layer++)
      for (let k = 0; k < petals; k++) {
        const a = (k * 6.283) / petals + layer * 0.4,
          rr = rad * (1 - layer / (layers + 1));
        box(
          g,
          x + Math.cos(a) * rr,
          y + layer * 0.035,
          z + Math.sin(a) * rr,
          rr * 0.95,
          0.07,
          rr * 0.85,
          layer % 2 ? shade(col, 1.12) : col,
        );
      }
    box(g, x, y + 0.025 + layers * 0.025, z, 0.075, 0.055, 0.075, "#cbb072");
  };
  const cactus =
    /^(barrel|column|cluster|exp-(star|flatstar|ribbed|fingers|woolball|thimbles|redcolumn|chin|chinflower|smooth|peanuts|bluebarrel|goldcolumn|offsets|hooked|wavy|haircolumn))$/.test(
      f,
    );
  if (cactus) {
    const cluster = /cluster|fingers|woolball|thimbles|peanuts|offsets/.test(f),
      tall = /column|fingers|redcolumn|goldcolumn|haircolumn|thimbles/.test(f);
    const count = f === "column" ? 3 : cluster ? 5 : 1;
    const ribCount =
      f === "column"
        ? 3
        : f === "exp-star"
          ? 5
          : f === "exp-flatstar"
            ? 8
            : f === "exp-wavy"
              ? 26
              : f === "barrel"
                ? 21
                : 12;
    for (let k = 0; k < count; k++) {
      const a = k * 2.4,
        xx = count > 1 ? Math.cos(a) * 0.28 : 0,
        zz = count > 1 ? Math.sin(a) * 0.28 : 0;
      const rad = f === "barrel" ? 0.7 : count > 1 ? 0.18 + r() * 0.09 : 0.44,
        h =
          (tall
            ? 0.95 + r() * 0.52
            : f === "exp-flatstar"
              ? 0.36
              : f === "exp-peanuts"
                ? 0.4
                : rad * 1.9) *
          (1 + (r() - 0.5) * 0.15);
      if (api.cactusBody) {
        api.cactusBody(g, xx, zz, rad, h, ribCount, tall, c, f);
        if (/chinflower|offsets|peanuts/.test(f))
          blossom(xx, h + 0.025, zz, flower, 7, 0.12, 2);
        if (/woolball|cluster|redcolumn/.test(f))
          for (let j = 0; j < 7; j++) {
            const angle = j * 0.897;
            blossom(
              xx + Math.cos(angle) * rad * 0.68,
              h * 0.86,
              zz + Math.sin(angle) * rad * 0.68,
              flower,
              5,
              0.07,
            );
          }
        continue;
      }
      for (let yy = 0.025; yy < h; yy += 0.065) {
        const bulb = tall
          ? Math.sqrt(Math.max(0.08, 1 - ((yy - h * 0.47) / (h * 0.57)) ** 4))
          : Math.sqrt(Math.max(0.04, 1 - ((yy - h / 2) / (h / 2)) ** 2));
        const seg = Math.max(18, ribCount * 3);
        for (let j = 0; j < seg; j++) {
          const theta = (j * 6.283) / seg,
            ridge = Math.cos(
              theta * ribCount +
                (/wavy/.test(f) ? Math.sin(yy * 24) * 0.35 : 0),
            );
          const rr = rad * bulb * (0.81 + (0.19 * (ridge + 1)) / 2);
          box(
            g,
            xx + Math.cos(theta) * rr,
            yy,
            zz + Math.sin(theta) * rr,
            0.073,
            0.069,
            0.073,
            ridge > 0.5 ? shade(c, 1.12) : ridge < -0.4 ? shade(c, 0.78) : c,
          );
          if (j % 3 === 0 && Math.round(yy / 0.065) % 3 === 0) {
            const wool = /wool|hair|cluster/.test(f),
              dotted = /star/.test(f),
              hook = f === "exp-hooked";
            const color = hook
              ? "#a57357"
              : /redcolumn/.test(f)
                ? "#b99570"
                : wool
                  ? "#d9d7b7"
                  : "#d2c49a";
            box(
              g,
              xx + Math.cos(theta) * (rr + 0.04),
              yy,
              zz + Math.sin(theta) * (rr + 0.04),
              wool ? 0.06 : 0.032,
              wool ? 0.12 : 0.035,
              0.032,
              color,
            );
            if (!dotted && !/smooth|chin/.test(f))
              beam(
                g,
                [xx + Math.cos(theta) * rr, yy, zz + Math.sin(theta) * rr],
                [
                  xx + Math.cos(theta) * (rr + 0.11),
                  yy + 0.025,
                  zz + Math.sin(theta) * (rr + 0.11),
                ],
                0.021,
                color,
              );
            if (hook)
              box(
                g,
                xx + Math.cos(theta) * (rr + 0.11),
                yy - 0.04,
                zz + Math.sin(theta) * (rr + 0.11),
                0.03,
                0.1,
                0.03,
                color,
              );
          }
        }
      }
      if (/chinflower|offsets|peanuts/.test(f))
        blossom(xx, h + 0.03, zz, flower, 9, 0.14, 2);
      if (/woolball|cluster|redcolumn/.test(f))
        for (let j = 0; j < 7; j++) {
          const a = j * 0.897;
          blossom(
            xx + Math.cos(a) * rad * 0.68,
            h * 0.86,
            zz + Math.sin(a) * rad * 0.68,
            flower,
            5,
            0.07,
          );
        }
    }
    return;
  }
  if (f === "pads") {
    for (const [x, y, rx, ry] of [
      [0, 0.27, 0.2, 0.28],
      [-0.23, 0.69, 0.22, 0.35],
      [0.23, 0.76, 0.23, 0.38],
      [0.38, 1.22, 0.15, 0.22],
    ]) {
      ellipsoid(g, x, y, 0, rx, ry, 0.085, c, 0.055, 13);
      for (let j = 0; j < 13; j++)
        for (const s of [-1, 1])
          box(
            g,
            x + (r() - 0.5) * rx * 1.4,
            y + (r() - 0.5) * ry * 1.5,
            s * 0.09,
            0.025,
            0.025,
            0.021,
            "#dbd3a8",
          );
    }
    return;
  }
  if (/exp-(stones|splitrock|windows|fan|bubble)/.test(f)) {
    const n =
      f === "exp-fan"
        ? 7
        : f === "exp-windows"
          ? 11
          : f === "exp-bubble"
            ? 14
            : 2;
    for (let k = 0; k < n; k++) {
      const a = k * 2.4,
        x =
          n === 2
            ? (k - 0.5) * 0.39
            : n === 7
              ? (k - 3) * 0.105
              : Math.cos(a) * 0.36,
        z = n === 7 ? ((k % 2) - 0.5) * 0.15 : n === 2 ? 0 : Math.sin(a) * 0.36;
      const h =
        n === 2 ? 0.4 : n === 7 ? 0.38 + 0.03 * Math.cos(k) : 0.35 + r() * 0.15;
      ellipsoid(
        g,
        x,
        h * 0.5,
        z,
        n === 2 ? 0.26 : 0.12,
        h * 0.5,
        n === 2 ? 0.27 : 0.13,
        c,
        0.055,
        27 + k,
      );
      box(
        g,
        x,
        h,
        z,
        n === 2 ? 0.22 : 0.14,
        0.025,
        n === 2 ? 0.26 : 0.13,
        shade(c, 1.24),
      );
      for (let j = 0; j < 5; j++)
        box(
          g,
          x + (r() - 0.5) * 0.13,
          h + 0.019,
          z + (r() - 0.5) * 0.1,
          0.02,
          0.018,
          0.036,
          shade(c, 0.73),
        );
    }
    return;
  }
  if (/^exp-(stacked|scales)$/.test(f)) {
    for (let k = 0; k < 5; k++) {
      const a = k * 2.4,
        h = 0.55 + r() * 0.5;
      for (let j = 0; j < h / 0.07; j++) {
        const x = Math.cos(a) * (0.12 + j * 0.009),
          z = Math.sin(a) * (0.12 + j * 0.009),
          yy = j * 0.07;
        box(g, x, yy, z, 0.04, 0.075, 0.04, shade(c, 0.76));
        const aa = j % 2 ? Math.PI / 2 : 0,
          w = f === "exp-scales" ? 0.085 : 0.22;
        for (const s of [-1, 1])
          leaf(
            [x, yy, z],
            [x + Math.cos(aa) * w * s, yy + 0.04, z + Math.sin(aa) * w * s],
            w * 0.75,
            c,
          );
      }
    }
    return;
  }
  if (/tails|ivy|exp-(beadtail|threads|segments|fishbone)/.test(f)) {
    for (let k = 0; k < 6; k++) {
      const a = k * 2.4,
        len = 0.9 + r() * 0.65;
      for (let j = 0; j < 18; j++) {
        const t = j / 18,
          q = v(
            a,
            0.18 + Math.sin(t * 2) * 0.43,
            0.18 + Math.sin(t * 3) * 0.13 - t * len,
          );
        box(g, ...q, 0.048, 0.072, 0.048, shade(c, 0.85));
        if (f === "tails")
          for (const s of [-1, 1])
            box(g, q[0] + s * 0.045, q[1], q[2], 0.02, 0.1, 0.02, "#d3d0b6");
        else if (/threads/.test(f)) {
          if (j % 6 === 0) box(g, ...q, 0.07, 0.07, 0.07, "#d2ceb7");
        } else if (/segments|fishbone/.test(f))
          leaf(
            q,
            [
              q[0] + Math.cos(a + 1.57) * 0.16,
              q[1] + 0.08,
              q[2] + Math.sin(a + 1.57) * 0.16,
            ],
            0.15,
            c,
            /fishbone/.test(f),
          );
        else if (/beadtail/.test(f))
          for (const s of [-1, 1])
            ellipsoid(
              g,
              q[0] + s * 0.065,
              q[1],
              q[2],
              0.075,
              0.05,
              0.065,
              c,
              0.043,
              4,
            );
        else if (j % 3 === 0)
          for (const s of [-1, 1])
            leaf(q, [q[0] + s * 0.19, q[1] + 0.09, q[2] + 0.08], 0.19, c);
      }
      if (f === "exp-segments") {
        const q = v(a, 0.58, -len * 0.7);
        blossom(...q, flower, 6, 0.12, 2);
      }
    }
    return;
  }
  if (
    /^exp-(cushion|swept|feather|fern-moss|stars|redstars|silver|hairpoints|bent|broad-moss|two-row|sphagnum)$/.test(
      f,
    ) ||
    f === "tiny"
  ) {
    const feather = /feather|fern-moss|two-row/.test(f),
      star = /stars|sphagnum/.test(f);
    for (let k = 0; k < 42; k++) {
      const a = r() * 6.283,
        rad = Math.sqrt(r()) * 0.52,
        x = Math.cos(a) * rad,
        z = Math.sin(a) * rad,
        h = /cushion/.test(f)
          ? 0.24 * (1 - rad)
          : /silver/.test(f)
            ? 0.065
            : 0.12 + r() * 0.13;
      box(g, x, h * 0.5, z, 0.047, h, 0.045, c);
      if (feather)
        for (let j = 0; j < 4; j++)
          for (const s of [-1, 1])
            leaf(
              [x, h, z + j * 0.026],
              [x + s * (0.065 - j * 0.01), h + 0.015, z + j * 0.026],
              0.035,
              c,
            );
      else
        for (let j = 0; j < (star ? 6 : 3); j++) {
          const aa = (j * 6.283) / (star ? 6 : 3),
            q = [
              x + Math.cos(aa) * 0.09,
              h + (f === "exp-swept" ? 0.09 : 0.015),
              z + Math.sin(aa) * 0.09,
            ];
          leaf([x, h * 0.65, z], q, 0.036, c);
          if (/redstars|hairpoints|silver/.test(f))
            box(
              g,
              ...q,
              0.023,
              0.027,
              0.023,
              /red/.test(f) ? "#a18568" : "#c3c9b2",
            );
        }
      if (f === "exp-hairpoints" && k % 8 === 0) {
        beam(g, [x, h, z], [x, 0.46, z], 0.014, "#a29165");
        box(g, x, 0.46, z, 0.03, 0.06, 0.03, "#9e8258");
      }
    }
    return;
  }
  if (
    /rosette|swords|agave|zebra|lettuce|exp-(triangle|ridged|pointed|powder|velvet|paws|crinkle|paddles|jaws)/.test(
      f,
    )
  ) {
    const sword = /swords|agave|zebra/.test(f),
      pair = /paddles|paws|jaws/.test(f),
      n = pair ? 8 : sword ? 11 : 18;
    for (let k = 0; k < n; k++) {
      const a = pair ? (k % 2) * Math.PI + Math.floor(k / 2) * 0.18 : k * 2.399,
        rad = sword ? 0.65 + r() * 0.2 : 0.32 + (k % 3) * 0.1;
      const yy = sword
          ? 0.6 + r() * 0.45
          : pair
            ? 0.26 + Math.floor(k / 2) * 0.12
            : 0.18 + (k % 3) * 0.12,
        tip = v(a, rad, yy);
      leaf(
        [0, 0.06, 0],
        tip,
        sword ? 0.13 : pair ? 0.23 : 0.25,
        c,
        /jaws|crinkle/.test(f),
      );
      if (/zebra|ridged/.test(f))
        for (let j = 2; j < 7; j++) {
          const t = j / 8;
          box(
            g,
            tip[0] * t,
            tip[1] * t + 0.07,
            tip[2] * t,
            0.075,
            0.018,
            0.06,
            /zebra/.test(f) ? "#c7cbb3" : shade(c, 1.18),
          );
        }
      if (/pointed|paws|paddles|velvet/.test(f))
        box(
          g,
          ...tip,
          0.065,
          0.045,
          0.05,
          /paws/.test(f) ? "#907e62" : "#a2857c",
        );
    }
    return;
  }
  if (/snake|spider|onion|needles/.test(f)) {
    for (let k = 0; k < 13; k++) {
      const a = k * 2.4,
        h = f === "snake" ? 1.18 + r() * 0.45 : 0.6 + r() * 0.3,
        rad = f === "snake" ? 0.24 : f === "onion" ? 0.26 : 0.66;
      const q = v(a, rad, h);
      leaf(v(a, 0.1, 0), q, f === "snake" ? 0.14 : 0.06, c);
      if (f === "snake")
        for (let j = 0; j < 7; j++)
          box(
            g,
            (q[0] * j) / 7,
            (h * j) / 7 + 0.06,
            (q[2] * j) / 7,
            0.14,
            0.026,
            0.07,
            shade(c, 0.72),
          );
      if (f === "spider") leaf(q, v(a, rad * 1.36, 0.25), 0.06, "#b9c5a5");
    }
    return;
  }
  if (/fern|parsley|cosmos|marigold/.test(f)) {
    for (let k = 0; k < 8; k++) {
      const a = k * 2.4,
        q = v(a, 0.65, 0.32 + r() * 0.5);
      beam(g, [0, 0, 0], q, 0.024, c);
      for (let j = 1; j < 8; j++)
        for (const s of [-1, 1]) {
          const t = j / 8,
            rad = 0.16 * Math.sin(Math.PI * t);
          leaf(
            q.map((x) => x * t),
            [
              q[0] * t + Math.sin(a) * rad * s,
              q[1] * t + 0.045,
              q[2] * t - Math.cos(a) * rad * s,
            ],
            f === "cosmos" ? 0.028 : 0.07,
            c,
          );
        }
      if (f === "cosmos" || f === "marigold")
        blossom(
          q[0],
          q[1] + 0.22,
          q[2],
          flower,
          8,
          0.14,
          f === "marigold" ? 3 : 1,
        );
    }
    return;
  }
  if (f === "oxalis") {
    for (let k = 0; k < 7; k++) {
      const a = k * 2.4,
        q = v(a, 0.39, 0.48 + r() * 0.17);
      beam(g, [0, 0, 0], q, 0.025, c);
      for (let j = 0; j < 3; j++)
        leaf(
          q,
          [
            q[0] + Math.cos(a + j * 2.094) * 0.23,
            q[1] + 0.025,
            q[2] + Math.sin(a + j * 2.094) * 0.23,
          ],
          0.24,
          c,
        );
    }
    return;
  }
  if (f === "exp-tree" || f === "jade") {
    beam(g, [0, 0, 0], [0, 0.82, 0], 0.085, "#8b7861");
    for (let k = 0; k < 5; k++) {
      const a = k * 2.4,
        q = v(a, 0.38, 0.7 + r() * 0.35);
      beam(g, [0, 0.44, 0], q, 0.055, "#8b7861");
      for (let j = 0; j < (f === "exp-tree" ? 13 : 5); j++) {
        const aa = j * 2.4;
        leaf(
          q,
          [q[0] + Math.cos(aa) * 0.27, q[1] + 0.1, q[2] + Math.sin(aa) * 0.27],
          f === "jade" ? 0.2 : 0.16,
          c,
        );
      }
    }
    return;
  }
  if (f === "exp-felt") {
    for (let k = 0; k < 7; k++) {
      const a = k * 2.4,
        q = v(a, 0.5, 0.38 + k * 0.07);
      beam(
        g,
        [0, 0, 0],
        q.map((x) => x * 0.6),
        0.045,
        c,
      );
      leaf(
        q.map((x) => x * 0.6),
        q,
        0.23,
        c,
      );
      for (let j = 0; j < 4; j++)
        box(
          g,
          q[0] + (r() - 0.5) * 0.07,
          q[1],
          q[2] + (r() - 0.5) * 0.08,
          0.025,
          0.029,
          0.025,
          "#87735d",
        );
    }
    return;
  }
  if (f === "beads") {
    for (let k = 0; k < 8; k++) {
      const a = k * 2.4;
      for (let j = 0; j < 5; j++) {
        const q = v(a, 0.23 + j * 0.015, j * 0.09);
        ellipsoid(g, ...q, 0.09, 0.07, 0.085, c, 0.046, k);
      }
    }
    return;
  }
  const tall =
      /berries|tomato|rose|camellia|gardenia|hibiscus|bougainvillea|jasmine/.test(
        f,
      ),
    broad = /split|hosta|hydrangea|round|coleus/.test(f);
  // Opposite leaves for herbs; basal leaves for hosta; woody branching for shrubs.
  for (let k = 0; k < 8; k++) {
    const a = k * 2.4,
      h = (tall ? 0.8 : 0.43) + r() * (tall ? 0.45 : 0.22),
      q = v(a, 0.36 + r() * 0.16, h),
      base = [0, tall ? 0.22 : 0, 0];
    beam(g, base, q, 0.028, tall ? "#8b785d" : shade(c, 0.8));
    const pairs = f === "strawberry" ? 3 : 2;
    for (let j = 0; j < pairs; j++) {
      const aa = a + (j * 6.283) / pairs,
        tip = [
          q[0] + Math.cos(aa) * 0.22,
          q[1] - 0.07,
          q[2] + Math.sin(aa) * 0.22,
        ];
      leaf(
        q.map((x, i) => (i === 1 ? x * 0.73 : x * 0.65)),
        tip,
        broad ? 0.32 : 0.19,
        c,
        /herb|strawberry|coleus|rose/.test(f),
      );
      if (f === "coleus")
        leaf(
          q.map((x) => x * 0.75),
          tip,
          0.13,
          flower,
        );
      if (f === "split")
        for (let t = 0; t < 3; t++)
          box(
            g,
            tip[0] + t * 0.025,
            tip[1],
            tip[2] + 0.065,
            0.055,
            0.025,
            0.06,
            shade(c, 0.67),
          );
    }
    if (
      k % 2 === 0 &&
      /trumpet|daisy|pansy|hydrangea|rose|camellia|gardenia|hibiscus|bougainvillea|jasmine|fuchsia|portulaca|kalanchoe|round/.test(
        f,
      )
    ) {
      if (f === "hydrangea")
        for (let j = 0; j < 9; j++) {
          const aa = j * 2.4;
          blossom(
            q[0] + Math.cos(aa) * 0.15,
            h + 0.07 + (j % 3) * 0.04,
            q[2] + Math.sin(aa) * 0.15,
            flower,
            4,
            0.055,
          );
        }
      else if (f === "fuchsia") {
        beam(g, q, [q[0] + 0.12, h - 0.15, q[2]], 0.022, c);
        blossom(q[0] + 0.12, h - 0.2, q[2], flower, 4, 0.1);
        box(g, q[0] + 0.12, h - 0.3, q[2], 0.12, 0.17, 0.12, "#8c6288");
      } else {
        blossom(
          q[0],
          h + 0.08,
          q[2],
          flower,
          f === "kalanchoe" ? 4 : f === "daisy" ? 10 : 5,
          0.14,
          /rose|gardenia|camellia/.test(f) ? 3 : 1,
        );
        if (f === "hibiscus")
          beam(
            g,
            [q[0], h + 0.1, q[2]],
            [q[0], h + 0.35, q[2]],
            0.035,
            "#c5b076",
          );
        if (f === "pansy")
          box(g, q[0], h + 0.14, q[2], 0.1, 0.025, 0.1, "#665361");
      }
    }
    if (/berries|tomato|strawberry|pepper/.test(f) && k % 2 === 0) {
      const col = f === "berries" ? "#798b9e" : "#b77c68";
      if (f === "pepper")
        leaf(
          [q[0], h - 0.03, q[2]],
          [q[0] + 0.03, h - 0.3, q[2] + 0.06],
          0.085,
          col,
        );
      else
        for (let j = 0; j < 3; j++) {
          const yy = h - 0.1 - j * 0.055;
          ellipsoid(
            g,
            q[0] + j * 0.06,
            yy,
            q[2] + 0.07,
            f === "strawberry" ? 0.075 : 0.07,
            f === "strawberry" ? 0.1 : 0.07,
            0.07,
            col,
            0.045,
            k + j,
          );
        }
    }
    if (f === "radish" && k === 0)
      ellipsoid(g, 0, 0.035, 0, 0.19, 0.14, 0.19, "#ab7973", 0.055, 8);
  }
}

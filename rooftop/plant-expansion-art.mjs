// Anatomy on the logical pixel grid. No loaded image, texture or generated bitmap.
const px = (c, x, y, w, h, col) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
function oval(c, x, y, rx, ry, col) {
  for (let j = -ry; j <= ry; j++) {
    const n = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry))));
    px(c, x - n, y + j, n * 2 + 1, 1, col);
  }
}
function line(c, x, y, xx, yy, col, w = 1) {
  const n = Math.max(1, Math.abs(xx - x), Math.abs(yy - y));
  for (let i = 0; i <= n; i++)
    px(c, x + ((xx - x) * i) / n, y + ((yy - y) * i) / n, w, w, col);
}
function poly(c, points, col) {
  const ys = points.map((p) => p[1]);
  for (let y = Math.ceil(Math.min(...ys)); y <= Math.max(...ys); y++) {
    const xs = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y))
        xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2)
      px(
        c,
        Math.ceil(xs[i]),
        y,
        Math.floor(xs[i + 1]) - Math.ceil(xs[i]) + 1,
        1,
        col,
      );
  }
}
const shade = (col, d) =>
  "#" +
  col
    .slice(1)
    .match(/../g)
    .map((v) =>
      Math.min(255, Math.max(0, parseInt(v, 16) + d))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
function bloom(c, x, y, col) {
  for (const [dx, dy] of [
    [0, -2],
    [2, 0],
    [0, 2],
    [-2, 0],
  ])
    oval(c, x + dx, y + dy, 2, 2, col);
  px(c, x, y, 1, 1, "#d8bc82");
}
function spine(c, x, y, col, long = false) {
  px(c, x, y, 1, 1, "#d1cbb0");
  line(c, x - 1, y + 1, x + (long ? 4 : 1), y - 2, col);
  if (long) line(c, x, y, x - 3, y - 3, col);
}
function ball(
  c,
  x,
  y,
  rx,
  ry,
  col,
  ribs = 8,
  {
    wool = false,
    spines = true,
    wavy = false,
    hook = false,
    spots = false,
  } = {},
) {
  oval(c, x, y, rx, ry, shade(col, -22));
  oval(c, x - 1, y - 1, rx - 1, ry - 1, col);
  for (let i = 1; i < ribs; i++) {
    const a = (i / ribs) * Math.PI,
      xx = x - Math.cos(a) * (rx - 1);
    for (let dy = -ry + 2; dy < ry; dy++) {
      const inset = Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)));
      px(
        c,
        x + (xx - x) * inset + (wavy ? Math.sin(dy * 1.1 + i) * 1.3 : 0),
        y + dy,
        1,
        1,
        shade(col, i % 2 ? 14 : -15),
      );
    }
    if (spines)
      for (let dy = -ry + 4; dy < ry - 1; dy += 5) {
        const xx =
          x - Math.cos(a) * (rx - 2) * Math.sqrt(1 - (dy * dy) / (ry * ry));
        spine(c, xx, y + dy, hook ? "#ad806c" : "#c1b892", hook);
        if (hook) line(c, xx + 4, y + dy - 2, xx + 4, y + dy, "#a37161");
      }
  }
  if (wool || spots)
    for (let i = 0; i < 45; i++) {
      const xx = ((((i * 13) % 23) - 11) * rx) / 12,
        yy = ((((i * 7) % 25) - 12) * ry) / 13;
      if ((xx * xx) / rx / rx + (yy * yy) / ry / ry < 0.88)
        px(
          c,
          x + xx,
          y + yy,
          wool ? 2 : 1,
          wool ? 2 : 1,
          wool ? "#c6c9b2" : "#c5c8b2",
        );
    }
}
function leaf(c, x, y, dx, dy, width, col) {
  poly(
    c,
    [
      [x, y],
      [
        x + dx * 0.5 - (dy / Math.max(1, Math.hypot(dx, dy))) * width,
        y + dy * 0.5 + (dx / Math.max(1, Math.hypot(dx, dy))) * width,
      ],
      [x + dx, y + dy],
      [
        x + dx * 0.5 + (dy / Math.max(1, Math.hypot(dx, dy))) * width,
        y + dy * 0.5 - (dx / Math.max(1, Math.hypot(dx, dy))) * width,
      ],
    ],
    col,
  );
  line(c, x, y, x + dx * 0.75, y + dy * 0.75, shade(col, 13));
}
export function paintExpansion(c, p) {
  if (!p.form.startsWith("exp-")) return false;
  const f = p.form.slice(4),
    col = p.leaf,
    dark = shade(col, -23),
    light = shade(col, 22);
  if (["star", "flatstar"].includes(f)) {
    const flat = f === "flatstar",
      r = flat ? 13 : 12,
      n = flat ? 8 : 5,
      cy = flat ? -7 : -11,
      ratio = flat ? 0.55 : 0.85;
    const contour = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (i * Math.PI) / n - Math.PI / 2,
        rad = i % 2 ? r * 0.76 : r;
      contour.push([Math.cos(a) * rad, cy + Math.sin(a) * rad * ratio]);
    }
    poly(c, contour, col);
    for (let i = 0; i < n; i++) {
      const a = (i * Math.PI * 2) / n - Math.PI / 2;
      line(
        c,
        0,
        cy,
        Math.cos(a) * r,
        cy + Math.sin(a) * r * ratio,
        i % 2 ? light : dark,
      );
      if (flat)
        for (let j = 1; j < 4; j++)
          oval(
            c,
            Math.cos(a) * j * 3,
            cy + Math.sin(a) * j * 3 * ratio,
            1,
            1,
            "#c9ccba",
          );
    }
    if (!flat)
      for (let i = 0; i < 45; i++) {
        const x = ((i * 7) % 21) - 10,
          y = ((i * 13) % 18) - 20;
        if ((x * x) / 120 + (y - cy) ** 2 / 90 < 0.8)
          px(c, x, y, 1, 1, "#c5c9b4");
      }
    oval(c, 0, cy, 2, 1, "#b4bca4");
  } else if (
    [
      "ribbed",
      "bluebarrel",
      "smooth",
      "chin",
      "chinflower",
      "hooked",
      "wavy",
      "woolball",
      "offsets",
    ].includes(f)
  ) {
    const chin = f.startsWith("chin"),
      opts = {
        spines: !["smooth", "woolball"].includes(f),
        wool: f === "woolball",
        spots: f === "ribbed",
        hook: f === "hooked",
        wavy: f === "wavy",
      };
    if (f === "offsets")
      for (const [x, y, r] of [
        [-9, -5, 5],
        [8, -7, 6],
        [0, -13, 7],
      ]) {
        ball(c, x, y, r, r, col, 6, opts);
        bloom(c, x + 3, y + 3, "#ba7866");
      }
    else {
      ball(
        c,
        0,
        -11,
        13,
        chin ? 9 : 12,
        col,
        f === "wavy" ? 19 : f === "hooked" ? 11 : 8,
        opts,
      );
      if (chin)
        for (let y = -16; y < -3; y += 4)
          for (let x = -8; x < 10; x += 6) {
            line(c, x, y, x + 3, y + 2, dark);
            line(c, x + 3, y + 2, x + 5, y, light);
          }
      if (f === "smooth")
        for (const [x, y] of [
          [-8, -14],
          [0, -20],
          [8, -14],
          [-9, -7],
          [0, -7],
          [9, -7],
        ])
          oval(c, x, y, 1, 1, "#d2cdb8");
      if (f === "chinflower") bloom(c, 2, -22, "#ae6574");
      if (f === "bluebarrel") bloom(c, 0, -23, "#cbbb7c");
    }
  } else if (
    [
      "fingers",
      "thimbles",
      "redcolumn",
      "goldcolumn",
      "haircolumn",
      "peanuts",
    ].includes(f)
  ) {
    const many = ["fingers", "thimbles", "peanuts"].includes(f),
      centers = many
        ? [
            [-9, -8, 4, 9],
            [0, -14, 4, 14],
            [8, -9, 4, 10],
          ]
        : [[0, -15, 8, 16]];
    for (const [x, y, rx, ry] of centers) {
      ball(c, x, y, rx, ry, col, 5, {
        spines: !["haircolumn", "goldcolumn"].includes(f),
        wool: f === "haircolumn",
      });
      if (["goldcolumn", "redcolumn", "thimbles"].includes(f))
        for (let yy = y - ry + 2; yy < y + ry; yy += 3)
          for (let xx = x - rx + 2; xx < x + rx; xx += 3)
            line(
              c,
              xx,
              yy,
              xx + 1,
              yy - 2,
              f === "goldcolumn"
                ? "#c3b17a"
                : f === "redcolumn"
                  ? "#9e7160"
                  : "#d4d0bc",
            );
      if (f === "haircolumn")
        for (let i = 0; i < 20; i++)
          line(
            c,
            ((i * 5) % 17) - 8,
            -29 + (i % 5),
            ((i * 7) % 19) - 9,
            -13 + (i % 12),
            "#c9cbb9",
          );
      if (f === "peanuts") bloom(c, x + 2, y - ry, "#bc7b65");
    }
  } else if (["segments", "fishbone", "threads", "beadtail"].includes(f)) {
    for (let k = 0; k < 3; k++) {
      const x = (k - 1) * 8,
        tip = 12 + (k % 2) * 8;
      line(c, 0, -5, x, tip, dark, 2);
      for (let y = -7; y < tip; y += f === "segments" ? 7 : 4) {
        const xx = (x * (y + 7)) / (tip + 7);
        if (f === "threads") {
          line(c, xx, y, xx + 5, y + 4, col);
          px(c, xx + 5, y + 4, 1, 1, "#c7c8ad");
        } else if (f === "beadtail") {
          oval(c, xx - 2, y, 3, 3, col);
          oval(c, xx + 2, y + 2, 3, 3, light);
          px(c, xx - 2, y - 1, 1, 1, "#b6c3b0");
        } else {
          leaf(c, xx, y, 5, -4, 3, col);
          leaf(c, xx, y, -5, -4, 3, light);
          if (f === "segments") line(c, xx - 3, y, xx + 3, y, dark);
        }
      }
      if (f === "segments") bloom(c, x, tip + 2, "#b78391");
    }
  } else if (["stones", "splitrock"].includes(f)) {
    const r = f === "stones" ? 7 : 10;
    for (const x of [-r / 2, r / 2]) {
      oval(c, x, -r * 0.7, r, r * 0.8, dark);
      oval(c, x - 1, -r * 0.8, r - 1, r * 0.65, col);
      oval(c, x - 1, -r - 2, r - 2, 2, light);
    }
    line(c, 0, -r * 1.5, 0, -2, dark);
    for (let i = 0; i < 28; i++) {
      const x = ((i * 7) % (r * 3)) - r * 1.5,
        y = ((i * 11) % 8) - r - 4;
      if (Math.abs(x) > 1)
        px(c, x, y, 1, 1, f === "splitrock" ? dark : shade(col, -35));
    }
  } else if (["windows", "fan", "bubble"].includes(f)) {
    const n = f === "fan" ? 6 : 9;
    for (let i = 0; i < n; i++) {
      const x =
          f === "fan" ? (i - 2.5) * 4 : Math.cos(i * 2.4) * Math.sqrt(i) * 4,
        y =
          f === "fan"
            ? -9 - (i % 2) * 5
            : Math.sin(i * 2.4) * Math.sqrt(i) * 2 - 5,
        r = f === "bubble" ? 4 : 3;
      oval(c, x, y, r, f === "bubble" ? 5 : 9, dark);
      oval(c, x - 1, y - 1, r - 1, f === "bubble" ? 4 : 8, col);
      oval(c, x - 1, y - (f === "bubble" ? 2 : 6), r - 1, 2, "#bec9b5");
      line(c, x - 1, y - 7, x - 1, y - 5, light);
    }
  } else if (["triangle", "ridged", "pointed", "powder", "jaws"].includes(f)) {
    for (let ring = 0; ring < 2; ring++) {
      const n = ring ? 6 : 9,
        len = ring ? 8 : 14;
      for (let i = 0; i < n; i++) {
        const a = (i * Math.PI * 2) / n + ring * 0.6,
          dx = Math.cos(a) * len,
          dy = Math.sin(a) * len * 0.65 - 5;
        leaf(c, 0, -5, dx, dy, f === "jaws" ? 4 : 3, ring ? light : col);
        if (f === "triangle")
          poly(
            c,
            [
              [dx * 0.45, -5 + dy * 0.45],
              [dx, -5 + dy],
              [dx * 0.8 + 2, -5 + dy * 0.8 + 2],
            ],
            "#b8c6ab",
          );
        if (f === "ridged")
          for (let j = 2; j < 5; j++)
            line(
              c,
              (dx * j) / 5 - 1,
              -5 + (dy * j) / 5,
              (dx * j) / 5 + 1,
              -5 + (dy * j) / 5,
              light,
            );
        if (f === "pointed") px(c, dx, -5 + dy, 2, 1, "#ad7c70");
        if (f === "jaws")
          for (let j = 2; j < 5; j++) {
            px(c, (dx * j) / 5 - 2, -5 + (dy * j) / 5, 1, 2, "#cdc8ab");
            px(c, (dx * j) / 5 + 2, -5 + (dy * j) / 5, 1, 2, "#cdc8ab");
          }
      }
    }
    px(c, -1, -8, 3, 2, light);
  } else if (["stacked", "scales"].includes(f)) {
    for (const x of [-7, 1, 8]) {
      line(c, x, 0, x, -24, dark);
      for (let y = -3; y > -25; y -= f === "stacked" ? 5 : 2) {
        poly(
          c,
          [
            [x - 4, y - 3],
            [x + 4, y - 3],
            [x + 1, y + 1],
            [x - 1, y + 1],
          ],
          col,
        );
        line(c, x - 3, y - 3, x + 3, y - 3, light);
        if (f === "stacked") px(c, x + 3, y - 3, 1, 1, "#ae8e84");
      }
      if (f === "scales") line(c, x, -10, x + 4, -20, col, 2);
    }
  } else if (
    ["velvet", "felt", "paddles", "paws", "crinkle", "tree"].includes(f)
  ) {
    const tree = f === "tree";
    line(c, 0, 0, 0, tree ? -25 : -18, tree ? "#877961" : dark, 2);
    if (tree) {
      for (const [x, y] of [
        [-10, -15],
        [9, -20],
        [0, -29],
      ]) {
        line(c, 0, -5, x, y, "#877961", 2);
        for (let i = 0; i < 7; i++) {
          const a = (i * 6.28) / 7;
          leaf(c, x, y, Math.cos(a) * 8, Math.sin(a) * 5 - 2, 2, col);
        }
      }
    } else
      for (let i = 0; i < 6; i++) {
        const x = (i % 2 ? 1 : -1) * (4 + (i % 3) * 3),
          y = -5 - Math.floor(i / 2) * 7,
          rx = f === "paddles" ? 7 : 4,
          ry = f === "felt" ? 7 : 4;
        line(c, 0, y + 3, x, y, dark);
        oval(c, x, y, rx, ry, dark);
        oval(c, x - 1, y - 1, rx - 1, ry - 1, col);
        line(c, x - rx + 2, y - ry + 1, x + 1, y - ry + 1, light);
        if (f === "paddles" || f === "felt")
          for (let j = 0; j < 4; j++)
            px(
              c,
              x + rx - 1,
              y - ry + 2 + j * 2,
              1,
              1,
              f === "felt" ? "#95775f" : "#af8172",
            );
        if (["velvet", "felt", "paws"].includes(f))
          for (let j = 0; j < 8; j++)
            px(
              c,
              x + ((j * 3) % 7) - 3,
              y + ((j * 5) % 7) - 3,
              1,
              1,
              "#c2c5ab",
            );
        if (f === "paws" || f === "crinkle")
          for (let j = -2; j <= 2; j += 2) {
            px(c, x + j, y - ry - 1, 1, 2, f === "paws" ? "#a68767" : light);
          }
      }
  } else {
    // Bryophytes: different branching, leaf ranks and capitula, not coloured blobs.
    for (let i = 0; i < 13; i++) {
      const x = ((i * 11) % 27) - 13,
        y = ((i * 7) % 9) - 3,
        h = 5 + (i % 4) * 2;
      line(c, x, y, x, y - h, dark);
      if (
        ["feather", "fern-moss", "two-row", "broad-moss", "bent"].includes(f)
      ) {
        for (let j = 1; j < h; j += 2) {
          const len = f === "broad-moss" ? 4 : f === "fern-moss" ? 5 : 3;
          line(c, x, y - j, x - len, y - j - 2, col);
          line(c, x, y - j, x + len, y - j - 2, light);
          if (f === "fern-moss")
            for (const sign of [-1, 1])
              for (let k = 1; k < 4; k++)
                px(c, x + sign * k, y - j - k - 1, 1, 2, col);
          if (f === "broad-moss")
            line(c, x - len, y - j - 1, x + len, y - j - 1, dark);
        }
      } else if (["stars", "redstars", "sphagnum"].includes(f)) {
        for (let j = 0; j < 6; j++) {
          const a = (j * 6.28) / 6;
          line(c, x, y - h, x + Math.cos(a) * 4, y - h + Math.sin(a) * 3, col);
          if (f === "redstars")
            px(
              c,
              x + Math.cos(a) * 4,
              y - h + Math.sin(a) * 3,
              1,
              1,
              "#a78b73",
            );
        }
        if (f === "sphagnum") oval(c, x, y - h, 1, 1, light);
      } else {
        const len = f === "swept" ? h : 4;
        for (let j = -2; j <= 2; j++)
          line(c, x, y, x + j + (f === "swept" ? 4 : 0), y - len, col);
        px(c, x, y - len, 2, 1, light);
        if (f === "hairpoints")
          line(c, x, y - len, x + 1, y - len - 4, "#c6cbb4");
      }
      if (["silver", "cushion"].includes(f)) oval(c, x, y - h + 3, 2, 2, light);
    }
    if (f === "hairpoints")
      for (const x of [-10, 9]) {
        line(c, x, -8, x + 1, -17, "#987e60");
        oval(c, x + 1, -18, 1, 2, "#ad9469");
      }
  }
  return true;
}

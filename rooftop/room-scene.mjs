export const ROOM_LAYOUT = [
  {
    type: "tierstand",
    x: 352,
    y: 96,
    rotation: 0,
    scale: 1,
    id: "005f6ff7-aea2-443b-9943-b06702e9c69b",
  },
  {
    type: "new-cooperi",
    x: 340,
    y: 92,
    rotation: 0,
    scale: 0.5,
    id: "c4b07a4e-8667-4bc6-b306-61ec2aa2419d",
    seed: 2839102273,
    pot: "mashiko",
  },
  {
    type: "new-tomentosa-cot",
    x: 352,
    y: 92,
    rotation: 0,
    scale: 0.5,
    id: "31fe61dd-64e7-4570-ad35-d8c6e7d839cc",
    seed: 1512124951,
    pot: "tokoname",
  },
  {
    type: "new-agavoides",
    x: 344,
    y: 84,
    rotation: 0,
    scale: 0.5,
    id: "b8370961-7e3f-42be-9d41-5c945d9e84fb",
    seed: 1549790059,
    pot: "shigaraki",
  },
  {
    type: "new-truncata-haw",
    x: 364,
    y: 88,
    rotation: 0,
    scale: 0.5,
    id: "94d4a8b1-603b-4819-bd03-37ac2fb2b8a5",
    seed: 3915421168,
    pot: "bizen",
  },
  {
    type: "vine",
    x: 340,
    y: 168,
    rotation: 0,
    scale: 0.5,
    id: "919157b7-563e-4105-808a-a81e7ecb1b93",
    seed: 1491560239,
  },
  {
    type: "room-bed",
    x: 248,
    y: 176,
    rotation: 0,
    scale: 1,
    id: "f8c77734-845f-4731-b26f-cf1186167c1b",
  },
  {
    type: "room-wardrobe",
    x: 360,
    y: 300,
    rotation: 180,
    scale: 1,
    id: "e929418f-04e0-48f3-9628-589d5f654fe6",
  },
  {
    type: "room-wardrobe",
    x: 312,
    y: 300,
    rotation: 180,
    scale: 1,
    id: "c78f9969-bb63-46d2-9482-45d1d632665d",
  },
  {
    type: "room-dresser",
    x: 256,
    y: 108,
    rotation: 0,
    scale: 1,
    id: "2f066336-2e4f-4582-8d4d-6f39714dfb66",
  },
  {
    type: "room-armchair",
    x: 364,
    y: 204,
    rotation: 270,
    scale: 1,
    id: "3224e381-33f4-4b41-af68-3849f8bd8c6f",
  },
  {
    type: "bench",
    x: 348,
    y: 176,
    rotation: 0,
    scale: 1,
    id: "aa02901d-ca95-4dc3-afe9-7191a2553b5d",
  },
  {
    type: "tierstand",
    x: 368,
    y: 148,
    rotation: 90,
    scale: 1,
    id: "cb4a5493-ed9c-40e8-9f58-9ff9c91234cd",
  },
  {
    type: "fern",
    x: 368,
    y: 128,
    rotation: 0,
    scale: 0.5,
    id: "9ec7f071-3c4c-4e14-a2d0-3cdafbc7958f",
    seed: 3866626614,
  },
  {
    type: "room-dresser",
    x: 348,
    y: 232,
    rotation: 90,
    scale: 1,
    id: "5e4917a3-277c-4af5-b016-3719526c26f2",
  },
  {
    type: "hosta",
    x: 348,
    y: 212,
    rotation: 0,
    scale: 0.5,
    id: "f275ca4c-bc86-46fb-8bdb-06c36320482b",
    seed: 1967756716,
    pot: "arita",
  },
  {
    type: "snake",
    x: 364,
    y: 136,
    rotation: 0,
    scale: 0.5,
    id: "e1b6e2f7-0dc4-45d9-921d-748583826474",
    seed: 2614565078,
    pot: "kyoto",
  },
  {
    type: "broadleaf",
    x: 288,
    y: 120,
    rotation: 0,
    scale: 0.8,
    id: "c22dc30a-bdc2-4302-acd4-3be1071c8fb4",
    seed: 1813844347,
    pot: "growbag",
  },
];
export function paintRoomBase(c) {
  const px = (x, y, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(x, y, w, h);
  };
  px(0, 0, 640, 520, "#aaa994");
  px(211, 65, 178, 272, "#787b66");
  px(216, 70, 168, 262, "#c6bea4");
  px(220, 104, 160, 224, "#b0a48c");
  for (let y = 104; y < 328; y += 16)
    for (let x = 220; x < 380; x += 32) {
      px(x, y, 31, 15, (x + y) % 3 ? "#b4a991" : "#ab9d84");
      px(x, y, 32, 1, "#c7bba1");
      px(x + 31, y, 1, 16, "#998e76");
    }
  // Ordered two-colour dithering follows the light and worn material edges.
  for (let y = 72; y < 104; y++)
    for (let x = 220; x < 380; x++)
      if ((x + y) % 2 === 0 && (y > 94 || x < 228 || x > 372))
        px(x, y, 1, 1, "#b5ad93");
  for (let y = 105; y < 328; y++)
    for (let x = 220; x < 380; x++) {
      const edge = Math.min(x - 220, 379 - x),
        grain = (x * 17 + y * 31) % 97;
      if ((edge < 8 && (x + y) % 2 === 0) || grain < 4)
        px(x, y, 1, 1, "#9d937d");
      else if (grain > 93) px(x, y, 1, 1, "#c0b49b");
    }
  px(272, 74, 56, 27, "#6b7567");
  px(275, 77, 50, 21, "#9cae9f");
  for (let y = 78; y < 98; y += 4) {
    px(275, y, 50, 2, "#c1c9ad");
    px(275, y + 2, 50, 1, "#7c8e7e");
    for (let x = 276; x < 325; x += 2) px(x, y, 1, 1, "#aab89e");
  }
  px(298, 77, 2, 21, "#d0cfad");
  px(326, 79, 1, 18, "#716f59");
  px(325, 96, 3, 2, "#a59976");
  px(216, 328, 168, 4, "#847b64");
  // A quiet timber doorway sits in the left wall, clear of the window.
  px(214, 248, 17, 54, "#555e4d");
  px(216, 250, 13, 50, "#b5a17d");
  px(218, 252, 9, 46, "#8e7d60");
  px(219, 253, 7, 1, "#c0ab84");
  px(219, 254, 1, 42, "#aa9570");
  px(225, 254, 1, 42, "#73654f");
  for (let y = 257; y < 295; y += 9) {
    px(220, y, 5, 1, "#b49d76");
    px(220, y + 1, 5, 1, "#7e6f55");
  }
  for (let y = 254; y < 296; y++)
    if (y % 3 === 0) px(222 + (y % 2), y, 1, 1, "#a38d68");
  px(224, 278, 2, 3, "#d3ba7f");
  px(224, 279, 1, 1, "#ede0ab");
  px(214, 301, 18, 2, "#c9bc9a");
  px(215, 303, 16, 1, "#8f846b");
}

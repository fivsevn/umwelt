// Shared by the live device, settings and the appearance workbench.
export const shells = [
  {
    "id": "leopard",
    "code": "S01",
    "name": "豹纹奶油",
    "labels": {
      "zh": "豹纹奶油",
      "en": "Leopard cream",
      "ja": "ヒョウ柄クリーム"
    },
    "color": "#e6bf62",
    "image": "../assets/device/shell-leopard.webp",
    "muted": true
  },
  {
    "id": "tokay",
    "code": "S02",
    "name": "蛤蚧冰蓝",
    "labels": {
      "zh": "蛤蚧冰蓝",
      "en": "Ice blue",
      "ja": "アイスブルー"
    },
    "color": "#aac8cd",
    "image": "../assets/device/shell-iceblue.webp",
    "socketFit": true
  },
  {
    "id": "fat-tail",
    "code": "S03",
    "name": "瘤尾暮粉",
    "labels": {
      "zh": "瘤尾暮粉",
      "en": "Dusk pink",
      "ja": "ダスクピンク"
    },
    "color": "#b58d89",
    "image": "../assets/device/shell-duskpink.webp"
  },
  {
    "id": "stone",
    "code": "S04",
    "name": "雾灰朱线",
    "labels": {
      "zh": "雾灰朱线",
      "en": "Mist vermilion",
      "ja": "霧灰と朱"
    },
    "color": "#c8c7c2",
    "image": "../assets/device/shell-mistgray.webp"
  },
  {
    "id": "day",
    "code": "S05",
    "name": "日行青柠",
    "labels": {
      "zh": "日行青柠",
      "en": "Lime green",
      "ja": "ライムグリーン"
    },
    "color": "#a9d748",
    "image": "../assets/device/shell-lime.webp",
    "buttonFinish": "../assets/device/buttons-lime.webp"
  },
  {
    "id": "electric",
    "code": "S06",
    "name": "电蓝琥珀",
    "labels": {
      "zh": "电蓝琥珀",
      "en": "Electric amber",
      "ja": "ブルーと琥珀"
    },
    "color": "#1a6dcc",
    "image": "../assets/device/shell-electric.webp",
    "buttonFinish": "../assets/device/buttons-electric.webp"
  }
];

export const antennas = [
  {
    "id": "graphite",
    "code": "A01",
    "name": "石墨短杆",
    "labels": {
      "zh": "石墨短杆",
      "en": "Graphite rod",
      "ja": "グラファイト"
    },
    "image": "../assets/device/antenna-graphite.webp",
    "width": 104,
    "height": 311.75,
    "anchor": [
      0.5,
      0.9609238171611868
    ],
    "seatOffset": [
      0,
      10
    ],
    "collarDiameter": 56,
    "upperHeight": 263.25
  },
  {
    "id": "clearfin",
    "code": "A02",
    "name": "烟绿透明鳍",
    "labels": {
      "zh": "烟绿透明鳍",
      "en": "Clear fin",
      "ja": "透明フィン"
    },
    "image": "../assets/device/antenna-clearfin.webp",
    "width": 104,
    "height": 347.75,
    "anchor": [
      0.5,
      0.9649690869877785
    ],
    "seatOffset": [
      0,
      10
    ],
    "collarDiameter": 56,
    "upperHeight": 299.25
  },
  {
    "id": "toepad",
    "code": "A03",
    "name": "趾垫扇",
    "labels": {
      "zh": "趾垫扇",
      "en": "Toe fan",
      "ja": "トウファン"
    },
    "image": "../assets/device/antenna-toepad.webp",
    "width": 220,
    "height": 330,
    "anchor": [
      0.5,
      0.9342969696969696
    ],
    "seatOffset": [
      0,
      10
    ],
    "collarDiameter": 56,
    "upperHeight": 272
  },
  {
    "id": "tail-loop",
    "code": "A04",
    "name": "卷尾环",
    "labels": {
      "zh": "卷尾环",
      "en": "Curled tail",
      "ja": "巻き尾"
    },
    "image": "../assets/device/antenna-tail-loop.webp",
    "width": 220,
    "height": 330,
    "anchor": [
      0.5,
      0.9342969696969696
    ],
    "seatOffset": [
      0,
      10
    ],
    "collarDiameter": 56,
    "upperHeight": 272
  },
  {
    "id": "crest",
    "code": "A05",
    "name": "珍珠睫冠",
    "labels": {
      "zh": "珍珠睫冠",
      "en": "Pearl crest",
      "ja": "パールクレスト"
    },
    "image": "../assets/device/antenna-crest.webp",
    "width": 220,
    "height": 330,
    "anchor": [
      0.5,
      0.9342969696969696
    ],
    "seatOffset": [
      0,
      10
    ],
    "collarDiameter": 56,
    "upperHeight": 272
  }
];

export const charms = [
  {
    "id": "beads",
    "code": "C01",
    "name": "原像素拼豆",
    "labels": {
      "zh": "原像素拼豆",
      "en": "Pixel beads",
      "ja": "ピクセルビーズ"
    },
    "image": "../assets/device/charm-beads.webp",
    "mobileCord": "../assets/device/cord-beads-coiled.webp",
    "mobileFit": {
      "crop": [175,463,235,270],
      "position": [692,-74],
      "tip": [290,468],
      "entry": [118,89],
      "head": [120,110],
      "cordSize": [1254,1254],
      "cordEnds": [[923,1099],[925,248]]
    },
    "fit": {
      "anchor": [
        27.5,
        56
      ],
      "rear": "M-4.5 -7H87.5V57L74.5 65Q58.5 63 38.5 52L-4.5 28Z",
      "contact": 0.42
    }
  },
  {
    "id": "leopard-tail",
    "code": "C02",
    "name": "豹纹尾巴",
    "labels": {
      "zh": "豹纹尾巴",
      "en": "Leopard tail",
      "ja": "ヒョウ柄しっぽ"
    },
    "image": "../assets/device/charm-leopard-tail.webp",
    "mobileCord": "../assets/device/cord-leopard-tail-coiled.webp",
    "mobileFit": {
      "crop": [
        182,
        487,
        165,
        389
      ],
      "position": [
        685.2906721678152,
        -111.86484549074345
      ],
      "angle": 25,
      "head": [
        120,
        110
      ],
      "entry": [
        114,
        88.25
      ],
      "tip": [
        252,
        497
      ],
      "cordSize": [
        1254,
        1254
      ],
      "cordEnds": [
        [
          926,
          1103
        ],
        [
          925,
          248
        ]
      ],
      "cordScale": 0.5,
      "cordShearY": -0.13,
      "join": {
        "direction": 90,
        "scale": 0.8,
        "radius": 300
      }
    },
    "fit": {
      "anchor": [
        40,
        66
      ],
      "rear": "M0 0H110V70L94 78Q75 74 51 61L0 35Z",
      "contact": 0.38
    }
  },
  {
    "id": "crested",
    "code": "C03",
    "name": "软糖睫角",
    "labels": {
      "zh": "软糖睫角",
      "en": "Gummy crest",
      "ja": "グミクレス"
    },
    "image": "../assets/device/charm-crested.webp",
    "mobileCord": "../assets/device/cord-crested-coiled.webp",
    "mobileFit": {
      "crop": [
        170,
        512,
        222,
        364
      ],
      "position": [
        699.57,
        -110.65182217350893
      ],
      "angle": 30,
      "head": [
        120,
        110
      ],
      "entry": [
        114,
        91.5
      ],
      "tip": [
        227,
        521
      ],
      "cordSize": [
        1254,
        1254
      ],
      "cordEnds": [
        [
          924,
          1102
        ],
        [
          920,
          250
        ]
      ],
      "cordScale": 0.5,
      "cordShearY": -0.13,
      "join": {
        "direction": 90,
        "scale": 0.76,
        "radius": 300
      }
    },
    "fit": {
      "anchor": [
        30,
        64
      ],
      "rear": "M0 0H109V72L91 79Q66 72 42 58L0 34Z",
      "contact": 0.26
    }
  },
  {
    "id": "gstream",
    "code": "C04",
    "name": "G-stream",
    "labels": {
      "zh": "G-stream",
      "en": "G-stream",
      "ja": "G-stream"
    },
    "image": "../assets/device/charm-gstream.webp",
    "mobileCord": "../assets/device/cord-gstream-coiled.webp",
    "mobileFit": {
      "crop": [
        182,
        463,
        210,
        484
      ],
      "position": [
        583.1419460939255,
        -73.06253770370681
      ],
      "angle": -25,
      "head": [
        120,
        110
      ],
      "entry": [
        114,
        87.5
      ],
      "tip": [
        214,
        473
      ],
      "cordSize": [
        1254,
        1254
      ],
      "cordEnds": [
        [
          924,
          1106
        ],
        [
          919,
          251
        ]
      ],
      "cordScale": 0.35,
      "cordShearY": -0.175,
      "join": {
        "direction": 90,
        "scale": 0.9,
        "radius": 300
      }
    },
    "fit": {
      "anchor": [
        32,
        58
      ],
      "rear": "M0 0H105V62L86 69Q63 65 42 53L0 32Z",
      "contact": 0.32
    }
  },
  {
    "id": "eggs",
    "code": "C05",
    "name": "双卵胶囊",
    "labels": {
      "zh": "双卵胶囊",
      "en": "Twin eggs",
      "ja": "ふたご卵"
    },
    "image": "../assets/device/charm-eggs.webp",
    "mobileCord": "../assets/device/cord-eggs-coiled.webp",
    "mobileFit": {
      "crop": [
        154,
        470,
        214,
        409
      ],
      "position": [
        641.0187985667433,
        -131.47907379214092
      ],
      "angle": 20,
      "head": [
        120,
        110
      ],
      "entry": [
        114,
        91
      ],
      "tip": [
        320,
        478
      ],
      "cordSize": [
        1254,
        1254
      ],
      "cordEnds": [
        [
          921,
          1102
        ],
        [
          926,
          247
        ]
      ],
      "cordScale": 0.5,
      "cordShearY": -0.1,
      "join": {
        "direction": 90,
        "scale": 0.9,
        "radius": 300
      }
    },
    "fit": {
      "anchor": [
        25,
        65
      ],
      "rear": "M0 0H111V69L92 79Q63 72 36 59L0 34Z",
      "contact": 0.38
    },
    "contactShadow": true
  },
  {
    "id": "silver-toe",
    "code": "C06",
    "name": "趾垫银手",
    "labels": {
      "zh": "趾垫银手",
      "en": "Silver toes",
      "ja": "銀のあし"
    },
    "image": "../assets/device/charm-silver-toe.webp",
    "mobileCord": "../assets/device/cord-silver-toe-coiled.webp",
    "mobileFit": {
      "crop": [
        170,
        500,
        222,
        334
      ],
      "position": [
        631.75,
        -78
      ],
      "angle": 0,
      "head": [
        130,
        115
      ],
      "entry": [
        124,
        97.5
      ],
      "tip": [
        263.25,
        514
      ],
      "cordSize": [
        1254,
        1254
      ],
      "cordEnds": [
        [
          919,
          1101
        ],
        [
          925,
          247
        ]
      ],
      "cordScale": 0.5,
      "cordShearY": -0.1,
      "join": {
        "direction": 90,
        "scale": 0.8,
        "radius": 300
      }
    },
    "fit": {
      "anchor": [
        38,
        67
      ],
      "rear": "M0 0H119V76L99 82Q74 77 49 62L0 35Z",
      "contact": 0.38
    }
  },
  {
    "id": "rock-hide",
    "code": "C07",
    "name": "岩隙小屋",
    "labels": {
      "zh": "岩隙小屋",
      "en": "Rock hide",
      "ja": "岩のかくれ家"
    },
    "image": "../assets/device/charm-rock-hide.webp",
    "mobileCord": "../assets/device/cord-rock-hide-coiled.webp",
    "mobileFit": {
      "crop": [
        191,
        514,
        185,
        295
      ],
      "position": [
        732,
        -70
      ],
      "angle": 0,
      "head": [
        130,
        120
      ],
      "entry": [
        124,
        102.75
      ],
      "tip": [
        259,
        526
      ],
      "cordSize": [
        1254,
        1254
      ],
      "cordEnds": [
        [
          922,
          1102
        ],
        [
          928,
          251
        ]
      ],
      "cordScale": 0.5,
      "cordShearY": -0.075,
      "join": {
        "direction": 90,
        "scale": 0.8,
        "radius": 300
      }
    },
    "fit": {
      "anchor": [
        43,
        69
      ],
      "rear": "M0 0H122V80L102 87Q80 80 56 64L0 36Z",
      "contact": 0.4
    }
  },
  {
    "id": "blue-dew",
    "code": "C08",
    "name": "蓝色露珠",
    "labels": {
      "zh": "蓝色露珠",
      "en": "Blue dew",
      "ja": "青いしずく"
    },
    "image": "../assets/device/charm-blue-dew.webp",
    "mobileCord": "../assets/device/cord-blue-dew-coiled.webp",
    "mobileFit": {
      "crop": [
        201,
        505,
        191,
        378
      ],
      "position": [
        672.8687784234177,
        -98.34438117135501
      ],
      "angle": 20,
      "head": [
        130,
        115
      ],
      "entry": [
        124,
        98
      ],
      "tip": [
        260,
        517
      ],
      "cordSize": [
        1254,
        1254
      ],
      "cordEnds": [
        [
          919,
          1102
        ],
        [
          927,
          250
        ]
      ],
      "cordScale": 0.5,
      "cordShearY": -0.13,
      "join": {
        "direction": 90,
        "scale": 0.85,
        "radius": 300
      }
    },
    "fit": {
      "anchor": [
        40,
        67
      ],
      "rear": "M0 0H120V75L99 82Q76 76 52 61L0 35Z",
      "contact": 0.38
    }
  }
];

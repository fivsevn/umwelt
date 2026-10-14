export const BACKGROUND = Object.freeze({
  "format": "blender-environment-v2",
  "stride": 8,
  "cube": {
    "offset": 0,
    "vertices": 36
  },
  "source": "rooftop/art/rooftop-lowpoly-02/game-environment.blend",
  "texture": "terrace-book.png",
  "binary": "empty-rooftop.bin",
  "textures": [
    {
      "file": "terrace-book.png",
      "sha256": "d0edaf9d5e1fec4c2828d7eb2a2d6f0d37e27e5a104ed46ffc2f15190ce80ab7",
      "bytes": 103102,
      "width": 1024,
      "height": 1024
    },
    {
      "file": "distance-facades.png",
      "sha256": "a1b6531363fb70df9b3fadec601bd1388f1c7bc9c3148943eaf00191d06e6189",
      "bytes": 337375,
      "width": 2048,
      "height": 2048
    },
    {
      "file": "distance-lights.png",
      "sha256": "1f695a805c0ef578c9fd2c987f64d9c6269246e11526517c8cfa168ab47cfe99",
      "bytes": 370410,
      "width": 2048,
      "height": 2048
    }
  ],
  "parts": [
    {
      "field": "ground",
      "layer": "ground",
      "rect": [
        384,
        384,
        128,
        128
      ],
      "mode": "instances",
      "offset": 7040,
      "directCount": 1,
      "count": 1,
      "assemblies": []
    },
    {
      "field": "road",
      "layer": "ground",
      "rect": [
        128,
        384,
        128,
        128
      ],
      "mode": "instances",
      "offset": 7104,
      "directCount": 1360,
      "count": 1360,
      "assemblies": []
    },
    {
      "field": "paving",
      "layer": "ground",
      "rect": [
        480,
        176,
        32,
        32
      ],
      "mode": "instances",
      "offset": 94144,
      "directCount": 1258,
      "count": 1258,
      "assemblies": []
    },
    {
      "field": "blue-glass",
      "layer": "ground",
      "rect": [
        288,
        320,
        32,
        32
      ],
      "mode": "instances",
      "offset": 174656,
      "directCount": 113,
      "count": 113,
      "assemblies": []
    },
    {
      "field": "rust-iron",
      "layer": "ground",
      "rect": [
        768,
        64,
        256,
        64
      ],
      "mode": "instances",
      "offset": 181888,
      "directCount": 161,
      "count": 161,
      "assemblies": []
    },
    {
      "field": "rust-iron",
      "layer": "near",
      "rect": [
        768,
        64,
        256,
        64
      ],
      "mode": "instances",
      "offset": 192192,
      "directCount": 16,
      "count": 6242,
      "assemblies": [
        {
          "sourceOffset": 193216,
          "sourceCount": 934,
          "worldOffset": 1152,
          "worldCount": 1
        },
        {
          "sourceOffset": 252992,
          "sourceCount": 744,
          "worldOffset": 1216,
          "worldCount": 1
        },
        {
          "sourceOffset": 300608,
          "sourceCount": 740,
          "worldOffset": 1280,
          "worldCount": 1
        },
        {
          "sourceOffset": 347968,
          "sourceCount": 706,
          "worldOffset": 1344,
          "worldCount": 1
        },
        {
          "sourceOffset": 393152,
          "sourceCount": 1238,
          "worldOffset": 1408,
          "worldCount": 1
        },
        {
          "sourceOffset": 472384,
          "sourceCount": 932,
          "worldOffset": 1472,
          "worldCount": 1
        },
        {
          "sourceOffset": 532032,
          "sourceCount": 932,
          "worldOffset": 1536,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "blue-glass",
      "layer": "near",
      "rect": [
        288,
        320,
        32,
        32
      ],
      "mode": "instances",
      "offset": 591680,
      "directCount": 3,
      "count": 507,
      "assemblies": [
        {
          "sourceOffset": 591872,
          "sourceCount": 76,
          "worldOffset": 1152,
          "worldCount": 1
        },
        {
          "sourceOffset": 596736,
          "sourceCount": 60,
          "worldOffset": 1216,
          "worldCount": 1
        },
        {
          "sourceOffset": 600576,
          "sourceCount": 60,
          "worldOffset": 1280,
          "worldCount": 1
        },
        {
          "sourceOffset": 604416,
          "sourceCount": 60,
          "worldOffset": 1344,
          "worldCount": 1
        },
        {
          "sourceOffset": 608256,
          "sourceCount": 96,
          "worldOffset": 1408,
          "worldCount": 1
        },
        {
          "sourceOffset": 614400,
          "sourceCount": 76,
          "worldOffset": 1472,
          "worldCount": 1
        },
        {
          "sourceOffset": 619264,
          "sourceCount": 76,
          "worldOffset": 1536,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "stained-plaster",
      "layer": "near",
      "rect": [
        0,
        576,
        768,
        64
      ],
      "mode": "instances",
      "offset": 624128,
      "directCount": 3,
      "count": 210,
      "assemblies": [
        {
          "sourceOffset": 624320,
          "sourceCount": 69,
          "worldOffset": 1216,
          "worldCount": 1
        },
        {
          "sourceOffset": 628736,
          "sourceCount": 69,
          "worldOffset": 1280,
          "worldCount": 1
        },
        {
          "sourceOffset": 633152,
          "sourceCount": 69,
          "worldOffset": 1344,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "awning",
      "layer": "near",
      "rect": [
        256,
        384,
        64,
        64
      ],
      "mode": "instances",
      "offset": 637568,
      "directCount": 6,
      "count": 990,
      "assemblies": [
        {
          "sourceOffset": 637952,
          "sourceCount": 144,
          "worldOffset": 1152,
          "worldCount": 1
        },
        {
          "sourceOffset": 647168,
          "sourceCount": 120,
          "worldOffset": 1216,
          "worldCount": 1
        },
        {
          "sourceOffset": 654848,
          "sourceCount": 120,
          "worldOffset": 1280,
          "worldCount": 1
        },
        {
          "sourceOffset": 662528,
          "sourceCount": 120,
          "worldOffset": 1344,
          "worldCount": 1
        },
        {
          "sourceOffset": 670208,
          "sourceCount": 192,
          "worldOffset": 1408,
          "worldCount": 1
        },
        {
          "sourceOffset": 682496,
          "sourceCount": 144,
          "worldOffset": 1472,
          "worldCount": 1
        },
        {
          "sourceOffset": 691712,
          "sourceCount": 144,
          "worldOffset": 1536,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "red-roof",
      "layer": "near",
      "rect": [
        384,
        208,
        128,
        48
      ],
      "mode": "instances",
      "offset": 700928,
      "directCount": 16,
      "count": 16,
      "assemblies": []
    },
    {
      "field": "foliage",
      "layer": "near",
      "rect": [
        320,
        384,
        64,
        64
      ],
      "mode": "instances",
      "offset": 701952,
      "directCount": 16,
      "count": 16,
      "assemblies": []
    },
    {
      "field": "metal",
      "layer": "near",
      "rect": [
        768,
        0,
        256,
        64
      ],
      "mode": "instances",
      "offset": 702976,
      "directCount": 2,
      "count": 2850,
      "assemblies": [
        {
          "sourceOffset": 703104,
          "sourceCount": 382,
          "worldOffset": 1152,
          "worldCount": 1
        },
        {
          "sourceOffset": 727552,
          "sourceCount": 398,
          "worldOffset": 1216,
          "worldCount": 1
        },
        {
          "sourceOffset": 753024,
          "sourceCount": 398,
          "worldOffset": 1280,
          "worldCount": 1
        },
        {
          "sourceOffset": 778496,
          "sourceCount": 394,
          "worldOffset": 1344,
          "worldCount": 1
        },
        {
          "sourceOffset": 803712,
          "sourceCount": 512,
          "worldOffset": 1408,
          "worldCount": 1
        },
        {
          "sourceOffset": 836480,
          "sourceCount": 382,
          "worldOffset": 1472,
          "worldCount": 1
        },
        {
          "sourceOffset": 860928,
          "sourceCount": 382,
          "worldOffset": 1536,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "cap",
      "layer": "near",
      "rect": [
        768,
        128,
        256,
        64
      ],
      "mode": "instances",
      "offset": 885376,
      "directCount": 0,
      "count": 9615,
      "assemblies": [
        {
          "sourceOffset": 885376,
          "sourceCount": 1253,
          "worldOffset": 1152,
          "worldCount": 1
        },
        {
          "sourceOffset": 965568,
          "sourceCount": 1404,
          "worldOffset": 1216,
          "worldCount": 1
        },
        {
          "sourceOffset": 1055424,
          "sourceCount": 1404,
          "worldOffset": 1280,
          "worldCount": 1
        },
        {
          "sourceOffset": 1145280,
          "sourceCount": 1404,
          "worldOffset": 1344,
          "worldCount": 1
        },
        {
          "sourceOffset": 1235136,
          "sourceCount": 1644,
          "worldOffset": 1408,
          "worldCount": 1
        },
        {
          "sourceOffset": 1340352,
          "sourceCount": 1253,
          "worldOffset": 1472,
          "worldCount": 1
        },
        {
          "sourceOffset": 1420544,
          "sourceCount": 1253,
          "worldOffset": 1536,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "cement",
      "layer": "near",
      "rect": [
        768,
        192,
        256,
        64
      ],
      "mode": "instances",
      "offset": 1500736,
      "directCount": 0,
      "count": 3976,
      "assemblies": [
        {
          "sourceOffset": 1500736,
          "sourceCount": 683,
          "worldOffset": 1152,
          "worldCount": 1
        },
        {
          "sourceOffset": 1544448,
          "sourceCount": 339,
          "worldOffset": 1216,
          "worldCount": 1
        },
        {
          "sourceOffset": 1566144,
          "sourceCount": 339,
          "worldOffset": 1280,
          "worldCount": 1
        },
        {
          "sourceOffset": 1587840,
          "sourceCount": 339,
          "worldOffset": 1344,
          "worldCount": 1
        },
        {
          "sourceOffset": 1609536,
          "sourceCount": 910,
          "worldOffset": 1408,
          "worldCount": 1
        },
        {
          "sourceOffset": 1667776,
          "sourceCount": 683,
          "worldOffset": 1472,
          "worldCount": 1
        },
        {
          "sourceOffset": 1711488,
          "sourceCount": 683,
          "worldOffset": 1536,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "facade",
      "layer": "near",
      "rect": [
        768,
        256,
        256,
        256
      ],
      "mode": "instances",
      "offset": 1755200,
      "directCount": 0,
      "count": 553,
      "assemblies": [
        {
          "sourceOffset": 1755200,
          "sourceCount": 73,
          "worldOffset": 1152,
          "worldCount": 1
        },
        {
          "sourceOffset": 1759872,
          "sourceCount": 79,
          "worldOffset": 1216,
          "worldCount": 1
        },
        {
          "sourceOffset": 1764928,
          "sourceCount": 79,
          "worldOffset": 1280,
          "worldCount": 1
        },
        {
          "sourceOffset": 1769984,
          "sourceCount": 79,
          "worldOffset": 1344,
          "worldCount": 1
        },
        {
          "sourceOffset": 1775040,
          "sourceCount": 97,
          "worldOffset": 1408,
          "worldCount": 1
        },
        {
          "sourceOffset": 1781248,
          "sourceCount": 73,
          "worldOffset": 1472,
          "worldCount": 1
        },
        {
          "sourceOffset": 1785920,
          "sourceCount": 73,
          "worldOffset": 1536,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "dark-glass",
      "layer": "near",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "instances",
      "offset": 1790592,
      "directCount": 0,
      "count": 600,
      "assemblies": [
        {
          "sourceOffset": 1790592,
          "sourceCount": 99,
          "worldOffset": 1152,
          "worldCount": 1
        },
        {
          "sourceOffset": 1796928,
          "sourceCount": 57,
          "worldOffset": 1216,
          "worldCount": 1
        },
        {
          "sourceOffset": 1800576,
          "sourceCount": 57,
          "worldOffset": 1280,
          "worldCount": 1
        },
        {
          "sourceOffset": 1804224,
          "sourceCount": 57,
          "worldOffset": 1344,
          "worldCount": 1
        },
        {
          "sourceOffset": 1807872,
          "sourceCount": 132,
          "worldOffset": 1408,
          "worldCount": 1
        },
        {
          "sourceOffset": 1816320,
          "sourceCount": 99,
          "worldOffset": 1472,
          "worldCount": 1
        },
        {
          "sourceOffset": 1822656,
          "sourceCount": 99,
          "worldOffset": 1536,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "glass",
      "layer": "near",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "instances",
      "offset": 1828992,
      "directCount": 0,
      "count": 1299,
      "assemblies": [
        {
          "sourceOffset": 1828992,
          "sourceCount": 156,
          "worldOffset": 1152,
          "worldCount": 1
        },
        {
          "sourceOffset": 1838976,
          "sourceCount": 209,
          "worldOffset": 1216,
          "worldCount": 1
        },
        {
          "sourceOffset": 1852352,
          "sourceCount": 209,
          "worldOffset": 1280,
          "worldCount": 1
        },
        {
          "sourceOffset": 1865728,
          "sourceCount": 209,
          "worldOffset": 1344,
          "worldCount": 1
        },
        {
          "sourceOffset": 1879104,
          "sourceCount": 204,
          "worldOffset": 1408,
          "worldCount": 1
        },
        {
          "sourceOffset": 1892160,
          "sourceCount": 156,
          "worldOffset": 1472,
          "worldCount": 1
        },
        {
          "sourceOffset": 1902144,
          "sourceCount": 156,
          "worldOffset": 1536,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "plaster",
      "layer": "near",
      "rect": [
        0,
        512,
        768,
        64
      ],
      "mode": "instances",
      "offset": 1912128,
      "directCount": 0,
      "count": 1087,
      "assemblies": [
        {
          "sourceOffset": 1912128,
          "sourceCount": 148,
          "worldOffset": 1152,
          "worldCount": 1
        },
        {
          "sourceOffset": 1921600,
          "sourceCount": 149,
          "worldOffset": 1216,
          "worldCount": 1
        },
        {
          "sourceOffset": 1931136,
          "sourceCount": 149,
          "worldOffset": 1280,
          "worldCount": 1
        },
        {
          "sourceOffset": 1940672,
          "sourceCount": 149,
          "worldOffset": 1344,
          "worldCount": 1
        },
        {
          "sourceOffset": 1950208,
          "sourceCount": 196,
          "worldOffset": 1408,
          "worldCount": 1
        },
        {
          "sourceOffset": 1962752,
          "sourceCount": 148,
          "worldOffset": 1472,
          "worldCount": 1
        },
        {
          "sourceOffset": 1972224,
          "sourceCount": 148,
          "worldOffset": 1536,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "roof",
      "layer": "near",
      "rect": [
        0,
        896,
        704,
        128
      ],
      "mode": "instances",
      "offset": 1981696,
      "directCount": 0,
      "count": 2,
      "assemblies": [
        {
          "sourceOffset": 1981696,
          "sourceCount": 1,
          "worldOffset": 1216,
          "worldCount": 1
        },
        {
          "sourceOffset": 1981760,
          "sourceCount": 1,
          "worldOffset": 1280,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "garage-door",
      "layer": "near",
      "rect": [
        448,
        0,
        64,
        64
      ],
      "mode": "instances",
      "offset": 1981824,
      "directCount": 0,
      "count": 12,
      "assemblies": [
        {
          "sourceOffset": 1981824,
          "sourceCount": 4,
          "worldOffset": 1216,
          "worldCount": 1
        },
        {
          "sourceOffset": 1982080,
          "sourceCount": 4,
          "worldOffset": 1280,
          "worldCount": 1
        },
        {
          "sourceOffset": 1982336,
          "sourceCount": 4,
          "worldOffset": 1344,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "instances",
      "offset": 1982592,
      "directCount": 0,
      "count": 425,
      "assemblies": [
        {
          "sourceOffset": 1982592,
          "sourceCount": 5,
          "worldOffset": 1600,
          "worldCount": 1
        },
        {
          "sourceOffset": 1982912,
          "sourceCount": 5,
          "worldOffset": 1664,
          "worldCount": 1
        },
        {
          "sourceOffset": 1983232,
          "sourceCount": 5,
          "worldOffset": 1728,
          "worldCount": 1
        },
        {
          "sourceOffset": 1983552,
          "sourceCount": 5,
          "worldOffset": 1792,
          "worldCount": 1
        },
        {
          "sourceOffset": 1983872,
          "sourceCount": 5,
          "worldOffset": 1856,
          "worldCount": 1
        },
        {
          "sourceOffset": 1984192,
          "sourceCount": 5,
          "worldOffset": 1920,
          "worldCount": 1
        },
        {
          "sourceOffset": 1984512,
          "sourceCount": 5,
          "worldOffset": 1984,
          "worldCount": 1
        },
        {
          "sourceOffset": 1984832,
          "sourceCount": 5,
          "worldOffset": 2048,
          "worldCount": 1
        },
        {
          "sourceOffset": 1985152,
          "sourceCount": 5,
          "worldOffset": 2112,
          "worldCount": 1
        },
        {
          "sourceOffset": 1985472,
          "sourceCount": 5,
          "worldOffset": 2176,
          "worldCount": 1
        },
        {
          "sourceOffset": 1985792,
          "sourceCount": 5,
          "worldOffset": 2240,
          "worldCount": 1
        },
        {
          "sourceOffset": 1986112,
          "sourceCount": 5,
          "worldOffset": 2304,
          "worldCount": 1
        },
        {
          "sourceOffset": 1986432,
          "sourceCount": 5,
          "worldOffset": 2368,
          "worldCount": 1
        },
        {
          "sourceOffset": 1986752,
          "sourceCount": 5,
          "worldOffset": 2432,
          "worldCount": 1
        },
        {
          "sourceOffset": 1987072,
          "sourceCount": 5,
          "worldOffset": 2496,
          "worldCount": 1
        },
        {
          "sourceOffset": 1987392,
          "sourceCount": 5,
          "worldOffset": 2560,
          "worldCount": 1
        },
        {
          "sourceOffset": 1987712,
          "sourceCount": 5,
          "worldOffset": 2624,
          "worldCount": 1
        },
        {
          "sourceOffset": 1988032,
          "sourceCount": 5,
          "worldOffset": 2688,
          "worldCount": 1
        },
        {
          "sourceOffset": 1988352,
          "sourceCount": 5,
          "worldOffset": 2752,
          "worldCount": 1
        },
        {
          "sourceOffset": 1988672,
          "sourceCount": 5,
          "worldOffset": 2816,
          "worldCount": 1
        },
        {
          "sourceOffset": 1988992,
          "sourceCount": 5,
          "worldOffset": 2880,
          "worldCount": 1
        },
        {
          "sourceOffset": 1989312,
          "sourceCount": 5,
          "worldOffset": 2944,
          "worldCount": 1
        },
        {
          "sourceOffset": 1989632,
          "sourceCount": 5,
          "worldOffset": 3008,
          "worldCount": 1
        },
        {
          "sourceOffset": 1989952,
          "sourceCount": 5,
          "worldOffset": 3072,
          "worldCount": 1
        },
        {
          "sourceOffset": 1990272,
          "sourceCount": 5,
          "worldOffset": 3136,
          "worldCount": 1
        },
        {
          "sourceOffset": 1990592,
          "sourceCount": 5,
          "worldOffset": 3200,
          "worldCount": 1
        },
        {
          "sourceOffset": 1990912,
          "sourceCount": 5,
          "worldOffset": 3264,
          "worldCount": 1
        },
        {
          "sourceOffset": 1991232,
          "sourceCount": 5,
          "worldOffset": 3328,
          "worldCount": 1
        },
        {
          "sourceOffset": 1991552,
          "sourceCount": 5,
          "worldOffset": 3392,
          "worldCount": 1
        },
        {
          "sourceOffset": 1991872,
          "sourceCount": 5,
          "worldOffset": 3456,
          "worldCount": 1
        },
        {
          "sourceOffset": 1992192,
          "sourceCount": 5,
          "worldOffset": 3520,
          "worldCount": 1
        },
        {
          "sourceOffset": 1992512,
          "sourceCount": 5,
          "worldOffset": 3584,
          "worldCount": 1
        },
        {
          "sourceOffset": 1992832,
          "sourceCount": 5,
          "worldOffset": 3648,
          "worldCount": 1
        },
        {
          "sourceOffset": 1993152,
          "sourceCount": 5,
          "worldOffset": 3712,
          "worldCount": 1
        },
        {
          "sourceOffset": 1993472,
          "sourceCount": 5,
          "worldOffset": 3776,
          "worldCount": 1
        },
        {
          "sourceOffset": 1993792,
          "sourceCount": 5,
          "worldOffset": 3840,
          "worldCount": 1
        },
        {
          "sourceOffset": 1994112,
          "sourceCount": 5,
          "worldOffset": 3904,
          "worldCount": 1
        },
        {
          "sourceOffset": 1994432,
          "sourceCount": 5,
          "worldOffset": 3968,
          "worldCount": 1
        },
        {
          "sourceOffset": 1994752,
          "sourceCount": 5,
          "worldOffset": 4032,
          "worldCount": 1
        },
        {
          "sourceOffset": 1995072,
          "sourceCount": 5,
          "worldOffset": 4096,
          "worldCount": 1
        },
        {
          "sourceOffset": 1995392,
          "sourceCount": 5,
          "worldOffset": 4160,
          "worldCount": 1
        },
        {
          "sourceOffset": 1995712,
          "sourceCount": 5,
          "worldOffset": 4224,
          "worldCount": 1
        },
        {
          "sourceOffset": 1996032,
          "sourceCount": 5,
          "worldOffset": 4288,
          "worldCount": 1
        },
        {
          "sourceOffset": 1996352,
          "sourceCount": 5,
          "worldOffset": 4352,
          "worldCount": 1
        },
        {
          "sourceOffset": 1996672,
          "sourceCount": 5,
          "worldOffset": 4416,
          "worldCount": 1
        },
        {
          "sourceOffset": 1996992,
          "sourceCount": 5,
          "worldOffset": 4480,
          "worldCount": 1
        },
        {
          "sourceOffset": 1997312,
          "sourceCount": 5,
          "worldOffset": 4544,
          "worldCount": 1
        },
        {
          "sourceOffset": 1997632,
          "sourceCount": 5,
          "worldOffset": 4608,
          "worldCount": 1
        },
        {
          "sourceOffset": 1997952,
          "sourceCount": 5,
          "worldOffset": 4672,
          "worldCount": 1
        },
        {
          "sourceOffset": 1998272,
          "sourceCount": 5,
          "worldOffset": 4736,
          "worldCount": 1
        },
        {
          "sourceOffset": 1998592,
          "sourceCount": 5,
          "worldOffset": 4800,
          "worldCount": 1
        },
        {
          "sourceOffset": 1998912,
          "sourceCount": 5,
          "worldOffset": 4864,
          "worldCount": 1
        },
        {
          "sourceOffset": 1999232,
          "sourceCount": 5,
          "worldOffset": 4928,
          "worldCount": 1
        },
        {
          "sourceOffset": 1999552,
          "sourceCount": 5,
          "worldOffset": 4992,
          "worldCount": 1
        },
        {
          "sourceOffset": 1999872,
          "sourceCount": 5,
          "worldOffset": 5056,
          "worldCount": 1
        },
        {
          "sourceOffset": 2000192,
          "sourceCount": 5,
          "worldOffset": 5120,
          "worldCount": 1
        },
        {
          "sourceOffset": 2000512,
          "sourceCount": 5,
          "worldOffset": 5184,
          "worldCount": 1
        },
        {
          "sourceOffset": 2000832,
          "sourceCount": 5,
          "worldOffset": 5248,
          "worldCount": 1
        },
        {
          "sourceOffset": 2001152,
          "sourceCount": 5,
          "worldOffset": 5312,
          "worldCount": 1
        },
        {
          "sourceOffset": 2001472,
          "sourceCount": 5,
          "worldOffset": 5376,
          "worldCount": 1
        },
        {
          "sourceOffset": 2001792,
          "sourceCount": 5,
          "worldOffset": 5440,
          "worldCount": 1
        },
        {
          "sourceOffset": 2002112,
          "sourceCount": 5,
          "worldOffset": 5504,
          "worldCount": 1
        },
        {
          "sourceOffset": 2002432,
          "sourceCount": 5,
          "worldOffset": 5568,
          "worldCount": 1
        },
        {
          "sourceOffset": 2002752,
          "sourceCount": 5,
          "worldOffset": 5632,
          "worldCount": 1
        },
        {
          "sourceOffset": 2003072,
          "sourceCount": 5,
          "worldOffset": 5696,
          "worldCount": 1
        },
        {
          "sourceOffset": 2003392,
          "sourceCount": 5,
          "worldOffset": 5760,
          "worldCount": 1
        },
        {
          "sourceOffset": 2003712,
          "sourceCount": 5,
          "worldOffset": 5824,
          "worldCount": 1
        },
        {
          "sourceOffset": 2004032,
          "sourceCount": 5,
          "worldOffset": 5888,
          "worldCount": 1
        },
        {
          "sourceOffset": 2004352,
          "sourceCount": 5,
          "worldOffset": 5952,
          "worldCount": 1
        },
        {
          "sourceOffset": 2004672,
          "sourceCount": 5,
          "worldOffset": 6016,
          "worldCount": 1
        },
        {
          "sourceOffset": 2004992,
          "sourceCount": 5,
          "worldOffset": 6080,
          "worldCount": 1
        },
        {
          "sourceOffset": 2005312,
          "sourceCount": 5,
          "worldOffset": 6144,
          "worldCount": 1
        },
        {
          "sourceOffset": 2005632,
          "sourceCount": 5,
          "worldOffset": 6208,
          "worldCount": 1
        },
        {
          "sourceOffset": 2005952,
          "sourceCount": 5,
          "worldOffset": 6272,
          "worldCount": 1
        },
        {
          "sourceOffset": 2006272,
          "sourceCount": 5,
          "worldOffset": 6336,
          "worldCount": 1
        },
        {
          "sourceOffset": 2006592,
          "sourceCount": 5,
          "worldOffset": 6400,
          "worldCount": 1
        },
        {
          "sourceOffset": 2006912,
          "sourceCount": 5,
          "worldOffset": 6464,
          "worldCount": 1
        },
        {
          "sourceOffset": 2007232,
          "sourceCount": 5,
          "worldOffset": 6528,
          "worldCount": 1
        },
        {
          "sourceOffset": 2007552,
          "sourceCount": 5,
          "worldOffset": 6592,
          "worldCount": 1
        },
        {
          "sourceOffset": 2007872,
          "sourceCount": 5,
          "worldOffset": 6656,
          "worldCount": 1
        },
        {
          "sourceOffset": 2008192,
          "sourceCount": 5,
          "worldOffset": 6720,
          "worldCount": 1
        },
        {
          "sourceOffset": 2008512,
          "sourceCount": 5,
          "worldOffset": 6784,
          "worldCount": 1
        },
        {
          "sourceOffset": 2008832,
          "sourceCount": 5,
          "worldOffset": 6848,
          "worldCount": 1
        },
        {
          "sourceOffset": 2009152,
          "sourceCount": 5,
          "worldOffset": 6912,
          "worldCount": 1
        },
        {
          "sourceOffset": 2009472,
          "sourceCount": 5,
          "worldOffset": 6976,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "metal",
      "layer": "ground",
      "rect": [
        768,
        0,
        256,
        64
      ],
      "mode": "instances",
      "offset": 2009792,
      "directCount": 0,
      "count": 510,
      "assemblies": [
        {
          "sourceOffset": 2009792,
          "sourceCount": 6,
          "worldOffset": 1600,
          "worldCount": 1
        },
        {
          "sourceOffset": 2010176,
          "sourceCount": 6,
          "worldOffset": 1664,
          "worldCount": 1
        },
        {
          "sourceOffset": 2010560,
          "sourceCount": 6,
          "worldOffset": 1728,
          "worldCount": 1
        },
        {
          "sourceOffset": 2010944,
          "sourceCount": 6,
          "worldOffset": 1792,
          "worldCount": 1
        },
        {
          "sourceOffset": 2011328,
          "sourceCount": 6,
          "worldOffset": 1856,
          "worldCount": 1
        },
        {
          "sourceOffset": 2011712,
          "sourceCount": 6,
          "worldOffset": 1920,
          "worldCount": 1
        },
        {
          "sourceOffset": 2012096,
          "sourceCount": 6,
          "worldOffset": 1984,
          "worldCount": 1
        },
        {
          "sourceOffset": 2012480,
          "sourceCount": 6,
          "worldOffset": 2048,
          "worldCount": 1
        },
        {
          "sourceOffset": 2012864,
          "sourceCount": 6,
          "worldOffset": 2112,
          "worldCount": 1
        },
        {
          "sourceOffset": 2013248,
          "sourceCount": 6,
          "worldOffset": 2176,
          "worldCount": 1
        },
        {
          "sourceOffset": 2013632,
          "sourceCount": 6,
          "worldOffset": 2240,
          "worldCount": 1
        },
        {
          "sourceOffset": 2014016,
          "sourceCount": 6,
          "worldOffset": 2304,
          "worldCount": 1
        },
        {
          "sourceOffset": 2014400,
          "sourceCount": 6,
          "worldOffset": 2368,
          "worldCount": 1
        },
        {
          "sourceOffset": 2014784,
          "sourceCount": 6,
          "worldOffset": 2432,
          "worldCount": 1
        },
        {
          "sourceOffset": 2015168,
          "sourceCount": 6,
          "worldOffset": 2496,
          "worldCount": 1
        },
        {
          "sourceOffset": 2015552,
          "sourceCount": 6,
          "worldOffset": 2560,
          "worldCount": 1
        },
        {
          "sourceOffset": 2015936,
          "sourceCount": 6,
          "worldOffset": 2624,
          "worldCount": 1
        },
        {
          "sourceOffset": 2016320,
          "sourceCount": 6,
          "worldOffset": 2688,
          "worldCount": 1
        },
        {
          "sourceOffset": 2016704,
          "sourceCount": 6,
          "worldOffset": 2752,
          "worldCount": 1
        },
        {
          "sourceOffset": 2017088,
          "sourceCount": 6,
          "worldOffset": 2816,
          "worldCount": 1
        },
        {
          "sourceOffset": 2017472,
          "sourceCount": 6,
          "worldOffset": 2880,
          "worldCount": 1
        },
        {
          "sourceOffset": 2017856,
          "sourceCount": 6,
          "worldOffset": 2944,
          "worldCount": 1
        },
        {
          "sourceOffset": 2018240,
          "sourceCount": 6,
          "worldOffset": 3008,
          "worldCount": 1
        },
        {
          "sourceOffset": 2018624,
          "sourceCount": 6,
          "worldOffset": 3072,
          "worldCount": 1
        },
        {
          "sourceOffset": 2019008,
          "sourceCount": 6,
          "worldOffset": 3136,
          "worldCount": 1
        },
        {
          "sourceOffset": 2019392,
          "sourceCount": 6,
          "worldOffset": 3200,
          "worldCount": 1
        },
        {
          "sourceOffset": 2019776,
          "sourceCount": 6,
          "worldOffset": 3264,
          "worldCount": 1
        },
        {
          "sourceOffset": 2020160,
          "sourceCount": 6,
          "worldOffset": 3328,
          "worldCount": 1
        },
        {
          "sourceOffset": 2020544,
          "sourceCount": 6,
          "worldOffset": 3392,
          "worldCount": 1
        },
        {
          "sourceOffset": 2020928,
          "sourceCount": 6,
          "worldOffset": 3456,
          "worldCount": 1
        },
        {
          "sourceOffset": 2021312,
          "sourceCount": 6,
          "worldOffset": 3520,
          "worldCount": 1
        },
        {
          "sourceOffset": 2021696,
          "sourceCount": 6,
          "worldOffset": 3584,
          "worldCount": 1
        },
        {
          "sourceOffset": 2022080,
          "sourceCount": 6,
          "worldOffset": 3648,
          "worldCount": 1
        },
        {
          "sourceOffset": 2022464,
          "sourceCount": 6,
          "worldOffset": 3712,
          "worldCount": 1
        },
        {
          "sourceOffset": 2022848,
          "sourceCount": 6,
          "worldOffset": 3776,
          "worldCount": 1
        },
        {
          "sourceOffset": 2023232,
          "sourceCount": 6,
          "worldOffset": 3840,
          "worldCount": 1
        },
        {
          "sourceOffset": 2023616,
          "sourceCount": 6,
          "worldOffset": 3904,
          "worldCount": 1
        },
        {
          "sourceOffset": 2024000,
          "sourceCount": 6,
          "worldOffset": 3968,
          "worldCount": 1
        },
        {
          "sourceOffset": 2024384,
          "sourceCount": 6,
          "worldOffset": 4032,
          "worldCount": 1
        },
        {
          "sourceOffset": 2024768,
          "sourceCount": 6,
          "worldOffset": 4096,
          "worldCount": 1
        },
        {
          "sourceOffset": 2025152,
          "sourceCount": 6,
          "worldOffset": 4160,
          "worldCount": 1
        },
        {
          "sourceOffset": 2025536,
          "sourceCount": 6,
          "worldOffset": 4224,
          "worldCount": 1
        },
        {
          "sourceOffset": 2025920,
          "sourceCount": 6,
          "worldOffset": 4288,
          "worldCount": 1
        },
        {
          "sourceOffset": 2026304,
          "sourceCount": 6,
          "worldOffset": 4352,
          "worldCount": 1
        },
        {
          "sourceOffset": 2026688,
          "sourceCount": 6,
          "worldOffset": 4416,
          "worldCount": 1
        },
        {
          "sourceOffset": 2027072,
          "sourceCount": 6,
          "worldOffset": 4480,
          "worldCount": 1
        },
        {
          "sourceOffset": 2027456,
          "sourceCount": 6,
          "worldOffset": 4544,
          "worldCount": 1
        },
        {
          "sourceOffset": 2027840,
          "sourceCount": 6,
          "worldOffset": 4608,
          "worldCount": 1
        },
        {
          "sourceOffset": 2028224,
          "sourceCount": 6,
          "worldOffset": 4672,
          "worldCount": 1
        },
        {
          "sourceOffset": 2028608,
          "sourceCount": 6,
          "worldOffset": 4736,
          "worldCount": 1
        },
        {
          "sourceOffset": 2028992,
          "sourceCount": 6,
          "worldOffset": 4800,
          "worldCount": 1
        },
        {
          "sourceOffset": 2029376,
          "sourceCount": 6,
          "worldOffset": 4864,
          "worldCount": 1
        },
        {
          "sourceOffset": 2029760,
          "sourceCount": 6,
          "worldOffset": 4928,
          "worldCount": 1
        },
        {
          "sourceOffset": 2030144,
          "sourceCount": 6,
          "worldOffset": 4992,
          "worldCount": 1
        },
        {
          "sourceOffset": 2030528,
          "sourceCount": 6,
          "worldOffset": 5056,
          "worldCount": 1
        },
        {
          "sourceOffset": 2030912,
          "sourceCount": 6,
          "worldOffset": 5120,
          "worldCount": 1
        },
        {
          "sourceOffset": 2031296,
          "sourceCount": 6,
          "worldOffset": 5184,
          "worldCount": 1
        },
        {
          "sourceOffset": 2031680,
          "sourceCount": 6,
          "worldOffset": 5248,
          "worldCount": 1
        },
        {
          "sourceOffset": 2032064,
          "sourceCount": 6,
          "worldOffset": 5312,
          "worldCount": 1
        },
        {
          "sourceOffset": 2032448,
          "sourceCount": 6,
          "worldOffset": 5376,
          "worldCount": 1
        },
        {
          "sourceOffset": 2032832,
          "sourceCount": 6,
          "worldOffset": 5440,
          "worldCount": 1
        },
        {
          "sourceOffset": 2033216,
          "sourceCount": 6,
          "worldOffset": 5504,
          "worldCount": 1
        },
        {
          "sourceOffset": 2033600,
          "sourceCount": 6,
          "worldOffset": 5568,
          "worldCount": 1
        },
        {
          "sourceOffset": 2033984,
          "sourceCount": 6,
          "worldOffset": 5632,
          "worldCount": 1
        },
        {
          "sourceOffset": 2034368,
          "sourceCount": 6,
          "worldOffset": 5696,
          "worldCount": 1
        },
        {
          "sourceOffset": 2034752,
          "sourceCount": 6,
          "worldOffset": 5760,
          "worldCount": 1
        },
        {
          "sourceOffset": 2035136,
          "sourceCount": 6,
          "worldOffset": 5824,
          "worldCount": 1
        },
        {
          "sourceOffset": 2035520,
          "sourceCount": 6,
          "worldOffset": 5888,
          "worldCount": 1
        },
        {
          "sourceOffset": 2035904,
          "sourceCount": 6,
          "worldOffset": 5952,
          "worldCount": 1
        },
        {
          "sourceOffset": 2036288,
          "sourceCount": 6,
          "worldOffset": 6016,
          "worldCount": 1
        },
        {
          "sourceOffset": 2036672,
          "sourceCount": 6,
          "worldOffset": 6080,
          "worldCount": 1
        },
        {
          "sourceOffset": 2037056,
          "sourceCount": 6,
          "worldOffset": 6144,
          "worldCount": 1
        },
        {
          "sourceOffset": 2037440,
          "sourceCount": 6,
          "worldOffset": 6208,
          "worldCount": 1
        },
        {
          "sourceOffset": 2037824,
          "sourceCount": 6,
          "worldOffset": 6272,
          "worldCount": 1
        },
        {
          "sourceOffset": 2038208,
          "sourceCount": 6,
          "worldOffset": 6336,
          "worldCount": 1
        },
        {
          "sourceOffset": 2038592,
          "sourceCount": 6,
          "worldOffset": 6400,
          "worldCount": 1
        },
        {
          "sourceOffset": 2038976,
          "sourceCount": 6,
          "worldOffset": 6464,
          "worldCount": 1
        },
        {
          "sourceOffset": 2039360,
          "sourceCount": 6,
          "worldOffset": 6528,
          "worldCount": 1
        },
        {
          "sourceOffset": 2039744,
          "sourceCount": 6,
          "worldOffset": 6592,
          "worldCount": 1
        },
        {
          "sourceOffset": 2040128,
          "sourceCount": 6,
          "worldOffset": 6656,
          "worldCount": 1
        },
        {
          "sourceOffset": 2040512,
          "sourceCount": 6,
          "worldOffset": 6720,
          "worldCount": 1
        },
        {
          "sourceOffset": 2040896,
          "sourceCount": 6,
          "worldOffset": 6784,
          "worldCount": 1
        },
        {
          "sourceOffset": 2041280,
          "sourceCount": 6,
          "worldOffset": 6848,
          "worldCount": 1
        },
        {
          "sourceOffset": 2041664,
          "sourceCount": 6,
          "worldOffset": 6912,
          "worldCount": 1
        },
        {
          "sourceOffset": 2042048,
          "sourceCount": 6,
          "worldOffset": 6976,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "car-silver",
      "layer": "ground",
      "rect": [
        288,
        176,
        32,
        32
      ],
      "mode": "instances",
      "offset": 2042432,
      "directCount": 0,
      "count": 340,
      "assemblies": [
        {
          "sourceOffset": 2042432,
          "sourceCount": 4,
          "worldOffset": 1600,
          "worldCount": 1
        },
        {
          "sourceOffset": 2042688,
          "sourceCount": 4,
          "worldOffset": 1664,
          "worldCount": 1
        },
        {
          "sourceOffset": 2042944,
          "sourceCount": 4,
          "worldOffset": 1728,
          "worldCount": 1
        },
        {
          "sourceOffset": 2043200,
          "sourceCount": 4,
          "worldOffset": 1792,
          "worldCount": 1
        },
        {
          "sourceOffset": 2043456,
          "sourceCount": 4,
          "worldOffset": 1856,
          "worldCount": 1
        },
        {
          "sourceOffset": 2043712,
          "sourceCount": 4,
          "worldOffset": 1920,
          "worldCount": 1
        },
        {
          "sourceOffset": 2043968,
          "sourceCount": 4,
          "worldOffset": 1984,
          "worldCount": 1
        },
        {
          "sourceOffset": 2044224,
          "sourceCount": 4,
          "worldOffset": 2048,
          "worldCount": 1
        },
        {
          "sourceOffset": 2044480,
          "sourceCount": 4,
          "worldOffset": 2112,
          "worldCount": 1
        },
        {
          "sourceOffset": 2044736,
          "sourceCount": 4,
          "worldOffset": 2176,
          "worldCount": 1
        },
        {
          "sourceOffset": 2044992,
          "sourceCount": 4,
          "worldOffset": 2240,
          "worldCount": 1
        },
        {
          "sourceOffset": 2045248,
          "sourceCount": 4,
          "worldOffset": 2304,
          "worldCount": 1
        },
        {
          "sourceOffset": 2045504,
          "sourceCount": 4,
          "worldOffset": 2368,
          "worldCount": 1
        },
        {
          "sourceOffset": 2045760,
          "sourceCount": 4,
          "worldOffset": 2432,
          "worldCount": 1
        },
        {
          "sourceOffset": 2046016,
          "sourceCount": 4,
          "worldOffset": 2496,
          "worldCount": 1
        },
        {
          "sourceOffset": 2046272,
          "sourceCount": 4,
          "worldOffset": 2560,
          "worldCount": 1
        },
        {
          "sourceOffset": 2046528,
          "sourceCount": 4,
          "worldOffset": 2624,
          "worldCount": 1
        },
        {
          "sourceOffset": 2046784,
          "sourceCount": 4,
          "worldOffset": 2688,
          "worldCount": 1
        },
        {
          "sourceOffset": 2047040,
          "sourceCount": 4,
          "worldOffset": 2752,
          "worldCount": 1
        },
        {
          "sourceOffset": 2047296,
          "sourceCount": 4,
          "worldOffset": 2816,
          "worldCount": 1
        },
        {
          "sourceOffset": 2047552,
          "sourceCount": 4,
          "worldOffset": 2880,
          "worldCount": 1
        },
        {
          "sourceOffset": 2047808,
          "sourceCount": 4,
          "worldOffset": 2944,
          "worldCount": 1
        },
        {
          "sourceOffset": 2048064,
          "sourceCount": 4,
          "worldOffset": 3008,
          "worldCount": 1
        },
        {
          "sourceOffset": 2048320,
          "sourceCount": 4,
          "worldOffset": 3072,
          "worldCount": 1
        },
        {
          "sourceOffset": 2048576,
          "sourceCount": 4,
          "worldOffset": 3136,
          "worldCount": 1
        },
        {
          "sourceOffset": 2048832,
          "sourceCount": 4,
          "worldOffset": 3200,
          "worldCount": 1
        },
        {
          "sourceOffset": 2049088,
          "sourceCount": 4,
          "worldOffset": 3264,
          "worldCount": 1
        },
        {
          "sourceOffset": 2049344,
          "sourceCount": 4,
          "worldOffset": 3328,
          "worldCount": 1
        },
        {
          "sourceOffset": 2049600,
          "sourceCount": 4,
          "worldOffset": 3392,
          "worldCount": 1
        },
        {
          "sourceOffset": 2049856,
          "sourceCount": 4,
          "worldOffset": 3456,
          "worldCount": 1
        },
        {
          "sourceOffset": 2050112,
          "sourceCount": 4,
          "worldOffset": 3520,
          "worldCount": 1
        },
        {
          "sourceOffset": 2050368,
          "sourceCount": 4,
          "worldOffset": 3584,
          "worldCount": 1
        },
        {
          "sourceOffset": 2050624,
          "sourceCount": 4,
          "worldOffset": 3648,
          "worldCount": 1
        },
        {
          "sourceOffset": 2050880,
          "sourceCount": 4,
          "worldOffset": 3712,
          "worldCount": 1
        },
        {
          "sourceOffset": 2051136,
          "sourceCount": 4,
          "worldOffset": 3776,
          "worldCount": 1
        },
        {
          "sourceOffset": 2051392,
          "sourceCount": 4,
          "worldOffset": 3840,
          "worldCount": 1
        },
        {
          "sourceOffset": 2051648,
          "sourceCount": 4,
          "worldOffset": 3904,
          "worldCount": 1
        },
        {
          "sourceOffset": 2051904,
          "sourceCount": 4,
          "worldOffset": 3968,
          "worldCount": 1
        },
        {
          "sourceOffset": 2052160,
          "sourceCount": 4,
          "worldOffset": 4032,
          "worldCount": 1
        },
        {
          "sourceOffset": 2052416,
          "sourceCount": 4,
          "worldOffset": 4096,
          "worldCount": 1
        },
        {
          "sourceOffset": 2052672,
          "sourceCount": 4,
          "worldOffset": 4160,
          "worldCount": 1
        },
        {
          "sourceOffset": 2052928,
          "sourceCount": 4,
          "worldOffset": 4224,
          "worldCount": 1
        },
        {
          "sourceOffset": 2053184,
          "sourceCount": 4,
          "worldOffset": 4288,
          "worldCount": 1
        },
        {
          "sourceOffset": 2053440,
          "sourceCount": 4,
          "worldOffset": 4352,
          "worldCount": 1
        },
        {
          "sourceOffset": 2053696,
          "sourceCount": 4,
          "worldOffset": 4416,
          "worldCount": 1
        },
        {
          "sourceOffset": 2053952,
          "sourceCount": 4,
          "worldOffset": 4480,
          "worldCount": 1
        },
        {
          "sourceOffset": 2054208,
          "sourceCount": 4,
          "worldOffset": 4544,
          "worldCount": 1
        },
        {
          "sourceOffset": 2054464,
          "sourceCount": 4,
          "worldOffset": 4608,
          "worldCount": 1
        },
        {
          "sourceOffset": 2054720,
          "sourceCount": 4,
          "worldOffset": 4672,
          "worldCount": 1
        },
        {
          "sourceOffset": 2054976,
          "sourceCount": 4,
          "worldOffset": 4736,
          "worldCount": 1
        },
        {
          "sourceOffset": 2055232,
          "sourceCount": 4,
          "worldOffset": 4800,
          "worldCount": 1
        },
        {
          "sourceOffset": 2055488,
          "sourceCount": 4,
          "worldOffset": 4864,
          "worldCount": 1
        },
        {
          "sourceOffset": 2055744,
          "sourceCount": 4,
          "worldOffset": 4928,
          "worldCount": 1
        },
        {
          "sourceOffset": 2056000,
          "sourceCount": 4,
          "worldOffset": 4992,
          "worldCount": 1
        },
        {
          "sourceOffset": 2056256,
          "sourceCount": 4,
          "worldOffset": 5056,
          "worldCount": 1
        },
        {
          "sourceOffset": 2056512,
          "sourceCount": 4,
          "worldOffset": 5120,
          "worldCount": 1
        },
        {
          "sourceOffset": 2056768,
          "sourceCount": 4,
          "worldOffset": 5184,
          "worldCount": 1
        },
        {
          "sourceOffset": 2057024,
          "sourceCount": 4,
          "worldOffset": 5248,
          "worldCount": 1
        },
        {
          "sourceOffset": 2057280,
          "sourceCount": 4,
          "worldOffset": 5312,
          "worldCount": 1
        },
        {
          "sourceOffset": 2057536,
          "sourceCount": 4,
          "worldOffset": 5376,
          "worldCount": 1
        },
        {
          "sourceOffset": 2057792,
          "sourceCount": 4,
          "worldOffset": 5440,
          "worldCount": 1
        },
        {
          "sourceOffset": 2058048,
          "sourceCount": 4,
          "worldOffset": 5504,
          "worldCount": 1
        },
        {
          "sourceOffset": 2058304,
          "sourceCount": 4,
          "worldOffset": 5568,
          "worldCount": 1
        },
        {
          "sourceOffset": 2058560,
          "sourceCount": 4,
          "worldOffset": 5632,
          "worldCount": 1
        },
        {
          "sourceOffset": 2058816,
          "sourceCount": 4,
          "worldOffset": 5696,
          "worldCount": 1
        },
        {
          "sourceOffset": 2059072,
          "sourceCount": 4,
          "worldOffset": 5760,
          "worldCount": 1
        },
        {
          "sourceOffset": 2059328,
          "sourceCount": 4,
          "worldOffset": 5824,
          "worldCount": 1
        },
        {
          "sourceOffset": 2059584,
          "sourceCount": 4,
          "worldOffset": 5888,
          "worldCount": 1
        },
        {
          "sourceOffset": 2059840,
          "sourceCount": 4,
          "worldOffset": 5952,
          "worldCount": 1
        },
        {
          "sourceOffset": 2060096,
          "sourceCount": 4,
          "worldOffset": 6016,
          "worldCount": 1
        },
        {
          "sourceOffset": 2060352,
          "sourceCount": 4,
          "worldOffset": 6080,
          "worldCount": 1
        },
        {
          "sourceOffset": 2060608,
          "sourceCount": 4,
          "worldOffset": 6144,
          "worldCount": 1
        },
        {
          "sourceOffset": 2060864,
          "sourceCount": 4,
          "worldOffset": 6208,
          "worldCount": 1
        },
        {
          "sourceOffset": 2061120,
          "sourceCount": 4,
          "worldOffset": 6272,
          "worldCount": 1
        },
        {
          "sourceOffset": 2061376,
          "sourceCount": 4,
          "worldOffset": 6336,
          "worldCount": 1
        },
        {
          "sourceOffset": 2061632,
          "sourceCount": 4,
          "worldOffset": 6400,
          "worldCount": 1
        },
        {
          "sourceOffset": 2061888,
          "sourceCount": 4,
          "worldOffset": 6464,
          "worldCount": 1
        },
        {
          "sourceOffset": 2062144,
          "sourceCount": 4,
          "worldOffset": 6528,
          "worldCount": 1
        },
        {
          "sourceOffset": 2062400,
          "sourceCount": 4,
          "worldOffset": 6592,
          "worldCount": 1
        },
        {
          "sourceOffset": 2062656,
          "sourceCount": 4,
          "worldOffset": 6656,
          "worldCount": 1
        },
        {
          "sourceOffset": 2062912,
          "sourceCount": 4,
          "worldOffset": 6720,
          "worldCount": 1
        },
        {
          "sourceOffset": 2063168,
          "sourceCount": 4,
          "worldOffset": 6784,
          "worldCount": 1
        },
        {
          "sourceOffset": 2063424,
          "sourceCount": 4,
          "worldOffset": 6848,
          "worldCount": 1
        },
        {
          "sourceOffset": 2063680,
          "sourceCount": 4,
          "worldOffset": 6912,
          "worldCount": 1
        },
        {
          "sourceOffset": 2063936,
          "sourceCount": 4,
          "worldOffset": 6976,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "taillamp",
      "layer": "ground",
      "rect": [
        448,
        176,
        32,
        32
      ],
      "mode": "instances",
      "offset": 2064192,
      "directCount": 0,
      "count": 170,
      "assemblies": [
        {
          "sourceOffset": 2064192,
          "sourceCount": 2,
          "worldOffset": 1600,
          "worldCount": 1
        },
        {
          "sourceOffset": 2064320,
          "sourceCount": 2,
          "worldOffset": 1664,
          "worldCount": 1
        },
        {
          "sourceOffset": 2064448,
          "sourceCount": 2,
          "worldOffset": 1728,
          "worldCount": 1
        },
        {
          "sourceOffset": 2064576,
          "sourceCount": 2,
          "worldOffset": 1792,
          "worldCount": 1
        },
        {
          "sourceOffset": 2064704,
          "sourceCount": 2,
          "worldOffset": 1856,
          "worldCount": 1
        },
        {
          "sourceOffset": 2064832,
          "sourceCount": 2,
          "worldOffset": 1920,
          "worldCount": 1
        },
        {
          "sourceOffset": 2064960,
          "sourceCount": 2,
          "worldOffset": 1984,
          "worldCount": 1
        },
        {
          "sourceOffset": 2065088,
          "sourceCount": 2,
          "worldOffset": 2048,
          "worldCount": 1
        },
        {
          "sourceOffset": 2065216,
          "sourceCount": 2,
          "worldOffset": 2112,
          "worldCount": 1
        },
        {
          "sourceOffset": 2065344,
          "sourceCount": 2,
          "worldOffset": 2176,
          "worldCount": 1
        },
        {
          "sourceOffset": 2065472,
          "sourceCount": 2,
          "worldOffset": 2240,
          "worldCount": 1
        },
        {
          "sourceOffset": 2065600,
          "sourceCount": 2,
          "worldOffset": 2304,
          "worldCount": 1
        },
        {
          "sourceOffset": 2065728,
          "sourceCount": 2,
          "worldOffset": 2368,
          "worldCount": 1
        },
        {
          "sourceOffset": 2065856,
          "sourceCount": 2,
          "worldOffset": 2432,
          "worldCount": 1
        },
        {
          "sourceOffset": 2065984,
          "sourceCount": 2,
          "worldOffset": 2496,
          "worldCount": 1
        },
        {
          "sourceOffset": 2066112,
          "sourceCount": 2,
          "worldOffset": 2560,
          "worldCount": 1
        },
        {
          "sourceOffset": 2066240,
          "sourceCount": 2,
          "worldOffset": 2624,
          "worldCount": 1
        },
        {
          "sourceOffset": 2066368,
          "sourceCount": 2,
          "worldOffset": 2688,
          "worldCount": 1
        },
        {
          "sourceOffset": 2066496,
          "sourceCount": 2,
          "worldOffset": 2752,
          "worldCount": 1
        },
        {
          "sourceOffset": 2066624,
          "sourceCount": 2,
          "worldOffset": 2816,
          "worldCount": 1
        },
        {
          "sourceOffset": 2066752,
          "sourceCount": 2,
          "worldOffset": 2880,
          "worldCount": 1
        },
        {
          "sourceOffset": 2066880,
          "sourceCount": 2,
          "worldOffset": 2944,
          "worldCount": 1
        },
        {
          "sourceOffset": 2067008,
          "sourceCount": 2,
          "worldOffset": 3008,
          "worldCount": 1
        },
        {
          "sourceOffset": 2067136,
          "sourceCount": 2,
          "worldOffset": 3072,
          "worldCount": 1
        },
        {
          "sourceOffset": 2067264,
          "sourceCount": 2,
          "worldOffset": 3136,
          "worldCount": 1
        },
        {
          "sourceOffset": 2067392,
          "sourceCount": 2,
          "worldOffset": 3200,
          "worldCount": 1
        },
        {
          "sourceOffset": 2067520,
          "sourceCount": 2,
          "worldOffset": 3264,
          "worldCount": 1
        },
        {
          "sourceOffset": 2067648,
          "sourceCount": 2,
          "worldOffset": 3328,
          "worldCount": 1
        },
        {
          "sourceOffset": 2067776,
          "sourceCount": 2,
          "worldOffset": 3392,
          "worldCount": 1
        },
        {
          "sourceOffset": 2067904,
          "sourceCount": 2,
          "worldOffset": 3456,
          "worldCount": 1
        },
        {
          "sourceOffset": 2068032,
          "sourceCount": 2,
          "worldOffset": 3520,
          "worldCount": 1
        },
        {
          "sourceOffset": 2068160,
          "sourceCount": 2,
          "worldOffset": 3584,
          "worldCount": 1
        },
        {
          "sourceOffset": 2068288,
          "sourceCount": 2,
          "worldOffset": 3648,
          "worldCount": 1
        },
        {
          "sourceOffset": 2068416,
          "sourceCount": 2,
          "worldOffset": 3712,
          "worldCount": 1
        },
        {
          "sourceOffset": 2068544,
          "sourceCount": 2,
          "worldOffset": 3776,
          "worldCount": 1
        },
        {
          "sourceOffset": 2068672,
          "sourceCount": 2,
          "worldOffset": 3840,
          "worldCount": 1
        },
        {
          "sourceOffset": 2068800,
          "sourceCount": 2,
          "worldOffset": 3904,
          "worldCount": 1
        },
        {
          "sourceOffset": 2068928,
          "sourceCount": 2,
          "worldOffset": 3968,
          "worldCount": 1
        },
        {
          "sourceOffset": 2069056,
          "sourceCount": 2,
          "worldOffset": 4032,
          "worldCount": 1
        },
        {
          "sourceOffset": 2069184,
          "sourceCount": 2,
          "worldOffset": 4096,
          "worldCount": 1
        },
        {
          "sourceOffset": 2069312,
          "sourceCount": 2,
          "worldOffset": 4160,
          "worldCount": 1
        },
        {
          "sourceOffset": 2069440,
          "sourceCount": 2,
          "worldOffset": 4224,
          "worldCount": 1
        },
        {
          "sourceOffset": 2069568,
          "sourceCount": 2,
          "worldOffset": 4288,
          "worldCount": 1
        },
        {
          "sourceOffset": 2069696,
          "sourceCount": 2,
          "worldOffset": 4352,
          "worldCount": 1
        },
        {
          "sourceOffset": 2069824,
          "sourceCount": 2,
          "worldOffset": 4416,
          "worldCount": 1
        },
        {
          "sourceOffset": 2069952,
          "sourceCount": 2,
          "worldOffset": 4480,
          "worldCount": 1
        },
        {
          "sourceOffset": 2070080,
          "sourceCount": 2,
          "worldOffset": 4544,
          "worldCount": 1
        },
        {
          "sourceOffset": 2070208,
          "sourceCount": 2,
          "worldOffset": 4608,
          "worldCount": 1
        },
        {
          "sourceOffset": 2070336,
          "sourceCount": 2,
          "worldOffset": 4672,
          "worldCount": 1
        },
        {
          "sourceOffset": 2070464,
          "sourceCount": 2,
          "worldOffset": 4736,
          "worldCount": 1
        },
        {
          "sourceOffset": 2070592,
          "sourceCount": 2,
          "worldOffset": 4800,
          "worldCount": 1
        },
        {
          "sourceOffset": 2070720,
          "sourceCount": 2,
          "worldOffset": 4864,
          "worldCount": 1
        },
        {
          "sourceOffset": 2070848,
          "sourceCount": 2,
          "worldOffset": 4928,
          "worldCount": 1
        },
        {
          "sourceOffset": 2070976,
          "sourceCount": 2,
          "worldOffset": 4992,
          "worldCount": 1
        },
        {
          "sourceOffset": 2071104,
          "sourceCount": 2,
          "worldOffset": 5056,
          "worldCount": 1
        },
        {
          "sourceOffset": 2071232,
          "sourceCount": 2,
          "worldOffset": 5120,
          "worldCount": 1
        },
        {
          "sourceOffset": 2071360,
          "sourceCount": 2,
          "worldOffset": 5184,
          "worldCount": 1
        },
        {
          "sourceOffset": 2071488,
          "sourceCount": 2,
          "worldOffset": 5248,
          "worldCount": 1
        },
        {
          "sourceOffset": 2071616,
          "sourceCount": 2,
          "worldOffset": 5312,
          "worldCount": 1
        },
        {
          "sourceOffset": 2071744,
          "sourceCount": 2,
          "worldOffset": 5376,
          "worldCount": 1
        },
        {
          "sourceOffset": 2071872,
          "sourceCount": 2,
          "worldOffset": 5440,
          "worldCount": 1
        },
        {
          "sourceOffset": 2072000,
          "sourceCount": 2,
          "worldOffset": 5504,
          "worldCount": 1
        },
        {
          "sourceOffset": 2072128,
          "sourceCount": 2,
          "worldOffset": 5568,
          "worldCount": 1
        },
        {
          "sourceOffset": 2072256,
          "sourceCount": 2,
          "worldOffset": 5632,
          "worldCount": 1
        },
        {
          "sourceOffset": 2072384,
          "sourceCount": 2,
          "worldOffset": 5696,
          "worldCount": 1
        },
        {
          "sourceOffset": 2072512,
          "sourceCount": 2,
          "worldOffset": 5760,
          "worldCount": 1
        },
        {
          "sourceOffset": 2072640,
          "sourceCount": 2,
          "worldOffset": 5824,
          "worldCount": 1
        },
        {
          "sourceOffset": 2072768,
          "sourceCount": 2,
          "worldOffset": 5888,
          "worldCount": 1
        },
        {
          "sourceOffset": 2072896,
          "sourceCount": 2,
          "worldOffset": 5952,
          "worldCount": 1
        },
        {
          "sourceOffset": 2073024,
          "sourceCount": 2,
          "worldOffset": 6016,
          "worldCount": 1
        },
        {
          "sourceOffset": 2073152,
          "sourceCount": 2,
          "worldOffset": 6080,
          "worldCount": 1
        },
        {
          "sourceOffset": 2073280,
          "sourceCount": 2,
          "worldOffset": 6144,
          "worldCount": 1
        },
        {
          "sourceOffset": 2073408,
          "sourceCount": 2,
          "worldOffset": 6208,
          "worldCount": 1
        },
        {
          "sourceOffset": 2073536,
          "sourceCount": 2,
          "worldOffset": 6272,
          "worldCount": 1
        },
        {
          "sourceOffset": 2073664,
          "sourceCount": 2,
          "worldOffset": 6336,
          "worldCount": 1
        },
        {
          "sourceOffset": 2073792,
          "sourceCount": 2,
          "worldOffset": 6400,
          "worldCount": 1
        },
        {
          "sourceOffset": 2073920,
          "sourceCount": 2,
          "worldOffset": 6464,
          "worldCount": 1
        },
        {
          "sourceOffset": 2074048,
          "sourceCount": 2,
          "worldOffset": 6528,
          "worldCount": 1
        },
        {
          "sourceOffset": 2074176,
          "sourceCount": 2,
          "worldOffset": 6592,
          "worldCount": 1
        },
        {
          "sourceOffset": 2074304,
          "sourceCount": 2,
          "worldOffset": 6656,
          "worldCount": 1
        },
        {
          "sourceOffset": 2074432,
          "sourceCount": 2,
          "worldOffset": 6720,
          "worldCount": 1
        },
        {
          "sourceOffset": 2074560,
          "sourceCount": 2,
          "worldOffset": 6784,
          "worldCount": 1
        },
        {
          "sourceOffset": 2074688,
          "sourceCount": 2,
          "worldOffset": 6848,
          "worldCount": 1
        },
        {
          "sourceOffset": 2074816,
          "sourceCount": 2,
          "worldOffset": 6912,
          "worldCount": 1
        },
        {
          "sourceOffset": 2074944,
          "sourceCount": 2,
          "worldOffset": 6976,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "headlamp",
      "layer": "ground",
      "rect": [
        416,
        176,
        32,
        32
      ],
      "mode": "instances",
      "offset": 2075072,
      "directCount": 0,
      "count": 170,
      "assemblies": [
        {
          "sourceOffset": 2075072,
          "sourceCount": 2,
          "worldOffset": 1600,
          "worldCount": 1
        },
        {
          "sourceOffset": 2075200,
          "sourceCount": 2,
          "worldOffset": 1664,
          "worldCount": 1
        },
        {
          "sourceOffset": 2075328,
          "sourceCount": 2,
          "worldOffset": 1728,
          "worldCount": 1
        },
        {
          "sourceOffset": 2075456,
          "sourceCount": 2,
          "worldOffset": 1792,
          "worldCount": 1
        },
        {
          "sourceOffset": 2075584,
          "sourceCount": 2,
          "worldOffset": 1856,
          "worldCount": 1
        },
        {
          "sourceOffset": 2075712,
          "sourceCount": 2,
          "worldOffset": 1920,
          "worldCount": 1
        },
        {
          "sourceOffset": 2075840,
          "sourceCount": 2,
          "worldOffset": 1984,
          "worldCount": 1
        },
        {
          "sourceOffset": 2075968,
          "sourceCount": 2,
          "worldOffset": 2048,
          "worldCount": 1
        },
        {
          "sourceOffset": 2076096,
          "sourceCount": 2,
          "worldOffset": 2112,
          "worldCount": 1
        },
        {
          "sourceOffset": 2076224,
          "sourceCount": 2,
          "worldOffset": 2176,
          "worldCount": 1
        },
        {
          "sourceOffset": 2076352,
          "sourceCount": 2,
          "worldOffset": 2240,
          "worldCount": 1
        },
        {
          "sourceOffset": 2076480,
          "sourceCount": 2,
          "worldOffset": 2304,
          "worldCount": 1
        },
        {
          "sourceOffset": 2076608,
          "sourceCount": 2,
          "worldOffset": 2368,
          "worldCount": 1
        },
        {
          "sourceOffset": 2076736,
          "sourceCount": 2,
          "worldOffset": 2432,
          "worldCount": 1
        },
        {
          "sourceOffset": 2076864,
          "sourceCount": 2,
          "worldOffset": 2496,
          "worldCount": 1
        },
        {
          "sourceOffset": 2076992,
          "sourceCount": 2,
          "worldOffset": 2560,
          "worldCount": 1
        },
        {
          "sourceOffset": 2077120,
          "sourceCount": 2,
          "worldOffset": 2624,
          "worldCount": 1
        },
        {
          "sourceOffset": 2077248,
          "sourceCount": 2,
          "worldOffset": 2688,
          "worldCount": 1
        },
        {
          "sourceOffset": 2077376,
          "sourceCount": 2,
          "worldOffset": 2752,
          "worldCount": 1
        },
        {
          "sourceOffset": 2077504,
          "sourceCount": 2,
          "worldOffset": 2816,
          "worldCount": 1
        },
        {
          "sourceOffset": 2077632,
          "sourceCount": 2,
          "worldOffset": 2880,
          "worldCount": 1
        },
        {
          "sourceOffset": 2077760,
          "sourceCount": 2,
          "worldOffset": 2944,
          "worldCount": 1
        },
        {
          "sourceOffset": 2077888,
          "sourceCount": 2,
          "worldOffset": 3008,
          "worldCount": 1
        },
        {
          "sourceOffset": 2078016,
          "sourceCount": 2,
          "worldOffset": 3072,
          "worldCount": 1
        },
        {
          "sourceOffset": 2078144,
          "sourceCount": 2,
          "worldOffset": 3136,
          "worldCount": 1
        },
        {
          "sourceOffset": 2078272,
          "sourceCount": 2,
          "worldOffset": 3200,
          "worldCount": 1
        },
        {
          "sourceOffset": 2078400,
          "sourceCount": 2,
          "worldOffset": 3264,
          "worldCount": 1
        },
        {
          "sourceOffset": 2078528,
          "sourceCount": 2,
          "worldOffset": 3328,
          "worldCount": 1
        },
        {
          "sourceOffset": 2078656,
          "sourceCount": 2,
          "worldOffset": 3392,
          "worldCount": 1
        },
        {
          "sourceOffset": 2078784,
          "sourceCount": 2,
          "worldOffset": 3456,
          "worldCount": 1
        },
        {
          "sourceOffset": 2078912,
          "sourceCount": 2,
          "worldOffset": 3520,
          "worldCount": 1
        },
        {
          "sourceOffset": 2079040,
          "sourceCount": 2,
          "worldOffset": 3584,
          "worldCount": 1
        },
        {
          "sourceOffset": 2079168,
          "sourceCount": 2,
          "worldOffset": 3648,
          "worldCount": 1
        },
        {
          "sourceOffset": 2079296,
          "sourceCount": 2,
          "worldOffset": 3712,
          "worldCount": 1
        },
        {
          "sourceOffset": 2079424,
          "sourceCount": 2,
          "worldOffset": 3776,
          "worldCount": 1
        },
        {
          "sourceOffset": 2079552,
          "sourceCount": 2,
          "worldOffset": 3840,
          "worldCount": 1
        },
        {
          "sourceOffset": 2079680,
          "sourceCount": 2,
          "worldOffset": 3904,
          "worldCount": 1
        },
        {
          "sourceOffset": 2079808,
          "sourceCount": 2,
          "worldOffset": 3968,
          "worldCount": 1
        },
        {
          "sourceOffset": 2079936,
          "sourceCount": 2,
          "worldOffset": 4032,
          "worldCount": 1
        },
        {
          "sourceOffset": 2080064,
          "sourceCount": 2,
          "worldOffset": 4096,
          "worldCount": 1
        },
        {
          "sourceOffset": 2080192,
          "sourceCount": 2,
          "worldOffset": 4160,
          "worldCount": 1
        },
        {
          "sourceOffset": 2080320,
          "sourceCount": 2,
          "worldOffset": 4224,
          "worldCount": 1
        },
        {
          "sourceOffset": 2080448,
          "sourceCount": 2,
          "worldOffset": 4288,
          "worldCount": 1
        },
        {
          "sourceOffset": 2080576,
          "sourceCount": 2,
          "worldOffset": 4352,
          "worldCount": 1
        },
        {
          "sourceOffset": 2080704,
          "sourceCount": 2,
          "worldOffset": 4416,
          "worldCount": 1
        },
        {
          "sourceOffset": 2080832,
          "sourceCount": 2,
          "worldOffset": 4480,
          "worldCount": 1
        },
        {
          "sourceOffset": 2080960,
          "sourceCount": 2,
          "worldOffset": 4544,
          "worldCount": 1
        },
        {
          "sourceOffset": 2081088,
          "sourceCount": 2,
          "worldOffset": 4608,
          "worldCount": 1
        },
        {
          "sourceOffset": 2081216,
          "sourceCount": 2,
          "worldOffset": 4672,
          "worldCount": 1
        },
        {
          "sourceOffset": 2081344,
          "sourceCount": 2,
          "worldOffset": 4736,
          "worldCount": 1
        },
        {
          "sourceOffset": 2081472,
          "sourceCount": 2,
          "worldOffset": 4800,
          "worldCount": 1
        },
        {
          "sourceOffset": 2081600,
          "sourceCount": 2,
          "worldOffset": 4864,
          "worldCount": 1
        },
        {
          "sourceOffset": 2081728,
          "sourceCount": 2,
          "worldOffset": 4928,
          "worldCount": 1
        },
        {
          "sourceOffset": 2081856,
          "sourceCount": 2,
          "worldOffset": 4992,
          "worldCount": 1
        },
        {
          "sourceOffset": 2081984,
          "sourceCount": 2,
          "worldOffset": 5056,
          "worldCount": 1
        },
        {
          "sourceOffset": 2082112,
          "sourceCount": 2,
          "worldOffset": 5120,
          "worldCount": 1
        },
        {
          "sourceOffset": 2082240,
          "sourceCount": 2,
          "worldOffset": 5184,
          "worldCount": 1
        },
        {
          "sourceOffset": 2082368,
          "sourceCount": 2,
          "worldOffset": 5248,
          "worldCount": 1
        },
        {
          "sourceOffset": 2082496,
          "sourceCount": 2,
          "worldOffset": 5312,
          "worldCount": 1
        },
        {
          "sourceOffset": 2082624,
          "sourceCount": 2,
          "worldOffset": 5376,
          "worldCount": 1
        },
        {
          "sourceOffset": 2082752,
          "sourceCount": 2,
          "worldOffset": 5440,
          "worldCount": 1
        },
        {
          "sourceOffset": 2082880,
          "sourceCount": 2,
          "worldOffset": 5504,
          "worldCount": 1
        },
        {
          "sourceOffset": 2083008,
          "sourceCount": 2,
          "worldOffset": 5568,
          "worldCount": 1
        },
        {
          "sourceOffset": 2083136,
          "sourceCount": 2,
          "worldOffset": 5632,
          "worldCount": 1
        },
        {
          "sourceOffset": 2083264,
          "sourceCount": 2,
          "worldOffset": 5696,
          "worldCount": 1
        },
        {
          "sourceOffset": 2083392,
          "sourceCount": 2,
          "worldOffset": 5760,
          "worldCount": 1
        },
        {
          "sourceOffset": 2083520,
          "sourceCount": 2,
          "worldOffset": 5824,
          "worldCount": 1
        },
        {
          "sourceOffset": 2083648,
          "sourceCount": 2,
          "worldOffset": 5888,
          "worldCount": 1
        },
        {
          "sourceOffset": 2083776,
          "sourceCount": 2,
          "worldOffset": 5952,
          "worldCount": 1
        },
        {
          "sourceOffset": 2083904,
          "sourceCount": 2,
          "worldOffset": 6016,
          "worldCount": 1
        },
        {
          "sourceOffset": 2084032,
          "sourceCount": 2,
          "worldOffset": 6080,
          "worldCount": 1
        },
        {
          "sourceOffset": 2084160,
          "sourceCount": 2,
          "worldOffset": 6144,
          "worldCount": 1
        },
        {
          "sourceOffset": 2084288,
          "sourceCount": 2,
          "worldOffset": 6208,
          "worldCount": 1
        },
        {
          "sourceOffset": 2084416,
          "sourceCount": 2,
          "worldOffset": 6272,
          "worldCount": 1
        },
        {
          "sourceOffset": 2084544,
          "sourceCount": 2,
          "worldOffset": 6336,
          "worldCount": 1
        },
        {
          "sourceOffset": 2084672,
          "sourceCount": 2,
          "worldOffset": 6400,
          "worldCount": 1
        },
        {
          "sourceOffset": 2084800,
          "sourceCount": 2,
          "worldOffset": 6464,
          "worldCount": 1
        },
        {
          "sourceOffset": 2084928,
          "sourceCount": 2,
          "worldOffset": 6528,
          "worldCount": 1
        },
        {
          "sourceOffset": 2085056,
          "sourceCount": 2,
          "worldOffset": 6592,
          "worldCount": 1
        },
        {
          "sourceOffset": 2085184,
          "sourceCount": 2,
          "worldOffset": 6656,
          "worldCount": 1
        },
        {
          "sourceOffset": 2085312,
          "sourceCount": 2,
          "worldOffset": 6720,
          "worldCount": 1
        },
        {
          "sourceOffset": 2085440,
          "sourceCount": 2,
          "worldOffset": 6784,
          "worldCount": 1
        },
        {
          "sourceOffset": 2085568,
          "sourceCount": 2,
          "worldOffset": 6848,
          "worldCount": 1
        },
        {
          "sourceOffset": 2085696,
          "sourceCount": 2,
          "worldOffset": 6912,
          "worldCount": 1
        },
        {
          "sourceOffset": 2085824,
          "sourceCount": 2,
          "worldOffset": 6976,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "dark-glass",
      "layer": "near",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 2085952,
      "vertices": 1908,
      "matricesOffset": 1152,
      "count": 1
    },
    {
      "field": "roof",
      "layer": "near",
      "rect": [
        0,
        896,
        704,
        128
      ],
      "mode": "meshInstances",
      "offset": 2147008,
      "vertices": 564,
      "matricesOffset": 1152,
      "count": 1
    },
    {
      "field": "metal",
      "layer": "near",
      "rect": [
        768,
        0,
        256,
        64
      ],
      "mode": "meshInstances",
      "offset": 2165056,
      "vertices": 1152,
      "matricesOffset": 1152,
      "count": 1
    },
    {
      "field": "roof",
      "layer": "near",
      "rect": [
        0,
        896,
        704,
        128
      ],
      "mode": "meshInstances",
      "offset": 2201920,
      "vertices": 12,
      "matricesOffset": 1216,
      "count": 1
    },
    {
      "field": "plaster",
      "layer": "near",
      "rect": [
        0,
        512,
        768,
        64
      ],
      "mode": "meshInstances",
      "offset": 2202304,
      "vertices": 6,
      "matricesOffset": 1216,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "near",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 2202496,
      "vertices": 540,
      "matricesOffset": 1216,
      "count": 1
    },
    {
      "field": "north-floor",
      "layer": "near",
      "rect": [
        512,
        0,
        128,
        256
      ],
      "mode": "meshInstances",
      "offset": 2219776,
      "vertices": 144,
      "matricesOffset": 1216,
      "count": 1
    },
    {
      "field": "cement",
      "layer": "near",
      "rect": [
        768,
        192,
        256,
        64
      ],
      "mode": "meshInstances",
      "offset": 2224384,
      "vertices": 180,
      "matricesOffset": 1216,
      "count": 1
    },
    {
      "field": "south-floor",
      "layer": "near",
      "rect": [
        640,
        0,
        128,
        128
      ],
      "mode": "meshInstances",
      "offset": 2230144,
      "vertices": 36,
      "matricesOffset": 1216,
      "count": 1
    },
    {
      "field": "metal",
      "layer": "near",
      "rect": [
        768,
        0,
        256,
        64
      ],
      "mode": "meshInstances",
      "offset": 2231296,
      "vertices": 936,
      "matricesOffset": 1216,
      "count": 1
    },
    {
      "field": "roof",
      "layer": "near",
      "rect": [
        0,
        896,
        704,
        128
      ],
      "mode": "meshInstances",
      "offset": 2261248,
      "vertices": 12,
      "matricesOffset": 1280,
      "count": 1
    },
    {
      "field": "plaster",
      "layer": "near",
      "rect": [
        0,
        512,
        768,
        64
      ],
      "mode": "meshInstances",
      "offset": 2261632,
      "vertices": 6,
      "matricesOffset": 1280,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "near",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 2261824,
      "vertices": 540,
      "matricesOffset": 1280,
      "count": 1
    },
    {
      "field": "north-floor",
      "layer": "near",
      "rect": [
        512,
        0,
        128,
        256
      ],
      "mode": "meshInstances",
      "offset": 2279104,
      "vertices": 144,
      "matricesOffset": 1280,
      "count": 1
    },
    {
      "field": "cement",
      "layer": "near",
      "rect": [
        768,
        192,
        256,
        64
      ],
      "mode": "meshInstances",
      "offset": 2283712,
      "vertices": 180,
      "matricesOffset": 1280,
      "count": 1
    },
    {
      "field": "south-floor",
      "layer": "near",
      "rect": [
        640,
        0,
        128,
        128
      ],
      "mode": "meshInstances",
      "offset": 2289472,
      "vertices": 36,
      "matricesOffset": 1280,
      "count": 1
    },
    {
      "field": "metal",
      "layer": "near",
      "rect": [
        768,
        0,
        256,
        64
      ],
      "mode": "meshInstances",
      "offset": 2290624,
      "vertices": 936,
      "matricesOffset": 1280,
      "count": 1
    },
    {
      "field": "home-roof-north",
      "layer": "near",
      "rect": [
        0,
        640,
        704,
        128
      ],
      "mode": "meshInstances",
      "offset": 2320576,
      "vertices": 5274,
      "matricesOffset": 1344,
      "count": 1
    },
    {
      "field": "home-roof-south",
      "layer": "near",
      "rect": [
        0,
        768,
        704,
        128
      ],
      "mode": "meshInstances",
      "offset": 2489344,
      "vertices": 5238,
      "matricesOffset": 1344,
      "count": 1
    },
    {
      "field": "plaster",
      "layer": "near",
      "rect": [
        0,
        512,
        768,
        64
      ],
      "mode": "meshInstances",
      "offset": 2656960,
      "vertices": 6,
      "matricesOffset": 1344,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "near",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 2657152,
      "vertices": 540,
      "matricesOffset": 1344,
      "count": 1
    },
    {
      "field": "north-floor",
      "layer": "near",
      "rect": [
        512,
        0,
        128,
        256
      ],
      "mode": "meshInstances",
      "offset": 2674432,
      "vertices": 144,
      "matricesOffset": 1344,
      "count": 1
    },
    {
      "field": "cement",
      "layer": "near",
      "rect": [
        768,
        192,
        256,
        64
      ],
      "mode": "meshInstances",
      "offset": 2679040,
      "vertices": 1188,
      "matricesOffset": 1344,
      "count": 1
    },
    {
      "field": "south-floor",
      "layer": "near",
      "rect": [
        640,
        0,
        128,
        128
      ],
      "mode": "meshInstances",
      "offset": 2717056,
      "vertices": 36,
      "matricesOffset": 1344,
      "count": 1
    },
    {
      "field": "metal",
      "layer": "near",
      "rect": [
        768,
        0,
        256,
        64
      ],
      "mode": "meshInstances",
      "offset": 2718208,
      "vertices": 288,
      "matricesOffset": 1344,
      "count": 1
    },
    {
      "field": "rust-iron",
      "layer": "near",
      "rect": [
        768,
        64,
        256,
        64
      ],
      "mode": "meshInstances",
      "offset": 2727424,
      "vertices": 216,
      "matricesOffset": 1344,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "near",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 2734336,
      "vertices": 2592,
      "matricesOffset": 1408,
      "count": 1
    },
    {
      "field": "roof",
      "layer": "near",
      "rect": [
        0,
        896,
        704,
        128
      ],
      "mode": "meshInstances",
      "offset": 2817280,
      "vertices": 690,
      "matricesOffset": 1408,
      "count": 1
    },
    {
      "field": "metal",
      "layer": "near",
      "rect": [
        768,
        0,
        256,
        64
      ],
      "mode": "meshInstances",
      "offset": 2839360,
      "vertices": 1152,
      "matricesOffset": 1408,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "near",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 2876224,
      "vertices": 1908,
      "matricesOffset": 1472,
      "count": 1
    },
    {
      "field": "roof",
      "layer": "near",
      "rect": [
        0,
        896,
        704,
        128
      ],
      "mode": "meshInstances",
      "offset": 2937280,
      "vertices": 522,
      "matricesOffset": 1472,
      "count": 1
    },
    {
      "field": "metal",
      "layer": "near",
      "rect": [
        768,
        0,
        256,
        64
      ],
      "mode": "meshInstances",
      "offset": 2953984,
      "vertices": 1152,
      "matricesOffset": 1472,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "near",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 2990848,
      "vertices": 1908,
      "matricesOffset": 1536,
      "count": 1
    },
    {
      "field": "roof",
      "layer": "near",
      "rect": [
        0,
        896,
        704,
        128
      ],
      "mode": "meshInstances",
      "offset": 3051904,
      "vertices": 522,
      "matricesOffset": 1536,
      "count": 1
    },
    {
      "field": "metal",
      "layer": "near",
      "rect": [
        768,
        0,
        256,
        64
      ],
      "mode": "meshInstances",
      "offset": 3068608,
      "vertices": 1152,
      "matricesOffset": 1536,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3105472,
      "vertices": 432,
      "matricesOffset": 1600,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3119296,
      "vertices": 72,
      "matricesOffset": 1600,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3121600,
      "vertices": 12,
      "matricesOffset": 1600,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3121984,
      "vertices": 12,
      "matricesOffset": 1600,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3122368,
      "vertices": 12,
      "matricesOffset": 1664,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3122752,
      "vertices": 432,
      "matricesOffset": 1664,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3136576,
      "vertices": 12,
      "matricesOffset": 1664,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3136960,
      "vertices": 72,
      "matricesOffset": 1664,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3139264,
      "vertices": 432,
      "matricesOffset": 1728,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3153088,
      "vertices": 12,
      "matricesOffset": 1728,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3153472,
      "vertices": 72,
      "matricesOffset": 1728,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3155776,
      "vertices": 12,
      "matricesOffset": 1728,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3156160,
      "vertices": 432,
      "matricesOffset": 1792,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3169984,
      "vertices": 72,
      "matricesOffset": 1792,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3172288,
      "vertices": 12,
      "matricesOffset": 1792,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3172672,
      "vertices": 12,
      "matricesOffset": 1792,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3173056,
      "vertices": 12,
      "matricesOffset": 1856,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3173440,
      "vertices": 432,
      "matricesOffset": 1856,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3187264,
      "vertices": 12,
      "matricesOffset": 1856,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3187648,
      "vertices": 72,
      "matricesOffset": 1856,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3189952,
      "vertices": 432,
      "matricesOffset": 1920,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3203776,
      "vertices": 12,
      "matricesOffset": 1920,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3204160,
      "vertices": 72,
      "matricesOffset": 1920,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3206464,
      "vertices": 12,
      "matricesOffset": 1920,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3206848,
      "vertices": 432,
      "matricesOffset": 1984,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3220672,
      "vertices": 72,
      "matricesOffset": 1984,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3222976,
      "vertices": 12,
      "matricesOffset": 1984,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3223360,
      "vertices": 12,
      "matricesOffset": 1984,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3223744,
      "vertices": 12,
      "matricesOffset": 2048,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3224128,
      "vertices": 432,
      "matricesOffset": 2048,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3237952,
      "vertices": 12,
      "matricesOffset": 2048,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3238336,
      "vertices": 72,
      "matricesOffset": 2048,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3240640,
      "vertices": 432,
      "matricesOffset": 2112,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3254464,
      "vertices": 12,
      "matricesOffset": 2112,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3254848,
      "vertices": 72,
      "matricesOffset": 2112,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3257152,
      "vertices": 12,
      "matricesOffset": 2112,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3257536,
      "vertices": 432,
      "matricesOffset": 2176,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3271360,
      "vertices": 72,
      "matricesOffset": 2176,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3273664,
      "vertices": 12,
      "matricesOffset": 2176,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3274048,
      "vertices": 12,
      "matricesOffset": 2176,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3274432,
      "vertices": 12,
      "matricesOffset": 2240,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3274816,
      "vertices": 432,
      "matricesOffset": 2240,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3288640,
      "vertices": 12,
      "matricesOffset": 2240,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3289024,
      "vertices": 72,
      "matricesOffset": 2240,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3291328,
      "vertices": 432,
      "matricesOffset": 2304,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3305152,
      "vertices": 12,
      "matricesOffset": 2304,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3305536,
      "vertices": 72,
      "matricesOffset": 2304,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3307840,
      "vertices": 12,
      "matricesOffset": 2304,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3308224,
      "vertices": 432,
      "matricesOffset": 2368,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3322048,
      "vertices": 72,
      "matricesOffset": 2368,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3324352,
      "vertices": 12,
      "matricesOffset": 2368,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3324736,
      "vertices": 12,
      "matricesOffset": 2368,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3325120,
      "vertices": 12,
      "matricesOffset": 2432,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3325504,
      "vertices": 432,
      "matricesOffset": 2432,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3339328,
      "vertices": 12,
      "matricesOffset": 2432,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3339712,
      "vertices": 72,
      "matricesOffset": 2432,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3342016,
      "vertices": 432,
      "matricesOffset": 2496,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3355840,
      "vertices": 12,
      "matricesOffset": 2496,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3356224,
      "vertices": 72,
      "matricesOffset": 2496,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3358528,
      "vertices": 12,
      "matricesOffset": 2496,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3358912,
      "vertices": 432,
      "matricesOffset": 2560,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3372736,
      "vertices": 72,
      "matricesOffset": 2560,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3375040,
      "vertices": 12,
      "matricesOffset": 2560,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3375424,
      "vertices": 12,
      "matricesOffset": 2560,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3375808,
      "vertices": 12,
      "matricesOffset": 2624,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3376192,
      "vertices": 432,
      "matricesOffset": 2624,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3390016,
      "vertices": 12,
      "matricesOffset": 2624,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3390400,
      "vertices": 72,
      "matricesOffset": 2624,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3392704,
      "vertices": 432,
      "matricesOffset": 2688,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3406528,
      "vertices": 12,
      "matricesOffset": 2688,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3406912,
      "vertices": 72,
      "matricesOffset": 2688,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3409216,
      "vertices": 12,
      "matricesOffset": 2688,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3409600,
      "vertices": 432,
      "matricesOffset": 2752,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3423424,
      "vertices": 72,
      "matricesOffset": 2752,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3425728,
      "vertices": 12,
      "matricesOffset": 2752,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3426112,
      "vertices": 12,
      "matricesOffset": 2752,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3426496,
      "vertices": 12,
      "matricesOffset": 2816,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3426880,
      "vertices": 432,
      "matricesOffset": 2816,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3440704,
      "vertices": 12,
      "matricesOffset": 2816,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3441088,
      "vertices": 72,
      "matricesOffset": 2816,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3443392,
      "vertices": 432,
      "matricesOffset": 2880,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3457216,
      "vertices": 12,
      "matricesOffset": 2880,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3457600,
      "vertices": 72,
      "matricesOffset": 2880,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3459904,
      "vertices": 12,
      "matricesOffset": 2880,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3460288,
      "vertices": 432,
      "matricesOffset": 2944,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3474112,
      "vertices": 72,
      "matricesOffset": 2944,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3476416,
      "vertices": 12,
      "matricesOffset": 2944,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3476800,
      "vertices": 12,
      "matricesOffset": 2944,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3477184,
      "vertices": 12,
      "matricesOffset": 3008,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3477568,
      "vertices": 432,
      "matricesOffset": 3008,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3491392,
      "vertices": 12,
      "matricesOffset": 3008,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3491776,
      "vertices": 72,
      "matricesOffset": 3008,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3494080,
      "vertices": 432,
      "matricesOffset": 3072,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3507904,
      "vertices": 12,
      "matricesOffset": 3072,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3508288,
      "vertices": 72,
      "matricesOffset": 3072,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3510592,
      "vertices": 12,
      "matricesOffset": 3072,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3510976,
      "vertices": 432,
      "matricesOffset": 3136,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3524800,
      "vertices": 72,
      "matricesOffset": 3136,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3527104,
      "vertices": 12,
      "matricesOffset": 3136,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3527488,
      "vertices": 12,
      "matricesOffset": 3136,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3527872,
      "vertices": 12,
      "matricesOffset": 3200,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3528256,
      "vertices": 432,
      "matricesOffset": 3200,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3542080,
      "vertices": 12,
      "matricesOffset": 3200,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3542464,
      "vertices": 72,
      "matricesOffset": 3200,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3544768,
      "vertices": 432,
      "matricesOffset": 3264,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3558592,
      "vertices": 12,
      "matricesOffset": 3264,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3558976,
      "vertices": 72,
      "matricesOffset": 3264,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3561280,
      "vertices": 12,
      "matricesOffset": 3264,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3561664,
      "vertices": 432,
      "matricesOffset": 3328,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3575488,
      "vertices": 72,
      "matricesOffset": 3328,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3577792,
      "vertices": 12,
      "matricesOffset": 3328,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3578176,
      "vertices": 12,
      "matricesOffset": 3328,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3578560,
      "vertices": 12,
      "matricesOffset": 3392,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3578944,
      "vertices": 432,
      "matricesOffset": 3392,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3592768,
      "vertices": 12,
      "matricesOffset": 3392,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3593152,
      "vertices": 72,
      "matricesOffset": 3392,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3595456,
      "vertices": 432,
      "matricesOffset": 3456,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3609280,
      "vertices": 12,
      "matricesOffset": 3456,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3609664,
      "vertices": 72,
      "matricesOffset": 3456,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3611968,
      "vertices": 12,
      "matricesOffset": 3456,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3612352,
      "vertices": 432,
      "matricesOffset": 3520,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3626176,
      "vertices": 72,
      "matricesOffset": 3520,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3628480,
      "vertices": 12,
      "matricesOffset": 3520,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3628864,
      "vertices": 12,
      "matricesOffset": 3520,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3629248,
      "vertices": 12,
      "matricesOffset": 3584,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3629632,
      "vertices": 432,
      "matricesOffset": 3584,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3643456,
      "vertices": 12,
      "matricesOffset": 3584,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3643840,
      "vertices": 72,
      "matricesOffset": 3584,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3646144,
      "vertices": 432,
      "matricesOffset": 3648,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3659968,
      "vertices": 12,
      "matricesOffset": 3648,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3660352,
      "vertices": 72,
      "matricesOffset": 3648,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3662656,
      "vertices": 12,
      "matricesOffset": 3648,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3663040,
      "vertices": 432,
      "matricesOffset": 3712,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3676864,
      "vertices": 72,
      "matricesOffset": 3712,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3679168,
      "vertices": 12,
      "matricesOffset": 3712,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3679552,
      "vertices": 12,
      "matricesOffset": 3712,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3679936,
      "vertices": 12,
      "matricesOffset": 3776,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3680320,
      "vertices": 432,
      "matricesOffset": 3776,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3694144,
      "vertices": 12,
      "matricesOffset": 3776,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3694528,
      "vertices": 72,
      "matricesOffset": 3776,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3696832,
      "vertices": 432,
      "matricesOffset": 3840,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3710656,
      "vertices": 12,
      "matricesOffset": 3840,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3711040,
      "vertices": 72,
      "matricesOffset": 3840,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3713344,
      "vertices": 12,
      "matricesOffset": 3840,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3713728,
      "vertices": 432,
      "matricesOffset": 3904,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3727552,
      "vertices": 72,
      "matricesOffset": 3904,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3729856,
      "vertices": 12,
      "matricesOffset": 3904,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3730240,
      "vertices": 12,
      "matricesOffset": 3904,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3730624,
      "vertices": 12,
      "matricesOffset": 3968,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3731008,
      "vertices": 432,
      "matricesOffset": 3968,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3744832,
      "vertices": 12,
      "matricesOffset": 3968,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3745216,
      "vertices": 72,
      "matricesOffset": 3968,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3747520,
      "vertices": 432,
      "matricesOffset": 4032,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3761344,
      "vertices": 12,
      "matricesOffset": 4032,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3761728,
      "vertices": 72,
      "matricesOffset": 4032,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3764032,
      "vertices": 12,
      "matricesOffset": 4032,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3764416,
      "vertices": 432,
      "matricesOffset": 4096,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3778240,
      "vertices": 72,
      "matricesOffset": 4096,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3780544,
      "vertices": 12,
      "matricesOffset": 4096,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3780928,
      "vertices": 12,
      "matricesOffset": 4096,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3781312,
      "vertices": 12,
      "matricesOffset": 4160,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3781696,
      "vertices": 432,
      "matricesOffset": 4160,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3795520,
      "vertices": 12,
      "matricesOffset": 4160,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3795904,
      "vertices": 72,
      "matricesOffset": 4160,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3798208,
      "vertices": 432,
      "matricesOffset": 4224,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3812032,
      "vertices": 12,
      "matricesOffset": 4224,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3812416,
      "vertices": 72,
      "matricesOffset": 4224,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3814720,
      "vertices": 12,
      "matricesOffset": 4224,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3815104,
      "vertices": 432,
      "matricesOffset": 4288,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3828928,
      "vertices": 72,
      "matricesOffset": 4288,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3831232,
      "vertices": 12,
      "matricesOffset": 4288,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3831616,
      "vertices": 12,
      "matricesOffset": 4288,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3832000,
      "vertices": 12,
      "matricesOffset": 4352,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3832384,
      "vertices": 432,
      "matricesOffset": 4352,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3846208,
      "vertices": 12,
      "matricesOffset": 4352,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3846592,
      "vertices": 72,
      "matricesOffset": 4352,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3848896,
      "vertices": 432,
      "matricesOffset": 4416,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3862720,
      "vertices": 12,
      "matricesOffset": 4416,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3863104,
      "vertices": 72,
      "matricesOffset": 4416,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3865408,
      "vertices": 12,
      "matricesOffset": 4416,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3865792,
      "vertices": 432,
      "matricesOffset": 4480,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3879616,
      "vertices": 72,
      "matricesOffset": 4480,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3881920,
      "vertices": 12,
      "matricesOffset": 4480,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3882304,
      "vertices": 12,
      "matricesOffset": 4480,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3882688,
      "vertices": 12,
      "matricesOffset": 4544,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3883072,
      "vertices": 432,
      "matricesOffset": 4544,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3896896,
      "vertices": 12,
      "matricesOffset": 4544,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3897280,
      "vertices": 72,
      "matricesOffset": 4544,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3899584,
      "vertices": 432,
      "matricesOffset": 4608,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3913408,
      "vertices": 12,
      "matricesOffset": 4608,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3913792,
      "vertices": 72,
      "matricesOffset": 4608,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3916096,
      "vertices": 12,
      "matricesOffset": 4608,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3916480,
      "vertices": 432,
      "matricesOffset": 4672,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3930304,
      "vertices": 72,
      "matricesOffset": 4672,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3932608,
      "vertices": 12,
      "matricesOffset": 4672,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3932992,
      "vertices": 12,
      "matricesOffset": 4672,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3933376,
      "vertices": 12,
      "matricesOffset": 4736,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3933760,
      "vertices": 432,
      "matricesOffset": 4736,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3947584,
      "vertices": 12,
      "matricesOffset": 4736,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3947968,
      "vertices": 72,
      "matricesOffset": 4736,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3950272,
      "vertices": 432,
      "matricesOffset": 4800,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3964096,
      "vertices": 12,
      "matricesOffset": 4800,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3964480,
      "vertices": 72,
      "matricesOffset": 4800,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3966784,
      "vertices": 12,
      "matricesOffset": 4800,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3967168,
      "vertices": 432,
      "matricesOffset": 4864,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3980992,
      "vertices": 72,
      "matricesOffset": 4864,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3983296,
      "vertices": 12,
      "matricesOffset": 4864,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3983680,
      "vertices": 12,
      "matricesOffset": 4864,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3984064,
      "vertices": 12,
      "matricesOffset": 4928,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3984448,
      "vertices": 432,
      "matricesOffset": 4928,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3998272,
      "vertices": 12,
      "matricesOffset": 4928,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 3998656,
      "vertices": 72,
      "matricesOffset": 4928,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4000960,
      "vertices": 432,
      "matricesOffset": 4992,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4014784,
      "vertices": 12,
      "matricesOffset": 4992,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4015168,
      "vertices": 72,
      "matricesOffset": 4992,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4017472,
      "vertices": 12,
      "matricesOffset": 4992,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4017856,
      "vertices": 432,
      "matricesOffset": 5056,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4031680,
      "vertices": 72,
      "matricesOffset": 5056,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4033984,
      "vertices": 12,
      "matricesOffset": 5056,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4034368,
      "vertices": 12,
      "matricesOffset": 5056,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4034752,
      "vertices": 12,
      "matricesOffset": 5120,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4035136,
      "vertices": 432,
      "matricesOffset": 5120,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4048960,
      "vertices": 12,
      "matricesOffset": 5120,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4049344,
      "vertices": 72,
      "matricesOffset": 5120,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4051648,
      "vertices": 432,
      "matricesOffset": 5184,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4065472,
      "vertices": 12,
      "matricesOffset": 5184,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4065856,
      "vertices": 72,
      "matricesOffset": 5184,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4068160,
      "vertices": 12,
      "matricesOffset": 5184,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4068544,
      "vertices": 432,
      "matricesOffset": 5248,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4082368,
      "vertices": 72,
      "matricesOffset": 5248,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4084672,
      "vertices": 12,
      "matricesOffset": 5248,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4085056,
      "vertices": 12,
      "matricesOffset": 5248,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4085440,
      "vertices": 12,
      "matricesOffset": 5312,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4085824,
      "vertices": 432,
      "matricesOffset": 5312,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4099648,
      "vertices": 12,
      "matricesOffset": 5312,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4100032,
      "vertices": 72,
      "matricesOffset": 5312,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4102336,
      "vertices": 432,
      "matricesOffset": 5376,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4116160,
      "vertices": 12,
      "matricesOffset": 5376,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4116544,
      "vertices": 72,
      "matricesOffset": 5376,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4118848,
      "vertices": 12,
      "matricesOffset": 5376,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4119232,
      "vertices": 432,
      "matricesOffset": 5440,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4133056,
      "vertices": 72,
      "matricesOffset": 5440,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4135360,
      "vertices": 12,
      "matricesOffset": 5440,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4135744,
      "vertices": 12,
      "matricesOffset": 5440,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4136128,
      "vertices": 12,
      "matricesOffset": 5504,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4136512,
      "vertices": 432,
      "matricesOffset": 5504,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4150336,
      "vertices": 12,
      "matricesOffset": 5504,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4150720,
      "vertices": 72,
      "matricesOffset": 5504,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4153024,
      "vertices": 432,
      "matricesOffset": 5568,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4166848,
      "vertices": 12,
      "matricesOffset": 5568,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4167232,
      "vertices": 72,
      "matricesOffset": 5568,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4169536,
      "vertices": 12,
      "matricesOffset": 5568,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4169920,
      "vertices": 432,
      "matricesOffset": 5632,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4183744,
      "vertices": 72,
      "matricesOffset": 5632,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4186048,
      "vertices": 12,
      "matricesOffset": 5632,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4186432,
      "vertices": 12,
      "matricesOffset": 5632,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4186816,
      "vertices": 12,
      "matricesOffset": 5696,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4187200,
      "vertices": 432,
      "matricesOffset": 5696,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4201024,
      "vertices": 12,
      "matricesOffset": 5696,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4201408,
      "vertices": 72,
      "matricesOffset": 5696,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4203712,
      "vertices": 432,
      "matricesOffset": 5760,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4217536,
      "vertices": 12,
      "matricesOffset": 5760,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4217920,
      "vertices": 72,
      "matricesOffset": 5760,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4220224,
      "vertices": 12,
      "matricesOffset": 5760,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4220608,
      "vertices": 432,
      "matricesOffset": 5824,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4234432,
      "vertices": 72,
      "matricesOffset": 5824,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4236736,
      "vertices": 12,
      "matricesOffset": 5824,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4237120,
      "vertices": 12,
      "matricesOffset": 5824,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4237504,
      "vertices": 12,
      "matricesOffset": 5888,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4237888,
      "vertices": 432,
      "matricesOffset": 5888,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4251712,
      "vertices": 12,
      "matricesOffset": 5888,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4252096,
      "vertices": 72,
      "matricesOffset": 5888,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4254400,
      "vertices": 432,
      "matricesOffset": 5952,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4268224,
      "vertices": 12,
      "matricesOffset": 5952,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4268608,
      "vertices": 72,
      "matricesOffset": 5952,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4270912,
      "vertices": 12,
      "matricesOffset": 5952,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4271296,
      "vertices": 432,
      "matricesOffset": 6016,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4285120,
      "vertices": 72,
      "matricesOffset": 6016,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4287424,
      "vertices": 12,
      "matricesOffset": 6016,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4287808,
      "vertices": 12,
      "matricesOffset": 6016,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4288192,
      "vertices": 12,
      "matricesOffset": 6080,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4288576,
      "vertices": 432,
      "matricesOffset": 6080,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4302400,
      "vertices": 12,
      "matricesOffset": 6080,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4302784,
      "vertices": 72,
      "matricesOffset": 6080,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4305088,
      "vertices": 432,
      "matricesOffset": 6144,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4318912,
      "vertices": 12,
      "matricesOffset": 6144,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4319296,
      "vertices": 72,
      "matricesOffset": 6144,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4321600,
      "vertices": 12,
      "matricesOffset": 6144,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4321984,
      "vertices": 432,
      "matricesOffset": 6208,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4335808,
      "vertices": 72,
      "matricesOffset": 6208,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4338112,
      "vertices": 12,
      "matricesOffset": 6208,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4338496,
      "vertices": 12,
      "matricesOffset": 6208,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4338880,
      "vertices": 12,
      "matricesOffset": 6272,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4339264,
      "vertices": 432,
      "matricesOffset": 6272,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4353088,
      "vertices": 12,
      "matricesOffset": 6272,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4353472,
      "vertices": 72,
      "matricesOffset": 6272,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4355776,
      "vertices": 432,
      "matricesOffset": 6336,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4369600,
      "vertices": 12,
      "matricesOffset": 6336,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4369984,
      "vertices": 72,
      "matricesOffset": 6336,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4372288,
      "vertices": 12,
      "matricesOffset": 6336,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4372672,
      "vertices": 432,
      "matricesOffset": 6400,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4386496,
      "vertices": 72,
      "matricesOffset": 6400,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4388800,
      "vertices": 12,
      "matricesOffset": 6400,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4389184,
      "vertices": 12,
      "matricesOffset": 6400,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4389568,
      "vertices": 12,
      "matricesOffset": 6464,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4389952,
      "vertices": 432,
      "matricesOffset": 6464,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4403776,
      "vertices": 12,
      "matricesOffset": 6464,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4404160,
      "vertices": 72,
      "matricesOffset": 6464,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4406464,
      "vertices": 432,
      "matricesOffset": 6528,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4420288,
      "vertices": 12,
      "matricesOffset": 6528,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4420672,
      "vertices": 72,
      "matricesOffset": 6528,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4422976,
      "vertices": 12,
      "matricesOffset": 6528,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4423360,
      "vertices": 432,
      "matricesOffset": 6592,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4437184,
      "vertices": 72,
      "matricesOffset": 6592,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4439488,
      "vertices": 12,
      "matricesOffset": 6592,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4439872,
      "vertices": 12,
      "matricesOffset": 6592,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4440256,
      "vertices": 12,
      "matricesOffset": 6656,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4440640,
      "vertices": 432,
      "matricesOffset": 6656,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4454464,
      "vertices": 12,
      "matricesOffset": 6656,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4454848,
      "vertices": 72,
      "matricesOffset": 6656,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4457152,
      "vertices": 432,
      "matricesOffset": 6720,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4470976,
      "vertices": 12,
      "matricesOffset": 6720,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4471360,
      "vertices": 72,
      "matricesOffset": 6720,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4473664,
      "vertices": 12,
      "matricesOffset": 6720,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4474048,
      "vertices": 432,
      "matricesOffset": 6784,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4487872,
      "vertices": 72,
      "matricesOffset": 6784,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4490176,
      "vertices": 12,
      "matricesOffset": 6784,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4490560,
      "vertices": 12,
      "matricesOffset": 6784,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4490944,
      "vertices": 12,
      "matricesOffset": 6848,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4491328,
      "vertices": 432,
      "matricesOffset": 6848,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4505152,
      "vertices": 12,
      "matricesOffset": 6848,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4505536,
      "vertices": 72,
      "matricesOffset": 6848,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4507840,
      "vertices": 432,
      "matricesOffset": 6912,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4521664,
      "vertices": 12,
      "matricesOffset": 6912,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4522048,
      "vertices": 72,
      "matricesOffset": 6912,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4524352,
      "vertices": 12,
      "matricesOffset": 6912,
      "count": 1
    },
    {
      "field": "tire",
      "layer": "ground",
      "rect": [
        384,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4524736,
      "vertices": 432,
      "matricesOffset": 6976,
      "count": 1
    },
    {
      "field": "car-ivory",
      "layer": "ground",
      "rect": [
        256,
        176,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4538560,
      "vertices": 72,
      "matricesOffset": 6976,
      "count": 1
    },
    {
      "field": "glass",
      "layer": "ground",
      "rect": [
        288,
        256,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4540864,
      "vertices": 12,
      "matricesOffset": 6976,
      "count": 1
    },
    {
      "field": "dark-glass",
      "layer": "ground",
      "rect": [
        288,
        352,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 4541248,
      "vertices": 12,
      "matricesOffset": 6976,
      "count": 1
    },
    {
      "field": "Baked distant facades",
      "layer": "far",
      "style": "baked",
      "texture": "distance-facades.png",
      "lampMask": "distance-lights.png",
      "shading": "orientation",
      "mode": "mesh",
      "offset": 4541632,
      "vertices": 29226
    },
    {
      "field": "roof",
      "layer": "far",
      "rect": [
        0,
        896,
        704,
        128
      ],
      "mode": "mesh",
      "offset": 5476864,
      "vertices": 16296
    },
    {
      "field": "cement",
      "layer": "far",
      "rect": [
        768,
        192,
        256,
        64
      ],
      "mode": "mesh",
      "offset": 5998336,
      "vertices": 576
    },
    {
      "field": "cap",
      "layer": "far",
      "rect": [
        768,
        128,
        256,
        64
      ],
      "mode": "mesh",
      "offset": 6016768,
      "vertices": 1071
    },
    {
      "field": "paving",
      "layer": "ground",
      "rect": [
        480,
        176,
        32,
        32
      ],
      "mode": "mesh",
      "offset": 6051040,
      "vertices": 288
    },
    {
      "field": "road",
      "layer": "ground",
      "rect": [
        128,
        384,
        128,
        128
      ],
      "mode": "mesh",
      "offset": 6060256,
      "vertices": 108
    },
    {
      "field": "blue-glass",
      "layer": "ground",
      "rect": [
        288,
        320,
        32,
        32
      ],
      "mode": "mesh",
      "offset": 6063712,
      "vertices": 1014
    },
    {
      "field": "foliage",
      "layer": "ground",
      "rect": [
        320,
        384,
        64,
        64
      ],
      "mode": "mesh",
      "offset": 6096160,
      "vertices": 10350
    }
  ],
  "triangles": 435019,
  "objects": 35015,
  "bytes": 6427360,
  "sixthFloor": {
    "floor": 0,
    "eave": 5.6,
    "ridge": 13.2,
    "base": -28.15
  },
  "row": {
    "homes": 6,
    "northTerraces": 6,
    "southTerraces": 6,
    "pairs": 3,
    "interPairSetback": 12,
    "centres": [
      0,
      -20,
      52,
      32,
      -52,
      -72
    ],
    "mirrors": [
      1,
      -1,
      1,
      -1,
      1,
      -1
    ]
  },
  "sha256": "c22f2320a79f9b9beae3dba4bf6ba438ab53818d3f288e8332ea701d4693cefc",
  "textureSha256": "d0edaf9d5e1fec4c2828d7eb2a2d6f0d37e27e5a104ed46ffc2f15190ce80ab7",
  "texelMetresPerUnit": [
    0.2707537401739019,
    0.5357142857142857,
    0.4638375014617893
  ],
  "texelsPerMetre": 16,
  "layers": {
    "triangles": {
      "near": 346320,
      "far": 15723,
      "ground": 72976
    },
    "nearBlocks": 7,
    "cityVolumes": 935,
    "neighbours": "fixed household details",
    "far": "native silhouettes with Blender-baked facade and window-mask atlases"
  },
  "neighbourhood": {
    "north": "finite enclosed-balcony apartments",
    "south": "matching paired-terrace apartments",
    "skylineDirections": 360,
    "nativeStreetLife": true,
    "homeShops": 0,
    "parkedCars": 85,
    "streetTrees": 161,
    "layoutSource": "private native reference; local geometry only"
  },
  "authoring": {
    "geometry": "Blender",
    "pixelbook": "Pixelorama",
    "facades": "Blender orthographic albedo bake",
    "privacy": "anonymous local coordinates; no address or source map metadata"
  }
});

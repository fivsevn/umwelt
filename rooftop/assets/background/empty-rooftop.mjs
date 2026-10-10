export const BACKGROUND = Object.freeze({
  "format": "blender-environment-v2",
  "stride": 8,
  "cube": {
    "offset": 0,
    "vertices": 36
  },
  "source": "native/game-environment.blend",
  "texture": "terrace-book.png",
  "binary": "empty-rooftop.bin",
  "textures": [
    {
      "file": "terrace-book.png",
      "sha256": "3b27ce9106ea82f2532260b0e6f9640d50c3c201948cc47eb2fb811ddb76df26",
      "bytes": 38321,
      "width": 512,
      "height": 512
    },
    {
      "file": "distance-facades.png",
      "sha256": "f9c8ec3c4c8d32b58431bc1f6a2bcd437ec52a078523dac1e2e85e176e60d2bd",
      "bytes": 2162915,
      "width": 2048,
      "height": 2048
    },
    {
      "file": "distance-lights.png",
      "sha256": "551611d005a3f40c9fa09e15979cfead5d4848f27967153d8094b091c65c2b60",
      "bytes": 918477,
      "width": 2048,
      "height": 2048
    }
  ],
  "parts": [
    {
      "field": "tower-trim",
      "layer": "near",
      "rect": [
        256,
        448,
        64,
        64
      ],
      "mode": "instances",
      "offset": 7040,
      "directCount": 16,
      "count": 16,
      "assemblies": []
    },
    {
      "field": "cement",
      "layer": "near",
      "rect": [
        288,
        288,
        32,
        32
      ],
      "mode": "instances",
      "offset": 8064,
      "directCount": 16,
      "count": 3992,
      "assemblies": [
        {
          "sourceOffset": 9088,
          "sourceCount": 683,
          "worldOffset": 1152,
          "worldCount": 3
        },
        {
          "sourceOffset": 52800,
          "sourceCount": 339,
          "worldOffset": 1344,
          "worldCount": 3
        },
        {
          "sourceOffset": 74496,
          "sourceCount": 910,
          "worldOffset": 1536,
          "worldCount": 1
        }
      ]
    },
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
      "offset": 132736,
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
      "offset": 132800,
      "directCount": 1363,
      "count": 1363,
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
      "offset": 220032,
      "directCount": 1266,
      "count": 1266,
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
      "offset": 301056,
      "directCount": 113,
      "count": 113,
      "assemblies": []
    },
    {
      "field": "rust-iron",
      "layer": "ground",
      "rect": [
        256,
        352,
        32,
        32
      ],
      "mode": "instances",
      "offset": 308288,
      "directCount": 161,
      "count": 161,
      "assemblies": []
    },
    {
      "field": "rust-iron",
      "layer": "near",
      "rect": [
        256,
        352,
        32,
        32
      ],
      "mode": "instances",
      "offset": 318592,
      "directCount": 16,
      "count": 6028,
      "assemblies": [
        {
          "sourceOffset": 319616,
          "sourceCount": 898,
          "worldOffset": 1152,
          "worldCount": 3
        },
        {
          "sourceOffset": 377088,
          "sourceCount": 706,
          "worldOffset": 1344,
          "worldCount": 3
        },
        {
          "sourceOffset": 422272,
          "sourceCount": 1200,
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
      "offset": 499072,
      "directCount": 3,
      "count": 507,
      "assemblies": [
        {
          "sourceOffset": 499264,
          "sourceCount": 76,
          "worldOffset": 1152,
          "worldCount": 3
        },
        {
          "sourceOffset": 504128,
          "sourceCount": 60,
          "worldOffset": 1344,
          "worldCount": 3
        },
        {
          "sourceOffset": 507968,
          "sourceCount": 96,
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
        384,
        128,
        128
      ],
      "mode": "instances",
      "offset": 514112,
      "directCount": 3,
      "count": 210,
      "assemblies": [
        {
          "sourceOffset": 514304,
          "sourceCount": 69,
          "worldOffset": 1344,
          "worldCount": 3
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
      "offset": 518720,
      "directCount": 6,
      "count": 990,
      "assemblies": [
        {
          "sourceOffset": 519104,
          "sourceCount": 144,
          "worldOffset": 1152,
          "worldCount": 3
        },
        {
          "sourceOffset": 528320,
          "sourceCount": 120,
          "worldOffset": 1344,
          "worldCount": 3
        },
        {
          "sourceOffset": 536000,
          "sourceCount": 192,
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
      "offset": 548288,
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
      "offset": 549312,
      "directCount": 16,
      "count": 16,
      "assemblies": []
    },
    {
      "field": "metal",
      "layer": "near",
      "rect": [
        256,
        256,
        32,
        32
      ],
      "mode": "instances",
      "offset": 550336,
      "directCount": 2,
      "count": 2810,
      "assemblies": [
        {
          "sourceOffset": 550464,
          "sourceCount": 374,
          "worldOffset": 1152,
          "worldCount": 3
        },
        {
          "sourceOffset": 574400,
          "sourceCount": 394,
          "worldOffset": 1344,
          "worldCount": 3
        },
        {
          "sourceOffset": 599616,
          "sourceCount": 504,
          "worldOffset": 1536,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "cap",
      "layer": "near",
      "rect": [
        256,
        288,
        32,
        32
      ],
      "mode": "instances",
      "offset": 631872,
      "directCount": 0,
      "count": 9615,
      "assemblies": [
        {
          "sourceOffset": 631872,
          "sourceCount": 1253,
          "worldOffset": 1152,
          "worldCount": 3
        },
        {
          "sourceOffset": 712064,
          "sourceCount": 1404,
          "worldOffset": 1344,
          "worldCount": 3
        },
        {
          "sourceOffset": 801920,
          "sourceCount": 1644,
          "worldOffset": 1536,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "facade",
      "layer": "near",
      "rect": [
        320,
        256,
        96,
        128
      ],
      "mode": "instances",
      "offset": 907136,
      "directCount": 0,
      "count": 553,
      "assemblies": [
        {
          "sourceOffset": 907136,
          "sourceCount": 73,
          "worldOffset": 1152,
          "worldCount": 3
        },
        {
          "sourceOffset": 911808,
          "sourceCount": 79,
          "worldOffset": 1344,
          "worldCount": 3
        },
        {
          "sourceOffset": 916864,
          "sourceCount": 97,
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
      "offset": 923072,
      "directCount": 0,
      "count": 600,
      "assemblies": [
        {
          "sourceOffset": 923072,
          "sourceCount": 99,
          "worldOffset": 1152,
          "worldCount": 3
        },
        {
          "sourceOffset": 929408,
          "sourceCount": 57,
          "worldOffset": 1344,
          "worldCount": 3
        },
        {
          "sourceOffset": 933056,
          "sourceCount": 132,
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
      "offset": 941504,
      "directCount": 0,
      "count": 1299,
      "assemblies": [
        {
          "sourceOffset": 941504,
          "sourceCount": 156,
          "worldOffset": 1152,
          "worldCount": 3
        },
        {
          "sourceOffset": 951488,
          "sourceCount": 209,
          "worldOffset": 1344,
          "worldCount": 3
        },
        {
          "sourceOffset": 964864,
          "sourceCount": 204,
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
        256,
        128,
        128
      ],
      "mode": "instances",
      "offset": 977920,
      "directCount": 0,
      "count": 1087,
      "assemblies": [
        {
          "sourceOffset": 977920,
          "sourceCount": 148,
          "worldOffset": 1152,
          "worldCount": 3
        },
        {
          "sourceOffset": 987392,
          "sourceCount": 149,
          "worldOffset": 1344,
          "worldCount": 3
        },
        {
          "sourceOffset": 996928,
          "sourceCount": 196,
          "worldOffset": 1536,
          "worldCount": 1
        }
      ]
    },
    {
      "field": "roof",
      "layer": "near",
      "rect": [
        128,
        256,
        128,
        128
      ],
      "mode": "instances",
      "offset": 1009472,
      "directCount": 0,
      "count": 3,
      "assemblies": [
        {
          "sourceOffset": 1009472,
          "sourceCount": 1,
          "worldOffset": 1344,
          "worldCount": 3
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
      "offset": 1009536,
      "directCount": 0,
      "count": 12,
      "assemblies": [
        {
          "sourceOffset": 1009536,
          "sourceCount": 4,
          "worldOffset": 1344,
          "worldCount": 3
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
      "offset": 1009792,
      "directCount": 0,
      "count": 425,
      "assemblies": [
        {
          "sourceOffset": 1009792,
          "sourceCount": 5,
          "worldOffset": 1600,
          "worldCount": 29
        },
        {
          "sourceOffset": 1010112,
          "sourceCount": 5,
          "worldOffset": 3456,
          "worldCount": 28
        },
        {
          "sourceOffset": 1010432,
          "sourceCount": 5,
          "worldOffset": 5248,
          "worldCount": 28
        }
      ]
    },
    {
      "field": "metal",
      "layer": "ground",
      "rect": [
        256,
        256,
        32,
        32
      ],
      "mode": "instances",
      "offset": 1010752,
      "directCount": 0,
      "count": 510,
      "assemblies": [
        {
          "sourceOffset": 1010752,
          "sourceCount": 6,
          "worldOffset": 1600,
          "worldCount": 29
        },
        {
          "sourceOffset": 1011136,
          "sourceCount": 6,
          "worldOffset": 3456,
          "worldCount": 28
        },
        {
          "sourceOffset": 1011520,
          "sourceCount": 6,
          "worldOffset": 5248,
          "worldCount": 28
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
      "offset": 1011904,
      "directCount": 0,
      "count": 340,
      "assemblies": [
        {
          "sourceOffset": 1011904,
          "sourceCount": 4,
          "worldOffset": 1600,
          "worldCount": 29
        },
        {
          "sourceOffset": 1012160,
          "sourceCount": 4,
          "worldOffset": 3456,
          "worldCount": 28
        },
        {
          "sourceOffset": 1012416,
          "sourceCount": 4,
          "worldOffset": 5248,
          "worldCount": 28
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
      "offset": 1012672,
      "directCount": 0,
      "count": 170,
      "assemblies": [
        {
          "sourceOffset": 1012672,
          "sourceCount": 2,
          "worldOffset": 1600,
          "worldCount": 29
        },
        {
          "sourceOffset": 1012800,
          "sourceCount": 2,
          "worldOffset": 3456,
          "worldCount": 28
        },
        {
          "sourceOffset": 1012928,
          "sourceCount": 2,
          "worldOffset": 5248,
          "worldCount": 28
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
      "offset": 1013056,
      "directCount": 0,
      "count": 170,
      "assemblies": [
        {
          "sourceOffset": 1013056,
          "sourceCount": 2,
          "worldOffset": 1600,
          "worldCount": 29
        },
        {
          "sourceOffset": 1013184,
          "sourceCount": 2,
          "worldOffset": 3456,
          "worldCount": 28
        },
        {
          "sourceOffset": 1013312,
          "sourceCount": 2,
          "worldOffset": 5248,
          "worldCount": 28
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
      "offset": 1013440,
      "vertices": 1908,
      "matricesOffset": 1152,
      "count": 3
    },
    {
      "field": "roof",
      "layer": "near",
      "rect": [
        128,
        256,
        128,
        128
      ],
      "mode": "meshInstances",
      "offset": 1074496,
      "vertices": 18,
      "matricesOffset": 1152,
      "count": 3
    },
    {
      "field": "roof",
      "layer": "near",
      "rect": [
        128,
        256,
        128,
        128
      ],
      "mode": "meshInstances",
      "offset": 1075072,
      "vertices": 12,
      "matricesOffset": 1344,
      "count": 3
    },
    {
      "field": "plaster",
      "layer": "near",
      "rect": [
        0,
        256,
        128,
        128
      ],
      "mode": "meshInstances",
      "offset": 1075456,
      "vertices": 6,
      "matricesOffset": 1344,
      "count": 3
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
      "offset": 1075648,
      "vertices": 540,
      "matricesOffset": 1344,
      "count": 3
    },
    {
      "field": "north-floor",
      "layer": "near",
      "rect": [
        0,
        0,
        256,
        256
      ],
      "mode": "meshInstances",
      "offset": 1092928,
      "vertices": 144,
      "matricesOffset": 1344,
      "count": 3
    },
    {
      "field": "cement",
      "layer": "near",
      "rect": [
        288,
        288,
        32,
        32
      ],
      "mode": "meshInstances",
      "offset": 1097536,
      "vertices": 180,
      "matricesOffset": 1344,
      "count": 3
    },
    {
      "field": "south-floor",
      "layer": "near",
      "rect": [
        256,
        0,
        192,
        128
      ],
      "mode": "meshInstances",
      "offset": 1103296,
      "vertices": 36,
      "matricesOffset": 1344,
      "count": 3
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
      "offset": 1104448,
      "vertices": 2592,
      "matricesOffset": 1536,
      "count": 1
    },
    {
      "field": "roof",
      "layer": "near",
      "rect": [
        128,
        256,
        128,
        128
      ],
      "mode": "meshInstances",
      "offset": 1187392,
      "vertices": 18,
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
      "offset": 1187968,
      "vertices": 432,
      "matricesOffset": 1600,
      "count": 29
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
      "offset": 1201792,
      "vertices": 72,
      "matricesOffset": 1600,
      "count": 29
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
      "offset": 1204096,
      "vertices": 12,
      "matricesOffset": 1600,
      "count": 29
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
      "offset": 1204480,
      "vertices": 12,
      "matricesOffset": 1600,
      "count": 29
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
      "offset": 1204864,
      "vertices": 12,
      "matricesOffset": 3456,
      "count": 28
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
      "offset": 1205248,
      "vertices": 432,
      "matricesOffset": 3456,
      "count": 28
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
      "offset": 1219072,
      "vertices": 12,
      "matricesOffset": 3456,
      "count": 28
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
      "offset": 1219456,
      "vertices": 72,
      "matricesOffset": 3456,
      "count": 28
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
      "offset": 1221760,
      "vertices": 432,
      "matricesOffset": 5248,
      "count": 28
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
      "offset": 1235584,
      "vertices": 12,
      "matricesOffset": 5248,
      "count": 28
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
      "offset": 1235968,
      "vertices": 72,
      "matricesOffset": 5248,
      "count": 28
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
      "offset": 1238272,
      "vertices": 12,
      "matricesOffset": 5248,
      "count": 28
    },
    {
      "field": "Baked distant facades",
      "layer": "far",
      "style": "baked",
      "texture": "distance-facades.png",
      "lampMask": "distance-lights.png",
      "shading": "orientation",
      "mode": "mesh",
      "offset": 1238656,
      "vertices": 29712
    },
    {
      "field": "roof",
      "layer": "far",
      "rect": [
        128,
        256,
        128,
        128
      ],
      "mode": "mesh",
      "offset": 2189440,
      "vertices": 8127
    },
    {
      "field": "cap",
      "layer": "far",
      "rect": [
        256,
        288,
        32,
        32
      ],
      "mode": "mesh",
      "offset": 2449504,
      "vertices": 1119
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
      "offset": 2485312,
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
      "offset": 2517760,
      "vertices": 10350
    }
  ],
  "triangles": 422724,
  "objects": 35536,
  "bytes": 2848960,
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
  "sha256": "16ef7d6a70fc01fac1c7f5dee99cde10d369f0c65ed8a856ac2cd1c899549081",
  "textureSha256": "3b27ce9106ea82f2532260b0e6f9640d50c3c201948cc47eb2fb811ddb76df26",
  "texelMetresPerUnit": [
    0.2707537401739019,
    0.5357142857142857,
    0.4638375014617893
  ],
  "layers": {
    "triangles": {
      "near": 336762,
      "far": 12986,
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

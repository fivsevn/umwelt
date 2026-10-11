// Measured from docs/art/rooftop-room-02; the native Blender geometry owns the visible shell.
export const ROOM_BACKGROUND = {
  "runtimeUnitsPerMetre": 1.8666666666666665,
  "door": {
    "frameOriginRuntime": [
      -4.9,
      0.02,
      4
    ],
    "projectionCenterRuntime": [
      -4.9,
      0.02,
      4
    ],
    "frameRotationY": -1.5707963267948966,
    "hingeLocalRuntime": [
      -0.7466666666666666,
      0,
      0
    ],
    "hingeWorldRuntime": [
      -4.9,
      0.02,
      3.2533333333333334
    ],
    "heightRuntime": 3.92,
    "leafWidthRuntime": 1.4933333333333332,
    "leafThicknessRuntime": 0.07466666666666666,
    "heightMetres": 2.1,
    "widthMetres": 0.8,
    "thicknessMetres": 0.04,
    "leafRole": "room-door-leaf",
    "frameRole": "room-door-frame",
    "legacyAnimation": "doors.room.hinge.rotation.y = -doorProgress * .58",
    "retainProjectedFrame": true,
    "originalNarrowHingeWorldRuntime": [
      -4.9,
      0.02,
      3.49
    ],
    "hingeAdaptation": "Door centre retained; pivot moves by half the added real-width door as agreed with runtime loader"
  },
  "floorRuntime": {
    "width": 10,
    "depth": 14,
    "top": 0.0105,
    "scenePolygonPixels": [
      [
        220,
        104
      ],
      [
        380,
        104
      ],
      [
        380,
        328
      ],
      [
        220,
        328
      ]
    ]
  },
  "wallHeightRuntime": 5.04,
  "windowRuntime": {
    "openingX": [
      -1.8,
      1.8
    ],
    "openingY": [
      1.5866666666666664,
      4.293333333333333
    ],
    "openingHeightMetres": 1.45,
    "sillHeightMetres": 0.85,
    "wallZ": -7,
    "glassBoundsX": [
      -1.7,
      1.7
    ],
    "glassBoundsY": [
      1.6266666666666665,
      4.253333333333333
    ],
    "glassCenterZ": -6.92
  }
};

import { ITEM_CATALOG_REVISION } from "./item-catalog.mjs";

// Authored starting arrangement from horticultural-era-rooftop-layout-3.json.
// initialLayout() clones this data so edits never change the shared default.
export const INITIAL_LAYOUT = {
  "version": 2,
  "roomVersion": 2,
  "spaceVersion": 2,
  "catalogRevision": ITEM_CATALOG_REVISION,
  "scenes": {
    "room": [
      {
        "type": "bed-modern",
        "rotation": 0,
        "scale": 1.4,
        "id": "3c4f02f5-6075-4d5f-89dd-c253b4c1ea2d",
        "support": null,
        "x": 244,
        "y": 200
      },
      {
        "type": "sofa-two",
        "rotation": 90,
        "scale": 1.5,
        "id": "ce9fa266-8872-4cbe-bb29-9f3a4f6c56b7",
        "support": null,
        "x": 360,
        "y": 208
      },
      {
        "type": "wardrobe-wood",
        "rotation": 180,
        "scale": 1.5,
        "id": "327ca495-3392-405c-908e-17bd96ddb15f",
        "support": null,
        "x": 356,
        "y": 316
      },
      {
        "type": "wardrobe-wood",
        "rotation": 90,
        "scale": 1.5,
        "id": "d2de38bf-ed19-4cbb-a1c5-8c682adefb22",
        "support": null,
        "x": 368,
        "y": 132
      },
      {
        "type": "dresser-wood",
        "rotation": 270,
        "scale": 1.4,
        "id": "82b91f65-e60f-4257-902a-cbb005ec2a67",
        "support": null,
        "x": 232,
        "y": 124
      },
      {
        "type": "iron-3-black",
        "rotation": 0,
        "scale": 2,
        "id": "79b69e82-f817-49f7-abd1-f389f60f1812",
        "support": null,
        "x": 308,
        "y": 124
      },
      {
        "type": "aquarium-rectangle",
        "rotation": 0,
        "scale": 1.9,
        "id": "3ffb53c5-61a8-417c-a377-09f7177c5ac2",
        "support": {
          "id": "79b69e82-f817-49f7-abd1-f389f60f1812",
          "surface": "shelf-2"
        },
        "x": 316,
        "y": 124
      },
      {
        "type": "antique-kenzan-chestnut",
        "rotation": 0,
        "scale": 1.3,
        "id": "3a81731c-159a-4f34-985b-7e78ca610e79",
        "support": {
          "id": "82b91f65-e60f-4257-902a-cbb005ec2a67",
          "surface": "top"
        },
        "x": 232,
        "y": 128
      },
      {
        "type": "antique-kakiemon-hex",
        "rotation": 0,
        "scale": 0.8,
        "id": "66f2a34f-50fb-4b92-98fa-ae0ceff06c9f",
        "support": {
          "id": "79b69e82-f817-49f7-abd1-f389f60f1812",
          "surface": "shelf-1"
        },
        "x": 288.6008962965184,
        "y": 131.19020754610642
      },
      {
        "type": "antique-tokoname-sutra",
        "rotation": 0,
        "scale": 1.3,
        "id": "177bd336-a8f0-49e8-b766-8638bea2a74d",
        "support": null,
        "x": 372,
        "y": 252
      },
      {
        "type": "antique-hagi-bowl",
        "rotation": 0,
        "scale": 0.8,
        "id": "7ceb26d4-2cf7-4dff-ad94-b632c1296513",
        "support": {
          "id": "79b69e82-f817-49f7-abd1-f389f60f1812",
          "surface": "shelf-1"
        },
        "x": 308,
        "y": 120
      },
      {
        "type": "antique-bizen-gourd",
        "rotation": 0,
        "scale": 0.7,
        "id": "0cb382a2-49f0-44db-bc81-ebc00f8fe0ca",
        "support": {
          "id": "79b69e82-f817-49f7-abd1-f389f60f1812",
          "surface": "shelf-2"
        },
        "x": 291.5273708178507,
        "y": 131.885805347266
      },
      {
        "type": "vessel-echizen",
        "rotation": 0,
        "scale": 0.9,
        "id": "40907ca5-9dd7-4f94-8daf-7534cae17e3d",
        "support": {
          "id": "79b69e82-f817-49f7-abd1-f389f60f1812",
          "surface": "shelf-1"
        },
        "x": 320,
        "y": 128
      },
      {
        "type": "vessel-iga",
        "rotation": 0,
        "scale": 1,
        "id": "dac6005a-b409-4f75-b44c-42bc49222433",
        "support": {
          "id": "79b69e82-f817-49f7-abd1-f389f60f1812",
          "surface": "shelf-3"
        },
        "x": 289.43344605025095,
        "y": 130.25335773657616
      },
      {
        "type": "new-truncata-haw",
        "rotation": 0,
        "scale": 1,
        "id": "d750d573-3f7b-4b88-9d07-6dac641a5953",
        "support": {
          "id": "79b69e82-f817-49f7-abd1-f389f60f1812",
          "surface": "shelf-3"
        },
        "seed": 3957960410,
        "x": 304,
        "y": 124,
        "pot": "mashiko"
      },
      {
        "type": "vine",
        "rotation": 0,
        "scale": 1,
        "id": "fbc6f186-0be7-4b1e-a752-245d30525650",
        "support": {
          "id": "79b69e82-f817-49f7-abd1-f389f60f1812",
          "surface": "shelf-3"
        },
        "seed": 2419510805,
        "x": 316,
        "y": 132
      },
      {
        "type": "vessel-deep",
        "rotation": 0,
        "scale": 1,
        "id": "40e9f573-1858-415d-9a65-c234fa50553a",
        "support": null,
        "x": 316,
        "y": 320
      },
      {
        "type": "weapon-glock-26",
        "rotation": 0,
        "scale": 1.3,
        "id": "5669530e-8c30-4644-b28f-cb3427fda13b",
        "support": {
          "id": "3c4f02f5-6075-4d5f-89dd-c253b4c1ea2d",
          "surface": "mattress"
        },
        "x": 252,
        "y": 192
      },
      {
        "type": "weapon-lewis",
        "rotation": 270,
        "scale": 1,
        "id": "6c3a74d2-a0b4-43ac-b48c-f106f14aa28e",
        "support": null,
        "x": 256,
        "y": 232
      },
      {
        "type": "sofa-one",
        "rotation": 0,
        "scale": 1,
        "id": "492674f8-bde6-4c58-8513-bb26b218cb6f",
        "support": null,
        "x": 264,
        "y": 124
      },
      {
        "type": "weapon-bronze-sword",
        "rotation": 0,
        "scale": 1,
        "id": "4e244982-09eb-4c51-a821-aa9de11bb8f2",
        "support": {
          "id": "327ca495-3392-405c-908e-17bd96ddb15f",
          "surface": "top"
        },
        "x": 362.156686134696,
        "y": 316.7626075825957
      }
    ],
    "north": [
      {
        "type": "iron-3-black",
        "rotation": 0,
        "scale": 1.8,
        "id": "9ad9f658-1548-4793-9665-032af4bf6cc9",
        "support": null,
        "x": 304,
        "y": 96
      },
      {
        "type": "iron-4-black",
        "rotation": 0,
        "scale": 2,
        "id": "bfcef447-cfd0-44eb-8cb1-525bc63700d8",
        "support": null,
        "x": 364,
        "y": 96
      },
      {
        "type": "oxalis",
        "rotation": 0,
        "scale": 1.2,
        "id": "cdd5dbed-4a7b-4f70-aaf6-7f5b679cf851",
        "support": {
          "id": "bfcef447-cfd0-44eb-8cb1-525bc63700d8",
          "surface": "shelf-1"
        },
        "seed": 3072951630,
        "x": 348,
        "y": 100,
        "pot": "shigaraki"
      },
      {
        "type": "broadleaf",
        "rotation": 0,
        "scale": 1.2,
        "id": "e82235b7-1197-4d80-953e-4861fc284b6c",
        "support": null,
        "seed": 234582378,
        "x": 356,
        "y": 116,
        "pot": "growbag"
      },
      {
        "type": "barrel",
        "rotation": 0,
        "scale": 2,
        "id": "5c8c94eb-c6e2-41eb-b373-b5105df8a680",
        "support": null,
        "seed": 2140346191,
        "x": 388,
        "y": 148,
        "pot": "terra"
      },
      {
        "type": "yucca",
        "rotation": 0,
        "scale": 1,
        "id": "51051c83-63b2-4024-a199-1e0755a266b5",
        "support": {
          "id": "bfcef447-cfd0-44eb-8cb1-525bc63700d8",
          "surface": "shelf-1"
        },
        "seed": 237577633,
        "x": 380,
        "y": 100,
        "pot": "deep"
      },
      {
        "type": "snake",
        "rotation": 0,
        "scale": 1,
        "id": "abdcfe65-15dc-4a64-b58e-cf29134b7296",
        "support": {
          "id": "bfcef447-cfd0-44eb-8cb1-525bc63700d8",
          "surface": "shelf-2"
        },
        "seed": 2618241953,
        "x": 352,
        "y": 100,
        "pot": "bizen"
      },
      {
        "type": "spider",
        "rotation": 0,
        "scale": 1.2,
        "id": "5239b5ac-00a5-47a3-986d-d282e0e87179",
        "support": {
          "id": "bfcef447-cfd0-44eb-8cb1-525bc63700d8",
          "surface": "shelf-3"
        },
        "seed": 4107455749,
        "x": 348,
        "y": 104
      },
      {
        "type": "coleus",
        "rotation": 0,
        "scale": 1.3,
        "id": "dcf85f56-2f6a-4e5e-b4ad-7c1c758c7922",
        "support": {
          "id": "bfcef447-cfd0-44eb-8cb1-525bc63700d8",
          "surface": "shelf-2"
        },
        "seed": 2893162466,
        "x": 364,
        "y": 100,
        "pot": "kasama"
      },
      {
        "type": "hosta",
        "rotation": 0,
        "scale": 1,
        "id": "74846e0d-bcc1-415c-9534-47332858e82a",
        "support": {
          "id": "bfcef447-cfd0-44eb-8cb1-525bc63700d8",
          "surface": "shelf-3"
        },
        "seed": 1494761762,
        "x": 368,
        "y": 104,
        "pot": "iga"
      },
      {
        "type": "bunny",
        "rotation": 0,
        "scale": 1,
        "id": "b6bf3d38-4f00-4524-9e25-cb660db1c8e1",
        "support": {
          "id": "9ad9f658-1548-4793-9665-032af4bf6cc9",
          "surface": "shelf-2"
        },
        "seed": 523834414,
        "x": 292,
        "y": 96,
        "pot": "mino"
      },
      {
        "type": "cluster",
        "rotation": 0,
        "scale": 1.2,
        "id": "318e8830-f30c-4e12-86e5-0e369203a5af",
        "support": {
          "id": "9ad9f658-1548-4793-9665-032af4bf6cc9",
          "surface": "shelf-1"
        },
        "seed": 3858527370,
        "x": 297.99799048058577,
        "y": 102.39469761963358,
        "pot": "tobe"
      },
      {
        "type": "step-rack",
        "rotation": 0,
        "scale": 1.6,
        "id": "31f56094-6d7b-4dbe-8811-22f5a194f512",
        "support": null,
        "x": 320,
        "y": 132
      },
      {
        "type": "aloe",
        "rotation": 0,
        "scale": 0.8,
        "id": "f39665e3-606f-4b75-b01d-df90bbddfc17",
        "support": {
          "id": "31f56094-6d7b-4dbe-8811-22f5a194f512",
          "surface": "step-1"
        },
        "seed": 2051954461,
        "x": 330.56576953480874,
        "y": 149.36953120449834,
        "pot": "antique-nabeshima"
      },
      {
        "type": "steel-sink",
        "rotation": 270,
        "scale": 1.4,
        "id": "2bbebb15-4611-4baf-9878-8319023cd2ec",
        "support": null,
        "x": 276,
        "y": 172
      },
      {
        "type": "wood-2",
        "rotation": 0,
        "scale": 2,
        "id": "beb64344-2e45-4613-8b44-d3711a2c3b21",
        "support": null,
        "x": 228,
        "y": 160
      },
      {
        "type": "foam-soil",
        "rotation": 0,
        "scale": 1.9,
        "id": "f26501dd-a66d-48d9-940f-c8e02f638177",
        "support": null,
        "x": 240,
        "y": 184
      },
      {
        "type": "foam-seedlings",
        "rotation": 0,
        "scale": 1.7,
        "id": "7a752a98-210c-4e51-9c61-8c5658563910",
        "support": {
          "id": "beb64344-2e45-4613-8b44-d3711a2c3b21",
          "surface": "shelf-2"
        },
        "x": 232,
        "y": 160
      },
      {
        "type": "seed-tray",
        "rotation": 0,
        "scale": 1.7,
        "id": "29cb0546-f8c7-4736-9a01-7606ed64b971",
        "support": {
          "id": "beb64344-2e45-4613-8b44-d3711a2c3b21",
          "surface": "shelf-1"
        },
        "x": 224,
        "y": 162
      },
      {
        "type": "iron-3-silver",
        "rotation": 270,
        "scale": 1.5,
        "id": "b252b260-2530-4975-9f6b-be54d6ae38e3",
        "support": null,
        "x": 156,
        "y": 172
      },
      {
        "type": "wood-3",
        "rotation": 270,
        "scale": 1.5,
        "id": "5589e9cf-bfb9-4840-8937-9c167d8e1632",
        "support": null,
        "x": 156,
        "y": 216
      },
      {
        "type": "column",
        "rotation": 0,
        "scale": 1,
        "id": "ae48429f-fa20-4978-bbfd-10196421cc8f",
        "support": null,
        "seed": 1754946677,
        "x": 168,
        "y": 244
      },
      {
        "type": "trailing",
        "rotation": 0,
        "scale": 1,
        "id": "975107a7-eeb8-4c08-9be1-336bd117849e",
        "support": {
          "id": "5589e9cf-bfb9-4840-8937-9c167d8e1632",
          "surface": "shelf-3"
        },
        "seed": 4248147723,
        "x": 160,
        "y": 224,
        "pot": "white"
      },
      {
        "type": "new-myriostigma",
        "rotation": 0,
        "scale": 1,
        "id": "0966e4ec-49c1-44c5-be3d-8baf6143441c",
        "support": {
          "id": "5589e9cf-bfb9-4840-8937-9c167d8e1632",
          "surface": "shelf-2"
        },
        "seed": 1078457741,
        "x": 156,
        "y": 208,
        "pot": "bizen"
      },
      {
        "type": "new-asterias",
        "rotation": 0,
        "scale": 1,
        "id": "fad27bb9-29e6-416b-815d-3f8b6457fed0",
        "support": {
          "id": "b252b260-2530-4975-9f6b-be54d6ae38e3",
          "surface": "shelf-2"
        },
        "seed": 1446388269,
        "x": 156.68045445565429,
        "y": 182.84428365442443,
        "pot": "antique-shino"
      },
      {
        "type": "new-ornatum",
        "rotation": 0,
        "scale": 1,
        "id": "26add0f4-6fd8-4879-b440-14e65f512976",
        "support": {
          "id": "5589e9cf-bfb9-4840-8937-9c167d8e1632",
          "surface": "shelf-2"
        },
        "seed": 2782785231,
        "x": 160,
        "y": 220,
        "pot": "mashiko"
      },
      {
        "type": "new-spinosissima",
        "rotation": 0,
        "scale": 1,
        "id": "d8a5dcad-72f4-4a66-aa44-d34eafbdac89",
        "support": {
          "id": "b252b260-2530-4975-9f6b-be54d6ae38e3",
          "surface": "shelf-3"
        },
        "seed": 3284431915,
        "x": 162.46450833926588,
        "y": 184.30740127998274,
        "pot": "plastic"
      },
      {
        "type": "new-baldianum",
        "rotation": 0,
        "scale": 1,
        "id": "3f8c9920-449a-4e0b-82a4-5d5fefe95675",
        "support": {
          "id": "b252b260-2530-4975-9f6b-be54d6ae38e3",
          "surface": "shelf-3"
        },
        "seed": 813692687,
        "x": 160,
        "y": 172,
        "pot": "shigaraki"
      },
      {
        "type": "new-chamaecereus",
        "rotation": 0,
        "scale": 1,
        "id": "e1c4af60-c623-4023-9741-a3cf9acb8271",
        "support": null,
        "seed": 2384521189,
        "x": 172,
        "y": 168,
        "pot": "antique-shino-square"
      },
      {
        "type": "new-baccifera",
        "rotation": 0,
        "scale": 0.5,
        "id": "1d060c37-6e02-491f-bdbe-5c01d72efa6a",
        "support": {
          "id": "b252b260-2530-4975-9f6b-be54d6ae38e3",
          "surface": "shelf-2"
        },
        "seed": 1829112670,
        "x": 160,
        "y": 168,
        "pot": "antique-nabeshima"
      },
      {
        "type": "new-elegans",
        "rotation": 0,
        "scale": 1,
        "id": "37900cf3-d894-43d8-aa0b-2dc5714abb32",
        "support": {
          "id": "5589e9cf-bfb9-4840-8937-9c167d8e1632",
          "surface": "shelf-1"
        },
        "seed": 359825482,
        "x": 160,
        "y": 208,
        "pot": "shigaraki"
      },
      {
        "type": "iron-3-black",
        "rotation": 180,
        "scale": 2,
        "id": "49a026f9-b425-47d4-bd48-4a369e9dfc74",
        "support": null,
        "x": 244,
        "y": 316
      },
      {
        "type": "crate-blue",
        "rotation": 0,
        "scale": 2,
        "id": "38889600-4bfd-48f8-998c-34978cdfeb32",
        "support": {
          "id": "49a026f9-b425-47d4-bd48-4a369e9dfc74",
          "surface": "shelf-1"
        },
        "x": 256,
        "y": 316
      },
      {
        "type": "aquarium-rectangle",
        "rotation": 0,
        "scale": 1.7,
        "id": "06ee4483-6f35-424b-9ca2-5ccf61ec6834",
        "support": {
          "id": "49a026f9-b425-47d4-bd48-4a369e9dfc74",
          "surface": "shelf-2"
        },
        "x": 253.81982260143872,
        "y": 314.2093923131257
      },
      {
        "type": "vessel-shallow",
        "rotation": 0,
        "scale": 1,
        "id": "0bb566a3-4014-4437-bf7a-9457fa8c2f00",
        "support": {
          "id": "49a026f9-b425-47d4-bd48-4a369e9dfc74",
          "surface": "shelf-3"
        },
        "x": 228,
        "y": 312
      },
      {
        "type": "vessel-growbag",
        "rotation": 0,
        "scale": 1,
        "id": "e2b3b065-059a-44b5-86f8-ff1fd0887d48",
        "support": {
          "id": "49a026f9-b425-47d4-bd48-4a369e9dfc74",
          "surface": "shelf-1"
        },
        "x": 232,
        "y": 312
      },
      {
        "type": "vessel-trough",
        "rotation": 90,
        "scale": 0.9,
        "id": "6ce76556-eb3d-460b-a031-2a5d2cc80dc9",
        "support": null,
        "x": 164,
        "y": 316
      },
      {
        "type": "enamel-basin",
        "rotation": 180,
        "scale": 1.5,
        "id": "963ece12-a31a-46bf-9b1c-cf07f1c017a2",
        "support": null,
        "x": 316,
        "y": 320
      },
      {
        "type": "plastic-basket-rack",
        "rotation": 90,
        "scale": 1.5,
        "id": "76aa4062-770b-485a-a2dd-02d77dacf685",
        "support": null,
        "x": 284,
        "y": 324
      },
      {
        "type": "iron-3-black",
        "rotation": 180,
        "scale": 2,
        "id": "296d9f1a-a33a-49f9-844a-48a2e16cfde0",
        "support": null,
        "x": 184,
        "y": 316
      },
      {
        "type": "iron-3-silver",
        "rotation": 0,
        "scale": 1.9,
        "id": "8840b792-fd24-4a1d-8cd8-ac42b35dd44d",
        "support": null,
        "x": 432,
        "y": 160
      },
      {
        "type": "bougainvillea",
        "rotation": 0,
        "scale": 0.9,
        "id": "d40d1751-eba4-45d1-a855-7ca933e2a863",
        "support": {
          "id": "8840b792-fd24-4a1d-8cd8-ac42b35dd44d",
          "surface": "shelf-1"
        },
        "seed": 444780659,
        "x": 416,
        "y": 164,
        "pot": "growbag"
      },
      {
        "type": "pelargonium",
        "rotation": 0,
        "scale": 1.2,
        "id": "931b7ba6-79d3-4dc2-9b91-d57ca80f42a5",
        "support": {
          "id": "9ad9f658-1548-4793-9665-032af4bf6cc9",
          "surface": "shelf-3"
        },
        "seed": 2314049475,
        "x": 322.27788705437547,
        "y": 102.34546118669778,
        "pot": "hasami"
      },
      {
        "type": "marigold",
        "rotation": 0,
        "scale": 1,
        "id": "867da9c0-dac7-450a-aea5-361b3573eb40",
        "support": {
          "id": "9ad9f658-1548-4793-9665-032af4bf6cc9",
          "surface": "shelf-2"
        },
        "seed": 2800801065,
        "x": 312,
        "y": 100,
        "pot": "imari"
      },
      {
        "type": "cosmos",
        "rotation": 0,
        "scale": 1,
        "id": "700bc2d7-2ecd-4079-9774-30f51a6e09ce",
        "support": {
          "id": "31f56094-6d7b-4dbe-8811-22f5a194f512",
          "surface": "step-2"
        },
        "seed": 182263613,
        "x": 324,
        "y": 136
      },
      {
        "type": "portulaca",
        "rotation": 0,
        "scale": 1,
        "id": "578864e9-b305-4a72-ae26-a7478fcd71cf",
        "support": {
          "id": "8840b792-fd24-4a1d-8cd8-ac42b35dd44d",
          "surface": "shelf-2"
        },
        "seed": 129983748,
        "x": 428,
        "y": 164,
        "pot": "ontayaki"
      },
      {
        "type": "strawberry",
        "rotation": 90,
        "scale": 0.8,
        "id": "996bc7eb-7c44-40ad-ac7f-6ef44488ebc2",
        "support": {
          "id": "9ad9f658-1548-4793-9665-032af4bf6cc9",
          "surface": "shelf-3"
        },
        "seed": 2608979295,
        "x": 292,
        "y": 96
      },
      {
        "type": "lettuce",
        "rotation": 90,
        "scale": 0.8,
        "id": "4af0a922-39cb-44d3-96a7-b4efaa6bd605",
        "support": {
          "id": "9ad9f658-1548-4793-9665-032af4bf6cc9",
          "surface": "shelf-3"
        },
        "seed": 1243262863,
        "x": 300,
        "y": 96
      },
      {
        "type": "blueberry",
        "rotation": 0,
        "scale": 0.6,
        "id": "ca180c3d-9516-4e15-bd0a-d4340f7add07",
        "support": {
          "id": "8840b792-fd24-4a1d-8cd8-ac42b35dd44d",
          "surface": "shelf-2"
        },
        "seed": 2388243627,
        "x": 444,
        "y": 168
      },
      {
        "type": "moss-glaucum",
        "rotation": 0,
        "scale": 1,
        "id": "cc00e160-5982-4625-9fbb-8a5a194fd12d",
        "support": {
          "id": "5589e9cf-bfb9-4840-8937-9c167d8e1632",
          "surface": "shelf-1"
        },
        "seed": 1730763517,
        "x": 160,
        "y": 220
      },
      {
        "type": "trowel",
        "rotation": 0,
        "scale": 1.3,
        "id": "b377ed22-2dfd-423c-aef2-12fbd868992e",
        "support": {
          "id": "31f56094-6d7b-4dbe-8811-22f5a194f512",
          "surface": "step-1"
        },
        "x": 320,
        "y": 148
      },
      {
        "type": "pruning-shears",
        "rotation": 90,
        "scale": 1.6,
        "id": "8ed2fc8e-c626-4fe0-987d-83fbc626e06b",
        "support": {
          "id": "31f56094-6d7b-4dbe-8811-22f5a194f512",
          "surface": "step-2"
        },
        "x": 308,
        "y": 132
      },
      {
        "type": "trigger-sprayer",
        "rotation": 0,
        "scale": 2,
        "id": "78998c43-fa8b-48ee-88f3-cfda34a2db4e",
        "support": null,
        "x": 280,
        "y": 200
      },
      {
        "type": "hose-coil",
        "rotation": 0,
        "scale": 1.5,
        "id": "1f02da4f-8dce-40d2-a481-5488d50b55cd",
        "support": null,
        "x": 280,
        "y": 180
      },
      {
        "type": "towel",
        "rotation": 0,
        "scale": 1,
        "id": "7a2953e1-7b9e-4f39-81fd-3f8bb578eaea",
        "support": {
          "id": "2bbebb15-4611-4baf-9878-8319023cd2ec",
          "surface": "drainboard"
        },
        "x": 276,
        "y": 188
      },
      {
        "type": "solar-lamp",
        "rotation": 0,
        "scale": 2,
        "id": "c568df61-f797-4164-811a-cbeb828e08d5",
        "support": null,
        "x": 196,
        "y": 180
      },
      {
        "type": "tin-lantern",
        "rotation": 0,
        "scale": 1,
        "id": "959748be-485b-43bd-a1c1-46d63a16f4fc",
        "support": {
          "id": "31f56094-6d7b-4dbe-8811-22f5a194f512",
          "surface": "step-3"
        },
        "x": 312,
        "y": 120
      },
      {
        "type": "string-lights",
        "rotation": 90,
        "scale": 1,
        "id": "7ec235ef-83a5-401f-b8b7-eb0ed43fcf3d",
        "support": null,
        "x": 458.16233879748177,
        "y": 265.8773770184001
      },
      {
        "type": "wood-square-table",
        "rotation": 0,
        "scale": 1.8,
        "id": "e52c300c-5cb5-42d4-8f68-ccbc428bf437",
        "support": null,
        "x": 376,
        "y": 312
      },
      {
        "type": "plastic-round-stool",
        "rotation": 0,
        "scale": 1.5,
        "id": "0186ac61-3182-421f-ada5-6984de95b2f2",
        "support": null,
        "x": 368,
        "y": 300
      },
      {
        "type": "galvanized-bucket",
        "rotation": 0,
        "scale": 1.6,
        "id": "0118d280-4872-4f6b-a027-b01012f80d8a",
        "support": {
          "id": "296d9f1a-a33a-49f9-844a-48a2e16cfde0",
          "surface": "shelf-1"
        },
        "x": 200,
        "y": 312
      },
      {
        "type": "plastic-bucket",
        "rotation": 90,
        "scale": 1.7,
        "id": "a29301e6-ae3b-432b-8a18-100af3a19929",
        "support": null,
        "x": 344,
        "y": 300
      },
      {
        "type": "vessel-terra",
        "rotation": 0,
        "scale": 0.9,
        "id": "becc2ce4-8b7c-400c-9030-26f11a97c75a",
        "support": {
          "id": "e52c300c-5cb5-42d4-8f68-ccbc428bf437",
          "surface": "table-top"
        },
        "x": 380,
        "y": 308
      },
      {
        "type": "vessel-plastic",
        "rotation": 0,
        "scale": 1.7,
        "id": "a17ef5fe-92b2-43fc-9a64-5330ac97fe61",
        "support": {
          "id": "e4ac2966-c699-4dc3-b8b7-8ce922244b7d",
          "surface": "inside-floor"
        },
        "x": 368,
        "y": 324
      },
      {
        "type": "vessel-deep",
        "rotation": 0,
        "scale": 1,
        "id": "755cb3e0-bff8-49d2-a70a-259d4a5470ad",
        "support": null,
        "x": 384,
        "y": 316
      },
      {
        "type": "crate-red",
        "rotation": 0,
        "scale": 2,
        "id": "e4ac2966-c699-4dc3-b8b7-8ce922244b7d",
        "support": {
          "id": "e52c300c-5cb5-42d4-8f68-ccbc428bf437",
          "surface": "table-top"
        },
        "x": 376,
        "y": 324
      },
      {
        "type": "iron-round-table",
        "rotation": 0,
        "scale": 1.4,
        "id": "d9c9e857-e683-470a-8e96-2695f12361b4",
        "support": null,
        "x": 276,
        "y": 288
      },
      {
        "type": "ceramic-fish-bowl",
        "rotation": 0,
        "scale": 1.4,
        "id": "de470cc7-6d01-46ea-bc9a-45f962510e65",
        "support": {
          "id": "d9c9e857-e683-470a-8e96-2695f12361b4",
          "surface": "table-top"
        },
        "x": 276,
        "y": 288
      },
      {
        "type": "clip-hanger",
        "rotation": 0,
        "scale": 1.5,
        "id": "60ed8514-63ad-4eb0-8cca-1dae7ca0bb20",
        "support": {
          "id": "296d9f1a-a33a-49f9-844a-48a2e16cfde0",
          "surface": "shelf-3"
        },
        "x": 204,
        "y": 312
      },
      {
        "type": "radio-small",
        "rotation": 180,
        "scale": 1.1,
        "id": "7fa7e2e0-ca72-4b53-a6f5-ae03f299f4c8",
        "support": {
          "id": "e52c300c-5cb5-42d4-8f68-ccbc428bf437",
          "surface": "table-top"
        },
        "x": 364,
        "y": 308
      },
      {
        "type": "tasklamp",
        "rotation": 180,
        "scale": 1.2,
        "id": "2c6c435c-092f-448c-b407-1e7590514fdb",
        "support": {
          "id": "e52c300c-5cb5-42d4-8f68-ccbc428bf437",
          "surface": "table-top"
        },
        "x": 392,
        "y": 296
      },
      {
        "type": "drying-rack",
        "rotation": 90,
        "scale": 1.6,
        "id": "5b53ee1c-b436-4a1e-90ae-0af468c4d976",
        "support": null,
        "x": 428,
        "y": 220
      },
      {
        "type": "watering-can",
        "rotation": 0,
        "scale": 1.2,
        "id": "ff25f9da-fa50-443f-bbe8-f3231461cb70",
        "support": {
          "id": "296d9f1a-a33a-49f9-844a-48a2e16cfde0",
          "surface": "shelf-2"
        },
        "x": 196,
        "y": 316
      },
      {
        "type": "vessel-antique-oribe-jar",
        "rotation": 0,
        "scale": 1,
        "id": "ccac9bf8-eb24-474d-b4ba-0f83bf0dac34",
        "support": null,
        "x": 324,
        "y": 316
      },
      {
        "type": "vessel-hagi",
        "rotation": 0,
        "scale": 0.7,
        "id": "46ae6b01-8551-4d31-9a56-0e279c154836",
        "support": {
          "id": "e4ac2966-c699-4dc3-b8b7-8ce922244b7d",
          "surface": "inside-floor"
        },
        "x": 380,
        "y": 328
      },
      {
        "type": "antique-shigaraki-jar",
        "rotation": 0,
        "scale": 1,
        "id": "a8b53cb2-d7a0-4594-90eb-c74562561318",
        "support": null,
        "x": 156,
        "y": 264
      },
      {
        "type": "antique-kiyomizu-incense",
        "rotation": 0,
        "scale": 1.3,
        "id": "0bd0cb9b-4ced-4042-944c-323b7c968b0d",
        "support": {
          "id": "49a026f9-b425-47d4-bd48-4a369e9dfc74",
          "surface": "shelf-3"
        },
        "x": 244,
        "y": 312
      },
      {
        "type": "antique-tsuboya-dragon",
        "rotation": 0,
        "scale": 1,
        "id": "0d1cf8b9-b0f3-4179-939f-f083fa2c6be3",
        "support": null,
        "x": 172,
        "y": 272
      },
      {
        "type": "weapon-colt-new-service",
        "rotation": 0,
        "scale": 1,
        "id": "e1d72a44-a901-404d-bcd1-95fa5b900252",
        "support": null,
        "x": 168,
        "y": 228
      },
      {
        "type": "weapon-mace",
        "rotation": 0,
        "scale": 1.6,
        "id": "456b8257-307c-4e18-a307-f9342c571cf0",
        "support": null,
        "x": 420,
        "y": 168
      },
      {
        "type": "antique-echizen-jar",
        "rotation": 0,
        "scale": 1,
        "id": "c12b9d05-d8c9-4edb-99be-26d659cf4ddf",
        "support": null,
        "x": 456,
        "y": 444
      },
      {
        "type": "antique-arita-coffee",
        "rotation": 90,
        "scale": 0.8,
        "id": "43f711f5-c0e0-4c83-bbcb-8f5be68613a5",
        "support": null,
        "x": 456,
        "y": 420
      },
      {
        "type": "antique-oribe-ewer",
        "rotation": 0,
        "scale": 0.6,
        "id": "face28e0-c04c-4c37-b718-6664ca2f6442",
        "support": {
          "id": "8840b792-fd24-4a1d-8cd8-ac42b35dd44d",
          "surface": "shelf-2"
        },
        "x": 412,
        "y": 160
      }
    ],
    "south": [
      {
        "type": "iron-3-black",
        "rotation": 0,
        "scale": 1.8,
        "id": "9def366d-90a1-4563-9951-f7c0a4dfa0e4",
        "support": null,
        "x": 284,
        "y": 120
      },
      {
        "type": "wood-2",
        "rotation": 90,
        "scale": 1.7,
        "id": "d2bc6d71-f27a-4cee-9554-82db8f02049d",
        "support": null,
        "x": 332,
        "y": 292
      },
      {
        "type": "wood-round-stool",
        "rotation": 0,
        "scale": 1.4,
        "id": "b21942fc-5b04-42f7-b1f6-de3fdcaa9230",
        "support": null,
        "x": 304,
        "y": 272
      },
      {
        "type": "drying-rack",
        "rotation": 0,
        "scale": 2,
        "id": "2f432ecc-c22d-48d4-a3f5-22288f8e050b",
        "support": null,
        "x": 296,
        "y": 396
      },
      {
        "type": "drying-rack",
        "rotation": 90,
        "scale": 1.9,
        "id": "a02f22ab-8746-4340-9b78-acf464525c60",
        "support": null,
        "x": 300,
        "y": 204
      },
      {
        "type": "tea-set",
        "rotation": 90,
        "scale": 1.4,
        "id": "1f60c999-f849-40da-99ee-534d24bc8526",
        "support": {
          "id": "d2bc6d71-f27a-4cee-9554-82db8f02049d",
          "surface": "shelf-2"
        },
        "x": 332,
        "y": 300
      },
      {
        "type": "moss-muralis",
        "rotation": 0,
        "scale": 1.2,
        "id": "d9ea6bb4-74fd-4913-8205-b952b4ea0bfd",
        "support": {
          "id": "9def366d-90a1-4563-9951-f7c0a4dfa0e4",
          "surface": "shelf-1"
        },
        "seed": 2698839807,
        "x": 272,
        "y": 124,
        "pot": "plastic"
      },
      {
        "type": "fuchsia",
        "rotation": 0,
        "scale": 1,
        "id": "06926830-a688-4e9c-a938-55860aadb11e",
        "support": {
          "id": "9def366d-90a1-4563-9951-f7c0a4dfa0e4",
          "surface": "shelf-2"
        },
        "seed": 1328928521,
        "x": 295.22599110452734,
        "y": 127.32840881998413
      },
      {
        "type": "antique-tamba-jar",
        "rotation": 0,
        "scale": 1.1,
        "id": "9dd0e8b7-cbdd-47c6-9eec-62df5e5c782d",
        "support": null,
        "x": 244,
        "y": 116
      },
      {
        "type": "antique-seto-hitorine",
        "rotation": 0,
        "scale": 1,
        "id": "fc725928-24eb-4ed3-881a-4b979fd669dc",
        "support": {
          "id": "9def366d-90a1-4563-9951-f7c0a4dfa0e4",
          "surface": "shelf-2"
        },
        "x": 268,
        "y": 124
      },
      {
        "type": "haworthia",
        "rotation": 0,
        "scale": 1,
        "id": "3d9a138b-e2bf-45a9-8698-76a9e13ac5a6",
        "support": {
          "id": "9def366d-90a1-4563-9951-f7c0a4dfa0e4",
          "surface": "shelf-3"
        },
        "seed": 3493995457,
        "x": 282.58268368387877,
        "y": 127.6825955649233,
        "pot": "arita"
      },
      {
        "type": "new-tomentosa-kal",
        "rotation": 0,
        "scale": 1.2,
        "id": "89cc2168-d744-4044-a69c-985122abb741",
        "support": {
          "id": "9def366d-90a1-4563-9951-f7c0a4dfa0e4",
          "surface": "shelf-1"
        },
        "seed": 4150551881,
        "x": 284,
        "y": 124,
        "pot": "shigaraki"
      },
      {
        "type": "radish",
        "rotation": 90,
        "scale": 1.2,
        "id": "8d6ea066-07d8-464d-86de-80881efeff23",
        "support": null,
        "seed": 3654063771,
        "x": 340,
        "y": 140
      },
      {
        "type": "weapon-enfield-no2",
        "rotation": 0,
        "scale": 1,
        "id": "60357b16-3098-4611-84f8-e73cce0de410",
        "support": {
          "id": "d2bc6d71-f27a-4cee-9554-82db8f02049d",
          "surface": "shelf-1"
        },
        "x": 332,
        "y": 280
      }
    ]
  }
};

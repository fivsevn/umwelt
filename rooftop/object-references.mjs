// Structural analogues, not claims that the photographed belongings are these products.
const ref = (label, url) => ({ label, url });
const garden = ref(
  "IKEA · LÄCKÖ 花架装配与前后结构",
  "https://www.ikea.com/es/en/assembly_instructions/lacko-shelving-unit-grey-outdoor-indoor__AA-2578356-1-100.pdf",
);
const wood = ref(
  "IKEA · IVAR 宽深高与层板结构",
  "https://www.ikea.com/th/th/files/pdf/05/85/0585f5e5/th23-ivar_bg_a4.pdf",
);
const chair = ref(
  "IKEA · ASKHOLMEN 折叠椅多角度",
  "https://www.ikea.com/us/en/p/askholmen-chair-outdoor-foldable-dark-brown-20557502/",
);
const sink = ref(
  "BLANCO · 水槽表面与材质",
  "https://www.blanco.com/int/sinks/materials/stainless-steel-sinks/",
);
const glass = ref(
  "IKEA · ÅKERBÄR 玻璃箱装配结构",
  "https://www.ikea.com/ph/en/assembly_instructions/akerbaer-greenhouse-indoor-outdoor-white__AA-2331989-1-100.pdf",
);
const box = ref(
  "IKEA · KLÄMTARE 箱体宽深高",
  "https://www.ikea.com/gb/en/p/klaemtare-box-with-lid-in-outdoor-dark-grey-70292364/",
);
const can = ref(
  "Haws · 浇水壶壶身、长嘴与提柄",
  "https://haws.co.uk/pages/indoor-watering-cans",
);
const spray = ref(
  "GARDENA · 压力喷壶结构",
  "https://www.gardena.com/au/products/tree-shrub-care/pump-pressure-sprayers/pressure-sprayer-1.25-l/970461301.html",
);
const lamp = ref(
  "IKEA · TERTIAL 灯臂与灯罩装配",
  "https://www.ikea.com/ie/en/assembly_instructions/tertial-work-lamp-dark-grey__AA-2550118-1-100.pdf",
);
const glove = ref(
  "GARDENA · 工作手套结构",
  "https://www.gardena.com/int/products/soil-ground/gloves",
);
const meter = ref(
  "Exo Terra · 表盘与安装背面",
  "https://exo-terra.com/products/heating/thermo-hygrometers/analog-hygrometer/",
);
const photos = ref(
  "北天台照片与四面绘制记录",
  "https://github.com/fivsevn/umwelt/blob/main/docs/rooftop-object-views.md",
);
const groups = [
  [
    [
      "shelf",
      "tierstand",
      "wallrack",
      "wirestand",
      "coveredstand",
      "basketstand",
      "plantcart",
      "trellis",
      "drying",
      "wirebasket",
    ],
    garden,
  ],
  [
    [
      "woodshelf",
      "ladderstand",
      "table",
      "bench",
      "stool",
      "pottingbench",
      "foamstand",
      "lowplatform",
    ],
    wood,
  ],
  [["gardenbench", "foldingchair", "bistrotable"], chair],
  [["sink", "basin"], sink],
  [["terrarium", "wardcase"], glass],
  [
    [
      "crate",
      "redbox",
      "seedtray",
      "foambox",
      "storagechest",
      "fish",
      "fishbox",
      "soilbag",
    ],
    box,
  ],
  [["watering", "bucket"], can],
  [["sprayer"], spray],
  [["tasklamp", "solarlamp", "stringlights"], lamp],
  [["gloves"], glove],
  [["thermometer"], meter],
];
export function objectReferences(a) {
  if (a.plant) return [];
  const group = groups.find(([ids]) => ids.includes(a.id));
  return group ? [photos, group[1]] : [photos];
}

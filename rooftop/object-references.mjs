import { BALCONY_EXTRAS } from "./balcony-extras.mjs";
// Source-backed construction analogues; colours and saved footprints remain authored game choices.
const ref = (label, url) => ({ label, url });
const R = {
  metal: ref(
    "IKEA · LÄCKÖ 铁架装配",
    "https://www.ikea.com/es/en/assembly_instructions/lacko-shelving-unit-grey-outdoor-indoor__AA-2578356-1-100.pdf",
  ),
  wood: ref(
    "IKEA · IVAR 层板、框架与背撑",
    "https://www.ikea.com/th/th/files/pdf/05/85/0585f5e5/th23-ivar_bg_a4.pdf",
  ),
  outdoor: ref(
    "IKEA · NÄMMARÖ 桌凳与储物箱结构",
    "https://www.ikea.com/us/en/files/pdf/6d/a2/6da2b97f/nammaro_feb_2024.pdf",
  ),
  drying: ref(
    "IKEA · FROST 折叠晾衣架",
    "https://www.ikea.com/nl/nl/p/frost-staand-droogrek-binnen-buiten-wit-40244831/",
  ),
  laundry: ref(
    "IKEA · JOSTEIN 网格架与透明罩",
    "https://www.ikea.com/ph/en/files/pdf/96/b5/96b5055d/fy23-ph-hfb17-outdoor-bg-t2.pdf",
  ),
  chair: ref(
    "IKEA · ASKHOLMEN 折叠椅",
    "https://www.ikea.com/us/en/p/askholmen-chair-outdoor-foldable-dark-brown-20557502/",
  ),
  table: ref(
    "IKEA · LÄCKÖ 圆桌",
    "https://www.ikea.com/dk/da/p/laeckoe-bord-ude-gra-40151841/",
  ),
  cart: ref(
    "IKEA · NISSAFORS 三层推车",
    "https://www.ikea.com/gb/en/p/nissafors-trolley-beige-40585801/",
  ),
  bed: ref(
    "IKEA · TARVA 床框与板条",
    "https://www.ikea.com/us/en/p/tarva-bed-frame-white-stained-s79553979/",
  ),
  wardrobe: ref(
    "IKEA · RAKKESTAD 双门衣柜装配",
    "https://www.ikea.com/au/en/assembly_instructions/rakkestad-wardrobe-with-2-doors-black-brown__AA-2583001-1-100.pdf",
  ),
  dresser: ref(
    "IKEA · TARVA 三抽屉柜装配",
    "https://www.ikea.com/us/en/assembly_instructions/tarva-3-drawer-dresser-pine__AA-2431378-1-100.pdf",
  ),
  armchair: ref(
    "IKEA · STRANDMON 扶手、翼背与木脚",
    "https://www.ikea.com/us/en/p/strandmon-wing-chair-nordvalla-dark-gray-90359829/",
  ),
  sink: ref(
    "BLANCO · 不锈钢水槽结构与材质",
    "https://www.blanco.com/int/sinks/materials/stainless-steel-sinks/",
  ),
  glass: ref(
    "IKEA · ÅKERBÄR 玻璃箱框架",
    "https://www.ikea.com/ph/en/assembly_instructions/akerbaer-greenhouse-indoor-outdoor-white__AA-2331989-1-100.pdf",
  ),
  ward: ref(
    "Kew · 沃德箱的斜顶、玻璃与木框",
    "https://www.kew.org/read-and-watch/the-wardian-case-a-history-of-plant-transportation",
  ),
  box: ref(
    "IKEA · KLÄMTARE 箱壁与提手",
    "https://www.ikea.com/gb/en/p/klaemtare-box-with-lid-in-outdoor-dark-grey-70292364/",
  ),
  bucket: ref(
    "IKEA · KORKGRAN 镀锌桶与木握柄",
    "https://www.ikea.com/gb/en/p/korkgran-bucket-plant-pot-in-outdoor-galvanised-40611980/",
  ),
  basket: ref(
    "IKEA · RISATORP 钢网篮与木提手",
    "https://www.ikea.com/fi/en/p/risatorp-basket-white-90281618/",
  ),
  can: ref(
    "Haws · 浇水壶的长嘴与提柄",
    "https://haws.co.uk/collections/indoor-watering-cans?page=1",
  ),
  spray: ref(
    "GARDENA · 1.25L 压力喷壶",
    "https://www.gardena.com/au/products/tree-shrub-care/pump-pressure-sprayers/pressure-sprayer-1.25-l/970461301.html",
  ),
  tool: ref(
    "GARDENA · 园艺铲的刀面与握柄",
    "https://www.gardena.com/uk/products/soil-ground/garden-tools/hand-trowel/970742001.html",
  ),
  hose: ref(
    "GARDENA · 13mm 园艺软管",
    "https://www.gardena.com/uk/products/watering/hoses/classic-hose-13-mm-12-50-m/967247201.html",
  ),
  glove: ref(
    "GARDENA · 园艺手套的指形与袖口",
    "https://www.gardena.com/uk/products/soil-ground/gloves/planting-and-soil-gloves-10-xl/966806701.html",
  ),
  brush: ref(
    "GARDENA · 刷头、刷毛与长柄",
    "https://www.gardena.com/int/products/soil-ground/combisystem/scrubbing-brush/966643501.html",
  ),
  meter: ref(
    "Exo Terra · 圆形温湿度表盘与背面",
    "https://exo-terra.com/products/heating/thermo-hygrometers/analog-hygrometer/",
  ),
  seed: ref(
    "RHS · 育苗容器、介质与植物标签",
    "https://www.rhs.org.uk/getmedia/61a84ef1-1473-4647-9895-c1cd1d54f7a5/Sowing-seeds-in-a-container_RHS-Grow-With-It.pdf",
  ),
  enamel: ref(
    "Garden Trading · 搪瓷材料与器具",
    "https://www.gardentrading.co.uk/shop-by/collection/enamel/",
  ),
  pet: ref(
    "Garden Trading · 宠物食碗的低沿器形",
    "https://www.gardentrading.co.uk/journal/our-top-3-items-for-your-pets/",
  ),
  tea: ref(
    "IKEA · GLADELIG 陶壶、盖钮与壶嘴",
    "https://www.ikea.com/gb/en/p/gladelig-teapot-grey-00537548/",
  ),
  towel: ref(
    "IKEA · VÅGSJÖN 毛巾织纹",
    "https://www.ikea.com/us/en/p/vagsjoen-bath-sheet-dark-gray-50353612/",
  ),
  sieve: ref(
    "IKEA · IDEALISK 金属滤盆",
    "https://kw-en.publications.ikea.com/kwe-catalogue26/page/154-155",
  ),
  lamp: ref(
    "IKEA · TERTIAL 双灯臂与灯罩装配",
    "https://www.ikea.com/ie/en/assembly_instructions/tertial-work-lamp-dark-grey__AA-2550118-1-100.pdf",
  ),
  solar: ref(
    "IKEA · SOLVINDEN 庭院太阳能灯",
    "https://www.ikea.com/sa/en/files/pdf/4b/0c/4b0c9180/outdoor_english-all.pdf",
  ),
  string: ref(
    "IKEA · SOLVINDEN 灯串与悬垂电线",
    "https://www.ikea.com/gb/en/p/solvinden-led-lighting-chain-with-12-lights-solar-powered-beige-white-50619184/",
  ),
  seat: ref(
    "Met · 明代青花莲塘瓷墩",
    "https://www.metmuseum.org/art/collection/search/50483",
  ),
  lantern: ref(
    "Met · 穿孔锡灯笼",
    "https://www.metmuseum.org/art/collection/search/4734",
  ),
  fish: ref(
    "高知科学馆 · 浅口宽容器与青鳉饲育",
    "https://otepia.kochi.jp/science/tmp/%E4%BB%A4%E5%92%8C2%E5%B9%B4%E5%BA%A6%E5%B9%B4%E5%A0%B1%E3%80%90%E9%AB%98%E7%9F%A5%E3%81%BF%E3%82%89%E3%81%84%E7%A7%91%E5%AD%A6%E9%A4%A8%E3%80%91.pdf",
  ),
};
const records = [
  ["shelf tierstand", "metal", "铁管立柱、三层网格板与斜撑。"],
  ["wirestand wallrack", "laundry", "四根立柱、网格层板与侧横档。"],
  ["coveredstand", "laundry", "网格铁架、透明挡雨罩与独立罩边。"],
  ["basketstand", "basket", "细金属框上装有边网篮。"],
  ["woodshelf ladderstand", "wood", "木质层板、立柱、背撑；梯架前柱倾斜。"],
  ["table pottingbench", "outdoor", "四根承重脚、条板工作面与连接横梁。"],
  ["bench stool lowplatform", "outdoor", "低矮条板台面、支脚与横撑。"],
  ["foamstand", "outdoor", "条板木台上放厚壁泡沫箱。"],
  ["gardenbench", "outdoor", "条板座面、四根脚、靠背与扶手。"],
  ["storagechest", "outdoor", "木板箱壁、条板盖、扣件与底脚。"],
  ["trellis", "outdoor", "木质竖格、横条与斜撑。"],
  ["foldingchair", "chair", "交叉脚架、枢轴、条板座面与靠背。"],
  ["bistrotable", "table", "圆桌面、金属桌沿与交叉脚。"],
  ["drying", "drying", "交叉折叠支脚、铰接点、平行晾杆与搭放织物。"],
  ["plantcart", "cart", "三层托盘、侧框、把手与四只脚轮。"],
  ["room-bed", "bed", "床头、床尾、床架、板条、床垫与织物。"],
  ["room-wardrobe", "wardrobe", "高柜体、背板、双门、门缝与两只把手。"],
  ["room-dresser", "dresser", "三层独立抽屉、每层双把手与四只柜脚。"],
  ["room-armchair", "armchair", "翼形靠背、扶手、独立座垫与四根木脚。"],
  [
    "sink basin",
    "sink",
    "独立的矩形灰池和椭圆蓝池；内盆、下水和龙头各自生成。",
  ],
  ["terrarium", "glass", "蓝框、弯罩、透明面与托盘，保留原场景轮廓。"],
  ["wardcase", "ward", "木框、斜顶、玻璃板与内部底盘。"],
  [
    "crate redbox fishbox",
    "box",
    "中空箱体、外沿、底板与提手；鱼箱另有水面与鱼。",
  ],
  ["watering", "can", "注水口、后侧把手、两段长嘴与出水口。"],
  ["bucket", "bucket", "锥形桶壁、卷边、金属提梁与木握柄。"],
  ["wirebasket", "basket", "透空钢网、上沿与木提手。"],
  ["tools", "tool", "铲面、握柄与独立的三齿叉。"],
  ["hose", "hose", "四圈软管、末端与接头。"],
  ["sprayer", "spray", "储液瓶、加压头、D形握柄、喷嘴与液位窗。"],
  ["gloves", "glove", "一双手套的四指、拇指、掌部与袖口。"],
  ["brush", "brush", "长柄、刷头与一排刷毛。"],
  ["thermometer", "meter", "圆盘外壳、刻度、指针与背部安装杆。"],
  [
    "seedtray foambox mossbox soilbag labels",
    "seed",
    "育苗格、厚箱壁、土袋封口与插签，各按用途生成。",
  ],
  ["fish", "glass", "透明玻璃侧壁、薄口沿、缸底、水体与鱼。"],
  [
    "enamelbowl goldfishbowl pond lid",
    "enamel",
    "中空盆壁、卷边；高脚盆、浅盆与盆盖分开生成。",
  ],
  ["medakabowl", "fish", "宽口深缸、厚缸沿、水面与独立青鳉。"],
  ["pigbowl", "pet", "低沿食碗、内底与少量食物。"],
  ["teaset", "tea", "陶壶、盖钮、长嘴、把手、两只杯与托盘。"],
  ["towel", "towel", "薄织物、条状织纹与毛边。"],
  ["strainer", "sieve", "中空滤盆、网眼与口沿。"],
  ["solarlamp", "solar", "地插杆、灯室、帽沿与顶面太阳能板。"],
  ["tasklamp", "lamp", "灯底、两段关节臂、关节钮与钟形灯罩。"],
  ["stringlights", "string", "两端支点、弧垂电线、灯座与灯珠。"],
  ["ceramicseat", "seat", "鼓形器身、上下凸点环与青花纹饰。"],
  ["tinlantern", "lantern", "金属筒、穿孔、锥形顶帽与提环。"],
  ["pot moss", "seed", "普通中空陶盆或浅苔藓盘，土面与植株分开生成。"],
];
export const MODEL_REFERENCES = Object.fromEntries(
  records.flatMap(([ids, key, note]) =>
    ids.split(" ").map((id) => [id, { sources: [R[key]], note }]),
  ),
);
for (const a of BALCONY_EXTRAS)
  MODEL_REFERENCES[a.id] = { sources: a.sources, note: a.note };
export function objectReferences(a) {
  return a.plant || a.weapon || a.vessel
    ? []
    : MODEL_REFERENCES[a.id]?.sources || [];
}

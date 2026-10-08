import { asset } from "./scene.mjs";
import { plant, vessel } from "./botany.mjs";
import { NOTEBOOK_COMMENTS } from "./notebook-comments.mjs";

// Descriptions state what is present. Drawing instructions belong in art docs.
const DESCRIPTIONS = {
  "weapon-arisaka-38": "细长木托与长枪管相连，后部有圆形部件、枪栓和箍带。",
  sink: "不锈钢矩形水槽，带下水口、龙头和承重台架。",
  basin: "椭圆蓝色水盆嵌在台面上，配有龙头和排水口。",
  terrarium: "蓝色金属框、透明弯罩和底部托盘组成的保湿柜。",
  crate: "蓝色中空收纳箱，箱壁有加强筋，两侧留有提手。",
  redbox: "红褐色方形种植盆，厚口沿，两侧有提手。",
  pot: "敞口红陶盆，盆壁向底部收拢，底部有排水孔。",
  enamelbowl: "白色搪瓷高脚盆，卷边口沿，内外面有少量磨损。",
  pond: "圆形蓝色水盆，水中养有小鱼。",
  goldfishbowl: "宽口浅搪瓷盆，盆内有水和金鱼。",
  fishbox: "透明箱壁和蓝色框沿围成的长方形鱼箱，内有水和小鱼。",
  moss: "浅盘内的苔藓和土，盘沿低矮。",
  mossbox: "白色栽培箱，浅土层上生长着苔藓。",
  seedtray: "分格的育苗浅盘，每个小格承托土和幼苗。",
  foambox: "厚壁泡沫栽培箱，装有土和小株植物。",
  soilbag: "装园艺土的袋子，上方有封口，袋身有折痕。",
  labels: "插在盆土里的细标签，用于记录植物名字。",
  lid: "蓝色圆盆盖，边缘卷起，中央略有起伏。",
  "pruning-shears": "红柄园艺剪，弯刃、承刃、轴心螺母和柄间弹簧相连。",
  parasol: "亚麻色八片遮阳伞，配有伞骨、调节套环和加重底座。",
  windchime: "开口铁铃悬在木支架上，铃下挂着一条纸短册。",
  "vessel-tokoname": "常滑盆栽鉢式样的椭圆宽口盆，器身低矮，底有短足。",
  "vessel-shigaraki": "信乐式样的宽口圆腹盆，表面有粗颗粒土肌。",
  "vessel-bizen": "备前烧式样的收口圆腹盆，烧締土肌上留有火痕。",
  "vessel-mashiko": "益子式样的外撇口植木盆，收底器壁带纵向削纹。",
  "vessel-kasama": "笠间式样的直壁圆筒盆，器表有流釉。",
  "vessel-mino": "织部式样四足方盆，方口、折角器身，表面施浓绿釉。",
  "vessel-seto": "濑户染付式样的宽口弧腹盆，白地上绘蓝色枝叶。",
  "vessel-kutani": "九谷木瓜鉢式样的彩绘盆，口沿呈四瓣，器腹低矮。",
  "vessel-arita": "有田轮花鉢式样的盆，轮花口沿、薄壁和弧腹。",
  "vessel-imari": "伊万里式样的白瓷碗形盆，带高台，蓝色和赤色纹饰分区排列。",
  "vessel-hasami": "波佐见式样的收底杯形盆，青白胎上有细竖纹。",
  "vessel-kyoto": "京烧菊割式样的高台小盆，花瓣形口沿，下方露出高台。",
  "vessel-hagi": "萩烧式样的轮花高台盆，表面施乳白粉釉。",
  "vessel-karatsu": "唐津式样的低高台弧腹盆，灰黄釉上有铁绘草叶。",
  "vessel-tobe": "砥部式样的圆腹盆，口沿厚圆，白地上有青花卷草纹。",
  "vessel-koishiwara": "小石原式样的宽口收底盆，器壁上有飞铇短点纹。",
  "vessel-ontayaki": "丹波立杭式样的多面鼓腹盆，面取器壁上有自然流釉。",
  "vessel-iga": "伊贺式样的宽腹收底盆，粗土肌、灰绿釉和略偏心的口沿。",
  "vessel-echizen": "越前壶式样的圆腹盆，鼓肩、宽口，底设排水孔。",
  "vessel-tsuboya": "壶屋式样的厚胎圆腹盆，外翻厚口沿，带蓝绿刷绘。",
  "vessel-antique-shino":
    "志野浅钵式样，浅阔器身、长石白釉，钵内绘芒草铁纹；参考16世纪桃山时期藏品，改设排水孔。",
  "vessel-antique-nezumi":
    "鼠志野四方钵式样，内卷方口、圆形内底和三足，深赤褐釉上有白色掻落纹；参考16世纪藏品，改作栽培钵。",
  "vessel-antique-shino-square":
    "志野四方向付式样，四面分别有蛇笼、珠串、堇草和鸢尾铁绘；参考16世纪藏品，改设排水孔。",
  "vessel-antique-nabeshima":
    "锅岛八角钵式样，折面器壁和圈足，绘萝卜枝叶；参考约1800年藏品的黑白照片，釉彩为拟色。",
  "vessel-antique-nabeshima-dish":
    "锅岛青花浅盘式样，内面绘留白同心几何纹，背有三组花枝，圈足带梳齿纹；参考18世纪藏品，改设排水孔。",
  "vessel-antique-kutani-red":
    "九谷赤绘金彩钵式样，内面有唐狮、花草与同心分区；参考19世纪藏品，腹深和背面纹饰经过改制。",
  "vessel-antique-celadon":
    "锅岛青瓷轮花浅钵式样，内底划山亭、篱笆和树木，下有三只鬼面足；参考约1700年藏品，改设排水孔。",
  "vessel-antique-oribe-jar":
    "志野织部花器式样，窄颈鼓腹、白釉铁绘，肩部五道凹线按两道、一道、两道分组；参考17世纪藏品，不作换盆容器。",
};
export function notebookEntry(o) {
  const p = plant(o.type),
    a = asset(o.type),
    v = a.vessel && vessel(a.vessel);
  const info = p || v || a;
  const description =
    DESCRIPTIONS[o.type] ||
    (a.weapon ? a.note.split("。")[0] + "。" : info.note);
  return {
    name: info.name,
    scientific: p?.scientific || "",
    description,
    comment: NOTEBOOK_COMMENTS[o.type],
    sources: [
      ...new Map(
        [
          ...(info.sources || []),
          ...(a.sources || []),
          ...(p ? vessel(o.pot || p.defaultPot).sources : []),
        ].map((s) => [s.url, s]),
      ).values(),
    ],
  };
}
export function fillNotebook(o, root = document) {
  const entry = notebookEntry(o),
    get = (id) => root.querySelector(`#${id}`);
  get("noteName").textContent = entry.name;
  get("noteLatin").textContent = entry.scientific;
  get("noteLatin").hidden = !entry.scientific;
  get("noteShape").textContent = entry.description;
  get("noteComment").textContent = entry.comment;
  get("noteSources").replaceChildren(
    ...entry.sources.map((source) => {
      const li = document.createElement("li"),
        a = document.createElement("a");
      a.textContent = source.label;
      a.href = source.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      li.append(a);
      return li;
    }),
  );
}

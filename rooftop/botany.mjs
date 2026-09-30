import {EXPANSION} from './botany-expansion.mjs';
// Reviewed botanical profiles and pixel-art vessel designs. See docs/rooftop-notebook.md.
export const PLANTS=[
  {
    "id": "barrel",
    "name": "金琥",
    "scientific": "Echinocactus grusonii",
    "ja": "キンシャチ",
    "aliases": "金琥",
    "category": "仙人掌",
    "form": "barrel",
    "leaf": "#7b8956",
    "flower": "#c4b488",
    "care": "明亮日照，避连续淋雨；介质干后再浇，冬季防冻。",
    "note": "圆球有纵向棱肋，金黄色刺簇围着浅色顶部。",
    "family": "dry",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "RHS 金琥图鉴",
        "url": "https://www.rhs.org.uk/plants/6253/echinocactus-grusonii/details"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "shallow",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "浅根或中小型植株可选浅盘、普通盆与陶瓷盆；所有盆都有排水孔。"
  },
  {
    "id": "column",
    "name": "量天尺",
    "scientific": "Selenicereus undatus",
    "ja": "サンカクサボテン",
    "aliases": "量天尺／火龍果",
    "category": "仙人掌",
    "form": "column",
    "leaf": "#5f8055",
    "flower": "#e5dec3",
    "care": "温暖向阳，疏松排水；长枝需要支撑，寒冷时移到避风处。",
    "note": "三棱绿色枝条向上长，棱边有小刺座。",
    "family": "large",
    "w": 40,
    "h": 48,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/selenicereus-undatus/"
      }
    ],
    "containers": [
      "deep",
      "growbag"
    ],
    "defaultPot": "deep",
    "containerNote": "保留深盆与种植袋，给根系和支撑留空间。"
  },
  {
    "id": "bunny",
    "name": "白毛掌",
    "scientific": "Opuntia microdasys",
    "ja": "バニーカクタス",
    "aliases": "白毛掌／兔耳仙人掌",
    "category": "仙人掌",
    "form": "pads",
    "leaf": "#799a65",
    "flower": "#d7caa9",
    "care": "日照充足，盆土干透再浇；刺座的小钩刺不要徒手碰。",
    "note": "扁平椭圆茎节成对分枝，点状刺座均匀散布。",
    "family": "dry",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/opuntia-microdasys/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "shallow",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "浅根或中小型植株可选浅盘、普通盆与陶瓷盆；所有盆都有排水孔。"
  },
  {
    "id": "cluster",
    "name": "玉翁",
    "scientific": "Mammillaria hahniana",
    "ja": "タマオキナ",
    "aliases": "玉翁",
    "category": "仙人掌",
    "form": "cluster",
    "leaf": "#82956b",
    "flower": "#b892a1",
    "care": "明亮通风，避免积水；冬季避霜。",
    "note": "白色细毛包着球体，粉色小花排成顶部花环。",
    "family": "dry",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 乳突球属图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/mammillaria/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "shallow",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "浅根或中小型植株可选浅盘、普通盆与陶瓷盆；所有盆都有排水孔。"
  },
  {
    "id": "trailing",
    "name": "猴尾柱",
    "scientific": "Cleistocactus colademononis",
    "ja": "ヒルデウィンテラ・コラデモノニス",
    "aliases": "猴尾柱",
    "category": "仙人掌",
    "form": "tails",
    "leaf": "#9ea574",
    "flower": "#b27670",
    "care": "明亮光线与良好排水，保护垂枝；天冷减少浇水。",
    "note": "细长茎覆浅色毛刺，成熟枝条从盆沿下垂。",
    "family": "hanging",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "RHS 猴尾柱图鉴",
        "url": "https://www.rhs.org.uk/plants/327556/cleistocactus-colademononis/details"
      }
    ],
    "containers": [
      "basket",
      "terra",
      "white"
    ],
    "defaultPot": "basket",
    "containerNote": "吊盆或架边圆盆，让垂枝有地方伸展。"
  },
  {
    "id": "aloe",
    "name": "库拉索芦荟",
    "scientific": "Aloe vera",
    "ja": "アロエ・ベラ",
    "aliases": "蘆薈",
    "category": "多肉",
    "form": "swords",
    "leaf": "#6f946d",
    "flower": "#c6a97f",
    "care": "明亮日照，夏季逐步适应强光；避积水，冬季防冻。",
    "note": "肉质剑形叶从中心展开，边缘有浅色小齿。",
    "family": "dry",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/aloe-vera/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "shallow",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "浅根或中小型植株可选浅盘、普通盆与陶瓷盆；所有盆都有排水孔。"
  },
  {
    "id": "rosette",
    "name": "蓝石莲",
    "scientific": "Echeveria secunda",
    "ja": "エケベリア・セクンダ",
    "aliases": "藍石蓮",
    "category": "多肉",
    "form": "rosette",
    "leaf": "#7da5a3",
    "flower": "#cfb4a9",
    "care": "日照和通风，干后再浇；避免积水在叶心，冬季防冻。",
    "note": "粉蓝厚叶叠成紧密莲座，叶端有短尖。",
    "family": "dry",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/echeveria-secunda/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "shallow",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "浅根或中小型植株可选浅盘、普通盆与陶瓷盆；所有盆都有排水孔。"
  },
  {
    "id": "pink",
    "name": "桃美人",
    "scientific": "Pachyphytum oviferum",
    "ja": "パキフィツム・オビフェルム",
    "aliases": "桃美人",
    "category": "多肉",
    "form": "beads",
    "leaf": "#aa8d9d",
    "flower": "#ddc8c3",
    "care": "明亮日照、疏松排水；梅雨避淋，低温防冻。",
    "note": "圆卵形粉灰叶密集在短茎上，像一把小石头。",
    "family": "dry",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "RHS 桃美人图鉴",
        "url": "https://www.rhs.org.uk/plants/12090/pachyphytum-oviferum/details"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "shallow",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "浅根或中小型植株可选浅盘、普通盆与陶瓷盆；所有盆都有排水孔。"
  },
  {
    "id": "jade",
    "name": "玉树",
    "scientific": "Crassula ovata",
    "ja": "カネノナルキ",
    "aliases": "玉樹／翡翠木",
    "category": "多肉",
    "form": "jade",
    "leaf": "#5f8968",
    "flower": "#ddd1c8",
    "care": "明亮通风，干后浇透；枝干渐木质化，冬季避霜。",
    "note": "成对的厚椭圆叶聚在枝端，老枝逐渐木质化。日照下叶缘可泛红；室内养护时不常开花。",
    "family": "dry",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/crassula-ovata/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "shallow",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "浅根或中小型植株可选浅盘、普通盆与陶瓷盆；所有盆都有排水孔。"
  },
  {
    "id": "sedum",
    "name": "虹之玉",
    "scientific": "Sedum × rubrotinctum",
    "ja": "ニジノタマ",
    "aliases": "虹之玉",
    "category": "多肉",
    "form": "beads",
    "leaf": "#859e65",
    "flower": "#ab766d",
    "care": "日照充足、排水快；高温时通风，少水越冬。",
    "note": "短枝上长豆形厚叶，叶梢在强光下泛红。",
    "family": "dry",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NParks 虹之玉图鉴",
        "url": "https://www.nparks.gov.sg/florafaunaweb/flora/2/4/2447"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "shallow",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "浅根或中小型植株可选浅盘、普通盆与陶瓷盆；所有盆都有排水孔。"
  },
  {
    "id": "mint",
    "name": "绿薄荷",
    "scientific": "Mentha spicata",
    "ja": "スペアミント",
    "aliases": "綠薄荷",
    "category": "香草",
    "form": "herb",
    "leaf": "#6d9f63",
    "flower": "#cdc0ce",
    "care": "日照至半日阴，土保持微湿；单独种盆，定期摘心。",
    "note": "对生的锯齿叶几乎没有叶柄，方形茎直立分枝。地下茎容易扩展，单独种盆便于控制；夏末可抽出淡紫花穗。",
    "family": "edible",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/mentha-spicata/"
      },
      {
        "label": "全农 香草栽培（共通）",
        "url": "https://apron-web.jp/garden/saien/13929/"
      },
      {
        "label": "台北 薄荷属植物介绍",
        "url": "https://gisweb.gov.taipei/plant/SpecialMedicinalHerb/narration-16.html"
      },
      {
        "label": "植物智 薄荷属（名称）",
        "url": "https://www.iplant.cn/fsz/info/Mentha"
      },
      {
        "label": "新・花と緑の詳しい図鑑",
        "url": "https://garden-vision.net/flower/magyo/mentha.html"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "foam",
      "trough"
    ],
    "defaultPot": "trough",
    "containerNote": "有排水孔的长槽或泡沫箱，也可独盆种植；不是密植整箱。"
  },
  {
    "id": "rosemary",
    "name": "迷迭香",
    "scientific": "Salvia rosmarinus",
    "ja": "ローズマリー",
    "aliases": "迷迭香",
    "category": "香草",
    "form": "needles",
    "leaf": "#728d78",
    "flower": "#a5abc3",
    "care": "日照充足、通风排水；土表干再浇，闷湿时少雨淋。",
    "note": "木质细枝密生狭长针状叶，夹着少量淡蓝小花。",
    "family": "herb",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/salvia-rosmarinus/"
      },
      {
        "label": "全农 香草栽培（共通）",
        "url": "https://apron-web.jp/garden/saien/13929/"
      },
      {
        "label": "农业部 迷迭香栽培",
        "url": "https://kmweb.moa.gov.tw/knowledgebase.php?func=1&id=243916&type=12821"
      },
      {
        "label": "熊本大学药用植物园",
        "url": "https://www.pharm.kumamoto-u.ac.jp/yakusodb/detail/003686.php"
      },
      {
        "label": "新・花と緑の詳しい図鑑",
        "url": "https://garden-vision.net/flower/ragyo/rosemary.html"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "中小型盆栽可换普通盆与陶瓷风格盆；长大后需要重新选盆。"
  },
  {
    "id": "fern",
    "name": "波士顿肾蕨",
    "scientific": "Nephrolepis exaltata",
    "ja": "セイヨウタマシダ",
    "aliases": "波士頓腎蕨",
    "category": "观叶",
    "form": "fern",
    "leaf": "#76925d",
    "flower": "#d9d4ba",
    "care": "散射光至半阴，土保持微湿；避干风和寒霜。",
    "note": "羽状叶从中心向外弯垂，越近叶尖，小叶越细。叶背的褐色孢子囊群不是虫卵；蕨类不开花。",
    "family": "shade",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/nephrolepis-exaltata/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "中小型盆栽可换普通盆与陶瓷风格盆；长大后需要重新选盆。"
  },
  {
    "id": "broadleaf",
    "name": "龟背竹",
    "scientific": "Monstera deliciosa",
    "ja": "モンステラ",
    "aliases": "龜背芋",
    "category": "观叶",
    "form": "split",
    "leaf": "#5d8068",
    "flower": "#d5cdae",
    "care": "半阴避强烈午后日照；表土稍干再浇，低温搬入室内。",
    "note": "心形大叶有深裂与孔洞，长叶柄从基部伸出。",
    "family": "large",
    "w": 40,
    "h": 48,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/monstera-deliciosa/"
      }
    ],
    "containers": [
      "deep",
      "growbag"
    ],
    "defaultPot": "deep",
    "containerNote": "保留深盆与种植袋，给根系和支撑留空间。"
  },
  {
    "id": "yucca",
    "name": "丝兰",
    "scientific": "Yucca filamentosa",
    "ja": "イトラン",
    "aliases": "絲蘭",
    "category": "观叶",
    "form": "swords",
    "leaf": "#889c68",
    "flower": "#e9e5d5",
    "care": "日照充足、排水良好；成熟株较耐干，避免长期潮湿。",
    "note": "硬质狭长剑叶成放射状，叶缘有细丝。",
    "family": "large",
    "w": 40,
    "h": 48,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/yucca-filamentosa/"
      }
    ],
    "containers": [
      "deep",
      "growbag"
    ],
    "defaultPot": "deep",
    "containerNote": "保留深盆与种植袋，给根系和支撑留空间。"
  },
  {
    "id": "vine",
    "name": "常春藤",
    "scientific": "Hedera helix",
    "ja": "セイヨウキヅタ",
    "aliases": "常春藤",
    "category": "藤蔓",
    "form": "ivy",
    "leaf": "#779166",
    "flower": "#cac6a7",
    "care": "半阴至明亮散射光，土表稍干再浇；夏季避闷热。",
    "note": "分枝藤从盆沿垂落，叶片有三至五个尖裂。",
    "family": "hanging",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/hedera-helix/"
      },
      {
        "label": "新・花と緑の詳しい図鑑",
        "url": "https://garden-vision.net/flower/agyo/hedera.html"
      }
    ],
    "containers": [
      "basket",
      "terra",
      "white"
    ],
    "defaultPot": "basket",
    "containerNote": "吊盆或架边圆盆，让垂枝有地方伸展。"
  },
  {
    "id": "flower",
    "name": "矮牵牛",
    "scientific": "Petunia × hybrida",
    "ja": "ペチュニア",
    "aliases": "矮牽牛",
    "category": "花卉",
    "form": "trumpet",
    "leaf": "#728c5d",
    "flower": "#915a87",
    "care": "日照充足，土表稍干再浇；摘残花，寒冷时更换季节花。",
    "note": "软枝铺开，紫粉喇叭形花带较深色花心。",
    "family": "flower",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/petunia-x-hybrida/"
      },
      {
        "label": "新・花と緑の詳しい図鑑",
        "url": "https://garden-vision.net/flower/hagyo/petunia.html"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "trough",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "中小型盆栽可换普通盆与陶瓷风格盆；长大后需要重新选盆。"
  },
  {
    "id": "grass",
    "name": "葱",
    "scientific": "Allium fistulosum",
    "ja": "ネギ",
    "aliases": "青蔥",
    "category": "蔬果",
    "form": "onion",
    "leaf": "#74925a",
    "flower": "#e2ddc6",
    "care": "日照充足，均匀供水又不积水；长槽可分丛种植。",
    "note": "中空管状绿叶直立，根部露出一小段白色叶鞘。",
    "family": "edible",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "RHS 容器菜园（共通）",
        "url": "https://www.rhs.org.uk/vegetables/containers"
      },
      {
        "label": "农业部 阳台菜园（共通）",
        "url": "https://kmweb.moa.gov.tw/ws.php?id=19"
      },
      {
        "label": "农业部 箱植蔬菜",
        "url": "https://kmweb.moa.gov.tw/knowledgebase.php?func=1&id=14214&keyword=&type=12937"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "foam",
      "trough"
    ],
    "defaultPot": "trough",
    "containerNote": "有排水孔的长槽或泡沫箱，也可独盆种植；不是密植整箱。"
  },
  {
    "id": "basil",
    "name": "罗勒",
    "scientific": "Ocimum basilicum",
    "ja": "バジル",
    "aliases": "羅勒／九層塔（香型不同）",
    "category": "香草",
    "form": "herb",
    "leaf": "#84a75c",
    "flower": "#e7dec8",
    "care": "温暖向阳，均匀供水；常摘心，怕霜，九层塔有不同香型。",
    "note": "成对宽卵形亮叶，顶端长浅色小花穗。",
    "family": "edible",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/ocimum-basilicum/"
      },
      {
        "label": "全农 香草栽培（共通）",
        "url": "https://apron-web.jp/garden/saien/13929/"
      },
      {
        "label": "农业部 阳台菜园（共通）",
        "url": "https://kmweb.moa.gov.tw/ws.php?id=19"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "foam",
      "trough"
    ],
    "defaultPot": "trough",
    "containerNote": "有排水孔的长槽或泡沫箱，也可独盆种植；不是密植整箱。"
  },
  {
    "id": "thyme",
    "name": "百里香",
    "scientific": "Thymus vulgaris",
    "ja": "タイム",
    "aliases": "百里香",
    "category": "香草",
    "form": "tiny",
    "leaf": "#81956b",
    "flower": "#c7b3be",
    "care": "向阳通风，贫瘠而排水好；少水，避免根部闷湿。",
    "note": "低矮木质细枝上是小对生叶，点缀淡粉小花。",
    "family": "herb",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/thymus-vulgaris/"
      },
      {
        "label": "全农 香草栽培（共通）",
        "url": "https://apron-web.jp/garden/saien/13929/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "中小型盆栽可换普通盆与陶瓷风格盆；长大后需要重新选盆。"
  },
  {
    "id": "sage",
    "name": "药用鼠尾草",
    "scientific": "Salvia officinalis",
    "ja": "コモンセージ",
    "aliases": "鼠尾草",
    "category": "香草",
    "form": "herb",
    "leaf": "#8aa07e",
    "flower": "#b2a4bd",
    "care": "日照充足、排水好；适度修剪，潮热时加强通风。",
    "note": "灰绿椭圆叶有柔毛，紫色花沿直立花梗排列。",
    "family": "herb",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/salvia-officinalis/"
      },
      {
        "label": "全农 香草栽培（共通）",
        "url": "https://apron-web.jp/garden/saien/13929/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "中小型盆栽可换普通盆与陶瓷风格盆；长大后需要重新选盆。"
  },
  {
    "id": "oregano",
    "name": "牛至",
    "scientific": "Origanum vulgare",
    "ja": "オレガノ",
    "aliases": "奧勒岡／牛至",
    "category": "香草",
    "form": "tiny",
    "leaf": "#819663",
    "flower": "#c6b4bb",
    "care": "向阳，排水良好；适度干燥，摘心让枝条更密。",
    "note": "分枝茎上是小卵形叶，顶端聚着粉白小花。",
    "family": "herb",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/origanum-vulgare/"
      },
      {
        "label": "新・花と緑の詳しい図鑑",
        "url": "https://garden-vision.net/flower/agyo/origanum.html"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "中小型盆栽可换普通盆与陶瓷风格盆；长大后需要重新选盆。"
  },
  {
    "id": "lemonbalm",
    "name": "柠檬香蜂草",
    "scientific": "Melissa officinalis",
    "ja": "レモンバーム",
    "aliases": "檸檬香蜂草",
    "category": "香草",
    "form": "herb",
    "leaf": "#96a85e",
    "flower": "#e1ddcd",
    "care": "日照至半阴，保持微湿；定期修剪，独盆限制扩展。",
    "note": "浅绿锯齿叶对生，叶脉明显，茎丛向外展开。",
    "family": "edible",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/melissa-officinalis/"
      },
      {
        "label": "全农 香草栽培（共通）",
        "url": "https://apron-web.jp/garden/saien/13929/"
      },
      {
        "label": "新・花と緑の詳しい図鑑",
        "url": "https://garden-vision.net/flower/ragyo/lemonbalm.html"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "foam",
      "trough"
    ],
    "defaultPot": "trough",
    "containerNote": "有排水孔的长槽或泡沫箱，也可独盆种植；不是密植整箱。"
  },
  {
    "id": "parsley",
    "name": "欧芹",
    "scientific": "Petroselinum crispum",
    "ja": "パセリ",
    "aliases": "巴西里／洋香菜",
    "category": "香草",
    "form": "parsley",
    "leaf": "#69905b",
    "flower": "#d5d3bf",
    "care": "日照至半阴，均匀供水；用较深的盆，炎热时稍遮阴。",
    "note": "细叶柄托着分裂卷曲的叶簇，叶缘碎而密。",
    "family": "edible",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/petroselinum-crispum/"
      },
      {
        "label": "全农 香草栽培（共通）",
        "url": "https://apron-web.jp/garden/saien/13929/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "foam",
      "trough"
    ],
    "defaultPot": "trough",
    "containerNote": "有排水孔的长槽或泡沫箱，也可独盆种植；不是密植整箱。"
  },
  {
    "id": "coriander",
    "name": "芫荽",
    "scientific": "Coriandrum sativum",
    "ja": "パクチー",
    "aliases": "香菜／芫荽",
    "category": "香草",
    "form": "parsley",
    "leaf": "#84a760",
    "flower": "#e6e0d2",
    "care": "凉爽季节向阳种植，均匀供水；高温易抽薹。",
    "note": "基部宽裂叶与上部细裂叶不同，花序像小伞。",
    "family": "edible",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/coriandrum-sativum/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "foam",
      "trough"
    ],
    "defaultPot": "trough",
    "containerNote": "有排水孔的长槽或泡沫箱，也可独盆种植；不是密植整箱。"
  },
  {
    "id": "chives",
    "name": "细香葱",
    "scientific": "Allium schoenoprasum",
    "ja": "チャイブ",
    "aliases": "細香蔥",
    "category": "香草",
    "form": "onion",
    "leaf": "#779466",
    "flower": "#836290",
    "care": "向阳至半阴，土不完全干透；分丛种，紫色花球可观赏。",
    "note": "细管状叶成密丛，细花梗顶部是紫色圆花序。",
    "family": "edible",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/allium-schoenoprasum/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "foam",
      "trough"
    ],
    "defaultPot": "trough",
    "containerNote": "有排水孔的长槽或泡沫箱，也可独盆种植；不是密植整箱。"
  },
  {
    "id": "shiso",
    "name": "紫苏",
    "scientific": "Perilla frutescens",
    "ja": "シソ",
    "aliases": "紫蘇",
    "category": "香草",
    "form": "herb",
    "leaf": "#8d6081",
    "flower": "#b08b95",
    "care": "温暖明亮，水分均匀；大叶舒展，需要留出株间空间。",
    "note": "阔卵形锯齿叶成对排列，深紫色叶面有明显叶脉。",
    "family": "edible",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/perilla-frutescens/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "foam",
      "trough"
    ],
    "defaultPot": "trough",
    "containerNote": "有排水孔的长槽或泡沫箱，也可独盆种植；不是密植整箱。"
  },
  {
    "id": "lavender",
    "name": "狭叶薰衣草",
    "scientific": "Lavandula angustifolia",
    "ja": "ラベンダー",
    "aliases": "薰衣草",
    "category": "花卉",
    "form": "spikes",
    "leaf": "#889e85",
    "flower": "#7d6b92",
    "care": "日照通风，排水快；夏季避闷湿，花后轻剪。",
    "note": "银灰狭叶在下部成丛，长梗托着紫色穗状花。",
    "family": "herb",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/lavandula-angustifolia/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "中小型盆栽可换普通盆与陶瓷风格盆；长大后需要重新选盆。"
  },
  {
    "id": "strawberry",
    "name": "草莓",
    "scientific": "Fragaria × ananassa",
    "ja": "イチゴ",
    "aliases": "草莓",
    "category": "蔬果",
    "form": "strawberry",
    "leaf": "#6f9a60",
    "flower": "#9b5345",
    "care": "日照充足，均匀供水；冠部不埋深，果实避贴湿土。",
    "note": "三出锯齿叶、白色五瓣花和垂在盆沿的红果。",
    "family": "edible",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/fragaria-x-ananassa/"
      },
      {
        "label": "园艺协会 · 草莓",
        "url": "https://ssl.gardening.or.jp/colum/2010/03/index.html"
      },
      {
        "label": "农业部 草莓栽培",
        "url": "https://fae.moa.gov.tw/map/food_item.php?id=114&type=AS04"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "foam",
      "trough"
    ],
    "defaultPot": "trough",
    "containerNote": "有排水孔的长槽或泡沫箱，也可独盆种植；不是密植整箱。"
  },
  {
    "id": "blueberry",
    "name": "高丛蓝莓",
    "scientific": "Vaccinium corymbosum",
    "ja": "ハイブッシュブルーベリー",
    "aliases": "高叢藍莓",
    "category": "蔬果",
    "form": "berries",
    "leaf": "#70976d",
    "flower": "#485f76",
    "care": "向阳，较大酸性介质盆；保持微湿，按当地冬温选品种。",
    "note": "细木质枝有椭圆叶，蓝色果实带浅色粉霜。",
    "family": "large",
    "w": 40,
    "h": 48,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/vaccinium-corymbosum/"
      },
      {
        "label": "宜兰蓝莓品种试验",
        "url": "https://kmweb.moa.gov.tw/knowledgebase.php?id=426948&type=0"
      }
    ],
    "containerNote": "使用较大的酸性介质盆；按当地冬温选择合适的高丛品种。",
    "containers": [
      "deep",
      "growbag"
    ],
    "defaultPot": "deep"
  },
  {
    "id": "tomato",
    "name": "小番茄",
    "scientific": "Solanum lycopersicum",
    "ja": "ミニトマト",
    "aliases": "小番茄",
    "category": "蔬果",
    "form": "tomato",
    "leaf": "#79915c",
    "flower": "#9d5a46",
    "care": "选矮生盆栽品种，日照充足；均匀浇水，挂果枝需要支撑。",
    "note": "羽状裂叶沿茎分层展开，黄色小花旁有红色圆果。",
    "family": "large",
    "w": 40,
    "h": 48,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/solanum-lycopersicum/"
      },
      {
        "label": "农业部 阳台菜园（共通）",
        "url": "https://kmweb.moa.gov.tw/ws.php?id=19"
      }
    ],
    "containers": [
      "deep",
      "growbag"
    ],
    "defaultPot": "deep",
    "containerNote": "保留深盆与种植袋，给根系和支撑留空间。"
  },
  {
    "id": "chilli",
    "name": "辣椒",
    "scientific": "Capsicum annuum",
    "ja": "トウガラシ",
    "aliases": "辣椒",
    "category": "蔬果",
    "form": "pepper",
    "leaf": "#6e8c5d",
    "flower": "#904b3f",
    "care": "温暖向阳，土表稍干再浇；结果枝要支撑，霜前移入。",
    "note": "尖卵形光滑叶间，细长红果有向下弯曲的果柄。",
    "family": "large",
    "w": 40,
    "h": 48,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/capsicum-annuum/"
      },
      {
        "label": "农业部 阳台菜园（共通）",
        "url": "https://kmweb.moa.gov.tw/ws.php?id=19"
      }
    ],
    "containers": [
      "deep",
      "growbag"
    ],
    "defaultPot": "deep",
    "containerNote": "保留深盆与种植袋，给根系和支撑留空间。"
  },
  {
    "id": "lettuce",
    "name": "叶用莴苣",
    "scientific": "Lactuca sativa",
    "ja": "リーフレタス",
    "aliases": "萵苣／生菜",
    "category": "蔬果",
    "form": "lettuce",
    "leaf": "#98af65",
    "flower": "#e0dac3",
    "care": "凉爽季节向阳，浅槽均匀供水；留株距，高温易抽薹。",
    "note": "宽大波浪叶从中心层层展开，叶缘浅黄绿。",
    "family": "edible",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/lactuca-sativa/"
      },
      {
        "label": "农业部 阳台菜园（共通）",
        "url": "https://kmweb.moa.gov.tw/ws.php?id=19"
      },
      {
        "label": "农业部 箱植蔬菜",
        "url": "https://kmweb.moa.gov.tw/knowledgebase.php?func=1&id=14214&keyword=&type=12937"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "foam",
      "trough"
    ],
    "defaultPot": "trough",
    "containerNote": "有排水孔的长槽或泡沫箱，也可独盆种植；不是密植整箱。"
  },
  {
    "id": "radish",
    "name": "樱桃萝卜",
    "scientific": "Raphanus sativus",
    "ja": "ラディッシュ",
    "aliases": "櫻桃蘿蔔",
    "category": "蔬果",
    "form": "radish",
    "leaf": "#87a05f",
    "flower": "#aa7480",
    "care": "凉爽季节，疏松较深介质；均匀供水，间苗留出根部空间。",
    "note": "粗糙裂叶从红色圆根顶部长出，根肩略露出土面。",
    "family": "edible",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/raphanus-raphanistrum-subsp-sativus/"
      },
      {
        "label": "农业部 阳台菜园（共通）",
        "url": "https://kmweb.moa.gov.tw/ws.php?id=19"
      },
      {
        "label": "农业部 箱植蔬菜",
        "url": "https://kmweb.moa.gov.tw/knowledgebase.php?func=1&id=14214&keyword=&type=12937"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "foam",
      "trough"
    ],
    "defaultPot": "trough",
    "containerNote": "有排水孔的长槽或泡沫箱，也可独盆种植；不是密植整箱。"
  },
  {
    "id": "peppermint",
    "name": "胡椒薄荷",
    "scientific": "Mentha × piperita",
    "ja": "ペパーミント",
    "aliases": "胡椒薄荷",
    "category": "香草",
    "form": "herb",
    "leaf": "#668a72",
    "flower": "#c3b0c0",
    "care": "明亮至半阴，土保持微湿；独盆防扩散，常摘心。",
    "note": "较深绿的尖卵形对生叶，枝条带紫色。",
    "family": "edible",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/mentha-x-piperita/"
      },
      {
        "label": "全农 香草栽培（共通）",
        "url": "https://apron-web.jp/garden/saien/13929/"
      },
      {
        "label": "植物智 薄荷属（名称）",
        "url": "https://www.iplant.cn/fsz/info/Mentha"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "foam",
      "trough"
    ],
    "defaultPot": "trough",
    "containerNote": "有排水孔的长槽或泡沫箱，也可独盆种植；不是密植整箱。"
  },
  {
    "id": "nasturtium",
    "name": "旱金莲",
    "scientific": "Tropaeolum majus",
    "ja": "ナスターチウム",
    "aliases": "旱金蓮／金蓮花",
    "category": "花卉",
    "form": "round",
    "leaf": "#819e64",
    "flower": "#ae8251",
    "care": "向阳、排水好，不宜过肥；枝条可从长槽或吊盆垂下。",
    "note": "圆盾状叶的叶柄接近叶心，橙色花带短距。",
    "family": "hanging",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/tropaeolum-majus/"
      },
      {
        "label": "新・花と緑の詳しい図鑑",
        "url": "https://garden-vision.net/flower/nagyo/nasturtium.html"
      }
    ],
    "containers": [
      "basket",
      "terra",
      "white"
    ],
    "defaultPot": "basket",
    "containerNote": "吊盆或架边圆盆，让垂枝有地方伸展。"
  },
  {
    "id": "pelargonium",
    "name": "天竺葵",
    "scientific": "Pelargonium × hortorum",
    "ja": "ゼラニウム",
    "aliases": "天竺葵",
    "category": "花卉",
    "form": "round",
    "leaf": "#768c5f",
    "flower": "#ae6b72",
    "care": "日照通风，土表干后再浇；夏季避闷热和连雨，怕霜。",
    "note": "圆扇形叶有深色环纹，花梗托着红粉色花球。",
    "family": "flower",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 天竺葵属图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/pelargonium/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "trough",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "中小型盆栽可换普通盆与陶瓷风格盆；长大后需要重新选盆。"
  },
  {
    "id": "marigold",
    "name": "孔雀草",
    "scientific": "Tagetes patula",
    "ja": "フレンチマリーゴールド",
    "aliases": "孔雀草",
    "category": "花卉",
    "form": "marigold",
    "leaf": "#6d8955",
    "flower": "#b49155",
    "care": "日照充足、排水好；适度浇水，摘掉残花。",
    "note": "羽状细裂叶之上是橙黄重瓣小花球。",
    "family": "flower",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/tagetes-patula/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "trough",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "中小型盆栽可换普通盆与陶瓷风格盆；长大后需要重新选盆。"
  },
  {
    "id": "zinnia",
    "name": "百日菊",
    "scientific": "Zinnia elegans",
    "ja": "ジニア",
    "aliases": "百日草／百日菊",
    "category": "花卉",
    "form": "daisy",
    "leaf": "#789962",
    "flower": "#985d78",
    "care": "日照充足，根部浇水与通风；矮生品种更适合花盆。",
    "note": "对生粗叶，直立花茎顶着同心层叠的粉红花。",
    "family": "flower",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/zinnia-elegans/"
      },
      {
        "label": "新・花と緑の詳しい図鑑",
        "url": "https://garden-vision.net/flower/sagyo/zinnia.html"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "trough",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "中小型盆栽可换普通盆与陶瓷风格盆；长大后需要重新选盆。"
  },
  {
    "id": "cosmos",
    "name": "大波斯菊",
    "scientific": "Cosmos bipinnatus",
    "ja": "コスモス",
    "aliases": "大波斯菊",
    "category": "花卉",
    "form": "cosmos",
    "leaf": "#749565",
    "flower": "#b8899f",
    "care": "向阳排水好，少肥；选择矮生品种并防楼顶强风。",
    "note": "极细的二回羽状裂叶，上方是轻薄八瓣粉花。",
    "family": "flower",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/cosmos-bipinnatus/"
      },
      {
        "label": "新・花と緑の詳しい図鑑",
        "url": "https://garden-vision.net/flower/kagyo/cosmos.html"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "trough",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "中小型盆栽可换普通盆与陶瓷风格盆；长大后需要重新选盆。"
  },
  {
    "id": "pansy",
    "name": "三色堇",
    "scientific": "Viola × wittrockiana",
    "ja": "パンジー",
    "aliases": "三色堇",
    "category": "花卉",
    "form": "pansy",
    "leaf": "#7d915f",
    "flower": "#715c89",
    "care": "凉爽季节向阳，均匀浇水；炎热季节通常换植。",
    "note": "低矮圆叶上是五瓣扁平花，花心有深色斑。",
    "family": "flower",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/viola-x-wittrockiana/"
      },
      {
        "label": "新・花と緑の詳しい図鑑",
        "url": "https://garden-vision.net/flower/hagyo/pansy.html"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "trough",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "中小型盆栽可换普通盆与陶瓷风格盆；长大后需要重新选盆。"
  },
  {
    "id": "hydrangea",
    "name": "绣球",
    "scientific": "Hydrangea macrophylla",
    "ja": "アジサイ",
    "aliases": "繡球花／八仙花",
    "category": "花卉",
    "form": "hydrangea",
    "leaf": "#6b9363",
    "flower": "#707da0",
    "care": "半阴、微湿不积水；较大盆避午后晒，不同品种花色有差异。",
    "note": "宽锯齿叶托着大圆花簇，小花密集成球。",
    "family": "large",
    "w": 40,
    "h": 48,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/hydrangea-macrophylla/"
      }
    ],
    "containers": [
      "deep",
      "growbag"
    ],
    "defaultPot": "deep",
    "containerNote": "保留深盆与种植袋，给根系和支撑留空间。"
  },
  {
    "id": "rose",
    "name": "月季",
    "scientific": "Rosa chinensis",
    "ja": "コウシンバラ",
    "aliases": "月季",
    "category": "花卉",
    "form": "rose",
    "leaf": "#648663",
    "flower": "#9d6779",
    "care": "日照与通风，根部供水；用较深盆，修剪后枝条重新开花。",
    "note": "有刺木质枝与锯齿复叶，粉红重瓣花在枝端。",
    "family": "large",
    "w": 40,
    "h": 48,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/rosa-chinensis/"
      }
    ],
    "containers": [
      "deep",
      "growbag"
    ],
    "defaultPot": "deep",
    "containerNote": "保留深盆与种植袋，给根系和支撑留空间。"
  },
  {
    "id": "camellia",
    "name": "山茶",
    "scientific": "Camellia japonica",
    "ja": "ツバキ",
    "aliases": "山茶花",
    "category": "花卉",
    "form": "camellia",
    "leaf": "#547764",
    "flower": "#924c4a",
    "care": "半阴、酸性介质；土微湿，避干风与暴晒，较大盆养根。",
    "note": "深绿有光泽的椭圆叶，红花中央露黄色花蕊。",
    "family": "large",
    "w": 40,
    "h": 48,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/camellia-japonica/"
      }
    ],
    "containers": [
      "deep",
      "growbag"
    ],
    "defaultPot": "deep",
    "containerNote": "保留深盆与种植袋，给根系和支撑留空间。"
  },
  {
    "id": "gardenia",
    "name": "栀子",
    "scientific": "Gardenia jasminoides",
    "ja": "クチナシ",
    "aliases": "梔子花",
    "category": "花卉",
    "form": "gardenia",
    "leaf": "#5c8263",
    "flower": "#ddd6b3",
    "care": "明亮至半阴，酸性介质；均匀供水，低温避霜。",
    "note": "对生光亮深绿叶，枝端有乳白重瓣花。",
    "family": "large",
    "w": 40,
    "h": 48,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/gardenia-jasminoides/"
      }
    ],
    "containers": [
      "deep",
      "growbag"
    ],
    "defaultPot": "deep",
    "containerNote": "保留深盆与种植袋，给根系和支撑留空间。"
  },
  {
    "id": "hibiscus",
    "name": "朱槿",
    "scientific": "Hibiscus rosa-sinensis",
    "ja": "ハイビスカス",
    "aliases": "朱槿／扶桑",
    "category": "花卉",
    "form": "hibiscus",
    "leaf": "#698a5d",
    "flower": "#9e5c47",
    "care": "温暖向阳，均匀供水和排水；大盆防风，寒冷时移入。",
    "note": "红色五瓣大花伸出长花柱，叶片尖而有齿。",
    "family": "large",
    "w": 40,
    "h": 48,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/hibiscus-rosa-sinensis/"
      },
      {
        "label": "新・花と緑の詳しい図鑑",
        "url": "https://garden-vision.net/flower/hagyo/hibiscus.html"
      }
    ],
    "containers": [
      "deep",
      "growbag"
    ],
    "defaultPot": "deep",
    "containerNote": "保留深盆与种植袋，给根系和支撑留空间。"
  },
  {
    "id": "bougainvillea",
    "name": "三角梅",
    "scientific": "Bougainvillea glabra",
    "ja": "ブーゲンビレア",
    "aliases": "九重葛",
    "category": "藤蔓",
    "form": "bougainvillea",
    "leaf": "#6e8e64",
    "flower": "#8f527f",
    "care": "温暖向阳，排水好；长枝需支撑，寒冷时避霜。",
    "note": "木质攀枝有小卵形叶，粉紫纸质苞片围着小白花。",
    "family": "large",
    "w": 40,
    "h": 48,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/bougainvillea-glabra/"
      }
    ],
    "containers": [
      "deep",
      "growbag"
    ],
    "defaultPot": "deep",
    "containerNote": "保留深盆与种植袋，给根系和支撑留空间。"
  },
  {
    "id": "jasmine",
    "name": "茉莉",
    "scientific": "Jasminum sambac",
    "ja": "アラビアジャスミン",
    "aliases": "茉莉花",
    "category": "花卉",
    "form": "jasmine",
    "leaf": "#699060",
    "flower": "#e0dab7",
    "care": "温暖向阳，湿润且排水好；适时修剪，低温搬入避寒处。",
    "note": "对生椭圆叶间是乳白小花，枝条柔软地分叉。",
    "family": "large",
    "w": 40,
    "h": 48,
    "sources": [
      {
        "label": "NParks 茉莉园艺型",
        "url": "https://www.nparks.gov.sg/florafaunaweb/flora/5/2/5208"
      }
    ],
    "containers": [
      "deep",
      "growbag"
    ],
    "defaultPot": "deep",
    "containerNote": "保留深盆与种植袋，给根系和支撑留空间。"
  },
  {
    "id": "fuchsia",
    "name": "倒挂金钟",
    "scientific": "Fuchsia magellanica",
    "ja": "フクシア",
    "aliases": "倒掛金鐘",
    "category": "花卉",
    "form": "fuchsia",
    "leaf": "#789166",
    "flower": "#8b4f75",
    "care": "凉爽半阴，均匀供水；避盛夏热风，冬季按当地气候保护。",
    "note": "细梗下垂的花有红色外萼和紫色钟形花冠。",
    "family": "hanging",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/fuchsia-magellanica/"
      },
      {
        "label": "新・花と緑の詳しい図鑑",
        "url": "https://garden-vision.net/flower/hagyo/fuchsia.html"
      }
    ],
    "containers": [
      "basket",
      "terra",
      "white"
    ],
    "defaultPot": "basket",
    "containerNote": "吊盆或架边圆盆，让垂枝有地方伸展。"
  },
  {
    "id": "portulaca",
    "name": "大花马齿苋",
    "scientific": "Portulaca grandiflora",
    "ja": "マツバボタン",
    "aliases": "松葉牡丹／太陽花",
    "category": "花卉",
    "form": "portulaca",
    "leaf": "#839e64",
    "flower": "#b5845d",
    "care": "日照充足，排水快；暖季开花，怕霜，避免积水。",
    "note": "针状肉质小叶沿匍匐枝生长，粉橙花散在枝端。",
    "family": "flower",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/portulaca-grandiflora/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "trough",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "中小型盆栽可换普通盆与陶瓷风格盆；长大后需要重新选盆。"
  },
  {
    "id": "kalanchoe",
    "name": "长寿花",
    "scientific": "Kalanchoe blossfeldiana",
    "ja": "カランコエ",
    "aliases": "長壽花",
    "category": "多肉",
    "form": "kalanchoe",
    "leaf": "#6b8b6b",
    "flower": "#a26449",
    "care": "明亮光线，干后再浇；怕霜，开花受日长影响。",
    "note": "厚圆叶边缘浅齿，成簇小花各有四片花瓣。",
    "family": "dry",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/kalanchoe-blossfeldiana/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "shallow",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "浅根或中小型植株可选浅盘、普通盆与陶瓷盆；所有盆都有排水孔。"
  },
  {
    "id": "haworthia",
    "name": "条纹十二卷",
    "scientific": "Haworthiopsis attenuata",
    "ja": "十二の巻",
    "aliases": "條紋十二卷",
    "category": "多肉",
    "form": "zebra",
    "leaf": "#5c785e",
    "flower": "#d6d6c1",
    "care": "明亮散射光、良好排水；避酷暑暴晒和积水，冬季防冻。",
    "note": "窄尖厚叶向上成莲座，深绿叶上有横向白色疣点。",
    "family": "dry",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/haworthiopsis-attenuata/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "shallow",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "浅根或中小型植株可选浅盘、普通盆与陶瓷盆；所有盆都有排水孔。"
  },
  {
    "id": "agave",
    "name": "龙舌兰",
    "scientific": "Agave americana",
    "ja": "アオノリュウゼツラン",
    "aliases": "龍舌蘭",
    "category": "多肉",
    "form": "agave",
    "leaf": "#7f9a88",
    "flower": "#d5cdb1",
    "care": "日照与良好排水，尖刺留空间；选择幼株，大株需要更大盆。",
    "note": "蓝灰宽剑叶向四周弯展，叶缘与叶尖有硬刺。",
    "family": "large",
    "w": 40,
    "h": 48,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/agave-americana/"
      }
    ],
    "containers": [
      "deep",
      "growbag"
    ],
    "defaultPot": "deep",
    "containerNote": "保留深盆与种植袋，给根系和支撑留空间。"
  },
  {
    "id": "snake",
    "name": "虎尾兰",
    "scientific": "Dracaena trifasciata",
    "ja": "サンセベリア",
    "aliases": "虎尾蘭",
    "category": "观叶",
    "form": "snake",
    "leaf": "#778e67",
    "flower": "#b8a463",
    "care": "明亮至半阴，介质干后再浇；避寒与长期积水。",
    "note": "直立剑叶带深色横纹，黄色叶缘采用常见园艺型。",
    "family": "dry",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/dracaena-trifasciata/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "shallow",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "浅根或中小型植株可选浅盘、普通盆与陶瓷盆；所有盆都有排水孔。"
  },
  {
    "id": "spider",
    "name": "吊兰",
    "scientific": "Chlorophytum comosum",
    "ja": "オリヅルラン",
    "aliases": "吊蘭",
    "category": "观叶",
    "form": "spider",
    "leaf": "#879b6d",
    "flower": "#d7d9c3",
    "care": "明亮散射光，土表稍干再浇；花茎末端会长小株。",
    "note": "弯垂窄叶有浅色中线，细长匍匐茎带着小苗。",
    "family": "hanging",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/chlorophytum-comosum/"
      }
    ],
    "containers": [
      "basket",
      "terra",
      "white"
    ],
    "defaultPot": "basket",
    "containerNote": "吊盆或架边圆盆，让垂枝有地方伸展。"
  },
  {
    "id": "oxalis",
    "name": "紫叶酢浆草",
    "scientific": "Oxalis triangularis",
    "ja": "オキザリス・トリアングラリス",
    "aliases": "紫葉酢漿草",
    "category": "观叶",
    "form": "oxalis",
    "leaf": "#876f92",
    "flower": "#dad4db",
    "care": "明亮至半阴，土表稍干再浇；休眠时减水，避免积水。",
    "note": "每片叶由三枚紫色三角小叶组成，浅粉小花在上方。",
    "family": "shade",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/oxalis-triangularis/"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "中小型盆栽可换普通盆与陶瓷风格盆；长大后需要重新选盆。"
  },
  {
    "id": "coleus",
    "name": "彩叶草",
    "scientific": "Coleus scutellarioides",
    "ja": "コリウス",
    "aliases": "彩葉草",
    "category": "观叶",
    "form": "coleus",
    "leaf": "#96a662",
    "flower": "#844962",
    "care": "温暖、明亮至半阴，均匀供水；摘心保丛形，怕霜。",
    "note": "宽锯齿叶有紫红中心和浅绿叶缘。",
    "family": "shade",
    "w": 34,
    "h": 40,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/coleus-scutellarioides/"
      },
      {
        "label": "新・花と緑の詳しい図鑑",
        "url": "https://garden-vision.net/flower/kagyo/coleus.html"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "中小型盆栽可换普通盆与陶瓷风格盆；长大后需要重新选盆。"
  },
  {
    "id": "hosta",
    "name": "玉簪",
    "scientific": "Hosta plantaginea",
    "ja": "タマノカンザシ",
    "aliases": "玉簪",
    "category": "观叶",
    "form": "hosta",
    "leaf": "#7a9d69",
    "flower": "#e6e3d9",
    "care": "半阴，微湿且排水好；寒季地上部可休眠，春天重新出叶。",
    "note": "基部宽卵形叶有平行拱脉，长梗开白色筒花。",
    "family": "shade",
    "w": 40,
    "h": 48,
    "sources": [
      {
        "label": "NC State 植物图鉴",
        "url": "https://plants.ces.ncsu.edu/plants/hosta-plantaginea/"
      },
      {
        "label": "新・花と緑の詳しい図鑑",
        "url": "https://garden-vision.net/flower/kagyo/hosta.html"
      }
    ],
    "containers": [
      "terra",
      "plastic",
      "white",
      "tokoname",
      "shigaraki",
      "bizen",
      "mashiko",
      "kasama",
      "mino",
      "seto",
      "kutani",
      "arita",
      "imari",
      "hasami",
      "kyoto",
      "hagi",
      "karatsu",
      "tobe",
      "koishiwara",
      "ontayaki",
      "iga",
      "echizen",
      "tsuboya"
    ],
    "defaultPot": "terra",
    "containerNote": "中小型盆栽可换普通盆与陶瓷风格盆；长大后需要重新选盆。"
  }
];
export const POTS=[
  {
    "id": "tokoname",
    "name": "常滑烧风格盆",
    "ja": "常滑焼",
    "color": "#9b5d3c",
    "rim": "#d6a87e",
    "ink": "#4b2519",
    "pattern": "plain",
    "note": "外缘椭圆盆，矮足与宽口参考常滑盆栽鉢。",
    "shape": "oval",
    "kind": "ceramic",
    "sources": [
      {
        "label": "まるたつ · 常滑盆栽鉢",
        "url": "https://marutatu.shop-pro.jp/"
      },
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0407/"
      }
    ],
    "shapeLabel": "外缘椭圆"
  },
  {
    "id": "shigaraki",
    "name": "信乐烧风格盆",
    "ja": "信楽焼",
    "color": "#ab8657",
    "rim": "#d0bb90",
    "ink": "#56503a",
    "pattern": "speckle",
    "note": "宽口、圆腹的育成鉢；参考信乐 ZEN Bowl 的宽深比例。",
    "shape": "bowl",
    "kind": "ceramic",
    "sources": [
      {
        "label": "ZEN Pottery Labo · Bowl",
        "url": "https://zenpotterylabo.jp/products/zen-bowl-type-7号-無釉"
      },
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0413/"
      }
    ],
    "shapeLabel": "宽口圆腹"
  },
  {
    "id": "bizen",
    "name": "备前烧风格盆",
    "ja": "備前焼",
    "color": "#7e4d38",
    "rim": "#c78650",
    "ink": "#483125",
    "pattern": "fire",
    "note": "保留烧締土肌与火痕，选圆腹收口轮廓转成排水盆。",
    "shape": "jar",
    "kind": "ceramic",
    "sources": [
      {
        "label": "しょうざん · 备前植木鉢",
        "url": "https://bizen-shozan.com/bizenyaki-category/floral-organs/flower-pot/"
      },
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0418/"
      }
    ],
    "shapeLabel": "鼓腹壶形"
  },
  {
    "id": "mashiko",
    "name": "益子烧风格盆",
    "ja": "益子焼",
    "color": "#6a5b39",
    "rim": "#dac492",
    "ink": "#2d2f20",
    "pattern": "brush",
    "note": "参考益子窑元的开形植木鉢，外撇口、收底与纵向削纹。",
    "shape": "flare",
    "kind": "ceramic",
    "sources": [
      {
        "label": "よこやま · 开形植木鉢",
        "url": "https://www.shop.tougei.net/view/item/000000000509?category_page_id=ct94"
      },
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0404/"
      }
    ],
    "shapeLabel": "外撇钵"
  },
  {
    "id": "kasama",
    "name": "笠间烧风格盆",
    "ja": "笠間焼",
    "color": "#6c9381",
    "rim": "#c1cea7",
    "ink": "#345448",
    "pattern": "drip",
    "note": "笠间器形多样，选切立圆筒与流釉；不是该产地唯一的器型。",
    "shape": "cylinder",
    "kind": "ceramic",
    "sources": [
      {
        "label": "笠间烧协同组合 · 植木鉢展",
        "url": "https://kasamayaki.or.jp/akiichi/"
      },
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0403/"
      }
    ],
    "shapeLabel": "切立圆筒"
  },
  {
    "id": "mino",
    "name": "美浓烧·织部风格盆",
    "ja": "美濃焼",
    "color": "#4d7758",
    "rim": "#bcc584",
    "ink": "#1c362b",
    "pattern": "oribe",
    "note": "参考织部四足四方鉢：方口、折角器身与短足，配浓绿釉。",
    "shape": "square",
    "kind": "ceramic",
    "sources": [
      {
        "label": "美浓烧协同组合 · 织部四足四方鉢",
        "url": "https://www.minoyaki.gr.jp/archives/2939"
      },
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0406/"
      }
    ],
    "shapeLabel": "四足方钵"
  },
  {
    "id": "seto",
    "name": "濑户染付风格盆",
    "ja": "瀬戸染付焼",
    "color": "#cbd0ac",
    "rim": "#efe6ca",
    "ink": "#49738b",
    "pattern": "blue",
    "note": "染付蓝枝叶配宽口弧腹；白地留出空白。",
    "shape": "bowl",
    "kind": "ceramic",
    "sources": [
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0409/"
      }
    ],
    "shapeLabel": "宽口圆腹"
  },
  {
    "id": "kutani",
    "name": "九谷烧风格盆",
    "ja": "九谷焼",
    "color": "#d9be7e",
    "rim": "#eadcbb",
    "ink": "#5d824b",
    "pattern": "kutani",
    "note": "参考九谷木瓜鉢，四瓣轮廓、低腹与彩绘；改作有排水孔的盆。",
    "shape": "mokko",
    "kind": "ceramic",
    "sources": [
      {
        "label": "KUTANI SEAL · 木瓜鉢",
        "url": "https://www.kutaniseal.com/items/101475439"
      },
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0405/"
      }
    ],
    "shapeLabel": "木瓜钵"
  },
  {
    "id": "arita",
    "name": "有田烧风格盆",
    "ja": "伊万里・有田焼",
    "color": "#c2cfb5",
    "rim": "#f2ead3",
    "ink": "#406884",
    "pattern": "blue",
    "note": "轮花口沿配薄壁弧腹；参考有田轮花盛鉢后转作园艺盆。",
    "shape": "scallop",
    "kind": "ceramic",
    "sources": [
      {
        "label": "ARITA PORCELAIN LAB · 轮花盛鉢",
        "url": "https://aritaporcelainlab.com/catalog/jp/20150815/japan_autumn_20150815.pdf"
      },
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0424/"
      }
    ],
    "shapeLabel": "轮花钵"
  },
  {
    "id": "imari",
    "name": "伊万里烧风格盆",
    "ja": "伊万里・有田焼",
    "color": "#d3cda2",
    "rim": "#ecddc0",
    "ink": "#44677c",
    "pattern": "imari",
    "note": "白瓷、深蓝与赤色分区纹；选带高台的碗形转作排水盆。",
    "shape": "footed",
    "kind": "ceramic",
    "sources": [
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0424/"
      }
    ],
    "shapeLabel": "高台碗"
  },
  {
    "id": "hasami",
    "name": "波佐见烧风格盆",
    "ja": "波佐見焼",
    "color": "#b4d5c4",
    "rim": "#f3ebd6",
    "ink": "#4b7883",
    "pattern": "stripe",
    "note": "参考波佐见「いろは」荞麦杯的收底杯形，青白胎与细竖纹。",
    "shape": "cup",
    "kind": "ceramic",
    "sources": [
      {
        "label": "波佐见烧 · いろは器物",
        "url": "https://store.hasamiyaki.jp/html/page84.html"
      },
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0427/"
      }
    ],
    "shapeLabel": "收底杯形"
  },
  {
    "id": "kyoto",
    "name": "京烧·清水烧风格盆",
    "ja": "京焼・清水焼",
    "color": "#d5b074",
    "rim": "#e6d3ac",
    "ink": "#759359",
    "pattern": "flower",
    "note": "参考京烧菊割高台小鉢，花口与显露的高台让轮廓轻一些。",
    "shape": "pedestal",
    "kind": "ceramic",
    "sources": [
      {
        "label": "やまなか雅陶 · 菊割高台小鉢",
        "url": "https://www.yamanaka-gato.com/product/472"
      },
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0414/"
      }
    ],
    "shapeLabel": "菊割高台"
  },
  {
    "id": "hagi",
    "name": "萩烧风格盆",
    "ja": "萩焼",
    "color": "#bba387",
    "rim": "#e8d6ba",
    "ink": "#895e7b",
    "pattern": "crackle",
    "note": "参考萩烧窑元的轮花高台鉢，乳白粉釉与花瓣口沿。",
    "shape": "scallop",
    "kind": "ceramic",
    "sources": [
      {
        "label": "松光山 · 轮花高台鉢",
        "url": "https://shokouzan.stores.jp/items/655b72164e11f10767525274"
      },
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0419/"
      }
    ],
    "shapeLabel": "轮花钵"
  },
  {
    "id": "karatsu",
    "name": "唐津烧风格盆",
    "ja": "唐津焼",
    "color": "#bda266",
    "rim": "#e2d2a3",
    "ink": "#59442d",
    "pattern": "grass",
    "note": "铁绘草叶与灰黄釉，选弧腹、低高台的碗形转成园艺盆。",
    "shape": "footed",
    "kind": "ceramic",
    "sources": [
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0425/"
      }
    ],
    "shapeLabel": "高台碗"
  },
  {
    "id": "tobe",
    "name": "砥部烧风格盆",
    "ja": "砥部焼",
    "color": "#cdd3ad",
    "rim": "#f1ecd0",
    "ink": "#436780",
    "pattern": "scroll",
    "note": "参考梅山窑玉缘鉢，厚圆口沿、圆腹与青花卷草纹。",
    "shape": "rolled",
    "kind": "ceramic",
    "sources": [
      {
        "label": "梅山窑 · 玉缘鉢",
        "url": "https://baizangama.jp/catalog/catalog-cat/tamabuchi/"
      },
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0421/"
      }
    ],
    "shapeLabel": "玉缘钵"
  },
  {
    "id": "koishiwara",
    "name": "小石原烧风格盆",
    "ja": "小石原焼",
    "color": "#948052",
    "rim": "#e1cea3",
    "ink": "#44442b",
    "pattern": "dash",
    "note": "飞铇短点纹沿外撇器壁重复，宽口收底轮廓转作排水盆。",
    "shape": "flare",
    "kind": "ceramic",
    "sources": [
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0422/"
      }
    ],
    "shapeLabel": "外撇钵"
  },
  {
    "id": "ontayaki",
    "name": "丹波立杭烧风格盆",
    "ja": "丹波立杭焼",
    "color": "#8f6b4a",
    "rim": "#d2b171",
    "ink": "#4f4630",
    "pattern": "drip",
    "note": "参考丹波山椒壶的面取技法，把多面鼓腹和自然流釉转成宽口园艺盆。",
    "shape": "faceted",
    "kind": "ceramic",
    "sources": [
      {
        "label": "丹波立杭陶磁器协同组合 · 器物与技法",
        "url": "https://tanbayaki.com/tanbayaki/"
      },
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0415/"
      }
    ],
    "shapeLabel": "面取鼓腹"
  },
  {
    "id": "iga",
    "name": "伊贺烧风格盆",
    "ja": "伊賀焼",
    "color": "#82825a",
    "rim": "#c4d095",
    "ink": "#414a32",
    "pattern": "speckle",
    "note": "粗土肌与不规则灰绿釉；保留手作偏心口沿，宽腹收底。",
    "shape": "irregular",
    "kind": "ceramic",
    "sources": [
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0411/"
      }
    ],
    "shapeLabel": "手捏不整形"
  },
  {
    "id": "echizen",
    "name": "越前烧风格盆",
    "ja": "越前焼",
    "color": "#78563f",
    "rim": "#c39964",
    "ink": "#433728",
    "pattern": "fire",
    "note": "参考越前壶的收口、鼓肩与圆腹，开口放宽并加排水孔。",
    "shape": "jar",
    "kind": "ceramic",
    "sources": [
      {
        "label": "爱知县陶磁美术馆 · 越前壶",
        "url": "https://jmapps.ne.jp/aitou/det.html?data_id=538"
      },
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0412/"
      }
    ],
    "shapeLabel": "鼓腹壶形"
  },
  {
    "id": "tsuboya",
    "name": "壶屋烧风格盆",
    "ja": "壺屋焼",
    "color": "#959f6c",
    "rim": "#e3d79f",
    "ink": "#2d5e70",
    "pattern": "scroll",
    "note": "厚胎圆腹与外翻厚口沿，蓝绿刷绘；以产地器物为风格转译。",
    "shape": "rolled",
    "kind": "ceramic",
    "sources": [
      {
        "label": "传统工艺青山 Square",
        "url": "https://kougeihin.jp/craft/0431/"
      }
    ],
    "shapeLabel": "玉缘钵"
  },
  {
    "id": "terra",
    "name": "普通红陶盆",
    "color": "#704831",
    "rim": "#a37a4b",
    "ink": "#3b2c23",
    "shape": "round",
    "kind": "basic",
    "pattern": "plain",
    "note": "朴素红陶，有排水孔；适合大多数中小型植物。",
    "sources": [
      {
        "label": "RHS 容器栽培",
        "url": "https://www.rhs.org.uk/container-gardening"
      }
    ]
  },
  {
    "id": "plastic",
    "name": "黑色育苗盆",
    "color": "#323b33",
    "rim": "#646f59",
    "ink": "#1c2b26",
    "shape": "round",
    "kind": "basic",
    "pattern": "plain",
    "note": "轻便塑料盆，有排水孔；适合育苗和中小型植株。",
    "sources": [
      {
        "label": "RHS 容器栽培",
        "url": "https://www.rhs.org.uk/container-gardening"
      }
    ]
  },
  {
    "id": "white",
    "name": "白色塑料盆",
    "color": "#c1c3aa",
    "rim": "#e1dcb9",
    "ink": "#607164",
    "shape": "round",
    "kind": "basic",
    "pattern": "plain",
    "note": "浅色塑料盆，有排水孔；适合日常盆栽。",
    "sources": [
      {
        "label": "RHS 容器栽培",
        "url": "https://www.rhs.org.uk/container-gardening"
      }
    ]
  },
  {
    "id": "shallow",
    "name": "浅陶盘",
    "color": "#96794f",
    "rim": "#c6b079",
    "ink": "#5d5236",
    "shape": "shallow",
    "kind": "shallow",
    "pattern": "plain",
    "note": "浅盘有排水孔，供浅根多肉和低矮草花使用。",
    "sources": [
      {
        "label": "RHS 容器栽培",
        "url": "https://www.rhs.org.uk/container-gardening"
      }
    ]
  },
  {
    "id": "foam",
    "name": "泡沫种植箱",
    "color": "#b9b9a2",
    "rim": "#dbd6b6",
    "ink": "#797c6d",
    "shape": "box",
    "kind": "edible",
    "pattern": "plain",
    "note": "白色泡沫箱，底部设排水孔；适合葱、薄荷、叶菜和草莓。",
    "sources": [
      {
        "label": "RHS 容器栽培",
        "url": "https://www.rhs.org.uk/container-gardening"
      }
    ]
  },
  {
    "id": "trough",
    "name": "长条种植槽",
    "color": "#6a513a",
    "rim": "#a08456",
    "ink": "#3d3429",
    "shape": "box",
    "kind": "edible",
    "pattern": "plain",
    "note": "长槽有排水孔，留株距种香草、叶菜或草莓。",
    "sources": [
      {
        "label": "RHS 容器栽培",
        "url": "https://www.rhs.org.uk/container-gardening"
      }
    ]
  },
  {
    "id": "growbag",
    "name": "深型种植袋",
    "color": "#3a4c39",
    "rim": "#727f4b",
    "ink": "#243529",
    "shape": "bag",
    "kind": "large",
    "pattern": "plain",
    "note": "较深透气种植袋；适合番茄、辣椒和小果树。",
    "sources": [
      {
        "label": "RHS 容器栽培",
        "url": "https://www.rhs.org.uk/container-gardening"
      }
    ]
  },
  {
    "id": "deep",
    "name": "大型深陶盆",
    "color": "#6e4c34",
    "rim": "#a17a4c",
    "ink": "#3f3026",
    "shape": "deep",
    "kind": "large",
    "pattern": "plain",
    "note": "深盆有排水孔；留给灌木、较大根系和酸性介质。",
    "sources": [
      {
        "label": "RHS 容器栽培",
        "url": "https://www.rhs.org.uk/container-gardening"
      }
    ]
  },
  {
    "id": "basket",
    "name": "吊盆",
    "color": "#6d5235",
    "rim": "#9b8551",
    "ink": "#3b3529",
    "shape": "basket",
    "kind": "hanging",
    "pattern": "plain",
    "note": "带排水孔的吊盆，给垂枝留下空间；也可平放在花架上。",
    "sources": [
      {
        "label": "RHS 容器栽培",
        "url": "https://www.rhs.org.uk/container-gardening"
      }
    ]
  }
];
PLANTS.push(...EXPANSION);
export const plant=id=>PLANTS.find(p=>p.id===id);
export const vessel=id=>POTS.find(p=>p.id===id);
export const allowedPots=id=>{const p=plant(id);return p?POTS.filter(v=>p.containers.includes(v.id)):[]};

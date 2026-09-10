import {phenotypeFor} from './phenotypes.mjs?v=fieldnotes-5';
// Species Standard Draft v1.0 working baseline. Unknown evidence is intentionally empty.
// speed / wet / cover / notes preserve the v3 game. Phenotype data is resolved at runtime and never copied into a save.
export const SPECIES = [
  {
    "id": "dairy",
    "name": "奶牛",
    "label": "Dairy Cow",
    "taxon": "Porcellio cf. laevis “Dairy Cow”",
    "status": "参考分类为 Porcellio laevis；Dairy Cow 是人工培养线，精确种级身份保留 cf. 限定。",
    "speed": 1.2,
    "wet": 68,
    "cover": 45,
    "notes": [
      "奶白色甲片上，黑斑的位置各不相同。你本来准备给它们编号，现在开始依赖斑点。",
      "食物旁出现了新的缺口。搬运并没有发生，食物只是变小了一点。",
      "两块相似的黑斑先后经过同一块石头。今天的个体识别仍有商量余地。"
    ],
    "names": {
      "zhCN": "奶牛",
      "zhAliases": [],
      "zhNameType": "hobby_vernacular",
      "zhConfidence": "unknown",
      "en": "Dairy Cow",
      "enNameType": "trade_name",
      "ja": null,
      "jaAliases": []
    },
    "taxonomy": {
      "kingdom": "Animalia",
      "phylum": "Arthropoda",
      "class": "Malacostraca",
      "order": "Isopoda",
      "suborder": "Oniscidea",
      "family": null,
      "genus": "Porcellio",
      "species": null,
      "acceptedScientificName": null,
      "authority": null,
      "referenceTaxon": "Porcellio laevis",
      "genusStatus": "trade_assigned",
      "speciesStatus": "unresolved",
      "identificationQualifier": "cf.",
      "identificationConfidence": "unknown",
      "evidenceIds": []
    },
    "trade": {
      "designation": "Porcellio cf. laevis “Dairy Cow”",
      "tradeName": "Dairy Cow",
      "type": "cultured_line",
      "morph": null,
      "locality": null,
      "lineage": {
        "label": "Dairy Cow",
        "type": "cultured-line"
      },
      "tradeAliases": [],
      "evidenceIds": []
    },
    "biogeography": {
      "originCountry": null,
      "originRegion": null,
      "locality": null,
      "nativeRange": null,
      "distributionNotes": null,
      "confidence": "unknown",
      "evidenceIds": []
    },
    "profile": {
      "adultLengthMm": null,
      "adultLengthRangeMm": null,
      "ecology": [],
      "microhabitat": [],
      "behaviour": [],
      "notableMorphology": [
        "奶白底色、不规则深色 blotches；传统 *P. laevis* 形态为相对低平、背面较光滑，常与人类环境相邻；Dairy Cow 培养系本身的精确种级身份应保留谨慎。"
      ],
      "diagnosticNotes": [
        "参考分类为 Porcellio laevis；Dairy Cow 是人工培养线，精确种级身份保留 cf. 限定。"
      ],
      "conglobation": "unknown",
      "careDataStatus": "not_in_scope",
      "evidenceIds": []
    },
    "nomenclature": {
      "taxonomicStatus": "unresolved",
      "tradeStatus": "established",
      "vernacularStatus": "established_hobby",
      "lastReviewed": "2026-09-10",
      "provenance": "Species Data Standard Draft v1.0 working baseline; not independently reverified"
    },
    "literature": {
      "lines": [
        "它穿着奶牛的花纹，却从没见过草原。",
        "人类给它一个名字，它就在腐叶下面认真地活成另一种东西。"
      ],
      "basis": [
        {
          "claim": "奶白底色、不规则深色 blotches；传统 *P. laevis* 形态为相对低平、背面较光滑，常与人类环境相邻；Dairy Cow 培养系本身的精确种级身份应保留谨慎。",
          "evidenceIds": []
        }
      ],
      "themes": [
        "naming",
        "identity",
        "domestication"
      ]
    },
    "evidenceIds": [],
    "evidence": {
      "status": "pending_field_sources",
      "claims": []
    },
    "genetics": {
      "knowledge": "unknown",
      "model": null
    },
    "breeding": {
      "crossCompatibility": "unknown"
    }
  },
  {
    "id": "cappuccino",
    "name": "卡布奇诺",
    "label": "Cappuccino",
    "taxon": "“Cubaris” sp. “Cappuccino”",
    "status": "种级身份未定；属级归属采用贸易工作标注，不代表正式鉴定。",
    "speed": 0.72,
    "wet": 78,
    "cover": 70,
    "notes": [
      "浅色边缘从木片下露出来。背部的褐色与腐木几乎连在一起。",
      "一只在落叶边缘停下，另一只贴着它经过。两者都没有改变速度。",
      "你在记录上写了“咖啡色”。盒子里没有咖啡。"
    ],
    "names": {
      "zhCN": "卡布奇诺",
      "zhAliases": [],
      "zhNameType": "hobby_vernacular",
      "zhConfidence": "unknown",
      "en": "Cappuccino",
      "enNameType": "trade_name",
      "ja": null,
      "jaAliases": []
    },
    "taxonomy": {
      "kingdom": "Animalia",
      "phylum": "Arthropoda",
      "class": "Malacostraca",
      "order": "Isopoda",
      "suborder": "Oniscidea",
      "family": null,
      "genus": "Cubaris",
      "species": null,
      "acceptedScientificName": null,
      "authority": null,
      "referenceTaxon": null,
      "genusStatus": "tentative",
      "speciesStatus": "undescribed_or_unresolved",
      "identificationQualifier": "trade_assigned",
      "identificationConfidence": "unknown",
      "evidenceIds": []
    },
    "trade": {
      "designation": "“Cubaris” sp. “Cappuccino”",
      "tradeName": "Cappuccino",
      "type": "undescribed_trade_taxon",
      "morph": null,
      "locality": null,
      "lineage": null,
      "tradeAliases": [],
      "evidenceIds": []
    },
    "biogeography": {
      "originCountry": null,
      "originRegion": null,
      "locality": null,
      "nativeRange": null,
      "distributionNotes": null,
      "confidence": "unknown",
      "evidenceIds": []
    },
    "profile": {
      "adultLengthMm": null,
      "adultLengthRangeMm": null,
      "ecology": [],
      "microhabitat": [],
      "behaviour": [],
      "notableMorphology": [
        "咖啡褐、奶油色分区；圆厚、高拱；属级身份仍属 hobby trade assignment。"
      ],
      "diagnosticNotes": [
        "种级身份未定；属级归属采用贸易工作标注，不代表正式鉴定。"
      ],
      "conglobation": "unknown",
      "careDataStatus": "not_in_scope",
      "evidenceIds": []
    },
    "nomenclature": {
      "taxonomicStatus": "unresolved",
      "tradeStatus": "established",
      "vernacularStatus": "established_hobby",
      "lastReviewed": "2026-09-10",
      "provenance": "Species Data Standard Draft v1.0 working baseline; not independently reverified"
    },
    "literature": {
      "lines": [
        "咖啡色与奶油色在背上混合得恰到好处。",
        "至于它究竟是谁，分类学家还没喝到这一杯。"
      ],
      "basis": [
        {
          "claim": "咖啡褐、奶油色分区；圆厚、高拱；属级身份仍属 hobby trade assignment。",
          "evidenceIds": []
        }
      ],
      "themes": [
        "classification",
        "uncertainty"
      ]
    },
    "evidenceIds": [],
    "evidence": {
      "status": "pending_field_sources",
      "claims": []
    },
    "genetics": {
      "knowledge": "unknown",
      "model": null
    },
    "breeding": {
      "crossCompatibility": "unknown"
    }
  },
  {
    "id": "diablo",
    "name": "破坏神",
    "label": "Red Diablo",
    "taxon": "Ardentiella sp. “Red Diablo”",
    "status": "当前工作标注为 Ardentiella sp.；旧贸易标注 Merulanella sp. 不等于该品系已获正式描述。",
    "speed": 1.05,
    "wet": 73,
    "cover": 50,
    "notes": [
      "暗色背板之间有暖黄色线条。它在树皮高处停了一阵。",
      "红褐色边缘划过苔藓，随后落到阴影里。颜色在暗处变得不重要。",
      "那条醒目的纹路让你很容易找到它。容易被找到的是你眼里的它。"
    ],
    "names": {
      "zhCN": "破坏神",
      "zhAliases": [],
      "zhNameType": "hobby_vernacular",
      "zhConfidence": "unknown",
      "en": "Red Diablo",
      "enNameType": "trade_name",
      "ja": null,
      "jaAliases": []
    },
    "taxonomy": {
      "kingdom": "Animalia",
      "phylum": "Arthropoda",
      "class": "Malacostraca",
      "order": "Isopoda",
      "suborder": "Oniscidea",
      "family": null,
      "genus": "Ardentiella",
      "species": null,
      "acceptedScientificName": null,
      "authority": null,
      "referenceTaxon": null,
      "genusStatus": "trade_assigned",
      "speciesStatus": "undescribed_or_unresolved",
      "identificationQualifier": "trade_assigned",
      "identificationConfidence": "unknown",
      "evidenceIds": []
    },
    "trade": {
      "designation": "Ardentiella sp. “Red Diablo”",
      "tradeName": "Red Diablo",
      "type": "undescribed_trade_taxon",
      "morph": null,
      "locality": null,
      "lineage": null,
      "tradeAliases": [
        "Merulanella sp."
      ],
      "evidenceIds": []
    },
    "biogeography": {
      "originCountry": null,
      "originRegion": null,
      "locality": null,
      "nativeRange": null,
      "distributionNotes": null,
      "confidence": "unknown",
      "evidenceIds": []
    },
    "profile": {
      "adultLengthMm": null,
      "adultLengthRangeMm": null,
      "ecology": [],
      "microhabitat": [],
      "behaviour": [],
      "notableMorphology": [
        "暗色背部、暖黄/红橙高对比；当前 hobby identification 常置于 *Ardentiella*；“Red Diablo”是贸易名。"
      ],
      "diagnosticNotes": [
        "当前工作标注为 Ardentiella sp.；旧贸易标注 Merulanella sp. 不等于该品系已获正式描述。"
      ],
      "conglobation": "unknown",
      "careDataStatus": "not_in_scope",
      "evidenceIds": []
    },
    "nomenclature": {
      "taxonomicStatus": "unresolved",
      "tradeStatus": "established",
      "vernacularStatus": "established_hobby",
      "lastReviewed": "2026-09-10",
      "provenance": "Species Data Standard Draft v1.0 working baseline; not independently reverified"
    },
    "literature": {
      "lines": [
        "红、黄与黑如此郑重，仿佛它确实准备毁灭世界。",
        "实际上它只是经过一片腐叶，而且没有解释。"
      ],
      "basis": [
        {
          "claim": "暗色背部、暖黄/红橙高对比；当前 hobby identification 常置于 *Ardentiella*；“Red Diablo”是贸易名。",
          "evidenceIds": []
        }
      ],
      "themes": [
        "projection",
        "scale",
        "naming"
      ]
    },
    "evidenceIds": [],
    "evidence": {
      "status": "pending_field_sources",
      "claims": []
    },
    "genetics": {
      "knowledge": "unknown",
      "model": null
    },
    "breeding": {
      "crossCompatibility": "unknown"
    }
  },
  {
    "id": "echinatus",
    "name": "紫海胆",
    "label": "Echinatus",
    "taxon": "Porcellio echinatus",
    "status": "正式种名；资料采用项目规范工作基线，精确字段来源待补。",
    "speed": 0.94,
    "wet": 62,
    "cover": 45,
    "notes": [
      "背板的颗粒在侧光下显得很深。它把身体压在树皮边上。",
      "它从窄缝退出，换了一个角度，再次进去。入口没有变宽。",
      "棘纹没有让这次穿行更快。你仍然把它画得像一副盔甲。"
    ],
    "names": {
      "zhCN": "紫海胆",
      "zhAliases": [],
      "zhNameType": "hobby_vernacular",
      "zhConfidence": "unknown",
      "en": null,
      "enNameType": "taxon_label",
      "ja": null,
      "jaAliases": []
    },
    "taxonomy": {
      "kingdom": "Animalia",
      "phylum": "Arthropoda",
      "class": "Malacostraca",
      "order": "Isopoda",
      "suborder": "Oniscidea",
      "family": null,
      "genus": "Porcellio",
      "species": "echinatus",
      "acceptedScientificName": "Porcellio echinatus",
      "authority": "Lucas, 1849",
      "referenceTaxon": "Porcellio echinatus",
      "genusStatus": "accepted",
      "speciesStatus": "accepted_species",
      "identificationQualifier": null,
      "identificationConfidence": "unknown",
      "evidenceIds": []
    },
    "trade": {
      "designation": null,
      "tradeName": null,
      "type": "wild_species",
      "morph": null,
      "locality": null,
      "lineage": null,
      "tradeAliases": [],
      "evidenceIds": []
    },
    "biogeography": {
      "originCountry": null,
      "originRegion": null,
      "locality": null,
      "nativeRange": null,
      "distributionNotes": null,
      "confidence": "unknown",
      "evidenceIds": []
    },
    "profile": {
      "adultLengthMm": null,
      "adultLengthRangeMm": null,
      "ecology": [],
      "microhabitat": [],
      "behaviour": [],
      "notableMorphology": [
        "正式物种；背甲颗粒、结节/棘状 sculpture 明显；低平 Porcellio 型轮廓。"
      ],
      "diagnosticNotes": [
        "正式种名；资料采用项目规范工作基线，精确字段来源待补。"
      ],
      "conglobation": "unknown",
      "careDataStatus": "not_in_scope",
      "evidenceIds": []
    },
    "nomenclature": {
      "taxonomicStatus": "accepted_species",
      "tradeStatus": null,
      "vernacularStatus": "established_hobby",
      "lastReviewed": "2026-09-10",
      "provenance": "Species Data Standard Draft v1.0 working baseline; not independently reverified"
    },
    "literature": {
      "lines": [
        "它把甲壳做得像一套盔甲。",
        "也许危险从未出现，但防御先于理由存在。"
      ],
      "basis": [
        {
          "claim": "正式物种；背甲颗粒、结节/棘状 sculpture 明显；低平 Porcellio 型轮廓。",
          "evidenceIds": []
        }
      ],
      "themes": [
        "defence",
        "causality"
      ]
    },
    "evidenceIds": [],
    "evidence": {
      "status": "pending_field_sources",
      "claims": []
    },
    "genetics": {
      "knowledge": "unknown",
      "model": null
    },
    "breeding": {
      "crossCompatibility": "unknown"
    }
  },
  {
    "id": "pink",
    "name": "粉镭射",
    "label": "Pink Laser",
    "taxon": "“Cubaris” sp. “Pink Laser”",
    "status": "贸易品系名称存在混用；不据此确认与其他粉色品系同物。",
    "speed": 0.65,
    "wet": 78,
    "cover": 78,
    "notes": [
      "淡粉色背部中央有一条较暗的线。它很快被叶片遮住。",
      "湿土让浅色身体更显眼。它停在一粒土旁，触角慢慢扫过。",
      "记录上写着粉色。灯熄后，这一栏暂时失去了用途。"
    ],
    "names": {
      "zhCN": "粉镭射",
      "zhAliases": [],
      "zhNameType": "hobby_vernacular",
      "zhConfidence": "unknown",
      "en": "Pink Laser",
      "enNameType": "trade_name",
      "ja": null,
      "jaAliases": []
    },
    "taxonomy": {
      "kingdom": "Animalia",
      "phylum": "Arthropoda",
      "class": "Malacostraca",
      "order": "Isopoda",
      "suborder": "Oniscidea",
      "family": null,
      "genus": "Cubaris",
      "species": null,
      "acceptedScientificName": null,
      "authority": null,
      "referenceTaxon": null,
      "genusStatus": "tentative",
      "speciesStatus": "unresolved",
      "identificationQualifier": "trade_assigned",
      "identificationConfidence": "unknown",
      "evidenceIds": []
    },
    "trade": {
      "designation": "“Cubaris” sp. “Pink Laser”",
      "tradeName": "Pink Laser",
      "type": "trade_complex",
      "morph": null,
      "locality": null,
      "lineage": null,
      "tradeAliases": [],
      "evidenceIds": []
    },
    "biogeography": {
      "originCountry": null,
      "originRegion": null,
      "locality": null,
      "nativeRange": null,
      "distributionNotes": null,
      "confidence": "unknown",
      "evidenceIds": []
    },
    "profile": {
      "adultLengthMm": null,
      "adultLengthRangeMm": null,
      "ecology": [],
      "microhabitat": [],
      "behaviour": [],
      "notableMorphology": [
        "浅粉、低对比、半透明感；hobby lineage 命名存在混用风险。"
      ],
      "diagnosticNotes": [
        "贸易品系名称存在混用；不据此确认与其他粉色品系同物。"
      ],
      "conglobation": "unknown",
      "careDataStatus": "not_in_scope",
      "evidenceIds": []
    },
    "nomenclature": {
      "taxonomicStatus": "unresolved",
      "tradeStatus": "established",
      "vernacularStatus": "established_hobby",
      "lastReviewed": "2026-09-10",
      "provenance": "Species Data Standard Draft v1.0 working baseline; not independently reverified"
    },
    "literature": {
      "lines": [
        "人类分不清它究竟是哪一种粉，于是给粉色继续命名。",
        "它没有参加讨论。"
      ],
      "basis": [
        {
          "claim": "浅粉、低对比、半透明感；hobby lineage 命名存在混用风险。",
          "evidenceIds": []
        }
      ],
      "themes": [
        "categories",
        "observer"
      ]
    },
    "evidenceIds": [],
    "evidence": {
      "status": "pending_field_sources",
      "claims": []
    },
    "genetics": {
      "knowledge": "unknown",
      "model": null
    },
    "breeding": {
      "crossCompatibility": "unknown"
    }
  },
  {
    "id": "coros",
    "name": "高露丝",
    "label": "Coros",
    "taxon": "Porcellio spatulatus “Coros”",
    "status": "Coros 为产地系标签，不是另一个物种或人工色型。",
    "speed": 0.78,
    "wet": 62,
    "cover": 50,
    "notes": [
      "宽阔的浅色侧缘紧贴木片，像一小片有边的影子。",
      "身体很宽，却进入了你原以为太窄的缝。高度比面积更有用。",
      "它贴着表面不动。你在平面图上给它留了一个大位置。"
    ],
    "names": {
      "zhCN": "高露丝",
      "zhAliases": [],
      "zhNameType": "hobby_vernacular",
      "zhConfidence": "unknown",
      "en": "Coros",
      "enNameType": "trade_name",
      "ja": null,
      "jaAliases": []
    },
    "taxonomy": {
      "kingdom": "Animalia",
      "phylum": "Arthropoda",
      "class": "Malacostraca",
      "order": "Isopoda",
      "suborder": "Oniscidea",
      "family": null,
      "genus": "Porcellio",
      "species": "spatulatus",
      "acceptedScientificName": "Porcellio spatulatus",
      "authority": "Costa, 1882",
      "referenceTaxon": "Porcellio spatulatus",
      "genusStatus": "accepted",
      "speciesStatus": "accepted_species",
      "identificationQualifier": null,
      "identificationConfidence": "unknown",
      "evidenceIds": []
    },
    "trade": {
      "designation": "Porcellio spatulatus “Coros”",
      "tradeName": "Coros",
      "type": "locality",
      "morph": null,
      "locality": {
        "label": "Coros",
        "region": "Sardinia",
        "country": "Italy"
      },
      "lineage": null,
      "tradeAliases": [],
      "evidenceIds": []
    },
    "biogeography": {
      "originCountry": "Italy",
      "originRegion": "Sardinia",
      "locality": {
        "label": "Coros",
        "region": "Sardinia",
        "country": "Italy"
      },
      "nativeRange": null,
      "distributionNotes": null,
      "confidence": "trade_documented",
      "evidenceIds": []
    },
    "profile": {
      "adultLengthMm": null,
      "adultLengthRangeMm": null,
      "ecology": [],
      "microhabitat": [],
      "behaviour": [],
      "notableMorphology": [
        "*Porcellio spatulatus*；身体低而宽、epimera 视觉宽；Coros 应作为 locality / locality-line 处理。"
      ],
      "diagnosticNotes": [
        "Coros 为产地系标签，不是另一个物种或人工色型。"
      ],
      "conglobation": "unknown",
      "careDataStatus": "not_in_scope",
      "evidenceIds": []
    },
    "nomenclature": {
      "taxonomicStatus": "accepted_species",
      "tradeStatus": "established",
      "vernacularStatus": "established_hobby",
      "lastReviewed": "2026-09-10",
      "provenance": "Species Data Standard Draft v1.0 working baseline; not independently reverified"
    },
    "literature": {
      "lines": [
        "身体宽得像一张地图，名字却来自地图上的一点。",
        "地方定义了它；至少在人类的盒子外面是这样。"
      ],
      "basis": [
        {
          "claim": "*Porcellio spatulatus*；身体低而宽、epimera 视觉宽；Coros 应作为 locality / locality-line 处理。",
          "evidenceIds": []
        }
      ],
      "themes": [
        "map and territory",
        "locality"
      ]
    },
    "evidenceIds": [],
    "evidence": {
      "status": "pending_field_sources",
      "claims": []
    },
    "genetics": {
      "knowledge": "unknown",
      "model": null
    },
    "breeding": {
      "crossCompatibility": "unknown"
    }
  },
  {
    "id": "bolivari",
    "name": "玻利瓦里",
    "label": "Bolivari",
    "taxon": "Porcellio bolivari",
    "status": "正式种名；资料采用项目规范工作基线，精确字段来源待补。",
    "speed": 1.15,
    "wet": 60,
    "cover": 42,
    "notes": [
      "细长的触角先碰到盒壁，身体随后转向。黄色背线越过一片碎叶。",
      "它抬高身体跨过石粒。平面上的捷径原来有高度。",
      "长触角抵达的地方比身体更远。你画的边界略早结束了。"
    ],
    "names": {
      "zhCN": "玻利瓦里",
      "zhAliases": [
        "西班牙公主"
      ],
      "zhNameType": "hobby_vernacular",
      "zhConfidence": "unknown",
      "en": "Bolivari",
      "enNameType": "taxon_label",
      "ja": null,
      "jaAliases": []
    },
    "taxonomy": {
      "kingdom": "Animalia",
      "phylum": "Arthropoda",
      "class": "Malacostraca",
      "order": "Isopoda",
      "suborder": "Oniscidea",
      "family": null,
      "genus": "Porcellio",
      "species": "bolivari",
      "acceptedScientificName": "Porcellio bolivari",
      "authority": "Dollfus, 1892",
      "referenceTaxon": "Porcellio bolivari",
      "genusStatus": "accepted",
      "speciesStatus": "accepted_species",
      "identificationQualifier": null,
      "identificationConfidence": "unknown",
      "evidenceIds": []
    },
    "trade": {
      "designation": null,
      "tradeName": null,
      "type": "wild_species",
      "morph": null,
      "locality": null,
      "lineage": null,
      "tradeAliases": [],
      "evidenceIds": []
    },
    "biogeography": {
      "originCountry": null,
      "originRegion": null,
      "locality": null,
      "nativeRange": null,
      "distributionNotes": null,
      "confidence": "unknown",
      "evidenceIds": []
    },
    "profile": {
      "adultLengthMm": null,
      "adultLengthRangeMm": null,
      "ecology": [],
      "microhabitat": [],
      "behaviour": [],
      "notableMorphology": [
        "正式物种；大型、细长、长触角、明显 uropods；宠物圈存在黄色系培养线。"
      ],
      "diagnosticNotes": [
        "正式种名；资料采用项目规范工作基线，精确字段来源待补。"
      ],
      "conglobation": "unknown",
      "careDataStatus": "not_in_scope",
      "evidenceIds": []
    },
    "nomenclature": {
      "taxonomicStatus": "accepted_species",
      "tradeStatus": null,
      "vernacularStatus": "established_hobby",
      "lastReviewed": "2026-09-10",
      "provenance": "Species Data Standard Draft v1.0 working baseline; not independently reverified"
    },
    "literature": {
      "lines": [
        "它被叫作“西班牙公主”，大概因为黄色比泥土更容易进入历史。",
        "泥土对此没有意见。"
      ],
      "basis": [
        {
          "claim": "正式物种；大型、细长、长触角、明显 uropods；宠物圈存在黄色系培养线。",
          "evidenceIds": []
        }
      ],
      "themes": [
        "visibility",
        "history",
        "selection"
      ]
    },
    "evidenceIds": [],
    "evidence": {
      "status": "pending_field_sources",
      "claims": []
    },
    "genetics": {
      "knowledge": "unknown",
      "model": null
    },
    "breeding": {
      "crossCompatibility": "unknown"
    }
  },
  {
    "id": "ducky",
    "name": "鸭仔",
    "label": "Rubber Ducky",
    "taxon": "“Cubaris” sp. “Rubber Ducky”",
    "status": "种级身份未定；属级归属采用贸易工作标注，不代表正式鉴定。",
    "speed": 0.6,
    "wet": 80,
    "cover": 80,
    "notes": [
      "黄色头部露在木片外，深色背部还在阴影里。过了一会儿，头部也消失了。",
      "它缩成较圆的轮廓。等周围安静下来，触角重新伸出。",
      "“鸭”留在标签上。它沿着湿土继续做鼠妇做的事。"
    ],
    "names": {
      "zhCN": "鸭仔",
      "zhAliases": [
        "黄头鸭",
        "橡皮鸭"
      ],
      "zhNameType": "hobby_vernacular",
      "zhConfidence": "high",
      "en": "Rubber Ducky",
      "enNameType": "trade_name",
      "ja": null,
      "jaAliases": []
    },
    "taxonomy": {
      "kingdom": "Animalia",
      "phylum": "Arthropoda",
      "class": "Malacostraca",
      "order": "Isopoda",
      "suborder": "Oniscidea",
      "family": "Armadillidae",
      "genus": "Cubaris",
      "species": null,
      "acceptedScientificName": null,
      "authority": null,
      "referenceTaxon": null,
      "genusStatus": "tentative",
      "speciesStatus": "undescribed_or_unresolved",
      "identificationQualifier": "trade_assigned",
      "identificationConfidence": "unknown",
      "evidenceIds": []
    },
    "trade": {
      "designation": "“Cubaris” sp. “Rubber Ducky”",
      "tradeName": "Rubber Ducky",
      "type": "undescribed_trade_taxon",
      "morph": null,
      "locality": null,
      "lineage": null,
      "tradeAliases": [],
      "evidenceIds": []
    },
    "biogeography": {
      "originCountry": "Thailand",
      "originRegion": null,
      "locality": null,
      "nativeRange": null,
      "distributionNotes": null,
      "confidence": "trade_documented",
      "evidenceIds": []
    },
    "profile": {
      "adultLengthMm": null,
      "adultLengthRangeMm": null,
      "ecology": [],
      "microhabitat": [],
      "behaviour": [],
      "notableMorphology": [
        "黄色头部与深色背部形成标志性反差；短宽、高拱、擅长卷曲；名称来自强烈的拟物联想。"
      ],
      "diagnosticNotes": [
        "种级身份未定；属级归属采用贸易工作标注，不代表正式鉴定。"
      ],
      "conglobation": "full_or_near_full",
      "careDataStatus": "not_in_scope",
      "evidenceIds": []
    },
    "nomenclature": {
      "taxonomicStatus": "unresolved",
      "tradeStatus": "established",
      "vernacularStatus": "established_hobby",
      "lastReviewed": "2026-09-10",
      "provenance": "Species Data Standard Draft v1.0 working baseline; not independently reverified"
    },
    "literature": {
      "lines": [
        "它的脸让人想起鸭子，于是它成了鸭仔。",
        "被观察者的命运之一，就是长得像观察者认识的东西。"
      ],
      "basis": [
        {
          "claim": "黄色头部与深色背部形成标志性反差；短宽、高拱、擅长卷曲；名称来自强烈的拟物联想。",
          "evidenceIds": []
        }
      ],
      "themes": [
        "anthropocentric naming",
        "observer and observed"
      ]
    },
    "evidenceIds": [],
    "evidence": {
      "status": "pending_field_sources",
      "claims": []
    },
    "genetics": {
      "knowledge": "unknown",
      "model": null
    },
    "breeding": {
      "crossCompatibility": "unknown"
    }
  },
  {
    "id": "daxin",
    "name": "大新三色",
    "label": "Daxin Tricolor",
    "taxon": "Venezillo sp. “Daxin Tricolor”",
    "status": "种级身份未定；属级归属采用贸易工作标注，不代表正式鉴定。",
    "speed": 0.8,
    "wet": 76,
    "cover": 65,
    "notes": [
      "暖色头部、暗色中段、浅色尾端依次经过叶缘。",
      "你追着浅色尾端看了一会儿。它钻进木片，三种颜色一起离开。",
      "三种颜色只有一个方向。记录表分了三栏。"
    ],
    "names": {
      "zhCN": "大新三色",
      "zhAliases": [],
      "zhNameType": "hobby_vernacular",
      "zhConfidence": "unknown",
      "en": "Daxin Tricolor",
      "enNameType": "trade_name",
      "ja": null,
      "jaAliases": []
    },
    "taxonomy": {
      "kingdom": "Animalia",
      "phylum": "Arthropoda",
      "class": "Malacostraca",
      "order": "Isopoda",
      "suborder": "Oniscidea",
      "family": null,
      "genus": "Venezillo",
      "species": null,
      "acceptedScientificName": null,
      "authority": null,
      "referenceTaxon": null,
      "genusStatus": "trade_assigned",
      "speciesStatus": "undescribed_or_unresolved",
      "identificationQualifier": "trade_assigned",
      "identificationConfidence": "unknown",
      "evidenceIds": []
    },
    "trade": {
      "designation": "Venezillo sp. “Daxin Tricolor”",
      "tradeName": "Daxin Tricolor",
      "type": "undescribed_trade_taxon",
      "morph": null,
      "locality": null,
      "lineage": null,
      "tradeAliases": [],
      "evidenceIds": []
    },
    "biogeography": {
      "originCountry": "China",
      "originRegion": null,
      "locality": null,
      "nativeRange": null,
      "distributionNotes": null,
      "confidence": "trade_documented",
      "evidenceIds": []
    },
    "profile": {
      "adultLengthMm": null,
      "adultLengthRangeMm": null,
      "ecology": [],
      "microhabitat": [],
      "behaviour": [],
      "notableMorphology": [
        "前、中、后明显三色区；当前 hobby identification 常置于 *Venezillo* sp.；中国来源贸易记录。"
      ],
      "diagnosticNotes": [
        "种级身份未定；属级归属采用贸易工作标注，不代表正式鉴定。"
      ],
      "conglobation": "unknown",
      "careDataStatus": "not_in_scope",
      "evidenceIds": []
    },
    "nomenclature": {
      "taxonomicStatus": "unresolved",
      "tradeStatus": "established",
      "vernacularStatus": "established_hobby",
      "lastReviewed": "2026-09-10",
      "provenance": "Species Data Standard Draft v1.0 working baseline; not independently reverified"
    },
    "literature": {
      "lines": [
        "三种颜色把身体分成三段，人类因此觉得它很好理解。",
        "它们每天一起向同一个方向走。"
      ],
      "basis": [
        {
          "claim": "前、中、后明显三色区；当前 hobby identification 常置于 *Venezillo* sp.；中国来源贸易记录。",
          "evidenceIds": []
        }
      ],
      "themes": [
        "division",
        "unity",
        "classification"
      ]
    },
    "evidenceIds": [],
    "evidence": {
      "status": "pending_field_sources",
      "claims": []
    },
    "genetics": {
      "knowledge": "unknown",
      "model": null
    },
    "breeding": {
      "crossCompatibility": "unknown"
    }
  },
  {
    "id": "ember",
    "name": "火蜂",
    "label": "Ember Bee",
    "taxon": "Ardentiella sp. “Ember Bee”",
    "status": "当前工作标注为 Ardentiella sp.；种级身份仍未确定。",
    "speed": 1.12,
    "wet": 72,
    "cover": 50,
    "notes": [
      "暗色背板边缘有细窄的橙红色。它越过树皮上一道凸起。",
      "它在较高的木片上停下，触角伸向下面。这里的地面不只有一层。",
      "边缘像余烬，但没有热量。温度计没有为比喻留位置。"
    ],
    "names": {
      "zhCN": "火蜂",
      "zhAliases": [],
      "zhNameType": "hobby_vernacular",
      "zhConfidence": "unknown",
      "en": "Ember Bee",
      "enNameType": "trade_name",
      "ja": null,
      "jaAliases": []
    },
    "taxonomy": {
      "kingdom": "Animalia",
      "phylum": "Arthropoda",
      "class": "Malacostraca",
      "order": "Isopoda",
      "suborder": "Oniscidea",
      "family": null,
      "genus": "Ardentiella",
      "species": null,
      "acceptedScientificName": null,
      "authority": null,
      "referenceTaxon": null,
      "genusStatus": "trade_assigned",
      "speciesStatus": "undescribed_or_unresolved",
      "identificationQualifier": "trade_assigned",
      "identificationConfidence": "unknown",
      "evidenceIds": []
    },
    "trade": {
      "designation": "Ardentiella sp. “Ember Bee”",
      "tradeName": "Ember Bee",
      "type": "undescribed_trade_taxon",
      "morph": null,
      "locality": null,
      "lineage": null,
      "tradeAliases": [
        "Merulanella sp."
      ],
      "evidenceIds": []
    },
    "biogeography": {
      "originCountry": null,
      "originRegion": null,
      "locality": null,
      "nativeRange": null,
      "distributionNotes": null,
      "confidence": "unknown",
      "evidenceIds": []
    },
    "profile": {
      "adultLengthMm": null,
      "adultLengthRangeMm": null,
      "ecology": [],
      "microhabitat": [],
      "behaviour": [],
      "notableMorphology": [
        "暗色背部与橙、红、琥珀色侧缘；当前 hobby identification 常置于 *Ardentiella*。"
      ],
      "diagnosticNotes": [
        "当前工作标注为 Ardentiella sp.；种级身份仍未确定。"
      ],
      "conglobation": "unknown",
      "careDataStatus": "not_in_scope",
      "evidenceIds": []
    },
    "nomenclature": {
      "taxonomicStatus": "unresolved",
      "tradeStatus": "established",
      "vernacularStatus": "established_hobby",
      "lastReviewed": "2026-09-10",
      "provenance": "Species Data Standard Draft v1.0 working baseline; not independently reverified"
    },
    "literature": {
      "lines": [
        "看起来像火，也像蜂。",
        "两个比喻叠在一起之后，真正的动物反而安静了。"
      ],
      "basis": [
        {
          "claim": "暗色背部与橙、红、琥珀色侧缘；当前 hobby identification 常置于 *Ardentiella*。",
          "evidenceIds": []
        }
      ],
      "themes": [
        "metaphor",
        "language"
      ]
    },
    "evidenceIds": [],
    "evidence": {
      "status": "pending_field_sources",
      "claims": []
    },
    "genetics": {
      "knowledge": "unknown",
      "model": null
    },
    "breeding": {
      "crossCompatibility": "unknown"
    }
  },
  {
    "id": "amber",
    "name": "琥珀",
    "label": "Amber Ducky",
    "taxon": "“Cubaris” sp. “Amber Ducky”",
    "status": "种级身份未定；属级归属采用贸易工作标注，不代表正式鉴定。",
    "speed": 0.68,
    "wet": 78,
    "cover": 72,
    "notes": [
      "琥珀色身体中间有一块暗带。它贴着树皮下沿移动。",
      "浅色头部钻进叶片，暗带随后经过。尾端比你预想的晚一点消失。",
      "同样的颜色出现在枯叶上。标签只贴在其中一种东西旁边。"
    ],
    "names": {
      "zhCN": "琥珀",
      "zhAliases": [],
      "zhNameType": "hobby_vernacular",
      "zhConfidence": "unknown",
      "en": "Amber Ducky",
      "enNameType": "trade_name",
      "ja": null,
      "jaAliases": []
    },
    "taxonomy": {
      "kingdom": "Animalia",
      "phylum": "Arthropoda",
      "class": "Malacostraca",
      "order": "Isopoda",
      "suborder": "Oniscidea",
      "family": null,
      "genus": "Cubaris",
      "species": null,
      "acceptedScientificName": null,
      "authority": null,
      "referenceTaxon": null,
      "genusStatus": "tentative",
      "speciesStatus": "undescribed_or_unresolved",
      "identificationQualifier": "trade_assigned",
      "identificationConfidence": "unknown",
      "evidenceIds": []
    },
    "trade": {
      "designation": "“Cubaris” sp. “Amber Ducky”",
      "tradeName": "Amber Ducky",
      "type": "undescribed_trade_taxon",
      "morph": null,
      "locality": null,
      "lineage": null,
      "tradeAliases": [],
      "evidenceIds": []
    },
    "biogeography": {
      "originCountry": null,
      "originRegion": null,
      "locality": null,
      "nativeRange": null,
      "distributionNotes": null,
      "confidence": "unknown",
      "evidenceIds": []
    },
    "profile": {
      "adultLengthMm": null,
      "adultLengthRangeMm": null,
      "ecology": [],
      "microhabitat": [],
      "behaviour": [],
      "notableMorphology": [
        "暖金、琥珀色主体；中段深色 saddle；高拱、短宽。"
      ],
      "diagnosticNotes": [
        "种级身份未定；属级归属采用贸易工作标注，不代表正式鉴定。"
      ],
      "conglobation": "unknown",
      "careDataStatus": "not_in_scope",
      "evidenceIds": []
    },
    "nomenclature": {
      "taxonomicStatus": "unresolved",
      "tradeStatus": "established",
      "vernacularStatus": "established_hobby",
      "lastReviewed": "2026-09-10",
      "provenance": "Species Data Standard Draft v1.0 working baseline; not independently reverified"
    },
    "literature": {
      "lines": [
        "光落在它身上时，我们叫它琥珀。",
        "光离开以后，它仍然在那里；名字暂时失去工作。"
      ],
      "basis": [
        {
          "claim": "暖金、琥珀色主体；中段深色 saddle；高拱、短宽。",
          "evidenceIds": []
        }
      ],
      "themes": [
        "perception",
        "persistence"
      ]
    },
    "evidenceIds": [],
    "evidence": {
      "status": "pending_field_sources",
      "claims": []
    },
    "genetics": {
      "knowledge": "unknown",
      "model": null
    },
    "breeding": {
      "crossCompatibility": "unknown"
    }
  },
  {
    "id": "vex",
    "name": "维克斯",
    "label": "Vex",
    "taxon": "Troglodillo sp. “Vex”",
    "status": "种级身份未定；属级归属采用贸易工作标注，不代表正式鉴定。",
    "speed": 0.52,
    "wet": 76,
    "cover": 82,
    "notes": [
      "宽厚的背板露出一小段浅色边缘。其余部分还在木片下面。",
      "它移动得很少，但两次记录的位置并不相同。",
      "你把这段时间记为“没有变化”。稍后发现它已经换了一面朝向。"
    ],
    "names": {
      "zhCN": "维克斯",
      "zhAliases": [],
      "zhNameType": "hobby_vernacular",
      "zhConfidence": "unknown",
      "en": "Vex",
      "enNameType": "trade_name",
      "ja": null,
      "jaAliases": []
    },
    "taxonomy": {
      "kingdom": "Animalia",
      "phylum": "Arthropoda",
      "class": "Malacostraca",
      "order": "Isopoda",
      "suborder": "Oniscidea",
      "family": null,
      "genus": "Troglodillo",
      "species": null,
      "acceptedScientificName": null,
      "authority": null,
      "referenceTaxon": null,
      "genusStatus": "trade_assigned",
      "speciesStatus": "undescribed_or_unresolved",
      "identificationQualifier": "trade_assigned",
      "identificationConfidence": "unknown",
      "evidenceIds": []
    },
    "trade": {
      "designation": "Troglodillo sp. “Vex”",
      "tradeName": "Vex",
      "type": "undescribed_trade_taxon",
      "morph": null,
      "locality": null,
      "lineage": null,
      "tradeAliases": [],
      "evidenceIds": []
    },
    "biogeography": {
      "originCountry": null,
      "originRegion": null,
      "locality": null,
      "nativeRange": null,
      "distributionNotes": null,
      "confidence": "unknown",
      "evidenceIds": []
    },
    "profile": {
      "adultLengthMm": null,
      "adultLengthRangeMm": null,
      "ecology": [],
      "microhabitat": [],
      "behaviour": [],
      "notableMorphology": [
        "极宽、厚重、高拱，甲片 overlap 明显；流通为 *Troglodillo* sp. “Vex”，但未有正式种级描述确认。"
      ],
      "diagnosticNotes": [
        "种级身份未定；属级归属采用贸易工作标注，不代表正式鉴定。"
      ],
      "conglobation": "unknown",
      "careDataStatus": "not_in_scope",
      "evidenceIds": []
    },
    "nomenclature": {
      "taxonomicStatus": "unresolved",
      "tradeStatus": "established",
      "vernacularStatus": "established_hobby",
      "lastReviewed": "2026-09-10",
      "provenance": "Species Data Standard Draft v1.0 working baseline; not independently reverified"
    },
    "literature": {
      "lines": [
        "它看起来像一块从很久以前留下来的盔甲。",
        "“古老”通常只是我们不知道该把陌生放在哪个年代。"
      ],
      "basis": [
        {
          "claim": "极宽、厚重、高拱，甲片 overlap 明显；流通为 *Troglodillo* sp. “Vex”，但未有正式种级描述确认。",
          "evidenceIds": []
        }
      ],
      "themes": [
        "time",
        "unfamiliarity"
      ]
    },
    "evidenceIds": [],
    "evidence": {
      "status": "pending_field_sources",
      "claims": []
    },
    "genetics": {
      "knowledge": "unknown",
      "model": null
    },
    "breeding": {
      "crossCompatibility": "unknown"
    }
  },
  {
    "id": "orange",
    "name": "橘化科孚岛彩斑",
    "label": "Orange",
    "taxon": "Armadillidium frontetriangulum “Orange”",
    "status": "Orange 为人工选择色型，不是亚种；不由名称推断该培养线的采集地。",
    "speed": 0.83,
    "wet": 66,
    "cover": 55,
    "notes": [
      "橙褐色背板上有几列浅点。它在石头旁收拢，轮廓变短了。",
      "身体展开后，浅点重新排成几行。它并没有回到刚才的位置。",
      "你用点的数量辨认它。它用什么辨认这里，表格没有这一项。"
    ],
    "names": {
      "zhCN": "橘化科孚岛彩斑",
      "zhAliases": [],
      "zhNameType": "hobby_vernacular",
      "zhConfidence": "unknown",
      "en": "Orange",
      "enNameType": "trade_name",
      "ja": null,
      "jaAliases": []
    },
    "taxonomy": {
      "kingdom": "Animalia",
      "phylum": "Arthropoda",
      "class": "Malacostraca",
      "order": "Isopoda",
      "suborder": "Oniscidea",
      "family": null,
      "genus": "Armadillidium",
      "species": "frontetriangulum",
      "acceptedScientificName": "Armadillidium frontetriangulum",
      "authority": "Verhoeff, 1901",
      "referenceTaxon": "Armadillidium frontetriangulum",
      "genusStatus": "accepted",
      "speciesStatus": "accepted_species",
      "identificationQualifier": null,
      "identificationConfidence": "unknown",
      "evidenceIds": []
    },
    "trade": {
      "designation": "Armadillidium frontetriangulum “Orange”",
      "tradeName": "Orange",
      "type": "morph",
      "morph": "Orange",
      "locality": null,
      "lineage": null,
      "tradeAliases": [],
      "evidenceIds": []
    },
    "biogeography": {
      "originCountry": null,
      "originRegion": null,
      "locality": null,
      "nativeRange": null,
      "distributionNotes": null,
      "confidence": "unknown",
      "evidenceIds": []
    },
    "profile": {
      "adultLengthMm": null,
      "adultLengthRangeMm": null,
      "ecology": [],
      "microhabitat": [],
      "behaviour": [],
      "notableMorphology": [
        "reference taxon 为 *Armadillidium frontetriangulum*；Orange 为人工选择色型；紧凑椭圆、可卷球语法，橙色基底配较规律浅色点列。"
      ],
      "diagnosticNotes": [
        "Orange 为人工选择色型，不是亚种；不由名称推断该培养线的采集地。"
      ],
      "conglobation": "full",
      "careDataStatus": "not_in_scope",
      "evidenceIds": []
    },
    "nomenclature": {
      "taxonomicStatus": "accepted_species",
      "tradeStatus": "established",
      "vernacularStatus": "established_hobby",
      "lastReviewed": "2026-09-10",
      "provenance": "Species Data Standard Draft v1.0 working baseline; not independently reverified"
    },
    "literature": {
      "lines": [
        "橙色是后来被选择出来的。",
        "自然产生差异，人类负责把其中一个差异留下来，并郑重地给它加上引号。"
      ],
      "basis": [
        {
          "claim": "reference taxon 为 *Armadillidium frontetriangulum*；Orange 为人工选择色型；紧凑椭圆、可卷球语法，橙色基底配较规律浅色点列。",
          "evidenceIds": []
        }
      ],
      "themes": [
        "artificial selection",
        "contingency"
      ]
    },
    "evidenceIds": [],
    "evidence": {
      "status": "pending_field_sources",
      "claims": []
    },
    "genetics": {
      "knowledge": "unknown",
      "model": null
    },
    "breeding": {
      "crossCompatibility": "unknown"
    }
  }
];
for(const p of SPECIES) p.visual=phenotypeFor(p.id);
export const speciesById=id=>SPECIES.find(s=>s.id===id)||SPECIES[0];

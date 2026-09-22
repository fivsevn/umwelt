# Isopod Species Data Standard
## 企划-umwelt系列 / 鼠妇资料规范化与图鉴资产

**文档状态：** Implementation Baseline v1.1 · 2026-09-13  
**用途：** 项目长期资产；规范 Umwelt 仓库 `isopoda/` 当前 13 个条目的资料、游戏兼容字段、证据状态，以及未来真实/幻想条目的扩展方式。  
**配套文档：** `morphology-renderer-spec.md`  
**核心原则：** 资料层先回答“它是什么、我们凭什么这样说”；形态层再回答“它长成什么结构、如何被渲染”。

---

# 0. 文档定位

本文件解决五个问题：

1. **一个鼠妇条目应该保存哪些资料；**
2. **正式学名、未定种、贸易名、中文俗名、产地系、人工色型如何严格区分；**
3. **每条信息应由什么级别的来源支撑；**
4. **图鉴中的文学描述如何保持“有事实依据的哲学感”，而不是脱离动物本身的空泛抒情；**
5. **未来加入真实新种与幻想种时，如何沿用同一套系统而不污染科学资料层。**

本文件不负责 CSS 绘图实现。  
外部形态、P1–P7、cephalon、epimera、pleon、pleotelson、uropods、conglobation、molt、pattern grammar 等，由 `morphology-renderer-spec.md` 负责。

两份规范通过稳定的 `species.id` 对接：

```js
{
  id: "ducky",

  names: { ... },
  taxonomy: { ... },
  trade: { ... },
  biogeography: { ... },
  profile: { ... },
  literature: { ... },
  evidence: { ... },

  visual: { ... } // morphology-renderer-spec.md
}
```

---


## 0.1 当前代码实现快照｜2026-09-13

当前 `species.mjs` 已经采用本规范的大部分结构，但为了兼容现有游戏，还保留一组顶层字段。

当前实际条目结构可以理解为：

```text
A. 游戏兼容 / 展示快捷字段
   id
   name
   label
   taxon
   status
   speed
   wet
   cover
   notes

B. 资料规范字段
   names
   taxonomy
   trade
   biogeography
   profile
   nomenclature
   literature
   evidenceIds
   evidence
   genetics
   breeding

C. 运行时视觉字段
   visual = phenotypeFor(id)
```

其中必须长期区分：

```text
speed / wet / cover      → [GAME]
notes                    → [GAME / NARRATIVE]
visual                   → [RENDER]
taxonomy / trade / etc.  → KNOWLEDGE DATA
```

`wet` 与 `cover` 当前参与游戏环境初始值和 care scoring，**不是饲养处方或实测生态阈值**。  
`speed` 是游戏移动倍率，**不是生物学速度测量值**。

当前 `visual` 不在每条 species 对象中手工重复保存；文件末尾统一执行：

```js
for (const p of SPECIES) {
  p.visual = phenotypeFor(p.id);
}
```

这样存档只需要稳定 `species.id`，不会把 taxonomy、sources 或 phenotype 大对象复制进 save。

### 当前证据状态

当前 13 个条目已经完成“规范化字段迁移”，但**尚未完成逐字段独立资料核验**。

代码目前明确保留：

```js
evidenceIds: []

evidence: {
  status: "pending_field_sources",
  claims: []
}
```

`sources.mjs` 当前的 species-level：

```js
sources = []
evidence = []
```

只存在：

- 2 条共享 morphology framework source；
- WoRMS / GBIF / Catalogue of Life / Isopod Site 等检索入口。

因此本文件中的 13 种 taxonomy / trade baseline 应继续理解为：

> **项目 working baseline，不等于已经逐条建立证据链的最终数据库。**

# 1. 总体原则

## 1.1 Species data 描述“人类目前知道什么”

任何字段都必须先区分：

```text
[FACT]
正式分类、原始描述、修订论文或可靠数据库支持。

[REFERENCE]
可靠专业资料或稳定照片能支持，但不是正式分类命名行为。

[TRADE]
宠物贸易与饲养圈使用的名称、属级归属、morph / locality / strain。

[VERNACULAR]
中文、英文、日文等自然语言俗名。

[INFERENCE]
项目根据多来源作出的谨慎综合判断；必须标注置信度。

[GAME]
为了玩法、视觉或叙事而定义的参数。

[FICTION]
明确属于世界观或幻想生物设定。

[UNKNOWN]
目前资料不足，不猜。
```

核心纪律：

> **Unknown 不是缺陷；把未知伪装成确定才是。**

---

## 1.2 Taxonomy ≠ Trade identity ≠ Common name

以下四种东西不得再混进同一个字符串：

### 正式种名

```text
Porcellio echinatus Lucas, 1849
```

### 未定种贸易标注

```text
“Cubaris” sp. “Rubber Ducky”
```

### 人工色型 / 产地系

```text
Armadillidium frontetriangulum “Orange”
Porcellio spatulatus “Coros”
```

### 中文圈叫法

```text
鸭仔
紫海胆
高露丝
西班牙柠檬黄
```

它们分别回答不同的问题：

```text
正式种名 → 分类学上它是谁？
贸易标注 → 宠物圈目前怎样识别和流通它？
色型/产地系 → 同种内部这批个体来自什么选择或地理来源？
俗名 → 某个语言社群通常怎样叫它？
```

---

# 2. 命名规则

## 2.1 Scientific name

正式双名法：

```text
Genus species
```

显示时：

- 属名首字母大写；
- 种加词小写；
- 属名 + 种加词使用斜体；
- 命名者与年份不斜体；
- 数据库存纯文本，UI 决定斜体。

示例：

```text
Porcellio bolivari
authority: "Dollfus, 1892"
```

UI：

> *Porcellio bolivari* Dollfus, 1892

---

## 2.2 `sp.`

`sp.` 表示只确认到属、种级身份未确定。

```text
Cubaris sp.
Venezillo sp.
Troglodillo sp.
```

`sp.`：

- 不斜体；
- 不等于 species 名；
- 不可被当成“这个动物的正式学名”。

---

## 2.3 可疑属级归属

大量东南亚 hobby isopod 的属级归属并未通过正式修订确认。

建议数据层：

```js
genus: "Cubaris",
genusStatus: "tentative",
```

UI 可显示：

```text
“Cubaris” sp. “Rubber Ducky”
```

引号表示：

> 当前贸易圈通常这样放置，但项目不宣称这是经过正式分类学确认的属级身份。

---

## 2.4 Trade name

贸易名必须独立：

```js
tradeName: "Rubber Ducky"
```

不要写：

```js
species: "Rubber Ducky"
```

Trade name 不斜体。

---

## 2.5 Morph / Color morph

人工选择或稳定培养出的颜色 / 花纹型：

```js
morph: "Orange"
```

原则：

- morph 不是亚种；
- morph 不是 variety 的分类学意义；
- 不自动写进 `scientificName`；
- 可在显示层组成：

```text
Armadillidium frontetriangulum “Orange”
```

---

## 2.6 Locality

产地系：

```js
locality: {
  label: "Coros",
  region: "Sardinia",
  country: "Italy"
}
```

Locality 与 morph 分开。

**Coros 之类首先是 locality / locality-line，而不是“另一个物种”。**

---

## 2.7 Strain / Lineage

长期人工培养线：

```js
lineage: {
  label: "Dairy Cow",
  type: "cultured-line"
}
```

如果“某培养系是否确实属于当前标注物种”存在争议：

```js
referenceTaxon: "Porcellio laevis",
identificationQualifier: "cf.",
```

而不是硬写成无争议正式身份。

---

# 3. 中文名规范

中文名分三层。

```js
names: {
  zhCN: "鸭仔",
  zhAliases: ["黄头鸭", "橡皮鸭"],

  zhNameType: "hobby_vernacular",
  zhConfidence: "high"
}
```

## 3.1 `official_vernacular`

只有有可靠动物志、博物馆、国家/地区数据库或规范图鉴使用时采用。

## 3.2 `hobby_vernacular`

宠物圈长期稳定使用：

```text
鸭仔
紫海胆
高露丝
火蜂
```

它可以成为游戏主显示名，但页面应允许用户看到：

```text
中文俗名 / Hobby name
```

而不是误认为“正式中文学名”。

## 3.3 `project_translation`

如果没有稳定中文名，项目自行作出的译名：

```js
zhNameType: "project_translation"
```

必须保留原英文 Trade Name。

---

# 4. Source / Evidence 体系

> **当前实现状态：** source/evidence 架构已经存在，但 13 个条目的逐字段 `evidenceIds` 仍为空。检索目录不能替代 claim-level evidence。后续补资料时应逐条落到本节规则，而不是只往“参考资料”页面继续堆入口链接。

## 4.1 来源等级

建议使用：

| Level | 类型 | 用途 |
|---|---|---|
| `A1` | 原始描述、正式修订、同行评议论文 | 分类变更、原始形态、鉴别、命名 |
| `A2` | WoRMS / World List / Catalogue of Life / GBIF 等主干数据库 | accepted name、authority、family、synonym |
| `B1` | 国家博物馆、专业学会、科研机构数据库 | 区域分布、鉴定、形态、正式俗名 |
| `B2` | 专业等足类资料库 | hobby trade ID、照片、贸易名称、产地记录 |
| `C1` | 长期专业饲养资料 / 区域玩家图鉴 | hobby morph、中文圈俗名 |
| `C2` | 商家、论坛、社媒 | 仅作为“有人这样叫/这样流通”的证据 |
| `F` | Fiction / Project lore | 幻想物种设定 |

**C2 不得单独证明正式 taxonomy。**

---

## 4.2 每个来源必须声明支持哪些字段

```js
{
  id: "gbif-porcellio-bolivari",
  level: "A2",
  type: "taxonomy_database",
  title: "Porcellio bolivari Dollfus, 1892",
  publisher: "GBIF",
  url: "...",
  accessed: "2026-09-10",

  supports: [
    "taxonomy.acceptedScientificName",
    "taxonomy.authority",
    "taxonomy.family",
    "taxonomy.genus"
  ]
}
```

Trade source：

```js
{
  id: "isopodsite-daxin",
  level: "B2",
  type: "trade_identification",
  title: "Venezillo sp. “Daxin Tricolor”",
  publisher: "Isopod Site",
  url: "...",

  supports: [
    "trade.designation",
    "trade.tradeName",
    "biogeography.originCountry"
  ]
}
```

---

## 4.3 Source claim 与 confidence 分开

一个字段可能有来源，但来源只能证明“有人这样标”。

例如：

```js
taxonomy: {
  genus: "Troglodillo",
  genusStatus: "trade_assigned",
  confidence: "medium-low"
}
```

来源可以真实存在，但分类结论仍不必写成 high confidence。

---

# 5. 当前数据 Schema

当前运行中的 `species.mjs` 比最初建议 schema 多了一层“游戏兼容字段”。

```js
{
  // stable identity
  id: "ducky",

  // [GAME / UI COMPAT]
  name: "鸭仔",
  label: "Rubber Ducky",
  taxon: "“Cubaris” sp. “Rubber Ducky”",
  status: "种级身份未定……",

  speed: 0.7,   // 游戏移动倍率，不是实测速度
  wet: 78,      // 游戏环境基线，不是饲养处方
  cover: 70,    // 游戏环境基线
  notes: [
    "...", "...", "..."
  ],

  // KNOWLEDGE DATA
  names: { ... },
  taxonomy: { ... },
  trade: { ... },
  biogeography: { ... },
  profile: { ... },
  nomenclature: { ... },

  literature: {
    lines: [...],
    basis: [...],
    themes: [...]
  },

  evidenceIds: [],

  evidence: {
    status: "pending_field_sources",
    claims: []
  },

  genetics: {
    knowledge: "unknown",
    model: null
  },

  breeding: {
    crossCompatibility: "unknown"
  }

  // visual 不在这里手工重复写
}
```

运行时：

```js
p.visual = phenotypeFor(p.id)
```

`visual` 的 schema 由 `morphology-renderer-spec-umwelt.md` 定义。

## 5.1 顶层兼容字段的长期处理

当前不要急着删除：

```text
name
label
taxon
status
speed
wet
cover
notes
```

因为游戏控制器仍在使用它们。

但它们的语义必须明确：

| 字段 | 当前性质 |
|---|---|
| `name` | UI 快捷中文名 |
| `label` | UI 快捷英文 / trade label |
| `taxon` | UI 快捷 taxon/designation |
| `status` | UI 简短身份说明 |
| `speed` | `[GAME]` movement multiplier |
| `wet` | `[GAME]` humidity baseline / care comparison |
| `cover` | `[GAME]` 初始遮蔽物参数 |
| `notes` | `[GAME/NARRATIVE]` 夜间观察文本 |

未来如果 controller 完全切换到结构化字段，可以再移除 `name / label / taxon / status` 的重复；但 `speed / wet / cover` 应迁入明确的 `gameplay` 区域，而不是并入 `profile` 当成自然史事实。

# 6. 枚举值建议

## 6.1 `taxonomicStatus`

```text
accepted_species
accepted_subspecies
undescribed
unresolved
misidentified_trade
synonym
hybrid
fictional
```

## 6.2 `genusStatus`

```text
accepted
probable
tentative
trade_assigned
unknown
fictional
```

## 6.3 `trade.type`

```text
wild_species
undescribed_trade_taxon
morph
locality
cultured_line
hybrid
trade_complex
fictional_trade_taxon
```

## 6.4 confidence

```text
high
medium-high
medium
medium-low
low
unknown
```

避免假的百分比精度。

---

# 7. 当前图鉴 UI 与未来资料页

## 7.1 当前已经显示的内容

当前 `catalog.mjs` 的 specimen card 实际显示：

```text
SPECIMEN ID
鼠妇标本图
采集日期

中文主名
English / Trade name

accepted scientific name
或 trade designation

别名（如有）
morph / locality / lineage 标签（如有）

文学观察文本
```

如果没有 `acceptedScientificName`，页面会明确保留“不确定”的语气，而不是强行显示一个正式学名。

当前 Sources 页分成：

```text
关于身体      → frameworkSources
关于名字      → species-level sources（目前为空）
书架的入口    → sourceDirectory
```

并明确提示：

> 检索入口不等于逐条鉴定证据。

## 7.2 未来完整资料页建议

以下内容仍然是合理的下一阶段方向，但**目前尚未全部进入玩家 UI**：

```text
CLASSIFICATION
Family / Genus / Species / Status

ORIGIN
国家 / 地区 / Locality

IDENTIFICATION NOTE
genusStatus
identificationQualifier
identificationConfidence

CLAIMS / EVIDENCE
字段 → evidenceIds → source
```

不要在文档中把这套“未来详情页”写成当前已经上线的功能。

# 8. 文学描述规范

## 8.1 目标

每个品种 1–2 句话。

必须同时做到：

```text
真实形态 / 名称 / 生态事实
        ↓
一个轻微错位
        ↓
哲学意味
        ↓
幽默或留白
```

不要写成：

> “生命是宇宙的诗，我们都是孤独的旅人。”

因为它可以放在任何动物上。

应该写成：

> “它的脸让人想起鸭子，于是它成了鸭仔。被观察者的命运之一，就是长得像观察者认识的东西。”

只有 Rubber Ducky 特别成立。

---

## 8.2 推荐哲学母题

```text
命名
分类
身份同一性
观察者与被观察者
地图与领土
尺度
边界
个体与类型
复制与差异
时间
记忆
人工选择
自然选择
偶然性
相似性
缺席
未知
```

不要连续很多条都重复“人类无法理解自然”。

---

## 8.3 `literature.basis`

必须长期保留。

```js
literature: {
  lines: [...],

  basis: [
    {
      claim: "very wide epimera",
      evidenceIds: [...]
    },
    {
      claim: "Coros is used as a locality label",
      evidenceIds: [...]
    }
  ],

  themes: ["map and territory"]
}
```

文学文本可以修改，但 `basis` 保留事实锚点。

---

# 9. 当前 13 个条目的规范化基线

> 本表是当前项目的 **working baseline**，并已写入 `species.mjs`。  
> 但当前逐字段 `evidenceIds` 仍为空，因此它表示“代码当前采用的身份工作标注”，不是项目已经独立完成的最终分类学核验。  
> “正式物种”和“贸易身份”必须区别阅读。  
> 未描述 hobby taxa 的属级归属可随未来正式研究更新。

| id | 中文主名 | 英文 / Trade name | 正式学名 / Reference taxon | Trade designation | 类型 |
|---|---|---|---|---|---|
| `dairy` | 奶牛 | Dairy Cow | *Porcellio laevis* 作为 reference taxon | *Porcellio cf. laevis* “Dairy Cow” | cultured line / identity caution |
| `cappuccino` | 卡布奇诺 | Cappuccino | — | “*Cubaris*” sp. “Cappuccino” | undescribed trade taxon |
| `diablo` | 破坏神 | Red Diablo | — | *Ardentiella* sp. “Red Diablo” | undescribed trade taxon |
| `echinatus` | 紫海胆 | — | *Porcellio echinatus* Lucas, 1849 | — | accepted species |
| `pink` | 粉镭射 | Pink Laser | — | “*Cubaris*” sp. “Pink Laser” | trade lineage / unresolved identity |
| `coros` | 高露丝 | Coros | *Porcellio spatulatus* Costa, 1882 | *Porcellio spatulatus* “Coros” | locality line |
| `bolivari` | 玻利瓦里 | Bolivari | *Porcellio bolivari* Dollfus, 1892 | — | accepted species |
| `ducky` | 鸭仔 | Rubber Ducky | — | “*Cubaris*” sp. “Rubber Ducky” | undescribed trade taxon |
| `daxin` | 大新三色 | Daxin Tricolor | — | *Venezillo* sp. “Daxin Tricolor” | undescribed trade taxon |
| `ember` | 火蜂 | Ember Bee | — | *Ardentiella* sp. “Ember Bee” | undescribed trade taxon |
| `amber` | 琥珀 | Amber Ducky | — | “*Cubaris*” sp. “Amber Ducky” | undescribed trade taxon |
| `vex` | 维克斯 | Vex | — | *Troglodillo* sp. “Vex” | trade-assigned undescribed taxon |
| `orange` | 橘化科孚岛彩斑 | Orange / Corfu Orange | *Armadillidium frontetriangulum* Verhoeff, 1901 | *A. frontetriangulum* “Orange” | morph |

---

# 10. 当前 13 个条目的文学图鉴文本

## `dairy`｜奶牛 / Dairy Cow

**资料锚点：** 奶白底色、不规则深色 blotches；传统 *P. laevis* 形态为相对低平、背面较光滑，常与人类环境相邻；Dairy Cow 培养系本身的精确种级身份应保留谨慎。

> **它穿着奶牛的花纹，却从没见过草原。**  
> 人类给它一个名字，它就在腐叶下面认真地活成另一种东西。

**Themes:** naming / identity / domestication

---

## `cappuccino`｜卡布奇诺 / Cappuccino

**资料锚点：** 咖啡褐、奶油色分区；圆厚、高拱；属级身份仍属 hobby trade assignment。

> **咖啡色与奶油色在背上混合得恰到好处。**  
> 至于它究竟是谁，分类学家还没喝到这一杯。

**Themes:** classification / uncertainty

---

## `diablo`｜破坏神 / Red Diablo

**资料锚点：** 暗色背部、暖黄/红橙高对比；当前 hobby identification 常置于 *Ardentiella*；“Red Diablo”是贸易名。

> **红、黄与黑如此郑重，仿佛它确实准备毁灭世界。**  
> 实际上它只是经过一片腐叶，而且没有解释。

**Themes:** projection / scale / naming

---

## `echinatus`｜紫海胆 / *Porcellio echinatus*

**资料锚点：** 正式物种；背甲颗粒、结节/棘状 sculpture 明显；低平 Porcellio 型轮廓。

> **它把甲壳做得像一套盔甲。**  
> 也许危险从未出现，但防御先于理由存在。

**Themes:** defence / causality

---

## `pink`｜粉镭射 / Pink Laser

**资料锚点：** 浅粉、低对比、半透明感；hobby lineage 命名存在混用风险。

> **人类分不清它究竟是哪一种粉，于是给粉色继续命名。**  
> 它没有参加讨论。

**Themes:** categories / observer

---

## `coros`｜高露丝 / Coros

**资料锚点：** *Porcellio spatulatus*；身体低而宽、epimera 视觉宽；Coros 应作为 locality / locality-line 处理。

> **身体宽得像一张地图，名字却来自地图上的一点。**  
> 地方定义了它；至少在人类的盒子外面是这样。

**Themes:** map and territory / locality

---

## `bolivari`｜玻利瓦里 / *Porcellio bolivari*

**资料锚点：** 正式物种；大型、细长、长触角、明显 uropods；宠物圈存在黄色系培养线。

> **它被叫作“西班牙公主”，大概因为黄色比泥土更容易进入历史。**  
> 泥土对此没有意见。

**Themes:** visibility / history / selection

---

## `ducky`｜鸭仔 / Rubber Ducky

**资料锚点：** 黄色头部与深色背部形成标志性反差；短宽、高拱、擅长卷曲；名称来自强烈的拟物联想。

> **它的脸让人想起鸭子，于是它成了鸭仔。**  
> 被观察者的命运之一，就是长得像观察者认识的东西。

**Themes:** anthropocentric naming / observer and observed

---

## `daxin`｜大新三色 / Daxin Tricolor

**资料锚点：** 前、中、后明显三色区；当前 hobby identification 常置于 *Venezillo* sp.；中国来源贸易记录。

> **三种颜色把身体分成三段，人类因此觉得它很好理解。**  
> 它们每天一起向同一个方向走。

**Themes:** division / unity / classification

---

## `ember`｜火蜂 / Ember Bee

**资料锚点：** 暗色背部与橙、红、琥珀色侧缘；当前 hobby identification 常置于 *Ardentiella*。

> **看起来像火，也像蜂。**  
> 两个比喻叠在一起之后，真正的动物反而安静了。

**Themes:** metaphor / language

---

## `amber`｜琥珀 / Amber Ducky

**资料锚点：** 暖金、琥珀色主体；中段深色 saddle；高拱、短宽。

> **光落在它身上时，我们叫它琥珀。**  
> 光离开以后，它仍然在那里；名字暂时失去工作。

**Themes:** perception / persistence

---

## `vex`｜维克斯 / Vex

**资料锚点：** 极宽、厚重、高拱，甲片 overlap 明显；流通为 *Troglodillo* sp. “Vex”，但未有正式种级描述确认。

> **它看起来像一块从很久以前留下来的盔甲。**  
> “古老”通常只是我们不知道该把陌生放在哪个年代。

**Themes:** time / unfamiliarity

---

## `orange`｜橘化科孚岛彩斑 / Orange

**资料锚点：** reference taxon 为 *Armadillidium frontetriangulum*；Orange 为人工选择色型；紧凑椭圆、可卷球语法，橙色基底配较规律浅色点列。

> **橙色是后来被选择出来的。**  
> 自然产生差异，人类负责把其中一个差异留下来，并郑重地给它加上引号。

**Themes:** artificial selection / contingency

---

# 11. 当前重点分类事项

## 11.1 Red Diablo / Ember Bee

旧 hobby 文献和贸易资料常使用：

```text
Merulanella sp.
```

2025 年针对 *Merulanella* 的系统修订建立了 *Ardentiella* 等新属，并重新限制 *Merulanella* 的范围。

项目当前工作标注：

```text
Ardentiella sp. “Red Diablo”
Ardentiella sp. “Ember Bee”
```

但必须保留：

```text
speciesStatus: undescribed_or_unresolved
```

因为修订论文建立新属，不等于已经正式描述 “Red Diablo” / “Ember Bee” 这两个贸易实体。

---

## 11.2 Daxin Tricolor

当前工作标注：

```text
Venezillo sp. “Daxin Tricolor”
```

不要继续使用旧：

```text
Cubaris sp.
```

但 `Venezillo` 仍应记录为 hobby / trade identification，直到有更直接的正式分类证据。

---

## 11.3 Rubber Ducky

中文主显示：

```text
鸭仔
```

别名：

```text
黄头鸭
橡皮鸭
```

理由：

- “鸭仔”在简体中文宠物鼠妇语境中自然、简短；
- “黄头鸭”适合作为强识别别名；
- “Rubber Ducky”必须保留为国际 Trade Name；
- 不要把“鸭仔”写进 scientific name。

---

## 11.4 Dairy Cow

建议保守处理：

```text
referenceTaxon: Porcellio laevis
tradeName: Dairy Cow
identificationQualifier: cf.
```

即：

```text
Porcellio cf. laevis “Dairy Cow”
```

而不是把所有 Dairy Cow 培养线无条件声明成已被正式种级鉴定确认的 *P. laevis*。

---

# 12. 权威资料源目录

## 12.1 Taxonomy backbone

### World List of Marine, Freshwater and Terrestrial Isopod Crustaceans / WoRMS

用途：

- accepted names
- synonymy
- original references
- higher taxonomy

https://www.marinespecies.org/isopoda/

---

### GBIF Backbone Taxonomy

用途：

- accepted species
- authority
- family / genus
- distribution records入口
- 原始文献跳转

https://www.gbif.org/

---

### Catalogue of Life

用途：

- accepted taxon
- synonym
- hierarchy

https://www.catalogueoflife.org/

---

## 12.2 Terrestrial isopod morphology / identification

### British Myriapod and Isopod Group (BMIG)

用途：

- 欧洲 Oniscidea identification
- morphology
- distribution
- ecology

https://bmig.org.uk/

---

### Schmalfuss — World catalog of terrestrial isopods

用途：

- terrestrial Isopoda / Oniscidea 历史分类总表
- bibliography
- synonym / valid name 对照

建议作为历史与文献入口，不替代后续最新修订。

---

## 12.3 原始修订论文

### Kästle & Regalado Fernández — reassessment of *Merulanella*

用途：

- *Merulanella* 概念重审
- *Ardentiella* 等属的建立
- Red Diablo / Ember Bee 相关 hobby 属级讨论的分类背景

项目中应作为 `REVISION` 来源，而不是把论文误写成对每个贸易 morph 的正式描述。

---

## 12.4 Hobby trade identity

### Isopod Site

用途：

- hobby trade names
- 未描述东南亚种的当前流通属级归属
- origin / hobby locality
- 视觉照片参考
- trade aliases

https://isopod.site/

定位：

```text
专业 hobby / trade reference
≠ 正式 zoological nomenclature authority
```

---

# 13. 形态资料与本规范的接口

本项目已有 Morphology Renderer 规范。

Species Data 中只保存两类形态资料：

## 13.1 Natural-history claims

例如：

```js
profile: {
  notableMorphology: [
    "very wide epimera",
    "long projecting uropods",
    "strong dorsal tubercles"
  ]
}
```

这些属于自然史资料，可带 evidence。

## 13.2 Renderer coefficients

例如：

```js
visual: {
  body: {
    width: .86,
    convexity: .82
  }
}
```

这是 `[RENDER]`。

绝不能把：

```text
convexity: 0.82
```

写成“生物学测量值”。

---

# 14. 真实新种扩充流程

每新增一个真实品种，按以下顺序。

## Step 1｜锁定身份类型

先问：

```text
正式描述物种？
未描述贸易种？
morph？
locality？
cultured line？
hybrid？
身份混乱的 trade complex？
```

没搞清这一点之前不填 scientificName。

---

## Step 2｜查 taxonomy backbone

至少查：

```text
WoRMS / World List
GBIF / Catalogue of Life
```

若近期有属级修订，再查原论文。

---

## Step 3｜查 trade identity

如果是 hobby taxon：

```text
Isopod Site
长期专业饲养来源
区域 hobby nomenclature
```

---

## Step 4｜确定中文主名

优先级：

```text
稳定简中俗名
↓
稳定繁中俗名
↓
可靠日文/英文俗名的合理中文化
↓
项目译名
```

项目译名必须标 `project_translation`。

---

## Step 5｜建立形态资料

回答 Morphology Renderer 的 14 个问题：

```text
身体长宽？
拱度？
头部？
P1–P7？
epimera？
pleon？
pleotelson？
uropods？
触角？
surface？
palette？
patterns？
个体差异？
卷曲能力？
```

---

## Step 6｜写文学描述

只从：

```text
名字
真实结构
颜色
行为
产地
分类不确定性
人与它的关系
```

中生长出来。

---

# 15. 幻想品种规范

本项目以后可以增加幻想鼠妇，但必须继续使用同一 Schema。

## 15.1 幻想种不能伪装成真实分类学记录

例：

```js
taxonomy: {
  taxonomicStatus: "fictional",
  genusStatus: "fictional",

  fictionalScientificName: "Umbroporcellio memoriae"
}
```

必须：

```js
provenance: {
  realityStatus: "fictional",
  canon: "umwelt"
}
```

UI 可以让它看起来像正式图鉴，但底层必须知道它是 fiction。

---

## 15.2 三种幻想模式

### A. Speculative morph

基于真实物种的假想表型：

```text
referenceTaxon → 真实
phenotype → FICTION
taxonomy → 不变
```

例如：

> “如果某种色型被长期人工选择，会不会出现……”

不能宣称真实存在。

---

### B. Speculative species

以真实 Oniscidea anatomy 为基础构造不存在的物种。

需要遵守：

```text
7 pereonites
合理 pleon
合理 appendage
合理 conglobation logic
```

但颜色、生态、名称可幻想。

---

### C. Worldbuilding taxon

完全属于 Umwelt 世界观。

允许：

```text
虚构属
虚构种
虚构分布
虚构行为
```

但字段必须带：

```text
[FICTION]
```

---

# 16. 幻想物种也必须有 Evidence

幻想种的 Evidence 不是“科学证据”，而是“设定来源”。

```js
{
  id: "lore-umbroporcellio-001",
  level: "F",
  type: "project_lore",

  title: "Umbroporcellio memoriae concept note",

  supports: [
    "fictionalEcology",
    "fictionalMorphology",
    "fictionalDistribution"
  ]
}
```

这样真实资料和世界观资料仍然使用同一基础设施，但不会混淆。

---

# 17. 幻想品种设计检查

一个幻想鼠妇加入前，至少回答：

```text
1. 它是现实、推测还是纯幻想？
2. 是否基于真实 reference taxon？
3. 哪些结构遵守真实 Oniscidea body plan？
4. 哪些 trait 是刻意违反现实的？
5. 违反现实是否服务于世界观？
6. 中文名是什么性质？
7. “学名”是否明确标 fiction？
8. literature 文案基于哪个设定事实？
9. visual phenotype 如何进入 renderer？
10. genetics 是 documented、game-model 还是 fictional？
```

---

# 18. Genetics / Breeding 边界

当前代码仍然保持：

```js
genetics: {
  knowledge: "unknown",
  model: null
},

breeding: {
  crossCompatibility: "unknown"
}
```

截至当前游戏版本：

- 没有 genotype 模型；
- 没有真实遗传资料数据库；
- 没有 cross-compatibility 数据；
- 没有 breeding / hybridization 游戏系统；
- `patterns[]` 只是 phenotype renderer grammar，不是 gene；
- `seed` 只是稳定视觉与个体行为随机源，不是遗传种子。

因此即使后续设计已经讨论到“混入其他品种”“出现新品种”等玩法，在代码真正落地前也必须继续标为：

```text
future GAME MODEL
```

不得回写为：

```text
documented genetics
documented hybrid compatibility
```

未来若加入玩法模拟遗传：

```js
genetics: {
  knowledge: "game-model",
  model: { ... }
}
```

并且 UI / 文档都要明确它是游戏模型。

幻想种则使用：

```text
fictional
```

# 19. 版本与维护

## 19.1 Species data revision

每个条目仍建议维护：

```js
revision: {
  created: "2026-09-10",
  lastReviewed: "2026-09-13",
  taxonomyVersion: 1,
  literatureVersion: 1,
  visualVersion: 2
}
```

当前 `species.mjs` 尚未把 `revision` 对象正式写进每个条目，因此这仍是下一步 schema clean-up 项。

如果 taxonomy 变化：

```text
不要覆盖掉历史工作标注
→ previousIdentifications[]
```

## 19.2 与游戏存档版本分离

当前游戏 engine：

```js
VERSION = 3
```

Species 文档版本、taxonomyVersion、visualVersion 与游戏 save version 是不同概念。

当前 v3 save 只保存稳定的：

```text
species.id
seed
day / period / stage
环境与记录状态
```

不会把：

```text
taxonomy
literature
sources
visual
```

复制进存档。

因此正常的 taxonomy 文案修订或 renderer 调参不需要自动升级 save schema。

# 20. 数据完整性检查

新增 species 时自动检查：

```text
[ ] id 唯一
[ ] zhCN 有 nameType
[ ] tradeName 不进入 scientificName
[ ] morph / locality / lineage 分离
[ ] acceptedScientificName 必须有 taxonomy source
[ ] authority 必须有来源
[ ] tentative genus 不得显示为“已确认”
[ ] literature 每条至少有一个 basis
[ ] basis 可回溯 evidenceId
[ ] visual 参数标为 RENDER
[ ] genetics 默认 unknown
[ ] crossCompatibility 默认 unknown
[ ] fictional taxon 有 realityStatus
```

---

# 21. 当前文件结构与未来拆分

当前 13 个条目仍然适合保持较平的结构：

```text
isopoda/
├── species.mjs        # 资料 + 游戏兼容字段
├── phenotypes.mjs     # visual phenotype
├── sources.mjs        # evidence/source infrastructure
├── catalog.mjs        # 图鉴展示
├── sprites.mjs        # pixel morphology renderer
├── behaviors.mjs      # 个体状态 / 行为
├── habitat.mjs        # 场景
└── engine.mjs         # v3 游戏状态与 7 日流程
```

当前不需要为了“看起来像数据库”强行拆成 13 个 species 文件。

当品种明显超过约 30–50 个、或者开始出现独立证据链维护压力时，再考虑：

```text
isopoda/
├── data/
│   ├── species/
│   │   ├── dairy.mjs
│   │   ├── ducky.mjs
│   │   └── ...
│   ├── sources.mjs
│   ├── taxonomy.mjs
│   └── schema.mjs
│
└── renderer/
    ├── phenotypes.mjs
    ├── patterns.mjs
    └── sprites.mjs
```

拆分的触发条件应该是维护成本，而不是品种数量还很少时的形式完整。

# 22. 项目的两份核心资产

## Species Data Standard

回答：

> **它是什么？我们为什么这样叫它？这条资料有多可靠？**

负责：

```text
taxonomy
nomenclature
trade identity
vernacular
source
evidence
biogeography
literature
fiction provenance
```

## Morphology Renderer Spec

回答：

> **它长成什么结构？怎样把这个结构稳定画出来？**

负责：

```text
body
cephalon
P1–P7
epimera
pleon
pleotelson
uropods
antennae
surface
palette
pattern
variation
molt
stage
conglobation
CSS renderer
```

二者之间的关系：

```text
Evidence
   ↓
Species Data
   ↓
Morphology / Phenotype
   ↓
Renderer
   ↓
图鉴 / 游戏 / 培育 / 幻想物种
```

---


## 22.1 当前游戏如何消费 Species Data

当前 engine 仍为 **v3，7 天 × 每天 3 个时段 = 21 次观察**。

Species data 当前主要进入游戏的方式：

```text
species.id
  → 存档稳定身份

speed
  → behaviors 中个体移动倍率

wet
  → 初始 humidity
  → 判断一次照护是否让 humidity 更接近该游戏基线

cover
  → 初始遮蔽物参数

notes
  → 夜间观察文本

visual
  → catalog specimen + habitat actors
```

这意味着资料层必须避免一个常见错误：

> **游戏参数被写得像真实饲养事实。**

例如：

```js
wet: 78
```

当前只意味着“本游戏模拟里这个 species 的湿度基线是 78”。

它不意味着：

```text
真实最佳湿度 = 78%
```

同理：

```js
speed: 1.2
```

不是毫米/秒。

当前 `catalog.mjs` 也明确写着：

> 温湿度、成长比例与状态演示不作为饲养处方或实测数据。

这一边界应长期保留。

# 23. 最终原则

整个项目长期坚持三句话：

> **名称不是动物本身。**

> **不知道，就把“不知道”保存下来。**

> **真实资料负责约束想象；想象不需要伪装成真实，仍然可以非常精确。**

当这套规范成立后，Umwelt 仓库的 `isopoda/` 不再只是当前 13 个鼠妇的图鉴数据，而是一套可继续容纳：

```text
正式物种
未描述贸易种
locality
morph
cultured line
个体差异
成长
蜕皮
培育
推测表型
幻想物种
世界观分类学
```

的长期 **Isopod Knowledge & Representation System**。

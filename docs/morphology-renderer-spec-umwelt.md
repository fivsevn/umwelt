# Isopod Morphology Renderer 规格
## 企划-umwelt系列 / 鼠妇图鉴 CSS 形态渲染资产

**文档状态：** Draft v1.0  
**用途：** 项目长期资产；作为后续 Work 实现、鼠妇图鉴扩展、视觉统一和未来培育系统的底层规范。  
**当前适用范围：** Umwelt 仓库 `isopoda/` 下现有 13 个鼠妇条目。  
**核心原则：** 先描述鼠妇的形态，再由 CSS 渲染；不以“每个品种手写一只 sprite”为长期方案。

---

## 0. 文档定位

本文件只解决一个问题：

> **如何把真实鼠妇的外部形态，拆解成一套科学上有对应关系、工程上可复用、性能上足够轻的 CSS 渲染系统。**

本文件**不是**物种分类学数据库，也**不是**饲养指南。  
物种中文名、学名、贸易名、鉴定状态、来源与图鉴文案，应由独立的 `isopod-species-data-standard.md` 负责。

两份规范通过稳定的 `species.id` 对接：

```js
{
  id: "ducky",

  taxonomy: { ... },     // 资料规范层
  profile: { ... },      // 图鉴资料层

  visual: { ... }        // 本文档定义的形态渲染层
}
```

---

# 1. 总体设计原则

## 1.1 Morphology first，CSS second

不要把物种定义为：

```js
shape: "round",
colors: [...],
pattern: "ducky"
```

长期方案应改为：

```text
Taxonomy
   ↓
Morphology
   ↓
Phenotype
   ↓
Ontogeny / Condition / Individual Variation
   ↓
CSS Renderer
```

其中：

- **Morphology**：身体结构与比例。
- **Phenotype**：颜色、花纹、表面材质等可见表型。
- **Ontogeny**：生长阶段。
- **Condition**：蜕皮、蜷缩、静息等状态。
- **Individual Variation**：同一品种不同个体之间允许出现的轻微差异。
- **CSS Renderer**：只负责把以上数据画出来，不包含物种知识。

---

## 1.2 CSS-only，但不追求极端 DOM 压缩

目标是：

- 不加载鼠妇 PNG / WebP / 外部 SVG；
- 不依赖 Canvas / WebGL；
- 不为每一个斑点创建 DOM；
- 允许保留合理的解剖节点；
- 使用 CSS variables、gradient、clip-path、border-radius 等完成绘制；
- 图鉴中大量静态鼠妇不持续动画。

当前项目已经使用 7 个 `.plate` 表示背甲分节，这一思路应保留并科学化。

**原则：省网络资源，不极端省结构。**

十几个轻量 DOM 节点换来的可维护性和形态控制能力，远比把一只鼠妇压缩为 1–2 个元素更有价值。

---

# 2. 科学形态学与 CSS 映射

## 2.1 外部体区

陆生等足目的外部身体可以按以下区域组织：

```text
Cephalon
│
├── Pereon
│   ├── P1
│   ├── P2
│   ├── P3
│   ├── P4
│   ├── P5
│   ├── P6
│   └── P7
│
├── Pleon
│   ├── PL1
│   ├── PL2
│   ├── PL3
│   ├── PL4
│   └── PL5
│
└── Pleotelson
    └── Uropods
```

项目渲染不需要把所有结构都拆成独立 DOM。

建议的轻量 DOM：

```html
<span class="isopod">
  <i class="antennae"></i>
  <i class="legs"></i>

  <b class="body">
    <i class="cephalon"></i>

    <i class="pereon">
      <i class="plate p1"></i>
      <i class="plate p2"></i>
      <i class="plate p3"></i>
      <i class="plate p4"></i>
      <i class="plate p5"></i>
      <i class="plate p6"></i>
      <i class="plate p7"></i>
    </i>

    <i class="pleon"></i>
    <i class="pleotelson"></i>
    <i class="uropods"></i>
  </b>
</span>
```

其中：

- `P1–P7` 独立元素：用于甲片轮廓、分区花纹、蜕皮、成长差异。
- `pleon`：不必生成 5 个子节点，可用 repeating-linear-gradient 表示腹部分节。
- `pleotelson`：单独节点。
- `uropods`：单节点 + pseudo-elements 表示左右尾肢。
- `legs`：允许一层 gradient 表示多足，不创建 14 个足节点。
- `antennae`：允许一个元素 + `::before / ::after`。

---

## 2.2 Body proportions｜总体比例

物种数据不应只保存 `"round"` 或 `"long"`，而应保存连续参数。

建议字段：

```js
body: {
  length: 1.00,
  width: 0.72,
  convexity: 0.45,

  anteriorTaper: 0.18,
  posteriorTaper: 0.28,
  pleonTaper: 0.32
}
```

### 字段含义

| 字段 | CSS/视觉意义 |
|---|---|
| `length` | 纵向/前后方向的总体长度比例 |
| `width` | 最大体宽 |
| `convexity` | 背部高拱感；背视图主要映射为侧缘圆润和甲片弧度 |
| `anteriorTaper` | 头部附近收窄程度 |
| `posteriorTaper` | P6–P7 向后收窄程度 |
| `pleonTaper` | pleon 相对 pereon 的收窄程度 |

这些数值是**CSS 归一化视觉系数**，不是毫米测量值。

Renderer 可内部使用 preset 优化实现：

```text
runner
roller
flare
pill
heavy
```

但 preset 只能属于渲染器，不应成为物种事实字段。

---

# 3. Cephalon｜头部模块

头部是一级模块。

```js
cephalon: {
  width: 0.90,
  length: 0.75,
  embedding: 0.55,

  frontalMargin: 0.30,
  medianProjection: 0.00,
  lateralLobes: 0.25,

  roundness: 0.70
}
```

### 建议控制项

- 头宽；
- 头长；
- 是否被第一胸节包入；
- 前缘轮廓；
- 中央额突强弱；
- 两侧叶强弱；
- 圆钝程度；
- 眼睛位置；
- 头部颜色/头罩花纹。

`duckyHead` 不应成为终极数据类型。  
它可以作为开发 preset：

```js
preset: "ducky"
```

但必须可以展开成上述参数。

---

# 4. Pereon P1–P7｜七胸节是系统核心

现有代码的七甲片结构应保留。

每一节应视为真实的 P1–P7，而不是无名的视觉块。

建议：

```js
pereon: {
  plateArc: 0.50,
  overlap: 0.10,
  seamStrength: 0.20,

  heightProfile: [
    0.82, 0.94, 1.00, 1.00, 0.98, 0.91, 0.80
  ],

  epimera: {
    width: 0.45,
    flare: 0.18,
    angle: 0.10,
    roundness: 0.55,
    tip: "round"
  }
}
```

---

## 4.1 Epimera｜侧板/侧缘必须独立

这是未来区分品种最有价值的模块之一。

不要把所有“浅色边缘”都当成 `rim`。

应同时分离：

```text
结构 geometry
+
颜色 phenotype
```

结构字段：

```js
epimera: {
  width: 0.58,
  flare: 0.30,
  angle: 0.18,
  roundness: 0.40,
  tip: "pointed"
}
```

可表现：

- Cubaris 类较圆滑、收拢的边缘；
- Coros 那种视觉上极宽的侧缘；
- Red Diablo / Ember Bee 更张扬的侧板；
- Porcellio 较扁平、外展的身体。

颜色应独立放入 `palette.epimera` 或 pattern target。

---

# 5. Pleon｜腹部必须正式加入

现有 sprite 的“7 片甲 + tail”过于简化。

下一版应增加一个轻量 `pleon` 区域：

```js
pleon: {
  length: 0.22,
  width: 0.66,
  taper: 0.35,
  segmentContrast: 0.18
}
```

CSS 使用：

```css
background:
  repeating-linear-gradient(
    90deg,
    var(--pleon) 0 3px,
    var(--pleon-seam) 3px 4px
  );
```

不需要 5 个额外 DOM。

Pleon 的价值在于：

- 让尾部不再像简单矩形；
- 区分 pleon 是否明显窄于 pereon；
- 与 pleotelson / uropods 构成可靠的后端轮廓；
- 为未来更广泛的 Oniscidea 形态扩展预留空间。

---

# 6. Pleotelson｜尾节区域

建议：

```js
pleotelson: {
  length: 0.16,
  width: 0.34,
  taper: 0.40,
  apex: "rounded"
}
```

`apex` 初期支持：

```text
rounded
truncate
pointed
triangular
compact
```

不需要做分类学鉴定级精度，但必须允许后端轮廓发生结构差异。

---

# 7. Uropods｜尾肢为一级模块

尾肢不应继续被简化成统一 `.tail`。

建议：

```js
uropods: {
  projection: 0.55,
  width: 0.20,
  spread: 0.15,
  thickness: 0.20,
  visibility: 0.90
}
```

CSS 主要控制：

- 是否明显伸出；
- 长短；
- 左右张开；
- 宽/细；
- 是否大部分隐藏在后缘内。

这将显著提高 Porcellio / Armadillidium / Armadillidae 等不同体型之间的辨识度。

---

# 8. Antennae｜触角

```js
antennae: {
  length: 0.75,
  thickness: 0.18,
  spread: 0.45,
  bend: 0.20
}
```

原则：

- Bolivari 等长触角型必须能明显拉开差异；
- 圆厚、卷球型可更短、更收拢；
- 静态图鉴触角不必永久摆动；
- movement state 开启时才允许轻量 transform 动画。

---

# 9. Legs｜足

不为七对足建立 14 个 DOM。

建议：

```js
legs: {
  length: 0.44,
  visibility: 0.55,
  spread: 0.30
}
```

CSS 使用 repeating gradient、mask 或 box-shadow 产生节律。

足的视觉职责：

- 让扁平 runner 更“展开”；
- 让高拱 roller 的足更收在身体下；
- 移动状态时给予轻微步态反馈。

不要追求附肢解剖学细节。

---

# 10. Surface｜背甲表面

表面结构与颜色必须分离。

建议：

```js
surface: {
  sculpture: "smooth",
  intensity: 0.20,

  material: "matte",
  translucency: 0.05
}
```

### `sculpture`

初版支持：

```text
smooth
granular
tuberculate
ridged
spiny
```

### `material`

初版支持：

```text
matte
glossy
translucent
```

### CSS 实现

优先：

- radial-gradient；
- repeating-linear-gradient；
- inset box-shadow；
- clip-path 轮廓微调。

禁止为了颗粒感创建大量 DOM。

Echinatus 应主要通过这一层体现，而不是仅通过颜色。

---

# 11. Palette｜解剖区域颜色系统

当前：

```js
colors: [shell, mark, rim]
```

应升级为：

```js
palette: {
  cephalon: null,
  tergite: "#555",
  epimera: null,
  pleon: null,
  pleotelson: null,
  uropods: null,

  antennae: null,
  legs: null,

  dark: "#222",
  light: "#ddd",
  accentA: "#d98b45",
  accentB: "#a84435"
}
```

### 继承规则

未填写时：

```text
cephalon    → tergite
epimera     → tergite
pleon       → tergite
pleotelson  → pleon
uropods     → pleotelson
antennae    → epimera
legs        → epimera
```

这样简单物种仍只需要 2–3 个色值，复杂品种可扩展到多个解剖区域。

---

# 12. Pattern Grammar｜花纹语法

花纹不再绑定品种名。

禁止：

```js
pattern: "ducky"
pattern: "diablo"
```

改为可组合 primitive：

```js
patterns: [
  {
    type: "headMask",
    target: "cephalon",
    color: "accentA"
  },
  {
    type: "epimeraRim",
    target: "epimera",
    color: "light"
  }
]
```

## 12.1 初版 primitive

| primitive | 默认 target | 用途 |
|---|---|---|
| `solid` | any | 纯色覆盖 |
| `segmentBand` | pereon | 按胸节形成横向带 |
| `dorsalStripe` | pereon | 中央纵向色带 |
| `lateralStripe` | pereon | 两侧纵带 |
| `blotch` | pereon | 不规则斑块 |
| `spot` | pereon | 离散点 |
| `spotRow` | pereon | 有规律点列 |
| `saddle` | pereon | 中段鞍状深色块 |
| `headMask` | cephalon | 头部独立色块 |
| `epimeraRim` | epimera | 侧板边缘色 |
| `epimeraTip` | epimera | 侧板末端色 |
| `segmentSeam` | pereon | 节间线 |
| `trizone` | body | 前/中/后三色区 |
| `posteriorPatch` | pleon | 尾段色块 |
| `centerField` | pereon | 中央大面积色区 |

允许组合：

```js
patterns: [
  { type: "blotch", target: "pereon" },
  { type: "epimeraTip", target: "epimera" }
]
```

---

# 13. Pattern Variation｜花纹个体差异

花纹应允许一个稳定 seed：

```js
individual: {
  seed: 218731,

  sizeJitter: 0.02,
  hueJitter: 0.015,
  patternJitter: 0.15,
  symmetryJitter: 0.08
}
```

**seed 必须稳定。**

同一个体每次刷新后不能换一套斑纹。

实现可使用：

```js
variant = hash(seed) % N;
```

或预定义 CSS variant：

```text
v0
v1
v2
v3
```

初版不必真正生成连续随机图案。

---

## 13.1 Individual Variation 允许改变

- 斑点位置；
- 小范围斑块面积；
- 轻微色相；
- 极轻微大小；
- 左右不完全对称；
- 触角角度。

## 13.2 Individual Variation 禁止改变

- uropod 基本类型；
- pleotelson 主要轮廓；
- cephalon 结构；
- 是否具有明显颗粒/结节背甲；
- 基础高拱/扁平体型；
- 基本 epimera 结构；
- 物种标志性 pattern 是否存在。

即：

> 个体差异不能越权修改物种形态。

---

# 14. Ontogeny｜S / M / L 生长阶段

UI 可继续显示：

```text
S
M
L
```

内部建议：

```text
juvenile
subadult
adult
```

不要只使用 `transform: scale()`。

建议每个阶段允许影响：

```js
stageProfile: {
  scale: 0.72,
  widthRatio: 0.96,
  plateMaturity: 0.82,
  appendageRatio: 0.90,
  patternExpression: 0.75
}
```

### 默认安全规则

可默认变化：

- 总体大小；
- 甲片比例；
- 附肢相对比例；
- pattern expression 强弱；
- body proportion 的极小幅调整。

**不得默认所有幼体“颜色更浅”。**

颜色随成长的变化只有在特定物种/品系有资料或可靠视觉依据时才单独配置。

---

## 14.1 Manca 预留

未来如果需要真正的早期发育阶段，可增加：

```text
manca
```

等足类新释放的 manca 缺少完整的最后一对步足，具有六对 pereopods。

初版不实现，但 schema 不应阻止未来添加。

---

# 15. Condition｜状态系统

状态与物种数据分离：

```js
condition: {
  molt: "none",
  posture: "normal"
}
```

初版支持：

```text
normal
resting
moving
curled
molt-posterior
molt-anterior
```

---

# 16. Biphasic Molt｜双相蜕皮

等足目蜕皮分两阶段：

1. **后半身体先蜕；**
2. 随后前半身体蜕；
3. 两部分的边界位于 P4 与 P5 之间。

因此项目应正式绑定：

```text
Anterior half:
Cephalon + P1 + P2 + P3 + P4

Posterior half:
P5 + P6 + P7 + Pleon + Pleotelson + Uropods
```

### `molt-posterior`

对 posterior half 应用：

- 更浅的新甲色；
- 低饱和；
- 轻微半透明；
- seam 对比下降；
- 可略带乳白感。

### `molt-anterior`

同样效果应用于：

- cephalon；
- P1–P4。

不要使用全身统一 `opacity` 模拟蜕皮。

---

## 16.1 现有旧版 p0–p6 的迁移

当前旧 sprite 方向中，头部在右侧。

若保持现有方向，迁移时应明确绑定：

```text
旧 p6 → P1
旧 p5 → P2
旧 p4 → P3
旧 p3 → P4
旧 p2 → P5
旧 p1 → P6
旧 p0 → P7
```

迁移完成后，代码内部建议直接改名为 `p1`–`p7`，避免未来状态逻辑继续使用反向编号。

---

# 17. Conglobation｜卷曲/卷球能力

当前 `.curled` 不能继续简单地对所有鼠妇执行统一 `scaleX(.7)`。

建议：

```js
conglobation: {
  ability: "none",
  closure: 0.00,
  antennaeHidden: false
}
```

初版值：

```text
none
partial
full
```

注意：

- 这是形态/行为能力字段；
- 不是所有鼠妇都应表现为完整圆球；
- 对 full 类型，renderer 才允许头尾闭合、触角隐藏、后缘收拢；
- 对 none 类型，`curled` 最多表现为短缩、防御性蜷身，而不是完整球形。

---

# 18. Phenotype ≠ Genotype

本项目未来可能加入培育或交叉玩法，因此从第一版开始必须分层。

视觉系统描述的是：

```text
Phenotype
```

不是：

```text
Genotype
```

禁止从 CSS trait 直接推导虚构基因：

```text
红色 ≠ RedGene
黑斑 ≠ SpotGene
长触角 ≠ LongAntennaGene
```

未来可以预留：

```js
genetics: {
  knowledge: "unknown",
  model: null
}
```

只有有可靠资料时才写入：

```text
documented
```

如果为了玩法采用模拟遗传规则，必须明确：

```text
game-model
```

不得让游戏机制伪装成已知遗传事实。

---

# 19. Lineage / Cross Compatibility 预留

建议物种资料层未来预留：

```js
lineage: {
  tradeName: null,
  locality: null,
  strain: null,
  source: null
},

breeding: {
  crossCompatibility: "unknown"
}
```

默认：

```text
unknown
```

不得使用：

```text
同属 = 可杂交
```

作为自动规则。

未来的培育系统应基于：

1. 已确认同种不同品系；
2. 有可靠杂交资料；
3. 或明确标注为游戏幻想机制。

---

# 20. Renderer 数据 Schema 建议

```js
visual: {

  body: {
    length: 1,
    width: .75,
    convexity: .5,
    anteriorTaper: .2,
    posteriorTaper: .2,
    pleonTaper: .3
  },

  cephalon: {
    width: .9,
    length: .75,
    embedding: .5,
    frontalMargin: .3,
    medianProjection: 0,
    lateralLobes: .2,
    roundness: .6
  },

  pereon: {
    plateArc: .5,
    overlap: .1,
    seamStrength: .2,

    heightProfile: [
      .82, .94, 1, 1, .98, .91, .80
    ],

    epimera: {
      width: .45,
      flare: .15,
      angle: .1,
      roundness: .5,
      tip: "round"
    }
  },

  pleon: {
    length: .22,
    width: .65,
    taper: .3,
    segmentContrast: .15
  },

  pleotelson: {
    length: .15,
    width: .35,
    taper: .35,
    apex: "rounded"
  },

  uropods: {
    projection: .4,
    width: .2,
    spread: .1,
    thickness: .2,
    visibility: .8
  },

  antennae: {
    length: .7,
    thickness: .2,
    spread: .4,
    bend: .2
  },

  legs: {
    length: .4,
    visibility: .5,
    spread: .3
  },

  surface: {
    sculpture: "smooth",
    intensity: .2,
    material: "matte",
    translucency: .05
  },

  palette: {
    cephalon: null,
    tergite: "#777",
    epimera: null,
    pleon: null,
    pleotelson: null,
    uropods: null,
    antennae: null,
    legs: null,

    dark: "#333",
    light: "#ddd",
    accentA: null,
    accentB: null
  },

  patterns: [],

  conglobation: {
    ability: "none",
    closure: 0,
    antennaeHidden: false
  }
}
```

---

# 21. 现有 13 个品种的第一版 Morphology Profile

> 以下为 **CSS 相对视觉系数 / renderer tuning**，不是生物测量数据。  
> 参数依据当前项目视觉参考、公开照片的稳定识别特征以及现有 sprite 方向做第一版归纳。  
> 以后可以调整具体值，不应影响 renderer schema。

归一化解释：

- `L`：length
- `W`：width
- `C`：convexity
- `E`：epimera width
- `A`：antenna length
- `U`：uropod projection

数值主要用于同项目内相对比较。

| id | 条目 | L | W | C | E | A | U | Surface | 视觉 grammar |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| `dairy` | Dairy Cow | 1.10 | .72 | .34 | .46 | .78 | .72 | smooth | pale base + irregular dark blotches |
| `cappuccino` | Cappuccino | .94 | .84 | .72 | .64 | .60 | .22 | smooth / slight translucent | coffee center + cream edge zones |
| `diablo` | Red Diablo | 1.02 | .82 | .55 | .78 | .76 | .45 | matte / slight glossy | dark dorsum + yellow blotch + red epimera tips |
| `echinatus` | Porcellio echinatus | 1.08 | .70 | .32 | .45 | .78 | .70 | granular / tuberculate | muted shell + strong dorsal sculpture |
| `pink` | Pink Laser | .90 | .84 | .76 | .62 | .55 | .18 | smooth / translucent | pale pink field + subtle center/seams |
| `coros` | Coros | 1.00 | .94 | .28 | .82 | .70 | .62 | smooth | dark center field + very pale wide epimera |
| `bolivari` | Porcellio bolivari | 1.18 | .70 | .30 | .44 | .95 | .92 | smooth | pale elongated body + segment seams |
| `ducky` | Rubber Ducky | .88 | .86 | .82 | .68 | .52 | .14 | smooth | yellow head + dark tergites + pale/yellow edge |
| `daxin` | Daxin Tricolour | .92 | .84 | .76 | .64 | .58 | .18 | smooth | warm anterior + dark middle + pale posterior |
| `ember` | Ember Bee | 1.00 | .82 | .55 | .76 | .76 | .44 | matte | dark dorsum + amber/orange/red lateral progression |
| `amber` | Amber Ducky | .90 | .86 | .80 | .66 | .54 | .15 | smooth | amber field + broad dark saddle |
| `vex` | Vex | .94 | .96 | .88 | .78 | .56 | .14 | smooth / translucent | heavy amber armor + broad plates |
| `orange` | Armadillidium frontetriangulum “Orange” | .92 | .82 | .76 | .57 | .58 | .12 | smooth | orange field + organized pale spot rows |

---

# 22. 13 种的结构重点

## Dairy Cow

优先级：

1. 低平、较长；
2. Porcellio 式明显后端；
3. 奶白主色；
4. 黑色不规则 blotch；
5. seed 控制至少 4 套斑块差异。

不要把斑点做成规则圆点。

---

## Cappuccino

优先级：

1. 圆厚；
2. 高拱；
3. 侧板柔和；
4. 咖啡褐中央与奶油/焦糖分区；
5. 略带半透明材质感。

花纹应主要依赖 plate / epimera 分区，而非规则横带。

---

## Red Diablo

优先级：

1. 暗色中央；
2. 大面积暖黄色不规则区域；
3. epimera 向外张；
4. 侧板末端红色；
5. silhouette 比普通 roller 更“放射”。

实现建议：

```text
blotch + epimeraTip
```

而不是单一 `.diablo` gradient。

---

## Porcellio echinatus

优先级：

1. 长扁；
2. 背甲颗粒/结节感；
3. 每节有明显结构；
4. 触角和尾肢可见；
5. 色彩保持低调。

它是测试 `surface.sculpture` 是否真正有效的基准物种。

---

## Pink Laser

优先级：

1. 高拱；
2. 圆滑；
3. 淡粉/淡紫；
4. 柔和半透明；
5. 花纹对比很弱。

不要为了“看起来复杂”人为添加大量强斑纹。

---

## Coros

优先级：

1. 全局特别宽；
2. 背部低；
3. epimera 极宽；
4. 中央较深；
5. 侧缘大面积浅色。

它是测试 `epimera.width` 的基准物种。

---

## Porcellio bolivari

优先级：

1. 很长；
2. 长触角；
3. uropods 明显；
4. 身体低平；
5. 甲片节间线更有存在感。

它是测试 appendage proportions 的基准物种。

---

## Rubber Ducky

优先级：

1. 短、宽、高拱；
2. 头部短钝且被身体包入感较强；
3. 黄头；
4. 深色背部；
5. 浅黄/黄褐侧缘；
6. uropods 极少外露。

它是测试 cephalon + conglobation silhouette 的基准物种之一。

---

## Daxin Tricolour

优先级：

1. roller 体型；
2. 前/中/后三个色区；
3. 色区跟身体解剖段落绑定；
4. 不要使用一张全身三段 linear-gradient 粗暴覆盖。

推荐：

```text
cephalon/P1-P2 → warm
P3-P5          → dark
P6-P7/pleon    → pale
```

具体分界允许后续根据照片微调。

---

## Ember Bee

优先级：

1. 暗色中央背甲；
2. epimera 明显外展；
3. 暖色集中在侧缘；
4. orange / amber / red 构成层级；
5. silhouette 与 Red Diablo 有亲缘视觉语言，但 pattern 不应完全相同。

---

## Amber Ducky

优先级：

1. 高拱、短宽；
2. 琥珀主体；
3. 中段宽大的深色 saddle；
4. 头尾仍保留暖色；
5. uropods 收拢。

推荐：

```text
base + saddle
```

---

## Vex

优先级：

1. 极宽；
2. 很厚重；
3. plate overlap 视觉明显；
4. 甲壳略有透明/琥珀感；
5. 后端收拢。

它是测试 `width + convexity + overlap` 的基准物种。

---

## Armadillidium frontetriangulum “Orange”

优先级：

1. 紧凑、椭圆、可卷球语法；
2. 橙色基底；
3. 规则的浅色 spot rows；
4. 后端短、收拢；
5. 不使用随机 Dairy Cow 式 blotch。

它是测试 `spotRow + full conglobation` 的基准类型之一。

---

# 23. CSS 实现原则

## 23.1 推荐

- CSS custom properties；
- `linear-gradient()`；
- `radial-gradient()`；
- `repeating-linear-gradient()`；
- 小规模 `box-shadow`；
- `border-radius`；
- `clip-path: polygon()`；
- `transform`；
- `opacity`。

## 23.2 避免

- 大面积 `filter: blur()`；
- 每只鼠妇永久 `drop-shadow()`；
- 每只鼠妇永远运行腿部动画；
- 每只鼠妇永远运行触角动画；
- 每个斑点一个 DOM；
- 复杂 SVG filter；
- 频繁修改 gradient 参数的 animation；
- 频繁 layout-triggering animation。

---

# 24. 动画策略

静止鼠妇：

```text
0 持续动画
```

移动鼠妇：

```css
.isopod.moving .legs { ... }
.isopod.moving .antennae { ... }
```

只优先动画：

```text
transform
opacity
```

不要动画：

```text
width
height
filter
background-position of large layers
```

图鉴展示中的鼠妇默认静态。

---

# 25. 图鉴大量个体性能

当图鉴扩展到几十或数百品种时：

```css
.species-card {
  content-visibility: auto;
  contain-intrinsic-size: ...;
}
```

只有进入可视区域的卡片才承担完整绘制。

如果同一页出现大量真实游戏个体，可进一步采用：

- viewport-based spawn；
- 离屏暂停 animation；
- movement state only animation；
- 相同 pattern class 复用。

---

# 26. 当前旧系统迁移

旧：

```js
{
  shape: "round",
  colors: ["...", "...", "..."],
  pattern: "ducky"
}
```

迁移过程：

```text
shape
  ↓
body + cephalon + pereon + pleon + uropods

colors
  ↓
palette

pattern
  ↓
patterns[]

旧 CSS 类
  ↓
renderer primitive
```

### 迁移原则

1. 保持 `species.id` 不变；
2. 不一次改变游戏机制；
3. 先让新 renderer 能复刻现有 13 种；
4. 再提升精细度；
5. 最后删除重复旧 sprite CSS；
6. 旧存档/已有状态不得因 visual schema 改动而失效。

---

# 27. Renderer API 建议

```js
makeIsopod(species, {
  stage: "adult",
  condition: "normal",
  seed: 12345,
  moving: false
});
```

渲染器不应该知道：

- 学名；
- rarity；
- 饲养参数；
- 图鉴文案；
- 贸易名真假；
- 遗传模式。

它只接收已经整理好的 visual phenotype。

---

# 28. 未来扩品种原则

新增物种/品系时优先问：

```text
1. 身体长宽和拱度？
2. 头部是什么轮廓？
3. P1–P7 的甲片弧度？
4. epimera 有多宽、是否外张？
5. pleon 是否明显收窄？
6. pleotelson 后缘怎样？
7. uropods 是否明显突出？
8. 触角相对多长？
9. 表面 smooth / granular / tuberculate / ridged / spiny？
10. 哪些解剖区域是什么颜色？
11. 花纹属于哪些 primitive？
12. 同品种个体哪些地方允许变化？
13. 是否能完整卷球？
14. 生长阶段有哪些有依据的差异？
```

如果这 14 个问题能回答，理论上就不需要再写一套新的“专属鼠妇 CSS”。

---

# 29. 第一阶段验收标准

Work 实现完成后至少验证：

### 结构

- [ ] `P1–P7` 具有明确编号。
- [ ] `pleon` 独立存在。
- [ ] `pleotelson` 独立存在。
- [ ] `uropods` 独立存在。
- [ ] epimera 可单独控制。
- [ ] cephalon 可单独改变结构与颜色。

### 表型

- [ ] palette 支持解剖区域。
- [ ] pattern primitives 可组合。
- [ ] surface sculpture 可区分。
- [ ] 13 种不再依赖物种专属大段 CSS。
- [ ] Dairy Cow 至少有多种稳定斑纹 variant。

### 生长与状态

- [ ] S/M/L 不只是简单缩放。
- [ ] 默认不假设幼体统一变浅。
- [ ] posterior molt 对应 P5–P7 + 后端。
- [ ] anterior molt 对应 cephalon + P1–P4。
- [ ] curled 尊重 conglobation ability。

### 性能

- [ ] 鼠妇零外部图片资源。
- [ ] 静止个体无持续动画。
- [ ] 不使用大面积 blur。
- [ ] 不依赖复杂 SVG filter。
- [ ] 图鉴离屏卡片可跳过绘制。
- [ ] 手机端大量展示时无明显首屏阻塞。

### 可扩展性

- [ ] 新增品种主要通过数据完成。
- [ ] renderer 不包含 taxonomy 判断。
- [ ] phenotype 与 genotype 分层。
- [ ] crossCompatibility 默认 unknown。
- [ ] visual 参数均明确为 renderer 系数，而非伪装成生物测量值。

---

# 30. 第二阶段可选扩展

第一阶段完成后再考虑：

- sex-dependent morphology；
- manca；
- gravid / marsupium 状态；
- 更精细的 pleotelson preset；
- 更精细的 head frontal-margin preset；
- asymmetric injury / regeneration；
- habitat lighting palette；
- specimen card 大型精细模式；
- phenotype inheritance；
- documented genetics；
- lineage / locality；
- cross breeding gameplay。

这些都不应阻塞第一版 renderer。

---

# 31. 科学事实与游戏参数的边界

文档与代码中建议使用以下标签：

```text
[FACT]
有资料支持的解剖/发育事实。

[REFERENCE]
依据照片或可信物种描述确定的视觉特征。

[RENDER]
为了 CSS 呈现而定义的归一化参数。

[GAME]
纯游戏机制。

[UNKNOWN]
当前没有足够资料确认。
```

例如：

```text
[FACT]
Oniscidea pereon 具有七个自由胸节。

[FACT]
等足目双相蜕皮的前后边界位于 P4/P5。

[RENDER]
Rubber Ducky convexity = 0.82。

[REFERENCE]
Rubber Ducky 应表现出黄色头部和深色背部。

[UNKNOWN]
某 hobby morph 的具体遗传机制。
```

此规则必须长期保留。

---

# 32. 核心参考资料

以下资料用于确认**形态学框架**，不是用于确认当前 13 个 hobby morph 的全部身份。

### Terrestrial isopod external anatomy

Schultz / Maryland terrestrial Isopoda identification guide（PMC）  
包含 cephalon、pereon、pleon、tergites、epimera、pleotelson、uropods 等外部形态说明，并指出这些结构在鉴定中的价值。

https://pmc.ncbi.nlm.nih.gov/articles/PMC6288251/

### Isopod general body plan / manca

Southern California Bight Isopoda review（PMC）  
包含通用等足目 body plan、P1–P7、pleon、pleotelson、uropods，以及 manca 具有六对 pereopods 的说明。

https://pmc.ncbi.nlm.nih.gov/articles/PMC10206732/

### Biphasic molt

Molting and cuticle deposition in *Titanethes albus*（PMC）  
明确描述等足目先蜕后半身体，再蜕前半身体；分界位于 pereionites 4 与 5 之间。

https://pmc.ncbi.nlm.nih.gov/articles/PMC3335403/

### Conglobation / terminal morphology examples

Eubelidae terrestrial isopod description（PMC）  
提供 body convexity、roll-up capability、cephalon、telson、uropod 等形态描述实例。

https://pmc.ncbi.nlm.nih.gov/articles/PMC6288252/

Cylisticidae terrestrial isopod description（PMC）  
提供 exoantennal conglobation、cephalon、pleon、telson、uropods 等描述实例。

https://pmc.ncbi.nlm.nih.gov/articles/PMC4857051/

---

# 33. 最终工程原则

整个系统最终应符合一句话：

> **Species data 描述“它是什么”，Morphology 描述“它长成什么结构”，Phenotype 描述“它看起来怎样”，CSS Renderer 只负责把这些信息画出来。**

不要把：

```text
Dairy Cow
Rubber Ducky
Red Diablo
```

写进 renderer 的基础逻辑。

Renderer 应只认识：

```text
long
wide
convex
epimera
uropod
granular
blotch
saddle
headMask
spotRow
molt
stage
seed
```

当这一点成立时，项目才真正从“13 只 CSS 鼠妇”升级成：

# **Isopod Morphology Renderer**

它既能服务当前图鉴，也能作为未来扩展数十/数百品种、个体差异、成长、蜕皮和培育玩法的共同视觉底层。

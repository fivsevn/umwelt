# 花农时代：原生像素贴面的低模

此页保留 2026-10-10 原生物品图集方案的技术记录，并补充当前建筑资源的归属。当前入口、源稿与发布状态见 [花农时代维护索引](rooftop-README.md)，场景检查见 [综合场景测试](rooftop-scene-review.md)。新一轮视觉重制的顺序与保留边界见 [仓库梳理](rooftop-rebuild.md)。

2026-10-10。当时的运行版本已通过 PR #60 接入第 8 版样板延伸出的原生图集方案，随后继续修订。默认陈列、存档身份、车库、房间、人物动作、养护与叙事沿用原系统。下文的材质书、目录模型和当轮验证记录属于这套物品方案；建筑后来单独接入已保存 Blender 网格。

## 当前建筑与物品管线

建筑由 `3d/architectural-shell.mjs` 加载 Blender 导出的 `assets/background/empty-rooftop.bin` 与清单。当前建筑原稿为 [rooftop-weathering-07](art/rooftop-weathering-07/README.md) 的 `game-environment.blend` 和真实 Pixelorama `terrace-book.pxo`；运行 `terrace-book.png` 为 1024×1024，清单标定 16 像素/米，单格为 0.0625 米，最近邻取样、不生成 mipmap。裂缝、补浆、水渍和分层磨损属于贴图绘画；本次统一测试入口没有修改模型、UV 或像素尺度。

目录物品与室内沿用 `native-style.mjs` 的每世界单位 8 像素及 512×512 `material-book.png`。这部分的源稿与制作记录在 [全游戏物品原稿](art/rooftop-game/README.md)，家具重制留到下一阶段。两条管线各有原生标定，下文的 8 像素和 32×32 材质区域指物品方案。

## 物品贴面的统一方格

`3d/native-style.mjs` 固定为每世界单位 8 个像素：单格边长 0.125。轮廓由低模的连续折面、斜面、薄壳组成。模型长宽、实例缩放和斜面倾角都参与实际长度计算，每个面在自身切平面上取正交方格，一格直接对应原生贴图的一个像素；不把整个面拉伸到 32px。原 UV 保留供编辑参考。最近邻采样，不生成 mipmap。

模型保持游戏原有的摆放、旋转与缩放约定；已存档布局没有改为体素坐标。方格是贴面绘画的单位。最终画面保持正常绘制尺寸，`renderScale: 1`；低质感来自原生贴图和折面。

`3d/native-materials.mjs` 只加载一张实际 Pixelorama 导出的 PNG。平面法线来自实际三角形，避免圆柱的平滑插值改变网格。四档面明暗、室内、昼夜及雨后色调通过共享参数更新；灯与窗的发光参数保留原天气契约；风、鱼、人物与天气动作保留。目录画像等待图集加载，并固定为干燥日间色调。

## 原生材质书

原稿为 `docs/art/rooftop-game/material-book.pxo`，发布图为 `rooftop/assets/pixel/material-book.png`。512×512 图集容纳 214 个独立的 32×32 区域。512 是打包尺寸，每种材质仍为原生 32 像素绘画。全部筆触由真实 Pixelorama 1.2.3 的一像素 Pencil 在整数坐标执行，保存同一 PXO；PNG 与原生 cel RGBA 逐字节核对。

- 抹灰、石板、铁件沿用已认可样板的连贯色块；木材以板缝、顺纹和少量磨损表现，瓦面绘主要瓦缝。
- 室外木材、铁件、布面和漆面另有少量连贯的积土、氧化及湿生痕迹；室内不套用室外污染。
- 37 种器物分别保存外壁和内底绘画。馆藏的铁绘、青花、彩绘和固有器形继续按资料归属。
- 植物区分普通叶、硬叶、斑叶、条纹叶、肉质叶、苔藓、生石花窗面和龟背竹透明开孔；条纹画在叶面，删去浮在叶外的细条盒。
- 86 件馆藏武器保留原资料侧影，在原生方格重画为薄的双面展示片。此部分属于平面侧影转译，尚未逐件制作完整三维背面。

没有使用图像生成。`prepare-book.mjs` 保存整数笔触计划，`author-book.py` 调用 Pixelorama 保存原稿；这些是制作记录。已有原稿的回放默认停止，保护之后的手工编辑。

## 模型与构造

普通盆壁、圆柱和球状体减少到主要折面。盆土保留两圈不规则闭合土面，土粒由贴图表达。屋顶删去细瓦缝凸起，房间地板用连续原生木面表达板缝。

`stand-models.mjs` 提取原花架构造，`rack-grid.mjs` 同时供实际铁条和承放规则读取。黑色金属层架使用宽 0.375、间距 0.5 的层板条，形成可见 0.125 槽缝；宽盆底跨孔，小底物须落在铁条上。稳定层位 ID、原板顶高度和作者初始布局保持。

`cactus-models.mjs` 和 `water-models.mjs` 提取原仙人掌和水盆。龟背竹按 NC State 的攀援茎、交替叶节、裂叶及内部孔洞校准；生石花按 RHS 的成对厚叶、近无茎、平窗面与中央裂隙校准。

304 项目录可在 `docs/art/rooftop-game/game-assets.blend` 编辑，图集已打包。Blender 库由共享构造导入，运行的网格拓扑仍来自共享构造模块。手改 Blend 后需另做导出与接入，保存 Blend 不会自动修改网页网格。原稿库采用种子 1835、默认容器，供资产审阅，不代替玩家存档。

## 来源及验证边界

用户提供的 Brendan “Sully” Sullivan GIF 是主要风格参考：[作者作品](https://www.artofsully.com/projects/rNW6E)、[门与灯](https://www.artofsully.com/projects/eWQK3)。原图只用于观察，没有导入公开资源。资料与本轮仍需逐件复核的范围见 [全游戏原稿](art/rooftop-game/README.md)、[器物来源](rooftop-art-sources.md) 及 `asset-ledger.json`。

旧材质生成器及环境、人物笔画配方归档在 `docs/art/rooftop-legacy-materials/`，当前 3D 不再用其 CanvasTexture 绘材质。`face-paintings.mjs` 仍提供正式模型所需的共用函数，留在运行目录。2D 回退和既有图鉴绘制保留。

2026-10-10 物品方案的结构、承放、存档及原生源文件检查已运行。既有 GitHub 回归覆盖网页操作与页面入口，Pages 工作流检查最终发布包；结果以 Actions 为准。当轮本地浏览器工具拒绝访问站点，Blender 真实渲染仅为资产审阅，不是浏览器截图。这一限制属于当轮记录；后续实际游戏截图与状态报告见 [建筑贴图检查](art/rooftop-weathering-07/README.md) 和 [综合测试检查资料](art/rooftop-review-01/)。

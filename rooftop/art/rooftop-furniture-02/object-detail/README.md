# 单独物件修改记录

2026-10-16。范围为全部 294 件物件，逐件清单见 `scope-round3.json`。

| 类别 | 数量 |
| --- | ---: |
| 植物 | 110 |
| 架子 | 8 |
| 桌椅与居室 | 10 |
| 栽培与盛放 | 20 |
| 日用与照明 | 16 |
| 收藏 | 44 |
| 枪械 | 66 |
| 兵器 | 20 |

## 模型

17 件日常器物共增加 125 个部件：木架承托接头、柜体侧板框与五金、周转箱压筋与箱沿、铁桶卷边与折缝、鱼缸接缝、工作灯转轴与垫片、收音机刻度与螺丝、沙发滚边。新增部件保持原外部尺寸、开口和承放面；箱沿位于原箱壁厚度内，不占用箱内盆器空间。

294 件物件的材质调整没有新增几何变化。植物叶片裂孔、器物内外壁、枪械和兵器的既有结构保持。建筑沙盘、双天台、房间背景、人物、镜头和像素采样未改。

## 贴图

- 木材：木纹按部件长轴排列，相邻面和倒角使用同一方向；端面、接头与握持部位分别调整明度。
- 金属：区分暗色钢、镀锌面、黄铜和刃面；磨耗集中于翻边、接头及配件。
- 塑料与织物：分别调整塑料内壁、把手、底部，织物接触面、褶皱和接缝。
- 植物：调整同株叶片明度、肉质叶表面、花瓣与花喉、苔藓叶尖；保留原物种颜色、斑纹和形态。
- 陶器：调整烧成色差、积釉、内壁和胎土交界；保留原有纹样位置，强色装饰只作低幅度明度调整。

材料格保持 16 像素／米。透明玻璃、水和发光部分保持原贴图。植物原稿中的展示盆、土和支架保持；正式植物组合继续读取各自的默认盆器。

## 原稿与导出

七组原稿位于上级目录的 `everyday/`、`rooms-vessels/`、`pots-retained/`、`accents/`、`plants-retained/`、`collection/`、`ceramics-extra/`。

每组保留 `FAMILY.blend`、`FAMILY-layout.blend`、`FAMILY-atlas.pxo`、`atlas.png`、`texture-layout.json` 和 `catalog.json`。这些定稿源文件作为作品的一部分随游戏提交仓库，后续修改以当前源文件为依据。游戏读取 `rooftop/assets/items/` 的 GLB、图集和缩略图；目录元数据为 `rooftop/item-data.mjs`，缩略图审计为 `rooftop/art/rooftop-thumbnail-02/audit.json`。

从当前原稿继续编辑，不回放旧家族生成脚本。以下命令中的 `FAMILY` 为原稿目录名，备份必须为本次编辑前的当前文件。

```sh
python paint-detail.py FAMILY --baseline <编辑前备份目录> --revision 3
blender --background --python refine-native.py -- export FAMILY --all-objects
python sync-detail.py --all-objects
blender --background --python verify-native.py -- <编辑前备份目录> --all-objects
```

`paint-detail.py` 通过 Pixelorama 原生 Pencil 写入、保存并独立重开；`material-round3.py` 计算笔迹颜色。`refine-native.py` 从当前 Blend 导出并打包对应图集。`sync-detail.py --all-objects` 核对三角面数量、更新模型散列，保留碰撞与承放元数据。缩略图必须由实际游戏物件渲染器生成，随后同步目录投影与审计散列。

`detail-pencil-strokes.json`、`pencil-strokes.json` 和生成的临时扩展为绘制过程文件，原稿保存后删除，不纳入 Git。删除重复的 `atlas.pxo`，统一使用各组 `FAMILY-atlas.pxo`；保留当前定稿的检查记录，删除先前轮次的检查输出。用户提供的参考图片没有存入仓库。保留来源链接，不保存参考图片副本。

## 检查结果

- 294 件在原测试页逐件加载通过，无加载错误。
- 294 张缩略图重新生成，均有可见像素更新，无越界。
- 七组 Pixelorama 原稿独立重开，原生像素与导出 PNG 一致，编辑范围外像素保持。
- 材质调整前后，七组 Blender 的 10,534 个网格、UV 和变换一致。
- 610 个运行资产中更新 294 个 GLB、7 张图集和 294 张缩略图，其余 15 个资产散列一致。
- 目录除模型散列和缩略图投影外的字段保持，包括碰撞部件、承放面、植物学名、适用盆器和默认盆器。
- 已检查原生与游戏采样、雨天黄昏及南北天台和房间初始组合。
- 缩略图投影保留完整可见边界，检查 2D 回退绘制和四个保存朝向；同步命令见[缩略图说明](../../rooftop-thumbnail-02/README.md)。
- 435 项测试通过，全项目结构检查通过。

材质检查见 `*-round3-paint-check.json`；原稿检查见 `round3-source-reopen-check.json`；资源范围见 `round3-scope-check.json`；导出清单见 `round3-runtime-check.json`。建模、绘制、导出和检查工具保留；这些工具不是旧版模型或贴图。

本地查看：[统一测试页](http://127.0.0.1:8765/rooftop/tests/browser/rooftop.html?mode=item&sampling=source)。发布步骤见[验证与发布](../../../../docs/deployment.md)。

## 参考来源

| 来源 | 对应内容 |
| --- | --- |
| [Lee Stanton 工厂铁架](https://www.leestanton.com/products/av51)、[86 Vintage 铁架](https://www.86vintage.com/products/vintage-industrial-metal-shelves) | 立柱、层板折边与接头 |
| [镀锌浇水壶](https://www.shabbys-officialstore.com/items/76527818)、[金属浇水壶](https://amgardenantiques.com/garden/item2206) | 压筋、折口、壶嘴连接 |
| [农用周转箱](https://nouki-ichiba.net/products/17795) | 塑料加强筋与把手 |
| [橡木抽屉](https://www.pamono.com/antique-oak-chest-of-drawers-1918)、[抽屉接合](https://caseantiques.com/item/lot-118-greene-county-tn-inlaid-chest-of-drawers/) | 木纹、端面、接头 |
| [关节灯](https://www.thehoarde.com/product/greencore-design/original-early-anglepoise-lamp-gd1230) | 转轴与折边 |
| [Pixel tables](https://www.fab.com/listings/de174082-8339-4418-bbc2-c7848f54d410?lang=en)、[Home Furnitures](https://sketchfab.com/3d-models/home-furnitures-4e23f90a1d8a4ec4b2636211f6a5c04a) | 低模木纹与部件分色 |
| [多肉叶面](https://cdn11.bigcommerce.com/s-oqm1pc/images/stencil/original/products/7022/29331/ech_silver_frost__88144.1718932700.jpg) | 肉质叶表面 |
| [Met 织部花器](https://www.metmuseum.org/art/collection/search/904173) | 积釉与胎土 |
| [Met 火绳枪](https://www.metmuseum.org/art/collection/search/30594)、[像素低模道具](https://www.cgtrader.com/3d-models/military/gun/ak-74-pixel-weapons) | 木材、金属和装饰分区 |

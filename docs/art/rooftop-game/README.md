# 花农时代全游戏像素原稿

2026-10-10，分支 `preview/rooftop-3d-pixel-samples`，[PR #60](https://github.com/fivsevn/umwelt/pull/60)。GitHub 保存长期原稿、发布资源、制作记录和真实软件审阅图；本地是制作工作区。

本轮将认可样板的材质尺度接入背景、人物、植物和全部目录物件的共享入口。保持 304 个原 ID，其中植物 110 种、花盆器物 37 种；种子、默认陈列、存档、养护及叙事沿用原数据。

## 文件与体积

| 文件 | 用途 |
|---|---|
| `material-book.pxo` | Pixelorama 原稿，214 个 32×32 区域，512×512 打包 |
| `game-assets.blend` | Blender 原稿，304 项目录模型、原 UV、打包的原生材质和审阅相机 |
| `asset-ledger.json` | 每个原 ID 的资料归属；保留逐件审阅状态 |
| `pencil-strokes.json` | 实际一像素 Pencil 制作笔触，运行时不用 |
| `book-layout.json` | 图集坐标与用途 |
| `review/` | 实际 Blender 渲染，未经过图像生成或后期修饰 |

发布贴图 `rooftop/assets/pixel/material-book.png` 为 **26,604 B / 26.0 KiB**，PXO 为 **49,799 B / 48.6 KiB**。Blend 与各审阅图体积见 `blender-authoring.json`。原样板的六个 GLB 与独立预览继续保留；新图集由全游戏共享。

运行网格仍来自现有 Three.js 共享构造。Blender 库从相同构造导出，固定种子 1835、植物使用默认盆；手改后必须另做导出和接入。原稿库不是玩家布局副本，也不会自动覆盖玩家存档。

## 制作与重建

1. `node docs/art/rooftop-game/prepare-book.mjs` 准备整数 Pencil 计划。
2. `python3 docs/art/rooftop-game/author-book.py` 调用真实 Pixelorama。已有原稿默认停止；仅明确重放时加 `--replay-existing`，它会覆盖相应绘画，不能用于有后续手改的 PXO。
3. `python3 docs/art/rooftop-game/check-native.py` 只读核对原生 cel 与 PNG。
4. `node docs/art/rooftop-game/export-models.mjs` 从共享构造导出网格交换文件和审计表。`model-authoring.json.gz` 是可重建派生文件，不与 Blend 重复保存到仓库。
5. `Blender -b --python docs/art/rooftop-game/build-library.py` 保存原稿和真实渲染。此命令打开既有 Blend，并更新同名资产网格与材质；有后续手改时先另存，防止覆盖网格。
6. `Blender -b --python docs/art/rooftop-game/check-library.py` 重新打开保存原稿，核对资产 ID、打包 PNG 和编辑属性。
7. `node isopoda/tools/check-all.mjs` 检查全仓库契约；另需在真实浏览器测试场景和编辑操作。

临时作者扩展仅在 Pixelorama 制作期间启用，结束后恢复原配置并移除。源码位于 `docs/`，Pages 发布过滤器排除该目录；网页只加载运行资源。

## 原资料复核

- [NC State 龟背竹](https://plants.ces.ncsu.edu/plants/monstera-deliciosa/)：查看原图，成熟裂叶及内部孔洞，叶柄位于攀援茎节。
- [NC State 绿薄荷](https://plants.ces.ncsu.edu/plants/mentha-spicata/)：对生叶、方茎、顶生花序。
- [RHS 生石花属](https://www.rhs.org.uk/plants/25292/lithops/details)：近无茎的两片厚叶、平窗面及中央裂隙。此页未提供可用物种照片，推广图未计入形态依据。
- [MIHO 鼠志野向付](https://www.miho.jp/booth/html/artcon/00000293.htm)：查看馆藏原图，深赤褐色、白色掻落纹、方口、圆内底与三足。
- [NParks 虎尾兰](https://www.nparks.gov.sg/florafaunaweb/flora/2/4/2420)：硬挺带状叶和条纹进入原生绘画。
- [RHS 苔藓与藻类](https://www.rhs.org.uk/biodiversity/algae-lichens-liverworts-moss)：区分丛垫与羽状分枝，潮痕集中在湿润阴处。

304 项原资料仍在游戏手帐及 `asset-ledger.json`。本轮共享风格覆盖全目录，上述物件另做形态复核，其余保留原构造，没有宣称全部逐件重新考证或手工重建。

## 检查边界

`native-source-check.json` 记录 PNG 与 PXO 原生 cel RGBA 一致；`model-audit.json` 记录 304 项、471,968 个目录三角形且全部有限。这是完整目录集合，不是每帧显示总量。`blender-authoring.json` 保存真实软件版本、打包图集及渲染记录。

`tests/rooftop-native-art.test.mjs` 检查图集覆盖、加载就绪、共享材质、统一正交贴面、宽层板槽缝及承放、原 ID 覆盖。

343 项 Node 测试与全仓库结构契约均通过；静态发布包包含新 PNG，资源 URL 已加版本，排除原稿。完整状态见 `check-report.json`。

本地浏览器工具仍受已保存权限规则限制。用户已要求直接发布正式游戏；发布由既有 GitHub 回归与 Pages 最终产物检查确认。16 项花农时代网页回归已在 Chromium / WebKit 全部通过：[运行记录](https://github.com/fivsevn/umwelt/actions/runs/38013627227)。实际仓库网页截图保存于 `web-review/`，来自此既有工作流，未改像素。Pages 最终部署状态以 Actions 为准。

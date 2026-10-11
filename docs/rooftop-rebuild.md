# 花农时代仓库梳理与视觉重制边界

2026-10-10。花农时代位于 `fivsevn/umwelt` 的 `rooftop/`。本轮先整理仓库；视觉重制按“清空天台、调整背景、背景稳定后重新设计家具”的顺序推进。植物、日本古董和枪械继续使用现有资料，东东的手帐、天气、季节、时间及角色动作机制保留。

盘点基线为主分支 `24824e2`，共 618 个版本管理文件，其中 `rooftop/` 有 115 个。本轮将五个旧绘制模块迁至制作资料目录，新增本说明与归档说明，整理后共 620 个文件，`rooftop/` 为 110 个。

## 全仓库文件归属

| 范围 | 盘点时文件数 | 职责与本轮处理 |
| --- | ---: | --- |
| `rooftop/` | 115 | 花农时代运行、编辑、兼容入口和历史独立预览；核实全部入口及模块引用 |
| `docs/` | 119 | 开发文档、原稿和审阅记录；更新花农时代的过期状态，增加新一轮范围说明 |
| `tests/` | 120 | Node 契约与浏览器验证；只更新归档模块的导入路径 |
| `isopoda/` | 198 | 等足目及实验室；保留 |
| `tick/` | 5 | TICK.SYS；保留 |
| `assets/` | 14 | 共用音频、字体和许可；保留 |
| `mac/` | 23 | Mac 和 Windows 桌面包装及验证；保留 |
| `.github/` | 10 | 结构检查、浏览器回归与发布工具；保留 |
| 根目录 | 14 | 桌面主页、共享窗口、项目说明与许可；保留 |

`_site/`、`_mac/`、`_windows/` 是被忽略的本地发布或打包产物，不是源代码。其中文件可能包含已有桌面发行包，本轮没有删除。此前 Codex 聊天目录中的离线 HTML、ZIP 和旧截图也不属于当前 Git 仓库，不是正式入口依赖。

## 2026-10-10 入口盘点

| 页面 | 初始化 | 作用 |
| --- | --- | --- |
| `rooftop/index.html` | `rooftop/app.mjs` | 正式北天台、南阳台观察及手帐 |
| `rooftop/arrange/index.html` | 同一个 `app.mjs` | 车库，编辑天台、阳台与房间 |
| `rooftop/room/index.html` | `room/room.mjs` | 房间、换装和活动 |
| `rooftop/3d/index.html` | `3d/app.mjs` | 保留的早期三维观察入口，功能与正式观察页存在差异 |
| `rooftop/previews/pixel-01/index.html` | `previews/pixel-01/preview.mjs` | 历史美术样板，独立载入六个 GLB |

以上保留本轮开始时的入口记录。2026-10-11 已将场景测试统一到 [`rooftop/?stage=background`](rooftop-scene-review.md)，早期三维观察与历史样板地址均跳转到同一页；车库和房间继续作为独立功能页。

前三个正式页面共用 `3d/scene3d.mjs`。正式游戏的网格仍由代码中的共享构造建立，材质读取 `assets/pixel/material-book.png`；不会直接读取样板 GLB 或 `game-assets.blend`。

保存 Blend 中的手改不自动改变网页。下一轮家具重做需要明确完成源稿、导出与游戏接入的链路，再检查实际场景。

## 必须保留的资料与机制

当前目录有 304 项：110 种植物、37 种盆器、86 项枪械，以及家具和日常物件。日本古董盆器记录有 8 项；每个目录 ID 都有对应手帐随想，共 304 条。家具专属目录定义有 14 项，另有早期目录中的家具定义。

| 内容 | 文件 | 重制边界 |
| --- | --- | --- |
| 植物、园艺和容器限制 | `botany.mjs`、`botany-expansion.mjs`、`plant-seed.mjs` | 保留名称、学名、说明、养护、来源、适用盆器和稳定株形种子 |
| 日本古董与盆器 | `antique-vessels.mjs`、`botany.mjs`、`object-references.mjs` | 保留馆藏来源及园艺改作说明 |
| 枪械资料 | `weapons.mjs`、`firearms.mjs` | 保留 ID、名称、型号、年代、来源；这两个文件还含二维绘制，不能整文件删除 |
| 东东的手帐 | `notebook.mjs`、`notebook-comments.mjs` | 保留客观说明、人物随想、折叠来源；后续只调整呈现 |
| 天气和时刻 | `weather.mjs`、`atmosphere.mjs`、`precipitation.mjs` | 保留 9 种天气、7 个时刻、过渡、风雨、闪电及湿润历史 |
| 季节 | `seasons.mjs`、`3d/seasonal-air.mjs` | 保留春夏秋冬、月份自动选择及季节动态 |
| 东东和小猪行为 | `resident.mjs`、`resident-weather.mjs`、`actor-space.mjs`、`scene.mjs` 中的 `makeWalker` | 保留外出、返回、养护、避雨、天气动作、寻路及身体避让 |
| 换装与房间活动 | `wardrobe.mjs`、`room/room.mjs` | 保留 35 套服装、35 种小猪装饰、12 种人物活动及刷新换装规则 |
| 放置与家具承托 | `placement-editor.mjs`、`3d/spatial-layout.mjs`、`3d/placement-profiles.mjs`、`actor-space.mjs` | 保留实际承放、碰撞、上下层空间、携带移动、取物及撤销重做 |
| 布局与旧存档 | `initial-layout.mjs`、`scene.mjs`、`layout-storage.mjs`、`edit-history.mjs` | 保留 ID、布局验证、迁移、导入导出及历史版本兼容 |
| 卡片与音乐 | `card-feed.mjs`、`music.mjs`、共用音频 | 保留卡片出现顺序与声音行为 |

布局存储键继续为 `umwelt-rooftop-layout-v1`，布局版本 2、房间版本 2、空间版本 1；天气与衣柜分别使用 `umwelt-rooftop-weather-v1` 和 `umwelt-dongdong-wardrobe-v1`。当前默认北天台 86 件、南阳台 20 件、房间 19 件，本轮没有改动。

必要动态在减少动态效果开启时仍应可见；季节、风雨、角色动作与卡片顺序不能因为重制冻结。保留紧凑界面及北天台、南阳台、房间三个按钮同排的安排。

## 当前视觉文件

下表三维模块均在 `rooftop/3d/`；同一格中首项标出 `3d/` 的其他模型文件也属于该目录。其余路径相对于 `rooftop/`。完整路径与直接引用关系见本轮文件清单。

| 范围 | 主要文件 | 下一轮职责 |
| --- | --- | --- |
| 建筑与空间 | `house-structure.mjs`、`3d/house-roof.mjs`、`3d/terrace-floor.mjs`、`3d/neighborhood.mjs`、`3d/street-models.mjs`、`3d/terrace-view.mjs` | 天台地面、围墙、门、主体住宅、周边背景及取景 |
| 天气呈现 | `3d/atmosphere.mjs`、`3d/seasonal-air.mjs` | 新背景下的天空、灯光、雨雪与季节动态；沿用天气状态 |
| 家具与杂物 | `3d/object-models.mjs`、`stand-models.mjs`、`rack-grid.mjs`、`washstation.mjs`、`glass-cases.mjs`、`soft-goods.mjs`、`garden-tools.mjs`、`balcony-models.mjs` | 重新设计家具外形、材质和结构，按新结构更新承托面与碰撞尺寸 |
| 植物与容器 | `3d/plant-models.mjs`、`cactus-models.mjs`、`plant-materials.mjs`、`plant-pots.mjs`、`plant-envelope.mjs`、`vessel-models.mjs`、`vessel-art.mjs`、`water-models.mjs`、`water-life.mjs`、`soil-surface.mjs` | 基于原资料调整外观 |
| 角色 | `3d/residents.mjs`、`dongdong.mjs`、`wardrobe.mjs` | 重做东东、小猪、服装及装饰的外观，沿用动作状态 |
| 共用材质与模型工具 | `3d/native-materials.mjs`、`native-book.mjs`、`native-style.mjs`、`model-surfaces.mjs`、`object-dimensions.mjs`、`model-random.mjs`、`surface-variation.mjs`、`surface-emission.mjs`、`object-finish.mjs`、`weathering.mjs`、`render-budget.mjs` | 贴图接入、模型结构、天气响应和性能 |
| 界面与预览 | `rooftop.css`、`room/room.css`、`catalog-previews.mjs`、`notebook.mjs`、各 HTML | 统一手帐、目录和操作控件的外观 |
| 二维绘制与回退 | `scene.mjs`、`plant-art.mjs`、`plant-expansion-art.mjs`、`facing.mjs`、`styled-views.mjs`、`city.mjs`、`camera.mjs`、`room-scene.mjs` 及各目录文件内的绘制函数 | 仍支撑回退、接触边界或部分预览，按实际用途逐步替换 |

`scene.mjs` 同时承担目录汇合、存档验证、空间边界、二维绘制和人物行走；`app.mjs` 同时协调观察与车库；`3d/scene3d.mjs` 同时建立场景、模型、镜头和拾取。它们是后续调整的主要接口，清理时不能按“旧视觉文件”整份删除。

## 原稿与历史残留

| 位置 | 当前归属 |
| --- | --- |
| `docs/art/rooftop-game/material-book.pxo` 与 `game-assets.blend` | 上一轮全游戏原稿，保留；新家具将另行设计 |
| `docs/art/rooftop-game/` 的账本、审计、笔触和截图 | 上一轮制作与验证记录；约 26.5 MiB，不进入发布包 |
| `docs/art/rooftop-pixel-01/` | 历史样板原稿与审阅资料；约 3.7 MiB |
| `rooftop/previews/pixel-01/` | 历史独立预览仍可访问；六个 GLB 与正式游戏构造不同 |
| `rooftop/3d/app.mjs` 与 `index.html` | 兼容观察入口，仍被最终发布包入口检查覆盖 |
| `rooftop/3d/surface-grid.mjs` | 当前原稿导出和原生贴面测试使用的 CPU 工具，不是废弃代码 |
| `rooftop/3d/face-paintings.mjs`、`antique-paintings.mjs`、`vessel-art.mjs` | 仍被正式模型引用；本轮保留 |
| `docs/rooftop-art-direction.md`、`rooftop-object-views.md` | 旧视觉和二维绘制记录，已标明历史范围 |

旧原稿和检查记录保留可追溯性。历史“已认可”“通过测试”“已发布”只描述对应阶段，不作为这次重制的视觉标准。

## 本轮完成的清理

以下模块已从 `rooftop/3d/` 迁至 `docs/art/rooftop-legacy-materials/`，退出发布包，共 59,599 字节。它们不在正式或兼容游戏入口的运行依赖中，但仍保留制作和历史测试用途。

- `pixel-materials.mjs`：旧材质生成器。
- `environment-paintings.mjs`：旧建筑和铺地笔画配方。
- `resident-paintings.mjs`：旧皮肤、头发与衣料配方。
- `paint-recipes.mjs`：旧材质笔画计划。
- `contact-paint.mjs`：旧接触暗部算法。

原稿准备工具及历史测试的导入路径已同步。九份文档更新了模块归属、入口说明和样板状态，纠正了原生与程序绘制规格混用、旧默认数量及“尚未接入”等过期描述。没有运行会覆盖原稿的制作命令。

## 视觉重制顺序

1. **准备空天台。** 用独立空布局作为背景制作基准，先移开陈列物件。保留原默认布局快照、资料目录和用户存档，维持门、镜头、天气与季节。角色可作为尺寸参照，视觉验收时明确是否显示。
2. **稳定天台背景。** 先确定地面、围墙、门、建筑比例、邻楼、天空和镜头构图，再检查南北场景、窄屏、各时刻与天气。背景稳定前不开始整套家具制作。
3. **重新设计家具。** 用新原稿建立新外形；旧 ID 可作为存档识别标识保留。新几何要重新测定尺寸、层板、空腔、承托面和通行空间，放置规则保持原有作用。
4. **重制角色外观。** 东东、小猪、服装和装饰沿用现有动作与活动系统，替换模型与视觉呈现。
5. **统一资料库外观。** 植物、日本古董、枪械及手帐使用原内容，调整物件外观、预览和界面。

源稿继续使用实际 Pixelorama 和 Blender 制作。背景与家具分阶段验收，避免在上一轮贴图上反复叠加未稳定的整场修改。

## 本轮验证

整理前后各运行一次全仓库结构检查，346 项 Node 测试及全部结构、资料、语言与公开入口检查通过。正式入口的静态运行依赖逐字节保持一致；发布包对比只减少上述五个无运行引用的模块，其余发布文件逐字节一致。二维回退、资料、角色行为、默认陈列及 PXO、Blend、PNG 均未改动。

本轮保存在本地分支 `codex/rooftop-repository-cleanup`，没有发布视觉更新。后续视觉改动需在真实浏览器中验证天气、时间、角色动作、放置、存档、减少动态效果及窄屏表现；本轮的自动检查不代表新画面的视觉验收。

## 2026-10-10：空天台背景审核版

本地入口 `rooftop/?stage=background` 已接入 Blender 导出的建筑及楼群、Pixelorama 的独立建筑贴图。南北摆放为空，东东和小猪隐藏；天气、时刻、季节、手帐和动作系统保留。初版审核车库使用独立会话陈列，不覆盖原存档；这一陈列属于历史审核机制。2026-10-11 统一测试页后，观察入口永久保持空场景，在验证前丢弃南北陈列，只读保留房间与版本元数据，不把空布局写入原存档。已有物品与原存档继续在独立车库 `/rooftop/arrange/` 使用。

源文件及制作/核验说明见 [空天台背景第一版](art/rooftop-background-01/README.md)。这是背景审核阶段，尚未开始家具重设，尚未上线。

2026-10-11 继续按航拍修正：本楼位于中间，三对相邻露台之间保留可容纳两间小车库的退台；本楼楼下不设商铺。南面对面楼复用本楼楼型，北面对面楼按实拍封闭阳台、雨篷和老外墙制作。近处楼排全部平行，撤去原先自行补出的垂直侧楼和环绕高楼，外围老楼与北侧高层位置读取 `map-layout.json` 的航拍取点。街道、绿化、停车和相邻楼排店面均为 Blender 原生网格，可复用源集合。航拍和照片核对不能替代到户尺寸实测；本阶段继续本地审核。

## 2026-10-11：统一空场景测试入口

唯一的场景测试页为 `rooftop/?stage=background`。南北阳台、天台、楼排、远处、小鸟、无人机、邻居视角及天气、时间点、季节均在同一页切换，选择同步到 URL，刷新可恢复。旧 `stage=game-model`、`test=1` 及两处独立预览地址继续兼容到这一入口。物品在独立车库处理，场景观察始终为空；本次合并没有修改 Blender、Pixelorama 源稿或建筑模型。使用方式与存档边界见 [综合场景测试](rooftop-scene-review.md)，本次检查资料见 [审核记录](art/rooftop-review-01/)。

# 花农时代维护与扩容

文档与源文件见[文档入口](../README.md)，完整模型、Pixelorama 材料格和最终低采样见[制作管线](pixel-style.md)。空气效果契约见[空间天气](../art/rooftop-air-coverage-01/README.md)。

## 页面与存档

- `rooftop/`：北天台与南阳台游戏观察，展示保存陈列，无存档时使用初始布置。
- `rooftop/tests/browser/rooftop.html`：固定本地测试页，包含空场景、物件图册和初始组合；不读取个人陈列或换装存档。
- `rooftop/arrange/`：车库，编辑北天台、南阳台和房间陈列。
- `rooftop/room/`：房间、衣柜与活动。

布局使用 `umwelt-rooftop-layout-v1`。当前为 `version:2`，包含 `scenes.north`、`scenes.south`、`scenes.room`，迁移标记为 `roomVersion:2`、`spaceVersion:2`，目录标记为 `native-items-294-v1`。`validateLayout()` 继续接受版本 1；缺少房间时补入默认房间，南阳台坐标沿用兼容迁移。保留存储键、物件 ID、seed、旋转及缩放序列化约定，每场景上限 400 件。

游戏、车库和房间读取同一本机布局。初始布置保存在 `initial-layout.mjs`：北天台 83 件、南阳台 14 件、房间 21 件。无存档时使用此布置；已有新目录存档，包括空布局，正常保留、导出和跨页面同步。旧目录陈列首次进入可编辑页面时恢复当前初始布置并写入新目录标记；没有旧布局备份入口。公开观察读取完整陈列而不写回存档；布局损坏时仅在内存中回退到初始布置。车库“恢复初始”恢复当前场景的初始物件，“清空”仍可腾空当前场景。统一测试在场景组中清空物件、在物件组中单独加载目录模型、在初始组合组中读取固定初始布置；三组不使用个人布局。换装存档独立保留。

南北阳台在 `HOUSE` 中属于同一住宅，连接相对屋檐。存档使用各自局部坐标，公开页按住宅坐标构建完整两侧，取景约束在当前一侧。屋檐不提供家具承放层位。承放面、层位身份、碰撞、携带与手势见[承放关系](placement.md)。

可视测试统一使用 [`/rooftop/tests/browser/rooftop.html`](../tests/browser/rooftop.html)。三组内容、环境与取景操作见[测试说明](scene-review.md)。

## 原稿与呈现

原稿与导出位置见[原稿索引](../art/README.md)，材料标定和最终采样规则见[像素管线](pixel-style.md)。场景由 `3d/scene3d.mjs` 汇合建筑、目录物件、房间、人物和天气；加载器职责见[立体场景模块](../3d/README.md)。

模型、UV、运行导出和存档接口分别核对。物品目录更新通过原生制作管线完成，不能用目录或视觉整理替换现有保存数据。

## 模块接口

| 模块 | 职责 |
| --- | --- |
| `app.mjs` | 初始化、拖动、导入导出与交互协调 |
| `edit-history.mjs`、`layout-storage.mjs` | 80 步撤销重做、共享存档读取验证与写入 |
| `review-state.mjs`、`background-review.css` | 空场景测试状态、URL 参数和控件 |
| `scene.mjs` | 目录汇合、布局验证迁移、边界与绘制分发 |
| `botany.mjs`、`plant-art.mjs`、`plant-seed.mjs` | 植物及容器数据、绘制和稳定株形 |
| `item-catalog.mjs`、`item-data.mjs` | 新物品目录、原资料映射与统一米制尺寸 |
| `3d/native-model-loader.mjs`、`native-structural-visibility.mjs` | 原生 GLB／七图集加载、共享材质、细杆显示补偿 |
| `3d/room-background-loader.mjs`、`room-door.mjs` | 原生房间背景、透明窗、原位置活动门叶 |
| `initial-layout.mjs`、`room-scene.mjs` | 初始陈列及房间二维回退 |
| `room/room.mjs`、`wardrobe.mjs`、`card-feed.mjs` | 房间活动、换装和提示卡 |
| `notebook.mjs`、`notebook-comments.mjs`、`native-item-notes.mjs` | 汇合植物与目录记录的来源、手帐描述与逐件人物随想；上游记录见[手帐数据职责](notebook.md#数据职责) |
| `house-structure.mjs`、`3d/architectural-shell.mjs` | 住宅坐标变换和 Blender 建筑加载 |
| `3d/terrace-finishes.mjs` | 主角两处天台独立 GLB、材料与天气；原建筑沙盘保持独立 |
| `3d/story-camera.mjs`、`3d/terrace-view.mjs` | 游戏三视角及额外测试近景约束 |
| `weather.mjs`、`weather-condition.mjs` | 天气选择、过渡、湿润历史和兼容输入 |
| `atmosphere.mjs`、`precipitation.mjs` | 时间光照、风、闪电、雨型与落点 |
| `resident.mjs`、`resident-weather.mjs`、`actor-space.mjs` | 外出、天气动作和身体通行空间 |
| `3d/scene3d.mjs` | 场景、实例批次、模型缓存、镜头和编辑投影 |
| `3d/atmosphere.mjs`、`3d/seasonal-air.mjs`、`3d/visible-air.mjs` | 灯光、雨、积水、季节粒子与有界世界空气分配 |
| `3d/native-style.mjs`、`native-materials.mjs`、`native-book.mjs` | 人物共用材料格、图集缓存和环境参数 |
| `3d/rack-grid.mjs`、`spatial-layout.mjs` | 真实承放面、开孔和格栅支持判断 |
| `3d/residents.mjs` | 人物身体、衣服与装饰 |
| `arrange/index.html`、`rooftop.css`、`editor.css` | 车库结构与样式；工具栏在窄屏换行后各行左对齐，导入面板限制在工具栏宽度内 |

植物资料从 `botany.mjs` 入手，所有新模型先在 `rooftop/art/rooftop-furniture-02/` 的原生管线完成、核对，再运行 `sync-runtime-catalog.py` 同步新目录、承放资料和实际模型缩略图。家具只整理新目录，原植物子类、收藏、枪械与兵器资料不随视觉重做改名。材质书保留当前可编辑原稿和必要绘制工具。`scene.mjs` 的兼容尺寸、二维回退和图鉴绘制不能作为重复目录删除。

## 镜头与环境

公开天台打开时默认无人机，初始高度为各侧最高点降低两档：北侧相对基础悬停点升高 5.25、南侧升高 3 个场景单位。每次升降 0.75，北侧上限为 6.75、下限为 −2.75，南侧上限为 4.5、下限为 −3；上限均比原版增加六档。

默认机位沿水平观察方向后退 2 个场景单位（`dolly = -2`，也是退远下限），让天台边缘更完整地入镜。后退只改变水平位置，保留当前高度、镜头视野及最终像素采样。靠近两档回到基础位置（`dolly = 0`），之后沿用原有接近路线。切回无人机、切换阳台或复位时使用对应的初始高度与后退位置。默认视角与初始高度由 `3d/story-camera.mjs` 集中提供，正式游戏和测试页共用。

小鸟沿檐左右各可移动 5 个场景单位，比原范围增加 25%，转头限幅为 ±0.35 弧度；机位向天台前移 0.6 个场景单位，并相应收紧画面跨度以保留原有镜头角度，减少近处屋檐占比。无人机拖动转头，按钮升降，滚轮或双指靠近／退远；邻居改变观察位置和倍率。按钮和手势共享同一套约束。

完整楼体、双坡屋顶和两侧阳台保持可见实体，公开页使用透视投影，车库与目录画像使用正交投影。切换阳台和复位同步更新镜头及门点击区域；窄屏分别检查南北门口和邻居圆形镜片。最终像素格规格见[像素管线](pixel-style.md)。

建筑校准以地面、层高、楼顶为共同基准，同时检查门窗、楼体和道路；附近六层楼顶保持相近标高，楼体上缘与屋檐相接。测试近景平移保留余量，公开游戏按自身观察范围约束。方法见 [Three.js 相机](https://threejs.org/manual/pages/cameras.html)与[场景层级](https://threejs.org/manual/pages/scenegraph.html)。

柳絮、落叶、雪和雨按三个游戏视角的实际世界视锥分配，保持稳定身份、远近、遮挡、风向和连续运动。邻居使用有效镜片区域；夏季蚊虫保持露台低位，雾按世界距离变化。额外天台、楼排、远处用于材料审核，沿用局部预算。

手选和自动池共 8 种天气，阴天规范值为 `overcast`，`cloudy` 兼容旧 URL 和保存值。7 个时段及四季保持。公开观察和综合测试手选过渡为 8 秒，车库为 0.65 秒，自动时钟切换为 18 秒；中途换目标从当前快照过渡。雨线和雨点累计运动时钟，积水随可见雨量累积后逐渐干燥。

雨天意图立即停止浇水。天气动作与行动卡由 `resident-weather.mjs` 协调，同一次天气保持选定片段；入场、环境变化、外出归来和抵达避雨点才更新。普通步行与短暂姿势变化不换卡，日常停留为 45–90 秒。正式游戏显示东东和小猪，东东按原有在家／外出状态出现，小猪继续行走；雨天照料与避雨仍由共用行为机制决定。统一测试的场景组隐藏角色；初始组合组显示角色，并更新其日常行为。

## 手帐

手帐正文为客观描述、一句人物随想及折叠来源；科学名只在植物名旁出现。随想采用简短、客观而留白的语气，不写人称代词、反问或固定归属。换盆、换株形控制在资料之后。公开页面悬停 350 毫秒查看、点击固定，拖动和双指手势不打开手帐；关闭键与 Escape 合上，面板独立滚动，窄屏限制屏高 44%。工具栏下方保留 8px 间距，关闭按钮可点击。

继续制作所需资料见[器物与材质](art-sources.md)、[植物与容器](notebook.md)及[四季光照与天气](../art/rooftop-atmosphere-01/README.md)。

## 性能与缓存

只按完整生成源码合并着色程序，材质颜色、风动、投影、潮湿和陶器分支保持各自参数。几何仅在类型、容器、seed 或垂吊植物裁切结构改变时重建；移动、旋转、缩放与环境变化复用模型。固定矩阵冻结，人物关节、编辑物件和风动继续更新。

人物路径按布局缓存，编辑后清除；另一角色身体作为临时障碍，连格点间路段也检查，不写入家具缓存。门口拥堵时寻找空位。

雨、落点和季节特效使用有界预分配缓冲，积水和湿润通过共享参数更新。灯光着色结构固定，阴影按 0.22 秒更新；静止场景约 30 帧，镜头操作提高更新频率。大屏和软件渲染限制缓冲面积，GPU 同时提交一帧，镜头缓动计入跳帧时间。目录只分帧绘制可见项，筛选变化取消旧任务，绘制期间临时固定环境后恢复。

`graphics.performance` 提供最近 90 次绘制的 p95 和最后一次耗时，含提交开销。性能检查包括密集陈列、环境切换、台风、镜头与拖动，核对纹理、模型和缓冲不会持续增长。

## 验证

运行 `node tools/check-all.mjs` 检查全项目契约，或按范围运行 `node --test rooftop/tests/*.test.mjs`。场景重点为 `rooftop-background`、`rooftop-terraces`、`rooftop-review`、`rooftop-story-camera`、`rooftop-door-projection`、`rooftop-outdoor-raster`、`rooftop-visible-air`、`rooftop-seasonal-coverage` 和 `rooftop-native-loader`；材料修改还须核对原稿与导出。

实际浏览器检查公开南北三视角、本地统一测试的三组内容、环境切换及刷新、窄屏手帐、车库存档恢复与保存字节不变。`rooftop/tests/browser/rooftop-observation.cjs`、`rooftop-weather.cjs` 检查观察及环境；`rooftop-garage-layout.cjs` 检查排布，`rooftop-room.cjs` 检查房间与跨页面存档，`rooftop-maintenance.cjs` 检查撤销重做、多指隔离及保存。

纯整理或格式化保留调用顺序、异常边界、数据和序列化。`rooftop-maintenance.cjs` 的 `COMPARE_URL` 在四种宽度、车库三场景及公开南北和房间比较 36 组画面；固定时间、随机值和动画帧只作用于测试环境。正常动画与交互另行回归。

`rooftop-regression.yml` 在 Chromium／WebKit 检查游戏页面。Pages 工作流验证最终发布包及入口；源文件存在不代表已经接入网页，发布状态以 Actions 和实际网址核验为准。共用方法见[验证和发布](../../docs/deployment.md)。

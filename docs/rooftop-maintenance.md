# 花农时代维护与扩容

文档与源文件见[文档入口](rooftop-README.md)，完整模型、Pixelorama 材料格和最终低采样见[制作管线](rooftop-pixel-style.md)。当前发布状态见[场景核验](art/rooftop-air-coverage-01/README.md)。

## 页面与存档

- `rooftop/`：北天台与南阳台游戏观察，南北场景空开场。
- `rooftop/?stage=background`：唯一且永久为空的综合场景测试，不放物品、不显示角色。
- `rooftop/arrange/`：车库，编辑北天台、南阳台和房间陈列。
- `rooftop/room/`：房间、衣柜与活动。

布局使用 `umwelt-rooftop-layout-v1`。当前为 `version:2`，包含 `scenes.north`、`scenes.south`、`scenes.room`，迁移标记为 `roomVersion:2`、`spaceVersion:1`。`validateLayout()` 继续接受版本 1；缺少房间时补入默认房间，南阳台坐标沿用兼容迁移。保留存储键、物件 ID、seed、旋转及缩放序列化约定，每场景上限 400 件。

车库优先读取本机布局；无存档或恢复默认时南北为空，房间保留原有陈列。公开观察和综合测试只清空观察用布局，保留房间及版本元数据，不写回车库存档。综合测试使用隔离的审核会话存储，移除 `layout=local`。房间另行检查自身读写和共享布局同步。

南北阳台在 `HOUSE` 中属于同一住宅，连接相对屋檐。存档使用各自局部坐标，公开页按住宅坐标构建完整两侧，取景约束在当前一侧。屋檐不提供家具承放层位。承放面、层位身份、碰撞、携带与手势见[承放关系](rooftop-placement.md)。

兼容入口 `/rooftop/3d/`、`/rooftop/previews/pixel-01/` 与 `stage=game-model` 转入同一综合测试。参数和六种取景见[测试说明](rooftop-scene-review.md)。

## 原稿与呈现

[建筑源文件](art/rooftop-lowpoly-02/README.md)包含完整 `game-environment.blend`、主图 `terrace-book.pxo` 和远景 `distance-facades.pxo`。`3d/architectural-shell.mjs` 加载 `assets/background/empty-rooftop.mjs`、`.bin` 及 PNG。主图为 1024×1024，近景用 `texelMetresPerUnit` 还原长度，再按 `texelsPerMetre:16` 取样；远景由 `baked-pixel-grid.mjs` 在原烘焙 UV 上取同一物理格，窗灯图共用坐标。正面、侧面、背面和底面均核对绑定。

现有物品、人物和室内使用[物品源文件](art/rooftop-game/README.md)与 `assets/pixel/material-book.png`，`native-style.mjs` 标定每游戏世界单位 8 像素。坐标换算与建筑米制管线不同，不能全局替换数值。`surface-grid.mjs` 的 CPU 入口与原生材质着色器保持相同正交面格，原稿长度、实例缩放和面倾角参与换算。

新家具继续完整 Blender＋Pixelorama 工作流，完成器形、厚度、背面、底面、开孔和承放结构。物理材料格与建筑对照，粗颗粒感由最终低采样控制；不能以删减结构或放大笔触代替。保存并重开原稿后，分别核对导出、游戏内接入和发布包，保护已有手改与存档接口。

`3d/outdoor-raster.mjs` 与 `pixel-grid.mjs` 共用 2.5 CSS 像素目标，按 DPR 取整数设备格；DPR 2 为每格 5×5 实际像素，与家具近看一致。建筑、天气、季节粒子和光照共用离屏渲染，邻居光学变形、遮罩与刻线沿用同一格。右下不足一格的部分裁边，保持相机逻辑取景和交互投影。DPR 变化时更新缓冲、粒子尺寸、取物射线与镜头缓存。公开南北、空场景测试和车库户外共用呈现；房间与目录画像使用各自预算。

## 模块接口

| 模块 | 职责 |
| --- | --- |
| `app.mjs` | 初始化、拖动、导入导出与交互协调 |
| `edit-history.mjs`、`layout-storage.mjs` | 80 步撤销重做、共享存档读取验证与写入 |
| `review-state.mjs`、`background-review.css` | 空场景测试状态、URL 参数和控件 |
| `scene.mjs` | 目录汇合、布局验证迁移、边界与绘制分发 |
| `botany.mjs`、`plant-art.mjs`、`plant-seed.mjs` | 植物及容器数据、绘制和稳定株形 |
| `furniture.mjs`、`objects.mjs` | 家具与小物目录 |
| `initial-layout.mjs`、`room-scene.mjs` | 默认布局及房间布景 |
| `room/room.mjs`、`wardrobe.mjs`、`card-feed.mjs` | 房间活动、换装和提示卡 |
| `object-references.mjs`、`notebook.mjs`、`notebook-comments.mjs` | 资料归属、手帐描述与逐件人物随想 |
| `house-structure.mjs`、`3d/architectural-shell.mjs` | 住宅坐标变换和 Blender 建筑加载 |
| `3d/story-camera.mjs`、`3d/terrace-view.mjs` | 游戏三视角及额外测试近景约束 |
| `weather.mjs`、`weather-condition.mjs` | 天气选择、过渡、湿润历史和兼容输入 |
| `atmosphere.mjs`、`precipitation.mjs` | 时间光照、风、闪电、雨型与落点 |
| `resident.mjs`、`resident-weather.mjs`、`actor-space.mjs` | 外出、天气动作和身体通行空间 |
| `3d/scene3d.mjs` | 场景、实例批次、模型缓存、镜头和编辑投影 |
| `3d/atmosphere.mjs`、`3d/seasonal-air.mjs`、`3d/visible-air.mjs` | 灯光、雨、积水、季节粒子与有界世界空气分配 |
| `3d/native-style.mjs`、`native-materials.mjs`、`native-book.mjs` | 物品材料格、原生图集、共享缓存和环境参数 |
| `3d/stand-models.mjs`、`rack-grid.mjs` | 共用花架构造、开孔和承放规则 |
| `3d/cactus-models.mjs`、`water-models.mjs`、`plant-materials.mjs` | 仙人掌、水盆与叶面 |
| `3d/soil-surface.mjs`、`residents.mjs` | 闭合盆土及人物身体、衣服与装饰 |
| `arrange/index.html`、`rooftop.css` | 车库结构与样式 |

扩容植物从 `botany.mjs` 和 `plant-art.mjs` 入手，家具从 `furniture.mjs` 入手。`docs/art/rooftop-legacy-materials/` 仍供原稿准备与检查调用。`scene.mjs` 的兼容尺寸、二维回退和图鉴绘制不能作为重复目录删除。

## 镜头与环境

公开天台默认小鸟，沿屋檐移动并有限转头；无人机有限升降、前后移动与偏转；邻居改变观察位置和倍率。按钮和手势共享 `3d/story-camera.mjs`。完整楼体、双坡屋顶和两侧阳台保持可见实体，公开页使用透视投影，车库与目录画像使用正交投影。切换阳台和复位同步更新镜头及门点击区域；窄屏分别检查南北门口和邻居圆形镜片。

建筑校准以地面、层高、楼顶为共同基准，同时检查门窗、楼体和道路；附近六层楼顶保持相近标高，楼体上缘与屋檐相接。测试近景平移保留余量，公开游戏按自身观察范围约束。方法见 [Three.js 相机](https://threejs.org/manual/pages/cameras.html)与[场景层级](https://threejs.org/manual/pages/scenegraph.html)。

柳絮、落叶、雪和雨按三个游戏视角的实际世界视锥分配，保持稳定身份、远近、遮挡、风向和连续运动。邻居使用有效镜片区域；夏季蚊虫保持露台低位，雾按世界距离变化。额外天台、楼排、远处用于材料审核，沿用局部预算。

手选和自动池共 8 种天气，阴天规范值为 `overcast`，`cloudy` 兼容旧 URL 和保存值。7 个时段及四季保持。公开观察和综合测试手选过渡为 8 秒，车库为 0.65 秒，自动时钟切换为 18 秒；中途换目标从当前快照过渡。雨线和雨点累计运动时钟，积水随可见雨量累积后逐渐干燥。

雨天意图立即停止浇水。天气动作与行动卡由 `resident-weather.mjs` 协调，同一次天气保持选定片段；入场、环境变化、外出归来和抵达避雨点才更新。普通步行与短暂姿势变化不换卡，日常停留为 45–90 秒。综合测试仅隐藏角色模型，保留行为机制。

## 手帐

手帐正文为客观描述、一句人物随想及折叠来源；科学名只在植物名旁出现。随想采用简短、客观而留白的语气，不写人称代词、反问或固定归属。换盆、换株形控制在资料之后。公开页面悬停 350 毫秒查看、点击固定，拖动和双指手势不打开手帐；关闭键与 Escape 合上，面板独立滚动，窄屏限制屏高 44%。工具栏下方保留 8px 间距，关闭按钮可点击。

继续制作所需资料见[器物与材质](rooftop-art-sources.md)、[植物与容器](rooftop-notebook.md)及[四季光照与天气](art/rooftop-atmosphere-01/README.md)。

## 性能与缓存

只按完整生成源码合并着色程序，材质颜色、风动、投影、潮湿和陶器分支保持各自参数。几何仅在类型、容器、seed 或垂吊植物裁切结构改变时重建；移动、旋转、缩放与环境变化复用模型。固定矩阵冻结，人物关节、编辑物件和风动继续更新。

人物路径按布局缓存，编辑后清除；另一角色身体作为临时障碍，连格点间路段也检查，不写入家具缓存。门口拥堵时寻找空位。

雨、落点和季节特效使用有界预分配缓冲，积水和湿润通过共享参数更新。灯光着色结构固定，阴影按 0.22 秒更新；静止场景约 30 帧，镜头操作提高更新频率。大屏和软件渲染限制缓冲面积，GPU 同时提交一帧，镜头缓动计入跳帧时间。目录只分帧绘制可见项，筛选变化取消旧任务，绘制期间临时固定环境后恢复。

`graphics.performance` 提供最近 90 次绘制的 p95 和最后一次耗时，含提交开销。性能检查包括密集陈列、环境切换、台风、镜头与拖动，核对纹理、模型和缓冲不会持续增长。

## 验证

运行 `node isopoda/tools/check-all.mjs` 检查全项目契约，或按范围运行 `node --test tests/rooftop*.test.mjs`。场景重点为 `rooftop-background`、`rooftop-review`、`rooftop-story-camera`、`rooftop-door-projection`、`rooftop-outdoor-raster`、`rooftop-visible-air`、`rooftop-seasonal-coverage` 和 `rooftop-render-budget`；材料修改还须核对原稿与导出。

实际浏览器检查公开南北三视角、空测试六视角、环境切换及刷新、兼容入口、窄屏手帐、车库存档恢复与保存字节不变。`tests/browser/rooftop-observation.cjs`、`rooftop-weather.cjs` 检查观察及环境；`rooftop-garage-layout.cjs` 检查排布，`rooftop-room.cjs` 检查房间与跨页面存档，`rooftop-maintenance.cjs` 检查撤销重做、多指隔离及保存。

纯整理或格式化保留调用顺序、异常边界、数据和序列化。`rooftop-maintenance.cjs` 的 `COMPARE_URL` 在四种宽度、车库三场景及公开南北和房间比较 36 组画面；固定时间、随机值和动画帧只作用于测试环境。正常动画与交互另行回归。

`rooftop-regression.yml` 在 Chromium／WebKit 检查游戏页面。Pages 工作流验证最终发布包及入口；源文件存在不代表已经接入网页，发布状态以 Actions 和实际网址核验为准。共用方法见[验证和发布](../isopoda/docs/deployment.md)。

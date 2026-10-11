# 花农时代立体场景模块

`scene3d.mjs` 是天台、车库和房间共用的渲染器。`/rooftop/` 与 `/rooftop/arrange/` 从 `../app.mjs` 初始化，房间从 `../room/room.mjs` 初始化。入口、源文件与发布状态见[文档入口](../../docs/rooftop-README.md)，操作见[综合场景测试](../../docs/rooftop-scene-review.md)。

[`/rooftop/?stage=background`](../?stage=background) 是唯一且永久为空的场景测试页，提供南北、六视角、天气、时间点与季节切换。物品和存档在独立车库页面使用。`/rooftop/3d/` 自动跳转到综合测试，保留有效环境参数，去除 `layout=local`；关闭 JavaScript 时显示统一入口链接。

## 资源管线

- 建筑、阳台与街区由 `architectural-shell.mjs` 加载 `../assets/background/empty-rooftop.mjs` 及 `.bin`。可编辑源文件为 [`docs/art/rooftop-lowpoly-02/`](../../docs/art/rooftop-lowpoly-02/README.md) 的 `game-environment.blend`、`terrace-book.pxo` 与 `distance-facades.pxo`。主图为 1024×1024，物理材料格为 16 像素／米，远景通过 `baked-pixel-grid.mjs` 共用同一标定。
- 目录物品由 `native-model-loader.mjs` 加载 `../assets/items/` 的独立 Blender GLB 和 Pixelorama 图集；房间由 `room-background-loader.mjs` 加载 `../assets/room/`，活动门由 `room-door.mjs` 保留原互动。新源纹理为 16 像素／米，模型统一使用 `ITEM_METRES_TO_UNITS = 5.6 / 3`。源文件分别保存在 `docs/art/rooftop-furniture-02/` 和 `docs/art/rooftop-room-01/`。
- `outdoor-raster.mjs` 与 `pixel-grid.mjs` 将户外画面按约 2.5 CSS 像素的整数设备格显示；DPR 2 为每格 5×5 实际像素。完整模型和原生贴图继续保留细节，粗颗粒感由共享最终采样产生。场景与家具近看使用同一规则，详见[像素制作管线](../../docs/rooftop-pixel-style.md)。

旧物品的 22 个程序构造模块保存在 [`docs/art/rooftop-game/legacy-geometry/`](../../docs/art/rooftop-game/legacy-geometry/README.md)，由历史作者工具与检查读取。人物和共用绘制仍使用 `native-materials.mjs`、`native-book.mjs`、`native-style.mjs` 和 `../assets/pixel/material-book.png`；承放格栅、自然材质函数与 vendor 也继续用于正式场景。二维绘制继续支撑回退、存档边界和部分预览。

## 观察与环境

游戏使用小鸟、无人机、邻居三个实际观察位置；综合测试额外提供天台、楼排、远处。南北楼体、共用双坡屋顶和周边楼群保持完整，取景不靠隐藏建筑实现。

`visible-air.mjs` 为实际游戏视野分配有界世界空气体积，`seasonal-air.mjs` 与 `atmosphere.mjs` 保持粒子的世界轨迹、遮挡和远近层次，邻居按有效镜片范围分配预算。额外材料测试视角沿用局部预算。阴天 ID 为 `overcast`，兼容旧 `cloudy` 输入。

公开页与综合测试的南北场景为空，车库保存和恢复布局，房间保持独立。具体存档、镜头、材料、缓存与检查接口见[维护入口](../../docs/rooftop-maintenance.md)。

从仓库根目录提供静态文件即可查看。Three.js r160 从本地 vendor 载入，许可见 `vendor/THREE-LICENSE.txt`。

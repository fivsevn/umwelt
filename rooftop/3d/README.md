# 花农时代立体场景模块

[游戏文档](../README.md) · [运行与存档](../docs/maintenance.md) · [像素管线](../docs/pixel-style.md) · [视觉测试](../docs/scene-review.md)

`scene3d.mjs` 是天台、车库与房间共用的渲染器。天台和车库由 `../app.mjs` 初始化，房间由 `../room/room.mjs` 初始化。

| 模块 | 职责 |
| --- | --- |
| `architectural-shell.mjs` | 建筑清单、压缩网格与纹理加载；无解压支持时回退到原始网格 |
| `terrace-finishes.mjs` | 主角南北天台独立表层、补丁与下水口；共用正式与测试呈现 |
| `native-model-loader.mjs`、`room-background-loader.mjs` | 物件与房间 GLB、共享材质及实例缓存 |
| `outdoor-raster.mjs`、`pixel-grid.mjs` | 最终画面采样与设备像素格 |
| `story-camera.mjs`、`terrace-view.mjs` | 三种公开视角与测试取景 |
| `visible-air.mjs`、`seasonal-air.mjs`、`atmosphere.mjs` | 世界空间空气、季节粒子、光照与天气 |
| `spatial-layout.mjs`、`placement-profiles.mjs`、`rack-grid.mjs` | 承放面、碰撞、格栅与布局关系 |
| `residents.mjs`、`actor-pose.mjs` | 东东、小猪、服装与动作骨架 |
| `native-materials.mjs`、`native-book.mjs`、`native-style.mjs` | 人物及室外门仍使用的共用材质书 |

模型与可编辑贴图由[原稿索引](../art/README.md)定位，采样规格集中在像素管线文档。二维绘制仍支撑回退与目录预览；不要按文件名称判断为无用副本。

Three.js r160 从本地 `vendor/` 载入，许可见 `vendor/THREE-LICENSE.txt`。

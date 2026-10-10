# 花农时代立体场景模块

当前 `scene3d.mjs` 是正式天台、车库和房间共用的渲染器。`/rooftop/` 与 `/rooftop/arrange/` 从 `../app.mjs` 初始化，房间从 `../room/room.mjs` 初始化。

`/rooftop/3d/` 保留早期独立观察入口，拥有自己的 `app.mjs`，继续共用天气、居民、卡片、音乐和默认布局。它不等同于正式入口的全部控件与手帐交互。新视觉从共用渲染器接入，避免在两个观察入口重复实现。

当前三维网格由本目录共享构造模块建立；材质使用 `native-materials.mjs`、`native-book.mjs`、`native-style.mjs` 与 Pixelorama 原生导出的 `../assets/pixel/material-book.png`。Blender 原稿保存在 `docs/art/rooftop-game/`，手改原稿后需要另做导出和接入。

旧材质生成器和笔画配方已归档到 [旧材质制作代码](../../docs/art/rooftop-legacy-materials/README.md)。仍被正式模型引用的工具留在本目录；二维绘制也仍支撑回退、存档接触边界和部分预览。

北天台、南阳台与房间的当前默认陈列分别为 86、20、19 件。完整楼体、屋顶、附近楼群和透视取景的运行约定见 [维护入口](../../docs/rooftop-maintenance.md)。旧版“95 件北天台、只显示当前一侧、三栋邻楼”的描述已不适用于当前实现。

2026-10-10 开始的视觉重制先整理仓库，再清空天台调整背景，背景稳定后重新设计家具。范围与资料保留见 [重制边界](../../docs/rooftop-rebuild.md)。从仓库根目录提供静态文件即可查看；Three.js r160 从本地 vendor 载入，许可见 `vendor/THREE-LICENSE.txt`。

# 花农时代立体场景模块

当前 `scene3d.mjs` 是正式天台、车库和房间共用的渲染器。`/rooftop/` 与 `/rooftop/arrange/` 从 `../app.mjs` 初始化，房间从 `../room/room.mjs` 初始化。

当前入口、源稿与发布状态统一见 [花农时代维护索引](../../docs/rooftop-README.md)，测试操作见 [综合场景测试](../../docs/rooftop-scene-review.md)。

统一测试入口为 [`/rooftop/?stage=background`](../?stage=background)。同一页切换南北阳台、天台、楼排、远处、小鸟、无人机、邻居视角，以及天气、时间点和季节。测试观察场景始终为空；陈列和存档继续在车库中使用。

`/rooftop/3d/` 已收起早期独立观察界面，自动跳转到统一测试页，默认使用小鸟视角。旧链接中的 `scene`、`weather`、`time`、`season`、`view` 会带入统一页，`layout=local` 不会带入空场景。关闭 JavaScript 时显示同一个测试入口链接。早期 `app.mjs` 保留作历史源码，页面不再载入它；本目录共用渲染器、模型和 vendor 继续由正式游戏与原稿工具使用。

当前建筑与物品使用两条原生资源管线：

- 建筑、南北阳台与街区由 `architectural-shell.mjs` 读取已保存 Blender 原稿的导出数据。运行清单为 `../assets/background/empty-rooftop.mjs`，当前源稿为 `docs/art/rooftop-weathering-07/game-environment.blend`；实际 Pixelorama 图集为同目录 `terrace-book.pxo`，运行 PNG 为 `../assets/background/terrace-book.png`，1024×1024、16 像素/米。保存与导出核验见 [当前建筑原稿](../../docs/art/rooftop-weathering-07/README.md)。
- 目录物品与室内构造继续由本目录共享模块建立，使用 `native-materials.mjs`、`native-book.mjs`、`native-style.mjs` 与 Pixelorama 原生导出的 `../assets/pixel/material-book.png`，标定为每世界单位 8 像素。Blender 物品原稿保存在 `docs/art/rooftop-game/`，手改原稿后需要另做导出和接入；家具重制在下一阶段进行。

旧材质生成器和笔画配方已归档到 [旧材质制作代码](../../docs/art/rooftop-legacy-materials/README.md)。仍被正式模型引用的工具留在本目录；二维绘制也仍支撑回退、存档接触边界和部分预览。

默认原稿陈列分别为北天台 86、南阳台 20、房间 19 件；公开天台和综合测试的南北场景为空，车库继续保留可用陈列和已有存档。完整楼体、屋顶、附近楼群和透视取景的运行约定见 [维护入口](../../docs/rooftop-maintenance.md)。旧版“95 件北天台、只显示当前一侧、三栋邻楼”的描述已不适用于当前实现。

2026-10-10 开始的视觉重制先整理仓库，再清空天台调整背景，背景稳定后重新设计家具。范围与资料保留见 [重制边界](../../docs/rooftop-rebuild.md)。从仓库根目录提供静态文件即可查看；Three.js r160 从本地 vendor 载入，许可见 `vendor/THREE-LICENSE.txt`。

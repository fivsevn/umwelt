# 花农时代文档入口

花农时代使用完整的 Blender 模型与 Pixelorama 原生贴图，游戏画面共用约 2.5 CSS 像素的低采样呈现。当前建筑原稿见[建筑源文件](art/rooftop-lowpoly-02/README.md)，发布状态见[场景核验](art/rooftop-air-coverage-01/README.md)。

## 页面

| 入口 | 用途 |
| --- | --- |
| [游戏](https://umwelt.fivsevn.com/rooftop/) | 北天台、南阳台观察；公开南北场景空开场，使用小鸟、无人机、邻居三个视角 |
| [空场景综合测试](https://umwelt.fivsevn.com/rooftop/?stage=background) | 同一页切换南北、六个视角、8 种天气、7 个时段与四季；永久不放物品、不显示角色 |
| [车库／物品页面](https://umwelt.fivsevn.com/rooftop/arrange/) | 查看和编辑物品、已有本机布局与室内陈列；无存档时南北阳台为空 |
| [东东的房间](https://umwelt.fivsevn.com/rooftop/room/) | 房间、换装与活动 |

本地使用同一路径，例如 [综合测试](http://127.0.0.1:4173/rooftop/?stage=background)。旧 `/rooftop/3d/`、`/rooftop/previews/pixel-01/` 和 `stage=game-model` 兼容转入同一个综合测试页。

## 维护入口

- [像素制作管线](rooftop-pixel-style.md)：完整模型、物理材料格和最终屏幕采样。
- [维护与扩容](rooftop-maintenance.md)：运行模块、镜头、天气、存档和验证。
- [综合场景测试](rooftop-scene-review.md)：视角、环境参数及空场景操作。
- [物品承放关系](rooftop-placement.md)与 [`rooftop/AGENTS.md`](../rooftop/AGENTS.md)：承放面、碰撞、携带、取物和兼容迁移。
- [测试导航](../tests/README.md)与[验证和发布](../isopoda/docs/deployment.md)：共用检查和发布方法。

存档继续使用 `umwelt-rooftop-layout-v1`，布局版本 2、房间版本 2、空间版本 1。公开观察页和空场景测试页只清空观察用布局，不能写回车库存档。物品操作与恢复在车库进行。

## 制作方式

建模保持完整的器形、厚度、背面、底面、开孔和承放结构，继续采用像素画风。Pixelorama 最小像素格按实际长度统一，旧化按材质和使用位置绘制。游戏的粗颗粒感由共享低采样控制，不为获得粗糙画面而额外删减家具结构。原稿、导出资源、游戏内效果与最终发布包分别检查。

`3d/pixel-grid.mjs` 的目标为 2.5 CSS 像素，按设备像素比取完整设备像素方格；DPR 2 时每格为 5×5 实际像素。场景与家具近看共用这条规则，单个物品不另设像素尺寸。具体坐标换算与接入步骤见[制作管线](rooftop-pixel-style.md)。

## 当前资源与资料

| 范围 | 可编辑源文件 | 运行资源 |
| --- | --- | --- |
| 建筑、地坪、墙面、屋顶和远景 | [建筑源文件](art/rooftop-lowpoly-02/README.md)：`game-environment.blend`、`terrace-book.pxo`、`distance-facades.pxo` | `rooftop/assets/background/` 的清单、网格及 PNG，由 `3d/architectural-shell.mjs` 读取 |
| 现有物品、人物与室内材料 | [物品源文件](art/rooftop-game/README.md)：`game-assets.blend`、`material-book.pxo` | `rooftop/assets/pixel/material-book.png` 与 `3d/` 中的共享构造 |

天气为晴朗、阴天、小雨、大雨、有风、雷雨、台风、薄雾。阴天使用 `overcast`，兼容旧 `cloudy` 链接和保存值。空气特效按三个实际游戏视角的世界空间检查，保持远近、遮挡、风向和连续运动；额外材料测试视角不要求铺满特效。

[器物与材质资料](rooftop-art-sources.md)、[植物与容器手帐](rooftop-notebook.md)、[四季光照与天气](art/rooftop-atmosphere-01/README.md)提供继续制作所需的来源与说明。

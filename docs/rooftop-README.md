# 花农时代文档入口

2026-10-11：当前版本完成空天台材料、天气光影与综合测试入口的整理，本轮发布范围与核验结果见[发布记录](art/rooftop-review-01/README.md)。下一步重新制作家具，本轮保留现有家具及其存档。

## 页面

| 入口 | 用途 |
| --- | --- |
| [游戏](https://umwelt.fivsevn.com/rooftop/) | 北天台、南阳台观察；公开南北场景空开场，使用小鸟、无人机、邻居三个视角 |
| [永久空场景综合测试](https://umwelt.fivsevn.com/rooftop/?stage=background) | 同一页切换南北、六个视角、9 种天气、7 个时段与四季；不放物品、不显示角色 |
| [车库／物品页面](https://umwelt.fivsevn.com/rooftop/arrange/) | 查看和编辑物品、初始陈列与已有本机布局 |
| [东东的房间](https://umwelt.fivsevn.com/rooftop/room/) | 房间、换装与活动 |

本地使用同一路径，例如 [综合测试](http://127.0.0.1:4173/rooftop/?stage=background)。旧 `/rooftop/3d/`、`/rooftop/previews/pixel-01/` 和 `stage=game-model` 统一转入综合测试，不再保留独立场景测试页面。

## 当前维护契约

- [维护与扩容](rooftop-maintenance.md)：页面边界、运行模块、镜头、天气、存档和验证入口。
- [综合场景测试](rooftop-scene-review.md)：六种视角、环境参数、永久空场景及旧地址兼容。
- [物品承放关系](rooftop-placement.md)与 [`rooftop/AGENTS.md`](../rooftop/AGENTS.md)：真实承放面、碰撞、携带、取物、手势和兼容迁移。
- [仓库梳理与重制边界](rooftop-rebuild.md)：2026-10-10 的文件盘点与分阶段边界；日期、数量和旧入口表属于当次盘点，当前状态先看本页与维护入口。
- [测试导航](../tests/README.md)与[验证和发布](../isopoda/docs/deployment.md)：共用检查和发布方法。

存档继续使用 `umwelt-rooftop-layout-v1`，布局版本 2、房间版本 2、空间版本 1。公开空开场及测试页的清空只作用于观察用布局，不能写回车库存档。综合测试即使收到旧 `layout=local` 参数也保持为空；物品操作在车库中进行。

## 原稿与运行资源

| 范围 | 原稿与说明 | 运行接入 |
| --- | --- | --- |
| 当前建筑、地坪、墙面与屋顶材料 | [第 07 轮材料制作](art/rooftop-weathering-07/README.md)，[Pixelorama 原稿](art/rooftop-weathering-07/terrace-book.pxo)，[Blender 原稿](art/rooftop-weathering-07/game-environment.blend) | `rooftop/assets/background/empty-rooftop.mjs`、`.bin` 与 `terrace-book.png`，由 `3d/architectural-shell.mjs` 读取 |
| 现有物品、人物与室内共享材料 | [全游戏原稿和制作记录](art/rooftop-game/README.md)，[Pixelorama 材质书](art/rooftop-game/material-book.pxo)，[Blender 目录库](art/rooftop-game/game-assets.blend) | `rooftop/assets/pixel/material-book.png` 与 `3d/` 中的共享物品构造；保存 Blender 手改后须另行导出接入 |

建筑近景按实际米制保持 16 像素／米；旧物品与室内管线使用 8 像素／游戏世界单位。两者的坐标换算不同，不能把一个数字直接套到全部资产。新画面继续使用真实 Pixelorama／Blender 原稿，保持最小像素格一致，原稿、导出与游戏内效果分别核对。

## 制作参考

- [第 07 轮照片与材料观察](art/rooftop-weathering-07/reference-notes.md)：裂缝、修补、水渍的实际参考及转译范围。
- [四季、光照与天气制作](art/rooftop-atmosphere-01/README.md)：参考作品、色温、太阳、雾和环境动态。
- [器物、材质与空间资料](rooftop-art-sources.md)：器物和家具的来源依据；开头的全游戏实现记录属于其制作阶段。
- [植物与容器手帐资料](rooftop-notebook.md)：名称、学名、养护和来源。
- [原生像素物品管线](rooftop-pixel-style.md)：现有物品原稿、方格和构造记录；建筑材料以第 07 轮管线为准。

## 历史记录

[历史维护索引](reference/README.md)保留早期场景、目录扩容与维护快照。[旧绘制方向](rooftop-art-direction.md)、[二维物件四面记录](rooftop-object-views.md)、[早期 3D 资产记录](rooftop-3d-assets.md)、[像素样板](art/rooftop-pixel-01/README.md)和[旧材质制作代码](art/rooftop-legacy-materials/README.md)用于追溯，不作为当前镜头或发布规格。`art/rooftop-weathering-02` 至 `-06` 保留材料迭代过程，当前原稿入口为 `-07`。


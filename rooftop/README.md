# 花农时代文档入口

花农时代使用完整的 Blender 模型与 Pixelorama 原生贴图，游戏观察画面采用约 2.2 CSS 像素的低采样呈现。当前建筑原稿见[建筑源文件](../docs/art/rooftop-lowpoly-02/README.md)，运行与发布检查见[维护与扩容](docs/maintenance.md)。

游戏化场景的持续建模依据为仓库中的 `docs/art/rooftop-lowpoly-02/game-environment.blend`，源模型和它导出的运行资源一起维护、随游戏保留。现实地点的独立沙盘留在仓库外原位置；后续游戏场景修改直接基于已保存的游戏化源模型，不依赖那个本地文件。建筑外形、层高、屋顶和相对位置必须保留正确；近邻补细节，远景保留轮廓并使用轻量楼体及烘焙立面。

主体墙地与红瓦的材料依据、2026-10-14 修改记录及当次核验集中保留在[建筑源文件说明](../docs/art/rooftop-lowpoly-02/README.md)。继续制作从当前 `.blend`、`.pxo` 开始；修改后重新核对原稿、运行导出和实际画面。

[维护总入口](../MAINTENANCE.md) · [全部原稿索引](../docs/art/README.md)

## 页面

| 入口 | 用途 |
| --- | --- |
| [游戏](https://umwelt.fivsevn.com/rooftop/) | 北天台、南阳台观察；展示本机保存的陈列；无存档时使用初始布置，使用小鸟、无人机、邻居三个视角，显示东东和小猪的活动 |
| [统一测试页](../tests/browser/rooftop.html) | 空场景、全部 294 件物件图册和初始完整组合；图册可分类、搜索并点击同页近看，统一检查材料、光照、天气、时间、季节与采样 |
| [车库／物品页面](https://umwelt.fivsevn.com/rooftop/arrange/) | 摆放新物品、编辑南北阳台及房间；初始为北天台 83 件、南阳台 14 件、房间 21 件 |
| [东东的房间](https://umwelt.fivsevn.com/rooftop/room/) | 房间、换装与活动 |

本地测试统一使用 [http://localhost:8765/tests/browser/rooftop.html](http://localhost:8765/tests/browser/rooftop.html)。页面只有三组内容，后续采样、材质与光照调整继续在此查看。

人物及完整初始陈列在统一测试的“初始组合”组核对。[东东与小猪独立测试页](../docs/art/rooftop-actors-02/preview/index.html)继续保留，用于后续服装与动作检查。

## 维护入口

- [像素制作管线](docs/pixel-style.md)：完整模型、物理材料格和最终屏幕采样。
- [维护与扩容](docs/maintenance.md)：运行模块、镜头、天气、存档和验证。
- [综合场景测试](docs/scene-review.md)：视角、环境参数及空场景操作。
- [物品承放关系](docs/placement.md)与 [`rooftop/AGENTS.md`](AGENTS.md)：承放面、碰撞、携带、取物和兼容迁移。
- [测试导航](../tests/README.md)与[验证和发布](../docs/deployment.md)：共用检查和发布方法。

存档继续使用 `umwelt-rooftop-layout-v1`，布局版本 2、房间版本 2、空间版本 2。新目录标记为 `native-items-294-v1`；初始陈列包含完整 118 件布置，位置、旋转、缩放、植物 seed、花盆和承放关系保存在 `rooftop/initial-layout.mjs`。无存档时游戏、车库和房间使用同一份初始布局；已有新目录存档，包括手动清空的布局，继续保留。旧目录首次进入车库或房间时恢复当前初始布局并写入新目录标记，不另存旧陈列。公开观察读取本机陈列但不写存档，换装另存；统一测试使用独立数据，“空场景”清空物件，“初始组合”读取固定初始布置，不改个人陈列。

## 制作方式

建模保持完整的器形、厚度、背面、底面、开孔和承放结构，继续采用像素画风。Pixelorama 最小像素格按实际长度统一，旧化按材质和使用位置绘制。游戏的粗颗粒感由共享低采样控制，不为获得粗糙画面而额外删减家具结构。原稿、导出资源、游戏内效果与最终发布包分别检查。

游戏观察在 `3d/pixel-grid.mjs` 中的目标为 2.2 CSS 像素，按设备像素比取完整设备像素方格；DPR 2 时每格为 4×4 实际像素。场景与家具近看共用这条规则，单个物品不另设像素尺寸。具体坐标换算与接入步骤见[制作管线](docs/pixel-style.md)。

狙击手镜头拉近后，整幅画面的最终采样逐步变细，场景、物品及角色一同变清楚；拉远后恢复原颗粒。小鸟和无人机仍使用当前采样规格。最高倍率仍保留像素颗粒，至少每格两个设备像素；DPR 1 的默认格已达到这一界限，拉近时保持格子大小。这个镜头差异不改变 Blender 模型或 Pixelorama 贴图。正式车库与房间采用 2 CSS 像素目标格，便于摆放；游戏观察页保持 2.2 CSS 像素，原模型只用于后台测试。

## 当前资源与资料

| 范围 | 可编辑源文件 | 运行资源 |
| --- | --- | --- |
| 建筑、地坪、墙面、屋顶和远景 | [建筑源文件](../docs/art/rooftop-lowpoly-02/README.md)：`game-environment.blend`、`terrace-book.pxo`、`distance-facades.pxo` | `rooftop/assets/background/` 的清单、网格及 PNG，由 `3d/architectural-shell.mjs` 读取 |
| 全部 294 件物品 | [新物品源文件](../docs/art/rooftop-furniture-02/README.md)：七组 `.blend` 和 `*-atlas.pxo`，16 纹理像素／米 | `rooftop/assets/items/` 的 GLB、七张 PNG 与缩略图，由 `3d/native-model-loader.mjs` 读取 |
| 房间固定建筑 | [房间源文件](../docs/art/rooftop-room-02/README.md)：`room-background.blend`、`room-background-atlas.pxo` | `rooftop/assets/room/`，由 `3d/room-background-loader.mjs` 读取，门叶挂接活动铰链 |
| 东东、小猪及全部衣服装饰 | [方块人物源文件](../docs/art/rooftop-actors-02/README.md)：`block-actors.blend`，沿用真实 Pixelorama 材质书 | `3d/residents.mjs` 与 `3d/actor-pose.mjs`，游戏及统一测试的初始组合组共用 |
| 观察者与操作图标 | [图标源文件](../docs/art/rooftop-observers-01/README.md)：`observer-icons-atlas.pxo` | `rooftop/assets/observers/` 与 `observer-ui.mjs` |
| 现有人物及室外门等共用材质 | [共用材质原稿](../docs/art/rooftop-game/README.md)：`material-book.pxo` | `rooftop/assets/pixel/material-book.png` 与仍在使用的共用构造 |

天气为晴朗、阴天、小雨、大雨、有风、雷雨、台风、薄雾。阴天使用 `overcast`，兼容旧 `cloudy` 链接和保存值。空气特效按三个实际游戏视角的世界空间检查，保持远近、遮挡、风向和连续运动；额外材料测试视角不要求铺满特效。

[器物与材质资料](docs/art-sources.md)、[植物与容器手帐](docs/notebook.md)、[四季光照与天气](../docs/art/rooftop-atmosphere-01/README.md)提供继续制作所需的来源与说明。

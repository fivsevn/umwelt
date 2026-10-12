# 花农时代文档入口

花农时代使用完整的 Blender 模型与 Pixelorama 原生贴图，游戏画面共用约 2.5 CSS 像素的低采样呈现。当前建筑原稿见[建筑源文件](art/rooftop-lowpoly-02/README.md)，发布状态见[场景核验](art/rooftop-air-coverage-01/README.md)。

## 页面

| 入口 | 用途 |
| --- | --- |
| [游戏](https://umwelt.fivsevn.com/rooftop/) | 北天台、南阳台观察；公开南北场景空开场，使用小鸟、无人机、邻居三个视角 |
| [空场景综合测试](https://umwelt.fivsevn.com/rooftop/?stage=background) | 切换南北与空房间、六个室外视角和环境；默认原模型，可切游戏像素；永久不放物品、不显示角色 |
| [车库／物品页面](https://umwelt.fivsevn.com/rooftop/arrange/) | 摆放新物品、编辑南北阳台及房间；三处初始陈列均为空 |
| [东东的房间](https://umwelt.fivsevn.com/rooftop/room/) | 房间、换装与活动 |

本地使用同一路径，例如 [综合测试](http://127.0.0.1:4173/rooftop/?stage=background)。旧 `/rooftop/3d/`、`/rooftop/previews/pixel-01/` 和 `stage=game-model` 兼容转入同一个综合测试页。

人物与状态另有轻量本地页面：[东东与小猪](http://127.0.0.1:4186/docs/art/rooftop-actors-02/preview/)、[左下角状态卡片](http://127.0.0.1:4186/docs/art/rooftop-status-01/preview/)。用于快速看衣服、饰物、动作和整理文案，不合并已有场景与物品入口。

## 维护入口

- [像素制作管线](rooftop-pixel-style.md)：完整模型、物理材料格和最终屏幕采样。
- [维护与扩容](rooftop-maintenance.md)：运行模块、镜头、天气、存档和验证。
- [综合场景测试](rooftop-scene-review.md)：视角、环境参数及空场景操作。
- [物品承放关系](rooftop-placement.md)与 [`rooftop/AGENTS.md`](../rooftop/AGENTS.md)：承放面、碰撞、携带、取物和兼容迁移。
- [测试导航](../tests/README.md)与[验证和发布](../isopoda/docs/deployment.md)：共用检查和发布方法。

存档继续使用 `umwelt-rooftop-layout-v1`，布局版本 2、房间版本 2、空间版本 2。新目录标记为 `native-items-294-v1`；按用户要求，旧目录存档首次进入车库或房间时清空并写入新标记，不另存旧陈列。之后手动摆放的存档正常保留，换装另存。公开南北仍为空；空场景测试在自己的审核会话中清空三个场景，不改新陈列。

## 制作方式

建模保持完整的器形、厚度、背面、底面、开孔和承放结构，继续采用像素画风。Pixelorama 最小像素格按实际长度统一，旧化按材质和使用位置绘制。游戏的粗颗粒感由共享低采样控制，不为获得粗糙画面而额外删减家具结构。原稿、导出资源、游戏内效果与最终发布包分别检查。

`3d/pixel-grid.mjs` 的目标为 2.5 CSS 像素，按设备像素比取完整设备像素方格；DPR 2 时每格为 5×5 实际像素。场景与家具近看共用这条规则，单个物品不另设像素尺寸。具体坐标换算与接入步骤见[制作管线](rooftop-pixel-style.md)。

狙击手镜头拉近后，整幅画面的最终采样逐步变细，场景、物品及角色一同变清楚；拉远后恢复原颗粒。小鸟和无人机仍使用当前采样规格。最高倍率仍保留像素颗粒，至少每格两个设备像素；这个镜头差异不改变 Blender 模型或 Pixelorama 贴图。正式车库与房间采用稍清晰的 2 CSS 像素目标格，便于摆放；游戏观察页保持 2.5 CSS 像素，原模型只用于后台测试。

## 当前资源与资料

| 范围 | 可编辑源文件 | 运行资源 |
| --- | --- | --- |
| 建筑、地坪、墙面、屋顶和远景 | [建筑源文件](art/rooftop-lowpoly-02/README.md)：`game-environment.blend`、`terrace-book.pxo`、`distance-facades.pxo` | `rooftop/assets/background/` 的清单、网格及 PNG，由 `3d/architectural-shell.mjs` 读取 |
| 全部 294 件物品 | [新物品源文件](art/rooftop-furniture-02/README.md)：七组 `.blend` 和 `*-atlas.pxo`，16 纹理像素／米 | `rooftop/assets/items/` 的 GLB、七张 PNG 与缩略图，由 `3d/native-model-loader.mjs` 读取 |
| 房间固定建筑 | [房间源文件](art/rooftop-room-02/README.md)：`room-background.blend`、`room-background-atlas.pxo` | `rooftop/assets/room/`，由 `3d/room-background-loader.mjs` 读取，门叶挂接活动铰链 |
| 东东、小猪及全部衣服装饰 | [方块人物源文件](art/rooftop-actors-02/README.md)：`block-actors.blend`，沿用真实 Pixelorama 材质书 | `3d/residents.mjs` 与 `3d/actor-pose.mjs`，游戏及本地人物页共用 |
| 观察者与操作图标 | [图标源文件](art/rooftop-observers-01/README.md)：`observer-icons-atlas.pxo` | `rooftop/assets/observers/` 与 `observer-ui.mjs` |
| 现有人物及室外门等共用材质 | [早期源文件](art/rooftop-game/README.md)：`game-assets.blend`、`material-book.pxo` | `rooftop/assets/pixel/material-book.png` 与仍在使用的共用构造 |

天气为晴朗、阴天、小雨、大雨、有风、雷雨、台风、薄雾。阴天使用 `overcast`，兼容旧 `cloudy` 链接和保存值。空气特效按三个实际游戏视角的世界空间检查，保持远近、遮挡、风向和连续运动；额外材料测试视角不要求铺满特效。

[器物与材质资料](rooftop-art-sources.md)、[植物与容器手帐](rooftop-notebook.md)、[四季光照与天气](art/rooftop-atmosphere-01/README.md)提供继续制作所需的来源与说明。

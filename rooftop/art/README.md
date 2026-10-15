# 花农时代原稿

[游戏文档](../README.md) · [维护总入口](../../MAINTENANCE.md)

| 范围 | 原稿与说明 | 运行位置 |
| --- | --- | --- |
| 建筑、阳台、街区 | [建筑原稿](rooftop-lowpoly-02/README.md)：`game-environment.blend`、`terrace-book.pxo`、`distance-facades.pxo` | `rooftop/assets/background/` |
| 主角南北天台表层与细部 | [两处天台原稿](rooftop-terraces-03/README.md)：独立 Blender 模型与 Pixelorama 图集 | `rooftop/assets/terraces/` |
| 目录物品 | [物品原稿](rooftop-furniture-02/README.md)：七组 Blender 模型与 Pixelorama 图集 | `rooftop/assets/items/` |
| 房间固定建筑 | [房间原稿](rooftop-room-02/README.md)：模型、图集与门轴记录 | `rooftop/assets/room/` |
| 东东、小猪与换装 | [人物原稿](rooftop-actors-02/README.md)：方块模型与关节记录 | `rooftop/3d/residents.mjs`、`actor-pose.mjs` |
| 共用材质 | [材质书](rooftop-game/README.md)：`material-book.pxo` | `rooftop/assets/pixel/material-book.png` |
| 观察者图标 | [图标原稿](rooftop-observers-01/README.md) | `rooftop/assets/observers/` |
| 目录缩略图 | [模型组合与缩略图](rooftop-thumbnail-02/README.md) | `rooftop/assets/items/thumbs/` |
| 光照、季节与天气 | [环境制作](rooftop-atmosphere-01/README.md)、[空气覆盖](rooftop-air-coverage-01/README.md) | 现有环境模块与着色器 |
| 状态文字 | [状态文案归属](rooftop-status-01/README.md) | 游戏现有文字模块，不另存文案副本 |

视觉调整统一在[固定测试页](../tests/browser/rooftop.html)核对场景、物件和初始组合。需要检查人物服装或动作时，可使用人物文档中的专项检查页。材料密度与屏幕采样分别按[像素管线](../docs/pixel-style.md)检查。

原稿和运行资源分别保留；修改后重新检查源文件、导出与实际画面。批次编号不代表整个目录已归档。来源路径按当前目录维护，既有检查结论与散列仍对应其记录时的原稿。

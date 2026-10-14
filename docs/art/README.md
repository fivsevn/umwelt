# 原稿与制作资料索引

[返回开发文档](../README.md)

这里保存当前制作依据及固定检查页。数字后缀是制作批次；是否仍在使用，要核对运行文件的引用。先保护已保存的手改，再编辑、导出和检查，不直接回放构造脚本覆盖当前原稿。

## 花农时代

| 范围 | 原稿与说明 | 运行位置 |
| --- | --- | --- |
| 建筑、阳台、街区 | [建筑原稿](rooftop-lowpoly-02/README.md)：`game-environment.blend`、`terrace-book.pxo`、`distance-facades.pxo` | `rooftop/assets/background/` |
| 目录物品 | [物品原稿](rooftop-furniture-02/README.md)：七组 Blender 模型与 Pixelorama 图集 | `rooftop/assets/items/` |
| 房间固定建筑 | [房间原稿](rooftop-room-02/README.md)：模型、图集与门轴记录 | `rooftop/assets/room/` |
| 东东、小猪与换装 | [人物原稿](rooftop-actors-02/README.md)：方块模型与关节记录 | `rooftop/3d/residents.mjs`、`actor-pose.mjs` |
| 共用材质 | [材质书](rooftop-game/README.md)：`material-book.pxo` | `rooftop/assets/pixel/material-book.png` |
| 观察者图标 | [图标原稿](rooftop-observers-01/README.md) | `rooftop/assets/observers/` |
| 目录缩略图 | [模型组合与缩略图](rooftop-thumbnail-02/README.md) | `rooftop/assets/items/thumbs/` |
| 光照、季节与天气 | [环境制作](rooftop-atmosphere-01/README.md)、[空气覆盖](rooftop-air-coverage-01/README.md) | 现有环境模块与着色器 |
| 状态文字 | [状态文案归属](rooftop-status-01/README.md) | 游戏现有文字模块，不另存文案副本 |

视觉调整统一在[固定测试页](../../tests/browser/rooftop.html)核对场景、物件和初始组合。需要检查人物服装或动作时，可使用人物文档中的专项检查页。材料密度与屏幕采样分别按[像素管线](../rooftop-pixel-style.md)检查。

## 体温调节

[船舱与角色原稿](ophidia-01/README.md)维护当前工程、分卷还原、出图步骤与来源。仓库跟踪 `source/manifest.json` 及各分卷；还原出的 `ophidia.blend` 是本地可编辑文件。修改保存并核对画面后，通过 `archive_source.py` 更新分卷，保证可编辑工程能够从仓库重建。

运行图层位于 `ophidia/assets/`；[模型检查](ophidia-01/preview/model-review.html)和[像素对照](ophidia-01/preview/pixel-style/index.html)是固定本地页面。对白和交互从[游戏维护说明](../../ophidia/README.md)进入。

## 原稿、证据与输出

原稿和运行资源分别保留；检查 JSON 中的日期与结果对应当次运行，不能代替修改后的重新检查。临时截图、日志和验收输出写入仓库外目录，既有原稿清单与必要来源记录按所属指南维护。来源资料不随整理改写为已验证的科学事实。

其他游戏的视觉入口：[等足目形态](../../isopoda/docs/morphology-renderer.md)、[布景](../../isopoda/scenery/README.md)、[蜱虫](../../tick/README.md)。发布边界见[验证与发布](../deployment.md)。

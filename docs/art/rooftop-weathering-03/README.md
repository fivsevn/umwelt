# 地面贴图修订

本次工程保留 `rooftop-weathering-02` 的完整建筑、场景变换、相机、材质分配和每米 16 像素的 UV，仅更新 Pixelorama 图集的两块地面区域。

- `terrace-book.pxo`：实际 Pixelorama 原稿。
- `terrace-book.png`：Pixelorama 导出的 1024 × 1024 图集。
- `game-environment.blend`：更新贴图后独立保存的 Blender 原稿。
- `before.blend`、`before-terrace-book.png`：本次修订开始时的 02 版本快照。
- `native-floor-integration.json`：保存时的几何、UV、相机与贴图范围检查。
- `native-source-check.json`：重新打开原稿并与实际运行时文件对照的检查。

允许修改的图集范围为北天台 `[512, 0, 128, 256]` 和南阳台 `[640, 0, 128, 128]`。屋顶、墙、铁件、已清空的招牌素材和其余图集像素必须与 02 完全相同。

完成 Pixelorama 绘制后，在 Blender 中运行 `replace-atlas.py` 保存原稿，再运行 `export-game.py -- game-environment.blend ../../../rooftop/assets/background` 导出。最后运行 `check-native.py` 重新打开并验证。

检查要求运行时二进制文件及全部几何、UV、材质分区完全不变；Pixelorama PNG、Blender 打包 PNG 与运行时 PNG 必须逐字节相等。工程及预览仅保存在本地。

## 本地查看

[空天台本地页面](http://127.0.0.1:4173/rooftop/?stage=background&weather=clear&time=afternoon&season=autumn&scene=north) 可以切换南北视角、四季、七个时段和九种天气。

地坪移除了原有长条擦洗与等距网格，改为少量相互分叉的裂缝、轮廓侵蚀的局部补浆、消退水渍和聚集磨耗。绘制使用 Pixelorama 的一像素 Pencil；重新打开 PXO 后的 cel 与 PNG 完全一致。具体参考和绘制记录见 `floor-authoring-notes.json`，修改范围检查见 `floor-pixel-scope-check.json`。

## 季节、光影与天气

近处建筑从固定面明暗改为接收实际日光和阴影，玻璃窗保留夜间暖灯。原稿几何和相机没有改变。四季分别调整环境光、回光、天空与太阳高度，雨、雾、残湿、薄雪和季节粒子沿用已有状态过渡；湿地和薄雪保持与贴图相同的每米 16 像素格。

[气氛参考及实现说明](../rooftop-atmosphere-01/README.md) 收录实际查看过的 Cloud Gardens、A Short Hike、Haven Park 和 Nintendo 官方画面。地坪参考来自用户照片、[Makkon](https://makkon.itch.io/makkon-textures-concrete) 与 [cure 的像素簇教程](https://pixeljoint.com/forum/forum_posts.asp?TID=11299)。没有复制参考图像，也没有使用图像生成。

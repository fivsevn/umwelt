# 本轮原生贴图打包与核验入口

本管线复制并锁定最终 `rooftop-weathering-07`，替换完成的 Pixelorama `terrace-book.png` 和 `distance-facades.png` 两张颜色图。不重建或简化建筑，不改顶点、法线、UV、变换、材质绑定、相机或物品。暖窗数据图 `distance-lights.png` 的全部通道和文件字节保留。主图集维持 1024×1024 与 16 px/m，远景颜色图维持原 2048×2048 图尺寸、UV 和 alpha。原 07 文件保留。

从仓库根目录执行准备脚本；该步骤只写本目录快照、哈希与范围元数据，不写运行时：

```sh
python3 docs/art/rooftop-lowpoly-01/prepare-baseline.py
```

真正 Pixelorama 保存本目录 `terrace-book.pxo/png`、`distance-facades.pxo/png`，并独立重新打开校验通过以后，依次执行：

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python docs/art/rooftop-lowpoly-01/replace-atlas.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python docs/art/rooftop-lowpoly-01/export-game.py -- docs/art/rooftop-lowpoly-01/game-environment.blend rooftop/assets/background
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python docs/art/rooftop-lowpoly-01/check-native.py
```

`native-texture-integration.json` 记录保存前后的实际原生状态。`check-native.py` 在另一 Blender 进程重开两个文件，独立核对全部 mesh 数据、角法线、物件/集合、材质节点与绑定、UV、相机、灯光及色彩管理；运行时几何二进制必须逐字节不变，manifest 仅允许原稿路径、两张颜色 PNG 的哈希与字节数变化。远景暖窗数据图的原生打包与导出 PNG 均必须不变。

`atlas-scope.json` 允许当前 manifest 使用的全部 28 个 Pixelorama 材质范围；`north-plaster` 与 runtime 的 `plaster` 是同一个矩形。已审阅而保留的低色材料可以为 0 改动，所有未列范围和透明覆盖必须相同。远景颜色图允许整张原尺寸收拢颜色，alpha 必须逐像素相同。Pixelorama 原稿、重新导出 cel 与 PNG 的核验由绘画步骤完成，这套 Blender 脚本不伪称校验了 PXO 像素。

如需先导出到临时目录，把 `export-game.py` 的输出目录替换为临时绝对路径，并在 `check-native.py` 后追加 `-- /同一临时目录`。这可以先验证新原稿，再写正式运行时。

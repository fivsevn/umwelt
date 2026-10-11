# 空天台材质微调 · 本地审核

继续使用已交付的 Blender 建筑原稿。屋顶、地坪、墙面与铁件的最小贴图像素统一为 16 px/m（6.25 cm），通过真实 Pixelorama 1 px Pencil 绘制并保存原生 PXO，导出 PNG 后由 Blender 打包。保留所有模型顶点、面、位置、相机和灯光。

本楼大屋顶的两片原有坡面分别使用独立砖红旧瓦画面；附近楼仍用灰瓦。瓦片保留一致的基本尺寸，色差、擦蚀、破边与跨瓦雨痕分别绘制。南北地坪参照用户三张照片，加入磨弱接缝、灰浆修补、裂缝、擦洗痕与细骨料。墙面旧化沿墙脚及檐下展开；铁件以暗铁灰和局部褐色锈斑为主。素材图集原有六条中文店名全部涂回底色。

`terrace-book.pxo` 是实际 Pixelorama 原稿，`terrace-book.png` 是软件导出；`game-environment.blend` 是保存并打包新贴图的 Blender 原稿。`before.blend` 保存本轮开始前的原生建筑，用于核对几何。`native-weathering-check.json` 和独立重新打开检查记录物理像素密度、几何指纹、贴图打包结果。

本地场景：[北天台](http://127.0.0.1:4173/rooftop/?stage=background&weather=overcast&time=day&season=autumn&scene=north)。页面可切换南阳台、楼排、天气与时刻。本轮仅用于本地查看。

`author-pixelorama.py` 把明确的整数笔触交给 Pixelorama 自带 Pencil，临时作者扩展结束后恢复软件配置。已有原稿时默认停止；后续手绘修改后直接从 Pixelorama 导出 PNG，再运行 `revise-native.py` 打包。此脚本以本轮开始前的 Blender 原稿为基准校正 UV，不能用来覆盖后续人工几何调整。`export-game.py` 直接导出保存后的原生网格。

绘画参考为用户照片，以及 [Makkon Concrete](https://makkon.itch.io/makkon-textures-concrete)、[Makkon Metal](https://makkon.itch.io/makkon-textures-metal)、Saint11 的 [Metals](https://saint11.art/img/pixel-tutorials/Metal.gif) 和 [Making Tiles](https://saint11.art/img/pixel-tutorials/Tiles.gif)。仅学习材料层次、像素密度和图块变化，没有直接复用参考图片。

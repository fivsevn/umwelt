# 材质贴图修订

本次 Blender 工程严格基于 `rooftop-weathering-03/game-environment.blend`，仅更新由 Pixelorama 实际绘制并导出的图集。建筑、场景变换、相机、材质分配、每米 16 像素的 UV 和运行时几何二进制均保留。

`atlas-scope.json` 列明本次允许改变的图集区域。未列出的像素必须与 03 完全相同，尤其是砖红屋顶、灰屋顶与已经清空中文的六处招牌素材。

- `terrace-book.pxo`、`terrace-book.png`：Pixelorama 原稿与原生导出图集。
- `game-environment.blend`：仅更新打包贴图后独立保存的 Blender 原稿。
- `before.blend`、`before-terrace-book.png`：开始本次修订时的 03 快照。
- `native-texture-integration.json`：保存时的原稿状态与贴图范围检查。
- `native-source-check.json`：独立重开原稿并对照实际运行时文件的检查。

Pixelorama 验收完成后运行 `replace-atlas.py`，再用 `export-game.py` 导出原稿。最后运行 `check-native.py`。PNG 原稿、Blender 打包 PNG 与运行时 PNG 必须逐字节相同，运行时二进制必须与 03 完全相同。全部文件与预览保存在本地。

## 光影、柳絮和积水

本地页的栏目改为“空天台 · 自定义天气和时间点”，保留九种天气、七个时间点、四季和南北切换。

太阳方向以无锡约北纬 31.6°和四季代表赤纬计算：清晨在东、下午在西，中午在南；秋冬的升落光来自南侧，夏季清晨与黄昏向北侧移动。七个时间点是场景艺术时钟，不是具体日期的实时太阳预测。先用 Blender 原有每轴米制校准转换方向，再对南阳台视图旋转 90°；模型和相机本身不改变。暖白受光、灰蓝阴影、较暗地面回光拉开材质关系，保留黄昏暖光和夜间窗灯。

柳絮改为 24 粒、六组共享风流，暖白半透明，主要横飘与缓慢涡流，带轻微上下浮动。絮团为每米 16 像素中的 1–2 个物理像素，随距离投影，不使用全屏固定大方块；减少动态效果时仍保持轻缓运动。其他季节粒子机制保留。

积水由原来的周期三角函数分布改为米制坐标中的多尺度、偏移变形局部低洼分布。南北分别使用不同地形种子，湿边、深水和反光分开；雨后低洼仍残留水，雨点落击独立移动。细小雨圈改为错开、断续的像素弧，南视图交换地坪物理轴度量以保持相同像素大小。没有增加平铺贴图或生成图片。

## 参考来源

- 用户提供的真实地坪、铁件、屋顶照片，以及本轮地铁站和储物柜房间两张复古 3D 截图；具体像素画决策见 `material-authoring-notes.json` 与 `reference-direction.md`。
- [NOAA General Solar Position Calculations](https://www.gml.noaa.gov/grad/solcalc/solareqns.PDF)：太阳高度、方位与季节赤纬的关系。本轮用代表赤纬和时间角度控制方向，不声称精确观测。
- [Kew：A quest to conserve willow seeds](https://www.kew.org/read-and-watch/quest-to-conserve-willows)：柳籽小、附着绒毛并随风传播，作为轻絮横飘的行为参考。
- [Poly Haven：Cracked Concrete 02](https://polyhaven.com/a/cracked_concrete_02) 与 [Concrete Floor 02](https://polyhaven.com/a/concrete_floor_02)：补充查看细裂缝、孔隙与水泥色阶的材料资料，场景贴图仍由 Pixelorama 绘制。

## 本地查看

[打开自定义天气和时间点](http://127.0.0.1:4173/rooftop/?stage=background&weather=clear&time=morning&season=spring&scene=north)。本轮未发布。最终浏览器截图和验证状态保存在本目录。

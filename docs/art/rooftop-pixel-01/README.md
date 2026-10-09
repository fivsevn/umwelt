# 花农时代 · 3D Pixel 视觉样板 01

**第 5 版：固定最小方格，模型轮廓和物件位置也遵守整数网格。待用户看效果，尚未集成正式游戏。**

根据用户补充的 Minecraft 类比，本轮在原 `garden-atlas.pxo` 与原 `garden-sample.blend` 内继续修改。此前细碎划痕和连续低模曲线改为统一的大方格；陶盆、花架、建筑局部、壁灯、示意植物和地面使用同一最小立方体。原低模留在同一 Blend 的隐藏 `REFERENCE_LOW_POLY` 分组，便于对照和继续编辑。

以下图片均由实际 Blender 打开保存后的原工程渲染；网页使用实时光照，亮度与阴影会略有差异。

![当前白天组合](review/scene-day.jpg)

![门墙近景](review/doorway-day.jpg)

![当前傍晚组合](review/scene-dusk.jpg)

## 全局最小单位规则

- 当前样板的最小立方体边长为 **0.1 米**。这是统一制作尺度，所有物件共用同一原点 `(0,0,0)` 和同一尺寸。
- 所有可见模型顶点、轮廓、厚度和摆放位置都是该单位的整数倍。细杆、盆口、斜撑、檐瓦和叶片也由整格组成；不保留半格、三分之二格、细倒角或更小的几何装饰。
- 一个最小立方体的面只采样 **一个原生贴图像素**。颜色可以增加，最小格子的尺寸和位置规则不变；连续同色区域可以占多格。
- 贴图是 **128×128** 共享图集，含 16 个 **32×32** 材质区域。绘制坐标全部为整数，使用一像素铅笔和最近邻采样。
- 大、中、小陶盆分别制作整格模型；网页实例缩放均为 `1`，不会把同一网格缩成 0.4 或 0.6 倍。物件旋转如需沿用这套世界网格，只允许 90° 的整数倍。
- 相机可以转动。方块的屏幕投影随视角改变，模型内部的最小单位始终固定。当前规则已在隔离样板执行；正式游戏仍等待用户确认后再接入。

## 原文件和真实软件制作

- **`garden-atlas.pxo`**：原工程保留三层，由 Pixelorama v1.2.3-stable 自身执行最近邻缩小，并通过原生 `Pencil` 工具完成 738 笔整数坐标绘制，再由软件保存同一 PXO。没有使用图像生成工具。
- 本次桌面控制能操作软件按钮，但画笔读到的鼠标位置偏出画布，因此通过 Pixelorama 的作者扩展接口回放人工指定的整数笔触。记录在 [`pixelorama-grid/strokes.json`](pixelorama-grid/strokes.json)；真实工具调用代码在同目录。没有用外部程序直接生成像素图或修改原生 cel 像素数据。
- `garden-atlas.png` 及三层 PNG 均由 Pixelorama 实际导出，并与 PXO 内原生 RGBA 图层逐字节核对。同步保留 ORA 分层交换文件。
- **`garden-sample.blend`**：实际 Blender 4.5.14 LTS 打开原工程，将已授权修改的可见低模改为统一立方体网格；旧低模仍在隐藏参考分组。新方格模型可在原工程中逐顶点编辑，贴图已打包。
- `voxelize_original.py` 是本轮一次性源文件转换记录，重复运行会停止，避免覆盖当前制作结果。早期重建脚本和第 4 版细纹理脚本保留作历史，不用于本轮迭代。
- GLB 共用一个 PNG，避免重复内嵌贴图。普通 GLB 查看器呈白模；预览页面和 Blend 显示完整材质。参考 GIF/JPG 没有复制到公开仓库。

## 发布文件体积

| 资产 | 文件 | 体积 | 三角形 |
|---|---|---:|---:|
| 大陶盆 | `ceramic-pot.glb` | 48,740 B / 47.6 KiB | 672 |
| 小陶盆（固定格子） | `ceramic-pot-small.glb` | 10,668 B / 10.4 KiB | 128 |
| 中陶盆（固定格子） | `ceramic-pot-medium.glb` | 18,512 B / 18.1 KiB | 240 |
| 金属花架 | `metal-rack.glb` | 131,060 B / 128.0 KiB | 1,848 |
| 门、墙与壁灯 | `doorway.glb` | 501,216 B / 489.5 KiB | 7,124 |
| 铺地与示意植物 | `scene-set.glb` | 409,672 B / 400.1 KiB | 5,828 |
| 共享材质 | `garden-atlas.png` | 1,659 B / 1.6 KiB | — |

六个 GLB 加共享 PNG 合计 **1,121,527 B / 1095.2 KiB**。组合场景复用三只小盆，共 **16,096 个三角形、9 次物件绘制**（阴影过程另计）。方块轮廓比此前连续低模需要更多几何；PNG 减至 1.6 KiB。发布体积不含页面代码、既有 Three.js 或审阅图。

## 查看和长期保存

- 分支：`preview/rooftop-3d-pixel-samples`；草稿 PR #60。GitHub 保存原工程、导出文件、笔触记录和验证记录，本地只是制作工作区。
- [`review/`](review/) 是当前六张实际 Blender 渲染；`blender-preview.png` 是当前原场景透明底渲染。`wall-texture.png`、`wear-comparison.jpg` 和 `mobile-*.jpg` 是历史材料。
- 独立静态预览在 [`rooftop/previews/pixel-01`](../../../rooftop/previews/pixel-01/)。从仓库根目录提供静态文件后打开 `/rooftop/previews/pixel-01/`，可逐件查看、转动相机、缩放视图、切换傍晚。
- 当前 Pages 只发布 main，样板分支没有部署到正式游戏网址。预览纯静态，无后端、账号、数据库或新增解码依赖。
- 既有游戏的 Three.js、布局、存档、车库、房间、植物数据和叙事未改；本轮只更新样板资产和它的预览代码。认可后再把固定网格规则用于正式游戏。

## 核对记录

- [`pixelorama-authoring.json`](pixelorama-authoring.json)：实际 Pixelorama 原生铅笔、单像素笔刷、整数笔触和软件保存记录。
- [`pixelorama-export.json`](pixelorama-export.json)：实际软件导出，三层 RGBA 与原生 cel 一致。
- [`grid-source-check.json`](grid-source-check.json)：所有可见顶点和摆放位置均为整数格、实例缩放为 1、旧源部件保留。最大误差仅来自浮点存储，低于百万分之一格。
- [`grid-runtime-check.json`](grid-runtime-check.json)：预览实际使用的 Three.js r160 GLTFLoader 解析六个 GLB；世界坐标网格、轴对齐法线、单像素面采样及文件体积全部核对。
- [`render-review.json`](render-review.json)：六张当前整体与单件效果图由实际 Blender 渲染并查看。
- [`grid-publish-check.json`](grid-publish-check.json)：纯静态发布资源齐全，制作源文件排除，六个 GLB 与 PNG 的版本路径正确。
- 沿用此前本地浏览器访问被拒绝的限制，本轮没有绕过，也没有浏览器视觉复测。第一版浏览器记录及旧版核对 JSON 属历史材料，不代表本轮网页已经验证。

后续继续以当前 PXO 和 Blend 为入口。Pixelorama 编辑后运行 `export_atlas.py` 更新共享 PNG；模型如需调整，保持整数格并重新导出 GLB，禁止实例任意缩放。`render_review.py` 从已保存原工程生成实际审阅图，不修改源文件。

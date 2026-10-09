# 花农时代 · 3D Pixel 视觉样板 01

**第 6 版：像折纸一样的低模贴面，共用粗大的方格贴图。待用户看效果，尚未集成正式游戏。**

继续修改原 `garden-sample.blend`，恢复原工程保留的低模部件：陶盆有收口和内壁，花架有斜撑，屋檐和灯罩有斜面。沿用上一版由 Pixelorama 原生铅笔绘制的粗像素材质。贴图从 1px 方格直接构成，每个贴面的展开比例一致。

以下图片均由实际 Blender 打开保存后的原工程渲染；网页使用实时光照，亮度与阴影会略有差异。

![当前白天组合](review/scene-day.jpg)

![门墙近景](review/doorway-day.jpg)

![当前傍晚组合](review/scene-dusk.jpg)

## 统一方格规则

- 共享图集 **128×128**，含 16 个 **32×32** 原生材质区域。颜色、污渍、木纹和破损由整数坐标的一像素笔触构成，没有细于原生像素的绘画单位。
- 每个平面展开后使用同一尺度：**8 像素/米，单格边长 0.125 米**。正交的展开轴保持长度和直角；陶盆斜面、屋檐、灯罩和植物贴面也遵守这个尺度。
- 不把大小不同的面任意拉伸到整张贴图。原贴图只做整数格的定位和重复，使用最近邻采样，不生成模糊的中间颜色。
- 大、中、小陶盆先分别烘焙实际尺寸，再按相同尺度展开。所有场景实例缩放为 `1`，不会因模型缩小而把像素格缩成更细的单位。
- 方格约束作用于**贴面展开与绘画**。立体外壳保留连续平面、梯形、折角与斜面。斜面投影到屏幕会随视角缩短或倾斜；展开后的格子始终为等大的正方形。
- [`review/unfolded-grid.svg`](review/unfolded-grid.svg) 从原工程实际 UV 坐标绘制黄线，并叠在原 Pixelorama 导出材质上：墙、陶盆、灯罩使用同一网格。图中的辅助网格只供检查，不进入游戏材质。

## 原文件与软件制作

- **`garden-atlas.pxo`** 保留原三层。上一版由实际 Pixelorama v1.2.3-stable 自身执行最近邻缩小，再通过原生 `Pencil` 工具完成 738 笔整数坐标绘制并保存同一 PXO。本轮完整保留这份已认可的粗像素源稿和 PNG，字节未变。
- 当时桌面控制的画笔指针位置偏出画布，因此使用 Pixelorama 作者扩展接口回放人工指定的笔触；记录见 [`pixelorama-grid/strokes.json`](pixelorama-grid/strokes.json) 和同目录原生工具调用代码。没有通过外部程序生成材质图或直接修改原生 cel 像素数据，也没有使用图像生成。
- PNG 与三层 RGBA 已逐字节核对，保留 `garden-atlas.ora` 分层交换文件。贴图已打包在 Blend。
- **`garden-sample.blend`** 由实际 Blender 4.5.14 LTS 打开并修改，恢复 171 个独立可编辑的原低模部件，增加两个尺寸已烘焙的陶盆版本。重新展开各平面，保留相机、光照、配色及上一版组合摆放。
- 第 5 版方块模型保留在同一 Blend 的隐藏 `REFERENCE_VOXEL_V5`；更早的组合参考留在隐藏 `REFERENCE_LOW_POLY`。当前可见物体和发布 GLB 均为低模贴面。
- 仅在 UV 重复边界增加少量共面切线，保持原轮廓。临时合并导出副本让 GLB 精简，源稿仍保留独立部件。
- `restore_faceted_surfaces.py` 为本轮一次性源文件修改记录，已执行后再次运行会停止。早期重建、细纹理和方块转换脚本仅作历史记录，后续以当前 PXO 和 Blend 为入口。
- GLB 共用一个 PNG，避免重复内嵌贴图；通用 GLB 查看器呈白模，预览页面与 Blend 显示完整材质。参考 GIF/JPG 未复制到公开仓库。

## 发布文件体积

| 资产 | 文件 | 体积 | 三角形 |
|---|---|---:|---:|
| 大陶盆 | `ceramic-pot.glb` | 51,080 B / 49.9 KiB | 704 |
| 金属花架 | `metal-rack.glb` | 64,344 B / 62.8 KiB | 848 |
| 门、墙与壁灯 | `doorway.glb` | 121,172 B / 118.3 KiB | 1,584 |
| 铺地与示意植物 | `scene-set.glb` | 64,568 B / 63.1 KiB | 892 |
| 小陶盆 | `ceramic-pot-small.glb` | 51,084 B / 49.9 KiB | 704 |
| 中陶盆 | `ceramic-pot-medium.glb` | 51,092 B / 49.9 KiB | 704 |
| 共享材质 | `garden-atlas.png` | 1,659 B / 1.6 KiB | — |

六个 GLB 加 PNG 共 **404,999 B / 395.5 KiB**。组合场景复用三只小盆，共 **6,844 个三角形、9 次物件绘制**（阴影过程另计）。体积不含页面代码、既有 Three.js 或审阅图。

## 查看与长期保存

- 分支 `preview/rooftop-3d-pixel-samples`；[草稿 PR #60](https://github.com/fivsevn/umwelt/pull/60)。GitHub 保存源工程、发布资产、实际渲染和核对记录；本地为制作工作区。
- [`review/`](review/) 中六张 JPG 与 `blender-preview.png` 是第 6 版真实 Blender 渲染。`wall-texture.png`、`wear-comparison.jpg`、`mobile-*.jpg` 是历史材料。
- 独立预览在 [`rooftop/previews/pixel-01`](../../../rooftop/previews/pixel-01/)。从仓库根目录提供静态文件后打开 `/rooftop/previews/pixel-01/`，可转动、缩放、逐件查看和切换傍晚。
- Pages 当前只发布 main，样板分支没有部署到正式游戏网址。预览纯静态，无后端、账号或新增解码依赖。
- 当前正式游戏的 Three.js、布局、存档、车库、房间、植物数据和叙事保持原状。认可后再集成资产和统一贴面制作规则。

## 核对记录

- [`facet-source-check.json`](facet-source-check.json)：原工程修改、原低模部件恢复、相机光照保留、原生粗贴图不变、正交 UV 展开及每格物理尺寸核对。
- [`facet-runtime-check.json`](facet-runtime-check.json)：由预览实际使用的 Three.js r160 GLTFLoader 解析六个 GLB，逐三角形检查物理边长、展开边长及角度；最大长度误差约十万分之一像素。
- [`facet-publish-check.json`](facet-publish-check.json)：纯静态发布资源、共享贴图、加载器依赖、版本路径及制作源文件排除。
- [`render-review.json`](render-review.json)：六张当前整体与单件效果图由实际 Blender 渲染并查看。
- `pixelorama-authoring.json`、`pixelorama-export.json` 对应本轮沿用且未改变的原生粗材质。`grid-*.json` 是第 5 版方块模型历史记录；更早的核对 JSON 同样属于历史。
- 沿用此前本地浏览器访问被拒绝的限制，本轮没有绕过，也没有浏览器视觉复测。当前截图是 Blender 渲染，不代表网页亮度和交互已经重测。

后续继续编辑当前原文件。Pixelorama 保存后运行 `export_atlas.py` 更新 PNG；Blender 模型调整后保持统一的贴面展开尺度并重新导出，实例保持缩放 `1`。`render_review.py` 只从已保存工程生成审阅图，不修改源文件。

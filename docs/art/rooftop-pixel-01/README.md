# 花农时代 · 3D Pixel 视觉样板 01

陶盆、黑色金属花架、带门与壁灯的建筑局部，组合成一处小庭院。**第 4 版：大方向已认可；本轮细像素旧化待看效果，尚未集成游戏。**

本轮继续参考空调 GIF 的小块磨损、接缝积灰和有限色阶，直接修改原来的 `garden-atlas.pxo` 与 `garden-sample.blend`。墙面旧化颗粒变小，门板、陶盆、石框和金属边缘的磨损也更细。构图、物件、模型几何、摆放、底色、灯光和相机保留。

以下图片由本机实际 Blender 打开改好的原文件渲染，用于展示可编辑模型的效果；网页有自己的实时光照，效果会略有差异。

![墙面与门板近景](review/doorway-day.jpg)

![白天组合场景](review/scene-day.jpg)

![傍晚组合场景](review/scene-dusk.jpg)

## 本轮调整

| 部位 | 调整 |
|---|---|
| 抹灰墙面 | 原先大块斑驳拆成更小的阶梯状像素簇；五种邻近色表现褪色、檐下短水痕和墙脚积污；保留较多连续底色 |
| 墙面纹理比例 | 只调整四个原墙体网格的 UV；主要墙面横纵均为每米 25 像素，修正纵向拉伸；墙脚旧化对应真实地面高度 |
| 木门 | 小面积边缘掉漆、短擦痕和浅色底漆，保留原有面板轮廓和木纹图层 |
| 陶盆、石框、金属、檐瓦 | 细化窑烧色差、边缘磕碰、少量锈色和积灰；花架结构和铺地保持原样 |

一张 **256×256 共享图集**，含 16 个 **64×64 材质区域**。既有底色和结构笔触图层按最近邻精确扩大两倍，保留原来的笔触形状；在原 `Weathering patches` 图层中细化旧化。墙面用五种邻近色，其他材质用三至四种。纹理采用最近邻采样，无 mipmap；网页维持正常画布分辨率和抗锯齿。

[查看 Pixelorama 导出的共享图集](../../../rooftop/previews/pixel-01/assets/garden-atlas.png)

## 原文件与导出

- **`garden-atlas.pxo`**：保留原工程的三层、帧、图层名称和元数据。直接编辑已有原生容器的像素图层；PNG 和各层 PNG 均由本机 Pixelorama v1.2.3-stable 实际读取、导出。另同步原有 ORA 分层文件。
- **`garden-sample.blend`**：由实际 Blender 4.5.14 LTS 打开上一版原文件，修改墙面 UV、刷新打包贴图，并保存回同一源文件。原物件名称、独立部件、分组、共享网格、相机和灯光全部保留。
- `native-source-edit.json` 记录源文件来源与核对结果；`refine_native_atlas.py`、`refine_native_blend.py` 保留本轮原文件修改过程，并校验输入源稿的指纹，避免重复覆盖后续手工编辑。
- 没有使用图像生成工具，没有把生成的效果图替换成资产。参考 GIF/JPG 没有复制进公开仓库，模型和贴图是本项目的原资产修改。
- 发布 GLB 保留几何、法线与 UV，共用一个 PNG。普通 GLB 查看器会显示白模；源 `.blend` 已打包完整贴图，打开即可编辑。

## 发布资源体积

| 资产 | 发布文件 | 文件体积 | 三角形 | 网格 |
|---|---|---:|---:|---:|
| 陶盆 | `ceramic-pot.glb` | 43,600 B / 42.6 KiB | 704 | 1 |
| 黑色金属花架 | `metal-rack.glb` | 63,020 B / 61.5 KiB | 840 | 1 |
| 建筑局部、门与壁灯 | `doorway.glb` | 120,320 B / 117.5 KiB | 1,576 | 2 |
| 展示铺地与示意枝叶 | `scene-set.glb` | 54,844 B / 53.6 KiB | 764 | 1 |
| 共享材质 | `garden-atlas.png` | 4,074 B / 4.0 KiB | — | — |

模型与贴图合计 **285,858 B / 279.2 KiB**，比上一版增加 2,221 B，不含页面脚本、既有 Three.js 和预览图片。组合场景复用五只同一陶盆，共 6,700 个三角形、9 次绘制。没有额外解码依赖。

## 查看与保存

- 独立静态预览：[`rooftop/previews/pixel-01`](../../../rooftop/previews/pixel-01/)。从仓库根目录启动静态文件服务器后打开 `/rooftop/previews/pixel-01/`。可逐件查看、旋转、缩放、键盘操作及切换傍晚灯光。
- 当前效果图在 [`review/`](review/)；`blender-preview.png` 是当前原场景的透明底渲染。`wall-texture.png` 和 `wear-comparison.jpg` 是第 3 版历史材料；两张 `mobile-*.jpg` 是第一版网页布局核对，均不代表本轮材质。
- 分支：`preview/rooftop-3d-pixel-samples`，草稿 PR #60。Pages 工作流只发布 main，当前样板分支未部署到正式游戏域名。
- GitHub 保存原生制作文件、导出资产和验证记录；本地工作目录仅用于制作与核对。发布包排除 `docs/`，源稿和预览图片不会进入游戏加载资源。
- Three.js 场景、游戏布局、存档、车库、房间、植物数据和叙事均未改变。用户认可视觉后再接入游戏。

## 后续编辑

以当前 PXO 和 Blend 原文件为编辑入口。在 Pixelorama 中修改原图层后，用下面的导出流程更新网页图集；在 Blender 中更新并重新打包贴图、保存原文件。模型 UV 变化后应导出相应资产的临时合并副本，制作部件保持独立。

```sh
# 实际 Pixelorama 从已有原生工程导出 PNG 和各层图
python docs/art/rooftop-pixel-01/export_atlas.py --pixelorama /path/to/Pixelorama
# 实际 Blender 从保存的原文件渲染整体和单件，不覆盖源稿
blender --background --python docs/art/rooftop-pixel-01/render_review.py
```

早期 `paint_atlas.py` 与 `build_scene.py` 只保留作为初始制作记录，会重建源稿，**不要用于当前文件的迭代修改**。本轮没有运行它们。

## 核对

- Pixelorama 软件导出与原生三层像素逐像素一致；原底色、结构笔触图层是上一版的精确最近邻二倍副本：[`pixelorama-check.json`](pixelorama-check.json)。
- 原 Blend 与上一版保存文件逐项比较，全部物件身份、几何、摆放、相机、灯光相同；只有四个墙体网格的 UV 改变，打包纹理与 Pixelorama 导出完全一致：[`native-source-edit.json`](native-source-edit.json)。
- 四个 GLB 均由预览页面实际使用的 Three.js r160 GLTFLoader 在 Node 中解析成功。顶点、法线、三角形索引和摆放逐项与上一版相同；仅建筑 UV 改变，尺寸及体积与清单一致：[`refinement-check.json`](refinement-check.json)。
- 当前六张整体/单件效果图由实际 Blender 渲染，逐张检查：[`render-review.json`](render-review.json)。
- 静态发布包核对：源稿排除，GLB/PNG/加载器齐全，版本 URL 正确：[`refinement-publish-check.json`](refinement-publish-check.json)。
- 沿用此前本地浏览器访问被拒绝的限制，本轮没有浏览器复测。页面、样式与交互代码未修改；第一版浏览器验证与 338 项完整检查作为历史记录保留，不能替代本轮网页视觉验证。

样板尚未适配游戏中的物件 ID、承放面和摆放比例；示意枝叶只用于构图。正式集成时遵守 `rooftop/AGENTS.md` 的空间、承放和存档契约。

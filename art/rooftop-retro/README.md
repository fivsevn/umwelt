# 花农时代：当前视觉制作

2026-10-10 开始按作者提供的六张 Sully GIF 重新制作。第一批已接入实际游戏，后续批次以这些软件源文件继续制作。

## 软件源文件与游戏素材

- `terrace-furniture.blend`：Blender 4.5.14 LTS 的独立零件、材质、UV、资产集合与审阅镜头。运行的家具网格来自它的 GLB 导出，不再由旧构造器生成。
- `terrace-surfaces.pxo`：Pixelorama 1.2.3 的两层原稿。第一层把 CC0 实物材质照片整理为有限色阶与连续色簇，第二层补板缝、钉头、磨边、露铁和水泥修补。通过编辑器原生接口制作、保存、导出，没有使用图片生成器。
- `../../rooftop/assets/retro/terrace-furniture.glb`：17 个资产节点，约 276 KiB。
- `../../rooftop/assets/retro/terrace-surfaces.png`：256 × 256 图集，每个材质区域 64 × 64 像素，约 26 KiB。
- `furniture-review.png`：Blender 源文件审阅图；`game-review.png`：实际游戏的放大预览。

贴图以最近邻取样，每世界单位固定 8 个像素；物件缩放后仍按实际表面长度取样。同一画面中方格边长为 1/8 世界单位，不把纹理按每个物件的包围盒拉伸。斜面按自身表面展开。木纹用连续的色簇，金属保留掉漆与露铁，水泥有板缝和磨损，墙面有脱落与修补。主体配色采用较暗的灰绿、旧木褐和灰米色，各材质保留自身明暗色阶。

## 第一批范围

家具：黑色花架、三层铁花架、宽网格铁架、窄高格花架、木阶花架、梯形木花架、木凳、小板凳、旧木板矮台、工作台、换盆台、户外储物箱、三屉斗柜、双门衣柜。建筑件：门框、门扇、雨棚。场景的地面、墙体及屋面使用新材质；场景布局与建筑结构沿用游戏现有数据。

承托面 ID、坐标、台面高度和摆放规则保持原值。导出检查直接向每一个承托面射线，核对网格台面与游戏承托高度一致。摆放、拖动、连带移动、旋转、缩放、撤销、存档、换装与天气行为沿用现有机制。

待重做：其余家具、床椅、水池与玻璃柜、日用品、周边建筑及街道物件。植物、花盆、人物、枪械和兵器留待后续批次；它们现阶段仍使用原有必要构造与材质。原共享材质的可编辑源文件暂放在 `../rooftop-deferred/material-book.pxo`，供这些尚未迁移的资产使用。WebGL 不可用时的原有兼容绘制仍保留。

旧视觉试验目录、过时制作说明、预览素材、审计快照和未被游戏使用的代码贴图生成器已删除。Git 历史可追溯它们，不再把它们当作当前视觉依据。`sources/` 与其他游戏保持原样。`art/` 不进入网站发布文件。

## 本轮参考

- [Brendan Sullivan / Art of Sully](https://artofsully.com/)；进一步观察[公园长凳](https://artofsully.com/projects/zeP3Z)和[空调](https://artofsully.com/projects/XWDP0)的低面数结构、固定像素纹理及材质磨损。
- [SLYNYRD：Pixelblog 2 – Texture](https://www.slynyrd.com/blog/2018/2/15/pixelblog-2-texture)：纹理色簇、重复的节奏、光影与细节密度，避免把材质全部变成散点噪声。
- [Resurrect 64](https://lospec.com/palette-list/resurrect-64)：低饱和的褐、绿、灰色阶参考，未直接套用整套色板。
- 实物表面：[旧木板](https://polyhaven.com/a/wood_planks_grey)、[磨损水泥](https://polyhaven.com/a/concrete_floor_worn_001)、[掉漆金属](https://polyhaven.com/a/rusty_painted_metal)、[旧灰泥墙](https://polyhaven.com/a/worn_plaster_wall)。照片在 `reference/`，遵循 [Poly Haven CC0 许可](https://polyhaven.com/license)。其他参考作品仅观察，没有打包进游戏。

## 检查

`tests/rooftop-retro-assets.test.mjs` 检查 GLB 的真实台面、材质槽和导出数据；原有摆放、相机、人物、天气及存档契约保留。浏览器检查覆盖 304 项目录、拖动、承托层切换、缩放与旋转、撤销重做、保存重载、房间同步和窄屏布局。

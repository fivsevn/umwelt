# 空天台：第二轮粗粝修订

2026-10-12，本地修订，尚未发布。继续编辑已经保存、独立重开核验的 [01 原稿](../rooftop-lowpoly-01/README.md)，保留全部建筑形态、布局、法线、UV、材质绑定、相机与灯光；家具原生文件只读。用户随后选择两边颗粒稍细一点，因此仅同步调整家具独立网页的近看呈现。

实际 Pixelorama 1.2.3 保存 [主图 PXO](terrace-book.pxo)、[主图 PNG](terrace-book.png)、[远景 PXO](distance-facades.pxo)和[远景 PNG](distance-facades.png)。主图 28 个实际材质范围逐项审阅：墙地、水泥、压顶和邻楼收至 7 个主色，主屋砖红瓦面 6 色，灰瓦 7 色，铁件 6 色。原本 1–6 色的玻璃、道路、树冠、车辆等继续保留已有有限颜色。轻微明确旧化色差，保留主要底色和明暗两端，裂缝、修补、水渍的原有位置与轮廓不变。没有扩大斑驳块，也没有画规则水平条带。

主图执行 176 个、远景执行 64 个真正的 1 像素 Pencil 磨损点，都位于已经存在的旧化边缘。远景从 49 个 RGB 颜色整理为 37 个（36 个主色加黑底），保留楼体、窗面和修补层次。两图尺寸仍为 1024² / 2048²，全部 alpha、透明填充和六条清空的中文商铺贴纸逐字节保留；暖窗数据图 `distance-lights.png` 完全不变。未使用图片生成。

[主图核验](pixelorama-scope-check.json)和[远景核验](pixelorama-distant-scope-check.json)确认两张 PXO 的 cel、原生导出 PNG 与真实 Pixelorama 独立重开后的 PNG 像素完全一致。相比 01，主图改变 187645 个像素，远景改变 1642106 个像素。Python 只读取现有原稿、安排原生颜色与整数笔触、检查像素；编辑和保存发生在 Pixelorama 内。

[Blender 原稿](game-environment.blend)真实打包两张新颜色图，导出到临时目录，先逐字节核对模型二进制、暖窗 mask 和全部 manifest 元数据，再更新本地颜色图及 source 路径。[独立 Blender 重开核验](native-source-check.json)同时对照本轮 01 起点和原始 07：顶点、面、法线、UV、变换、材质节点与绑定、相机、灯光和色彩管理全部一致。398 个运行时分区与原模型二进制完全相同。[所有面的材质审计](material-coverage-final.json)包含背面、底面及平时镜头看不到的部分。

原生格维持与 `4186` 实际家具一致的 16 px/m，最小纹理格为 0.0625 米。远景继续使用 01 已核验的物理方格采样，不修改原生 UV。最终屏幕颗粒由网页绘制尺寸统一；本目录保留本轮修改前的场景与物件截图、网格核验记录，供实际网页对照。

复查入口：`check-pixelorama.py` 只重开原稿并输出独立检查 PNG；`check-native.py` 只重开 Blender 并核对当前导出。`paint-pixelorama.py` 在已有本轮保存记录时拒绝重放，保护后续手绘；`prepare-baseline.py` 仅用于本轮开始前锁定 01，不可在导出更新后再运行。[最终原生核验](native-final-check.json)记录所有哈希与保护结果。

Pixelorama 的 headless Godot Dummy renderer 留有 shader 和退出资源诊断，原生日志已保存。实际 PXO 保存、独立重开和逐像素比较全部通过；Blender 的成功保存、导出与独立重开分别有核验报告。

最终屏幕格先收为约 3 CSS 像素，得到用户认可后，两边共同微调至约 2.5 CSS 像素。在当前 DPR 2 屏幕上，每格由 6×6 收为 5×5 个实际像素；低分辨率源画面采样量约增加两成。`rooftop/3d/pixel-grid.mjs` 与家具 `preview/pixel-grid.mjs` 字节完全一致，按实际设备像素比取整，保持最小方块大小固定。天气、季节、邻居光学遮罩与刻线共用场景格；家具近看用相同整数格，卡片保持原 128 行画面。素材、模型、原相机取景与灯光不再改动。[家具保护核验](furniture-detail-quality.json)记录 16 项原生与静态文件的哈希未变。

[实际浏览器核验](browser-review.json)包含南阳台雨天全部六视角、北天台夜间远景与当前窄屏北天台；全为空场景，无角色。另保存[木架与铁架近看数据](furniture-browser-review.json)。[无损截图逐格检查](exact-screen-grain-check.json)覆盖场景、雨丝、邻居遮罩及两款家具，所有完整 5×5 格内 RGB 都一致；检查只读取截图，没有缩放或重绘。房间仍使用原绘制预算，已有布置存档逐字节未变。全项目 408 项测试和结构检查通过，见[最终检查日志](final-check.log)。当前本地效果：[空场景](local-fine-current-preview.png)、[木花架](local-fine-furniture-wood.png)、[铁花架](local-fine-furniture-iron.png)。

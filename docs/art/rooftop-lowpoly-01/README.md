# 空天台：粗粝低模修订

2026-10-12 本地修订，尚未发布。沿用第 07 轮照片参考、建筑轮廓与真实 Pixelorama／Blender 原稿，增强折面、有限主色阶和局部磨损。家具制作留到下一阶段，空场景综合测试继续永久无物品、无角色。

## 原稿与绘画

- [Pixelorama 原稿](terrace-book.pxo)与[原生 PNG](terrace-book.png)：从保存的 `rooftop-weathering-07` 原稿继续编辑，1024×1024、16 像素／米、1 像素最小笔触不变。
- [Blender 原稿](game-environment.blend)：真实 Blender 打包新 PNG 并导出当前本地游戏。全部顶点、面、法线、UV、变换、材质节点和绑定、相机、灯光及色彩管理与第 07 轮一致；几何二进制逐字节一致。
- 对照用户认可的 `http://127.0.0.1:4186/` 木质花架，把建筑向哑光、明确折面、有限主色和清楚阴影继续调整。实际 Pixelorama 1.2.3 共执行两轮主图原生色阶整理、1420 个 1px Pencil 磨损笔触，再审阅补齐其余材料；主屋瓦面收拢为 7 个主色，灰瓦 8 个。保留原有瓦片差异、裂口和旧化分布，地坪、墙面、压顶与水泥面增强已有细小色差。
- 主图全部 28 个实际材质范围均已审阅，包括邻楼、道路、树冠、车辆、窗面和铁件。原本只有一个主色的铺路、轮胎与车灯审阅后保留，不为了产生修改数而添加噪点。
- [远景 Pixelorama 原稿](distance-facades.pxo)与[原生 PNG](distance-facades.png)：真实打开原 2048×2048 烘焙颜色图，在 Pixelorama 内整理为 48 个主色加透明填充底色，并执行 144 个 1px Pencil 局部磨损笔触。原 alpha、图幅与 UV 图布局保持；暖窗数据图 `distance-lights.png` 的全部字节保留。
- 保留照片转译的裂缝、修补、水渍位置及安静的底色区域。没有重建整张纹理，没有增加规则磨损条带；六条已经清空的中文商铺贴纸与范围外像素逐字节保留，透明覆盖不变。未使用图片生成。

源图绘画计划在 [palette-pencil-plan.json](palette-pencil-plan.json)和[全场景色阶计划](all-scene-palette-plan.json)，实际应用记录在 [第一轮主图记录](pass01-pixelorama-authoring.json)、[第二轮主图记录](pixelorama-authoring.json)和[全场景补齐记录](pixelorama-all-scene-authoring.json)。Python 只读取原稿和准备色阶／整数笔触计划；像素编辑、Pencil 绘画和保存发生在实际 Pixelorama 内。

三轮脚本 `paint-pixelorama.py`、`roughen-pixelorama.py`、`unify-pixelorama.py` 默认保护已保存原稿。只有明确使用各自的 replay 参数才从对应阶段重放，会替换本目录已保存的 PXO／PNG；继续手工编辑原稿时不要重放。检查入口 `check-pixelorama.py` 和 `check-distant-pixelorama.py` 真正重开两张 PXO，再比较导出像素。打包与导出入口见 [NATIVE-PIPELINE.md](NATIVE-PIPELINE.md)。

## 网页呈现

关闭 WebGL 抗锯齿，使用与花架预览相同的 BasicShadowMap 明确阴影边缘，保持正常绘制尺寸 `renderScale:1`。近景建筑平面着色，间接光按顶面、底面和两组竖面分成四档；远景使用同一组朝向分档，烘焙照明只处理一次。太阳直射、天气雾、月光与暖窗继续使用原来的时间和天气变化。原相机、南北太阳方向和阴影图尺寸保持。修复原生模型异步加载后未刷新静态阴影的问题，冷加载也能出现屋墙遮挡。

用户最后要求再粗糙一点点，四档面明暗小幅调整为 `1 / .52 / .66 / .82`，太阳直射与发光窗继续保留原变化。

## 与物件保持同一最小格

核对的是 `4186` 实际正在提供的 `rooftop-furniture-01/preview`，不能用其历史 `revision-02` 目录替代。[物件网格实测](furniture-reference-pixel-metric-audit.json)检查六款实际 GLB 的 2172 个三角形，包含世界变换、UV 和米制外形尺寸，全部为正方 16 px/m；PNG 与 PXO cel 相同。[近景实测](nonbox-pixel-metric-audit.json)确认 3726 个非方盒近景三角形同样为正方 16 px/m。[方盒基底审计](cube-horizontal-basis-audit.json)检查 32272 个实际实例，水平分支全部用于真正水平面，其他面采用正交基底；两边原生最小格均为 0.0625 米。

外围原三角数据的 57 个疑似异常属于极窄三角形放大 Float32 误差。[完整原生多边形复核](nonbox-stable-polygon-metric-audit.json)以稳定边和原多边形拟合证明实际均为正方 16 px/m，最大拟合残差 0.002219 原生像素；保留原采样，不能依据病态三角形逆矩阵给屋顶、水面和树冠添加接缝。

旧远景的独立烘焙 UV 并非统一物理格，不能只凭 manifest 的数字称其为 16 px/m。[旧烘焙密度实测](baked-pixel-metric-audit.json)保留证据。游戏通过 `baked-pixel-grid.mjs` 在面上建立物理正交的 16 px/m 方格，把格中心映回原 Pixelorama 颜色图；窗灯 mask 使用同一个取样坐标。仅派生 GPU 面边界属性，4952 个矩形面均验证通过，不改原网格、法线或 UV。取样限在本面图块内；透明绘画边缘的半格和掠视退化导数保留原 UV 回退，避免接缝带入旁边的图块。

物件独立预览的 128 像素高画布另有 CSS 放大；场景继续使用正常画布。画布缩放和镜头距离影响屏幕上的颗粒大小，不能据此修改两边已一致的原生米制格。

## 原生核验

[主图核验](pixelorama-scope-check.json)与[远景核验](pixelorama-distant-scope-check.json)确认两张 PXO cel、原生导出 PNG 和独立重开后的 PNG 完全相等；28 个主图范围外没有变化，全部 alpha 与清空商铺贴纸相同。主图改变 373439 像素，远景改变 1406174 像素；暖窗数据图不变。

[Blender 核验](native-source-check.json)在独立进程重开原稿，确认几何、法线、UV、变换、材质和相机等完全相同，398 个导出分区与原几何二进制完全相同。[全部面材质审计](material-coverage-final.json)覆盖 19188 个 mesh、28 个主图材质加远景绑定，正面、侧面、背面和底面使用同一套新版材质，没有遗漏的隐藏材质。

本地入口：[永久空场景综合测试](http://127.0.0.1:4173/rooftop/?stage=background)。[最终网页检查](browser-review.json)记录 12 个实际样本，覆盖南北、六种视角、春夏秋冬、晴天、小雨与台风、日间与夜间，以及 1280×720 和 406×658 画布。样本均已完成环境过渡、原生背景加载正常、无浏览器控制台错误，物品数为 0、角色显示关闭。冷加载后的大墙阴影及远景夜灯已实际检查。最终截图以该报告所列文件为准，其他 `local-*.png` 是此前阶段检查；样本不能代替全部环境组合检查。

完整 `node isopoda/tools/check-all.mjs` 通过 398 项测试和全部结构契约，`git diff --check` 通过。原生两张 PXO 保存与重开核验、Blender 打包导出与重开核验、真实网页显示分别完成。当前仅更新本地，尚未提交或发布；第 07 轮已发布记录继续保留在 [rooftop-review-01](../rooftop-review-01/README.md)。

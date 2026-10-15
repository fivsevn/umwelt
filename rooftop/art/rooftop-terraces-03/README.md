# 主角南北天台原稿

当前为第五轮验收版，供正式游戏、车库与[统一测试页](../../tests/browser/rooftop.html?mode=scene&scene=north&view=terrace&look=terraces)共同使用。范围仅为主角北天台和南阳台；整组建筑原稿、背景导出、邻楼和房间没有修改。

## 当前效果

北天台保留两块齐平的水泥修补、三处不同形状的脱灰及偏冷的旧灰层次。南阳台没有地坪补丁或脱灰开口，以偏暖的斑驳、日晒色差和潮痕区分。贴图内用不规则像素抖动衔接色阶，不加完整深色描边。

分段压顶、墙脚收边、管夹、线管和窗洞收口形成浅层结构。两侧各有一个圆形格栅下水口，中心保持作者截图指定的位置；接入场景后横纵直径均为 0.9 场景单位，边缘高出地坪 2.5 毫米。独立地坪抬升 2 毫米，覆盖旧建筑内的排水口顶面；此前试作的方形口和浅槽已移除。

## 文件归属

| 文件 | 用途 |
| --- | --- |
| `terraces/terraces.blend` | 当前完整、独立米制 Blender 原稿，后续建模从此继续 |
| `terraces/atlas.pxo` | 当前 Pixelorama 原生贴图；`terraces-atlas.pxo` 是同内容的源文件索引副本 |
| `terraces/atlas.png` | 从 Pixelorama 保存的贴图，面 UV 保持 16 像素／米 |
| `terraces/texture-layout.json` | 当前各面 UV 与材质图集位置 |
| `preview/assets/terraces.glb` | 当前 Blender 导出，内嵌原生 PNG |
| [`../../assets/terraces/terraces.glb`](../../assets/terraces/terraces.glb) | 正式运行副本，须与当前导出逐字节一致 |
| [`../../3d/terrace-finishes.mjs`](../../3d/terrace-finishes.mjs) | 共用加载器，合并为一次绘制，接受现有阴影、天气和最终采样 |

运行模型共有 173 个源构件、5,064 个三角面，北侧 108 个构件、南侧 65 个。原 `rooftop-lowpoly-02` 建筑与 `assets/background/` 不作为本轮导出目标。

## 继续修改与验证

1. 在当前 `terraces.blend` 和 `atlas.pxo` 内局部修改，保留未涉及部件与图集像素；不要运行历史布局脚本重建当前原稿。
2. 从 Pixelorama 保存原生文件和 PNG，再执行 `export-current.py` 绑定贴图并导出。脚本只读取当前保存稿，不重新建模；默认更新本目录预览，使用 `--publish` 同步运行 GLB。
3. 用 Blender 后台运行 `verify-details.py`，独立重开检查范围、正交 UV、南北差异、圆口位置与贴图一致性；执行 `node --test rooftop/tests/rooftop-terraces.test.mjs` 核对运行导出。
4. 在原测试页查看南北空场景、初始组合、原生／游戏像素、晴天下午、小雨、黄昏和雨天黄昏。空场景的「当前天台／原建筑底模」比较只控制细化模型显示；正式游戏始终使用当前天台。
5. 发布前执行全项目检查，并按[项目发布流程](../../../docs/deployment.md)验证最终网站包和线上页面。

`scope-verification.json` 是当前范围检查；`round-drain-revision.json`、`exported-drain-check.json` 与 `terraces/five-repaint-check.json` 记录圆口位置、尺寸及未改区域保持情况。前四轮脚本、布局中间稿与检查文件只作制作历史，说明见[逐轮记录](revision-history.md)。

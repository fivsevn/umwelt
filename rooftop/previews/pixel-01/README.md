# 花农时代 · 视觉样板 01

历史独立静态预览：陶盆、两层黑色金属花架、门与庭院壁灯。该目录已随 PR #60 合入 main；正式游戏使用共享构造和另一张全游戏图集，不读取这里的六个 GLB。2026-10-10 的整体视觉重制不以此样板作为验收结果。

制作源稿、截图和规格见 [`docs/art/rooftop-pixel-01`](../../../docs/art/rooftop-pixel-01/README.md)。

统一测试入口为 [`/rooftop/?stage=background`](../../?stage=background)，在同一页切换南北阳台、六种视角、天气、时间点和季节。`/rooftop/previews/pixel-01/` 已收起独立样板界面，自动跳转到统一页，默认使用天台视角；关闭 JavaScript 时也只提供统一页链接。

旧链接中的 `scene`、`weather`、`time`、`season`、`view` 会带入统一页，`layout=local` 不会带入空场景。制作资源、历史 `preview.mjs` 与 vendor 保留原路径，继续供 `docs/art/rooftop-pixel-01/` 的 Blender、Pixelorama 导出与 GLB 检查工具使用；统一测试页不读取这些旧样板资源。

历史 GLB 保存几何、法线和纹理坐标，PNG 单独共享。旧 `preview.mjs` 关联同一张图集，避免六个模型内嵌重复纹理。在通用 GLB 查看器中，模型会呈白色；Blender 源稿已打包贴图，可直接编辑完整材质。

`vendor/GLTFLoader.js` 和 `vendor/BufferGeometryUtils.js` 来自 Three.js 官方 r160。修改导入路径以桥接同版本的全局运行时，并改写一条示例 URL 注释，避免被现有发布脚本误认为实际资源。旧样板复用 `../../3d/vendor/three.min.js`，没有引入第二套 Three.js。版权许可见 `vendor/THREE-LICENSE.txt`。

第 7 版简化细小几何，将瓦缝、门板、污渍和材质层次直接画进 Pixelorama 原生粗像素。128×128 图集包含 16 个 32×32 材质区域；所有贴面展开为 8 像素/米的统一正方形格子。大、中、小盆分别烘焙尺寸后展开，实例缩放为 1。网页用共享贴图和四档恒定面顶点色，不使用连续光照、反光或软阴影。当前效果、近景、体积、原文件与考察记录见制作目录 README。

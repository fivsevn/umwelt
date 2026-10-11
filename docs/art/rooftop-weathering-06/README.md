# 自然斑驳贴图修订

本次原生工程严格基于 `rooftop-weathering-05/game-environment.blend`。Pixelorama 重画北天台、南阳台、灰泥墙、旧化墙、墙顶和水泥六块区域，以细碎、自然的多层次斑驳替换迷彩状色块；`atlas-scope.json` 记录精确范围。屋顶、铁件、六处已清空中文的招牌及所有其他像素与 05 完全相同。

`before.blend`、`before-terrace-book.png`、`before-empty-rooftop.bin` 和 `before-empty-rooftop.mjs` 保存 05 原稿、图集及实际运行时快照。`integration-baseline.json` 锁定这些文件的 SHA-256 和完整几何分区定义。

`replace-atlas.py` 只替换并打包完成的 Pixelorama PNG，保存为 `game-environment.blend`。`export-game.py` 从这个实际 Blender 原稿导出游戏资源。`check-native.py` 在另一个 Blender 进程中独立重开原稿，比较保存前后的完整几何、UV、变换、相机、材质分配和 16 像素/米标定；运行时二进制逐字节相等、全部分区定义相等。

验收报告为 `native-texture-integration.json` 和 `native-source-check.json`。完成后，Pixelorama PNG、Blender 打包 PNG 与运行时 PNG 必须逐字节相同，六块范围外的所有像素必须相同。此管线不重建模型、不重校准 UV，不操作 Pixelorama/PXO；天气与柳絮保持当前实现。文件和预览仅保存在本地。

原生步骤：依次使用 Blender `--background --python-exit-code 1` 执行 `replace-atlas.py`、`export-game.py`（参数为本目录原稿与 `rooftop/assets/background`）、`check-native.py`。

原生保存、实际游戏导出和独立重开均已通过。保存原稿 SHA-256 为 `b7a6b3167f79b961fa4d1cd365ed6cbf7595aba760765c5050ecfcbd7761fe25`，三处一致的 PNG SHA-256 为 `feb85960aaadc4241e8e30e67f19334a38f36854decb9f98548505d38280c12c`。运行时 398 个几何分区和 5,476,608 字节二进制与 05 完全一致；全部检查证据见 `native-source-check.json`。

实际 3D 首版复核发现细链偏长后，原生 Pixelorama 将主要细链改成紧凑二维碎簇，保留六块范围与调色板；Blender 图集随后重新打包、导出、独立重开，严格验收再次通过。首版原稿及报告保存为 `first-pass-game-environment.blend` 与 `first-pass-*` 报告，05 的 `before-*` 基线保持完整。

最终 Pixelorama 原稿为 `terrace-book.pxo`，已独立重开并确认与导出 PNG 一致。此次使用 20,238 次原生 1 像素 Pencil 笔触；各区域采用 11–12 个相近灰阶与少量灰暖补浆色，主要碎簇限定在 5–7 个原生像素内，保留局部裂缝、补浆、矿物残留与返潮层次。像素尺度继续为 16 像素/米，最近邻采样保持不变。

实际浏览器复核包括固定 1280×720 视角的北天台阴天前后对照，以及北天台、南阳台晴天中午效果。截图为 `before-fixed-north-overcast-day.jpg`、`review-fixed-north-overcast-day.jpg`、`review-fixed-north-clear-day.jpg`、`review-fixed-south-clear-day.jpg`。最终用户页面已刷新为新版贴图，保留实际 406×658 视口，截图为 `review-live-north.jpg`；图集为 160,508 字节，公共场景物件为 0，春天柳絮保持 16 个，浏览器无错误。状态记录见 `browser-visual-checks.json`。

现有背景与渲染预算测试 8 项全部通过，见 `verification-tests.txt`。天气、季节、光照、柳絮和预览界面等 8 个运行时输入文件的 SHA-256 未变，见 `unchanged-runtime-inputs-check.json`。只读色阶分析见 `before-pigment-diagnostics.json` 和 `after-pigment-diagnostics.json`，作为大块高反差区域缩小的辅助证据。

本地预览：<http://127.0.0.1:4173/rooftop/?stage=background&weather=clear&time=day&season=spring&scene=north>。

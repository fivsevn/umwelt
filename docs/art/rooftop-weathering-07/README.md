# 裂缝、修补和水渍贴图细化

此页保留本轮 Pixelorama、Blender 制作及当时本地验证记录。当前入口和发布状态见 [花农时代维护索引](../../rooftop-README.md)，统一场景测试的南北、六视角与环境切换见 [综合场景测试](../../rooftop-scene-review.md)。后续测试入口整理没有修改本目录原稿、图集或建筑模型。

本次原生工程严格基于最终 `rooftop-weathering-06/game-environment.blend`，即紧凑碎簇修订后的版本。Pixelorama 进一步细化北天台、南阳台、灰泥墙、旧化墙、墙顶和水泥六块区域的裂缝、修补和水渍；`atlas-scope.json` 记录精确范围。屋顶、铁件、六处已清空中文的招牌及所有其他像素与最终 06 完全相同。

`before.blend`、`before-terrace-book.png`、`before-empty-rooftop.bin` 和 `before-empty-rooftop.mjs` 保存最终 06 原稿、图集及实际运行时快照。`integration-baseline.json` 锁定 SHA-256 和完整几何分区定义；原稿基线为 `b7a6b3167f79b961fa4d1cd365ed6cbf7595aba760765c5050ecfcbd7761fe25`，图集基线为 `feb85960aaadc4241e8e30e67f19334a38f36854decb9f98548505d38280c12c`。

`replace-atlas.py` 只替换并打包完成的 Pixelorama PNG，保存为 `game-environment.blend`。`export-game.py` 从这个实际 Blender 原稿导出游戏资源。`check-native.py` 在另一个 Blender 进程中独立重开原稿，比较保存前后的完整几何、UV、变换、相机、材质分配和 16 像素/米标定；运行时二进制逐字节相等，全部 398 个几何分区定义相等。

验收报告为 `native-texture-integration.json` 和 `native-source-check.json`。完成后，Pixelorama PNG、Blender 打包 PNG 与本地运行时 PNG 必须逐字节相同，六块范围外的所有像素必须相同。此管线不重建模型、不重校准 UV，不操作 Pixelorama/PXO；JS、天气、光影和柳絮保持当前实现。文件和预览仅保存在本地。

原生步骤：依次使用 Blender `--background --python-exit-code 1` 执行 `replace-atlas.py`、`export-game.py`（参数为本目录原稿与 `rooftop/assets/background`）、`check-native.py`。

原生保存、实际本地游戏导出和独立重开均已通过。最终原稿 SHA-256 为 `05212c8afc174b5e47283e415b6112e583969bb57d55293ea31b57ea5d81b538`，Pixelorama、Blender 打包及本地运行时三处一致的 PNG SHA-256 为 `8fd4e9d509760c029c903debed2ce8720d32bac92ce4d5496793a3111f79fcc3`。此次仅改变北地坪 1,531、南地坪 1,009、灰泥墙 151、旧化墙 188、墙顶 9、水泥 61 个像素，共 2,949 个；所有范围外像素与最终 06 相同。运行时 398 个几何分区和 5,476,608 字节二进制与最终 06 完全一致，全部检查证据见 `native-source-check.json`。

Pixelorama 实际使用 2,884 次原生 1 像素 Pencil 笔触，在最终 06 上局部细化，保留既有底色。细裂缝采用不等长断线、短分叉和局部深段；少量补浆保留弱邻色的安静中心与参差开口边缘；水渍由低点和墙脚局部薄晕、断续矿物残迹组成。原生 `terrace-book.pxo` 已独立重开，cel、PNG 与重开导出完全一致。照片观察与材料参考见 `reference-notes.md`，详细绘画记录见 `material-authoring-notes.json`。

实际浏览器以相同 1280×720 视角完成南北阳台阴天前后对照，并检查北天台晴天和南阳台小雨效果；`before-fixed-*`、`review-fixed-*` 保存截图。最终用户预览页已刷新到 159,903 字节的新版图集，保留 406×658 实际视口及用户当前的有风、中午、春天选择，截图为 `review-live-north.jpg`。公共场景物件为 0，浏览器无错误；状态记录见 `browser-visual-checks.json`。

现有背景与渲染预算测试 8 项全部通过，见 `verification-tests.txt`。天气、季节、光影、柳絮及预览界面等 8 个运行时输入文件 SHA-256 未变，见 `unchanged-runtime-inputs-check.json`。

本地预览：<http://127.0.0.1:4173/rooftop/?stage=background&weather=wind&time=day&season=spring&scene=north>。

# 斑驳贴图修订

本次 Blender 原稿仅基于 `rooftop-weathering-04/game-environment.blend`，更新由 Pixelorama 绘制并导出的六块授权图集区域。建筑、场景变换、相机、材质分配、每米 16 像素的 UV 与运行时几何二进制均保持相同。

`atlas-scope.json` 记录北天台、南阳台、灰泥墙、旧化墙、墙顶和水泥的允许范围。屋顶、04 铁件、已经清空中文的六处招牌及所有其他像素必须与 04 完全相同。

`before.blend` 与 `before-terrace-book.png` 保存 04 快照。`replace-atlas.py` 只替换 Blender 打包图集，`export-game.py` 导出实际原稿，`check-native.py` 独立重开并检查保存文件及运行时。

检查报告为 `native-texture-integration.json` 与 `native-source-check.json`。Pixelorama PNG、Blender 打包 PNG 与运行时 PNG 必须逐字节相同；运行时二进制与全部几何分区必须与 04 完全相同。文件和预览仅保存在本地。

本次参考用户提供的地铁站复古 3D 截图，重点取其灰绿色材料上相接的深浅旧色和磨损边缘。没有复制参考图像，也没有生成贴图。Pixelorama 使用 1 px Pencil 完成 5012 笔绘制，保存 `terrace-book.pxo` 并导出 PNG；独立重开后，原生 cel、PNG 和重开导出的 PNG 完全一致。六块材料的实际非基色覆盖率为 27.47–34.12%，每块含六种颜料；04 的相应覆盖率只有约 2–6%。具体范围、颜色和覆盖率见 `material-authoring-notes.json`、`pigment-coverage.json` 与 `before-pigment-coverage.json`。

春柳絮由 24 粒成组颗粒改为 16 粒分散的单 texel 轻絮，去掉 2×2 颗粒与四粒聚团，降低 alpha，并使用各自不同的风速、相位、缓慢停顿和小幅上下浮动。修正透视投影缺少 viewport 半尺度而使直径放大两倍的问题；每粒尺寸仍为 1/16 米，并保留南北阳台的物理尺度换算。其他季节的轨迹、轮廓和尺寸分支保持原行为。

48 项相关测试通过，报告为 `verification-tests.txt`，包含实际 Three 相机两端点投影尺寸对照、南北朝向、天气切换和原有季节行为。实际浏览器在 406×658 的用户窗口检查了南北阳台的春天、晴朗、中午效果；两处均加载原生 Blender/Pixelorama 场景，保持空天台，未重建布置模型，也没有控制台错误。正常动画和减少动画偏好下，16 粒轻絮均持续移动，实测记录见 `browser-willow-motion.json` 与 `browser-visual-checks.json`。截图保存为 `review-north-spring-day.jpg`、`review-south-spring-day.jpg`；记录的是实际交互视角。

最终本地预览：<http://127.0.0.1:4173/rooftop/?stage=background&weather=clear&time=day&season=spring&scene=north>。浏览器保留为可交互预览，临时媒体偏好与网络缓存设置均已恢复。

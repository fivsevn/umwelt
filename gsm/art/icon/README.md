# Gstream 占位图标

32 × 32 透明像素图。冷绿色消息窗口与薄荷色回复气泡，珊瑚色标题栏作为小面积点缀；桌面底座为青绿 `#709487`。在真实 Pixelorama 中使用 1 px Pencil 笔触制作并原生保存、导出。桌面外框沿用现有图标的尺寸、左上高光与右下阴影，背景由 CSS 绘制，PNG 保持透明。两个媒体项目独立设计。

- `icon.pxo`：当前可编辑原稿，直接用 Pixelorama 打开。
- `pencil-strokes.json`：初始构图的确定性笔触记录；手动编辑原稿后，以原稿为准。
- `authoring.json`：原生软件保存与导出记录。
- `../../assets/icon.png`：网页使用的透明 PNG。

后续修改原稿后，在 Pixelorama 导出 PNG，覆盖固定的 `assets/icon.png` 路径即可。保持 32 × 32 画布及透明背景；网页以像素方式放大，不添加平滑滤镜。

从仓库根目录运行 `python3 tools/pixel-icons/author.py gsm --check`，将原稿在 Pixelorama 中重新打开并比对导出结果。macOS 需安装 `/Applications/Pixelorama.app`。**只有需要重建初始方案时**才去掉 `--check`；重建会覆盖原稿中的手动修改。原稿检查临时图片与日志不入库。

[双图标预览](../../../tests/browser/media-icons.html) · [项目说明](../../README.md)

## 视觉参考

- [Microsoft：Icons (Design basics)](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-icons)：参考小尺寸下简化关键形状、统一光照方向，以及放回真实桌面检查视觉重量的方法；未采用其 Aero 渲染方式。
- [ENDESGA 16 / Lospec](https://lospec.com/palette-list/endesga-16)：观察有限色组中暖色与深绿的搭配，当前颜色为本项目自行调整。

检索日期：2026-10-18。参考仅用于构图与颜色关系，未使用外部图标素材。

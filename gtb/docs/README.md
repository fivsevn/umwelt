# Gtuber 维护

[游戏维护入口](../README.md)

仿 YouTube 的虚构视频平台，当前仅制作占位图标与入口。

已实现：透明像素图标、桌面入口、简单占位页和中英日名称切换。视频播放、信息流、发帖、点赞与账号系统均未实施；两个项目不共享内容数据。

- 图标导出：`../assets/icon.png`，32 × 32，RGBA，保留硬像素边缘。
- 可编辑原稿与替换步骤：[art/icon/README.md](../art/icon/README.md)。
- 名称：公共 `shared/games.mjs`；占位壳：`shared/placeholder.css`、`shared/placeholder.mjs`。
- 三语预览与检查：[测试说明](../tests/README.md)。

线上只开放占位页；平台交互功能继续在各自目录内制作。

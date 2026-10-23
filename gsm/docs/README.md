# 页面维护

[项目入口](../README.md) · [发帖说明](publishing.md) · [AI 日常更新](ai-updates.md) · [用户管理](../users/README.md) · [检查方法](../tests/README.md)

## 运行文件

| 文件 | 用途 |
| --- | --- |
| `index.html`、`settings/index.html` | 时间线和语言设置页 |
| `app.mjs`、`style.css` | 页面交互和布局 |
| `icons.mjs`、`decorations.mjs`、`dither.mjs` | 导航、装饰与像素纹理 |
| `locales.mjs`、`time.mjs` | 界面译文和相对时间 |
| `state.mjs` | 本地点赞记录 |
| `data/feed.mjs` | 从帖子与用户档案生成的信息流 |
| `assets/` | 图标、头像和素材许可 |

名称来自 `shared/games.mjs`，语言沿用主页的 `umwelt-desktop-language`，字体来自公共 `assets/fonts/`。页面保持 390 px 的单列设计比例，宽屏居中，顶部和底栏固定，帖子区域独立滚动。

## 内容构建

`tools/publish.py` 同步用户管理表、归档帖子、转换 WebP 并生成信息流。`tools/verify-live.py` 核对发布结果，`tools/inbox.py` 只清理已经成功发布的上传原图。`.publishing/` 保存导入位置、去重记录和公开媒体清单，由 Actions 维护。

用户的头像图片留在各自文件夹，帖子图片留在各自帖子包。上传图片和头像均输出 WebP。默认卡片颜色按用户名固定分配；用户档案可通过 `color` 指定颜色，取值见[用户管理](../users/README.md)。

## 素材许可

标题中的部分符号使用 Pixelarticons，许可保存在 `assets/pixelarticons-LICENSE.txt`。外部头像的来源和许可记录在对应用户的 `profile.json` 中。

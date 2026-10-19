# Gstream / 爬爬在线

虚构动物社区的轻互动信息流。当前本地页面采用鼠尾草、奶油与珊瑚粉配色、网格和分层阴影，读取独立归档的守宫帖子。底栏的小屋、守宫头、齿轮分别返回 Umwelt 主页、进入 `stream` 与独立设置页；通过 trigger 更新内容，发布状态以 Pages 工作流和线上页面为准。

[维护总入口](../MAINTENANCE.md) · [共用规则](../docs/structure.md) · [文档导航](docs/README.md) · [测试说明](tests/README.md)

## 名称与标识

| 项目 | 名称 |
| --- | --- |
| 中文 | 爬爬在线 |
| English | Gstream |
| 日本語 | ジー投稿 |
| 桌面文件名 | `GSM.BIO` |
| 仓库目录 | `gsm/` |

遵循[游戏名称规则](../docs/naming.md)，与另一个媒体项目独立维护。

## 游戏入口

[线上占位页](https://umwelt.fivsevn.com/gsm/)。本地预览入口为 `/gsm/`，发布前在本地评审。

## 本地运行

从仓库根目录运行 `python3 -m http.server 8765 --bind 127.0.0.1`，打开 [/gsm/](http://127.0.0.1:8765/gsm/)。

## 目录与文档

| 位置 | 内容 |
| --- | --- |
| `index.html`、`settings/index.html`、`style.css`、`app.mjs` | 时间线与独立设置页，共用布局、三语界面与本地互动 |
| `trigger.md`、`posts/`、`characters/`、`uploads/` | 发帖入口、每帖文件包、注册角色与图片上传 |
| `tools/publish.py`、`data/feed.mjs`、`locales.mjs` | 自动归档、图片转 WebP、生成信息流与三语界面 |
| `state.mjs` | 独立本地记录、读取校验与保存失败回退 |
| `icons.mjs`、`decorations.mjs`、`dither.mjs`、`assets/under-leaves.svg` | 可编辑 SVG 符号、头像、装饰、抖动纹理和示例配图 |
| `assets/icon.png` | 当前 32 × 32 透明像素图标 |
| `art/icon/` | Pixelorama 原稿、笔触记录与导出说明 |
| `docs/` | [范围与替换方法](docs/README.md) |
| `tests/` | [核对入口](tests/README.md) |

## 内容维护

发帖和改帖见[trigger 使用说明](docs/publishing.md)。帖子正文、照片、角色名称与头像分开维护；上传图片和头像自动转 WebP。

页面只提供浏览和点赞，按用户的 390 px 手机稿排布。所有屏幕保持同一列和比例：窄屏整体缩小，宽屏居中并最多放大到 1.5 倍；标题和底栏固定，中间独立滚动并隐藏滚动条。所有帖子的头像与卡片顶边对齐，作者、时间和点赞使用统一边距，心形与数量垂直居中。用户名使用「显示名@英文账户名」，纯文本加粗并有一像素阴影。

底栏只显示三个像素图案，保留可访问名称。小屋返回 Umwelt 主页，守宫头回到时间线，齿轮进入 `/gsm/settings/`；设置页沿用时间线的标题、底栏和卡片，只放中英日语言切换。通过同一个 trigger 以任意守宫身份发布，没有账号登录服务；点赞只更新 `umwelt-gsm-preview-v1`；早期预览的记录保留在存储中，当前列表按归档帖子的真实发布时间排序，不限制三条。

名称统一读取 `shared/games.mjs`，语言继承桌面的 `umwelt-desktop-language`，两种像素字体从公共 `assets/fonts/` 引用。所有专属内容留在 `gsm/`，`gtb/` 继续使用原占位页。

图标从 [Pixelorama 原稿](art/icon/icon.pxo) 继续编辑，按[制作说明](art/icon/README.md)导出到固定路径。项目特有内容留在本目录。

## 检查

从仓库根目录运行 `node tools/check-all.mjs`。三语与预览核对方法见[测试说明](tests/README.md)。

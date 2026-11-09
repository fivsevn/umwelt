# Gstream / 爬爬在线

守宫们发动态、分享见闻和接着聊的虚构社交空间。

## 名称与标识

中文：爬爬在线；English：Gstream；日本語：ジー投稿。桌面标识为 `GSM.BIO`，目录为 `gsm/`。

## 游戏入口

[打开游戏](https://umwelt.fivsevn.com/gsm/)。页面沿用现有手机比例、外壳、屏幕、固定上下栏与中间滚动。

点击评论进入帖子页面，查看守宫之间的虚拟回复，并可点赞和查看角色主页。

## 本地运行

在仓库根目录运行 `python3 -m http.server 8797 --bind 127.0.0.1`，打开 [本地页面](http://127.0.0.1:8797/gsm/)。

## 目录与文档

| 目录与入口 | 内容 |
| --- | --- |
| [gsm/users/](users/README.md) | 守宫资料：个体档案、用户目录、模板与研究参考 |
| [gsm/environment/](environment/README.md) | 环境资料：世界趋势、日常生活、Meme、评论与论坛自身 |
| [gsm/docs/](docs/README.md) | AI 更新：完整阅读、现实取材、自然发帖与发布 |

`posts/` 保存原帖与回复，`data/feed.mjs` 是生成的信息流；`tools/` 负责更新与归档，`tests/` 保存检查。旧研究与运营证据见[历史资料](docs/research/README.md)。

## 内容维护

每次更新从[AI 更新入口](docs/README.md)及其中的启动语开始。编辑每个用户自己的 `profile.md`，目录自动生成；公共环境和交流研究放在 `environment/`。AI 按批次更新，人工内容继续使用 `trigger.md` 与 `uploads/`。操作、头像、归档和运行文件说明集中在[执行与发布](docs/publishing.md)。

## 检查

在仓库根目录运行 `node tools/check-all.mjs`。批次、发布和浏览器检查见[检查说明](tests/README.md)。

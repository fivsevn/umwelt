# Gstream / 爬爬在线

守宫社区的信息流：浏览动态、点赞，并在独立设置页切换中英日语言。

[用户管理表](users/README.md) · [发帖说明](docs/publishing.md) · [维护说明](docs/README.md)

## 名称与标识

中文：爬爬在线；English：Gstream；日本語：ジー投稿。桌面标识为 `GSM.BIO`，目录为 `gsm/`。

## 游戏入口

[打开游戏](https://umwelt.fivsevn.com/gsm/)。页面保持手机比例，上下栏固定，中间滚动。

## 本地运行

在仓库根目录运行 `python3 -m http.server 8797 --bind 127.0.0.1`，打开 [本地页面](http://127.0.0.1:8797/gsm/)。

内容更新后运行 `python3 gsm/tools/publish.py build`。

## 目录与文档

- 页面代码位于本目录，语言设置页位于 `settings/`。
- `posts/` 保存每条帖子的独立文件包，`users/` 保存用户档案与头像图片。
- `assets/` 保存运行素材，`data/feed.mjs` 是构建生成的信息流。
- `tools/` 负责内容归档、转换和发布核验，`tests/` 保存自动检查。

## 内容维护

编辑[用户管理表](users/README.md)新增用户、修改昵称、启用状态、随机分配开关和头像。编辑 `trigger.md` 发布文字或图文，也可只将图片放进 `uploads/`；修改旧帖直接编辑 `posts/` 中的对应文件。

提交到 `main` 后，Actions 自动同步用户、归档帖子、转换 WebP、检查并发布。已分配的头像和旧帖作者保持稳定；成功发布并核验后，自动清空已处理的上传原图。操作细节见[发帖说明](docs/publishing.md)。

## 检查

在仓库根目录运行 `node tools/check-all.mjs`。内容发布和浏览器检查方法见[检查说明](tests/README.md)。

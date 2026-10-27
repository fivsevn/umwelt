# Gstream / 爬爬在线

守宫社区的信息流：浏览动态、点赞，点击头像、昵称或用户名进入个人主页，在独立设置页切换外壳和中英日语言。

[用户与角色管理](users/README.md) · [发帖说明](docs/publishing.md) · [模拟总控](docs/ai-updates.md) · [研究与自省](docs/research/README.md) · [维护说明](docs/README.md)

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

编辑[用户管理表](users/README.md)新增用户、修改昵称、主页个性签名、启用状态、随机分配开关和头像。编辑 `trigger.md` 发布文字或图文，也可只将图片放进 `uploads/`；修改旧帖直接编辑 `posts/` 中的对应文件。

角色设定与活跃习惯同样只在用户与角色管理文件维护。AI 从[模拟总控](docs/ai-updates.md)读取各模块，分工见[维护说明](docs/README.md#模拟文档如何分工)。

提交到 `main` 后，Actions 自动同步用户、归档帖子、转换 WebP、检查并发布。已分配的头像和旧帖作者保持稳定；成功发布并核验后，自动清空已处理的上传原图。操作细节见[发帖说明](docs/publishing.md)。

### 标志、外壳与显示

`brand.mjs` 保存最终 16 × 16 标志和六款同色默认头像，应用图标与外壳按键使用相同头形。默认头像迁移与照片保护规则见[用户管理](users/README.md#统一默认头像)。

`tools/handset-source/` 保留八套外壳的竖横屏 Blender 原稿及最终控制蒙版；`tools/render-handset.py` 将印墨放进键帽材质，`tools/encode-handset.py` 将整幅渲染统一采样为运行图片。`python3 gsm/tools/handset-controls.py` 从同一组最终蒙版导出点击轮廓和键盘焦点，可用 `--check` 核对，无需运行时读取几何数据。三键仍为原生导航链接。

`pager-screen.css` 与 `assets/lcd-matrix.svg` 统一玻璃点阵、字墨和背光，文字保留原生像素字体布局；桌面迷你屏幕使用 `desktop-icon.css`。

## 检查

在仓库根目录运行 `node tools/check-all.mjs`。内容发布和浏览器检查方法见[检查说明](tests/README.md)。

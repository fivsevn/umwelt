# Gstream 检查

[项目说明](../README.md) · [原稿](../art/icon/README.md)

仓库根目录运行 `node tools/check-all.mjs`，现有公共登记检查覆盖本项目名称、目录、README 与入口；此项已接入 CI。

启动本地静态服务后，查看 [信息流](../index.html)、[设置](../settings/index.html) 和 [双图标预览](../../tests/browser/media-icons.html)。所有帖子使用外置头像和彩色卡片，固定底栏有小屋、守宫头、齿轮三个像素按钮。图标继续核对 32／48／128 px 显示与透明边缘。

## 信息流交互

```sh
node --test gsm/tests/state.test.mjs
BASE_URL=http://127.0.0.1:8797 BROWSER=chromium node gsm/tests/browser/feed.cjs
BASE_URL=http://127.0.0.1:8797 BROWSER=webkit node gsm/tests/browser/feed.cjs
```

浏览器检查需要 Playwright 和相应浏览器。覆盖三图标导航、独立设置页直达与刷新、中英日语言切换、回到时间线与退出主页、点赞/取消/刷新保留、键盘操作、早期预览记录不丢失、存储不可用回退。验证 320、390、430、768、1280、1920 px 和横屏 844 × 390 下的手机比例、卡片宽度与间距、头像顶边、心形和数字的垂直对齐、固定上下栏、内部滚动与隐藏滚动条，以及最后一条帖子可达。`QA_OUTPUT` 可指定仓库外截图目录。

专项浏览器脚本已接入公共 `system-regression.yml` 的 `gsm-feed` 分支；发布成品检查改为等待实际动态出现。运行结构检查由 `tools/check-public-surface.mjs` 确认新的页面依赖。本地与线上发布均运行相应检查。

原稿核对：`python3 tools/pixel-icons/author.py gsm --check`。需要本地 Pixelorama，不接入 CI。

跨游戏语言核对：`BASE_URL=http://127.0.0.1:8765 node tests/browser/game-titles.cjs`。需要 Playwright 和对应浏览器。成品入口已加入 `tests/browser/published-artifact.cjs`，Pages 工作流会执行。

## trigger 与内容归档

安装 `gsm/tools/requirements.txt` 后，运行 `python3 -m unittest discover -s gsm/tests -p 'test_*.py' -v`，覆盖逐提交导入、本地预览去重、重复运行、旧帖编辑、排序、草稿/隐藏过滤、用户名校验、图片所属包、JPEG 方向、透明和动画 WebP、注册时分配头像、改名与开关变化不重画、未变化的自定义原图不重转、清空头像栏保留现有头像、管理说明表不参与解析、单图/多图提交、提交配文、明确指定/随机用户、历史作者固定、用户停用和误删保护，以及真实 HTTP 核验后才清理上传原图。

`state.test.mjs` 同时核对生成内容、三语回退与真实时间变化。浏览器检查读取任意数量的归档帖，不再写死三条、昵称或点赞数；核对 WebP 头像加载、固定布局和旧存储保留。发布包测试额外核对只复制公开清单中的媒体，不复制 trigger、角色源配置、上传原图或草稿图片。

# Gstream 检查

[项目说明](../README.md)

仓库根目录运行 `node tools/check-all.mjs`。公共登记、入口与运行依赖检查已接入 CI。

## 信息流交互

```sh
node --test gsm/tests/state.test.mjs
BASE_URL=http://127.0.0.1:8797 BROWSER=chromium node gsm/tests/browser/feed.cjs
BASE_URL=http://127.0.0.1:8797 BROWSER=webkit node gsm/tests/browser/feed.cjs
```

浏览器检查需要 Playwright 和对应浏览器，覆盖三键导航、设置页直达与刷新、中英日语言切换、点赞及持久化、键盘操作、存储兼容与不可用回退。视口覆盖 320、390、430、768、1280、1920 px 和横屏 844 × 390。

视觉检查包含外壳、屏幕与按键的包含关系，单列消息布局，完整作者与账号，公共 FusionPixel 字体及最小 16px 正文，16 × 16 头像位图，九个页头装饰与三个底部装饰，心形与数字对齐，固定页头、内部滚动和末条帖子可达。头像的灰绿滤镜仅应用于显示层。玻璃反光和点阵纹理不能拦截点击、选字或滚动；静态纹理应固定在屏幕表面。

八套花色均检查主图、横屏图与缩略图解码，以及 URL 选择、设置切换、跨页面和刷新保留。地址兼容映射为 `mint` → `leopard`、`blue` → `tokay`、`berry` → `day`、`blizzard` → `stone`。硬件图像以 `image-rendering:pixelated` 缩放，竖版为 118 × 208、横版为 165 × 112；按键印字与外壳使用同一采样网格。透明导航链接应保持点击区域及键盘焦点。`QA_OUTPUT` 可指定仓库外截图目录。

渲染和编码工具位于 `gsm/tools/`，Blender 场景位于 `gsm/tools/handset-source/`；色纹资料见 [handset-references.json](../tools/handset-references.json)。显示参考资料为 [Motorola ADVISOR II 用户指南](https://www.motorolasolutions.com/content/dam/msi/docs/business/_documents/user_guides/static_files/advisor_ii_en.pdf) 和 [Crystalfontz 黄绿 STN LCD 点阵规格](https://www.crystalfontz.com/product/cfa633yyhku-16x2-text-display-module-usb)。

专项浏览器脚本已接入 `system-regression.yml` 的 `gsm-feed` 分支。跨游戏语言检查为 `BASE_URL=http://127.0.0.1:8765 node tests/browser/game-titles.cjs`；成品入口由 `tests/browser/published-artifact.cjs` 覆盖。

## trigger 与内容归档

安装 `gsm/tools/requirements.txt` 后，运行 `python3 -m unittest discover -s gsm/tests -p 'test_*.py' -v`。测试覆盖内容导入与去重、旧帖编辑、排序、草稿与隐藏过滤、用户管理、头像分配及保留、图片归档与格式处理、多图提交、历史作者及用户保护，以及 HTTP 核验后的上传原图清理；已接入 Repository checks 与 Pages 发布前检查。

`state.test.mjs` 核对生成内容、三语回退与时间变化。发布包测试核对媒体公开清单，确保 trigger、角色源配置、上传原图、草稿图片、工具与测试资料不进入站点成品。

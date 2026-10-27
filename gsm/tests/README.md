# Gstream 检查

[项目说明](../README.md)

仓库根目录运行 `node tools/check-all.mjs`。公共登记、入口与运行依赖检查已接入 CI。

## 信息流交互

```sh
node --test gsm/tests/state.test.mjs
BASE_URL=http://127.0.0.1:8797 BROWSER=chromium node gsm/tests/browser/feed.cjs
BASE_URL=http://127.0.0.1:8797 BROWSER=webkit node gsm/tests/browser/feed.cjs
BASE_URL=http://127.0.0.1:8797 BROWSER=chromium node gsm/tests/browser/profile.cjs
BASE_URL=http://127.0.0.1:8797 BROWSER=webkit node gsm/tests/browser/profile.cjs
BASE_URL=http://127.0.0.1:8797 BROWSER=chromium node gsm/tests/browser/lcd.cjs
BASE_URL=http://127.0.0.1:8797 BROWSER=webkit node gsm/tests/browser/lcd.cjs
```

浏览器检查需要 Playwright 和对应浏览器，覆盖三键导航、设置页直达与刷新、中英日语言切换、点赞及持久化、键盘操作、存储兼容与不可用回退。视口覆盖 320、390、430、768、1280、1920 px 和横屏 844 × 390。

个人主页使用 `/gsm/?user=账号`，展示该账号的公开动态。`profile.cjs` 检查头像、昵称、用户名及键盘入口、纯箭头返回与可访问名称、用户表签名展示、作者筛选与排序、直接打开和刷新、前进后退及信息流滚动与焦点恢复、主页与信息流共享点赞、中英日、窄屏与横屏、未知账号和存储不可用回退。

视觉检查包含外壳、屏幕与按键的包含关系，单列消息布局，完整作者与账号，公共 FusionPixel 字体及最小 16px 正文，16 × 16 头像位图，九个页头装饰与三个底部装饰，心形与数字对齐，固定页头、内部滚动和末条帖子可达。头像的灰绿滤镜仅应用于显示层。玻璃反光和点阵纹理不能拦截点击、选字或滚动；静态纹理应固定在屏幕表面。

LCD 使用现成 FusionPixel / PixelMplus 字体的原生布局，不再取样、二值化或逐字重绘。纸色与照明留在底层，单一固定点阵在玻璃层同时作用于空白区和原生字墨；格距取正文 12 点字形的单点宽度，单元宽度为格距的 92%，其余为浅色间隙。几何、浅色间隙与未激活墨色集中在 `assets/lcd-matrix.svg`，点距和反光集中在 `pager-screen.css`；没有第二套网格、显示同步器、字形缓存或额外观察器。页面滚动、内容更新、语言切换仍由浏览器原生排版。普通文字不加阴影，昵称和用户名是两个独立链接，悬停只改变当前文字的轻微阴影。`lcd.cjs` 检查原生文字直接可见、选择与复制、独立文字悬停与键盘导航、斜体签名、底纹固定且不拦截操作、中英日设置，以及窄屏/横屏九个装饰保留右侧余量。`QA_OUTPUT` 可保存截图供目检。

八套花色均检查主图、横屏图与缩略图解码，以及 URL 选择、设置切换、跨页面和刷新保留。地址兼容映射为 `mint` → `leopard`、`blue` → `tokay`、`berry` → `day`、`blizzard` → `stone`。硬件图像以 `image-rendering:pixelated` 缩放，竖版为 118 × 208、横版为 165 × 112；按键印字与外壳使用同一采样网格。透明导航链接的点击轮廓与内收焦点来自最终键帽蒙版；`python3 gsm/tools/handset-controls.py --check` 核对已生成的 CSS 和六张焦点图。按压阴影覆盖整块键帽与印墨。`QA_OUTPUT` 可指定仓库外截图目录。

渲染和编码工具位于 `gsm/tools/`，Blender 场景位于 `gsm/tools/handset-source/`；色纹资料见 [handset-references.json](../tools/handset-references.json)。显示近照参考 [Gough Lui 的 Motorola Advisor 实机与拆解](https://goughlui.com/2016/01/15/tech-flashback-motorola-advisor-pocsag-5121200bps-pager/)，点宽/点距比例参考 [Crystalfontz 黄绿图形 STN 模组](https://www.crystalfontz.com/product/cfag12864byyhn-128x64-graphical-lcd-display-module)。92% 几何比例来自同类 LCD 单元，网页显示对比度经整机缩放后的阅读尺寸校正，不代表某一实机的电气仿真。其他显示资料为 [Motorola ADVISOR II 用户指南](https://www.motorolasolutions.com/content/dam/msi/docs/business/_documents/user_guides/static_files/advisor_ii_en.pdf) 和 [Crystalfontz 黄绿 STN LCD 点阵规格](https://www.crystalfontz.com/product/cfa633yyhku-16x2-text-display-module-usb)。

专项浏览器脚本已接入 `system-regression.yml` 的 `gsm-feed` 分支。跨游戏语言检查为 `BASE_URL=http://127.0.0.1:8765 node tests/browser/game-titles.cjs`；成品入口由 `tests/browser/published-artifact.cjs` 覆盖。

## trigger 与内容归档

安装 `gsm/tools/requirements.txt` 后，运行 `python3 -m unittest discover -s gsm/tests -p 'test_*.py' -v`。测试覆盖内容导入与去重、旧帖编辑、排序、草稿与隐藏过滤、用户管理、头像分配及保留、图片归档与格式处理、多图提交、历史作者及用户保护，以及 HTTP 核验后的上传原图清理；已接入 Repository checks 与 Pages 发布前检查。

`state.test.mjs` 核对生成内容、三语回退与时间变化。发布包测试核对媒体公开清单，确保 trigger、角色源配置、上传原图、草稿图片、工具与测试资料不进入站点成品。

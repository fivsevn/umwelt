# GSM 检查

## 本地引擎与素材

在仓库根目录执行：

```sh
npm ci --prefix gsm/tools/engine
python3 -m pip install -r gsm/tools/requirements.txt
node --test gsm/tests/*.test.mjs tests/site-artifact.test.mjs
python3 -m unittest discover -s gsm/tests -p 'test_*.py'
node gsm/tools/publish.mjs validate
node gsm/tools/publish.mjs build
node tools/check-all.mjs
```

检查覆盖素材过滤、真实顺序与引用边界、匿名、去重、请求预算、失败保留、快照冻结、抽签、独立写作输入、审读、操作恢复、账号权限、原生存储及媒体归档。测试材料在隔离目录运行。公开来源检查覆盖十组来源的配置、实际类型、RSS 摘要范围和父关系；只读材料采集不触发内容准备或发布。固定测试不能证明外站当前可访问，真实采集另核对公开返回、时间、去重、缺失内容与分组结果。

## 信息流交互

```sh
node --test gsm/tests/state.test.mjs
node --test gsm/tests/threads.test.mjs
BASE_URL=http://127.0.0.1:8797 BROWSER=chromium node gsm/tests/browser/feed.cjs
BASE_URL=http://127.0.0.1:8797 BROWSER=webkit node gsm/tests/browser/feed.cjs
BASE_URL=http://127.0.0.1:8797 BROWSER=chromium node gsm/tests/browser/profile.cjs
BASE_URL=http://127.0.0.1:8797 BROWSER=webkit node gsm/tests/browser/profile.cjs
BASE_URL=http://127.0.0.1:8797 BROWSER=chromium node gsm/tests/browser/lcd.cjs
BASE_URL=http://127.0.0.1:8797 BROWSER=webkit node gsm/tests/browser/lcd.cjs
BASE_URL=http://127.0.0.1:8797 BROWSER=chromium node gsm/tests/browser/comments.cjs
BASE_URL=http://127.0.0.1:8797 BROWSER=webkit node gsm/tests/browser/comments.cjs
BASE_URL=http://127.0.0.1:8797 BROWSER=chromium node gsm/tests/browser/mobile.cjs
BASE_URL=http://127.0.0.1:8797 BROWSER=webkit node gsm/tests/browser/mobile.cjs
```

浏览器检查需要 Playwright 和对应浏览器，覆盖三键导航、设置页直达与刷新、中英日语言切换、点赞及持久化、键盘操作、存储兼容与不可用回退。视口覆盖 320、390、430、768、1280、1920 px 和横屏 844 × 390。

点赞检查还覆盖多个标签页同步、保存前读取其他页面的新选择，以及页面从往返缓存恢复时刷新状态。同步只更新点赞按钮，保留当前焦点和滚动位置；存储读取失败或配额不足时，尚未保存的本次选择继续留在内存中。

`mobile.cjs` 使用 375 × 667、DPR 3 和触屏上下文，逐屏滚动至末帖并核对所有照片加载；反复切换 375 × 590、667 × 375 和原视口，切换三组外壳与挂件后再走完整信息流。检查手机屏幕实际宽度、三枚实体按键触控、点赞、图片错误、页面崩溃与意外重载，并限制按键反馈和环口阴影的绘制面积。桌面 WebKit 的模拟结果不能代替真实 iPhone 的稳定性复核。

同一脚本另用隔离上下文统计 History API 写入：连续 150 个滚动事件必须合并到少量保存，再验证个人主页、评论页和实体返回键。主动模拟 `replaceState`、`pushState` 的 `SecurityError`，检查原生 URL 导航回退，以及历史写入被拒绝时外观选项仍可选、三个实体键链接继续携带新选择。触控检查包含 44px 命中区域、相邻区域不重叠、离中心上下各 20px 的实际触摸；同一事件轮次连续返回两次只能退一层，之后的独立返回仍须可用。

`threads.test.mjs` 检查多层回复归属、顺序与计数、未知帖子和异常关系、原始内容不变及实际信息流完整性。`comments.cjs` 检查评论链接进入帖子页面、空评论帖子、真实回复对象、共享点赞、作者主页与原帖跳转、独立打开及刷新、前进后退的滚动与焦点恢复、三语、全部外壳、窄屏与横屏、未知帖子及存储不可用回退。

个人主页使用 `/gsm/?user=账号`，展示该账号的公开动态。`profile.cjs` 检查头像、昵称、用户名及键盘入口、左下实体键返回与可访问名称、屏幕内无返回箭头、档案签名展示、作者筛选与排序、直接打开和刷新、前进后退及信息流滚动与焦点恢复、主页与信息流共享点赞、中英日、窄屏与横屏、未知账号和存储不可用回退。

视觉检查包含外壳、屏幕与按键的包含关系，单列消息布局，完整作者与账号，公共 FusionPixel 字体及最小 16px 正文，16 × 16 头像位图，九个页头装饰与三个底部装饰，心形与数字对齐，固定页头、内部滚动和末条帖子可达。头像和帖子图片保留原有颜色。玻璃反光和点阵纹理不能拦截点击、选字或滚动；静态纹理应固定在屏幕表面。

LCD 使用现成 FusionPixel / PixelMplus 字体的原生布局，直接显示可选择与复制的文字。纸色与照明留在底层，单一固定点阵在玻璃层同时作用于空白区和原生字墨；格距取正文 12 点字形的单点宽度，单元宽度为格距的 92%，其余为浅色间隙。几何、浅色间隙与未激活墨色集中在 `assets/lcd-matrix.svg`，点距和反光集中在 `pager-screen.css`；没有第二套网格、显示同步器、字形缓存或额外观察器。页面滚动、内容更新、语言切换仍由浏览器原生排版。普通文字不加阴影，昵称和用户名是两个独立链接，悬停只改变当前文字的轻微阴影。`lcd.cjs` 检查原生文字直接可见、选择与复制、独立文字悬停与键盘导航、斜体签名、底纹固定且不拦截操作、中英日设置，以及窄屏/横屏九个装饰保留右侧余量。`QA_OUTPUT` 可保存截图供目检。

六套外壳、五种天线与八个挂件均检查素材解码、设置选择、跨页面、刷新和历史返回。首次打开固定使用豹纹奶油、石墨短杆和绿色拼豆，手动选择保存到 `umwelt-gsm-appearance`，URL 同时携带三项选择，存储不可用时也能沿内部链接继续使用。设置按外壳、天线、挂件、语言排序，分类字号一致，标题与选项文字分层。测试会检查每组只选中一个选项、三种语言切换以及最下方语言按钮可达。

`device/catalog.mjs` 是外观资源目录，`device/stage.mjs` 将同一套屏幕与导航挂入设备。浏览器检查核对原生 DOM、按键命中区域、屏幕与壳体包含关系、挂绳遮挡层、固定页头及内容滚动。当前 WebP 位于 `assets/device/`，只加载正在使用的外壳、天线、挂件和适用的按钮材质。添加或替换素材的操作见[外观维护](../docs/appearance.md)，统一复用 [appearance 测试页](../dev/appearance/index.html)。`QA_OUTPUT` 可将截图保存到仓库外。

专项浏览器脚本已接入 `system-regression.yml` 的 `gsm-feed` 分支。跨游戏语言检查为 `BASE_URL=http://127.0.0.1:8765 node tests/browser/game-titles.cjs`；成品入口由 `tests/browser/published-artifact.cjs` 覆盖。

## trigger 与内容归档

安装 `gsm/tools/requirements.txt` 后，运行 `python3 -m unittest discover -s gsm/tests -p 'test_*.py' -v`。测试覆盖内容导入与去重、旧帖编辑、排序、草稿与隐藏过滤、用户管理、头像分配及保留、图片归档与格式处理、多图提交、历史作者及用户保护，以及 HTTP 核验后的上传原图清理；已接入 Repository checks 与 Pages 发布前检查。

`state.test.mjs` 核对生成内容、三语回退与时间变化。发布包测试核对媒体公开清单，确保 trigger、角色源配置、上传原图、草稿图片、`gsm/operations/` 全部过程归档、工具与测试资料不进入站点成品。

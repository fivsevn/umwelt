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

八套花色均检查主图、横屏图与缩略图解码，以及 URL 选择、设置切换、跨页面和刷新保留。地址兼容映射为 `mint` → `leopard`、`blue` → `tokay`、`berry` → `day`、`blizzard` → `stone`。新版掌机使用圆润的低模拱面、加厚前后壳、分组明暗和原生像素贴图，前盖整片形成宽拱面并使用平顺法线过渡，分模边与凹槽壁保留硬边；缎面 ABS、哑光屏框、软胶套圈与稍亮的键帽分别设置粗糙度，配合介电反光和接触阴影；`pocket-*` 主图以 `image-rendering:auto` 保持轮廓清晰，纹理在 Blender 内使用 Closest。竖版为 1120 × 1640，左／上／右／下透明余量为 40／140／40／40 逻辑单位；横版为 1720 × 1060，余量为 120／80／120／40。右上方为独立物种挂件与松弛挂绳留出空间，整个画布按视口缩放。八套贴图分别为竖版 192 × 256、横版 248 × 164，像素密度均为 2.5 逻辑单位。三键恢复最初的三个守宫图案，分别左看、正视、右看；字模逐像素对应 `brand.mjs` 的前三个头像变体。原生印字只沿 Z 贴合凸起键帽，每个原像素内部细分贴面以避免被曲面遮挡，XY 轮廓与像素格不变。三键具有实际凹槽、下沉套圈和凸起键帽，小端口和扬声孔也使用逐顶点贴合鼓面的浅凹槽，独立链接与物理键帽位置对应。焦点与按压反馈覆盖整块键帽。`physical-shell.css` 与模型共同维护尺寸。`QA_OUTPUT` 可指定仓库外截图目录。

掌机渲染和编码工具为 `gsm/tools/pocket-handset.py` 与 `gsm/tools/encode-pocket-handset.py`，原生场景位于 `gsm/tools/pocket-handset-source/`，每个场景保留八套材质和打包像素贴图。画法与生物色纹依据见 [pocket-handset-references.json](../tools/pocket-handset-references.json)。整机没有天线，独立物种挂件通过松弛挂绳接在右上挂孔；屏幕使用暖灰橄榄色的离散明度面、短反光和边缘像素组磨损，仍保留唯一点阵网格。显示近照参考 [Gough Lui 的 Motorola Advisor 实机与拆解](https://goughlui.com/2016/01/15/tech-flashback-motorola-advisor-pocsag-5121200bps-pager/)，点宽/点距比例参考 [Crystalfontz 黄绿图形 STN 模组](https://www.crystalfontz.com/product/cfag12864byyhn-128x64-graphical-lcd-display-module)。92% 几何比例来自同类 LCD 单元，网页显示对比度经整机缩放后的阅读尺寸校正，不代表某一实机的电气仿真。其他显示资料为 [Motorola ADVISOR II 用户指南](https://www.motorolasolutions.com/content/dam/msi/docs/business/_documents/user_guides/static_files/advisor_ii_en.pdf) 和 [Crystalfontz 黄绿 STN LCD 点阵规格](https://www.crystalfontz.com/product/cfa633yyhku-16x2-text-display-module-usb)。

专项浏览器脚本已接入 `system-regression.yml` 的 `gsm-feed` 分支。跨游戏语言检查为 `BASE_URL=http://127.0.0.1:8765 node tests/browser/game-titles.cjs`；成品入口由 `tests/browser/published-artifact.cjs` 覆盖。

## trigger 与内容归档

安装 `gsm/tools/requirements.txt` 后，运行 `python3 -m unittest discover -s gsm/tests -p 'test_*.py' -v`。测试覆盖内容导入与去重、旧帖编辑、排序、草稿与隐藏过滤、用户管理、头像分配及保留、图片归档与格式处理、多图提交、历史作者及用户保护，以及 HTTP 核验后的上传原图清理；已接入 Repository checks 与 Pages 发布前检查。

`state.test.mjs` 核对生成内容、三语回退与时间变化。发布包测试核对媒体公开清单，确保 trigger、角色源配置、上传原图、草稿图片、工具与测试资料不进入站点成品。

挂件由 `pocket_gecko_charm.py` 按八种真实守宫分别建模，两个原生模型均保存八个独立物种集合，切换渲染时只显示对应一组。形体、五趾、爪或趾垫、尾巴、瞳孔、冠脊及疣粒列有实质差异；`gecko_species_paint.py` 分别绘制外壳和挂件色纹。资料与阶段限制记录在 `pocket-handset-references.json`。挂绳离开外壳轮廓前须投影到鼓起表面，避免渲染时在挂孔旁埋没。

塑料表面保留连续的大色面，品种花纹以较小、较低对比的细节呈现；做旧通过局部粗糙度、握持抛光区、短擦痕和少量边角磨白完成。八款挂件各自具有不同朝向、摆位和挂绳曲线，物种本体几何与三个导航原图案保持不变。

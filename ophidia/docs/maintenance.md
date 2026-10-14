# THERMOREGULATION / 体温调节 / 体温調節

UMWELT 的竖屏对话游戏。桌面程序名为 **OPHIDIA.EXE**。

[项目文档导航](../../MAINTENANCE.md) · [建模与出图](../art/ophidia-01/README.md)

## 本地试玩

从仓库根目录运行：

```sh
python3 -m http.server 8788 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8788/ophidia/`。点击「坐下」开始，点击画面或右下角 ▾ 继续，也支持 Enter、Space、→。三次分支影响后续对白及结尾，选项支持数字 1 / 2。对白右上角「⋯」收纳三语言、重来和返回主页。

全部内容容纳在一页，维持 9:16 画面。无外框、对白边框或署名覆盖；底部阴影衬托对白。文字不能拖选，开启减少动态效果时仍保留缓慢船舱晃动。

`assets/` 保存 360×640 的船舱背景及 normal、curious、away、tongue 四张透明角色 WebP。模型预渲染后作像素处理；网页使用静态 HTML、CSS、JavaScript，不加载三维引擎。字体复用 `../assets/fonts/`，许可证沿用已有文件。

[当前建模源文件与出图说明](../art/ophidia-01/README.md)。源码与固定检查页随仓库保存；Pages 打包只包含运行文件。

## 内容与扩容

| 文件 | 当前职责 |
| --- | --- |
| `game.js` | `copy` 保存三语界面文字；`story` 保存三语对白、选项与姿态；`selectOption()` 连接分支和结尾；`assetPaths` 登记图层 |
| `index.html` | 竖屏画面、对白、选项和设置的结构 |
| `style.css` | 9:16 布局、底部对白阴影、角色合成及环境微动 |
| `assets/` | 船舱背景和四个角色姿态，来自建模目录的预渲染导出 |

当前故事有三次选择。`selectOption()` 按选择次数连接片段，最后结合本次座位、路线与围巾选择组装回忆和结尾。扩写现有片段时同步 `zh`、`en`、`ja`；增加选择或姿态时，还需修改分支连接、资源预载与相应检查，不能只向文字数组追加一项。

航程进度只保存在当前页面内存，刷新后重新开始。持久化键 `umwelt-ophidia-language` 只保存语言，首次可继承 `isopoda-ui-language-v1`。若以后增加进度存档，应单独设计兼容规则；现有版本没有续玩存档契约。

视觉修改从当前 Blender 工程继续，原稿还原、图层导出与分卷归档只在[建模说明](../art/ophidia-01/README.md)维护。角色原型、资料依据与文学道具的边界见[物种与叙事依据](../art/ophidia-01/reference/species.md)。

## 检查

从仓库根目录运行；需已安装 Playwright、Chrome 和 WebKit，截图由 `QA_OUTPUT` 指定仓库外目录（默认系统临时目录）。

```sh
BASE_URL=http://127.0.0.1:8788 node ophidia/tests/browser/check-local.cjs
BASE_URL=http://127.0.0.1:8788 node ophidia/tests/browser/check-model-review.cjs
BASE_URL=http://127.0.0.1:8788 node ophidia/tests/browser/check-pixel-comparison.cjs
```

游戏检查覆盖两种浏览器和四种宽高、三语切换、一次完整航程的三次选择、四个姿态、设置与返回、页面不滚动和减少动态效果的实时切换。它没有遍历所有分支组合；修改分支时还需逐条核对受影响路线与结尾。模型与像素检查按视觉改动范围运行。

这些专项脚本不在 `check-all.mjs` 中，也未接入现有 CI 专项矩阵。Pages 的成品关卡会检查本游戏入口，但不能替代完整剧情和原稿检查。共用方法见[测试导航](../../tests/README.md)与[验证和发布](../../docs/deployment.md)。

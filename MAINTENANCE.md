# UMWELT 维护总入口

本页用于开发、内容整理和仓库维护。对外展示使用根目录的三语 README，保留项目介绍、游戏主页、来源声明和许可说明；维护链接从本页进入。

## 项目结构

UMWELT 由一个主页和各自独立的小游戏目录组成。主页负责汇集入口，各游戏的玩法、内容、素材与专属文档在自己的目录内维护；跨游戏使用的功能留在共用位置。

| 位置 | 职责与入口 |
| --- | --- |
| 根目录 HTML/CSS/JS | 主页、桌面入口与共享窗口 |
| `rooftop/` | 花农时代：[游戏文档](rooftop/README.md)，详细指南在 `rooftop/docs/`；车库和房间属于同一游戏 |
| `ophidia/` | 体温调节：[玩法、对白与检查](ophidia/README.md) |
| `isopoda/` | 等足目与两个实验室：[开发地图](isopoda/README.md)、[文档导航](isopoda/docs/README.md) |
| `tick/` | 蜱虫：[交互、视觉与检查](tick/README.md) |
| `assets/`、`vendor/` | 共享音频、字体、依赖及其来源与许可 |
| `docs/` | [共用文档](docs/README.md)：音频、发布、制作资料索引与维护记录 |
| `docs/art/` | [可编辑原稿与制作工具](docs/art/README.md)，按游戏和制作批次索引 |
| `tests/`、`.github/`、`mac/` | [测试](tests/README.md)、持续检查与发布、[桌面包装](mac/README.md) |

现有 Blender、Pixelorama 原稿及相关工具继续保存在 `docs/art/`，由对应游戏文档指向。它们包含相互引用、分卷清单与导出路径，整理文字导航时保留这些制作关系。

## 继续工作

| 工作 | 入口 |
| --- | --- |
| 修改画面或模型 | [原稿索引](docs/art/README.md)、[花农时代制作管线](rooftop/docs/pixel-style.md)、[体温调节建模说明](docs/art/ophidia-01/README.md) |
| 深化对白与资料 | [花农时代手帐](rooftop/docs/notebook.md)、[体温调节内容维护](ophidia/README.md#内容与扩容)、[等足目内容地图](isopoda/docs/content-map.md) |
| 扩充物件或场景 | [花农时代承放关系](rooftop/docs/placement.md)、[等足目扩展流程](isopoda/docs/expansion-guide.md)、[体温调节内容维护](ophidia/README.md#内容与扩容) |
| 修改共享功能或发布 | [共享音频](docs/audio.md)、[测试导航](tests/README.md)、[验证与发布](docs/deployment.md) |

## 本地开始

在仓库根目录运行，网页无需打包：

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

打开[本地主页](http://127.0.0.1:8765/)，再从主页进入各游戏。花农时代使用[固定视觉测试页](http://127.0.0.1:8765/tests/browser/rooftop.html)；体温调节的专用启动器默认使用 8788，页面与检查命令见其游戏文档。

结构检查从仓库根目录运行（CI 使用 Node.js 22）：

```sh
node isopoda/tools/check-all.mjs
```

## 文档与内容归属

- `README.md`、`README_EN.md`、`README_JA.md` 面向访问者。游戏列表只列各游戏主页，顺序与主页图标一致；等足目另外保留两个实验室入口。
- 各游戏的 `README.md` 是自己的维护入口。专属指南随内容增加放入该游戏的 `docs/`；较小的游戏先在 README 中维护，无需预建空目录。
- 根 `docs/` 维护跨游戏规则和制作资料索引。游戏专属规则在所属游戏维护，共享规则只保留一份，其余位置链接到它。
- `docs/reference/`、`isopoda/docs/reference/` 保存阶段记录。历史数量、路径和检查结果只对应记录当时；继续开发使用现行指南。
- 新增文档或移动位置时，同步入口、相对链接、页内锚点和发布排除规则。旧路径已被来源记录或源码引用时，可保留简短转向页，正文只在新位置更新。
- 扩充内容时同步现有语言、来源和稳定 ID；区分资料事实、创作文本与游戏参数。提案注明尚未实施，完成事项及时移出待办。

游戏会读取的 `isopoda/credits*.md`、科学来源数据、字体许可与可编辑原稿各有用途，整理时按实际引用判断。后续加入新游戏时，在自己的目录保存页面、内容和文档，再接入主页及公开 README，并补充对应发布检查。

## 模块与验证归属

| 模块 | 主要入口 | 验证入口与范围 |
| --- | --- | --- |
| 桌面主页与共享窗口 | 根 HTML/CSS、desktop.mjs、desktop-icons.mjs、forest.js | system-regression：主页语言、系统菜单、午夜时钟、声音设置、跨游戏语言继承 |
| 共享音频 | assets/audio/、isopoda/audio-ui.mjs | Node 音频测试；system-regression 的 audio-controls |
| TICK.SYS | tick/ | system-regression 的 tick-motion：失败重试、落点、毛发/血管动态、结束和退出 |
| 等足目与实验室 | isopoda/ | 完整结构检查；morphology-layout 的 Chromium/WebKit 场景矩阵 |
| 花农时代 | rooftop/ | 完整结构检查；rooftop-regression 的布置、布局和房间矩阵；[本地视觉检查](rooftop/docs/scene-review.md)单独运行 |
| 体温调节 | ophidia/ | Pages 成品入口检查；[剧情、模型与像素检查](ophidia/README.md#检查)单独运行，尚未接入专项 CI |
| 原生桌面包装 | mac/、mac/windows/ | 独立原生 QA 和 Windows 打包工作流；浏览器回归不能替代原生窗口测试 |
| 发布工具 | .github/scripts/ | 发布文件边界、资源版本、字体子集测试；Pages 部署 |

`node isopoda/tools/check-all.mjs` 名称沿用历史，但已是全仓库结构入口：自动发现所有 `tests/*.test.mjs`，并检查公共结构和共享运行资源。它不覆盖所有游戏分支、浏览器画面或原稿，也不扫描全部文档链接。无需新增生产依赖或构建系统。

## 浏览器测试前置条件

观察状态与收藏不是同一件事。地下水要求完成陆地观察，深海要求完成沙滩观察，饲养箱要求完成一次观察且有合格标本。测试不得仅添加收藏就认定入口应开启，也不能点击 disabled 按钮后假定已进入观察。

`tests/support/observation-fixtures.cjs` 只给需要已解锁环境的测试准备既有完成记录；`entry-gates.cjs` 独立从空存档检查锁定，并实际完成陆地和沙滩观察验证解锁与刷新。两者均不注入生产代码。

检查抽取数量时区分普通群体与稀有访客，并保留既定普通群体数量约束。指针测试应先让画布进入可见视口，再根据当时的镜头与可见像素计算真实屏幕坐标；WebKit 鼠标坐标不能落在视口之外。

截图写入 `QA_OUTPUT` 指定的仓库外目录。CI 按浏览器拆分任务，单一浏览器脚本不应再次隐式启动两个引擎。

## 零前端变化与发布

仅整理文档时，按[零前端变化步骤](docs/deployment.md#文档整理的零前端变化验证)比较基线与工作树的发布文件清单和字节，并运行结构检查与文档链接检查。涉及程序或工具的维护还需按改动范围运行相应测试。

Pages 从最终发布目录运行 Chromium / WebKit 检查，通过后上传并部署。流程、版本标记与检查范围集中维护在[验证与发布](docs/deployment.md)，不在各游戏文档重复记录。

花农时代公开南北阳台与房间的四档宽度检查不依赖 `COMPARE_URL`；该变量仅额外开启基线像素比对。声音面板、共享 UI 和 locales 修改会触发系统回归。浏览器矩阵与工具版本以 `.github/workflows/` 为准。

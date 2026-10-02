# 全项目维护入口

维护时先固定主分支基线，区分运行文件与开发材料。零前端变化整理不得修改画面、文案、玩法、随机抽取规则、旧存档或观察解锁条件。根 README 的新游戏介绍独立处理。

## 模块与验证归属

| 模块 | 主要入口 | 自动验证 |
| --- | --- | --- |
| 桌面主页与共享窗口 | 根 HTML/CSS、desktop.mjs、desktop-icons.mjs、forest.js | system-regression：主页语言、系统菜单、午夜时钟、声音设置、跨游戏语言继承 |
| 共享音频 | assets/audio/、isopoda/audio-ui.mjs | Node 音频测试；system-regression 的 audio-controls |
| TICK.SYS | tick/ | system-regression 的 tick-motion：失败重试、落点、毛发/血管动态、结束和退出 |
| 等足目与实验室 | isopoda/ | 完整结构检查；morphology-layout 的 Chromium/WebKit 场景矩阵 |
| 花农时代 | rooftop/ | 完整结构检查；rooftop-regression 的布置、布局和房间矩阵 |
| 原生桌面包装 | mac/、mac/windows/ | 独立原生 QA 和 Windows 打包工作流；浏览器回归不能替代原生窗口测试 |
| 发布工具 | .github/scripts/ | 发布文件边界、资源版本、字体子集测试；Pages 部署 |

`node isopoda/tools/check-all.mjs` 名称沿用历史，但已是全仓库结构入口：自动发现所有 `tests/*.test.mjs`，并检查各游戏入口和共享运行资源。无需新增生产依赖或构建系统。

## 浏览器测试前置条件

观察状态与收藏不是同一件事。地下水要求完成陆地观察，深海要求完成沙滩观察，饲养箱要求完成一次观察且有合格标本。测试不得仅添加收藏就认定入口应开启，也不能点击 disabled 按钮后假定已进入观察。

`tests/support/observation-fixtures.cjs` 只给需要已解锁环境的测试准备既有完成记录；`entry-gates.cjs` 独立从空存档检查锁定，并实际完成陆地和沙滩观察验证解锁与刷新。两者均不注入生产代码。

检查抽取数量时区分普通群体与稀有访客，并保留既定普通群体数量约束。指针测试应先让画布进入可见视口，再根据当时的镜头与可见像素计算真实屏幕坐标；WebKit 鼠标坐标不能落在视口之外。

截图写入 `QA_OUTPUT` 指定的仓库外目录。CI 按浏览器拆分任务，单一浏览器脚本不应再次隐式启动两个引擎。

## 零前端变化证据

仅修改开发工具、工作流、文档和测试时，用 `prepare-site.mjs` 分别准备基线与工作树发布目录，比较文件清单和每个文件字节。相等表示部署输入未变；正常 SHA 版本标记仍随提交变化。开发材料中的 Markdown 与运行时 Credits、来源数据和字体许可必须区分。

更多入口：[测试说明](../tests/README.md)、[部署约定](../isopoda/docs/deployment.md)、[花农时代维护](rooftop-maintenance.md)。

## 发布前浏览器关卡

Pages 在 prepare-site、字体子集和 SHA 标记完成后，从最终 `_site` 启动服务。`published-artifact.cjs` 用 Chromium/WebKit 在桌面与手机宽度检查九个入口、实际页面控件、资源与运行错误，以及页面资源的提交版本。关卡失败则不上传和部署成品。

花农时代公开南北阳台与房间的四档宽度检查不再依赖 COMPARE_URL；该变量仅额外开启基线像素比对。声音面板、共享 UI 和 locales 修改会触发系统回归。

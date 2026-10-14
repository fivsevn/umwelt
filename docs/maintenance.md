# 全项目维护入口

维护时先固定当前提交与工作区状态，区分运行文件与开发材料。文档导航见[总入口](README.md)，静态发布规则见[验证与发布](deployment.md)。纯文档整理不改变画面、游戏文案、玩法、随机抽取规则、旧存档或观察解锁条件。

## 模块与验证归属

| 模块 | 主要入口 | 验证入口与范围 |
| --- | --- | --- |
| 桌面主页与共享窗口 | 根 HTML/CSS、desktop.mjs、desktop-icons.mjs、forest.js | system-regression：主页语言、系统菜单、午夜时钟、声音设置、跨游戏语言继承 |
| 共享音频 | assets/audio/、isopoda/audio-ui.mjs | Node 音频测试；system-regression 的 audio-controls |
| TICK.SYS | tick/ | system-regression 的 tick-motion：失败重试、落点、毛发/血管动态、结束和退出 |
| 等足目与实验室 | isopoda/ | 完整结构检查；morphology-layout 的 Chromium/WebKit 场景矩阵 |
| 花农时代 | rooftop/ | 完整结构检查；rooftop-regression 的布置、布局和房间矩阵；[本地视觉检查](rooftop-scene-review.md)单独运行 |
| 体温调节 | ophidia/ | Pages 成品入口检查；[剧情、模型与像素检查](../ophidia/README.md#检查)单独运行，尚未接入专项 CI |
| 原生桌面包装 | mac/、mac/windows/ | 独立原生 QA 和 Windows 打包工作流；浏览器回归不能替代原生窗口测试 |
| 发布工具 | .github/scripts/ | 发布文件边界、资源版本、字体子集测试；Pages 部署 |

`node isopoda/tools/check-all.mjs` 名称沿用历史，但已是全仓库结构入口：自动发现所有 `tests/*.test.mjs`，并检查公共结构和共享运行资源。它不覆盖所有游戏分支、浏览器画面或原稿，也不扫描全部文档链接。无需新增生产依赖或构建系统。

## 浏览器测试前置条件

观察状态与收藏不是同一件事。地下水要求完成陆地观察，深海要求完成沙滩观察，饲养箱要求完成一次观察且有合格标本。测试不得仅添加收藏就认定入口应开启，也不能点击 disabled 按钮后假定已进入观察。

`tests/support/observation-fixtures.cjs` 只给需要已解锁环境的测试准备既有完成记录；`entry-gates.cjs` 独立从空存档检查锁定，并实际完成陆地和沙滩观察验证解锁与刷新。两者均不注入生产代码。

检查抽取数量时区分普通群体与稀有访客，并保留既定普通群体数量约束。指针测试应先让画布进入可见视口，再根据当时的镜头与可见像素计算真实屏幕坐标；WebKit 鼠标坐标不能落在视口之外。

截图写入 `QA_OUTPUT` 指定的仓库外目录。CI 按浏览器拆分任务，单一浏览器脚本不应再次隐式启动两个引擎。

## 零前端变化与发布

仅整理文档时，按[零前端变化步骤](deployment.md#文档整理的零前端变化验证)比较基线与工作树的发布文件清单和字节，并运行结构检查与文档链接检查。涉及程序或工具的维护还需按改动范围运行相应测试。

Pages 从最终发布目录运行 Chromium / WebKit 检查，通过后上传并部署。流程、版本标记与检查范围集中维护在[验证与发布](deployment.md)，不在各游戏文档重复记录。

花农时代公开南北阳台与房间的四档宽度检查不依赖 `COMPARE_URL`；该变量仅额外开启基线像素比对。声音面板、共享 UI 和 locales 修改会触发系统回归。浏览器矩阵与工具版本以 `.github/workflows/` 为准。

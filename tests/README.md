# 全项目测试

[维护总入口](../MAINTENANCE.md) · [验证与发布](../docs/deployment.md)

根 `tests/` 保留主页、共享音频、跨游戏回归和发布检查。游戏专属测试、样本与辅助放入各自的 `tests/`。

## 按范围进入

| 范围 | 入口 |
| --- | --- |
| 三个信号 | [测试说明](../tick/tests/README.md) |
| 等足目赋格与实验室 | [测试说明](../isopoda/tests/README.md) |
| 花农时代 | [测试说明](../rooftop/tests/README.md) |
| 体温调节 | [测试说明](../ophidia/tests/README.md) |
| 原生桌面 | [桌面包装与 QA](../mac/README.md) |
| 网页发布 | [成品检查](../docs/deployment.md#成品检查与发布状态) |

## 结构检查

从仓库根目录运行（CI 使用 Node.js 22）：

```sh
node tools/check-all.mjs
```

这个入口发现根目录与所有登记项目 `tests/` 下的 `*.test.mjs`，再运行现有语言、物种、环境、叙事、实验室和公共页面验证。它不启动浏览器，也不代替文档链接、原稿或原生桌面检查。

只检查共用模块时运行 `node --test tests/*.test.mjs`；各游戏的命令见上表。浏览器脚本保持 `.cjs` 或专用 `.mjs` 名称，不混入默认 Node 测试。

## 共用浏览器检查

- `browser/homepage.cjs`、`homepage-language.cjs`：主页、语言与跨游戏继承。
- `browser/audio-controls.cjs`：共享声音设置。
- `browser/game-titles.cjs`：三语桌面文件名与可读标题、各游戏标签页及游戏内语言切换。
- `browser/published-artifact.cjs`：完成字体子集与资源版本标记后的发布目录。

浏览器检查需要本地服务、Playwright 和对应浏览器。通常用 `BASE_URL` 选择服务、`BROWSER` 选择引擎、`QA_OUTPUT` 选择仓库外输出目录。CI 的浏览器版本与矩阵以 `.github/workflows/` 为准；测试使用独立浏览器上下文。

## 专属测试归属

等足目的场景像素、日期与收藏测试位于 `isopoda/tests/scene-and-dates.test.mjs`；公开流程与基线对照位于 `isopoda/tests/browser/public-regression.cjs`，命令与覆盖范围见[等足目测试](../isopoda/tests/README.md#公开流程与基线对照)。

三个信号完整原生流程位于 `tick/tests/native/gameplay.cjs`，等足目离线语言位于 `isopoda/tests/native/offline-languages.cjs`。桌面包装的跨窗口、安装、卸载与更新检查继续由 `mac/` 和根共用测试维护。

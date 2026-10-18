# Gtuber 检查

[项目说明](../README.md) · [原稿](../art/icon/README.md)

仓库根目录运行 `node tools/check-all.mjs`，现有公共登记检查覆盖本项目名称、目录、README 与入口；此项已接入 CI。

启动本地静态服务后，查看 [双图标预览](../../tests/browser/media-icons.html) 和 [占位页](../index.html)。核对 32／48／128 px 显示、透明边缘、三语名称，以及 320 px 窄屏。

原稿核对：`python3 tools/pixel-icons/author.py gtb --check`。需要本地 Pixelorama，不接入 CI。

跨游戏语言核对：`BASE_URL=http://127.0.0.1:8765 node tests/browser/game-titles.cjs`。需要 Playwright 和对应浏览器。成品入口已加入 `tests/browser/published-artifact.cjs`，Pages 工作流会执行。

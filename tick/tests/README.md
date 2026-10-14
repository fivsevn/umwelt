# 蜱虫测试

[游戏文档](../README.md) · [全项目测试](../../tests/README.md)

本地服务启动后，从仓库根目录运行：

```sh
BASE_URL=http://127.0.0.1:8765 node tick/tests/browser/tick-motion.cjs
BROWSER=webkit BASE_URL=http://127.0.0.1:8765 node tick/tests/browser/tick-motion.cjs
```

需要 Playwright 与对应浏览器。`QA_OUTPUT` 指定仓库外截图目录。脚本检查搜索、落点、失败重试、毛发／血管动态、结束及退出，包含减少动态效果的切换；由 `system-regression.yml` 在 Chromium 和 WebKit 执行。

本游戏目前没有独立的 Node 测试文件。共享结构检查统一运行 `node tools/check-all.mjs`。

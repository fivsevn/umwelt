# Three Signals / 三个信号

围绕蜱虫感知与行动展开的试验性互动，使用独立的 HTML、CSS 和 JavaScript。

[维护总入口](../MAINTENANCE.md) · [共用规则](../docs/structure.md) · [文档导航](docs/README.md) · [测试说明](tests/README.md)

## 名称与标识

| 项目 | 名称 |
| --- | --- |
| 中文 | 三个信号 |
| English | Three Signals |
| 日本語 | 三つの信号 |
| 桌面文件名 | `TICK.SYS` |
| 仓库目录 | `tick/` |

遵循[游戏名称规则](../docs/naming.md)。目录标识与程序文件名固定，可读标题随语言切换。

## 游戏入口

- [三个信号](https://umwelt.fivsevn.com/tick/)

## 本地运行

从仓库根目录运行：

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

打开 [http://127.0.0.1:8765/tick/](http://127.0.0.1:8765/tick/)。

## 目录与文档

| 位置 | 内容 |
| --- | --- |
| `index.html`、`game.js`、`style.css`、`sprite.mjs` | 游戏页面、感知与移动、视觉绘制 |
| `docs/` | [交互流程、视觉参考与维护约定](docs/README.md) |
| `tests/` | [网页与原生桌面回归](tests/README.md) |

## 内容维护

玩法依次经过寻找热源、落下、穿过毛发与血管、结束和返回主页。界面沿用主页的中英日语言设置。减少动态效果时，毛发摆动和血管脉动仍保留；具体规则与资料出处集中在交互指南。

## 检查

运行 `node tools/check-all.mjs` 检查全项目结构；本地服务启动后运行 `node tick/tests/browser/tick-motion.cjs` 检查实际互动。脚本的浏览器选择、覆盖范围和 CI 入口见[测试说明](tests/README.md)。
